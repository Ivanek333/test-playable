import * as Pixi from 'pixi.js';
import { createFallbackTexture, getTextureFromConfigPath } from '../utils/AssetManager';
import { easeInOutCubic, Tween, TweenManager } from '../utils/Tween';
import { Vector } from 'matter-js';

export class Tutorial {
    private container: Pixi.Container;
    private tweenManager: TweenManager;
    private handSprite: Pixi.Sprite;
    private moveOut?: Tween;
    private moveBack?: Tween;
    private tutorialActive: boolean = true;
    private startPos: { x: number, y: number };
    private endPos: { x: number, y: number };

    constructor (app: Pixi.Application, container: Pixi.Container, tweenManager: TweenManager) {
        this.container = container;
        this.tweenManager = tweenManager;

        const textureConfig = window.conf.textures.hand
        const texture = getTextureFromConfigPath(textureConfig.path) 
            || createFallbackTexture(app, (g) => g.circle(0, 0, 10).fill(0xbb00bb));
            
        this.startPos = { 
            x: window.conf.positions.tutorialLocalStart.x + window.conf.positions.cannon.x,
            y: window.conf.positions.tutorialLocalStart.y + window.conf.positions.cannon.y 
        }
        this.endPos = { 
            x: window.conf.positions.tutorialLocalEnd.x + window.conf.positions.cannon.x,
            y: window.conf.positions.tutorialLocalEnd.y + window.conf.positions.cannon.y
        }
        this.handSprite = new Pixi.Sprite(texture);
        this.handSprite.anchor.set(0.5);
        this.handSprite.position.set(this.startPos.x, this.startPos.y);
        this.handSprite.width = textureConfig.w;
        this.handSprite.height = textureConfig.h;
        this.handSprite.eventMode = 'none';
        this.handSprite.zIndex = 20;
        this.container.addChild(this.handSprite);
    }

    public startTutorial(): void {
        const durationOut = 1500;
        const durationBack = 50;
        
        this.moveOut = new Tween(this.handSprite.position, 
            this.startPos, this.endPos, durationOut, 
            easeInOutCubic, 
            undefined,
            () => { this.moveBack?.start(); }
        );
        this.moveBack = new Tween(this.handSprite.position, 
            this.endPos, this.startPos, durationBack, 
            easeInOutCubic, 
            undefined,
            () => { this.moveOut?.start(); }
        );
        
        this.tweenManager.add(this.moveOut);
        this.tweenManager.add(this.moveBack!); 
        this.moveOut.start();
    }

    public stopTutorial(): void {
        if (!this.tutorialActive) return;
        this.tutorialActive = false;
        if (this.moveOut) {
            this.moveOut.stop();
        }
        if (this.moveBack) {
            this.moveBack.stop();
        }
        if (this.handSprite) {
            this.handSprite.visible = false;
        }
    }

    public shift(vec: Vector): void {
        this.startPos.x += vec.x; this.startPos.y += vec.y;
        this.endPos.x += vec.x; this.endPos.y += vec.y;
        
        if (this.moveOut)
        {
            this.moveOut.startValues['x'] = this.startPos.x;
            this.moveOut.startValues['y'] = this.startPos.y;
            this.moveOut.targetValues['x'] = this.endPos.x;
            this.moveOut.targetValues['y'] = this.endPos.y;
        }
        if (this.moveBack)
        {
            this.moveBack.startValues['x'] = this.endPos.x;
            this.moveBack.startValues['y'] = this.endPos.y;
            this.moveBack.targetValues['x'] = this.startPos.x;
            this.moveBack.targetValues['y'] = this.startPos.y;
        }
    }
}