import { Texture, Sprite, Container } from 'pixi.js';
import type { Ant } from '../simulation/ant';
import { CONFIG } from '../simulation/config';

function createAntTexture(): Texture {
  // Procedural ant shape - small elongated oval
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  // Body - elongated oval
  ctx.fillStyle = '#886644';
  ctx.beginPath();
  ctx.ellipse(8, 8, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head - slightly darker
  ctx.fillStyle = '#664422';
  ctx.beginPath();
  ctx.ellipse(12, 8, 3, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  return Texture.from(canvas);
}

export class AntRenderer {
  private sprites: Sprite[] = [];

  constructor() {
    const texture = createAntTexture();
    const scale = CONFIG.ANT_SIZE / 6;

    for (let i = 0; i < CONFIG.ANT_COUNT; i++) {
      const sprite = new Sprite({ texture });
      sprite.anchor.set(0.5);
      sprite.scale.set(scale);
      this.sprites.push(sprite);
    }
  }

  // Attach all ant sprites to a container
  attachTo(container: Container) {
    for (const sprite of this.sprites) {
      container.addChild(sprite);
    }
  }

  sync(ants: Ant[]) {
    for (let i = 0; i < ants.length; i++) {
      const sprite = this.sprites[i];
      const ant = ants[i];

      sprite.position.x = ant.x;
      sprite.position.y = ant.y;
      sprite.rotation = ant.angle;

      // Tint: warm orange when carrying food, off-white when foraging
      if (ant.hasFood) {
        sprite.tint = 0xdd8833;
      } else {
        sprite.tint = 0xf0ead6;
      }
    }
  }
}
