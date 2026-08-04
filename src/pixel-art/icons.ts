import { palette } from "@/pixel-art/palette";
import type { PixelGridSprite } from "@/pixel-art/pixelGrid";

// '#' = primary fill, 'o' = outline / shade, '.' = transparent.

export const gearIcon: PixelGridSprite = {
  legend: { "#": palette.gold, o: palette.goldDark },
  rows: [
    "...oo..oo...",
    "..o##o.o##o.",
    "...########.",
    "oo########oo",
    "o###oooo###o",
    "o###o..o###o",
    "o###o..o###o",
    "o###oooo###o",
    "oo########oo",
    "...########.",
    "..o##o.o##o.",
    "...oo..oo...",
  ],
};

export const globeIcon: PixelGridSprite = {
  legend: { "#": palette.parchment, o: palette.ink },
  rows: [
    "....oooo....",
    "..o######o..",
    ".o##o###o##.",
    "o##########o",
    "o##########o",
    "o##########o",
    "o##########o",
    "o##########o",
    ".o##o###o##.",
    "..o######o..",
    "....oooo....",
  ],
};

export const lockIcon: PixelGridSprite = {
  legend: { "#": palette.parchmentDim, o: palette.ink },
  rows: [
    "...oooo.....",
    "..o....o....",
    "..o....o....",
    ".oooooooo...",
    "o########o..",
    "o##.oo.##o..",
    "o##.oo.##o..",
    "o########o..",
    ".oooooooo...",
  ],
};

export const heartIcon: PixelGridSprite = {
  legend: { "#": palette.heart, o: palette.heartDark },
  rows: [
    ".oo..oo.",
    "o##oo##o",
    "########",
    "########",
    ".######.",
    "..####..",
    "...oo...",
  ],
};

export const sheepIcon: PixelGridSprite = {
  legend: { "#": "#f5f0e6", o: palette.ink },
  rows: [
    ".o####o.",
    "o######o",
    "o##oo##o",
    "o######o",
    ".o####o.",
    "..o..o..",
  ],
};

export const checkIcon: PixelGridSprite = {
  legend: { "#": palette.grass.light, o: palette.grass.dark },
  rows: [
    "......o",
    ".....o#",
    "....o#.",
    "o#..o#.",
    ".o##o..",
    "..o#...",
    "..o....",
  ],
};

export const staffIcon: PixelGridSprite = {
  legend: { "#": palette.wood.light, o: palette.wood.darker },
  rows: [
    "oo......",
    "o#o.....",
    ".o#o....",
    "..o#o...",
    "...o#o..",
    "....o#o.",
    ".....o#o",
    "......o#",
  ],
};

export const backIcon: PixelGridSprite = {
  legend: { "#": palette.parchment, o: palette.ink },
  rows: [
    ".....o..",
    "....oo..",
    "...o##oo",
    "..o####o",
    "..o####o",
    "...o##oo",
    "....oo..",
    ".....o..",
  ],
};

export const starIcon: PixelGridSprite = {
  legend: { "#": palette.gold, o: palette.goldDark },
  rows: [
    "....oo....",
    "....##....",
    "....##....",
    "o##########o",
    ".o########o.",
    "..o######o..",
    ".o##o..o##o.",
    "o##o....o##o",
  ],
};
