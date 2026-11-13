"""Scaffold a Quarto website; the Blog index discovers it automatically."""

import argparse
from datetime import date
import json
import re
import shutil

from blog import ROOT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("slug", help="URL slug, e.g. my-project")
    parser.add_argument("--title", required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--date", default=date.today().isoformat(), type=lambda value: date.fromisoformat(value).isoformat())
    parser.add_argument("--tag", action="append", default=[])
    args = parser.parse_args()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.slug) or args.slug == "enot":
        parser.error("Use lowercase words separated by hyphens; 'enot' is reserved.")
    if not args.title.strip() or not args.description.strip():
        parser.error("Title and description cannot be empty.")
    destination = ROOT / "quarto-projects" / args.slug
    if destination.exists():
        parser.error(f"Project already exists: {args.slug}")
    shutil.copytree(ROOT / "templates/quarto-project", destination)
    for path in destination.rglob("*"):
        if path.is_file():
            content = path.read_text()
            content = content.replace("__TITLE_YAML__", json.dumps(args.title, ensure_ascii=False))
            content = content.replace("__DESCRIPTION_YAML__", json.dumps(args.description, ensure_ascii=False))
            content = content.replace("__SLUG__", args.slug)
            path.write_text(content)
    (destination / "project.json").write_text(json.dumps({
        "title": args.title,
        "description": args.description,
        "date": args.date,
        "tags": args.tag,
    }, indent=2, ensure_ascii=False) + "\n")
    print(f"Created {destination.relative_to(ROOT)}/")
    print(f"Preview: quarto preview quarto-projects/{args.slug}")
    print("Build everything: python3 tools/build_site.py")


if __name__ == "__main__":
    main()
