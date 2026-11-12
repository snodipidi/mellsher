from urllib.request import urlopen, Request
import re
import zipfile
import io
import xml.etree.ElementTree as ET

sid = "1ymH3LE5gP7vEtYIPLCa-amg6YLeMQxKmmIwiLSHijsE"
gid = "1540467640"
ua = {"User-Agent": "Mozilla/5.0"}


def get(url: str) -> bytes:
    req = Request(url, headers=ua)
    return urlopen(req, timeout=30).read()


# 1) try xlsx export (hyperlinks live in xl/worksheets/_rels)
xlsx_url = f"https://docs.google.com/spreadsheets/d/{sid}/export?format=xlsx&gid={gid}"
print("fetch xlsx...")
try:
    raw = get(xlsx_url)
    print("xlsx bytes", len(raw))
    zf = zipfile.ZipFile(io.BytesIO(raw))
    names = zf.namelist()
    print("entries", [n for n in names if "sheet" in n.lower() or "hyper" in n.lower()][:30])
    # parse shared strings
    ss = []
    if "xl/sharedStrings.xml" in names:
        root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
        ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        for si in root.findall("m:si", ns):
            texts = [t.text or "" for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")]
            ss.append("".join(texts))
    # find worksheet
    sheets = [n for n in names if n.startswith("xl/worksheets/sheet") and n.endswith(".xml")]
    for sheet in sheets:
        xml = zf.read(sheet).decode("utf-8", "replace")
        rels = sheet.replace("worksheets/", "worksheets/_rels/") + ".rels"
        href_map = {}
        if rels in names:
            rel_xml = zf.read(rels).decode("utf-8", "replace")
            for m in re.finditer(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', rel_xml):
                href_map[m.group(1)] = m.group(2)
            for m in re.finditer(r'Target="([^"]+)"[^>]*Id="(rId\d+)"', rel_xml):
                href_map[m.group(2)] = m.group(1)
        print("sheet", sheet, "rels", len(href_map))
        # hyperlinks in sheet
        for m in re.finditer(
            r'<hyperlink[^>]*ref="([A-Z]+)(\d+)"[^>]*(?:r:id="(rId\d+)"|Target="([^"]+)")',
            xml,
        ):
            col, row, rid, target = m.group(1), m.group(2), m.group(3), m.group(4)
            url = target or href_map.get(rid or "", "")
            print(f"hyper {col}{row} -> {url}")
        # also cells with display text around column C
        # dump a few interesting cell values near links
except Exception as e:
    print("xlsx fail", type(e).__name__, e)

# 2) htmlview fallback
print("\nhtmlview...")
try:
    html = get(f"https://docs.google.com/spreadsheets/d/{sid}/htmlview?gid={gid}").decode("utf-8", "replace")
    print("html len", len(html))
    for m in re.finditer(r'href="(https?://[^"]+)"[^>]*>([^<]{0,60})', html):
        url, text = m.group(1), m.group(2)
        if any(x in url.lower() for x in ("youtu", "twitch", "vk.com", "rutube")) or "смотр" in text.lower():
            print(text, "=>", url)
except Exception as e:
    print("html fail", type(e).__name__, e)
