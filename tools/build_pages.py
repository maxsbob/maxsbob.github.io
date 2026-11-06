from pathlib import Path
from html import escape

out = Path(__file__).resolve().parents[1]
styles_url = 'assets/site.css?v=' + __import__('hashlib').sha256((out/'assets/site.css').read_bytes()).hexdigest()[:12]
slides_path = 'assets/slides/generative-modelling-itmo-2026.pdf'
slides_version = __import__('hashlib').sha256((out/slides_path).read_bytes()).hexdigest()[:12]
slides_url = slides_path + '?v=' + slides_version

name = 'Maksim Bobrin'
description = 'PhD student, Researcher'
nav = [('Home','index.html'),('Talks','talks.html')]
profiles = [
    ('linkedin', 'LinkedIn', 'https://www.linkedin.com/in/maksim-bobrin'),
    ('github', 'GitHub', 'https://github.com/maxsbob'),
    ('scholar', 'Google Scholar', 'https://scholar.google.com/citations?user=8vy8vqgAAAAJ&hl=en'),
]

def page(filename, title, active, content, scripts=''):
    page_title = name if filename == 'index.html' else title + ' · ' + name
    page_url = 'https://maxsbob.github.io/' + ('' if filename == 'index.html' else filename)
    links = []
    for label, href in nav:
        current = ' aria-current="page"' if href == active else ''
        links.append(f'<a href="{href}"{current}>{label}</a>')
    lettering = f'<span class="name-initial">{escape(name[0])}</span>{escape(name[1:])}'
    name_html = f'<h1 class="name">{lettering}</h1>' if filename == 'index.html' else f'<a class="name" href="index.html">{lettering}</a>'
    profile_items = '\n'.join(
        f'<li data-profile="{key}"><a href="{escape(url, quote=True)}"><img src="assets/{key}.svg" alt="" width="15" height="15">{label}</a></li>'
        for key, label, url in profiles
    )
    document = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#ffffff">
  <meta name="description" content="{escape(description, quote=True)}">
  <meta property="og:title" content="{escape(page_title, quote=True)}">
  <meta property="og:description" content="{escape(description, quote=True)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{page_url}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{escape(page_title, quote=True)}">
  <meta name="twitter:description" content="{escape(description, quote=True)}">
  <title>{escape(page_title)}</title>
  <link rel="stylesheet" href="{styles_url}">
  {scripts}
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="topbar">
    <nav aria-label="Main navigation">{' '.join(links)}</nav>
  </header>
  <div class="layout">
    <aside class="profile" aria-label="Researcher profile">
      {name_html}
      <picture>
        <source type="image/webp" srcset="assets/portrait-180.webp 180w, assets/portrait-360.webp 360w, assets/portrait-540.webp 540w" sizes="(max-width: 640px) 152px, (pointer: coarse) and (orientation: landscape) and (max-height: 500px) and (max-width: 960px) 152px, 180px">
        <img class="portrait" src="assets/portrait-360.jpg" alt="Maksim Bobrin by the sea" width="360" height="450" fetchpriority="high" decoding="async">
      </picture>
      <ul class="profiles" aria-label="Profiles">{profile_items}</ul>
    </aside>
    <div class="column">
      <main id="main">{content}</main>
      <footer>Maksim Bobrin</footer>
    </div>
  </div>
</body>
</html>
'''
    document = document.replace(slides_path, slides_url).replace('assets/slides/lecture-map.png', 'assets/slides/lecture-map.png?v=' + slides_version)
    (out / filename).write_text('\n'.join(line.rstrip() for line in document.splitlines()) + '\n')

def make_paper(p):
    def a(label,href):
        return f'<a href="{escape(href,quote=True)}">{escape(label)}</a>'
    authors=p['authors']
    shared=p.get('shared_first_authors',[])
    def display(n):
        label='<strong>Maksim Bobrin</strong>' if 'bobrin' in n.casefold() else escape(n)
        if n in shared:
            label+='<sup class="equal-marker" aria-label="shared first author">*</sup>'
        return label
    if len(authors)>6:
        preview=' | '.join(display(n) for n in authors[:3])
        if not any('bobrin' in n.casefold() for n in authors[:3]):
            preview=display(authors[0])+' et al. | '+next(display(n) for n in authors if 'bobrin' in n.casefold())
        else:
            preview+=' et al.'
        auth_html=f'<details class="all-authors"><summary>{preview}<span class="sr-only"> — full author list</span></summary><p>{" | ".join(map(display,authors))}</p></details>'
    else:
        auth_html=f'<p class="paper-authors">{" | ".join(map(display,authors))}</p>'
    mark=escape(p['venue'])
    if p['event']:
        venue='<span class="venue-links">'+'<span class="venue-separator" aria-hidden="true"> · </span>'.join(a(label,href) for label,href in p['venue_links'])+'</span>'
        if 'Spotlight' in p['venue']:
            venue+='<span class="venue-distinction">Spotlight</span>'
        venue+=f'<span class="place">{escape(p["city"])}</span>'
    else:
        venue=f'<span class="venue preprint">{mark}</span>'
    links=''.join(a(lbl,url) for lbl,url in [
        ('arXiv' if 'arxiv.org' in p['url'] else 'Paper',p['url']),*p['links']])
    return f"""
      <article class="paper-row" id="{p['id']}">
        <div class="venue-line">{venue}</div>
        <h5 class="paper-title">{a(p['title'],p['url'])}</h5>
        {auth_html}
        <div class="resources">{links}<details class="abstract"><summary>Summary</summary><p>{escape(p['summary'])}</p></details></div>
      </article>"""
data=__import__('json').loads((out/'publications.json').read_text())
years=sorted({p['year'] for p in data},reverse=True)
pubs='<div class="publication-tools"><nav class="year-index" aria-label="Publication years">'+''.join(f'<a href="#publications-{y}">{y}</a>' for y in years)+'</nav><p class="contribution-note"><span>*</span> Shared first authorship</p></div>'
for year in years:
    pubs+=f'<section class="publication-year" aria-labelledby="year-{year}" id="publications-{year}"><h3 class="year-title" id="year-{year}">{year}</h3>'
    for group,label in [('conference','Main conference papers'),('workshop','Workshop papers'),('preprint','Preprints')]:
        papers=[p for p in data if p['year']==year and p['type']==group]
        if papers:
            key=f'{group}-{year}'
            pubs+=f'<section class="publication-group {group}" aria-labelledby="{key}"><h4 class="group-title" id="{key}"><span>{escape(label)}</span><span class="group-count">{len(papers)}</span></h4>'
            pubs+=''.join(make_paper(p) for p in papers)+'</section>'
    pubs+='</section>'

news=__import__('json').loads((out/'updates.json').read_text())
updates_html=''
for entry in news:
    if entry.get('end_date'):
        start_label,end_label=entry["label"].split('–',1)
        label=f'<time datetime="{entry["date"]}">{escape(start_label)}</time>–<time datetime="{entry["end_date"]}">{escape(end_label)}</time>'
    else:
        label=f'<time datetime="{entry["date"]}">{escape(entry["label"])}</time>'
    updates_html+=f'<li><span class="update-date">{label}</span><span>{entry["html"]}</span></li>'

home = f'''
  <section class="bio" aria-labelledby="about">
    <h2 id="about" class="page-title">About</h2>
    <p>I explore open-ended questions in neural creativity, learning, and adaptation, often following unusual ideas before knowing where they will lead. I’m especially interested in emergent complexity: how simple local rules give rise to rich systems and behaviors without a prescribed goal.</p>
    <p>I see intelligence as the ability to draw on prior experience and adapt to the unfamiliar. Curiosity and unexpected connections across fields guide my research.</p>
  </section>
  <section id="updates" aria-labelledby="latest">
    <h2 id="latest" class="section-title updates-title">Latest Updates</h2>
    <ul class="updates">
      {updates_html}
    </ul>
  </section>
  <section id="publications" aria-labelledby="publication-title">
    <h2 id="publication-title" class="section-title publications-title">Publications</h2>
    {pubs}
  </section>
'''
page('index.html','Home','index.html',home)

page('research-interests.html','Research Interests','research-interests.html','''<div class="subintro"><h1 class="page-title">Research Interests</h1><p class="lede">My current work focuses on creativity in neural networks, continual learning, and adaptation.</p></div><section class="interest"><h2>Neural creativity</h2><div><p class="body-text">What would it take for a neural network to develop an idea that is both original and useful? One question is how to recognize a creative response when there are many good answers.</p></div></section><section class="interest"><h2>Continual learning</h2><p class="body-text">How can a model learn from a sequence of experiences while preserving what it will need again?</p></section><section class="interest"><h2>Adaptation</h2><p class="body-text">When the environment changes, how can a model tell which parts of its earlier experience still apply?</p></section>''')
page('talks.html','Talks','talks.html','<div class="subintro"><h1 class="page-title">Talks</h1></div>\n<section class="talks-list" aria-labelledby="talks-2026">\n  <h2 class="year-title" id="talks-2026">2026</h2>\n  <article class="talk" aria-labelledby="optimal-transport">\n    <time class="talk-date" datetime="2026-11">November 2026</time>\n    <div class="talk-content">\n      <div class="talk-details">\n        <h3 id="optimal-transport"><span class="talk-topic">Optimal Transport:</span><span class="talk-title-detail">Matching, Generating and Beyond</span></h3>\n        <p class="talk-venue">ITMO University</p>\n        <div class="talk-resources">\n          <a href="assets/slides/generative-modelling-itmo-2026.pdf" target="_blank" rel="noopener">Slides <span class="file-info">PDF · 64 slides</span></a>\n          <a href="assets/slides/generative-modelling-itmo-2026.pdf" download>Download</a>\n        </div>\n      </div>\n      <a class="talk-thumbnail" href="assets/slides/generative-modelling-itmo-2026.pdf#page=2" target="_blank" rel="noopener" aria-label="Open the lecture map in the slides (PDF, page 2)">\n        <img src="assets/slides/lecture-map.png" width="1440" height="810" alt="Lecture map: optimal transport, Wasserstein geometry, computation, fluid dynamics, model alignment, generative transport, mixing and routing, Schrödinger bridges, and further directions.">\n        <span>Lecture map ↗</span>\n      </a>\n    </div>\n  </article>\n</section>')
# Keep the earlier slide URL useful by forwarding to the real PDF.
(out/'slides.html').write_text('''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Optimal Transport · Maksim Bobrin</title>
<meta http-equiv="refresh" content="0; url=assets/slides/generative-modelling-itmo-2026.pdf">
</head><body><p><a href="assets/slides/generative-modelling-itmo-2026.pdf">Open Optimal Transport slides (PDF)</a></p></body></html>
'''.replace(slides_path, slides_url))
