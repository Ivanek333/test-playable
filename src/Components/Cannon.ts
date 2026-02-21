import Matter, { Vector } from 'matter-js';
import * as Pixi from 'pixi.js';
import { GameObject } from './GameObject';
import { Projectile } from './Projectile';
import { createFallbackTexture, getTextureFromConfigPath } from '../utils/AssetManager';

export class Cannon extends GameObject {
  private barrel: Pixi.Container;
  private power: number = 0;
  private isDragging: boolean = false;
  private isAimed: boolean = false;
  private onFire: (proj: Projectile) => void;
  private barrel_size = { w: 70, h: 40 };

  constructor(app: Pixi.Application, container: Pixi.Container, world: Matter.World, x: number, y: number, onFireCallback: (proj: Projectile) => void) {
    super(app, container, world);
    this.onFire = onFireCallback;

    let cannon_size = { w: 100, h: 60 }
    const base = new Pixi.Graphics()
      .rect(-cannon_size.w/2, -cannon_size.h/2, cannon_size.w, cannon_size.h)
      .fill({ color: 0x654321 });
    this.sprite.addChild(base);
    this.sprite.addChild(new Pixi.Graphics().circle(0, 0, 3).fill({color: 0xff0000}));

    this.barrel = new Pixi.Container();
    const barrelGraphic = new Pixi.Graphics()
      .rect(0, -this.barrel_size.h/2, this.barrel_size.w, this.barrel_size.h)
      .fill({ color: 0x987654 });
    this.barrel.addChild(barrelGraphic);
    this.barrel.addChild(new Pixi.Graphics().circle(0, 0, 3).fill({color: 0xff0000}));
    this.barrel.position.set(cannon_size.w/4, -cannon_size.h/4);
    this.sprite.addChild(this.barrel);

    this.sprite.position.set(x, y);
    this.body = Matter.Bodies.rectangle(x, y, cannon_size.w, cannon_size.h, { isStatic: true, label: 'cannon' });
    Matter.World.add(this.world, this.body);

    const canvas = app.renderer.canvas as HTMLCanvasElement;
    canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
  }

  private screenToWorld(screenX: number, screenY: number): Vector {
    const scale = this.container.scale.x;
    const worldX = (screenX - this.container.x) / scale;
    const worldY = (screenY - this.container.y) / scale;
    return { x: worldX, y: worldY };
  };

  private calculateDiff(pos: Vector): Vector {    
    //pos = this.app.renderer.events.pointer.global;
    const dx = this.sprite.x + this.barrel.x - pos.x;
    const dy = this.sprite.y + this.barrel.y - pos.y;
    return { x: dx, y: dy }
  }

  private checkDragBorderMin(diff: Vector): boolean {
    return Math.hypot(diff.x, diff.y) > window.GAME_CONFIG.dragDistance.min;
  }
  private checkDragBorderMax(diff: Vector): boolean {
    return Math.hypot(diff.x, diff.y) < window.GAME_CONFIG.dragDistance.max;
  }


  private resetCannon(): void {
    this.barrel.angle = window.GAME_CONFIG.barrelDefaultRotationDeg;
    this.power = 0;
    this.isAimed = false;
  }

  private onPointerDown(e: PointerEvent): void {
    const pos = this.screenToWorld(e.offsetX, e.offsetY);
    const diff = this.calculateDiff(pos);
    if (this.checkDragBorderMax(diff)) {
      this.isDragging = true;
      this.isAimed = true;
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    const pos = this.screenToWorld(e.offsetX, e.offsetY);
    const diff = this.calculateDiff(pos);
    if (!this.checkDragBorderMin(diff)) return this.resetCannon(); // reset without losing drag

    this.isAimed = true;
    this.updatePower(diff);
    const angle = Math.atan2(diff.y, diff.x);
    this.barrel.rotation = angle;
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    const pos = this.screenToWorld(e.offsetX, e.offsetY);
    const diff = this.calculateDiff(pos);
    if (!this.checkDragBorderMin(diff)) return this.resetCannon();

    this.isAimed = true;
    this.updatePower(diff);
    const angle = Math.atan2(diff.y, diff.x);
    this.barrel.rotation = angle;

    const forceMagnitude = this.power * 0.1;
    const forceX = Math.cos(angle) * forceMagnitude;
    const forceY = Math.sin(angle) * forceMagnitude;

    this.fireProjectile(forceX, forceY);
    this.power = 0;
  }

  private updatePower(diff: Vector): void {
    const distance = Math.hypot(diff.x, diff.y);
    const mind = window.GAME_CONFIG.dragDistance.min
    const maxd = window.GAME_CONFIG.maxLaunchForceDistance
    const a = (distance - mind) / (maxd - mind) // lerp
    this.power = Math.min(a, 1) * window.GAME_CONFIG.maxLaunchForce;
  }

  private fireProjectile(forceX: number, forceY: number): void {
    const cannonPos = { x: this.sprite.x + this.barrel.x, y: this.sprite.y + this.barrel.y };
    const angle = this.barrel.rotation;
    const tipX = cannonPos.x + Math.cos(angle) * this.barrel_size.w;
    const tipY = cannonPos.y + Math.sin(angle) * this.barrel_size.w;

    let projectile = new Projectile(this.app, this.container, this.world, tipX, tipY);
    projectile.fire(forceX, forceY);
    this.onFire(projectile);
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);
    
  }
}