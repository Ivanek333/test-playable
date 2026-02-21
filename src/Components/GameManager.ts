import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { GameObject } from './GameObject';
import { Cannon } from './Cannon';
import { Projectile } from './Projectile';
import { Block } from './Block';

export class GameManager {
  private app: Pixi.Application;
  private container: Pixi.Container;
  private designWidth: number;
  private designHeight: number;
  private engine: Matter.Engine;
  private world: Matter.World;
  private gameObjects: Set<GameObject> = new Set();
  private cannon!: Cannon;
  private projectile: Projectile | null = null;
  private castleBlocks: Block[] = [];

  constructor(app: Pixi.Application, container: Pixi.Container, designWidht: number, designHeight: number) {
    this.app = app;
    this.container = container;
    this.designWidth = designWidht;
    this.designHeight = designHeight;

    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1 },
      enableSleeping: true
    });
    this.world = this.engine.world;

    this.createBoundaries();
    this.createCastle();
    this.createCannon();

    this.app.ticker.add(this.update.bind(this));
  }

  private createBoundaries(): void {
    const groundHeight = 30;
    const groundY = this.designHeight - groundHeight;
    const groundWidth = this.designWidth + 1000;
    const ground = Matter.Bodies.rectangle(
      this.designWidth / 2,
      groundY + groundHeight / 2,
      groundWidth,
      groundHeight,
      { isStatic: true, restitution: 0.5, label: 'ground' }
    );

    const groundSprite = new Pixi.Graphics().rect(-500, groundY, this.designWidth + 1000, groundHeight).fill(0x228B22);
    this.container.addChild(groundSprite);

    const leftWall = Matter.Bodies.rectangle(
      -300,
      this.designHeight / 2,
      20,
      this.designHeight + 600,
      { isStatic: true, label: 'wall' }
    );

    const rightWall = Matter.Bodies.rectangle(
      this.designWidth + 300,
      this.designHeight / 2,
      20,
      this.designHeight + 600,
      { isStatic: true, label: 'wall' }
    );

    Matter.World.add(this.world, [ground, leftWall, rightWall]);
  }

  private createCastle(): void {
    const start = window.conf.positions.castle;
    window.conf.blocks.forEach(data => {
      const block = new Block(this.app, this.container, this.world, data.t, data.x + start.x, -data.y + start.y, data.r, data.d);
      this.castleBlocks.push(block);
      this.gameObjects.add(block);
    });
  }

  private createCannon(): void {
    this.cannon = new Cannon(this.app, this.container, this.world, this.onProjectileFire.bind(this));
    this.gameObjects.add(this.cannon);
  }

  private onProjectileFire(proj: Projectile): void {
    /*if (this.projectile) {
      this.projectile.destroy();
      this.gameObjects.delete(this.projectile);
    }*/

    this.projectile = proj;
    this.gameObjects.add(proj);
  }

  private update(ticker: Pixi.Ticker): void {
    Matter.Engine.update(this.engine, ticker.deltaTime * 16.667);

    TWEEN.update();

    this.gameObjects.forEach(obj => obj.update(ticker.deltaTime));
  }

  public reset(): void {
    this.gameObjects.forEach(obj => obj.destroy());
    this.gameObjects.clear();
    this.castleBlocks = [];
    this.projectile = null;

    this.createCastle();
    this.createCannon();
  }

  public destroy(): void {
    this.gameObjects.forEach(obj => obj.destroy());
    this.gameObjects.clear();
    Matter.World.clear(this.world, true);
    Matter.Engine.clear(this.engine);
  }
  
  public onResize(): void {
  }
}