// Loads the character sprite sheet produced by the Path C pipeline
// (assets-src/build-character-sprites.mjs → public/sprites/characters.*).
// The renderer falls back to placeholder rects until this resolves.

export interface SpriteSheet {
  image: HTMLImageElement;
  cell: number;
  /** customer sprites in pool order; the bartender is `keeperIndex` */
  names: string[];
  keeperIndex: number;
}

export async function loadCharacterSprites(): Promise<SpriteSheet | null> {
  try {
    const res = await fetch("/sprites/characters.json");
    if (!res.ok) return null;
    const meta = (await res.json()) as { cell: number; names: string[] };

    const image = new Image();
    image.src = "/sprites/characters.png";
    await image.decode();

    return {
      image,
      cell: meta.cell,
      names: meta.names,
      keeperIndex: meta.names.indexOf("tavern-keeper"),
    };
  } catch {
    return null;
  }
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  index: number,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.drawImage(
    sheet.image,
    index * sheet.cell,
    0,
    sheet.cell,
    sheet.cell,
    x,
    y,
    w,
    h
  );
}
