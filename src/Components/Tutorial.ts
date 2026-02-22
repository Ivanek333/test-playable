import * as Pixi from 'pixi.js';
import { createFallbackTexture, getTextureFromConfigPath } from '../utils/AssetManager';
import { easeInOutCubic, Tween, TweenManager } from '../utils/Tween';

export class Tutorial {
    private container: Pixi.Container;
    private tweenManager: TweenManager;
    private handSprite: Pixi.Sprite;
    private moveOut?: Tween;
    private moveBack?: Tween;
    private tutorialActive: boolean = true;

    constructor (app: Pixi.Application, container: Pixi.Container, tweenManager: TweenManager) {
        this.container = container;
        this.tweenManager = tweenManager;

        const startPos = { 
            x: window.conf.positions.tutorialLocalStart.x + window.conf.positions.cannon.x,
            y: window.conf.positions.tutorialLocalStart.y + window.conf.positions.cannon.y 
        }
        const textureConfig = window.conf.textures.hand
        const texture = getTextureFromConfigPath(textureConfig.path) 
            || createFallbackTexture(app, (g) => g.circle(0, 0, 10).fill(0xbb00bb));
            
        this.handSprite = new Pixi.Sprite(texture);
        this.handSprite.anchor.set(0.5);
        this.handSprite.position.set(startPos.x, startPos.y);
        this.handSprite.width = textureConfig.w;
        this.handSprite.height = textureConfig.h;
        this.handSprite.eventMode = 'none';
        this.handSprite.zIndex = 20;
        this.container.addChild(this.handSprite);
    }

    public startTutorial(): void {
        const startPos = { 
            x: window.conf.positions.tutorialLocalStart.x + window.conf.positions.cannon.x,
            y: window.conf.positions.tutorialLocalStart.y + window.conf.positions.cannon.y 
        }
        const endPos = { 
            x: window.conf.positions.tutorialLocalEnd.x + window.conf.positions.cannon.x,
            y: window.conf.positions.tutorialLocalEnd.y + window.conf.positions.cannon.y 
        }
        const durationOut = 1500;
        const durationBack = 50;
        
        this.moveOut = new Tween(this.handSprite.position, 
            startPos, endPos, durationOut, 
            easeInOutCubic, 
            undefined,
            () => { this.moveBack?.start(); }
        );
        this.moveBack = new Tween(this.handSprite.position, 
            endPos, startPos, durationBack, 
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
}