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
