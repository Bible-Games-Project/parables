import { Container, Graphics } from "pixi.js";
import { hexToNumber } from "@/pixel-art/color";
import { createRng } from "@/pixel-art/prng";
import { palette } from "@/pixel-art/palette";

export interface CharacterSprite {
  /** Added to the world container; its position is authoritative for gameplay. */
  container: Container;
  /** Inner visual child animated for bob/facing — keeps position math clean on the parent. */
  body: Container;
}

export function createShepherdSprite(): CharacterSprite {
  const container = new Container();
  const body = new Container();

  const robeColor = 0x4d6a5a;
  const robeShade = 0x33473c;
  const skin = 0xd9a874;

  const g = new Graphics();
  // Legs.
  g.rect(-4, 2, 3, 6).fill(0x2e2115);
  g.rect(1, 2, 3, 6).fill(0x2e2115);
  // Robe.
  g.roundRect(-7, -12, 14, 16, 3).fill(robeColor);
  g.roundRect(-7, 2, 14, 5, 2).fill(robeShade);
  // Head.
  g.circle(0, -16, 6).fill(skin);
  g.rect(-6, -20, 12, 4).fill(0x5c3a1f);
  // Staff.
  g.rect(8, -18, 2, 26).fill(hexToNumber(palette.wood.light));
  g.circle(9, -18, 3).fill(hexToNumber(palette.wood.highlight));

  body.addChild(g);
  container.addChild(body);
  return { container, body };
}

export function createSheepSprite(scale = 1): CharacterSprite {
  const container = new Container();
  const body = new Container();

  const g = new Graphics();
  g.rect(-3, 4, 2, 4).fill(0x2a1c12);
  g.rect(2, 4, 2, 4).fill(0x2a1c12);
  g.circle(-4, 0, 5).fill(0xefe9db);
  g.circle(4, 0, 5).fill(0xefe9db);
  g.circle(0, -4, 6).fill(0xf7f2e6);
  g.circle(0, 2, 6).fill(0xefe9db);
  g.circle(7, -2, 3.4).fill(0x3a2a1a);
  g.circle(6, -3, 0.8).fill(0x000000);

  body.addChild(g);
  body.scale.set(scale);
  container.addChild(body);
  return { container, body };
}

export function createWolfSprite(): CharacterSprite {
  const container = new Container();
  const body = new Container();

  const fur = 0x5a5a5f;
  const furDark = 0x3a3a40;

  const g = new Graphics();
  g.rect(-6, 3, 3, 5).fill(furDark);
  g.rect(3, 3, 3, 5).fill(furDark);
  g.ellipse(0, -1, 10, 6).fill(fur);
  g.moveTo(8, -4).lineTo(15, -2).lineTo(8, 1).closePath().fill(fur);
  g.poly([-9, -6, -6, -11, -3, -6]).fill(fur);
  g.poly([-2, -7, 1, -12, 4, -7]).fill(furDark);
  g.circle(11, -3, 0.9).fill(0xc1443a);

  body.addChild(g);
  container.addChild(body);
  return { container, body };
}

export function createFenceOutline(width: number, height: number): Container {
  const container = new Container();
  const postSpacing = 14;
  const railColor = hexToNumber(palette.wood.dark);
  const postColor = hexToNumber(palette.wood.darker);

  const rails = new Graphics();
  rails.rect(0, -1, width, 2).fill(railColor);
  rails.rect(0, height - 1, width, 2).fill(railColor);
  rails.rect(-1, 0, 2, height).fill(railColor);
  rails.rect(width - 1, 0, 2, height).fill(railColor);
  container.addChild(rails);

  // Short stakes along each edge only — not a full interior grid.
  const posts = new Graphics();
  for (let x = 0; x <= width; x += postSpacing) {
    posts.rect(x - 1.5, -4, 3, 8).fill(postColor);
    posts.rect(x - 1.5, height - 4, 3, 8).fill(postColor);
  }
  for (let y = postSpacing; y < height; y += postSpacing) {
    posts.rect(-4, y - 1.5, 8, 3).fill(postColor);
    posts.rect(width - 4, y - 1.5, 8, 3).fill(postColor);
  }
  container.addChild(posts);

  return container;
}

/** Static decorative flock — the ninety-nine sheep safely in the pen, not individual game entities. */
export function createFlockCluster(width: number, height: number, count: number): Container {
  const rng = createRng(2024);
  const container = new Container();
  for (let i = 0; i < count; i++) {
    const puff = createSheepSprite(0.65 + rng() * 0.15);
    puff.container.x = 10 + rng() * (width - 20);
    puff.container.y = 10 + rng() * (height - 20);
    container.addChild(puff.container);
  }
  return container;
}
