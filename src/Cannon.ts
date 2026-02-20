import Matter from 'matter-js';
import * as Pixi from 'pixi.js';
import { GameObject } from './GameObject';
import { Projectile } from './Projectile';

export class Cannon extends GameObject {
  private barrel: Pixi.Container;
  private base: Pixi.Graphics;
  private power: number = 0;
  private isDragging: boolean = false;
  private dragStart: { x: number; y: number } = { x: 0, y: 0 };
  private onFire: (forceX: number, forceY: number) => void;

  constructor(app: Pixi.Application, world: Matter.World, x: number, y: number, onFireCallback: (forceX: number, forceY: number) => void) {
    super(app, world);
    this.onFire = onFireCallback;

    this.base = new Pixi.Graphics()
      .rect(-25, -15, 50, 30)
      .fill({ color: 0x654321 });
    this.sprite.addChild(this.base);

    this.barrel = new Pixi.Container();
    const barrelGraphic = new Pixi.Graphics()
      .rect(0, -8, 50, 16)
      .fill({ color: 0x987654 });
    this.barrel.addChild(barrelGraphic);
    this.barrel.position.set(20, 0);
    this.sprite.addChild(this.barrel);

    this.sprite.position.set(x, y);
    app.stage.addChild(this.sprite);

    this.body = Matter.Bodies.rectangle(x, y, 100, 40, { isStatic: true, label: 'cannon' });
    Matter.World.add(this.world, this.body);

    const canvas = app.renderer.canvas as HTMLCanvasElement;
    canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
  }

  private onPointerDown(e: PointerEvent): void {
    const pos = this.app.renderer.events.pointer.global;
    const dx = pos.x - this.sprite.x;
    const dy = pos.y - this.sprite.y;
    if (Math.hypot(dx, dy) < 60) {
      this.isDragging = true;
      this.dragStart = { x: pos.x, y: pos.y };
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    const pos = this.app.renderer.events.pointer.global;
    const dx = pos.x - this.sprite.x;
    const dy = pos.y - this.sprite.y;
    const angle = Math.atan2(dy, dx);
    this.barrel.rotation = angle;

    const distance = Math.hypot(dx, dy);
    this.power = distance / 100;
    if (window.GAME_CONFIG) {
        this.power = Math.min(this.power, window.GAME_CONFIG.maxLaunchForce);
        // console.log('launch power: ', this.power, 'with min: ', window.GAME_CONFIG.maxLaunchForce);
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    const angle = this.barrel.rotation;
    const forceMagnitude = this.power * 0.1;
    const forceX = Math.cos(angle) * forceMagnitude;
    const forceY = Math.sin(angle) * forceMagnitude;

    this.onFire(forceX, forceY);
    this.power = 0;
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);
    
  }
}