"""Extracts the glyph outlines for the metal type section.

The 3D sorts in src/lib/type-case.ts are extruded from real outlines of the site's
faces, instanced at the weight the section sets them in. Run this again only when the
name or the faces change:

    pip install fonttools
    python scripts/build-type-sorts.py Anybody[wdth,wght].ttf NotoSansKR[wght].ttf

Both fonts come from https://github.com/google/fonts (OFL).
"""

import json
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

LATIN = "LucasFlatwhite"
HANGUL = "루카스플랫화이트"
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "type-sorts.json"


def extract(path: str, location: dict, characters: str) -> dict:
    font = instantiateVariableFont(TTFont(path), location)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    glyphs = {}

    for char in sorted(set(characters)):
        name = cmap[ord(char)]
        svg = SVGPathPen(glyph_set, ntos=lambda value: str(round(value)))
        bounds = BoundsPen(glyph_set)
        glyph_set[name].draw(svg)
        glyph_set[name].draw(bounds)
        glyphs[char] = {
            "advance": glyph_set[name].width,
            "bounds": [round(value) for value in bounds.bounds],
            "path": svg.getCommands(),
        }

    return {
        "unitsPerEm": font["head"].unitsPerEm,
        "ascender": font["hhea"].ascent,
        "descender": font["hhea"].descent,
        "glyphs": glyphs,
    }


def main() -> None:
    anybody, noto = sys.argv[1], sys.argv[2]
    data = {
        "latin": extract(anybody, {"wdth": 100, "wght": 800}, LATIN),
        "hangul": extract(noto, {"wght": 800}, HANGUL),
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
