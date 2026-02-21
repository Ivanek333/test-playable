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

  constructor(app: Pixi.Application, container: Pixi.Container, world: Matter.World, onFireCallback: (proj: Projectile) => void) {
    super(app, container, world);
    this.onFire = onFireCallback;

    const cannon_pos = window.conf.positions.cannon;
    const cannonTextureConfig = window.conf.textures.cannon;
    const cannonTexture = getTextureFromConfigPath(cannonTextureConfig.path) 
        || createFallbackTexture(app, (g) => g.rect(0,0,10,10).fill(0xbb00bb));
    
    const cannonSprite = new Pixi.Sprite(cannonTexture);
    cannonSprite.anchor.set(0.5);
    cannonSprite.width = cannonTextureConfig.w;
    cannonSprite.height = cannonTextureConfig.h;

    this.view.addChild(cannonSprite);
    this.view.position.set(cannon_pos.x, cannon_pos.y);
    //this.sprite.addChild(new Pixi.Graphics().circle(cannonSprite.pivot.x, cannonSprite.pivot.y, 3).fill({color: 0xff0000}));




    const barrel_pos = window.conf.positions.barrelLocal;
    const barrel_pivot = window.conf.positions.barrelPivot;
    const barrelTextureConfig = window.conf.textures.barrel
    const barrelTexture = getTextureFromConfigPath(barrelTextureConfig.path) 
        || createFallbackTexture(app, (g) => g.rect(0,0,10,10).fill(0xbb00bb));

    const barrelSprite = new Pixi.Sprite(barrelTexture);
    barrelSprite.width = barrelTextureConfig.w;
    barrelSprite.height = barrelTextureConfig.h;
      
    this.barrel = new Pixi.Container();
    this.barrel.addChild(barrelSprite);
    this.barrel.pivot.set(barrel_pivot.x, barrel_pivot.y);
    //this.barrel.addChild(new Pixi.Graphics().circle(this.barrel.pivot.x, this.barrel.pivot.y, 3).fill({color: 0xff0000}));
    this.barrel.position.set(barrel_pos.x, barrel_pos.y);
    this.barrel.zIndex -= 1
    this.view.addChild(this.barrel);

    this.body = Matter.Bodies.rectangle(cannon_pos.x, cannon_pos.y, cannonTextureConfig.w, cannonTextureConfig.h, { isStatic: true, label: 'cannon' });
    Matter.World.add(this.world, this.body);

    const canvas = app.renderer.canvas as HTMLCanvasElement;
    canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    canvas.addEventListener('pointerup', this.onPointerUp.bind(this));

    this.resetCannon();
  }

  private screenToWorld(screenX: number, screenY: number): Vector {
    const scale = this.container.scale.x;
    const worldX = (screenX - this.container.x) / scale;
    const worldY = (screenY - this.container.y) / scale;
    return { x: worldX, y: worldY };
  };

  private calculateDiff(pos: Vector): Vector {    
    //pos = this.app.renderer.events.pointer.global;
    const dx = this.view.x + this.barrel.x - pos.x;
    const dy = this.view.y + this.barrel.y - pos.y;
    return { x: dx, y: dy }
  }

  private checkDragBorderMin(diff: Vector): boolean {
    return Math.hypot(diff.x, diff.y) > window.conf.dragDistance.min;
  }
  private checkDragBorderMax(diff: Vector): boolean {
    return Math.hypot(diff.x, diff.y) < window.conf.dragDistance.max;
  }


  private resetCannon(): void {
    this.barrel.angle = -window.conf.barrelDefaultAngle;
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
    this.updateAngle(diff);
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    const pos = this.screenToWorld(e.offsetX, e.offsetY);
    const diff = this.calculateDiff(pos);
    if (!this.checkDragBorderMin(diff)) return this.resetCannon();

    this.isAimed = true;
    this.updatePower(diff);
    this.updateAngle(diff);

    const forceMagnitude = this.power * 0.1;
    const forceX = Math.cos(this.barrel.rotation) * forceMagnitude;
    const forceY = Math.sin(this.barrel.rotation) * forceMagnitude;

    this.fireProjectile({x: forceX, y: forceY});
    this.power = 0;
  }

  private updatePower(diff: Vector): void {
    const distance = Math.hypot(diff.x, diff.y);
    const mind = window.conf.dragDistance.min
    const maxd = window.conf.maxLaunchForceDistance
    const a = (distance - mind) / (maxd - mind) // lerp
    this.power = Math.min(a, 1) * window.conf.maxLaunchForce;
  }

  private updateAngle(diff: Vector): void {
    const min = -window.conf.barrelLimitAngle.max / 180 * Math.PI; // inverting
    const max = -window.conf.barrelLimitAngle.min / 180 * Math.PI;
    let mid = (min + max) / 2
    let angle = Math.atan2(diff.y, diff.x) - mid; // to cut off angle a bit better
    if (angle > Math.PI) angle -= 2*Math.PI;
    if (angle < -Math.PI) angle += 2*Math.PI;
    angle = Math.min(angle, max - mid);
    angle = Math.max(angle, min - mid);
    this.barrel.rotation = angle + mid;
  }

  private fireProjectile(force: Vector): void {
    const cannonPos = { x: this.view.x + this.barrel.x, y: this.view.y + this.barrel.y };
    const angle = this.barrel.rotation;
    const width = this.barrel.getChildAt<Pixi.Sprite>(0).width - this.barrel.pivot.x;
    const tipX = cannonPos.x + Math.cos(angle) * width;
    const tipY = cannonPos.y + Math.sin(angle) * width;

    let projectile = new Projectile(this.app, this.container, this.world, tipX, tipY);
    projectile.fire(force);
    this.onFire(projectile);
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);
    
  }
}