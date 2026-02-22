import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import { GameObject } from './GameObject';
import { Cannon } from './Cannon';
import { Projectile } from './Projectile';
import { Block } from './Block';
import { AimParabola } from '../UI/AimParabola';
import { PowerIndicator } from '../UI/PowerIndicator';
import { Tutorial } from '../UI/Tutorial';
import { TweenManager } from '../utils/Tween';
import { Target } from './Target';
import { GameOverlay } from '../UI/GameOverlay';
import { AmmoBar } from '../UI/AmmoBar';
import { TilingBackground } from '../UI/Background';

export class GameManager {
  private app: Pixi.Application;
  private container: Pixi.Container;
  private designWidth: number;
  private designHeight: number;
  private leftWorld: number;
  private rightWorld: number;
  private engine: Matter.Engine;
  private world: Matter.World;
  private tweenManager: TweenManager;
  private gameObjects: Set<GameObject> = new Set();
  private cannon!: Cannon;
  private blockMap: Map<number, Block> = new Map(); 
  private castleBlocks: Set<Block> = new Set();
  private resizeBoundaries!: () => void;
  private fixedTimeStep = 16.667;
  private aimParabola: AimParabola;
  private powerIndicator: PowerIndicator;
  private tutorial: Tutorial;
  private target: Target;
  private gameOverlay: GameOverlay;
  private ammoBar: AmmoBar;
  private background: TilingBackground;

  constructor(app: Pixi.Application, container: Pixi.Container, designWidht: number, designHeight: number) {
    this.app = app;
    this.container = container;
    this.designWidth = designWidht;
    this.designHeight = designHeight;
    this.tweenManager = new TweenManager();
    this.gameOverlay = new GameOverlay(this.tweenManager);
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1 },
      enableSleeping: false,
      positionIterations: 12,
      velocityIterations: 6,
      constraintIterations: 4
    });
    this.world = this.engine.world;
    // Matter.Engine.update(this.engine, 1000/60, 10);
    
    this.leftWorld = -container.x / container.scale.x;
    this.rightWorld = (window.innerWidth - this.container.x) / this.container.scale.x;
    window.conf.positions.cannon.x += this.leftWorld;
    window.conf.positions.castle.x += this.rightWorld;

    this.background = new TilingBackground(this.app, this.container);
    this.background.updateBounds(this.leftWorld, this.rightWorld);

    this.createBoundaries();
    this.createCastle();
    this.target = new Target(this.app, this.container, this.world);
    this.gameObjects.add(this.target);
    this.aimParabola = new AimParabola(this.app, this.container, this.engine.gravity.y);
    this.powerIndicator = new PowerIndicator(this.container);
    this.tutorial = new Tutorial(this.app, this.container, this.tweenManager);
    this.ammoBar = new AmmoBar(this.container);
    this.createCannon();

    Matter.Events.on(this.engine, 'collisionStart', this.onCollisionStart.bind(this));
    this.app.ticker.add(this.update.bind(this));
    this.tutorial.startTutorial();
  }

  private createBoundaries(): void {
    const groundHeight = window.conf.groundHeight;
    const groundY = this.designHeight - groundHeight;
    const groundWidth = this.rightWorld - this.leftWorld + 200;

    const ground = Matter.Bodies.rectangle(
      this.designWidth / 2,
      groundY + groundHeight / 2,
      groundWidth,
      groundHeight,
      { isStatic: true, restitution: 0.5, label: 'ground' }
    );

    const ceiling = Matter.Bodies.rectangle(
      this.designWidth / 2,
      -2000,
      groundWidth,
      groundHeight,
      { isStatic: true, restitution: 0.5, label: 'ground' }
    );

    const wallHeight = this.designHeight + 2000;
    const wallOffset = (this.designHeight - 2000) / 2;

    const leftWall = Matter.Bodies.rectangle(
      this.leftWorld - 100,
      wallOffset,
      20,
      wallHeight,
      { isStatic: true, label: 'wall' }
    );

    const rightWall = Matter.Bodies.rectangle(
      this.rightWorld + 100,
      wallOffset,
      20,
      wallHeight,
      { isStatic: true, label: 'wall' }
    );

    Matter.World.add(this.world, [ground, leftWall, rightWall]);

    this.resizeBoundaries = () => {
      const groundWidth = this.rightWorld - this.leftWorld + 200;
      Matter.Body.scale(ground, groundWidth / ground.bounds.min.x, 1);
      Matter.Body.scale(ceiling, groundWidth / ground.bounds.min.x, 1);
      Matter.Body.setPosition(leftWall, { x: this.leftWorld - 100, y: wallOffset })
      Matter.Body.setPosition(rightWall, { x: this.rightWorld + 100, y: wallOffset })
    }
  }

  private createCastle(): void {
    window.conf.blocks.forEach(data => {
      const block = new Block(this.app, this.container, this.world, data.t, data.x + window.conf.positions.castle.x, -data.y + window.conf.positions.castle.y, data.r, data.d);
      this.registerBlock(block);
    });
  }

  private createCannon(): void {
    this.cannon = new Cannon(
      this.app, 
      this.container, 
      this.world,
      this.onProjectileFire.bind(this),
      this.onAmmoSpent.bind(this), 
      this.aimParabola, 
      this.powerIndicator,
      this.tutorial,
      this.ammoBar);
    this.gameObjects.add(this.cannon);
  }

  private onProjectileFire(proj: Projectile): void {
    /*if (this.projectile) {
      this.projectile.destroy();
      this.gameObjects.delete(this.projectile);
    }*/
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
    const deltaRatio = ticker.deltaTime;
    if (deltaRatio <= 0.5) {
      Matter.Engine.update(this.engine, Math.min(deltaRatio, 1) * this.fixedTimeStep);
      this.gameObjects.forEach(obj => obj.update(deltaRatio));
    } else for(let i = 0; i < 2; i++) {
      Matter.Engine.update(this.engine, Math.min(deltaRatio/2, 1) * this.fixedTimeStep);
      this.gameObjects.forEach(obj => obj.update(deltaRatio));
    }
    this.tweenManager.update();
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
      if ([bodyA, bodyB].some(b => b.label == 'target') && 
          [bodyA, bodyB].some(b => b.label == 'projectile')) {
        this.onTargetHit();
        continue;
      }
      if (!blockA && !blockB) continue;

      // impact speed along collision normal
      const normal = pair.collision.normal;
      const relVel = Matter.Vector.sub(bodyA.velocity, bodyB.velocity);
      let impactSpeed = Matter.Vector.dot(relVel, normal);
      impactSpeed = Math.abs(impactSpeed);

      let damage = 0;
      if (impactSpeed >= thresh2) damage = 2;
      else if (impactSpeed >= thresh1) damage = 1;

      if (damage > 0) {
        if (blockA) blockA.dealDamage(damage);
        if (blockB) blockB.dealDamage(damage);
      }
    }
  }

  private onTargetHit(): void {
    this.target.destroy();
    this.gameObjects.delete(this.target);
    this.cannon.stopGaming();
    this.gameOverlay.show('win');
  }

  private onAmmoSpent(): void {
    this.gameOverlay.show('lose');
  }

  public reset(): void {
    this.gameObjects.forEach(obj => obj.destroy());
    this.gameObjects.clear();
    this.castleBlocks.forEach(obj => obj.destroy());
    this.castleBlocks.clear();

    this.createBoundaries();
    this.createCastle();
    this.target = new Target(this.app, this.container, this.world);
    this.gameObjects.add(this.target);
    this.createCannon();
  }

  public destroy(): void {
    this.gameObjects.forEach(obj => obj.destroy());
    this.gameObjects.clear();
    Matter.World.clear(this.world, true);
    Matter.Engine.clear(this.engine);
  }
  
  public onResize(): void {
    const lastLeft = this.leftWorld;
    const lastRight = this.rightWorld;
    this.leftWorld = -this.container.x / this.container.scale.x;
    this.rightWorld = (window.innerWidth - this.container.x) / this.container.scale.x;
    const leftDif = this.leftWorld - lastLeft;
    const rightDif = this.rightWorld - lastRight;
    window.conf.positions.cannon.x += leftDif;
    window.conf.positions.castle.x += rightDif;
    this.resizeBoundaries();
    this.cannon.shift({x: leftDif, y: 0});
    this.powerIndicator.resize();
    this.ammoBar.resize();
    this.tutorial.shift({x: leftDif, y: 0});
    this.target.shift({x: rightDif, y: 0});
    this.castleBlocks.forEach(block => {
      block.shift({x: rightDif, y: 0});
    });
    this.background.updateBounds(this.leftWorld, this.rightWorld);
  }
}