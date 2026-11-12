from PIL import Image
from pathlib import Path

out = Path(r"c:\Users\msmil\mellsher\assets\clips")
target = (640, 360)


def content_bbox(im: Image.Image, thr: int = 18):
    px = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y][:3]
            if r > thr or g > thr or b > thr:
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
    if maxx < 0:
        return (0, 0, w, h)
    return (minx, miny, maxx + 1, maxy + 1)


for path in sorted(out.glob("*.jpg")):
    im = Image.open(path).convert("RGB")
    box = content_bbox(im)
    crop = im.crop(box)
    cw, ch = crop.size
    tw, th = target
    scale = max(tw / cw, th / ch)
    nw, nh = int(cw * scale + 0.5), int(ch * scale + 0.5)
    crop = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    final = crop.crop((left, top, left + tw, top + th))
    final.save(path, quality=92, optimize=True)
    print(path.name, im.size, "->", box, "->", final.size)
