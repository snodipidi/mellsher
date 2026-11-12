import json
import re
import urllib.request

html = urllib.request.urlopen(
    "https://www.youtube.com/playlist?list=PLOUTLTOQZIIhMce13iEAxXsNf1HTn_ec3",
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
emoji = re.compile(r"[\U0001F300-\U0001FAFF\u2600-\u27BF\uFE0F\u200d]+")


def clean(title):
    text = re.sub(r"^МЕЛЛШЕР СМОТРИТ:\s*", "", title)
    text = text.replace("От первого лица:", "")
    school = "ШГШ"
    match = re.search(r"Школа\s*[678]|Лагерь", text)
    if match:
        school = re.sub(r"\s+", " ", match.group(0))
    parts = [part.strip(" -·") for part in emoji.sub("|", text).split("|")]
    parts = [
        part
        for part in parts
        if part
        and not re.fullmatch(r"Школа\s*[678]|Лагерь", part)
        and part.lower() != "глазами школьника"
    ]
    hook = (parts[0] if parts else title).strip()
    if hook:
        hook = hook[:1].upper() + hook[1:].lower()
    return school, hook


lines = ["const REACTIONS = ["]
for number, (video_id, title) in enumerate(found, 1):
    school, hook = clean(title)
    hook = hook.replace("\\", "\\\\").replace("'", "\\'")
    lines.append(
        "  { id: 'shgsh-%d', school: '%s', title: '%s', href: 'https://www.youtube.com/watch?v=%s', thumb: 'https://i.ytimg.com/vi/%s/hqdefault.jpg' },"
        % (number, school, hook, video_id, video_id)
    )
lines.append("];")
lines.append("")
path = r"c:\Users\msmil\mellsher\js\reactions.js"
with open(path, "w", encoding="utf-8") as handle:
    handle.write("\n".join(lines))
print("wrote", len(found))
