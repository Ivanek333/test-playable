import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { GameObject } from './GameObject';
import { Cannon } from './Cannon';
import { Projectile } from './Projectile';
import { Block } from './Block';

export class GameManager {
  private app: Pixi.Application;
  private engine: Matter.Engine;
  private world: Matter.World;
  private gameObjects: Set<GameObject> = new Set();
  private cannon!: Cannon;
  private projectile: Projectile | null = null;
  private castleBlocks: Block[] = [];

  constructor(app: Pixi.Application) {
    this.app = app;

    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1 },
      enableSleeping: true
    });
    this.world = this.engine.world;

    this.createBoundaries();

    this.createCastle();

    this.cannon = new Cannon(this.app, this.world, 100, 400, this.fireProjectile.bind(this));
    this.gameObjects.add(this.cannon);

    this.app.ticker.add(this.update.bind(this));
  }

  private createBoundaries(): void {
    const ground = Matter.Bodies.rectangle(400, 550, 800, 20, { isStatic: true, restitution: 0.5, label: 'ground' });
    const leftWall = Matter.Bodies.rectangle(20, 300, 20, 600, { isStatic: true, label: 'wall' });
    const rightWall = Matter.Bodies.rectangle(780, 300, 20, 600, { isStatic: true, label: 'wall' });
    Matter.World.add(this.world, [ground, leftWall, rightWall]);

    const groundSprite = new Pixi.Graphics().rect(0, 540, 800, 20).fill(0x228B22);
    this.app.stage.addChild(groundSprite);
  }

  private createCastle(): void {
    const blockWidth = 60;
    const blockHeight = 30;
    const startX = 500;
    const startY = 500;
    
    for (let i = 0; i < 3; i++) {
      const x = startX + i * blockWidth;
      const y = startY;
      const block = new Block(this.app, this.world, x, y, blockWidth, blockHeight);
      this.castleBlocks.push(block);
      this.gameObjects.add(block);
    }
    
    for (let i = 0; i < 2; i++) {
      const x = startX + blockWidth / 2 + i * blockWidth;
      const y = startY - blockHeight;
      const block = new Block(this.app, this.world, x, y, blockWidth, blockHeight);
      this.castleBlocks.push(block);
      this.gameObjects.add(block);
    }

    const top = new Block(this.app, this.world, startX + blockWidth, startY - blockHeight * 2, blockWidth, blockHeight);
    this.castleBlocks.push(top);
    this.gameObjects.add(top);
  }

  private fireProjectile(forceX: number, forceY: number): void {
    if (this.projectile) {
      this.projectile.destroy();
      this.gameObjects.delete(this.projectile);
    }

    const cannonPos = this.cannon.sprite.position;
    const angle = this.cannon['barrel'].rotation;
    const tipX = cannonPos.x + Math.cos(angle) * 60;
    const tipY = cannonPos.y + Math.sin(angle) * 60;

    this.projectile = new Projectile(this.app, this.world, tipX, tipY, 12);
    this.gameObjects.add(this.projectile);
    
    this.projectile.fire(forceX, forceY);
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
    this.cannon = new Cannon(this.app, this.world, 100, 400, this.fireProjectile.bind(this));
    this.gameObjects.add(this.cannon);
  }

  public destroy(): void {
    this.gameObjects.forEach(obj => obj.destroy());
    this.gameObjects.clear();
    Matter.World.clear(this.world, true);
    Matter.Engine.clear(this.engine);
  }
}