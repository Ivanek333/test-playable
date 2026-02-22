import * as Pixi from 'pixi.js';

export class AmmoBar {
  private container: Pixi.Container;
  private background: Pixi.Graphics;
  private fill: Pixi.Graphics;
  private barWidth: number;
  private barHeight: number;

  constructor(parent: Pixi.Container) {
    const posLoc = window.conf.positions.ammoBarLocal;
    const x = window.conf.positions.cannon.x + posLoc.x;
    const y = window.conf.positions.cannon.y + posLoc.y;
    const size = window.conf.positions.ammoBarSize;

    this.barWidth = size.x;
    this.barHeight = size.y;

    this.container = new Pixi.Container();
    this.container.position.set(x, y);
    this.container.zIndex = 20;
    this.container.eventMode = 'none';
    parent.addChild(this.container);

    this.background = new Pixi.Graphics()
      .roundRect(0, 0, size.x, size.y, size.y / 2)
      .fill({ color: 0x333333, alpha: 0.8 });
    this.container.addChild(this.background);

    this.fill = new Pixi.Graphics();
    this.container.addChild(this.fill);

    const border = new Pixi.Graphics()
      .roundRect(0, 0, size.x, size.y, size.y / 2)
      .stroke({ color: 0xffffff, width: 2 });
    this.container.addChild(border);
  }

  public setAmmo(current: number, max: number): void {
    const percent = Math.max(0, Math.min(1, current / max));
    const fillWidth = percent * this.barWidth;
    const colorAdd = Math.trunc(percent < 0.5 ? percent * 510 : (1-percent) * 510) & (1<<8 - 1)
    this.fill.clear();
    this.fill
      .roundRect(0, 0, fillWidth, this.barHeight, this.barHeight / 2)
      .fill({ color: percent < 0.5 ? (0xff0000 | colorAdd<<8) : (0x00ff00 | colorAdd<<16) });
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }

  public resize(): void {
    this.container.position.set(window.conf.positions.cannon.x + window.conf.positions.ammoBarLocal.x, 
        window.conf.positions.cannon.y + window.conf.positions.ammoBarLocal.y);
  }
}