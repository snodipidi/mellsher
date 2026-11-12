from PIL import Image
from pathlib import Path
from urllib.request import urlopen, Request
import io
import re

root = Path(r"c:\Users\msmil\mellsher")
data_path = root / "js" / "data.js"
data = data_path.read_text(encoding="utf-8")
block = re.search(r"const MUSIC_CLIPS = \[(.*?)\];", data, re.S).group(1)
ids = re.findall(r"watch\?v=([^\"&]+)", block)
out = root / "assets" / "clips"
out.mkdir(parents=True, exist_ok=True)
print("ids", len(ids))


def fetch(url: str) -> Image.Image:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return Image.open(io.BytesIO(urlopen(req, timeout=20).read())).convert("RGB")


size = (640, 360)
mapping = {}
for vid in ids:
    im = None
    for kind in ("hq720", "maxresdefault", "mqdefault"):
        try:
            candidate = fetch(f"https://i.ytimg.com/vi/{vid}/{kind}.jpg")
            if candidate.size[0] >= 320:
                im = candidate
                break
        except Exception:
            continue
    if im is None:
        print("FAIL", vid)
        continue
    tw, th = size
    scale = max(tw / im.size[0], th / im.size[1])
    nw = int(im.size[0] * scale + 0.5)
    nh = int(im.size[1] * scale + 0.5)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    im = im.crop((left, top, left + tw, top + th))
    safe = re.sub(r"[^A-Za-z0-9_-]+", "_", vid)
    path = out / f"{safe}.jpg"
    im.save(path, quality=90, optimize=True)
    mapping[vid] = f"assets/clips/{safe}.jpg"
    print(vid, "->", path.name)

start = data.index("const MUSIC_CLIPS")
end = data.index("];", start) + 2
chunk = data[start:end]
for vid, local in mapping.items():
    chunk = re.sub(
        rf'thumb: "https://i\.ytimg\.com/vi/{re.escape(vid)}/[^"]+"',
        f'thumb: "{local}"',
        chunk,
    )
data_path.write_text(data[:start] + chunk + data[end:], encoding="utf-8")
print("updated data.js")
