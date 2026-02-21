import * as Pixi from 'pixi.js';

declare const require: {
  context(
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp
  ): {
    keys(): string[];
    (id: string): any;
  };
};

const imagesContext = require.context('../../assets', true, /\.(png|jpg|jpeg|gif|svg)$/);
const imageMap: Record<string, string> = {};

imagesContext.keys().forEach((key: string) => {
  const fileName = key.substring(2);  // './a.png' –> 'a.png'
  imageMap[fileName] = imagesContext(key);
});

const textureCache: Record<string, Pixi.Texture> = {};

export async function loadAllTextures(): Promise<void> {
  const loadPromises = Object.entries(imageMap).map(([fileName, base64]) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const texture = Pixi.Texture.from(img);
        textureCache[fileName] = texture;
        resolve();
      };
      img.onerror = (err) => reject(new Error(`Failed to load ${fileName}: ${err}`));
      img.src = base64;
    });
  });

  await Promise.all(loadPromises);
  console.log('All textures loaded');
}

export function getTextureFromConfigPath(configPath: string): Pixi.Texture | null {
  const fileName = configPath.replace(/^assets\//, '');
  return textureCache[fileName] || null;
}

export function createFallbackTexture(
  app: Pixi.Application,
  draw: (g: Pixi.Graphics) => void
): Pixi.Texture {
  const graphics = new Pixi.Graphics();
  draw(graphics);
  return app.renderer.generateTexture(graphics);
}