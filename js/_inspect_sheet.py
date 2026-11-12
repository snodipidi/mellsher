from urllib.request import urlopen, Request
import zipfile
import io
import re

sid = "1ymH3LE5gP7vEtYIPLCa-amg6YLeMQxKmmIwiLSHijsE"
gid = "1540467640"
raw = urlopen(
    Request(
        f"https://docs.google.com/spreadsheets/d/{sid}/export?format=xlsx&gid={gid}",
        headers={"User-Agent": "Mozilla/5.0"},
    ),
    timeout=30,
).read()
zf = zipfile.ZipFile(io.BytesIO(raw))
sheet = zf.read("xl/worksheets/sheet1.xml").decode("utf-8", "replace")
rels = zf.read("xl/worksheets/_rels/sheet1.xml.rels").decode("utf-8", "replace")
print("=== RELS ===")
print(rels)
print("\n=== HYPERLINK TAGS ===")
for m in re.finditer(r"<hyperlink[\s\S]*?/>", sheet):
    print(m.group(0))
print("\n=== snippet with hyperlink ===")
idx = sheet.lower().find("hyperlink")
print(sheet[max(0, idx - 200) : idx + 800] if idx >= 0 else "no hyperlink word")
# shared strings sample
ss = zf.read("xl/sharedStrings.xml").decode("utf-8", "replace")
print("\n=== shared strings count ===", ss.count("<si>"))
texts = re.findall(r"<t[^>]*>([^<]*)</t>", ss)
for t in texts[:40]:
    print("-", t)
