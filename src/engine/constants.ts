/**
 * Every scene is authored against this fixed virtual resolution and then
 * scaled up on the canvas element with nearest-neighbor scaling
 * (image-rendering: pixelated). This is what makes the game read as actual
 * pixel art instead of smooth flat-shaded vector shapes.
 */
export const VIRTUAL_WIDTH = 480;
export const VIRTUAL_HEIGHT = 270;
