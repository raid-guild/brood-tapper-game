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

export interface MugSpriteSheet {
  image: HTMLImageElement;
  cell: { w: number; h: number };
  names: string[];
}

export interface DoorSpriteSheet {
  image: HTMLImageElement;
  cell: { w: number; h: number };
  names: string[];
}

export interface TapSpriteSheet {
  image: HTMLImageElement;
  cell: { w: number; h: number };
  names: string[];
}

export interface TipSpriteSheet {
  image: HTMLImageElement;
  cell: { w: number; h: number };
  names: string[];
}

export interface SignSpriteSheet {
  image: HTMLImageElement;
  cell: { w: number; h: number };
  names: string[];
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

export async function loadMugSprites(): Promise<MugSpriteSheet | null> {
  try {
    const res = await fetch("/sprites/mugs.json");
    if (!res.ok) return null;
    const meta = (await res.json()) as {
      cell: { w: number; h: number };
      names: string[];
    };

    const image = new Image();
    image.src = "/sprites/mugs.png";
    await image.decode();

    return {
      image,
      cell: meta.cell,
      names: meta.names,
    };
  } catch {
    return null;
  }
}

export async function loadDoorSprites(): Promise<DoorSpriteSheet | null> {
  try {
    const res = await fetch("/sprites/doors.json");
    if (!res.ok) return null;
    const meta = (await res.json()) as {
      cell: { w: number; h: number };
      names: string[];
    };

    const image = new Image();
    image.src = "/sprites/doors.png";
    await image.decode();

    return {
      image,
      cell: meta.cell,
      names: meta.names,
    };
  } catch {
    return null;
  }
}

export async function loadTapSprites(): Promise<TapSpriteSheet | null> {
  try {
    const res = await fetch("/sprites/taps.json");
    if (!res.ok) return null;
    const meta = (await res.json()) as {
      cell: { w: number; h: number };
      names: string[];
    };

    const image = new Image();
    image.src = "/sprites/taps.png";
    await image.decode();

    return {
      image,
      cell: meta.cell,
      names: meta.names,
    };
  } catch {
    return null;
  }
}

export async function loadTipSprites(): Promise<TipSpriteSheet | null> {
  try {
    const res = await fetch("/sprites/tips.json");
    if (!res.ok) return null;
    const meta = (await res.json()) as {
      cell: { w: number; h: number };
      names: string[];
    };

    const image = new Image();
    image.src = "/sprites/tips.png";
    await image.decode();

    return {
      image,
      cell: meta.cell,
      names: meta.names,
    };
  } catch {
    return null;
  }
}

export async function loadSignSprites(): Promise<SignSpriteSheet | null> {
  try {
    const res = await fetch("/sprites/signs.json");
    if (!res.ok) return null;
    const meta = (await res.json()) as {
      cell: { w: number; h: number };
      names: string[];
    };

    const image = new Image();
    image.src = "/sprites/signs.png";
    await image.decode();

    return {
      image,
      cell: meta.cell,
      names: meta.names,
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

export function drawMugSprite(
  ctx: CanvasRenderingContext2D,
  sheet: MugSpriteSheet,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const index = sheet.names.indexOf(name);
  if (index < 0) return;

  ctx.drawImage(
    sheet.image,
    index * sheet.cell.w,
    0,
    sheet.cell.w,
    sheet.cell.h,
    x,
    y,
    w,
    h
  );
}

export function drawDoorSprite(
  ctx: CanvasRenderingContext2D,
  sheet: DoorSpriteSheet,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const index = sheet.names.indexOf(name);
  if (index < 0) return;

  ctx.drawImage(
    sheet.image,
    index * sheet.cell.w,
    0,
    sheet.cell.w,
    sheet.cell.h,
    x,
    y,
    w,
    h
  );
}

export function drawTapSprite(
  ctx: CanvasRenderingContext2D,
  sheet: TapSpriteSheet,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const index = sheet.names.indexOf(name);
  if (index < 0) return;

  ctx.drawImage(
    sheet.image,
    index * sheet.cell.w,
    0,
    sheet.cell.w,
    sheet.cell.h,
    x,
    y,
    w,
    h
  );
}

export function drawTipSprite(
  ctx: CanvasRenderingContext2D,
  sheet: TipSpriteSheet,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const index = sheet.names.indexOf(name);
  if (index < 0) return;

  ctx.drawImage(
    sheet.image,
    index * sheet.cell.w,
    0,
    sheet.cell.w,
    sheet.cell.h,
    x,
    y,
    w,
    h
  );
}

export function drawSignSprite(
  ctx: CanvasRenderingContext2D,
  sheet: SignSpriteSheet,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const index = sheet.names.indexOf(name);
  if (index < 0) return;

  ctx.drawImage(
    sheet.image,
    index * sheet.cell.w,
    0,
    sheet.cell.w,
    sheet.cell.h,
    x,
    y,
    w,
    h
  );
}
