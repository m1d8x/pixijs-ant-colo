import { Texture, Sprite } from 'pixi.js';
import type { Grid } from '../simulation/grid';
import { CONFIG } from '../simulation/config';

export class PheromoneRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private pixelData: Uint8ClampedArray;
  private sprite: Sprite;

  constructor() {
    const w = CONFIG.GRID_WIDTH * CONFIG.CELL_SIZE;
    const h = CONFIG.GRID_HEIGHT * CONFIG.CELL_SIZE;

    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false })!;
    this.imageData = this.ctx.createImageData(w, h);
    this.pixelData = this.imageData.data;

    const texture = Texture.from(this.canvas);
    this.sprite = new Sprite({ texture });
  }

  get container() {
    return this.sprite;
  }

  update(grid: Grid) {
    const data = this.pixelData;
    const gw = CONFIG.GRID_WIDTH;
    const cs = CONFIG.CELL_SIZE;

    for (let gy = 0; gy < CONFIG.GRID_HEIGHT; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const idx = gy * gw + gx;
        const home = grid.home[idx];
        const food = grid.food[idx];

        // Direct linear mapping — no power curve that kills low values
        const g = Math.floor(home * 255);
        const b = Math.floor(food * 255);
        // Always visible if any pheromone present
        const a = (home > 0.001 || food > 0.001) ? 200 : 0;

        for (let cy = 0; cy < cs; cy++) {
          const rowStart = ((gy * cs + cy) * gw * cs + gx * cs) * 4;
          for (let cx = 0; cx < cs; cx++) {
            const p = rowStart + cx * 4;
            data[p] = 0;
            data[p + 1] = g;
            data[p + 2] = b;
            data[p + 3] = a;
          }
        }
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
    this.sprite.texture.source.update();
  }
}
