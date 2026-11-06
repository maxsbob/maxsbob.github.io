# Maksim Bobrin’s personal website

Live at [maxsbob.github.io](https://maxsbob.github.io/).

GitHub Pages publishes the committed website from the **main branch, repository root**.
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
- **Profile links** — edit assets/profile-links.js.
- **Photo** — replace assets/maksim-bobrin.png. Its crop and display size are controlled by .portrait in assets/site.css.
- **Fonts, colors, and spacing** — edit assets/site.css.
- **Heading ornaments** — static SVGs in assets/math/ and assets/automata/.

The checked-in HTML files are generated, so content edits should be made in the sources above.
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

GitHub Pages deploys main automatically. The validation workflow checks source consistency and local links.
The optional Publish GitHub Pages workflow is for a future switch to the GitHub Actions publishing source; it is not needed for the current branch-based setup.

Legacy project pages and blog articles remain available at their existing URLs. The old /publications/ archive redirects to the homepage's Publications section.
The site is self-contained and does not depend on the Sites preview host.

The portrait is supplied by Maksim Bobrin. DM Sans licensing is included in assets/dm-sans-license.txt.
