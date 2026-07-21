#!/usr/bin/env python3
"""Author complete replacement frames for the title scene.

Every exported PNG is a full 1440x1080 scene. The browser will never place
motion on top of a still title image: cloud and hero pixel changes are painted
directly into each independent frame. The original castle flag remains intact
until true source layers or a faithful hand-painted flag sequence are available.
"""

from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/images/nes/title-screen.webp"
OUT = ROOT / "public/images/nes/title-scene/frames"

# The castle flag is deliberately preserved pixel-for-pixel from the source.
# A convincing flutter needs a real flag layer or a hand-painted frame set; it
# is safer to leave the master silhouette still than invent a generic pennant.
GLINT = "#f8fcff"
GLINT_BLUE = "#b5e7ff"


def sword_glint(frame: Image.Image, phase: int) -> None:
    draw = ImageDraw.Draw(frame)
    if phase == 1:
        points = [(604, 797), (611, 790), (617, 790), (611, 797), (611, 803), (604, 797)]
    else:
        points = [(627, 775), (634, 768), (640, 768), (634, 775), (634, 781), (627, 775)]
    draw.polygon(points, fill=GLINT_BLUE)
    draw.rectangle((points[1][0], points[1][1], points[2][0], points[2][1]), fill=GLINT)


def cloud_breathe(frame: Image.Image, phase: int) -> None:
    # Recolour only pixels that already belong to the painted clouds. This gives
    # the cloud banks a subtle hand-drawn shimmer without adding floating bars.
    pixels = frame.load()
    boxes = [(45, 470, 340, 575), (350, 590, 530, 655), (1100, 465, 1440, 565), (1200, 580, 1440, 655)]
    for x0, y0, x1, y1 in boxes:
        for y in range(y0, y1):
            for x in range(x0, x1):
                red, green, blue, alpha = pixels[x, y]
                is_cloud_highlight = red > 235 and green > 150 and blue < 180
                if is_cloud_highlight and (x * 3 + y * 5 + phase * 7) % 29 == 0:
                    if phase == 1:
                        pixels[x, y] = (min(255, red + 10), min(255, green + 12), min(255, blue + 8), alpha)
                    else:
                        pixels[x, y] = (max(0, red - 12), max(0, green - 6), min(255, blue + 6), alpha)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")
    if source.size != (1448, 1086):
        raise ValueError(f"Expected 1448x1086 source, got {source.size}")

    source.save(OUT / "title-frame-0.webp", format="WEBP", lossless=True, method=6, quality=100)
    for number in (1, 2):
        frame = source.copy()
        cloud_breathe(frame, number)
        # Keep Jason's silhouette and footing intact for this first proof. The
        # blade glint is painted on the actual sword pixels, not added nearby.
        if number == 1:
            sword_glint(frame, number)
        frame.save(OUT / f"title-frame-{number}.webp", format="WEBP", lossless=True, method=6, quality=100)

    print(f"Built 3 complete title frames in {OUT}")


if __name__ == "__main__":
    main()
