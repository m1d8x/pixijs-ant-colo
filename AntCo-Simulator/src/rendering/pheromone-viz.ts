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

    // Create texture from canvas
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

    // Map grid cell → pixel region
    // For performance, compute once per cell, fill CS×CS block
    for (let gy = 0; gy < CONFIG.GRID_HEIGHT; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const gridIdx = gy * gw + gx;
        const home = grid.home[gridIdx];
        const food = grid.food[gridIdx];

        // Color: green = home, blue = food
        // Add slight brightness curve for visual pop
        const g = Math.floor(Math.pow(home, 0.7) * 220);
        const b = Math.floor(Math.pow(food, 0.7) * 200);
        const a = Math.max(g, b) > 3 ? 180 : 0; // transparent when very low

        // Fill CS×CS pixel block
        for (let cy = 0; cy < cs; cy++) {
          const rowStart = ((gy * cs + cy) * gw * cs + gx * cs) * 4;
          for (let cx = 0; cx < cs; cx++) {
            const p = rowStart + cx * 4;
            data[p] = 0;            // R
            data[p + 1] = g;        // G (home)
            data[p + 2] = b;        // B (food)
            data[p + 3] = a;        // A
          }
        }
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
    this.sprite.texture.source.update();
  }
}
