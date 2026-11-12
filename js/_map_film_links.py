from urllib.request import urlopen, Request
import zipfile
import io
import re
import xml.etree.ElementTree as ET

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
NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

# shared strings
ss_root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
shared = []
for si in ss_root.findall("m:si", NS):
    shared.append("".join(t.text or "" for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")))

# rels
rels_xml = zf.read("xl/worksheets/_rels/sheet1.xml.rels").decode("utf-8")
rid_to_url = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', rels_xml))
rid_to_url.update(re.findall(r'Target="([^"]+)"[^>]*Id="(rId\d+)"', rels_xml))  # unlikely order

# hyperlinks by cell
sheet_xml = zf.read("xl/worksheets/sheet1.xml").decode("utf-8")
cell_link = {}
for m in re.finditer(r'<hyperlink[^>]*r:id="(rId\d+)"[^>]*ref="([A-Z]+\d+)"', sheet_xml):
    cell_link[m.group(2)] = rid_to_url.get(m.group(1), "")
for m in re.finditer(r'<hyperlink[^>]*ref="([A-Z]+\d+)"[^>]*r:id="(rId\d+)"', sheet_xml):
    cell_link[m.group(1)] = rid_to_url.get(m.group(2), "")

# cells
root = ET.fromstring(zf.read("xl/worksheets/sheet1.xml"))
rows = {}
for c in root.findall(".//m:c", NS):
    ref = c.attrib.get("r")
    if not ref:
        continue
    col = "".join(ch for ch in ref if ch.isalpha())
    row = int("".join(ch for ch in ref if ch.isdigit()))
    v = c.find("m:v", NS)
    if v is None or v.text is None:
        continue
    val = v.text
    if c.attrib.get("t") == "s":
        val = shared[int(val)]
    rows.setdefault(row, {})[col] = val

print("mapped films:")
for row in sorted(rows):
    title = rows[row].get("B")
    link_cell = f"C{row}"
    link = cell_link.get(link_cell) or rows[row].get("C")
    score = rows[row].get("D")
    kp = rows[row].get("E")
    if title and title not in ("Название", "посмотрел", "утеряно", "недосмотрел"):
        print(f"{row}\t{title}\t{score}\t{kp}\t{link}")
