/**
 * One shared warm-dusk light story ties every surface together: the sky
 * rotates from cool indigo (away from the sun) through rose to warm gold
 * (at the horizon, where the sun sits); grass and wood both borrow that same
 * gold for their sunlit highlights and lean toward indigo/plum in shadow,
 * so foliage, ground and UI all read as lit by the same light.
 */
export const palette = {
  wood: {
    darker: "#2e1f22",
    dark: "#54372c",
    base: "#8a5c3e",
    light: "#c1894f",
    highlight: "#f0c179",
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
    dark: "#2c4a3f",
    base: "#6b8f45",
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
} as const;
