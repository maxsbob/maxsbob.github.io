export class IdeaWorld {
  constructor(columns, rows, seed = 1) {
    this.columns = columns;
    this.rows = rows;
    this.options = { creativity: true, memory: false, adaptation: false, transport: false };
    this.reset(seed);
  }
  index(x, y) {
    return ((y + this.rows) % this.rows) * this.columns + (x + this.columns) % this.columns;
  }
  random() {
    let x = this.randomState += 0x6D2B79F5;
    x = Math.imul(x ^ x >>> 15, x | 1);
    x ^= x + Math.imul(x ^ x >>> 7, x | 61);
    return ((x ^ x >>> 14) >>> 0) / 4294967296;
  }
  reset(seed = this.seed) {
    this.seed = seed >>> 0;
    this.randomState = this.seed;
    this.generation = 0;
    this.repeated = 0;
    this.recent = new Map();
    const size = this.columns * this.rows;
    for (const key of ['cells', 'ages', 'memory', 'visited', 'toughness', 'sparks']) this[key] = new Uint8Array(size);
    this.habitat = new Float32Array(size);
    for (let y = 3; y < this.rows - 3; y++) {
      for (let x = 7; x < this.columns - 7; x++) {
        if (this.random() < 0.22) this.cells[this.index(x, y)] = 1;
      }
    }
    this.plant(this.columns >> 1, this.rows >> 1);
    this.updateHabitat();
    this.population = this.cells.reduce((sum, cell) => sum + cell, 0);
  }
  plant(x, y) {
    for (const [dx, dy] of [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]]) {
      const i = this.index(x + dx - 1, y + dy - 1);
      this.cells[i] = this.ages[i] = 1;
      this.sparks[i] = 5;
    }
    this.repeated = 0;
    this.recent.clear();
    this.population = this.cells.reduce((sum, cell) => sum + cell, 0);
  }
  updateHabitat() {
    const t = this.generation * 0.035 + (this.seed % 100) / 10;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) this.habitat[this.index(x, y)] = 0.5 + 0.5 * Math.sin(x * 0.24 + t) * Math.cos(y * 0.29 - t * 0.7);
    }
  }
  flow(x, y) {
    const t = this.generation * 0.025;
    return [Math.cos(y * 0.24 + t), Math.sin(x * 0.19 - t * 0.8)];
  }
  advect() {
    const moved = new Uint8Array(this.cells.length);
    const ages = new Uint8Array(moved.length);
    const toughness = new Uint8Array(moved.length);
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        const i = this.index(x, y);
        if (!this.cells[i]) continue;
        const [vx, vy] = this.flow(x, y);
        const j = this.index(x + Math.round(vx * 0.85), y + Math.round(vy * 0.85));
        moved[j] = 1;
        ages[j] = Math.max(ages[j], this.ages[i]);
        toughness[j] = Math.max(toughness[j], this.toughness[i]);
      }
    }
    this.cells = moved;
    this.ages = ages;
    this.toughness = toughness;
  }
  explore() {
    let best = null, bestScore = -1;
    for (let trial = 0; trial < 80; trial++) {
      const x = Math.floor(this.random() * this.columns), y = Math.floor(this.random() * this.rows);
      const i = this.index(x, y);
      let neighbors = 0;
      for (let oy = -2; oy <= 2; oy++) {
        for (let ox = -2; ox <= 2; ox++) neighbors += this.cells[this.index(x + ox, y + oy)];
      }
      const score = (255 - this.visited[i]) / 255 + (neighbors > 0 && neighbors < 6 ? 1 : 0);
      if (!this.cells[i] && score > bestScore) { best = [x, y]; bestScore = score; }
    }
    if (best) this.plant(...best);
  }
  step() {
    const o = this.options;
    this.updateHabitat();
    if (o.transport && this.generation % 3 === 0) this.advect();
    const next = new Uint8Array(this.cells.length), nextToughness = new Uint8Array(next.length);
    const previousMemory = this.memory.slice();
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        const i = this.index(x, y);
        let neighbors = 0, trace = 0, inherited = 0;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            if (!ox && !oy) continue;
            const j = this.index(x + ox, y + oy);
            neighbors += this.cells[j];
            trace += previousMemory[j];
            if (this.cells[j]) inherited += this.toughness[j];
          }
        }
        const alive = this.cells[i];
        let grows = neighbors === 3 || Boolean(alive && neighbors === 2);
        if (o.memory) {
          if (!alive && neighbors === 2 && trace > 650) grows = true;
          if (alive && neighbors === 1 && previousMemory[i] > 210 && this.generation % 3 !== 0) grows = true;
        }
        if (o.adaptation) {
          const habitat = this.habitat[i];
          if (habitat < 0.28 && alive && neighbors === 2 && this.toughness[i] < 3) grows = false;
          if (habitat > 0.73 && !alive && neighbors === 2 && this.generation % 3 === 0) grows = true;
          nextToughness[i] = grows ? (alive ? Math.min(12, Math.max(0, this.toughness[i] + (habitat < 0.4 ? 1 : -1))) : Math.round(inherited / Math.max(neighbors, 1))) : 0;
        }
        next[i] = grows ? 1 : 0;
        this.ages[i] = grows ? (alive ? Math.min(this.ages[i] + 1, 255) : 1) : 0;
        this.memory[i] = alive ? 255 : Math.max(0, previousMemory[i] - (o.memory ? 5 : 32));
        this.visited[i] = alive ? 255 : Math.max(0, this.visited[i] - 1);
        this.sparks[i] = Math.max(0, this.sparks[i] - 1);
      }
    }
    this.cells = next;
    this.toughness = nextToughness;
    this.generation++;
    if (o.creativity && this.generation % 17 === 0) this.explore();
    this.population = 0;
    let hash = 2166136261;
    for (const cell of this.cells) { this.population += cell; hash = Math.imul(hash ^ cell, 16777619) >>> 0; }
    this.repeated = this.recent.has(hash) ? this.repeated + 1 : 0;
    this.recent.set(hash, this.generation);
    for (const [state, seenAt] of this.recent) { if (this.generation - seenAt > 12) this.recent.delete(state); }
  }
}

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
