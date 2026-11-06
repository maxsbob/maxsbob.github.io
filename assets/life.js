import { IdeaWorld } from './idea-world.mjs';
const figure = document.querySelector('[data-life]');
if (figure) {
  const canvas = figure.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (context) startPlayground();

  function startPlayground() {
    const toggle = figure.querySelector('[data-life-toggle]');
    const counter = figure.querySelector('[data-life-generation]');
    const note = figure.querySelector('[data-life-note]');
    const ideas = [...figure.querySelectorAll('[data-idea]')];
    const desktop = matchMedia('screen and (min-width: 641px) and (min-height: 680px) and (pointer: fine)');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const descriptions = [
      'Simple rules. A world of possibilities.', 'New seeds explore the edges of life.',
      'Fading traces influence what grows next.', 'New ideas build on traces of the past.',
      'Life adjusts to a changing habitat.', 'New patterns find changing niches.',
      'Past experience supports adaptation.', 'Explore, remember, and adjust.',
      'A shifting flow carries patterns.', 'New seeds travel through the world.',
      'Patterns move; their traces remain.', 'Moving patterns leave seeds and memories.',
      'Life adapts while the world flows.', 'Exploration follows a changing flow.',
      'Memory and adaptation shape the journey.', 'Explore, remember, adapt, and move.'
    ];
    let world;
    let width = 0, height = 0, timer = null;
    let inView = true, paused = reducedMotion.matches;
    const options = { creativity: true, memory: false, adaptation: false, transport: false };

    function mask() {
      return ideas.reduce((bits, button, i) => bits | (options[button.dataset.idea] ? 1 << i : 0), 0);
    }
    function updateIdeas() {
      ideas.forEach(button => button.setAttribute('aria-pressed', String(options[button.dataset.idea])));
      note.textContent = descriptions[mask()];
      note.title = descriptions[mask()];
      if (world) { world.options = { ...options }; world.repeated = 0; world.recent.clear(); }
      draw();
    }
    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      width = rect.width; height = rect.height;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const rows = Math.max(18, Math.round(height / (width / 42)));
      if (!world || world.rows !== rows) {
        world = new IdeaWorld(42, rows, world?.seed ?? Math.floor(Math.random() * 4294967296));
        world.options = { ...options };
      }
      draw();
    }
    function draw() {
      if (!world) return;
      context.clearRect(0, 0, width, height);
      const dx = width / world.columns, dy = height / world.rows;
      const size = Math.min(dx, dy) * 0.77;
      if (options.transport) {
        context.strokeStyle = '#ccd6e4'; context.lineWidth = 0.75;
        for (let y = 3; y < world.rows; y += 6) {
          for (let x = 3; x < world.columns; x += 7) {
            const [vx, vy] = world.flow(x, y), cx = x * dx, cy = y * dy;
            context.beginPath(); context.moveTo(cx - vx * 4, cy - vy * 4);
            context.lineTo(cx + vx * 4, cy + vy * 4);
            context.lineTo(cx + vx * 2 - vy * 2, cy + vy * 2 + vx * 2); context.stroke();
          }
        }
      }
      for (let y = 0; y < world.rows; y++) {
        for (let x = 0; x < world.columns; x++) {
          const i = world.index(x, y), cx = (x + 0.5) * dx, cy = (y + 0.5) * dy;
          if (world.cells[i]) {
            context.fillStyle = world.ages[i] < 3 ? '#b43f21' : options.adaptation && world.toughness[i] > 2 ? '#326b57' : '#252321';
            if (options.creativity && world.sparks[i]) context.fillStyle = '#c77a35';
            context.fillRect(cx - size / 2, cy - size / 2, size, size);
          } else if (world.memory[i] > 15) {
            context.fillStyle = options.memory ? `rgba(121, 80, 152, ${world.memory[i] * 0.00135})` : `rgba(180, 95, 57, ${world.memory[i] * 0.0009})`;
            context.fillRect(cx - size / 2, cy - size / 2, size, size);
          } else {
            context.fillStyle = options.adaptation ? (world.habitat[i] > 0.6 ? '#cbdac8' : '#dce2ec') : '#eae5e1';
            context.fillRect(cx - 0.45, cy - 0.45, 0.9, 0.9);
          }
        }
      }
      counter.textContent = `g. ${String(world.generation).padStart(3, '0')}`;
      counter.title = `${world.population} living cells`;
    }
    function step() {
      const started = performance.now();
      world.step();
      if (world.repeated > 48 || world.generation > 600) world.reset(Math.floor(Math.random() * 4294967296));
      draw();
      figure.dataset.updateMs = (performance.now() - started).toFixed(2);
    }
    function sync() {
      const running = desktop.matches && !document.hidden && inView && !paused && world;
      if (running && timer === null) timer = setInterval(step, 180);
      if (!running && timer !== null) { clearInterval(timer); timer = null; }
      toggle.textContent = paused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Play the playground' : 'Pause the playground');
    }
    function display() { figure.hidden = !desktop.matches; if (desktop.matches) resize(); sync(); }
    ideas.forEach(button => button.addEventListener('click', () => {
      options[button.dataset.idea] = !options[button.dataset.idea]; updateIdeas();
    }));
    toggle.addEventListener('click', () => { paused = !paused; sync(); });
    figure.querySelector('[data-life-reset]').addEventListener('click', () => { world.reset(); draw(); });
    figure.querySelector('[data-life-mix]').addEventListener('click', () => {
      let nextMask;
      do { nextMask = 1 + Math.floor(Math.random() * 15); } while (nextMask === mask());
      ideas.forEach((button, i) => { options[button.dataset.idea] = Boolean(nextMask & (1 << i)); });
      world.reset(Math.floor(Math.random() * 4294967296)); updateIdeas();
    });
    canvas.addEventListener('click', event => {
      const rect = canvas.getBoundingClientRect();
      world.plant(Math.floor((event.clientX - rect.left) / rect.width * world.columns), Math.floor((event.clientY - rect.top) / rect.height * world.rows)); draw();
    });
    canvas.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); world.plant(world.columns >> 1, world.rows >> 1); draw(); }
    });
    desktop.addEventListener('change', display);
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) paused = true; sync(); });
    document.addEventListener('visibilitychange', sync);
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }).observe(figure);
    window.addEventListener('pagehide', () => { clearInterval(timer); timer = null; });
    window.addEventListener('pageshow', sync);
    display(); updateIdeas();
  }
}
