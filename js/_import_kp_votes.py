# -*- coding: utf-8 -*-
"""Merge Kinopoisk votes into FILMS (scores-only) and download posters."""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(r"c:\Users\msmil\mellsher")
DATA = ROOT / "js" / "data.js"
VOTES = ROOT / "js" / "_kp_votes.json"
OUT = ROOT / "assets" / "films"
UA = {"User-Agent": "Mozilla/5.0"}

# Existing site film id -> Kinopoisk id (for dedupe with reaction entries)
EXISTING_KP = {
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

TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "",
    "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def slugify(title: str, kp_id: str) -> str:
    s = title.lower().replace("ё", "е")
    out = []
    for ch in s:
        if ch in TRANSLIT:
            out.append(TRANSLIT[ch])
        elif "a" <= ch <= "z" or "0" <= ch <= "9":
            out.append(ch)
        elif ch in " -_./«»\"'()!?,:":
            out.append("-")
    slug = re.sub(r"-+", "-", "".join(out)).strip("-")
    return slug[:48] or f"kp-{kp_id}"


def short_title(title: str) -> str | None:
    if len(title) <= 28:
        return None
    # keep start, drop subtitle after colon/period when long
    for sep in (": ", ". "):
        if sep in title and len(title.split(sep)[0]) >= 8:
            left = title.split(sep)[0]
            if len(left) <= 28:
                return left
    return title[:27].rstrip(" -.") + "…"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as resp:
        return resp.read()


def download_poster(film_id: str, kp_id: str) -> str:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{film_id}.jpg"
    if path.exists() and path.stat().st_size > 5000:
        return f"assets/films/{film_id}.jpg"
    urls = [
        f"https://st.kp.yandex.net/images/film_iphone/iphone360_{kp_id}.jpg",
        f"https://st.kp.yandex.net/images/film_big/{kp_id}.jpg",
    ]
    for url in urls:
        try:
            data = fetch(url)
            if len(data) < 5000:
                continue
            path.write_bytes(data)
            print("poster", film_id, kp_id, len(data))
            return f"assets/films/{film_id}.jpg"
        except Exception as err:
            print("poster-err", film_id, url, err)
    return ""


def js_str(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def main() -> None:
    votes = json.loads(VOTES.read_text(encoding="utf-8"))
    votes = [v for v in votes if v.get("vote")]  # only rated

    text = DATA.read_text(encoding="utf-8")
    m = re.search(r"const FILMS = (\[[\s\S]*?\n\]);", text)
    if not m:
        raise SystemExit("FILMS not found")
    # Keep only entries that have reaction (or stub) — drop old scores-only
    # Parse loosely via regex objects
    objs = re.findall(r"\{[^{}]*?(?:\{[^{}]*\}[^{}]*?)*\}", m.group(1))
    # Safer: eval-like with json after cleanup is hard; keep reaction films by scanning source
    reaction_block = []
    for block in re.finditer(r"\{[^{}]*?id:\s*\"([^\"]+)\"[\s\S]*?\}(?=\s*,\s*(?:\{|\]))", m.group(1) + "\n]"):
        chunk = block.group(0)
        if "reaction:" in chunk or "stub:" in chunk:
            reaction_block.append(chunk)

    # Fallback: extract full objects containing reaction via brace scan
    films_src = m.group(1)
    kept = []
    i = 0
    while i < len(films_src):
        if films_src[i] == "{":
            depth = 0
            start = i
            for j in range(i, len(films_src)):
                if films_src[j] == "{":
                    depth += 1
                elif films_src[j] == "}":
                    depth -= 1
                    if depth == 0:
                        chunk = films_src[start : j + 1]
                        if re.search(r"\breaction\s*:", chunk) or re.search(r"\bstub\s*:\s*true", chunk):
                            kept.append(chunk)
                        i = j + 1
                        break
            else:
                break
        else:
            i += 1

    kp_to_existing = {str(v): k for k, v in EXISTING_KP.items()}
    used_ids = set()
    for chunk in kept:
        mid = re.search(r'id:\s*"([^"]+)"', chunk)
        if mid:
            used_ids.add(mid.group(1))

    score_entries = []
    for vote in votes:
        kp_id = str(vote["id"])
        existing_id = kp_to_existing.get(kp_id)
        # Skip if already in reaction strip
        if existing_id and existing_id in used_ids:
            continue
        # Also skip if title matches a kept reaction film
        title = vote["title"]
        skip = False
        for chunk in kept:
            tm = re.search(r'title:\s*"([^"]+)"', chunk)
            if tm and tm.group(1).replace("ё", "е").lower() == title.replace("ё", "е").lower():
                skip = True
                break
            if tm and title.replace("ё", "е").lower() in tm.group(1).replace("ё", "е").lower():
                # e.g. Судная ночь 2
                if "reaction:" in chunk:
                    skip = True
                    break
        if skip:
            continue

        film_id = existing_id or slugify(title, kp_id)
        if film_id in used_ids:
            film_id = f"{film_id}-{kp_id}"
        used_ids.add(film_id)

        image = download_poster(film_id, kp_id)
        short = short_title(title)
        fields = [
            f'id: "{film_id}"',
            f"title: {js_str(title)}",
        ]
        if short:
            fields.append(f"short: {js_str(short)}")
        fields.extend(
            [
                f'score: "{vote["vote"]}"',
                f'kp: "{vote["kp"]}"',
            ]
        )
        if image:
            fields.append(f'image: "{image}"')
        if vote.get("year"):
            fields.append(f'year: {int(vote["year"])}')
        fields.append(f'votedAt: "{vote["date"]}"')
        score_entries.append("  {\n    " + ",\n    ".join(fields) + ",\n  }")

    new_films = ",\n".join(kept + score_entries)
    new_text = text[: m.start(1)] + "[\n" + new_films + "\n]" + text[m.end(1) :]
    DATA.write_text(new_text, encoding="utf-8")
    print({"kept_reaction": len(kept), "scores_only": len(score_entries)})


if __name__ == "__main__":
    main()
