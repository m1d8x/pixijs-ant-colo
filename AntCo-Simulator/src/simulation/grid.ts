import { CONFIG } from './config';

export interface Grid {
  home: Float32Array;
  food: Float32Array;
  obstacles: Uint8Array;
  width: number;
  height: number;
}

export function createGrid(): Grid {
  const size = CONFIG.GRID_WIDTH * CONFIG.GRID_HEIGHT;
  return {
    home: new Float32Array(size),
    food: new Float32Array(size),
    obstacles: new Uint8Array(size),
    width: CONFIG.GRID_WIDTH,
    height: CONFIG.GRID_HEIGHT,
  };
}

export function index(grid: Grid, gx: number, gy: number): number {
  return gy * grid.width + gx;
}

export function evaporate(grid: Grid): void {
  const { home, food } = grid;
  for (let i = 0; i < home.length; i++) {
    home[i] *= CONFIG.EVAPORATION_RATE;
    if (home[i] < CONFIG.MIN_PHEROMONE) home[i] = CONFIG.MIN_PHEROMONE;

    food[i] *= CONFIG.EVAPORATION_RATE;
    if (food[i] < CONFIG.MIN_PHEROMONE) food[i] = CONFIG.MIN_PHEROMONE;
  }
}

export function diffuse(grid: Grid): void {
  const { home, food, width, height } = grid;
  const w = CONFIG.DIFFUSE_WEIGHT;
  // Diffuse home pheromones
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const avg =
        home[idx] * (1 - 4 * w) +
        (home[idx - 1] + home[idx + 1] + home[idx - width] + home[idx + width]) * w;
      home[idx] = avg;
    }
  }
  // Diffuse food pheromones
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const avg =
        food[idx] * (1 - 4 * w) +
        (food[idx - 1] + food[idx + 1] + food[idx - width] + food[idx + width]) * w;
      food[idx] = avg;
    }
  }
}

export function deposit(grid: Grid, px: number, py: number, type: 'home' | 'food', amount: number): void {
  const gx = Math.floor(px / CONFIG.CELL_SIZE);
  const gy = Math.floor(py / CONFIG.CELL_SIZE);
  if (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height) return;
  const idx = index(grid, gx, gy);
  const buffer = type === 'home' ? grid.home : grid.food;
  buffer[idx] = Math.min(CONFIG.MAX_PHEROMONE, buffer[idx] + amount);
}

export function sample(grid: Grid, px: number, py: number, type: 'home' | 'food'): number {
  const gx = Math.floor(px / CONFIG.CELL_SIZE);
  const gy = Math.floor(py / CONFIG.CELL_SIZE);
  if (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height) return 0;
  const idx = index(grid, gx, gy);
  return type === 'home' ? grid.home[idx] : grid.food[idx];
}
