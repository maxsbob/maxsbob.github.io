from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import argparse

arguments = argparse.ArgumentParser(description="Check local HTML links, fragments, and assets.")
arguments.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
ROOT = arguments.parse_args().root.resolve()
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
    if any(part.startswith((".", "_")) for part in path.relative_to(ROOT).parts):
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
            raise ValueError(f"{path.relative_to(ROOT)}: missing {target}")
        if uri.fragment and dest in pages and uri.fragment not in pages[dest].ids:
            raise ValueError(f"{path.relative_to(ROOT)}: missing fragment {target}")
print(f"Validated {len(pages)} HTML pages and all local links, fragments, and assets.")
