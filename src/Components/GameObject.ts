import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import { Block } from './Block';

export abstract class GameObject {
  public view: Pixi.Container;
  public body?: Matter.Body;
  protected world: Matter.World;
  public onDestroy: (block: GameObject) => void = (block: GameObject) => {};

  constructor(protected app: Pixi.Application, protected container: Pixi.Container, world: Matter.World) {
    this.view = new Pixi.Container();
    this.world = world;
    this.container.addChild(this.view);
  }

  public update(_deltaTime: number): void {
    if (this.body) {
      this.view.position.set(this.body.position.x, this.body.position.y);
      this.view.rotation = this.body.angle;
    }
  }
  
  public destroy(): void {
    if (this.body && this.world) {
      Matter.World.remove(this.world, this.body);
    }
    this.view.destroy({ children: true });
    this.onDestroy(this);
  }
}