import Matter, { Vector } from 'matter-js';
import * as Pixi from 'pixi.js';
import { GameObject } from './GameObject';
import { Projectile } from './Projectile';
import { createFallbackTexture, getTextureFromConfigPath } from '../utils/AssetManager';
import { AimParabola } from '../UI/AimParabola';
import { PowerIndicator } from '../UI/PowerIndicator';
import { Tutorial } from '../UI/Tutorial';
import { AmmoBar } from '../UI/AmmoBar';

export class Cannon extends GameObject {
  private barrel: Pixi.Container;
  private dragArea: Pixi.Graphics;
  private power: number = 0;
  private curShots: number = 0;
  private isDragging: boolean = false;
  private isAimed: boolean = false;
  private isFiring: boolean = false;
  private onFire: (proj: Projectile) => void;
  private onAmmoSpent: () => void;
  private currentProjectile: Projectile | undefined;
  private aimParabola: AimParabola;
  private powerIndicator: PowerIndicator;
  private tutorial: Tutorial;
  private ammoBar: AmmoBar;

  constructor(app: Pixi.Application, 
        container: Pixi.Container,
        world: Matter.World,
        onFireCallback: (proj: Projectile) => void, 
        onAmmoSpentCallback: () => void,
        aimParabola: AimParabola, 
        powerIndicator: PowerIndicator,
        tutorial: Tutorial,
        ammoBar: AmmoBar
      ) {
    super(app, container, world);
    this.onFire = onFireCallback;
    this.onAmmoSpent = onAmmoSpentCallback;
    this.aimParabola = aimParabola;
    this.powerIndicator = powerIndicator;
    this.tutorial = tutorial;
    this.ammoBar = ammoBar;


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
    this.barrel.position.set(barrel_pos.x, barrel_pos.y);
    this.barrel.zIndex -= 1
    this.view.addChild(this.barrel);

    this.dragArea = new Pixi.Graphics();
    this.dragArea.position.set(barrel_pos.x, barrel_pos.y);
    this.dragArea.visible = false;
    this.view.addChildAt(this.dragArea, 0);
    this.drawDragArea();

    this.body = Matter.Bodies.rectangle(cannon_pos.x, cannon_pos.y, cannonTextureConfig.w, cannonTextureConfig.h, { isStatic: true, label: 'cannon' });
    Matter.World.add(this.world, this.body);

    const canvas = app.renderer.canvas as HTMLCanvasElement;
    canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    canvas.addEventListener('pointerup', this.onPointerUp.bind(this));

    this.resetCannon();
  }

  private drawDragArea(): void {
    this.dragArea.clear();
    this.dragArea.fillStyle = { color: 0x000000, alpha: 0.2 };
    this.dragArea.strokeStyle = { color: 0xffffff, alpha: 0.3, width: 1 };
    this.dragArea.stroke();
    const startAngle = Math.PI - window.conf.barrelLimitAngle.max / 180 * Math.PI;
    const endAngle = Math.PI - window.conf.barrelLimitAngle.min / 180 * Math.PI;
    const innerRadius = window.conf.dragDistance.min;
    const outerRadius = window.conf.dragDistance.max;
    const cx = 0;
    const cy = 0;
    this.dragArea.moveTo(
      cx + outerRadius * Math.cos(startAngle),
      cy + outerRadius * Math.sin(startAngle)
    );
    this.dragArea.arc(cx, cy, outerRadius, startAngle, endAngle, false);
    this.dragArea.lineTo(
      cx + innerRadius * Math.cos(endAngle),
      cy + innerRadius * Math.sin(endAngle)
    );
    this.dragArea.arc(cx, cy, innerRadius, endAngle, startAngle, true);
    this.dragArea.closePath();
    this.dragArea.fill();
  }

  private screenToWorld(screenX: number, screenY: number): Vector {
    const scale = this.container.scale.x;
    const worldX = (screenX - this.container.x) / scale;
    const worldY = (screenY - this.container.y) / scale;
    return { x: worldX, y: worldY };
  };

  private calculateDiff(pos: Vector): Vector {
    // console.log("cursor pos:", pos);
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


  private resetCannon(resetAngle: boolean = true): void {
    if (resetAngle)
      this.barrel.angle = -window.conf.barrelDefaultAngle;
    this.ammoBar.setAmmo(window.conf.ammoAmount - this.curShots, window.conf.ammoAmount);
    this.power = 0;
    this.isAimed = false;
    this.dragArea.visible = false;
    this.aimParabola.hide();
    this.powerIndicator.setVisible(false);
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.isFiring || this.curShots >= window.conf.ammoAmount) return;
    const pos = this.screenToWorld(e.offsetX, e.offsetY);
    const diff = this.calculateDiff(pos);
    if (this.checkDragBorderMax(diff)) {
      this.isDragging = true;
      this.isAimed = true;
    }
    this.tutorial.stopTutorial();
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.isFiring || !this.isDragging || this.curShots >= window.conf.ammoAmount) return;
    const pos = this.screenToWorld(e.offsetX, e.offsetY);
    const diff = this.calculateDiff(pos);
    if (!this.checkDragBorderMin(diff)) return this.resetCannon(); // reset without losing drag

    this.isAimed = true;
    this.updatePower(diff);
    this.updateAngle(diff);
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.isFiring || !this.isDragging || this.curShots >= window.conf.ammoAmount) return;
    this.isDragging = false;
    const pos = this.screenToWorld(e.offsetX, e.offsetY);
    const diff = this.calculateDiff(pos);
    if (!this.checkDragBorderMin(diff)) return this.resetCannon();

    this.isAimed = true;
    this.updatePower(diff);
    this.updateAngle(diff);
    this.fireProjectile();
    this.power = 0;
  }

  private updatePower(diff: Vector): void {
    const distance = Math.hypot(diff.x, diff.y);
    const mind = window.conf.dragDistance.min
    const maxd = window.conf.maxLaunchPowerDistance
    const a = (distance - mind) / (maxd - mind) // lerp
    this.power = Math.min(a, 1) * window.conf.maxLaunchPower;
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

  private fireProjectile(): void {
    const cannonPos = { x: this.view.x + this.barrel.x, y: this.view.y + this.barrel.y };
    const angle = this.barrel.rotation;
    const width = this.barrel.getChildAt<Pixi.Sprite>(0).width - this.barrel.pivot.x;
    const tipX = cannonPos.x + Math.cos(angle) * width;
    const tipY = cannonPos.y + Math.sin(angle) * width;

    const velMagnitude = this.power;
    const velX = Math.cos(this.barrel.rotation) * velMagnitude;
    const velY = Math.sin(this.barrel.rotation) * velMagnitude;

    this.currentProjectile = new Projectile(this.app, this.container, this.world, tipX, tipY);
    this.currentProjectile.fire({ x: velX, y: velY });
    this.isFiring = true;
    this.curShots += 1;
    this.resetCannon(false);
    this.onFire(this.currentProjectile);
  }

  private updateAim(): void {
    const cannonPos = { x: this.view.x + this.barrel.x, y: this.view.y + this.barrel.y };
    const angle = this.barrel.rotation;
    const width = this.barrel.getChildAt<Pixi.Sprite>(0).width - this.barrel.pivot.x;
    const tipX = cannonPos.x + Math.cos(angle) * width;
    const tipY = cannonPos.y + Math.sin(angle) * width;

    this.aimParabola.update(tipX, tipY, angle, this.power);
    this.powerIndicator.setVisible(true);
    this.powerIndicator.updatePower(this.power);
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);
    if (this.isFiring && this.currentProjectile?.isAtRest()) {
      this.isFiring = false;
      if (this.curShots >= window.conf.ammoAmount) {
        this.onAmmoSpent();
      }
    }
    if (this.isAimed) {
      this.updateAim();
      this.dragArea.visible = true;
    }
  }

  public stopGaming(): void {
    this.isFiring = false;
    this.curShots = window.conf.ammoAmount;
  }
}