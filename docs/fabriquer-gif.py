"""Fabrique docs/demo.gif à partir des images que le moteur de Claude Code dessine.

Usage (macOS, Python 3 avec Pillow) :
    claude plugin test . | python3 docs/fabriquer-gif.py docs/demo.gif

Le test tests/rendu.test.tsx écrit une ligne `RENDU <json>` par état de la barre :
les textes sont ceux du moteur, ce script ne fait que les peindre façon terminal.
"""

import json
import sys

from PIL import Image, ImageDraw, ImageFont

MONO = "/System/Library/Fonts/Menlo.ttc"
EMOJI = "/System/Library/Fonts/Apple Color Emoji.ttc"
SIZE = 24
BG, FG, DIM, ACCENT, RULE = "#1F2430", "#F2F2F2", "#8A93A6", "#FF6E44", "#3A4152"
W, H, PAD = 980, 250, 28


def frames_from(stream):
    for line in stream:
        if line.startswith("RENDU "):
            yield json.loads(line[len("RENDU "):])


def split(parts):
    """Retrouve les trois lignes de la barre (voir hooks/register.tsx)."""
    goal = parts[1]
    bar, pct = parts[2], parts[4]
    stats = "".join(parts[6:13]).strip()
    button = parts[14]
    status = "".join(parts[15:])
    return goal, f"{bar} {pct} % ", stats, button, status


def paint(parts, mono, bold, emoji):
    goal, bar, stats, button, status = split(parts)
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    for i, color in enumerate(("#FF5F57", "#FEBC2E", "#28C840")):
        d.ellipse((PAD - 8 + i * 22, 14, PAD + 4 + i * 22, 26), fill=color)

    y = 50
    glyph = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
    ImageDraw.Draw(glyph).text((0, 0), "🎯", font=emoji, embedded_color=True)
    img.paste(glyph.resize((26, 26)), (PAD, y + 2), glyph.resize((26, 26)))
    d.text((PAD + 34, y), goal, font=bold, fill=FG)

    y += 38
    x = PAD
    d.text((x, y), bar, font=mono, fill=FG)
    x += d.textlength(bar, font=mono)
    d.text((x, y), stats + " ", font=mono, fill=DIM)
    x += d.textlength(stats + " ", font=mono)
    label = button.strip("[]")
    bw = d.textlength(label, font=mono) + 20
    d.rounded_rectangle((x, y - 3, x + bw, y + SIZE + 5), radius=6, outline=DIM)
    d.text((x + 10, y), label, font=mono, fill="#D0D5DF")

    y += 38
    d.text((PAD, y), status, font=mono, fill=DIM)

    y += 44
    d.line((PAD - 12, y, W - PAD + 12, y), fill=RULE, width=2)
    d.text((PAD, y + 18), ">", font=mono, fill=ACCENT)
    d.text((PAD + 26, y + 18), "Écris ta demande…", font=mono, fill="#5C6577")
    return img


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "docs/demo.gif"
    mono = ImageFont.truetype(MONO, SIZE, index=0)
    bold = ImageFont.truetype(MONO, SIZE, index=1)
    emoji = ImageFont.truetype(EMOJI, 32)
    frames = [paint(p, mono, bold, emoji) for p in frames_from(sys.stdin)]
    if not frames:
        sys.exit("Aucune ligne RENDU reçue : lancer `claude plugin test .` en amont.")
    # Une image par seconde simulée : 250 ms chacune, la démo tourne en accéléré (x4).
    step = 250 if len(frames) > 10 else 900
    durations = [step] * (len(frames) - 1) + [2600]
    pal = [f.convert("P", palette=Image.ADAPTIVE, colors=64) for f in frames]
    pal[0].save(out, save_all=True, append_images=pal[1:], duration=durations, loop=0, optimize=True)
    print(f"{out} : {len(frames)} images")


if __name__ == "__main__":
    main()
