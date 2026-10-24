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

from PIL import Image, ImageDraw

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
BAND_H = 146  # 13.44% of FIELD_H -> top edge at field row 940

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
PAD_TOP = 34  # 12px dither + 22px clean black above the credit's cap line
GAP = 24  # separation between the credit line and the prompt
PAD_BOTTOM = 18

# Credit line: small, hairline, the attribution slot.
CREDIT = "© 2026 JASON WEAVER · TECHNOLOGY LEADER"
CREDIT_SCALE = 4  # 7 cells tall -> 28px = 2.58% of FIELD_H
CREDIT_TRACKING = 2  # cells of air between glyphs; matters a lot at this size

# Prompt line: the thing you are meant to read first.
PROMPT = "PRESS START"
PROMPT_SCALE = 6  # 7 cells tall -> 42px = 3.87% of FIELD_H
PROMPT_TRACKING = 3

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
    ink: tuple[int, int, int, int] = INK,
) -> None:
    """Blit `text` with its top-left at (x, y), one font cell per scale-square."""
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


def build_band(prompt_ink: tuple[int, int, int, int] = INK) -> Image.Image:
    band = Image.new("RGBA", (FIELD_W, BAND_H), GROUND)
    draw = ImageDraw.Draw(band)

    credit_y = PAD_TOP
    prompt_y = credit_y + CELL_H * CREDIT_SCALE + GAP

    draw_text(draw, CREDIT, centered_x(CREDIT, CREDIT_SCALE, CREDIT_TRACKING), credit_y, CREDIT_SCALE, CREDIT_TRACKING)
    draw_text(
        draw,
        PROMPT,
        centered_x(PROMPT, PROMPT_SCALE, PROMPT_TRACKING),
        prompt_y,
        PROMPT_SCALE,
        PROMPT_TRACKING,
        ink=prompt_ink,
    )

    used = prompt_y + CELL_H * PROMPT_SCALE + PAD_BOTTOM
    assert used == BAND_H, f"band rhythm sums to {used}, not {BAND_H}"
    # The type must never sit on stippled ground, so it starts below the dither.
    assert PAD_TOP >= DITHER_H, f"credit at {PAD_TOP} lands inside the {DITHER_H}px dither"
    # ...and it must not merely clear the dither, it must breathe under it. The
    # clean black above the credit is optically centred against the air below
    # the prompt: never less than PAD_BOTTOM, never more than a few px more.
    clear_above = PAD_TOP - DITHER_H
    assert PAD_BOTTOM <= clear_above <= PAD_BOTTOM + 6, (
        f"top air {clear_above} vs bottom air {PAD_BOTTOM} is not optically centred"
    )

    dither_top_edge(band)
    return band


def main() -> None:
    # The band is sized against the master art, so fail loudly if that ever
    # stops being 1448x1086 rather than shipping a mis-scaled overlay.
    with Image.open(SOURCE) as art:
        if art.size != (FIELD_W, FIELD_H):
            raise SystemExit(f"Expected master art at {FIELD_W}x{FIELD_H}, found {art.size}")

    OUT.mkdir(parents=True, exist_ok=True)
    for stem, prompt_ink in (("prompt-band", INK), ("prompt-band-dim", PROMPT_INK_DIM)):
        band = build_band(prompt_ink)
        band.save(OUT / f"{stem}.png", format="PNG", optimize=True)
        band.save(OUT / f"{stem}.webp", format="WEBP", lossless=True, quality=80, method=6)
    print(
        f"Built {FIELD_W}x{BAND_H} prompt band (lit + dim) "
        f"({BAND_H / FIELD_H:.2%} of the 4:3 field), top edge at field row "
        f"{FIELD_H - BAND_H} dithered through row {FIELD_H - BAND_H + DITHER_H - 1}, "
        f"in {OUT}"
    )


if __name__ == "__main__":
    main()
