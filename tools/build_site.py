"""Build the existing static site and every Quarto project into _site/."""

import shutil
import subprocess
import sys
from xml.etree import ElementTree as ET

from blog import ROOT, load_projects


def build():
    projects = load_projects()
    quarto = shutil.which("quarto")
    if not quarto:
        raise SystemExit("Quarto is required. Install it from https://quarto.org/docs/get-started/")
    destination = ROOT / "_site"
    subprocess.run([sys.executable, str(ROOT / "tools/build_pages.py")], check=True)
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir()

    # Publish web assets only, never source, templates, tools, or documentation.
    for source in ROOT.glob("*.html"):
        shutil.copy2(source, destination / source.name)
    for name in (".nojekyll", "robots.txt", "sitemap.xml"):
        shutil.copy2(ROOT / name, destination / name)
    for name in ("assets", "blog", "projects", "publications", "talks", "research-interests"):
        shutil.copytree(ROOT / name, destination / name)

    for project in projects:
        source = project["source"]
        rendered = source / "_site"
        if rendered.exists():
            shutil.rmtree(rendered)
        subprocess.run([quarto, "render", str(source)], check=True)
        if not (rendered / "index.html").is_file():
            raise ValueError(f"{source.name}: Quarto must render to _site/index.html")
        shutil.copytree(rendered, destination / "blog" / project["slug"])

        # Include all project pages in the site's sitemap, including subpages.
        sitemap = destination / "sitemap.xml"
        namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
        ET.register_namespace("", namespace)
        tree = ET.parse(sitemap)
        for html in sorted(rendered.rglob("*.html")):
            route = html.relative_to(rendered).as_posix()
            if route.endswith("index.html"):
                route = route[:-10]
            url = ET.SubElement(tree.getroot(), f"{{{namespace}}}url")
            ET.SubElement(url, f"{{{namespace}}}loc").text = (
                f"https://maxsbob.github.io/blog/{project['slug']}/{route}"
            )
        tree.write(sitemap, encoding="utf-8", xml_declaration=True)

    subprocess.run([sys.executable, str(ROOT / "tools/check_site.py"), str(destination)], check=True)
    print(f"Built {len(projects)} Quarto project(s). Preview: python3 -m http.server --directory _site 8000")


if __name__ == "__main__":
    build()
