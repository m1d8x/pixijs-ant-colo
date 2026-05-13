import { Container } from 'pixi.js';

export class Layers {
  pheromone: Container;
  nest: Container;
  food: Container;
  ants: Container;
  ui: Container;

  constructor(stage: Container) {
    this.pheromone = new Container();
    this.nest = new Container();
    this.food = new Container();
    this.ants = new Container();
    this.ui = new Container();

    // Add in z-order: pheromone (back) → nest → food → ants → ui (front)
    stage.addChild(this.pheromone);
    stage.addChild(this.nest);
    stage.addChild(this.food);
    stage.addChild(this.ants);
    stage.addChild(this.ui);
  }
}
