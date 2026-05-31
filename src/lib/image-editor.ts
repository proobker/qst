export type ImageFilterPreset =
  | "none"
  | "vivid"
  | "warm"
  | "cool"
  | "mono"
  | "fade"
  | "dramatic";

export type ImageEditSettings = {
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  filter: ImageFilterPreset;
  crop: { x: number; y: number; width: number; height: number } | null;
};

export const DEFAULT_EDIT_SETTINGS: ImageEditSettings = {
  rotation: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpness: 0,
  filter: "none",
  crop: null,
};

export const FILTER_PRESETS: Array<{ id: ImageFilterPreset; label: string }> = [
  { id: "none", label: "Original" },
  { id: "vivid", label: "Vivid" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "mono", label: "Mono" },
  { id: "fade", label: "Fade" },
  { id: "dramatic", label: "Dramatic" },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function applySharpness(data: ImageData, amount: number) {
  if (amount <= 0) {
    return;
  }
  const { data: pixels, width, height } = data;
  const copy = new Uint8ClampedArray(pixels);
  const strength = amount / 100;
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += copy[idx] * kernel[ki];
            ki++;
          }
        }
        const idx = (y * width + x) * 4 + c;
        pixels[idx] = Math.min(255, Math.max(0, copy[idx] + (sum - copy[idx]) * strength));
      }
    }
  }
}

function applyFilterPreset(data: ImageData, filter: ImageFilterPreset) {
  const pixels = data.data;
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];

    switch (filter) {
      case "vivid":
        r = Math.min(255, r * 1.1);
        g = Math.min(255, g * 1.08);
        b = Math.min(255, b * 1.05);
        break;
      case "warm":
        r = Math.min(255, r * 1.12);
        g = Math.min(255, g * 1.04);
        b = Math.max(0, b * 0.92);
        break;
      case "cool":
        r = Math.max(0, r * 0.92);
        g = Math.min(255, g * 1.02);
        b = Math.min(255, b * 1.12);
        break;
      case "mono": {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
        break;
      }
      case "fade":
        r = r * 0.85 + 30;
        g = g * 0.85 + 30;
        b = b * 0.85 + 30;
        break;
      case "dramatic":
        r = Math.min(255, Math.max(0, (r - 128) * 1.3 + 128));
        g = Math.min(255, Math.max(0, (g - 128) * 1.3 + 128));
        b = Math.min(255, Math.max(0, (b - 128) * 1.3 + 128));
        break;
      default:
        break;
    }

    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  }
}

export async function renderEditedImage(
  imageSrc: string,
  settings: ImageEditSettings,
  croppedAreaPixels?: { x: number; y: number; width: number; height: number } | null,
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const crop = croppedAreaPixels ?? settings.crop;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  const rotRad = (settings.rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  const bWidth = img.width * cos + img.height * sin;
  const bHeight = img.width * sin + img.height * cos;

  canvas.width = bWidth;
  canvas.height = bHeight;
  ctx.translate(bWidth / 2, bHeight / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  let sourceCanvas = canvas;
  if (crop && crop.width > 0 && crop.height > 0) {
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = crop.width;
    cropCanvas.height = crop.height;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) {
      throw new Error("Canvas not supported");
    }
    cropCtx.drawImage(canvas, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    sourceCanvas = cropCanvas;
  }

  const output = document.createElement("canvas");
  output.width = sourceCanvas.width;
  output.height = sourceCanvas.height;
  const outputCtx = output.getContext("2d");
  if (!outputCtx) {
    throw new Error("Canvas not supported");
  }

  outputCtx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;
  outputCtx.drawImage(sourceCanvas, 0, 0);

  const imageData = outputCtx.getImageData(0, 0, output.width, output.height);
  applyFilterPreset(imageData, settings.filter);
  applySharpness(imageData, settings.sharpness);
  outputCtx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    output.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to export image"));
        }
      },
      "image/jpeg",
      0.92,
    );
  });
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
