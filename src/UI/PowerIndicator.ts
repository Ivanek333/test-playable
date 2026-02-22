import * as Pixi from 'pixi.js';

export class PowerIndicator {
  private container: Pixi.Container;
  private background: Pixi.Graphics;
  private fillBar: Pixi.Graphics;
  private maxPower: number;

  constructor(parent: Pixi.Container) {
    const posLoc = window.conf.positions.powerIndicatorLocal;
    const x = window.conf.positions.cannon.x + posLoc.x;
    const y = window.conf.positions.cannon.y + posLoc.y;
    const size = window.conf.positions.powerIndicatorSize;
    this.maxPower = window.conf.maxLaunchPower;
    this.container = new Pixi.Container();
    this.container.position.set(x, y);
    this.container.zIndex = 20;
    parent.addChild(this.container);

    this.background = new Pixi.Graphics()
      .roundRect(0, 0, size.x, size.y, size.y / 2)
      .fill({ color: 0x000000, alpha: 0.5 });
    this.container.addChild(this.background);

    this.fillBar = new Pixi.Graphics();
    this.container.addChild(this.fillBar);
    this.container.eventMode = 'none';
    this.setVisible(false);
  }

  public setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  public updatePower(power: number): void {
    power = Math.min(power, this.maxPower);
    const percent = power / this.maxPower;
    const width = this.background.width * percent;

    this.fillBar.clear();

    const gradient = new Pixi.FillGradient({
        type: 'linear',
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        colorStops: [
            { offset: 0, color: 0xff0000 },
            { offset: 1, color: 0xff0000 + (Math.trunc(percent * 255) << 8) }
        ],
        textureSpace: 'local'
    });

    this.fillBar.roundRect(0, 0, width, this.background.height, this.background.height / 2)
      .fill(gradient);
  }

  public resize(): void {
    const posLoc = window.conf.positions.powerIndicatorLocal;
    this.container.position.set(window.conf.positions.cannon.x + posLoc.x, window.conf.positions.cannon.y + posLoc.y);
  }
}