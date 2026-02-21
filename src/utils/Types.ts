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
      barrelDefaultAngle: number;
      barrelLimitAngle: MinMax;
      textures: {
        projectile: ConfigTexture;
        cannon: ConfigTexture;
        barrel: ConfigTexture;
        block_short_damage0: ConfigTexture;
        block_short_damage1: ConfigTexture;
        block_long_damage0: ConfigTexture;
        block_long_damage1: ConfigTexture;
      };
      positions: {
        cannon: Vector;
        barrelLocal: Vector;
        barrelPivot: Vector;
        castle: Vector
      }
      blocks: Array<BlockData>
    };
  }
}
