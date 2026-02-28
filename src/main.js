const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const fractalTypeInput = document.getElementById('fractalType');
const iterationsInput = document.getElementById('iterations');
const iterationsValue = document.getElementById('iterationsValue');
const paletteInput = document.getElementById('palette');
const resetViewButton = document.getElementById('resetView');
const statusEl = document.getElementById('status');

const worker = new Worker(new URL('./fractalWorker.js', import.meta.url), { type: 'module' });

const DEFAULT_VIEWPORT = {
  minX: -2.5,
  maxX: 1.2,
  minY: -1.35,
  maxY: 1.35,
};

let viewport = { ...DEFAULT_VIEWPORT };
let renderQueued = false;
let renderInFlight = false;
let pendingRender = false;
let lastPointer = null;
const juliaSeed = { re: -0.8, im: 0.156 };

bindUI();
queueRender();

function bindUI() {
  iterationsInput.addEventListener('input', () => {
    iterationsValue.value = iterationsInput.value;
    queueRender();
  });

  fractalTypeInput.addEventListener('change', queueRender);
  paletteInput.addEventListener('change', queueRender);

  resetViewButton.addEventListener('click', () => {
    viewport = { ...DEFAULT_VIEWPORT };
    queueRender();
  });

  canvas.addEventListener('wheel', onZoom, { passive: false });

  let dragStart = null;

  canvas.addEventListener('pointerdown', (event) => {
    dragStart = { x: event.clientX, y: event.clientY, viewport: { ...viewport } };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    lastPointer = { x: event.offsetX, y: event.offsetY };
    if (!dragStart) return;

    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;

    const scaleX = (dragStart.viewport.maxX - dragStart.viewport.minX) / canvas.width;
    const scaleY = (dragStart.viewport.maxY - dragStart.viewport.minY) / canvas.height;

    viewport = {
      minX: dragStart.viewport.minX - dx * scaleX,
      maxX: dragStart.viewport.maxX - dx * scaleX,
      minY: dragStart.viewport.minY - dy * scaleY,
      maxY: dragStart.viewport.maxY - dy * scaleY,
    };

    queueRender();
  });

  canvas.addEventListener('pointerup', () => {
    dragStart = null;
  });

  canvas.addEventListener('pointerleave', () => {
    lastPointer = null;
  });

  worker.onmessage = ({ data }) => {
    const imageData = new ImageData(data.image, data.width, data.height);
    ctx.putImageData(imageData, 0, 0);

    renderInFlight = false;
    statusEl.textContent = 'Ready';

    if (pendingRender) {
      pendingRender = false;
      queueRender();
    }
  };
}

function onZoom(event) {
  event.preventDefault();

  const zoomFactor = event.deltaY > 0 ? 1.12 : 0.88;
  const rect = canvas.getBoundingClientRect();
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;

  const xRatio = px / rect.width;
  const yRatio = py / rect.height;

  const viewWidth = viewport.maxX - viewport.minX;
  const viewHeight = viewport.maxY - viewport.minY;

  const targetX = viewport.minX + viewWidth * xRatio;
  const targetY = viewport.minY + viewHeight * yRatio;

  const newWidth = viewWidth * zoomFactor;
  const newHeight = viewHeight * zoomFactor;

  viewport = {
    minX: targetX - newWidth * xRatio,
    maxX: targetX + newWidth * (1 - xRatio),
    minY: targetY - newHeight * yRatio,
    maxY: targetY + newHeight * (1 - yRatio),
  };

  queueRender();
}

function queueRender() {
  if (renderQueued) {
    return;
  }

  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function render() {
  if (renderInFlight) {
    pendingRender = true;
    return;
  }

  renderInFlight = true;
  statusEl.textContent = 'Rendering…';

  if (!lastPointer) {
    lastPointer = { x: canvas.width / 2, y: canvas.height / 2 };
  }

  worker.postMessage({
    width: canvas.width,
    height: canvas.height,
    viewport,
    maxIterations: Number(iterationsInput.value),
    fractalType: fractalTypeInput.value,
    juliaSeed,
    paletteName: paletteInput.value,
  });
}
