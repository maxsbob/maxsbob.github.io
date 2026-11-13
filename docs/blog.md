# Writing project websites

The Blog lives at https://maxsbob.github.io/blog/. Each project is an
independent Quarto website published at `/blog/<slug>/`. The existing ENOT
article keeps its original URL. The homepage and Talks keep their static
HTML generator.

## Create a project

Install [Quarto](https://quarto.org/docs/get-started/) (the workflows use
version 1.11.9) and Python 3.10 or newer. No Python packages are needed for
the supplied template.

From the repository root:

```sh
python3 tools/new_project.py my-project \
  --title "My project" \
  --description "A short description of the question and approach." \
  --date 2026-11-13 \
  --tag "Machine learning"
```

Choose a unique lowercase slug with hyphens. It becomes the public URL;
keep it stable after publication. `enot` is reserved for the existing article.
The date is optional and defaults to today. Repeat `--tag` for more tags.

The command copies `templates/quarto-project/` into
`quarto-projects/my-project/` and creates:

| File | Purpose |
| --- | --- |
| `project.json` | Title, description, date, and tags for the Blog list |
| `_quarto.yml` | This project's navigation, format, and canonical site URL |
| `index.qmd` | Project overview |
| `experiment.qmd` | Methods, code, and results |
| `notes.qmd` | Limitations, references, and open questions |
| `styles.css` | Project-specific appearance |

Edit the QMD pages and metadata. If you rename a project, also update its
`site-url` in `_quarto.yml`. Add more QMD pages to the sidebar's `contents`
in that file. Keep `project.output-dir: _site`, which the build expects.
The Blog index discovers project folders automatically and sorts them by
date, newest first. There is no separate list or workflow to update.

## Project page style

The template follows the tutorial layout of the
[Associative Memory Tutorial](https://github.com/bhoov/amtutorial/blob/main/nbs/index.qmd):
The light Flatly theme, a dark navigation bar, floating chapter navigation,
a right-side table of contents, author metadata, a quoted subtitle, collapsible
callouts, search, and previous/next page links. It keeps the site's local DM
Sans font, included in each project with its license. Pages use a white
background and have no dark-mode toggle.

Change the author in `_quarto.yml` when needed. `styles.css` contains the
small layout adjustments shared by new projects; the rest comes from Quarto.

## Preview and check

For a quick preview of one project with automatic reload:

```sh
quarto preview quarto-projects/my-project
```

The project includes its font and assets for standalone previews. Use the
full-site preview to check the Blog list and links to the rest of the site.
Build and serve everything before publishing:

```sh
python3 tools/build_site.py
python3 -m http.server --directory _site 8000
```

Visit http://localhost:8000/blog/. The build regenerates the main pages,
renders every project, assembles `_site/`, extends the sitemap, and checks
local links, fragments, and assets. The output and Quarto caches are ignored
by Git. Do not edit generated HTML or commit rendered project output.

## Publish

```sh
python3 tools/build_site.py
git add .
git commit -m "Add my project notebook"
git push
```

Pushes to `main` run **Publish GitHub Pages**. GitHub Actions installs
Quarto, builds and validates the whole site, and deploys only `_site/` using
the existing Pages deployment. No access token or additional hosting is
needed. The Pages source must remain **GitHub Actions**, as configured in
this repository. The workflow can also be run manually from Actions.

**Validate website** runs the same build on pushes and pull requests and
checks that committed main-site HTML matches its sources. A pull request
does not deploy. A failed build stops publication.

Only web assets are copied into the deployment: sources, templates, tools,
and this guide stay in GitHub. To remove a project, delete its folder and
rebuild; its list entry and generated pages disappear together.

## Code, figures, and computation

Use ordinary fenced code blocks for examples. Place figures/data next to
the project's QMD files and link them with relative paths. Code execution
is disabled by default, so a project can build without a notebook kernel
or scientific packages. This does **not** compute results from the code.

To execute Python/R cells, enable execution in that project's `_quarto.yml`,
use Quarto executable cells, and either install the required runtime and
packages in **both** workflows or render locally with `execute.freeze: auto`
and commit the resulting `_freeze/` directory. Refer to Quarto's
[CI rendering guidance](https://quarto.org/docs/publishing/github-pages.html#freezing-computations).
Keep package versions explicit when computation needs to be reproducible.

## Other website edits

- About and Talks: `tools/build_pages.py`.
- Publications: `publications.json`.
- Latest Updates: `updates.json`.
- Shared style: `assets/site.css`.

Run the full build before committing. `README.md` is intentionally empty.
