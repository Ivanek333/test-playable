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
    const groundY = this.designHeight - 20;
    const groundWidth = this.designWidth + 1000;
    const ground = Matter.Bodies.rectangle(
      this.designWidth / 2,
      groundY,
      groundWidth,
      20,
      { isStatic: true, restitution: 0.5, label: 'ground' }
    );

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

    const groundSprite = new Pixi.Graphics().rect(-500, groundY - 10, this.designWidth + 1000, 20).fill(0x228B22);
    this.container.addChild(groundSprite);
  }

  private createCastle(): void {
    const blockWidth = 60;
    const blockHeight = 30;
    const startX = 500;
    const startY = 500;
    
    for (let i = 0; i < 3; i++) {
      const x = startX + i * blockWidth;
      const y = startY;
      const block = new Block(this.app, this.container, this.world, x, y, blockWidth, blockHeight);
      this.castleBlocks.push(block);
      this.gameObjects.add(block);
    }
    
    for (let i = 0; i < 2; i++) {
      const x = startX + blockWidth / 2 + i * blockWidth;
      const y = startY - blockHeight;
      const block = new Block(this.app, this.container, this.world, x, y, blockWidth, blockHeight);
      this.castleBlocks.push(block);
      this.gameObjects.add(block);
    }

    const top = new Block(this.app, this.container, this.world, startX + blockWidth, startY - blockHeight * 2, blockWidth, blockHeight);
    this.castleBlocks.push(top);
    this.gameObjects.add(top);
  }

  private createCannon(): void {
    this.cannon = new Cannon(this.app, this.container, this.world, 100, 550, this.onProjectileFire.bind(this));
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