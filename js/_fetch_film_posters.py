import urllib.request
from pathlib import Path

UA = {"User-Agent": "Mozilla/5.0"}

# Current Kinopoisk IDs (verified via search; classic IDs often remapped)
KP_IDS = {
    "captain": 160946,
    "green-book": 1108577,
    "avengers": 263531,
    "doll": 808062,
    "doll-2": 947898,
    "insidious": 495892,
    "insidious-2": 666804,
    "insidious-3": 798277,
    "insidious-4": 982198,
    "purge-2": 770805,
    "pirates-1": 4374,
    "pirates-2": 63991,
    "pirates-3": 102124,
    "nobody": 1309596,
    "kakha": 1345717,
    "kakha-2": 5236765,
    "zombox": 1047867,
    "condom": 55838,
    "dnd": 762646,
    "scary-1": 5932,
    "scary-2": 5931,
    "scary-3": 5002,
    "scary-4": 32655,
    "scary-5": 255379,
    "fnaf": 952158,
    "shrek": 430,
    "shrek-2": 5273,
    "fight-club": 361,
    "not-perfect": 1162847,
    "transformers": 81288,
    "wolverine": 104904,
}

POSTER_URLS = {
    "not-perfect": "https://cdnrrviubnyuntopbez5.svc.cdn.yandex.net/get-ott/200035/2a00000198513c9eef66d5b6893142f1f9fe/300x450",
}

OUT = Path(r"c:\Users\msmil\mellsher\assets\films")
OUT.mkdir(parents=True, exist_ok=True)


def fetch(url: str) -> tuple[bytes, str]:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as response:
        return response.read(), response.headers.get("content-type", "")


ok = bad = 0
for film_id, kp_id in KP_IDS.items():
    path = OUT / f"{film_id}.jpg"
    urls = []
    if film_id in POSTER_URLS:
        urls.append(POSTER_URLS[film_id])
    urls.append(f"https://st.kp.yandex.net/images/film_iphone/iphone360_{kp_id}.jpg")
    urls.append(f"https://st.kp.yandex.net/images/film_big/{kp_id}.jpg")

    saved = False
    for url in urls:
        try:
            data, ctype = fetch(url)
            if len(data) < 5000 or "gif" in (ctype or ""):
                continue
            path.write_bytes(data)
            print("OK", film_id, kp_id, len(data))
            ok += 1
            saved = True
            break
        except Exception as error:
            print("ERR", film_id, url, error)
    if not saved:
        print("BAD", film_id, kp_id)
        bad += 1

print({"ok": ok, "bad": bad})
