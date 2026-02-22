import * as Pixi from 'pixi.js';

export class AimParabola {
  private app: Pixi.Application;
  private container: Pixi.Container;
  private dots: Pixi.Sprite[] = [];
  private maxDots: number = 15;
  private timeStep: number = 2;
  private gravity: number;

  constructor(app: Pixi.Application, container: Pixi.Container, gravity: number) {
    this.app = app;
    this.container = container;
    this.gravity = gravity;

    const texture = this.createDotTexture();
    for (let i = 0; i < this.maxDots; i++) {
      const dot = new Pixi.Sprite(texture);
      dot.anchor.set(0.5);
      dot.visible = false;
      dot.eventMode = 'none';
      this.dots.push(dot);
      this.container.addChild(dot);
    }
  }

  private createDotTexture(): Pixi.Texture {
    const graphics = new Pixi.Graphics();
    graphics.circle(0, 0, 6).fill(0xFFFFFF);
    return this.app.renderer.generateTexture(graphics);
  }

  public update(startX: number, startY: number, angle: number, power: number): void {
    /*const projDensity = window.conf.projectileDensity;
    const area = Math.PI * window.conf.textures.projectile.w * window.conf.textures.projectile.h / 4;
    const mass = area * projDensity;
    const speed = power * 215 / mass; // 215 for some reason*/
    const speed = power*2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    let t = 0;
    for (let i = 0; i < this.maxDots; i++) {
      t = (i + 1) * this.timeStep;
      const x = startX + vx * t;
      const y = startY + vy * t + 0.5 * this.gravity * t * t;

      if (y > window.conf.designResolution.h) {
        this.hideDotsFrom(i);
        break;
      }

      const dot = this.dots[i];
      dot.visible = true;
      dot.position.set(x, y);

      const progress = t / (this.maxDots * this.timeStep);
      dot.alpha = 1 - progress;
      dot.scale.set(1 - progress * 0.8);
    }
  }

  private hideDotsFrom(index: number): void {
    for (let i = index; i < this.maxDots; i++) {
      this.dots[i].visible = false;
    }
  }

  public hide(): void {
    this.dots.forEach(dot => dot.visible = false);
  }
}