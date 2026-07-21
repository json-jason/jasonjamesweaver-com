#!/usr/bin/env python3
"""Build complete title-scene frames for the PRESS START sword-raise sequence.

Each output is a self-contained 1448x1086 title image. Runtime swaps only whole
frames; no object is animated over the flattened source artwork.
"""

from __future__ import annotations

from pathlib import Path
from math import hypot

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/nes/title-screen.webp"
APEX_SOURCE = ROOT / "public/images/nes/title-scene/source/title-apex.png"
OUT = ROOT / "public/images/nes/title-scene/sword-raise"

BLACK = "#16131a"
BLUE_DARK = "#0b3d84"
BLUE = "#1764bd"
BLUE_LIGHT = "#3b9ce8"
SKIN = "#d67b3f"
SKIN_LIGHT = "#f3a15a"
LEATHER = "#74411f"
LEATHER_LIGHT = "#c3782a"
GOLD_DARK = "#9d5a08"
GOLD = "#f3b72e"
SILVER_DARK = "#71899a"
SILVER = "#e9f5ff"
WHITE = "#ffffff"
GLINT_BLUE = "#a9e8ff"

# The original lowered sword is restored before each authored raised pose. The
# old arm remains inside Jason's silhouette; only the deliberately added cape
# patch caused the detached-limb artifact and has been removed.
LOWER_SWORD_MASK = [(568, 858), (578, 866), (682, 770), (671, 748), (645, 748)]


def line(draw: ImageDraw.ImageDraw, points: list[tuple[int, int]], fill: str, width: int) -> None:
    """Hard-edged strokes retain the scene's visible pixel treatment."""
    draw.line(points, fill=fill, width=width, joint="curve")


def repair_lowered_pose(frame: Image.Image, source: Image.Image) -> None:
    """Restore the blade area with nearby scene texture, then reseat the cape."""
    draw = ImageDraw.Draw(frame)
    mask = Image.new("L", frame.size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.polygon(LOWER_SWORD_MASK, fill=255)

    # This neighboring strip is the same mountain/foreground band as the blade
    # area. Mirroring avoids leaving a flat painted patch behind the new pose.
    texture = source.crop((505, 735, 625, 880)).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    texture = texture.resize((120, 145), Image.Resampling.NEAREST)
    repair = frame.copy()
    repair.alpha_composite(texture, (565, 725))
    frame.paste(repair, mask=mask)

    # Do not invent a cape/arm shape here. Once the original lowered arm is
    # cleared, the new raised limb supplies the whole moving silhouette; any
    # extra purple patch reads as a detached arm against the sky.


def draw_sword(draw: ImageDraw.ImageDraw, handle: tuple[int, int], tip: tuple[int, int]) -> None:
    """Draw a large, readable, source-matched sword with a black pixel outline."""
    hx, hy = handle
    tx, ty = tip
    length = hypot(tx - hx, ty - hy)
    ux, uy = (tx - hx) / length, (ty - hy) / length
    nx, ny = -uy, ux

    def point(distance: float, width: float) -> tuple[int, int]:
        return (round(hx + ux * distance + nx * width), round(hy + uy * distance + ny * width))

    blade_base = 21
    outer = [point(14, -11), point(length - 20, -10), (tx, ty), point(length - 20, 10), point(14, 11)]
    inner = [point(20, -6), point(length - 22, -5), (tx, ty), point(length - 22, 5), point(20, 6)]
    draw.polygon(outer, fill=BLACK)
    draw.polygon(inner, fill=SILVER_DARK)
    draw.polygon([point(25, -4), point(length - 35, -3), point(length - 22, 0), point(25, 0)], fill=SILVER)
    line(draw, [point(32, 3), point(length - 40, 4)], fill="#a8c4d6", width=3)

    # Crossguard, grip, and pommel are deliberately oversized enough to read at
    # page scale rather than becoming another barely-visible pixel alteration.
    guard_left = point(12, -21)
    guard_right = point(12, 21)
    line(draw, [guard_left, guard_right], fill=BLACK, width=13)
    line(draw, [guard_left, guard_right], fill=GOLD_DARK, width=8)
    line(draw, [point(12, -15), point(12, 15)], fill=GOLD, width=3)
    line(draw, [point(-4, 0), point(-23, 0)], fill=BLACK, width=13)
    line(draw, [point(-4, 0), point(-21, 0)], fill=LEATHER, width=7)
    draw.ellipse((round(hx - ux * 31 - 9), round(hy - uy * 31 - 9), round(hx - ux * 31 + 9), round(hy - uy * 31 + 9)), fill=BLACK)
    draw.ellipse((round(hx - ux * 31 - 5), round(hy - uy * 31 - 5), round(hx - ux * 31 + 5), round(hy - uy * 31 + 5)), fill=GOLD)


def draw_raised_arm(draw: ImageDraw.ImageDraw, handle: tuple[int, int], tip: tuple[int, int]) -> None:
    """Paint a compact, visibly bent arm: sleeve → elbow → bracer → grip."""
    hx, hy = handle
    tx, ty = tip
    length = hypot(tx - hx, ty - hy)
    ux, uy = (tx - hx) / length, (ty - hy) / length
    # The grip sits behind the guard, slightly down the hilt from the blade base.
    grip = (round(hx - ux * 12), round(hy - uy * 12))

    # A raised right arm must read as two short segments, not one long tube.
    # Keep the shoulder anchored inside the existing blue sleeve, bend the elbow
    # outward, then turn the forearm back toward the hilt.
    sleeve_outer = [(648, 697), (665, 706), (660, 722), (644, 721), (615, 705), (613, 694), (624, 684), (639, 691)]
    sleeve_inner = [(647, 703), (657, 709), (653, 716), (644, 715), (622, 702), (621, 696), (627, 692), (639, 698)]
    draw.polygon(sleeve_outer, fill=BLACK)
    draw.polygon(sleeve_inner, fill=BLUE_DARK)
    draw.polygon([(645, 702), (654, 708), (646, 712), (625, 699), (630, 693), (639, 698)], fill=BLUE)
    line(draw, [(643, 703), (625, 696)], fill=BLUE_LIGHT, width=4)

    # The bracer pivots at the elbow. Its tapered silhouette distinguishes it
    # from the blue sleeve and creates an explicit bend before the hand.
    bracer_outer = [(615, 689), (627, 683), (grip[0] + 10, grip[1] - 7), (grip[0] + 10, grip[1] + 8), (grip[0] - 4, grip[1] + 14), (620, 707), (611, 701)]
    bracer_inner = [(619, 692), (626, 688), (grip[0] + 5, grip[1] - 3), (grip[0] + 5, grip[1] + 5), (grip[0] - 2, grip[1] + 9), (623, 703), (617, 699)]
    draw.polygon(bracer_outer, fill=BLACK)
    draw.polygon(bracer_inner, fill=LEATHER)
    draw.polygon([(621, 693), (626, 690), (grip[0] + 2, grip[1] - 1), (grip[0] - 1, grip[1] + 4), (624, 700), (620, 698)], fill=LEATHER_LIGHT)
    line(draw, [(618, 690), (628, 686)], fill=GOLD, width=3)


def draw_hand_on_hilt(draw: ImageDraw.ImageDraw, handle: tuple[int, int], tip: tuple[int, int]) -> None:
    """Place a closed hand over the full leather grip, below the crossguard."""
    hx, hy = handle
    tx, ty = tip
    length = hypot(tx - hx, ty - hy)
    ux, uy = (tx - hx) / length, (ty - hy) / length
    nx, ny = -uy, ux

    def point(distance: float, width: float) -> tuple[int, int]:
        return (round(hx + ux * distance + nx * width), round(hy + uy * distance + ny * width))

    # The blade leaves the hilt at +0. The leather grip and pommel run from
    # -4 to -31; enclosing that complete span makes the hold unambiguous.
    outer = [point(-3, -7), point(-3, 7), point(-33, 7), point(-37, 3), point(-37, -3), point(-31, -7)]
    inner = [point(-7, -4), point(-7, 4), point(-29, 4), point(-32, 2), point(-32, -2), point(-28, -4)]
    draw.polygon(outer, fill=BLACK)
    draw.polygon(inner, fill=SKIN)
    # Three short dark finger bands follow the hilt rather than floating beside it.
    for distance in (-13, -20, -27):
        line(draw, [point(distance, -3), point(distance, 3)], fill=LEATHER, width=1)
    draw.polygon([point(-9, -3), point(-9, 2), point(-19, 2), point(-19, -3)], fill=SKIN_LIGHT)


def draw_gleam(draw: ImageDraw.ImageDraw, tip: tuple[int, int], intensity: int) -> None:
    """Paint a clear four-point legend-style flash around the raised blade tip."""
    x, y = tip
    # The glint must read at page scale without becoming a competing icon or
    # touching the fixed title plaque.
    radius = 22 if intensity == 1 else 34
    outer = [(x, y - radius), (x + radius // 3, y - radius // 3), (x + radius, y), (x + radius // 3, y + radius // 3), (x, y + radius), (x - radius // 3, y + radius // 3), (x - radius, y), (x - radius // 3, y - radius // 3)]
    mid = [(x, y - radius + 10), (x + radius // 4, y - radius // 4), (x + radius - 10, y), (x + radius // 4, y + radius // 4), (x, y + radius - 10), (x - radius // 4, y + radius // 4), (x - radius + 10, y), (x - radius // 4, y - radius // 4)]
    draw.polygon(outer, fill=GOLD_DARK)


def draw_apex_gleam(draw: ImageDraw.ImageDraw, intensity: int) -> None:
    """Keep the glow attached to the generated blade tip and below the plaque."""
    # The generated blade tip is at (550, 469). The plaque leaves no room above
    # it, so the flare deliberately travels down the blade rather than upward.
    cx, cy = (555, 481)
    radius = 8 if intensity == 1 else 13
    outer = [(cx, cy - radius), (cx + 4, cy - 3), (cx + radius, cy), (cx + 4, cy + 3), (cx, cy + radius), (cx - 4, cy + 3), (cx - radius, cy), (cx - 4, cy - 3)]
    draw.polygon(outer, fill=GOLD)
    draw.polygon([(cx, cy - radius // 2), (cx + radius // 2, cy), (cx, cy + radius // 2), (cx - radius // 2, cy)], fill=GLINT_BLUE)
    draw.rectangle((cx - 3, cy - 3, cx + 3, cy + 3), fill=WHITE)
    line(draw, [(550, 469), (cx, cy)], fill=WHITE, width=3)


def frame_for_pose(source: Image.Image, handle: tuple[int, int], tip: tuple[int, int], gleam: int = 0) -> Image.Image:
    frame = source.copy()
    repair_lowered_pose(frame, source)
    draw = ImageDraw.Draw(frame)
    draw_raised_arm(draw, handle, tip)
    draw_sword(draw, handle, tip)
    draw_hand_on_hilt(draw, handle, tip)
    if gleam:
        draw_gleam(draw, tip, gleam)
    return frame


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")
    apex = Image.open(APEX_SOURCE).convert("RGBA")
    expected_size = (1448, 1086)
    if source.size != expected_size or apex.size != expected_size:
        raise ValueError(f"Expected {expected_size} source and apex frames, got {source.size} and {apex.size}")

    # Only the first, near-ready lift is retained from the authored source
    # sequence. The supplied inpainted apex replaces every bad high-arm frame.
    # This yields a quick, readable raise without showing the rejected pose.
    source.save(OUT / "sword-raise-0.webp", format="WEBP", lossless=True, method=6, quality=100)
    frame_for_pose(source, (641, 739), (590, 665)).save(
        OUT / "sword-raise-1.webp", format="WEBP", lossless=True, method=6, quality=100
    )
    apex.save(OUT / "sword-raise-2.webp", format="WEBP", lossless=True, method=6, quality=100)
    apex.save(OUT / "sword-raise-3.webp", format="WEBP", lossless=True, method=6, quality=100)
    for index, intensity in ((4, 1), (5, 2)):
        gleam_frame = apex.copy()
        draw_apex_gleam(ImageDraw.Draw(gleam_frame), intensity)
        gleam_frame.save(OUT / f"sword-raise-{index}.webp", format="WEBP", lossless=True, method=6, quality=100)
    print(f"Built 6 complete title frames in {OUT}")


if __name__ == "__main__":
    main()
