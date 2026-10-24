#!/usr/bin/env python3
"""Lift the clouds and the chimney plume off the village map so they can move.

Everything in the painting is fixed, so a cloud cannot be slid sideways: doing
it would drag a cloud-shaped hole across the sky. The fix is to separate the
sky from the things in front of it.

For each white shape we solve a matte - per pixel, how much of it is cloud and
how much is the sky showing through - then write two things: the shape as its
own RGBA sprite, and a repaired copy of the painting with that shape replaced
by sky. Stack the sprites back over the repaired painting and you have exactly
the original picture again, except the pieces can now be moved independently.

This works here because of two measured facts about the artwork:

  * Eleven of the twelve white shapes are 99.5-100% surrounded by open sky.
    Nothing is hidden behind them, so there is nothing to invent.
  * The sky is nearly a flat colour - (0,113,246) at the top easing to
    (1,131,253) lower down, with no left-to-right variation at all. Each row's
    fill is therefore just that row's own sky colour, and the repair is
    invisible.

Solving a matte rather than thresholding matters: a cloud's edge pixels are a
blend of white and sky. Cut them with a yes/no test and the blended rim stays
behind in the painting, so sliding the cloud away reveals a faint outline of
where it used to be.

The painting itself is never rewritten. Re-encoding it to bake in the repair
cost 84KB and put lossy artefacts over the whole picture - a second generation
of loss on an image that is already quality-80 - to change a few thousand sky
pixels. Instead the repair ships as one mostly-transparent overlay that covers
exactly where the shapes were. village.webp is still the original file.

Outputs:
  public/images/nes/village-scene/skyfill.webp  sky over every old shape
  public/images/nes/village-scene/cloud-*.webp  one sprite per cloud
  public/images/nes/village-scene/smoke-*.webp  the plume, as a loop
  app/data/village-sky.json                     placements and speeds
"""

from __future__ import annotations

import json
import math
from collections import Counter, deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/nes/village.webp"
SPRITE_OUT = ROOT / "public/images/nes/village-scene"
MANIFEST = ROOT / "app/data/village-sky.json"

FIELD_W = 1448
FIELD_H = 1086

# Only the sky half is searched. Below this the painting is hills, roofs and
# the square, where white pixels are highlights rather than cloud.
SKY_LIMIT = 520

# How far from its row's sky colour a pixel must be before it counts as fully
# cloud. Below this it is treated as a blend and gets a partial alpha, which
# is what keeps a rim from being left behind.
MATTE_FULL = 70.0

# Shapes smaller than this are speckle, not weather.
MIN_SHAPE_PX = 60

SMOKE_FRAMES = 10


def is_sky(r: int, g: int, b: int) -> bool:
    return b > 150 and b > r + 40 and g > r


def is_whiteish(r: int, g: int, b: int) -> bool:
    return r > 190 and g > 200 and b > 210 and abs(r - g) < 40


def row_sky_colours(px) -> list[tuple[int, int, int]]:
    """The sky colour of every row, taken as that row's most common sky pixel.

    The sky does not vary left to right, so one colour per row is exact rather
    than an approximation, and the mode ignores the clouds sitting in the row.
    """
    colours = []
    last = (0, 113, 246)
    for y in range(FIELD_H):
        counts = Counter(px[x, y] for x in range(FIELD_W) if is_sky(*px[x, y]))
        if counts:
            last = counts.most_common(1)[0][0]
        colours.append(last)
    return colours


# A cloud is not one solid blob: it throws off single sparkle pixels well
# clear of its body. Grouping has to reach far enough to collect them, or
# they are left behind as speckle floating in an empty sky once the cloud
# drifts off. The mask is dilated by this much before grouping, so anything
# within reach of a cloud is treated as part of it.
GROUP_REACH = 14

# How far past a cloud's body to sweep for its stray sparkle pixels. A cloud
# throws single pixels a surprising distance, and any that are missed stay
# behind as specks floating in an empty sky after the cloud drifts away.
SPARKLE_REACH = 46


def find_shapes(px) -> list[list[tuple[int, int]]]:
    """Group the white pixels of the sky into clouds, sparkle included.

    Dilating the mask first and grouping *that* is what pulls a cloud's
    outlying pixels in with its body: on the dilated mask they are joined,
    so they land in the same group, while the pixels actually returned are
    only the real ones.
    """
    mask = Image.new("L", (FIELD_W, SKY_LIMIT), 0)
    mp = mask.load()
    for y in range(SKY_LIMIT):
        for x in range(FIELD_W):
            if is_whiteish(*px[x, y]):
                mp[x, y] = 255
    joined = mask.filter(ImageFilter.MaxFilter(GROUP_REACH * 2 + 1)).load()

    seen = [[False] * SKY_LIMIT for _ in range(FIELD_W)]
    shapes = []
    for y in range(SKY_LIMIT):
        for x in range(FIELD_W):
            if seen[x][y] or not joined[x, y]:
                continue
            queue = deque([(x, y)])
            seen[x][y] = True
            group = []
            while queue:
                cx, cy = queue.popleft()
                if mp[cx, cy]:
                    group.append((cx, cy))
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < FIELD_W and 0 <= ny < SKY_LIMIT and not seen[nx][ny] and joined[nx, ny]:
                        seen[nx][ny] = True
                        queue.append((nx, ny))
            if len(group) >= MIN_SHAPE_PX:
                shapes.append(group)
    return shapes


def is_sky_or_cloud(r: int, g: int, b: int) -> bool:
    """True for sky, cloud, smoke and every blend of them; false for masonry.

    Measured off this artwork rather than guessed. Sky is (0,113,246) and
    cloud is near-white, so anything on the line between them has blue far
    ahead of red. The plume's grey runs (169,165,159) - near neutral, blue
    only ten behind red. The chimney it leaves is warm and darker:
    (158,141,108) is blue fifty behind, and its shadow line is near black.

    So: near-neutral-or-bluer, and bright. The first clause drops the warm
    stonework, the second drops its dark outline, which is neutral but almost
    black. Both are needed - with only the first, the chimney's own shadow
    would be cut into the smoke sprite and then painted out of the painting,
    leaving a bite missing from the chimney.
    """
    return (r - b) <= 14 and b >= 140


def matte(px, sky_rows, box, claimed: set) -> Image.Image:
    """Pull an RGBA sprite out of the painting for one shape.

    Alpha is how far the pixel has travelled from its row's sky colour, so a
    solid white body comes out opaque, a half-blended edge comes out half
    transparent, and a wisp two shades off the sky comes out faint but
    present. The colour is then un-mixed - the sky's contribution divided back
    out - so a 40%-opaque edge carries the cloud's own colour at 40%, not a
    muddy cloud-and-sky average that would darken against a new background.

    The box is assumed to hold nothing but sky and the shape, which is true
    of all eleven clouds; the chimney plume's box also holds masonry, and
    is_sky_or_cloud is what keeps the stonework out of the sprite.
    """
    x0, y0, x1, y1 = box
    sprite = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    sp = sprite.load()

    for y in range(y0, y1):
        sr, sg, sb = sky_rows[y]
        for x in range(x0, x1):
            if (x, y) in claimed:
                continue
            r, g, b = px[x, y]
            if not is_sky_or_cloud(r, g, b):
                continue
            dist = math.sqrt((r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2)
            alpha = min(1.0, dist / MATTE_FULL)
            if alpha <= 0.01:
                continue
            # p = a*c + (1-a)*sky  ->  c = (p - (1-a)*sky) / a
            c = tuple(
                max(0, min(255, round((p - (1 - alpha) * s) / alpha)))
                for p, s in ((r, sr), (g, sg), (b, sb))
            )
            sp[x - x0, y - y0] = (*c, round(alpha * 255))
            claimed.add((x, y))
    return sprite


def main() -> None:
    with Image.open(SOURCE) as art:
        if art.size != (FIELD_W, FIELD_H):
            raise SystemExit(f"Expected village art at {FIELD_W}x{FIELD_H}, found {art.size}")
        source = art.convert("RGB")

    px = source.load()
    sky_rows = row_sky_colours(px)
    shapes = find_shapes(px)
    if not shapes:
        raise SystemExit("found no white shapes in the sky - has the artwork changed?")

    # The plume is the one shape that is not floating: it touches the chimney,
    # so most of its edge is masonry rather than sky. Every other shape is a
    # cloud. Measuring this rather than hard-coding a box means the script
    # still finds the plume if the artwork is ever nudged.
    def sky_fraction(points):
        body = set(points)
        sky = other = 0
        for cx, cy in points:
            for dx, dy in ((-5, 0), (5, 0), (0, -5), (0, 5)):
                nx, ny = cx + dx, cy + dy
                if not (0 <= nx < FIELD_W and 0 <= ny < FIELD_H) or (nx, ny) in body:
                    continue
                if is_whiteish(*px[nx, ny]):
                    continue
                sky += 1 if is_sky(*px[nx, ny]) else 0
                other += 0 if is_sky(*px[nx, ny]) else 1
        return sky / max(1, sky + other)

    # Weather floats; paint does not. A shape ringed by sky is a cloud. The
    # plume is the one shape that is attached to the village, so it fails that
    # test - but so does a white highlight on a roof, and a 118px highlight on
    # the right-hand house used to win the "least sky around it" contest and
    # be animated as smoke. Size settles it: the plume is thousands of pixels,
    # the highlights are a hundred. Anything small and attached is part of a
    # building and is left alone.
    scored = [(sky_fraction(s), s) for s in shapes]
    clouds = [s for frac, s in scored if frac >= 0.90]
    attached = sorted((s for frac, s in scored if frac < 0.90), key=len, reverse=True)
    if not attached or len(attached[0]) < 500:
        raise SystemExit(
            "no shape looks like a chimney plume (nothing large is attached to the village); "
            "has the plume been removed from the artwork?"
        )
    plume = attached[0]
    plume_score = next(frac for frac, s in scored if s is plume)
    ignored = sum(len(s) for s in attached[1:])

    SPRITE_OUT.mkdir(parents=True, exist_ok=True)

    # One overlay carries every repair. Opaque sky exactly where a shape was,
    # fully transparent everywhere else, so it covers the holes and touches
    # nothing else in the painting.
    skyfill = Image.new("RGBA", (FIELD_W, FIELD_H), (0, 0, 0, 0))
    fill = skyfill.load()

    manifest = {"clouds": [], "smoke": None}
    claimed: set = set()

    # --- chimney plume --------------------------------------------------
    xs = [p[0] for p in plume]
    ys = [p[1] for p in plume]
    # Padded sideways and upward: the billow sways and climbs out of its own
    # painted outline, and anything it reaches has to be inside the sprite.
    pbox = (max(0, min(xs) - 10), max(0, min(ys) - 10), min(FIELD_W, max(xs) + 11), min(FIELD_H, max(ys) + 4))
    plume_sprite = matte(px, sky_rows, pbox, claimed)

    px0, py0, px1, py1 = pbox
    ppx = plume_sprite.load()
    for y in range(py0, py1):
        for x in range(px0, px1):
            # is_sky_or_cloud already keeps masonry out of the sprite; repeat
            # it here so the overlay cannot bite a notch out of the chimney
            # even if the matte ever grows looser.
            if ppx[x - px0, y - py0][3] > 0 and is_sky_or_cloud(*px[x, y]):
                fill[x, y] = (*sky_rows[y], 255)

    pw, ph = px1 - px0, py1 - py0
    base_rows = [[ppx[x, y] for x in range(pw)] for y in range(ph)]

    for i in range(SMOKE_FRAMES):
        phase = 2 * math.pi * i / SMOKE_FRAMES
        frame = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
        fp = frame.load()
        for y in range(ph):
            # Height above the chimney, 0 at the mouth and 1 at the top of the
            # plume. Everything below is scaled by it, so the smoke is pinned
            # where it leaves the chimney and freest where it dissolves.
            climb = 1.0 - (y / max(1, ph - 1))
            wave = math.sin(phase - climb * math.pi * 1.7)
            shift = round(wave * 3.0 * climb)
            # Billow: the plume thins and thickens as it rises, so the whole
            # column reads as moving even though no pixel travels far.
            fade = 1.0 + 0.30 * climb * math.sin(phase - climb * math.pi * 2.3)
            for x in range(pw):
                sx = x - shift
                if not (0 <= sx < pw):
                    continue
                r, g, b, a = base_rows[y][sx]
                if a == 0:
                    continue
                fp[x, y] = (r, g, b, max(0, min(255, round(a * fade))))
        frame.save(SPRITE_OUT / f"smoke-{i}.webp", format="WEBP", lossless=True, method=6)

    # --- clouds ---------------------------------------------------------
    # Sorted top-down so the drift speeds below read as a deliberate ladder
    # rather than an accident of flood-fill order.
    clouds.sort(key=lambda s: min(p[1] for p in s))
    for index, shape in enumerate(clouds):
        xs = [p[0] for p in shape]
        ys = [p[1] for p in shape]
        box = (max(0, min(xs) - SPARKLE_REACH), max(0, min(ys) - SPARKLE_REACH),
               min(FIELD_W, max(xs) + SPARKLE_REACH), min(FIELD_H, max(ys) + SPARKLE_REACH))
        sprite = matte(px, sky_rows, box, claimed)
        sprite.save(SPRITE_OUT / f"cloud-{index}.webp", format="WEBP", lossless=True, method=6)

        # Cover: wherever the sprite claims any part of a pixel, the overlay
        # puts opaque sky. Partial cover would leave a ghost - blending half
        # sky over a half-cloud pixel still leaves a quarter of the cloud.
        sx0, sy0, sx1, sy1 = box
        spx = sprite.load()
        for y in range(sy0, sy1):
            for x in range(sx0, sx1):
                if spx[x - sx0, y - sy0][3] > 0:
                    fill[x, y] = (*sky_rows[y], 255)

        # Higher clouds drift slower, which is what distance looks like.
        depth = sy0 / SKY_LIMIT
        seconds = round(150 + depth * 170)
        manifest["clouds"].append(
            {
                "name": f"cloud-{index}",
                "seconds": seconds,
                "box": {
                    "left": f"{sx0 / FIELD_W:.4%}",
                    "top": f"{sy0 / FIELD_H:.4%}",
                    "width": f"{(sx1 - sx0) / FIELD_W:.4%}",
                    "height": f"{(sy1 - sy0) / FIELD_H:.4%}",
                },
            }
        )

    manifest["smoke"] = {
        "name": "smoke",
        "frames": SMOKE_FRAMES,
        "frameMs": 190,
        "box": {
            "left": f"{px0 / FIELD_W:.4%}",
            "top": f"{py0 / FIELD_H:.4%}",
            "width": f"{pw / FIELD_W:.4%}",
            "height": f"{ph / FIELD_H:.4%}",
        },
    }

    skyfill.save(SPRITE_OUT / "skyfill.webp", format="WEBP", lossless=True, method=6)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")

    print(f"ignored {ignored} px of white paint attached to buildings")
    print(f"clouds: {len(clouds)} sprites, slowest {max(c['seconds'] for c in manifest['clouds'])}s")
    print(f"plume : {SMOKE_FRAMES} frames of {pw}x{ph} at ({px0},{py0}), {plume_score:.0%} of its edge was sky")
    covered = sum(1 for y in range(FIELD_H) for x in range(FIELD_W) if fill[x, y][3])
    kb = (SPRITE_OUT / "skyfill.webp").stat().st_size / 1024
    print(f"skyfill: {covered} px of sky over the old shapes, {kb:.1f} KB")
    print(f"wrote  {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
