import {
  Application,
  Container,
  Graphics,
  Sprite,
} from 'pixi.js';

import { CONFIG } from './simulation/config';
import * as grid from './simulation/grid';
import type { Grid } from './simulation/grid';
import { createAnt, updateAnt } from './simulation/ant';
import type { Ant } from './simulation/ant';
import { Layers } from './rendering/layers';
import { PheromoneRenderer } from './rendering/pheromone-viz';
import { AntRenderer } from './rendering/ant-renderer';

// Nest and food positions
const NEST_X = CONFIG.WIDTH * 0.3;
const NEST_Y = CONFIG.HEIGHT * 0.5;
const FOOD_X = CONFIG.WIDTH * 0.7;
const FOOD_Y = CONFIG.HEIGHT * 0.5;

// ── Initialization ──
(async () => {
  const app = new Application();
  await app.init({
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    background: CONFIG.BACKGROUND,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  document.getElementById('pixi-container')!.appendChild(app.canvas);

  // Simulation state
  const gridData: Grid = grid.createGrid();
  const ants: Ant[] = [];
  for (let i = 0; i < CONFIG.ANT_COUNT; i++) {
    ants.push(createAnt(NEST_X, NEST_Y));
  }

  // Layers
  const layers = new Layers(app.stage);

  // Pheromone renderer
  const pheromoneRenderer = new PheromoneRenderer();
  layers.pheromone.addChild(pheromoneRenderer.container);

  // Ant renderer
  const antRenderer = new AntRenderer();
  antRenderer.attachTo(layers.ants);

  // ── Static elements: Nest ──
  {
    const g = new Graphics();
    // Outer glow
    g.circle(NEST_X, NEST_Y, CONFIG.NEST_RADIUS + 6);
    g.fill({ color: 0x8B5E3C, alpha: 0.2 });
    g.circle(NEST_X, NEST_Y, CONFIG.NEST_RADIUS + 3);
    g.fill({ color: 0x8B5E3C, alpha: 0.4 });
    // Core
    g.circle(NEST_X, NEST_Y, CONFIG.NEST_RADIUS);
    g.fill({ color: 0xA0714F });
    g.circle(NEST_X, NEST_Y, CONFIG.NEST_RADIUS * 0.7);
    g.fill({ color: 0xB8860B });
    layers.nest.addChild(g);
  }

  // ── Static elements: Food ──
  {
    const g = new Graphics();
    // Outer glow
    g.circle(FOOD_X, FOOD_Y, CONFIG.FOOD_RADIUS + 5);
    g.fill({ color: 0x32CD32, alpha: 0.15 });
    // Core
    g.circle(FOOD_X, FOOD_Y, CONFIG.FOOD_RADIUS);
    g.fill({ color: 0x228B22 });
    g.circle(FOOD_X, FOOD_Y, CONFIG.FOOD_RADIUS * 0.6);
    g.fill({ color: 0x3CB371 });
    layers.food.addChild(g);
  }

  // ── Game Loop ──
  let lastLogicTime = 0;
  const logicInterval = 1000 / CONFIG.LOGIC_UPDATES_PER_SECOND;

  app.ticker.add((ticker) => {
    const now = performance.now();
    if (now - lastLogicTime >= logicInterval) {
      const delta = (now - lastLogicTime) / 16.667; // Normalize to 60fps

      // Pheromone step
      grid.evaporate(gridData);
      grid.diffuse(gridData);

      // Ant step
      for (const ant of ants) {
        updateAnt(ant, gridData, NEST_X, NEST_Y, FOOD_X, FOOD_Y, delta);
      }

      // Update visuals
      pheromoneRenderer.update(gridData);
      antRenderer.sync(ants);

      lastLogicTime = now;
    }
  });
})();
