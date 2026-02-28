# Fractal Explorer

A browser-only fractal renderer that draws Mandelbrot and Julia sets onto a 2D Canvas. It uses a modular MVC-inspired split:

- **Model**: viewport state and fractal parameters in `src/main.js`
- **View**: canvas raster output and control panel in `index.html` + `src/styles.css`
- **Controller**: UI events and render scheduling in `src/main.js`
- **Compute Worker**: pixel generation + color lookup in `src/fractalWorker.js`

## Run

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Features

- Mandelbrot and Julia modes
- Mouse-wheel zoom around cursor focus
- Drag-to-pan viewport transforms
- Configurable max iterations and palettes
- Worker-based rendering to keep the UI responsive
- Smoothed iteration coloring with precomputed palette gradients

## Performance notes

- Rendering complexity is `O(width * height * maxIterations)`.
- Compute work runs in a Web Worker to avoid blocking the main thread.
- Rendering is debounced with `requestAnimationFrame` and coalesced if a render is already in flight.
- For deeper zoom levels, precision can degrade with standard doubles; introducing a high-precision library would be the next extension.
