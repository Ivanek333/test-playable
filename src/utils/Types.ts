import { Vector } from "matter-js";

export type ConfigTexture = { path: string, w: number, h: number}
export type BlockData = { t: number, x: number, y: number, r: number, d: number } // type, xy, rotation, damage
export type MinMax = { min: number, max: number }

declare global {
  interface Window {
    conf: {
      designResolution: { w: number, h: number }
      dragDistance: MinMax;
      maxLaunchForce: number;
      maxLaunchForceDistance: number;
      projectileDensity: number;
      barrelDefaultAngle: number;
      barrelLimitAngle: MinMax;
      ammoAmount: number;
      blockDamageThreshold: number;
      blockDestructionThreshold: number;
      immunityTime: number;
      textures: {
        projectile: ConfigTexture;
        cannon: ConfigTexture;
        barrel: ConfigTexture;
        hand: ConfigTexture;
        target: ConfigTexture;
        block_short_damage0: ConfigTexture;
        block_short_damage1: ConfigTexture;
        block_long_damage0: ConfigTexture;
        block_long_damage1: ConfigTexture;
      };
      positions: {
        cannon: Vector;
        barrelLocal: Vector;
        barrelPivot: Vector;
        powerIndicatorLocal: Vector;
        powerIndicatorSize: Vector;
        tutorialLocalStart: Vector;
        tutorialLocalEnd: Vector;
        castle: Vector;
        targetLocal: Vector
      }
      blocks: Array<BlockData>
    };
  }
}
