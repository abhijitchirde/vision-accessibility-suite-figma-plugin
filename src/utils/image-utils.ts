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
} from "./vision-simulator.types";
import {
  DEFAULT_BLUR_CONFIG,
  DEFAULT_GHOSTING_CONFIG,
  DEFAULT_YELLOWING_CONFIG,
  DEFAULT_CONTRAST_LOSS_CONFIG,
  DEFAULT_BRIGHT_LIGHT_CONFIG,
  DEFAULT_ANOMALY_SEVERITY,
} from "./vision-simulator.constants";
import { ColorBlindnessType } from "./vision-simulator.types";
import {
  MachadoDeficiency,
  getMachadoMatrix,
  lerpMatrix,
  ACHROMATOPSIA_LINEAR_MATRIX,
} from "./machado-matrices";

/**
 * Default severity for a color blindness type: 1.0 for the complete forms
 * (-opia), the configured default for the partial forms (-omaly).
 */
function getDefaultSeverity(type: ColorBlindnessType): number {
  switch (type) {
    case "protanomaly":
    case "deuteranomaly":
    case "tritanomaly":
      return DEFAULT_ANOMALY_SEVERITY[type];
    default:
      return 1.0;
  }
}

/** Which Machado deficiency a color blindness type uses (null = achromatopsia) */
function getMachadoDeficiency(type: ColorBlindnessType): MachadoDeficiency | null {
  switch (type) {
    case "protanopia":
    case "protanomaly":
      return "protan";
    case "deuteranopia":
    case "deuteranomaly":
      return "deutan";
    case "tritanopia":
    case "tritanomaly":
      return "tritan";
    default:
      return null;
  }
}

/**
 * The 3×3 matrix (for linear RGB) that simulates a type at a severity.
 * Exported for tests and tools.
 */
export function getColorBlindnessMatrix(
  type: ColorBlindnessType,
  severity: number
): TransformationMatrix {
  const deficiency = getMachadoDeficiency(type);
  if (deficiency) return getMachadoMatrix(deficiency, severity);

  // Achromatopsia: blend from normal vision to luminance only
  const s = Math.max(0, Math.min(1, severity));
  const identity: TransformationMatrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  return lerpMatrix(identity, ACHROMATOPSIA_LINEAR_MATRIX, s);
}

/**
 * sRGB ↔ linear RGB conversion. Color-blindness matrices must be applied to
 * linear light, not to the gamma-encoded 0–255 values stored in images.
 * Both directions use lookup tables so the per-pixel cost stays low.
 */
const SRGB_TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  SRGB_TO_LINEAR[i] =
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Linear value (0–1, quantised to 1/LINEAR_STEPS) → sRGB byte */
const LINEAR_STEPS = 4095;
const LINEAR_TO_SRGB = new Uint8ClampedArray(LINEAR_STEPS + 1);
for (let i = 0; i <= LINEAR_STEPS; i++) {
  const c = i / LINEAR_STEPS;
  const encoded =
    c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  LINEAR_TO_SRGB[i] = Math.round(encoded * 255);
}

function linearToSrgbByte(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 255;
  return LINEAR_TO_SRGB[Math.round(value * LINEAR_STEPS)];
}

/**
 * Apply color blindness simulation to image data
 *
 * Uses the Machado et al. (2009) model for protan, deutan and tritan
 * deficiencies at any severity, applied in linear RGB. Severity 1.0 is the
 * complete form (-opia); lower values are the partial forms (-omaly).
 * Achromatopsia uses Rec. 709 luminance.
 *
 * @param imageData - Uint8ClampedArray in RGBA format
 * @param type - Type of color blindness (dichromacy or anomaly)
 * @param severity - Optional severity (0-1). If not provided, uses the type's default.
 * @returns New image data (the input is not modified)
 *
 * @example
 * applyColorBlindness(imageData, 'deuteranopia');       // complete, severity 1.0
 * applyColorBlindness(imageData, 'deuteranomaly');      // default severity 0.6
 * applyColorBlindness(imageData, 'protanomaly', 0.3);   // mild
 */
export function applyColorBlindness(
  imageData: Uint8ClampedArray,
  type: ColorBlindnessType,
  severity?: number
): Uint8ClampedArray {
  const effectiveSeverity =
    severity !== undefined ? severity : getDefaultSeverity(type);
  const m = getColorBlindnessMatrix(type, effectiveSeverity);

  const m00 = m[0][0], m01 = m[0][1], m02 = m[0][2];
  const m10 = m[1][0], m11 = m[1][1], m12 = m[1][2];
  const m20 = m[2][0], m21 = m[2][1], m22 = m[2][2];

  const result = new Uint8ClampedArray(imageData.length);

  for (let i = 0; i < imageData.length; i += 4) {
    const r = SRGB_TO_LINEAR[imageData[i]];
    const g = SRGB_TO_LINEAR[imageData[i + 1]];
    const b = SRGB_TO_LINEAR[imageData[i + 2]];

    result[i] = linearToSrgbByte(m00 * r + m01 * g + m02 * b);
    result[i + 1] = linearToSrgbByte(m10 * r + m11 * g + m12 * b);
    result[i + 2] = linearToSrgbByte(m20 * r + m21 * g + m22 * b);
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
    result = applyGaussianBlur(
      result,
      width,
      height,
      radius
    ) as Uint8ClampedArray;
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
    const weight = Math.exp((-0.5 * (x * x)) / (sigma * sigma));
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
        result[idx] =
          imageData[idx] * (1 - opacity) + imageData[ghostIdx] * opacity;
        result[idx + 1] =
          imageData[idx + 1] * (1 - opacity) +
          imageData[ghostIdx + 1] * opacity;
        result[idx + 2] =
          imageData[idx + 2] * (1 - opacity) +
          imageData[ghostIdx + 2] * opacity;
      }
    }
  }

  return result;
}

/**
 * Apply yellowing (aging lens) effect with color temperature adjustment
 *
 * @param imageData - Image data
 * @param config - Yellowing configuration
 * @returns Image data with yellowing effect
 */
export function applyYellowing(
  imageData: Uint8ClampedArray,
  config: YellowingConfig = DEFAULT_YELLOWING_CONFIG
): Uint8ClampedArray {
  const { intensity, temperature } = config;
  const result = new Uint8ClampedArray(imageData.length);

  // Color temperature adjustment
  // Lower temperature (1000-2500K) = warmer/more yellow (like old lens)
  // Higher temperature (4000-6500K) = cooler/less yellow, more neutral
  // Normalize temperature to 0-1 range (1000K = very warm, 6500K = neutral)
  const normalizedTemp = Math.max(0, Math.min(1, (temperature - 1000) / 5500));

  // Calculate temperature-based color shifts
  // At low temp (0): strong yellow/warm shift
  // At high temp (1): minimal shift (more neutral)
  const tempWarmth = 1 - normalizedTemp; // 1 = very warm, 0 = neutral

  // Temperature adjustment factors (more pronounced effect)
  const tempRedShift = tempWarmth * 0.4; // Increase red for warmth
  const tempGreenShift = tempWarmth * 0.2; // Increase green for warmth
  const tempBlueShift = tempWarmth * -0.5; // Decrease blue for warmth

  for (let i = 0; i < imageData.length; i += 4) {
    let r = imageData[i];
    let g = imageData[i + 1];
    let b = imageData[i + 2];

    // Apply color temperature adjustment (scaled by intensity)
    const tempR = Math.min(255, Math.max(0, r + tempRedShift * 60 * intensity));
    const tempG = Math.min(
      255,
      Math.max(0, g + tempGreenShift * 40 * intensity)
    );
    const tempB = Math.min(
      255,
      Math.max(0, b + tempBlueShift * 50 * intensity)
    );

    // Apply additional intensity-based yellowing
    const yellowR = Math.min(255, tempR + intensity * 30);
    const yellowG = Math.min(255, tempG + intensity * 25);
    const yellowB = Math.max(0, tempB - intensity * 20);

    result[i] = Math.round(yellowR);
    result[i + 1] = Math.round(yellowG);
    result[i + 2] = Math.round(yellowB);
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
 * The CENTER is darkened (blind spot), while the PERIPHERAL (visible area) is blurred.
 * Larger radius = more peripheral blur.
 * Blur intensity scales with both radius AND severity.
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
  config: CentralVisionLossConfig,
  pixelScale: number = 1
): Uint8ClampedArray {
  // pixelScale: size of this image relative to the full export (e.g. 0.4 for
  // a downscaled preview), so the internal blur matches the exported result
  const { radius, severity } = config;
  
  // If severity is 0 or radius is very small, return original (no effect)
  if (severity === 0 || radius < 1) {
    return new Uint8ClampedArray(imageData);
  }

  // Calculate blur intensity based on BOTH radius AND severity
  // Larger radius = more area affected = more blur on peripheral vision
  // Higher severity = stronger effect = more blur
  const imageSize = Math.min(width, height);
  const normalizedRadius = radius / imageSize; // 0-1 range
  
  // Scale blur from 2px (small radius/severity) to 20px (large radius/severity)
  // Both radius and severity contribute to blur intensity
  const baseBlurRadius = 2 + normalizedRadius * 18;
  const blurRadius = Math.round(baseBlurRadius * severity * pixelScale);

  // If blur radius is too small, minimal blur needed
  if (blurRadius < 2) {
    // Apply minimal processing
    const result = new Uint8ClampedArray(imageData);
    const centerX = width / 2;
    const centerY = height / 2;
    const totalEffectRadius = radius * 1.8;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= totalEffectRadius) {
          const r = imageData[idx];
          const g = imageData[idx + 1];
          const b = imageData[idx + 2];

          // Single continuous gradient
          const normalizedDist = distance / totalEffectRadius;
          const darknessCurve = 1 - Math.pow(normalizedDist, 1.5);
          const darkeningAmount = darknessCurve * severity;

          // Color-preserving darkening - 5% brightness for stronger darkness
          const darkFactor = 0.05;
          const darkenedR = r * darkFactor;
          const darkenedG = g * darkFactor;
          const darkenedB = b * darkFactor;

          result[idx] = r * (1 - darkeningAmount) + darkenedR * darkeningAmount;
          result[idx + 1] = g * (1 - darkeningAmount) + darkenedG * darkeningAmount;
          result[idx + 2] = b * (1 - darkeningAmount) + darkenedB * darkeningAmount;
        }
        // Outside effect zone: pixels remain unchanged (already copied from imageData)
      }
    }
    return result;
  }
  
  // Apply blur to entire image (affects peripheral/visible area)
  const blurred = applyGaussianBlur(imageData, width, height, blurRadius);
  const smoothBlurred = applyGaussianBlur(blurred, width, height, blurRadius);
  
  // Blend between original and blurred based on severity
  // Lower severity = more original, higher severity = more blur
  const result = new Uint8ClampedArray(imageData.length);
  const centerX = width / 2;
  const centerY = height / 2;

  // Total effect radius including fade - the gradient extends smoothly from center to this point
  const totalEffectRadius = radius * 1.8;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Get pixel values
      const origR = imageData[idx];
      const origG = imageData[idx + 1];
      const origB = imageData[idx + 2];
      const blurredR = smoothBlurred[idx];
      const blurredG = smoothBlurred[idx + 1];
      const blurredB = smoothBlurred[idx + 2];

      if (distance <= totalEffectRadius) {
        // Single continuous gradient from center (dark) to edge (normal)
        // normalizedDist: 0 at center, 1 at totalEffectRadius
        const normalizedDist = distance / totalEffectRadius;

        // Use sigmoid-like curve for smooth S-shaped transition
        // Dark in center, holds darkness longer, then smooth fade to normal
        const darknessCurve = 1 - Math.pow(normalizedDist, 1.5);

        // Calculate darkening amount based on curve and severity
        const darkeningAmount = darknessCurve * severity;

        // Very dark at center (5% brightness for stronger darkness), fading to normal
        // Use color-preserving darkening instead of pure grayscale for less gray look
        const darkFactor = 0.05;

        // Blend: darkened color in center, gradually becomes blurred image
        const darkenedR = blurredR * darkFactor;
        const darkenedG = blurredG * darkFactor;
        const darkenedB = blurredB * darkFactor;

        result[idx] = blurredR * (1 - darkeningAmount) + darkenedR * darkeningAmount;
        result[idx + 1] = blurredG * (1 - darkeningAmount) + darkenedG * darkeningAmount;
        result[idx + 2] = blurredB * (1 - darkeningAmount) + darkenedB * darkeningAmount;
        result[idx + 3] = imageData[idx + 3];
      } else {
        // OUTSIDE effect zone - normal peripheral vision with blur based on severity
        result[idx] = origR * (1 - severity) + blurredR * severity;
        result[idx + 1] = origG * (1 - severity) + blurredG * severity;
        result[idx + 2] = origB * (1 - severity) + blurredB * severity;
        result[idx + 3] = imageData[idx + 3];
      }
    }
  }

  return result;
}

/**
 * Apply peripheral vision loss (glaucoma/tunnel vision simulation)
 *
 * Simulates loss of peripheral vision creating a tunnel vision effect.
 * The CENTER (tunnel) is blurred (visible but strained), while PERIPHERAL is darkened (lost vision).
 * Smaller clear radius = more blur on remaining visible center.
 * Blur intensity scales with both radius AND severity.
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
  config: PeripheralVisionLossConfig,
  pixelScale: number = 1
): Uint8ClampedArray {
  // pixelScale: see applyCentralVisionLoss
  const { tunnelRadius, severity } = config;
  
  // If severity is 0, return original (no effect)
  if (severity === 0) {
    return new Uint8ClampedArray(imageData);
  }
  
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  // If tunnel radius is larger than max distance, entire image is clear (no effects)
  if (tunnelRadius >= maxDistance) {
    return new Uint8ClampedArray(imageData);
  }

  // Calculate blur intensity based on BOTH tunnel radius AND severity
  // SMALLER tunnel radius (more restricted vision) = MORE blur on center visible area
  // Higher severity = stronger effect = more blur
  const imageSize = Math.min(width, height);
  const normalizedRadius = tunnelRadius / imageSize; // 0-1 range
  
  // Inverse relationship: smaller radius = more blur (2-20px range)
  // Both radius and severity contribute to blur intensity
  const baseBlurRadius = 2 + (1 - normalizedRadius) * 18;
  const blurRadius = Math.round(baseBlurRadius * severity * pixelScale);
  
  // If blur radius is too small, minimal blur needed
  if (blurRadius < 2) {
    const result = new Uint8ClampedArray(imageData);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > tunnelRadius) {
          // OUTSIDE tunnel - apply minimal darkening
          const darkeningFactor =
            Math.max(0, (distance - tunnelRadius) / (maxDistance - tunnelRadius)) *
            severity;
          const darkeningAmount = Math.min(1, darkeningFactor * 1.04);
          
          result[idx] = imageData[idx] * (1 - darkeningAmount);
          result[idx + 1] = imageData[idx + 1] * (1 - darkeningAmount);
          result[idx + 2] = imageData[idx + 2] * (1 - darkeningAmount);
        }
      }
    }
    return result;
  }
  
  // Apply blur to entire image (will affect both center and periphery)
  const blurred = applyGaussianBlur(imageData, width, height, blurRadius);
  const smoothBlurred = applyGaussianBlur(blurred, width, height, blurRadius);
  
  const result = new Uint8ClampedArray(imageData.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= tunnelRadius) {
        // INSIDE tunnel (visible center area) - blend blur based on severity
        const origR = imageData[idx];
        const origG = imageData[idx + 1];
        const origB = imageData[idx + 2];
        const blurredR = smoothBlurred[idx];
        const blurredG = smoothBlurred[idx + 1];
        const blurredB = smoothBlurred[idx + 2];
        
        // Blend between original and blurred based on severity
        result[idx] = origR * (1 - severity) + blurredR * severity;
        result[idx + 1] = origG * (1 - severity) + blurredG * severity;
        result[idx + 2] = origB * (1 - severity) + blurredB * severity;
        result[idx + 3] = imageData[idx + 3];
      } else {
        // OUTSIDE tunnel (peripheral - lost vision) - blur + darken
        const darkeningFactor =
          Math.max(0, (distance - tunnelRadius) / (maxDistance - tunnelRadius)) *
          severity;

        // Get blurred pixel values
        const blurredR = smoothBlurred[idx];
        const blurredG = smoothBlurred[idx + 1];
        const blurredB = smoothBlurred[idx + 2];

        // Increased darkness: was 0.8, now 1.04 (30% darker)
        const darkeningAmount = Math.min(1, darkeningFactor * 1.04);
        
        // Apply heavy darkening to periphery
        result[idx] = blurredR * (1 - darkeningAmount);
        result[idx + 1] = blurredG * (1 - darkeningAmount);
        result[idx + 2] = blurredB * (1 - darkeningAmount);
        result[idx + 3] = imageData[idx + 3];
      }
    }
  }

  return result;
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

/**
 * Scale a blur radius for an image that is `scale` times the full export
 * size. Keeps at least 1px so a downscaled preview still shows some blur.
 */
export function scaleBlurRadius(radius: number, scale: number): number {
  if (radius <= 0) return 0;
  return Math.max(1, Math.round(radius * scale));
}

/**
 * Apply a filter preset (multiple filters in sequence)
 *
 * This function takes a preset configuration and applies all filters
 * sequentially to the image data. Each filter's output becomes the input
 * for the next filter, creating combined effects.
 *
 * @param imageData - Original image data (Uint8ClampedArray in RGBA format)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param preset - Filter preset containing multiple filter configurations
 * @returns Processed image data with all filters applied
 *
 * @example
 * // Apply "Advanced Cataracts" preset (blur + yellowing + contrast loss)
 * const filteredData = applyFilterPreset(
 *   imageData,
 *   width,
 *   height,
 *   DEFAULT_PRESETS.find(p => p.id === 'advanced-cataracts')!
 * );
 */
export function applyFilterPreset(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  preset: import("./vision-simulator.types").FilterPreset,
  pixelScale: number = 1
): Uint8ClampedArray {
  // pixelScale: size of this image relative to the full export. Pixel-based
  // settings (blur radius, ghost offset, visual-field radius) are scaled by it
  // so a downscaled preview matches the exported result.
  const px = (value: number) => value * pixelScale;
  let result = new Uint8ClampedArray(imageData) as Uint8ClampedArray;

  // Apply each filter in sequence
  for (const filterConfig of preset.filters) {
    if (
      filterConfig.type === "protanopia" ||
      filterConfig.type === "deuteranopia" ||
      filterConfig.type === "tritanopia" ||
      filterConfig.type === "achromatopsia" ||
      filterConfig.type === "protanomaly" ||
      filterConfig.type === "deuteranomaly" ||
      filterConfig.type === "tritanomaly"
    ) {
      // Color blindness filter
      result = applyColorBlindness(
        result,
        filterConfig.type,
        filterConfig.severity
      ) as Uint8ClampedArray;
    } else if (filterConfig.type === "blurred") {
      // Blur filter
      result = applyBlur(result, width, height, {
        ...filterConfig.config,
        radius: scaleBlurRadius(filterConfig.config.radius, pixelScale),
      }) as Uint8ClampedArray;
    } else if (filterConfig.type === "ghosting") {
      // Ghosting filter
      const { offset } = filterConfig.config;
      result = applyGhosting(result, width, height, {
        ...filterConfig.config,
        offset: { x: Math.round(px(offset.x)), y: Math.round(px(offset.y)) },
      }) as Uint8ClampedArray;
    } else if (filterConfig.type === "yellowing") {
      // Yellowing filter
      result = applyYellowing(result, filterConfig.config) as Uint8ClampedArray;
    } else if (filterConfig.type === "loss-of-contrast") {
      // Contrast loss filter
      result = applyContrastLoss(
        result,
        filterConfig.config
      ) as Uint8ClampedArray;
    } else if (filterConfig.type === "bright-light") {
      // Bright light filter
      result = applyBrightLight(
        result,
        filterConfig.config
      ) as Uint8ClampedArray;
    } else if (filterConfig.type === "central-vision-loss") {
      // Central vision loss filter
      result = applyCentralVisionLoss(
        result,
        width,
        height,
        { ...filterConfig.config, radius: px(filterConfig.config.radius) },
        pixelScale
      ) as Uint8ClampedArray;
    } else if (filterConfig.type === "peripheral-vision-loss") {
      // Peripheral vision loss filter
      result = applyPeripheralVisionLoss(
        result,
        width,
        height,
        {
          ...filterConfig.config,
          tunnelRadius: px(filterConfig.config.tunnelRadius),
        },
        pixelScale
      ) as Uint8ClampedArray;
    }
  }

  return result;
}
