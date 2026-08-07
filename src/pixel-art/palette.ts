/**
 * One shared warm-dusk light story ties every surface together: the sky
 * rotates from cool indigo (away from the sun) through rose to warm gold
 * (at the horizon, where the sun sits); grass and wood both borrow that same
 * gold for their sunlit highlights and lean toward indigo/plum in shadow,
 * so foliage, ground and UI all read as lit by the same light.
 */
export const palette = {
  /** One warm terracotta ramp built entirely from a single reference tone (#EAA87C) at fixed hue, so every wooden UI surface — buttons, the Settings panel — reads as one carved-from-the-same-tree kit. */
  wood: {
    darker: "#6d3d1d",
    dark: "#a35a29",
    base: "#eaa87c",
    light: "#f1c5a7",
    highlight: "#f5dfd1",
  },
  /** A separate, deliberately dark and desaturated monochrome wood ramp — one hue, only value changes — reserved for the pen fence, so it reads as weathered timber instead of the bright UI wood. */
  fence: {
    darkest: "#241a12",
    dark: "#3b2b1c",
    base: "#4f3a26",
    mid: "#634731",
    highlight: "#7a5c3f",
  },
  woodDisabled: {
    darker: "#2b2b2b",
    dark: "#454545",
    base: "#5f5f5f",
    light: "#787878",
    highlight: "#909090",
  },
  parchment: "#f5e6c8",
  parchmentDim: "#cbb98f",
  ink: "#3a2a1a",
  gold: "#e8b23d",
  goldDark: "#b8811f",
  grass: {
    dark: "#5b6a4a",
    base: "#a5c187",
    light: "#c7d977",
  },
  foliage: {
    shadow: "#264032",
    base: "#4f7a3f",
    mid: "#7fa653",
    highlight: "#d7e28a",
  },
  /** A cooler, silvery-sage canopy reserved for olive trees, so groves read distinctly from the general forest without leaving the warm-pastel family. */
  oliveFoliage: {
    shadow: "#4a5a45",
    base: "#7d9271",
    mid: "#a3b58e",
    highlight: "#dbe4c0",
  },
  /** Warm clay walls and a terracotta roof for small houses in Israel. */
  clay: {
    shadow: "#a8674a",
    base: "#d99a72",
    highlight: "#f0c299",
  },
  roofTile: {
    shadow: "#7a3a2c",
    base: "#b5563c",
    highlight: "#dd8560",
  },
  /** Golden wheat, for field texture. */
  wheat: {
    shadow: "#b98a34",
    base: "#e3c264",
    highlight: "#f5e29a",
  },
  cloud: {
    shadow: "#8f8bb0",
    base: "#fdf3e2",
    highlight: "#fff6da",
  },
  flowers: {
    poppyPetal: "#e2564f",
    poppyCenter: "#3a2a1a",
    daisyPetal: "#f7ecd2",
    daisyCenter: "#e8b23d",
    violetPetal: "#9b7fc7",
    violetCenter: "#f7ecd2",
  },
  sky: {
    day: ["#bfe8ff", "#8fd3f4"],
    /** [away-from-sun, transition, horizon/near-sun] — indigo cools the top, gold warms the horizon. */
    dusk: ["#3c3566", "#c96b6f", "#ffcf85"],
    night: ["#1a1f3a", "#0a0e1f"],
  },
  danger: "#c1443a",
  heart: "#d1453b",
  heartDark: "#8a241d",
  water: {
    deep: "#1f4d63",
    base: "#3d7f9e",
    light: "#6fb0c9",
    foam: "#e8f4f2",
  },
  /** Golden dry straw/hay, for the pen's hay pile and roof thatch. */
  hay: {
    shadow: "#a97c33",
    base: "#d9b35a",
    light: "#f0d488",
  },
  /** A small warm/cool pair for the shepherd's lantern — brass frame, amber flame. */
  lantern: {
    frame: "#332a1c",
    frameLight: "#5c4a30",
    glass: "#4a3418",
    flame: "#ffc65a",
    flameCore: "#fff3c4",
    glow: "#ffb64d",
  },
  skin: {
    shadow: "#b17f52",
    base: "#d9a874",
    highlight: "#f0c68f",
  },
  hair: {
    shadow: "#2c1c14",
    base: "#4a2f22",
    highlight: "#6b452f",
  },
  /** Soft warm pastel clothing for the shepherd — clay/terracotta rather than a saturated color, so he stays warm and gentle against the world instead of popping as a cool accent. */
  robe: {
    shadow: "#a8715a",
    base: "#dda07c",
    highlight: "#f5cda3",
  },
  /** A rustier wrap over one shoulder, layered on top of the robe so the clothing silhouette reads clearly as a shepherd's mantle. */
  mantle: {
    shadow: "#8a4a37",
    base: "#bd6a45",
    highlight: "#e0a06a",
  },
  /** Jesus's robe — a warm off-white, never stark/saturated, to stay inside the same warm-pastel family as everything else. */
  jesusRobe: {
    shadow: "#d9cdb8",
    base: "#f7f0e2",
    highlight: "#fffbf2",
  },
  /** Jesus's mantle — a muted brick red, desaturated so it reads as an accent, not a saturated pop. */
  jesusMantle: {
    shadow: "#8a3a30",
    base: "#c05a48",
    highlight: "#dd9078",
  },
  /** A soft sage-green robe for farmer/field NPCs, keeping the same pastel family as the rest of the cast. */
  farmerRobe: {
    shadow: "#8a9a5c",
    base: "#b9c98a",
    highlight: "#dbe6b8",
  },
  /** A cool, muted blue-grey robe for fisherman/traveller NPCs — the one place ambient NPCs lean cool, still desaturated. */
  fishermanRobe: {
    shadow: "#5c7a86",
    base: "#8fabb6",
    highlight: "#c3d6dc",
  },
  wool: {
    shadow: "#cbb98f",
    base: "#f2e9d6",
    highlight: "#fff8ea",
  },
  /** Cool, dim fur — the one place the palette deliberately breaks from the warm story, coding the wolves as a threat. */
  fur: {
    shadow: "#2b2a35",
    base: "#4c4a5c",
    light: "#6b6980",
    belly: "#7d7b90",
    eye: "#ffcf6b",
  },
} as const;
