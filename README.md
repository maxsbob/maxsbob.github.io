# Maksim Bobrin’s personal website

Live at [maxsbob.github.io](https://maxsbob.github.io/).

GitHub Actions builds and publishes the website to GitHub Pages from the **main branch**.
After editing content, regenerate the HTML, run the checks below, then commit and push.
The previous homepage is preserved in branch **backup/site-before-2026-11-06**.

## Preview locally

Requires Python 3.10 or later. No package installation or build service is needed.

~~~sh
python3 -m http.server 8000
~~~

Open http://localhost:8000.

## Edit content

- **About, research interests, and talks** — edit tools/build_pages.py, then run python3 tools/build_pages.py.
- **Latest Updates** — edit updates.json, then run python3 tools/build_pages.py. Entries use date and label for the timeline, html for linked text, and sources for editorial references.
- **Publications** — edit publications.json, then run the same command. The year controls the year group; type is conference, workshop, or preprint. Add shared first authors to shared_first_authors using the exact names in authors. Venue links are label/URL pairs in venue_links; workshops include a separate link to the parent conference.
- **Paper keywords** — edit the keyword field for each entry in publications.json. Each paper has one primary topic, rendered as a small colored label below its title.
- **Profile links** — edit the profiles list in tools/build_pages.py and regenerate the HTML. Links are rendered directly in the page and work without JavaScript.
- **Photo** — replace assets/maksim-bobrin.png, then run `uv run --with pillow python tools/optimize_portrait.py` to regenerate the small WebP images and JPEG fallback. Pages select a size for the visitor’s screen and pixel density; the full-size PNG is never downloaded by the page. The crop and display size are controlled by tools/optimize_portrait.py and .portrait in assets/site.css.
- **Fonts, colors, and spacing** — edit assets/site.css.
- **Heading ornaments** — static SVGs in assets/math/ and assets/automata/.
- **Desktop research playground** — assets/life.js renders a small world, with its dynamics in assets/idea-world.mjs. Creativity introduces seeds into unexplored areas; Memory lets old traces influence births and survival; Adaptation uses a shifting habitat and inherited resilience; Transport advects patterns through a changing flow. All four ideas combine. Switch them all off for Conway’s Game of Life. Reset reproduces the current seed with the selected ideas; Mix tries a new combination and seed. Click or press Enter on the grid to plant a seed. The playground is hidden on phones and short windows, pauses in background tabs, and starts paused for reduced motion.

The checked-in HTML files are generated, so content edits should be made in the sources above.
The playground uses no external libraries. A small loader waits for the page load and an idle period before fetching one generated runtime module. Phones do not fetch the runtime. The grid is limited to 1,176 cells and updates every 180 ms only while visible; reduced motion starts it paused. The source model and renderer are bundled by the standard-library page generator, and their URL changes when the source changes.
The build uses only Python’s standard library. Run python3 tools/check_site.py to verify local links and assets.
The Talks page links to the Optimal Transport lecture at ITMO University (November 2026). The PDF is stored in assets/slides/. It was re-exported from OTApplications_lecture_updated.pptx, with the ITMO cover first. Author, copyright, provenance ID, XMP metadata, and all 64 per-slide markers are retained. Source and PDF checksums are recorded in assets/slides/lecture-provenance.json. The generated PDF links use a content version to avoid stale cached copies. Its web copy retains all 64 slides and 117 clickable links; text is preserved and images are optimized for web delivery.

## Publish changes

~~~sh
python3 tools/build_pages.py
python3 tools/check_site.py
git add .
git commit -m "Update website"
git push
~~~

The Publish GitHub Pages workflow regenerates pages, checks local links, and deploys main automatically. The separate validation workflow also checks that committed HTML matches its editable sources. Manual publication is available through Actions → Publish GitHub Pages → Run workflow.

Legacy project pages and blog articles remain available at their existing URLs. The old /publications/ archive redirects to the homepage's Publications section.
The site is self-contained and does not depend on the Sites preview host.

The portrait is supplied by Maksim Bobrin. DM Sans licensing is included in assets/dm-sans-license.txt.
