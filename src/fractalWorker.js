const ESCAPE_RADIUS_SQUARED = 4;

const palettes = {
  sunset: buildGradient([
    [0, 7, 100],
    [32, 107, 203],
    [237, 255, 255],
    [255, 170, 0],
    [0, 2, 0],
  ]),
  ocean: buildGradient([
    [0, 8, 24],
    [0, 80, 140],
    [25, 194, 194],
    [172, 255, 255],
    [0, 0, 0],
  ]),
  mono: buildGradient([
    [0, 0, 0],
    [90, 90, 90],
    [180, 180, 180],
    [255, 255, 255],
  ]),
};

self.onmessage = (event) => {
  const { width, height, viewport, maxIterations, fractalType, juliaSeed, paletteName } = event.data;
  const image = new Uint8ClampedArray(width * height * 4);
  const palette = palettes[paletteName] ?? palettes.sunset;

  const scaleX = (viewport.maxX - viewport.minX) / width;
  const scaleY = (viewport.maxY - viewport.minY) / height;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cRe = viewport.minX + x * scaleX;
      const cIm = viewport.minY + y * scaleY;
      const iteration =
        fractalType === 'julia'
          ? iterateJulia(cRe, cIm, juliaSeed.re, juliaSeed.im, maxIterations)
          : iterateMandelbrot(cRe, cIm, maxIterations);

      const idx = (y * width + x) * 4;
      const [r, g, b] = colorForIteration(iteration, maxIterations, palette);
      image[idx] = r;
      image[idx + 1] = g;
      image[idx + 2] = b;
      image[idx + 3] = 255;
    }
  }

  self.postMessage({ image, width, height });
};

function iterateMandelbrot(cRe, cIm, maxIterations) {
  let zRe = 0;
  let zIm = 0;

  for (let i = 0; i < maxIterations; i += 1) {
    const zReSq = zRe * zRe;
    const zImSq = zIm * zIm;

    if (zReSq + zImSq > ESCAPE_RADIUS_SQUARED) {
      return i;
    }

    zIm = 2 * zRe * zIm + cIm;
    zRe = zReSq - zImSq + cRe;
  }

  return maxIterations;
}

function iterateJulia(zRe, zIm, cRe, cIm, maxIterations) {
  for (let i = 0; i < maxIterations; i += 1) {
    const zReSq = zRe * zRe;
    const zImSq = zIm * zIm;

    if (zReSq + zImSq > ESCAPE_RADIUS_SQUARED) {
      return i;
    }

    zIm = 2 * zRe * zIm + cIm;
    zRe = zReSq - zImSq + cRe;
  }

  return maxIterations;
}

function buildGradient(stops, size = 2048) {
  const out = new Array(size);
  for (let i = 0; i < size; i += 1) {
    const t = i / (size - 1);
    const segment = t * (stops.length - 1);
    const index = Math.min(stops.length - 2, Math.floor(segment));
    const localT = segment - index;

    const start = stops[index];
    const end = stops[index + 1];

    out[i] = [
      Math.round(start[0] + (end[0] - start[0]) * localT),
      Math.round(start[1] + (end[1] - start[1]) * localT),
      Math.round(start[2] + (end[2] - start[2]) * localT),
    ];
  }

  return out;
}

function colorForIteration(iteration, maxIterations, palette) {
  if (iteration === maxIterations) {
    return [0, 0, 0];
  }

  const smooth = iteration + 1 - Math.log2(Math.log2(iteration + 2));
  const normalized = Math.max(0, Math.min(1, smooth / maxIterations));
  const colorIdx = Math.floor(normalized * (palette.length - 1));

  return palette[colorIdx];
}
