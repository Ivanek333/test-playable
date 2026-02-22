import * as Pixi from 'pixi.js';
import { createFallbackTexture, getTextureFromConfigPath } from '../utils/AssetManager';

export class TilingBackground {
  private container: Pixi.Container;
  private texture: Pixi.Texture;
  private tileWidth: number;
  private tileHeight: number;
  private tiles: Pixi.Sprite[] = [];
  private topFog: Pixi.Graphics;
  private bottomFog: Pixi.Graphics;

  constructor(app: Pixi.Application, parent: Pixi.Container) {
    this.container = new Pixi.Container();
    this.container.eventMode = 'none';
    parent.addChild(this.container);
    
    const textureConfig = window.conf.textures.background;
    this.tileWidth = textureConfig.w;
    this.tileHeight = textureConfig.h;
    this.texture = getTextureFromConfigPath(textureConfig.path) 
        || createFallbackTexture(app, (g) => g.rect(0, 0, textureConfig.w, textureConfig.h).fill(0xbb00bb));
    
    this.topFog = new Pixi.Graphics();
    this.topFog.zIndex = 15;
    this.bottomFog = new Pixi.Graphics();
    this.bottomFog.zIndex = 15;
    this.container.addChild(this.topFog);
    this.container.addChild(this.bottomFog);
  }

  public updateBounds(left: number, right: number): void {
    this.tiles.forEach(t => t.destroy());
    this.tiles.length = 0;

    const startCol = Math.floor(left / this.tileWidth);
    const endCol = Math.ceil(right / this.tileWidth);

    for (let col = startCol; col < endCol; col++) {
        const x = col * this.tileWidth;
        const sprite = new Pixi.Sprite(this.texture);
        sprite.position.set(x, window.conf.backgroundY);
        sprite.width = this.tileWidth;
        sprite.height = this.tileHeight;
        this.container.addChild(sprite);
        this.tiles.push(sprite);
    }

    const totalOffset = 4;
    const topY = window.conf.backgroundY
    const fogH = window.conf.fogH;
    const gradientTop = new Pixi.FillGradient({
        type: 'linear',
        start: { x: 0, y: 1 },
        end: { x: 0, y: 0 },
        colorStops: [
            { offset: 0, color: 'rgba(0,0,0,0)' },
            { offset: 1/totalOffset, color: 'rgba(0,0,0,1)' },
            { offset: 1, color: 'rgba(0,0,0,1)' }
        ],
        textureSpace: 'local'
    });
    const gradientBottom = new Pixi.FillGradient({
        type: 'linear',
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        colorStops: [
            { offset: 0, color: 'rgba(0,0,0,0)' },
            { offset: 1/totalOffset, color: 'rgba(0,0,0,1)' },
            { offset: 1, color: 'rgba(0,0,0,1)' }
        ],
        textureSpace: 'local'
    });
    this.topFog.clear();
    this.topFog.rect(0, topY - fogH * (totalOffset - 1), right - left, fogH * totalOffset).fill(gradientTop);
    console.log(topY - fogH * (totalOffset - 1), right - left, fogH * totalOffset)
    this.bottomFog.clear();
    this.bottomFog.roundRect(0, topY + this.tileHeight - fogH, right - left, fogH * totalOffset).fill(gradientBottom);
    console.log(topY + this.tileHeight - fogH, right - left, fogH * totalOffset)
  }

  public destroy(): void {
    this.tiles.forEach(t => t.destroy());
    this.tiles = [];
    this.container.destroy();
  }
}