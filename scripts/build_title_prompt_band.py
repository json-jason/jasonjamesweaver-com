#!/usr/bin/env python3
"""Bake the title screen's bottom prompt-and-credit band as a raster overlay.

The prompt used to be DOM text (Arial Black + text-shadow + a CSS colour
flash). Vector type sitting on pixel art is always going to be anti-aliased,
and because it was sized by Tailwind breakpoints rather than as a fraction of
the artwork it ballooned on small viewports and collided with the hero's boots
and the grass ridge.

Instead we bake the type into a raster at the artwork's own native width
(1448px, the width of public/images/nes/title-screen.webp). Composited into
the 4:3 frame as one more stacked `pixel-art` <img>, it scales by exactly the
same factor as the scene frames, so the glyphs stay on the artwork's pixel
grid at every viewport instead of resampling independently of it.

The font is hand-rolled below: a dict of variable-width bitmaps drawn at an
integer scale, so every glyph pixel is a clean square block. No webfont, no
system font, no ImageFont.truetype - zero external assets.

Outputs (1448 x BAND_H, RGBA):
  public/images/nes/title-scene/prompt-band/prompt-band.png   (master)
  public/images/nes/title-scene/prompt-band/prompt-band.webp  (shipped)

The band's top edge is not a straight cut: it is an ordered alpha dither (see
DITHER_ROWS) that stipples the black up into the grass, so the WebP has to keep
per-pixel alpha intact as well as the type.

The WebP is written *lossless* rather than lossy-80 like the photographic
scene frames: this is a two-colour image of hairline white-on-black type, and
lossy WebP rings visibly around every stroke. `quality=80` is still passed —
under lossless it selects the same spatial-compression effort — and lossless
happens to be the smaller file here anyway.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/nes/title-screen.webp"
OUT = ROOT / "public/images/nes/title-scene/prompt-band"

# Master art is 1448x1086 (exactly 4:3). The band spans the full width and the
# bottom ~13% of the composition.
#
# The height is not a taste call, it is measured off the artwork. The cliff's
# grass is drawn as an overhang: individual blades fringe down over the dirt
# face, and the deepest of them (sampled across every column of the cliff,
# x=300..1199, on the master and on the ambient / gold-sweep / sword-raise
# frames alike) bottom out at field row 948, with the 90th percentile at 940.
# A band starting at row 902 - the previous 184px - sliced straight through
# that fringe and amputated an authored silhouette. Starting at row 940 puts
# the band's top at the fringe's own 90th percentile and lets the dither zone
# below it (rows 940-951) carry the last, deepest blades, so the whole overhang
# survives and reads against the black.
FIELD_W = 1448
FIELD_H = 1086
GRASS_FRINGE_BOTTOM = 948  # deepest grass blade of the cliff overhang

INK = (255, 255, 255, 255)
GROUND = (0, 0, 0, 255)

# The prompt blinks, so it is baked twice: lit and dim. Only the prompt line
# changes between the two variants — the credit, the ground and the dithered
# top edge are identical, so the band never flickers as a whole, just the
# words that are asking to be pressed. The dim ink is the old CSS blink's
# trough (#d7dbea at brightness 0.72) carried over as a flat colour, so the
# cadence reads the same as it did before the band was baked.
PROMPT_INK_DIM = (155, 158, 168, 255)

# Vertical rhythm inside the band (sums to BAND_H). The gap is tight on purpose:
# credit and prompt should read as one block of type sitting on one ground, not
# as two unrelated lines.
#
# PAD_TOP is measured from the band's top edge, so the dither eats the first
# DITHER_H of it and only PAD_TOP - DITHER_H is clean black above the credit's
# cap line. At PAD_TOP 16 that left just 4px of clear ground under the stipple
# while 36px of air pooled beneath the prompt - a 9:1 imbalance that put the
# credit's caps four field pixels from live grass pixels, so the dither read as
# texture behind the type instead of as an edge treatment. The type block is
# fixed at 94px (28 credit + 24 gap + 42 prompt) and the dither at 12px, which
# leaves 40px of clean ground to split. It is split 22 above / 18 below rather
# than 20/20: the block is optically centred, and type set against a stippled
# upper edge needs slightly more air above it than below to look level.
# Where the type sits in the field. The grass fringe of the cliff bottoms out
# at field row 948 (measured across every column, see above), so the credit's
# cap line starts at 962: fourteen clear pixels below the deepest blade, with
# the halo's own reach taking up the slack. Below the fringe the cliff face is
# a large, dark, low-frequency brown - the one place in the composition that
# can carry type without fighting it.
CREDIT_TOP = 962
GAP = 20  # separation between the credit line and the prompt

# Credit line: small, hairline, the attribution slot.
CREDIT = "© 2026 JASON WEAVER · TECHNOLOGY LEADER"
CREDIT_SCALE = 4  # 7 cells tall -> 28px = 2.58% of FIELD_H
CREDIT_TRACKING = 2  # cells of air between glyphs; matters a lot at this size

# Prompt line: the thing you are meant to read first.
PROMPT = "PRESS START"
PROMPT_SCALE = 6  # 7 cells tall -> 42px = 3.87% of FIELD_H
PROMPT_TRACKING = 3

# --- Halo --------------------------------------------------------------------
# The type has no ground behind it, so it carries its own. The halo is the
# glyph mask grown outward by a fixed number of field pixels and filled with
# near-black: a shape that hugs the letters instead of boxing them. Because it
# is grown from the glyphs themselves it stays on the artwork's grid, and
# because it is only a few pixels deep the cliff's own texture still reads
# right up to the type. Grown wider for the prompt than the credit, in
# proportion to their scales, so both lines carry the same visual weight.
HALO_ALPHA = 0.86
CREDIT_HALO = 6
PROMPT_HALO = 8

# --- Top-edge dither ---------------------------------------------------------
# A hard horizontal rule across pixel art always reads as a crop. The era's own
# answer is an ordered dither: the black is stippled into the picture one
# checker step at a time so the art appears to fall into shadow. So the top of
# the band is punched out in the ALPHA channel only - each cell is either fully
# opaque or fully clear, never a partial value. No gradient, no blur, nothing
# that would resample off the artwork's grid.
#
# The cell is 4 field pixels, which is both the artwork's own apparent block
# size in the grass and the credit line's glyph scale, and 1448 / 4 = 362 cells
# exactly, so the pattern never lands on a half cell. Coverage ramps top-down
# 25% -> 50% -> 75% -> solid: the two named checker levels plus their
# complement, which buys a third step of shadow for free.
DITHER_CELL = 4
# Which cell columns (mod 4) stay opaque at each coverage level. The phases are
# deliberately staggered between rows so no column is opaque - or clear - all
# the way down, which is what would turn the stipple back into a comb.
DITHER_ROWS = (
    (0,),  # 25%
    (1, 3),  # 50%
    (0, 1, 2),  # 75%
)
DITHER_H = len(DITHER_ROWS) * DITHER_CELL  # 12px, i.e. field rows 940-951


# --- Hand-rolled bitmap font -------------------------------------------------
# Uppercase only. Each glyph is a list of rows of equal length; '#' is ink.
# Cells are 7 rows tall; widths vary (5 for letters/digits, 7 for ©, 3 for ·).
# ' ' is a bare advance with no bitmap.

_LETTERS = """
A .###. #...# #...# ##### #...# #...# #...#
B ####. #...# #...# ####. #...# #...# ####.
C .###. #...# #.... #.... #.... #...# .###.
D ####. #...# #...# #...# #...# #...# ####.
E ##### #.... #.... ####. #.... #.... #####
F ##### #.... #.... ####. #.... #.... #....
G .###. #...# #.... #.### #...# #...# .###.
H #...# #...# #...# ##### #...# #...# #...#
I ##### ..#.. ..#.. ..#.. ..#.. ..#.. #####
J ....# ....# ....# ....# #...# #...# .###.
K #...# #..#. #.#.. ##... #.#.. #..#. #...#
L #.... #.... #.... #.... #.... #.... #####
M #...# ##.## #.#.# #...# #...# #...# #...#
N #...# ##..# #.#.# #..## #...# #...# #...#
O .###. #...# #...# #...# #...# #...# .###.
P ####. #...# #...# ####. #.... #.... #....
Q .###. #...# #...# #...# #.#.# #..#. .##.#
R ####. #...# #...# ####. #.#.. #..#. #...#
S .###. #...# #.... .###. ....# #...# .###.
T ##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..
U #...# #...# #...# #...# #...# #...# .###.
V #...# #...# #...# #...# #...# .#.#. ..#..
W #...# #...# #...# #...# #.#.# ##.## #...#
X #...# #...# .#.#. ..#.. .#.#. #...# #...#
Y #...# #...# .#.#. ..#.. ..#.. ..#.. ..#..
Z ##### ....# ...#. ..#.. .#... #.... #####
0 .###. #...# #..## #.#.# ##..# #...# .###.
1 ..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.
2 .###. #...# ....# ...#. ..#.. .#... #####
3 ##### ...#. ..#.. ...#. ....# #...# .###.
4 ...#. ..##. .#.#. #..#. ##### ...#. ...#.
5 ##### #.... ####. ....# ....# #...# .###.
6 ..##. .#... #.... ####. #...# #...# .###.
7 ##### ....# ...#. ..#.. .#... .#... .#...
8 .###. #...# #...# .###. #...# #...# .###.
9 .###. #...# #...# .#### ....# ...#. .##..
"""

GLYPHS: dict[str, list[str]] = {
    line.split()[0]: line.split()[1:]
    for line in _LETTERS.strip().splitlines()
}

# Copyright mark: a 7-wide ring with a stubby 'c' inside. Narrower cells turn
# this into mush, so it gets its own width; the 'c' is kept two cells short of
# the ring so the counter stays open instead of reading as a nested box.
GLYPHS["©"] = [
    ".#####.",
    "#.....#",
    "#.##..#",
    "#.#...#",
    "#.##..#",
    "#.....#",
    ".#####.",
]

# Middle dot separator: one hairline pixel, matching the font's stroke weight.
GLYPHS["·"] = ["...", "...", "...", ".#.", "...", "...", "..."]

CELL_H = 7
SPACE_CELLS = 4  # word space, wider than the letter tracking


def cell_width(char: str) -> int:
    if char == " ":
        return SPACE_CELLS
    try:
        return len(GLYPHS[char][0])
    except KeyError as exc:  # pragma: no cover - guards typos in the copy
        raise SystemExit(f"No hand-rolled glyph for {char!r}") from exc


def text_cells(text: str, tracking: int) -> int:
    """Width of `text` in font cells, without a trailing tracking gap."""
    return sum(cell_width(c) + tracking for c in text) - tracking


def draw_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    x: int,
    y: int,
    scale: int,
    tracking: int,
    ink: tuple[int, int, int, int] | int = INK,
) -> None:
    """Blit `text` with its top-left at (x, y), one font cell per scale-square.

    `ink` is an RGBA tuple on a colour layer, or a single level when drawing
    into an "L" mask.
    """
    pen = x
    for char in text:
        rows = GLYPHS.get(char)
        if rows is not None:
            for ry, row in enumerate(rows):
                for rx, cell in enumerate(row):
                    if cell != "#":
                        continue
                    px = pen + rx * scale
                    py = y + ry * scale
                    draw.rectangle((px, py, px + scale - 1, py + scale - 1), fill=ink)
        pen += (cell_width(char) + tracking) * scale


def centered_x(text: str, scale: int, tracking: int) -> int:
    """Centre a line, snapped to its own scale so the glyph grid stays whole."""
    width = text_cells(text, tracking) * scale
    return round((FIELD_W - width) / 2 / scale) * scale


def dither_top_edge(band: Image.Image) -> None:
    """Clear whole 4px cells out of the band's top rows in an ordered pattern."""
    px = band.load()
    for row, opaque_phases in enumerate(DITHER_ROWS):
        coverage = len(opaque_phases) / 4
        assert 0 < coverage < 1, f"dither row {row} covers {coverage:.0%}"
        for y in range(row * DITHER_CELL, (row + 1) * DITHER_CELL):
            for x in range(FIELD_W):
                if (x // DITHER_CELL) % 4 not in opaque_phases:
                    px[x, y] = (0, 0, 0, 0)


def halo_line(
    layer: Image.Image,
    text: str,
    y: int,
    scale: int,
    tracking: int,
    grow: int,
    ink: tuple[int, int, int, int],
) -> None:
    """Draw one line as a grown dark halo with the glyphs set on top of it."""
    x = centered_x(text, scale, tracking)

    mask = Image.new("L", layer.size, 0)
    draw_text(ImageDraw.Draw(mask), text, x, y, scale, tracking, ink=255)
    # MaxFilter over a binary mask is a square dilation: every ink pixel paints
    # its (grow)-pixel neighbourhood, so the halo is itself made of whole
    # field pixels and never resamples off the grid.
    grown = mask.filter(ImageFilter.MaxFilter(grow * 2 + 1))

    halo = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    halo.putalpha(grown.point(lambda v: int(v * HALO_ALPHA)))
    layer.alpha_composite(halo)

    glyphs = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    draw_text(ImageDraw.Draw(glyphs), text, x, y, scale, tracking, ink=ink)
    layer.alpha_composite(glyphs)


def build_overlay(prompt_ink: tuple[int, int, int, int] = INK) -> Image.Image:
    """A full-field transparent layer carrying only the credit and the prompt."""
    layer = Image.new("RGBA", (FIELD_W, FIELD_H), (0, 0, 0, 0))

    credit_y = CREDIT_TOP
    prompt_y = credit_y + CELL_H * CREDIT_SCALE + GAP
    prompt_bottom = prompt_y + CELL_H * PROMPT_SCALE

    # The type lives on the cliff: below the grass fringe, clear of the frame.
    assert credit_y - CREDIT_HALO >= GRASS_FRINGE_BOTTOM, (
        f"credit halo reaches row {credit_y - CREDIT_HALO}, into grass at {GRASS_FRINGE_BOTTOM}"
    )
    assert prompt_bottom + PROMPT_HALO <= FIELD_H - 12, (
        f"prompt halo reaches row {prompt_bottom + PROMPT_HALO}, too close to the frame edge"
    )

    halo_line(layer, CREDIT, credit_y, CREDIT_SCALE, CREDIT_TRACKING, CREDIT_HALO, INK)
    halo_line(layer, PROMPT, prompt_y, PROMPT_SCALE, PROMPT_TRACKING, PROMPT_HALO, prompt_ink)
    return layer


def main() -> None:
    # The band is sized against the master art, so fail loudly if that ever
    # stops being 1448x1086 rather than shipping a mis-scaled overlay.
    with Image.open(SOURCE) as art:
        if art.size != (FIELD_W, FIELD_H):
            raise SystemExit(f"Expected master art at {FIELD_W}x{FIELD_H}, found {art.size}")

    OUT.mkdir(parents=True, exist_ok=True)
    for stem, prompt_ink in (("prompt-band", INK), ("prompt-band-dim", PROMPT_INK_DIM)):
        layer = build_overlay(prompt_ink)
        layer.save(OUT / f"{stem}.png", format="PNG", optimize=True)
        layer.save(OUT / f"{stem}.webp", format="WEBP", lossless=True, quality=80, method=6)
    print(
        f"Built {FIELD_W}x{FIELD_H} title type overlay (lit + dim): credit at field "
        f"row {CREDIT_TOP}, clear of the grass fringe at {GRASS_FRINGE_BOTTOM}, "
        f"no ground - the river below stays visible. In {OUT}"
    )


if __name__ == "__main__":
    main()
