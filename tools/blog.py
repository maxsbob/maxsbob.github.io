"""Discover independent Quarto websites for the Blog index and build."""

from datetime import date
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = ROOT / "quarto-projects"


def load_projects():
    projects = []
    if not PROJECTS.is_dir():
        return projects
    for source in sorted(PROJECTS.iterdir()):
        if not source.is_dir() or source.name.startswith("."):
            continue
        slug = source.name
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or slug == "enot":
            raise ValueError(f"Invalid or reserved project slug: {slug}")
        metadata = json.loads((source / "project.json").read_text())
        for field in ("title", "description", "date"):
            if not isinstance(metadata.get(field), str) or not metadata[field].strip():
                raise ValueError(f"{slug}: {field} must be a nonempty string")
        date.fromisoformat(metadata["date"])
        if not isinstance(metadata.get("tags", []), list) or any(
            not isinstance(tag, str) for tag in metadata.get("tags", [])
        ):
            raise ValueError(f"{slug}: tags must be a list of strings")
        for required in ("_quarto.yml", "index.qmd"):
            if not (source / required).is_file():
                raise ValueError(f"{slug}: missing {required}")
        projects.append({**metadata, "slug": slug, "source": source})
    return sorted(projects, key=lambda project: (project["date"], project["slug"]), reverse=True)
