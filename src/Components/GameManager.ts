import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { GameObject } from './GameObject';
import { Cannon } from './Cannon';
import { Projectile } from './Projectile';
import { Block } from './Block';
import { AimParabola } from './AimParabola';
import { PowerIndicator } from './PowerIndicator';

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
  private blockMap: Map<number, Block> = new Map(); 
  private castleBlocks: Set<Block> = new Set();
  private accumulator: number = 0;
  private fixedTimeStep = 16.667;
  private maxStepsPerFrame = 5;
  private aimParabola: AimParabola;
  private powerIndicator: PowerIndicator;

  constructor(app: Pixi.Application, container: Pixi.Container, designWidht: number, designHeight: number) {
    this.app = app;
    this.container = container;
    this.designWidth = designWidht;
    this.designHeight = designHeight;

    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1 },
      enableSleeping: false
    });
    this.world = this.engine.world;
    // Matter.Engine.update(this.engine, 1000/60, 10);

    this.createBoundaries();
    this.createCastle();
    this.aimParabola = new AimParabola(this.app, this.container, this.engine.gravity.y);
    this.powerIndicator = new PowerIndicator(this.container);
    this.createCannon();

    Matter.Events.on(this.engine, 'collisionStart', this.onCollisionStart.bind(this));
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
      this.registerBlock(block);
    });
  }

  private createCannon(): void {
    this.cannon = new Cannon(this.app, this.container, this.world, this.onProjectileFire.bind(this), this.aimParabola, this.powerIndicator);
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

  public registerBlock(block: Block): void {
  if (block.body) {
    this.blockMap.set(block.body.id, block);
  }
  this.castleBlocks.add(block);
  this.gameObjects.add(block);
  block.onDestroy = this.removeBlock.bind(this);
}

public removeBlock(blockObject: GameObject): void {
  let block = blockObject as Block;
  if (block.body) {
    this.blockMap.delete(block.body.id);
  }
  this.castleBlocks.delete(block);
  this.gameObjects.delete(block);
}

  private update(ticker: Pixi.Ticker): void {
    /* const deltaTime = ticker.elapsedMS
    this.accumulator += deltaTime;

    let steps = 0;
    while (this.accumulator >= this.fixedTimeStep && steps < this.maxStepsPerFrame) {
      Matter.Engine.update(this.engine, this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
      steps++;
    } */
    const deltaTime = ticker.deltaTime;
    Matter.Engine.update(this.engine, Math.min(deltaTime, 1.1) * this.fixedTimeStep);
    TWEEN.update();
    this.gameObjects.forEach(obj => obj.update(ticker.deltaTime));
    //console.log(ticker.deltaTime, ticker.FPS);
  }

  private onCollisionStart(event: Matter.IEventCollision<Matter.Engine>): void {
    const pairs = event.pairs;
    const config = window.conf;
    const thresh1 = config.blockDamageThreshold;
    const thresh2 = config.blockDestructionThreshold;

    for (const pair of pairs) {
      const { bodyA, bodyB } = pair;
      const blockA = this.blockMap.get(bodyA.id);
      const blockB = this.blockMap.get(bodyB.id);
      if (!blockA && !blockB) continue;

      // Impact speed along collision normal
      const normal = pair.collision.normal;
      const relVel = Matter.Vector.sub(bodyA.velocity, bodyB.velocity);
      let impactSpeed = Matter.Vector.dot(relVel, normal);
      impactSpeed = Math.abs(impactSpeed);
      //if (impactSpeed <= 0) continue;      // moving apart

      let damage = 0;
      if (impactSpeed >= thresh2) damage = 2;
      else if (impactSpeed >= thresh1) damage = 1;

      if (damage > 0) {
        if (blockA) blockA.dealDamage(damage);
        if (blockB) blockB.dealDamage(damage);
      }
    }
  }

  public reset(): void {
    this.gameObjects.forEach(obj => obj.destroy());
    this.gameObjects.clear();
    this.castleBlocks.forEach(obj => obj.destroy());
    this.castleBlocks.clear();
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