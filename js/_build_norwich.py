import json
import re
import urllib.request

html = urllib.request.urlopen(
    "https://www.youtube.com/playlist?list=PLLXvMYLXzBWQ",
    timeout=30,
).read().decode("utf-8", "replace")
marker = re.search(r"ytInitialData\s*=\s*", html)
start = html.find("{", marker.end())
depth = 0
end = start
for index, char in enumerate(html[start:], start):
    if char == "{":
        depth += 1
    elif char == "}":
        depth -= 1
        if depth == 0:
            end = index + 1
            break
data = json.loads(html[start:end])
found = []


def walk(node):
    if isinstance(node, dict):
        if "lockupViewModel" in node:
            renderer = node["lockupViewModel"]
            meta = renderer.get("metadata", {}).get("lockupMetadataViewModel", {})
            title = meta.get("title", {}).get("content")
            found.append((renderer.get("contentId"), title))
        for value in node.values():
            walk(value)
    elif isinstance(node, list):
        for value in node:
            walk(value)


walk(data)
seen = set()
uniq = []
for video_id, title in found:
    if video_id and video_id not in seen:
        seen.add(video_id)
        uniq.append((video_id, title))


def clean(title):
    text = re.sub(r"^МЕЛЛШЕР СМОТРИТ\s*", "", title, flags=re.I)
    text = re.sub(r"\s*\|\s*школа глазами школьника.*$", "", text, flags=re.I)
    text = re.sub(r"\s*школа глазами школьника.*$", "", text, flags=re.I)
    text = text.strip(" :|-")
    if re.search(r"ЛАГЕРЬ", text, re.I):
        match = re.search(r"(\d+)\s*серия", text, re.I)
        hook = f"{match.group(1)} серия" if match else text
        return "Лагерь", hook
    match = re.search(r"(\d+)\s*сезон\s*(\d+)\s*серия", text, re.I)
    if match:
        school = f"Сезон {match.group(1)}"
        hook = f"{match.group(2)} серия"
        if re.search(r"ФИНАЛ", text, re.I):
            hook += " · Финал"
        return school, hook
    return "ШГШ", text


lines = ["const NORWICH_REACTIONS = ["]
for number, (video_id, title) in enumerate(uniq, 1):
    school, hook = clean(title)
    hook = hook.replace("\\", "\\\\").replace("'", "\\'")
    lines.append(
        "  { id: 'norwich-%d', school: '%s', title: '%s', href: 'https://www.youtube.com/watch?v=%s', thumb: 'https://i.ytimg.com/vi/%s/hqdefault.jpg' },"
        % (number, school, hook, video_id, video_id)
    )
lines.append("];")
lines.append("")
path = r"c:\Users\msmil\mellsher\js\norwich.js"
with open(path, "w", encoding="utf-8") as handle:
    handle.write("\n".join(lines))
print("wrote", len(uniq))
