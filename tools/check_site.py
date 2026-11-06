from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets, self.ids = [], set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            if attrs["id"] in self.ids:
                raise ValueError("Duplicate ID: " + attrs["id"])
            self.ids.add(attrs["id"])
        self.targets.extend(attrs[k] for k in ("src", "href") if k in attrs)

pages = {}
for path in ROOT.rglob("*.html"):
    if any(part.startswith(".") for part in path.relative_to(ROOT).parts):
        continue
    parser = Links()
    parser.feed(path.read_text())
    pages[path] = parser
for path, parser in pages.items():
    for target in parser.targets:
        uri = urlsplit(urljoin(path.as_uri(), target))
        if uri.scheme not in ("", "file"):
            continue
        dest = ROOT / unquote(uri.path).lstrip("/") if target.startswith("/") else Path(unquote(uri.path))
        if dest.is_dir():
            dest /= "index.html"
        if not dest.is_file():
            raise ValueError(f"{path.name}: missing {target}")
        if uri.fragment and dest in pages and uri.fragment not in pages[dest].ids:
            raise ValueError(f"{path.name}: missing fragment {target}")
print(f"Validated {len(pages)} HTML pages and all local links, fragments, and assets.")
