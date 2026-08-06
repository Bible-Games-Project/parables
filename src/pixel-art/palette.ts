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
  water: "#3d7f9e",
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
