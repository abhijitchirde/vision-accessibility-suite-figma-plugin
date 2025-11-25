/**
 * Image Processing Utilities for Vision Simulator
 *
 * Provides functions for:
 * - Applying color transformation matrices (color blindness simulation)
 * - Applying visual effect filters (blur, ghosting, yellowing, etc.)
 * - Image data manipulation and conversion
 */

import {
  RGB,
  RGBA,
  TransformationMatrix,
  BlurConfig,
  GhostingConfig,
  YellowingConfig,
  ContrastLossConfig,
  BrightLightConfig,
  CentralVisionLossConfig,
  PeripheralVisionLossConfig,
} from './vision-simulator.types';
import {
  TRANSFORMATION_MATRICES,
  DEFAULT_BLUR_CONFIG,
  DEFAULT_GHOSTING_CONFIG,
  DEFAULT_YELLOWING_CONFIG,
  DEFAULT_CONTRAST_LOSS_CONFIG,
  DEFAULT_BRIGHT_LIGHT_CONFIG,
  DEFAULT_ANOMALY_SEVERITY,
} from './vision-simulator.constants';
import { ColorBlindnessType } from './vision-simulator.types';

/**
 * Map partial color vision deficiency (anomaly) to its base dichromacy type
 *
 * Anomalies use the same transformation matrices as their complete counterparts,
 * but with reduced severity (< 1.0).
 *
 * @param type - Color blindness type (dichromacy or anomaly)
 * @returns Base dichromacy type for matrix lookup
 */
function getBaseDichromacyType(
  type: ColorBlindnessType
): 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia' {
  switch (type) {
    case 'protanomaly':
      return 'protanopia';
    case 'deuteranomaly':
      return 'deuteranopia';
    case 'tritanomaly':
      return 'tritanopia';
    default:
      // Already a dichromacy type, return as-is
      return type as 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  }
}

/**
 * Get default severity for a color blindness type
 *
 * Dichromacy types default to 1.0 (complete), anomaly types use configured defaults.
 *
 * @param type - Color blindness type
 * @returns Default severity (0-1)
 */
function getDefaultSeverity(type: ColorBlindnessType): number {
  switch (type) {
    case 'protanomaly':
    case 'deuteranomaly':
    case 'tritanomaly':
      return DEFAULT_ANOMALY_SEVERITY[type];
    default:
      return 1.0; // Complete dichromacy
  }
}

/**
 * Interpolate between identity matrix (normal vision) and dichromacy matrix
 *
 * This enables simulation of partial color vision deficiencies (anomalous trichromacy)
 * by linearly interpolating between normal vision and complete color blindness.
 *
 * @param severity - Severity level (0-1, where 0 = normal vision, 1 = complete dichromacy)
 * @param dichromacyMatrix - Target transformation matrix for complete color blindness
 * @returns Interpolated transformation matrix
 *
 * @example
 * // Mild deuteranomaly (30% severity)
 * const mildMatrix = interpolateColorMatrix(0.3, DEUTERANOPIA_MATRIX);
 *
 * // Moderate deuteranomaly (60% severity)
 * const moderateMatrix = interpolateColorMatrix(0.6, DEUTERANOPIA_MATRIX);
 *
 * // Complete deuteranopia (100% severity)
 * const completeMatrix = interpolateColorMatrix(1.0, DEUTERANOPIA_MATRIX);
 */
export function interpolateColorMatrix(
  severity: number,
  dichromacyMatrix: TransformationMatrix
): TransformationMatrix {
  // Clamp severity to [0, 1]
  const s = Math.max(0, Math.min(1, severity));

  // Identity matrix (normal vision)
  const identityMatrix: TransformationMatrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  // Linear interpolation: result = identity * (1 - s) + dichromacy * s
  return [
    [
      identityMatrix[0][0] * (1 - s) + dichromacyMatrix[0][0] * s,
      identityMatrix[0][1] * (1 - s) + dichromacyMatrix[0][1] * s,
      identityMatrix[0][2] * (1 - s) + dichromacyMatrix[0][2] * s,
    ],
    [
      identityMatrix[1][0] * (1 - s) + dichromacyMatrix[1][0] * s,
      identityMatrix[1][1] * (1 - s) + dichromacyMatrix[1][1] * s,
      identityMatrix[1][2] * (1 - s) + dichromacyMatrix[1][2] * s,
    ],
    [
      identityMatrix[2][0] * (1 - s) + dichromacyMatrix[2][0] * s,
      identityMatrix[2][1] * (1 - s) + dichromacyMatrix[2][1] * s,
      identityMatrix[2][2] * (1 - s) + dichromacyMatrix[2][2] * s,
    ],
  ];
}

/**
 * Apply a color transformation matrix to an RGB color
 *
 * Formula: [R', G', B'] = Matrix × [R, G, B]
 *
 * @param color - RGB color (0-255)
 * @param matrix - 3x3 transformation matrix
 * @returns Transformed RGB color
 */
export function applyColorMatrix(color: RGB, matrix: TransformationMatrix): RGB {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const r2 = matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b;
  const g2 = matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b;
  const b2 = matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b;

  // Clamp values to [0, 1] and convert back to [0, 255]
  return {
    r: Math.round(Math.max(0, Math.min(1, r2)) * 255),
    g: Math.round(Math.max(0, Math.min(1, g2)) * 255),
    b: Math.round(Math.max(0, Math.min(1, b2)) * 255),
  };
}

/**
 * Apply color blindness simulation to image data
 *
 * Supports both complete dichromacy and partial color vision deficiencies (anomalous trichromacy).
 * Anomaly types (protanomaly, deuteranomaly, tritanomaly) automatically use appropriate severity.
 *
 * @param imageData - Uint8ClampedArray in RGBA format
 * @param type - Type of color blindness (dichromacy or anomaly)
 * @param severity - Optional severity override (0-1). If not provided, uses type-appropriate default.
 * @returns Modified image data
 *
 * @example
 * // Complete deuteranopia (dichromacy) - uses severity 1.0
 * applyColorBlindness(imageData, 'deuteranopia');
 *
 * // Moderate deuteranomaly (anomaly) - uses default severity 0.6
 * applyColorBlindness(imageData, 'deuteranomaly');
 *
 * // Custom severity for any type
 * applyColorBlindness(imageData, 'deuteranopia', 0.3); // Mild
 * applyColorBlindness(imageData, 'protanomaly', 0.9);  // Severe
 */
export function applyColorBlindness(
  imageData: Uint8ClampedArray,
  type: ColorBlindnessType,
  severity?: number
): Uint8ClampedArray {
  // Use provided severity, or get type-appropriate default
  const effectiveSeverity = severity !== undefined ? severity : getDefaultSeverity(type);

  // Get the base dichromacy type for matrix lookup
  const baseDichromacyType = getBaseDichromacyType(type);
  const baseMatrix = TRANSFORMATION_MATRICES[baseDichromacyType];

  // If severity is 1.0 (complete dichromacy), use the base matrix directly for performance
  // Otherwise, interpolate between identity and dichromacy matrix
  const matrix =
    effectiveSeverity === 1.0 ? baseMatrix : interpolateColorMatrix(effectiveSeverity, baseMatrix);

  const result = new Uint8ClampedArray(imageData.length);

  // Process each pixel
  for (let i = 0; i < imageData.length; i += 4) {
    const color: RGB = {
      r: imageData[i],
      g: imageData[i + 1],
      b: imageData[i + 2],
    };

    const transformed = applyColorMatrix(color, matrix);

    result[i] = transformed.r;
    result[i + 1] = transformed.g;
    result[i + 2] = transformed.b;
    result[i + 3] = imageData[i + 3]; // Preserve alpha
  }

  return result;
}

/**
 * Apply Gaussian blur to image data
 *
 * Uses a separable Gaussian blur for performance
 *
 * @param imageData - Uint8ClampedArray in RGBA format
 * @param width - Image width
 * @param height - Image height
 * @param config - Blur configuration
 * @returns Blurred image data
 */
export function applyBlur(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  config: BlurConfig = DEFAULT_BLUR_CONFIG
): Uint8ClampedArray {
  const { radius, iterations = 1 } = config;
  let result = new Uint8ClampedArray(imageData) as Uint8ClampedArray;

  // Apply blur multiple times for stronger effect
  for (let iter = 0; iter < iterations; iter++) {
    result = applyGaussianBlur(result, width, height, radius) as Uint8ClampedArray;
  }

  return result;
}

/**
 * Apply Gaussian blur (single pass)
 *
 * @param imageData - Image data
 * @param width - Image width
 * @param height - Image height
 * @param radius - Blur radius
 * @returns Blurred image data
 */
function applyGaussianBlur(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(imageData.length);
  const kernelSize = radius * 2 + 1;
  const kernel = createGaussianKernel(kernelSize, radius);

  // Horizontal pass
  const temp = new Uint8ClampedArray(imageData.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        weightSum = 0;

      for (let kx = -radius; kx <= radius; kx++) {
        const px = Math.min(width - 1, Math.max(0, x + kx));
        const idx = (y * width + px) * 4;
        const weight = kernel[kx + radius];

        r += imageData[idx] * weight;
        g += imageData[idx + 1] * weight;
        b += imageData[idx + 2] * weight;
        a += imageData[idx + 3] * weight;
        weightSum += weight;
      }

      const idx = (y * width + x) * 4;
      temp[idx] = r / weightSum;
      temp[idx + 1] = g / weightSum;
      temp[idx + 2] = b / weightSum;
      temp[idx + 3] = a / weightSum;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        weightSum = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        const py = Math.min(height - 1, Math.max(0, y + ky));
        const idx = (py * width + x) * 4;
        const weight = kernel[ky + radius];

        r += temp[idx] * weight;
        g += temp[idx + 1] * weight;
        b += temp[idx + 2] * weight;
        a += temp[idx + 3] * weight;
        weightSum += weight;
      }

      const idx = (y * width + x) * 4;
      result[idx] = r / weightSum;
      result[idx + 1] = g / weightSum;
      result[idx + 2] = b / weightSum;
      result[idx + 3] = a / weightSum;
    }
  }

  return result;
}

/**
 * Create a Gaussian kernel for blur
 *
 * @param size - Kernel size
 * @param sigma - Standard deviation
 * @returns Gaussian kernel weights
 */
function createGaussianKernel(size: number, sigma: number): number[] {
  const kernel: number[] = [];
  const mean = Math.floor(size / 2);
  let sum = 0;

  for (let i = 0; i < size; i++) {
    const x = i - mean;
    const weight = Math.exp(-0.5 * (x * x) / (sigma * sigma));
    kernel[i] = weight;
    sum += weight;
  }

  // Normalize
  return kernel.map((w) => w / sum);
}

/**
 * Apply ghosting (double vision) effect
 *
 * @param imageData - Image data
 * @param width - Image width
 * @param height - Image height
 * @param config - Ghosting configuration
 * @returns Image data with ghosting effect
 */
export function applyGhosting(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  config: GhostingConfig = DEFAULT_GHOSTING_CONFIG
): Uint8ClampedArray {
  const { offset, opacity } = config;
  const result = new Uint8ClampedArray(imageData);

  // Overlay a shifted semi-transparent copy
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ghostX = x + offset.x;
      const ghostY = y + offset.y;

      if (ghostX >= 0 && ghostX < width && ghostY >= 0 && ghostY < height) {
        const idx = (y * width + x) * 4;
        const ghostIdx = (ghostY * width + ghostX) * 4;

        // Blend ghost image with original
        result[idx] = imageData[idx] * (1 - opacity) + imageData[ghostIdx] * opacity;
        result[idx + 1] = imageData[idx + 1] * (1 - opacity) + imageData[ghostIdx + 1] * opacity;
        result[idx + 2] = imageData[idx + 2] * (1 - opacity) + imageData[ghostIdx + 2] * opacity;
      }
    }
  }

  return result;
}

/**
 * Apply yellowing (aging lens) effect
 *
 * @param imageData - Image data
 * @param config - Yellowing configuration
 * @returns Image data with yellowing effect
 */
export function applyYellowing(
  imageData: Uint8ClampedArray,
  config: YellowingConfig = DEFAULT_YELLOWING_CONFIG
): Uint8ClampedArray {
  const { intensity } = config;
  const result = new Uint8ClampedArray(imageData.length);

  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];

    // Add yellow tint (increase red and green, reduce blue)
    result[i] = Math.min(255, r + intensity * 50);
    result[i + 1] = Math.min(255, g + intensity * 40);
    result[i + 2] = Math.max(0, b - intensity * 30);
    result[i + 3] = imageData[i + 3]; // Preserve alpha
  }

  return result;
}

/**
 * Apply loss of contrast effect
 *
 * @param imageData - Image data
 * @param config - Contrast loss configuration
 * @returns Image data with reduced contrast
 */
export function applyContrastLoss(
  imageData: Uint8ClampedArray,
  config: ContrastLossConfig = DEFAULT_CONTRAST_LOSS_CONFIG
): Uint8ClampedArray {
  const { reduction } = config;
  const result = new Uint8ClampedArray(imageData.length);
  const factor = 1 - reduction; // 0.5 reduction = 50% contrast

  for (let i = 0; i < imageData.length; i += 4) {
    // Move each color channel toward middle gray (128)
    result[i] = 128 + (imageData[i] - 128) * factor;
    result[i + 1] = 128 + (imageData[i + 1] - 128) * factor;
    result[i + 2] = 128 + (imageData[i + 2] - 128) * factor;
    result[i + 3] = imageData[i + 3]; // Preserve alpha
  }

  return result;
}

/**
 * Apply bright light (photophobia) effect
 *
 * @param imageData - Image data
 * @param config - Bright light configuration
 * @returns Image data with bright light effect
 */
export function applyBrightLight(
  imageData: Uint8ClampedArray,
  config: BrightLightConfig = DEFAULT_BRIGHT_LIGHT_CONFIG
): Uint8ClampedArray {
  const { intensity, washout } = config;
  const result = new Uint8ClampedArray(imageData.length);

  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];

    // Increase brightness
    let r2 = r + intensity * (255 - r);
    let g2 = g + intensity * (255 - g);
    let b2 = b + intensity * (255 - b);

    // Apply washout (desaturation toward white)
    const gray = (r2 + g2 + b2) / 3;
    r2 = r2 * (1 - washout) + 255 * washout;
    g2 = g2 * (1 - washout) + 255 * washout;
    b2 = b2 * (1 - washout) + 255 * washout;

    result[i] = Math.min(255, r2);
    result[i + 1] = Math.min(255, g2);
    result[i + 2] = Math.min(255, b2);
    result[i + 3] = imageData[i + 3]; // Preserve alpha
  }

  return result;
}

/**
 * Apply central vision loss (macular degeneration simulation)
 *
 * Simulates loss of central vision while peripheral vision remains clear.
 * Blurs and darkens the center of the image based on distance from center.
 *
 * @param imageData - Original image data
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param config - Central vision loss configuration
 * @returns Processed image data
 */
export function applyCentralVisionLoss(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  config: CentralVisionLossConfig
): Uint8ClampedArray {
  const { radius, severity } = config;
  const result = new Uint8ClampedArray(imageData);
  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate blur factor (1 = full blur at center, 0 = no blur at edges)
      // Uses smooth falloff from center to radius
      const blurFactor = Math.max(0, 1 - distance / radius) * severity;

      if (blurFactor > 0) {
        // Apply blur and darkening to simulate scotoma (blind spot)
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];

        // Convert to grayscale for blur effect
        const gray = r * 0.299 + g * 0.587 + b * 0.114;

        // Apply darkening (simulates dead photoreceptors)
        const darkenedGray = gray * 0.5;

        // Blend between original and darkened gray based on blur factor
        result[idx] = r * (1 - blurFactor) + darkenedGray * blurFactor;
        result[idx + 1] = g * (1 - blurFactor) + darkenedGray * blurFactor;
        result[idx + 2] = b * (1 - blurFactor) + darkenedGray * blurFactor;
      }
    }
  }

  return result;
}

/**
 * Apply peripheral vision loss (glaucoma/tunnel vision simulation)
 *
 * Simulates loss of peripheral vision creating a tunnel vision effect.
 * Blurs and darkens the edges while keeping center clear.
 *
 * @param imageData - Original image data
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param config - Peripheral vision loss configuration
 * @returns Processed image data
 */
export function applyPeripheralVisionLoss(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  config: PeripheralVisionLossConfig
): Uint8ClampedArray {
  const { tunnelRadius, severity } = config;
  const result = new Uint8ClampedArray(imageData);
  const centerX = width / 2;
  const centerY = height / 2;

  // Calculate max distance from center to corner (for normalization)
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate darkening factor (0 at center, 1 at edges)
      // Starts at tunnelRadius and increases toward edges
      const darkenFactor = Math.max(
        0,
        (distance - tunnelRadius) / (maxDistance - tunnelRadius)
      ) * severity;

      if (darkenFactor > 0) {
        // Apply vignette darkening effect
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];

        // Darken toward black (simulates peripheral vision loss)
        result[idx] = r * (1 - darkenFactor * 0.8);
        result[idx + 1] = g * (1 - darkenFactor * 0.8);
        result[idx + 2] = b * (1 - darkenFactor * 0.8);
      }
    }
  }

  return result;
}

/**
 * Convert Uint8Array (PNG/JPEG) to ImageData-compatible Uint8ClampedArray
 *
 * Note: In the Figma plugin environment, we need to use Canvas API in the UI thread
 * This function is a placeholder - actual conversion happens in UI via Canvas
 */
export function uint8ArrayToImageData(data: Uint8Array): Uint8ClampedArray {
  return new Uint8ClampedArray(data);
}

/**
 * Resize image data (for performance optimization)
 *
 * @param imageData - Original image data
 * @param originalWidth - Original width
 * @param originalHeight - Original height
 * @param targetWidth - Target width
 * @param targetHeight - Target height
 * @returns Resized image data
 */
export function resizeImageData(
  imageData: Uint8ClampedArray,
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(targetWidth * targetHeight * 4);
  const xRatio = originalWidth / targetWidth;
  const yRatio = originalHeight / targetHeight;

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const px = Math.floor(x * xRatio);
      const py = Math.floor(y * yRatio);
      const srcIdx = (py * originalWidth + px) * 4;
      const dstIdx = (y * targetWidth + x) * 4;

      result[dstIdx] = imageData[srcIdx];
      result[dstIdx + 1] = imageData[srcIdx + 1];
      result[dstIdx + 2] = imageData[srcIdx + 2];
      result[dstIdx + 3] = imageData[srcIdx + 3];
    }
  }

  return result;
}

/**
 * Calculate optimal preview dimensions while maintaining aspect ratio
 *
 * @param width - Original width
 * @param height - Original height
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns Optimized dimensions
 */
export function calculatePreviewDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = width / height;

  let newWidth = width;
  let newHeight = height;

  if (width > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
}
