# Vision Simulator

## Tool Overview

The Vision Simulator allows designers to preview how their designs appear to people with various visual impairments, including color blindness and other vision conditions. This helps ensure designs are accessible to users with diverse visual abilities.

**Addresses**: WCAG 2.1 Success Criterion 1.4.1 (Use of Color), 1.4.3 (Contrast Minimum), and general visual accessibility considerations

**Key Features**:
- **Color Blindness Simulation**: Protanopia, Deuteranopia, Tritanopia, Achromatopsia
- **Other Visual Impairments**: Blurred vision, ghosting, yellowing, loss of contrast, bright light sensitivity
- **Two Modes**:
  - **Generate**: Creates canvas copies with filters applied
  - **Simulation**: Live preview in plugin panel
- **Real-time Processing**: Uses Canvas API for fast, client-side image processing

---

## How It Works

### High-Level Process

1. **User selects a design element** (frame, component, image, etc.)
2. **Choose simulation mode**:
   - **Generate Mode**: Select one or more filters and create canvas copies
   - **Simulation Mode**: Select a single filter and preview in real-time
3. **Image Processing**:
   - Plugin exports selected node as PNG image
   - UI applies transformation using Canvas API and filter algorithms
   - Result is displayed (preview) or applied back to canvas (generate)

### Color Blindness Simulation

Color blindness simulations use **color transformation matrices** based on scientifically validated models:

- **Brettel, Viénot, and Mollon (1997)**: Dichromacy simulation model
- **Machado, Oliveira, and Fernandes (2009)**: Physiologically-based color vision deficiency model

Each type of color blindness is simulated by applying a 3×3 transformation matrix to RGB values:

```
[R', G', B'] = Matrix × [R, G, B]
```

**Types**:
- **Protanopia** (Red-blind): Missing L-cones (~1% of males)
- **Deuteranopia** (Green-blind): Missing M-cones (~1% of males)
- **Tritanopia** (Blue-blind): Missing S-cones (~0.001% of population)
- **Achromatopsia** (Total color blindness): No functional cones (~0.003% of population)

### Other Visual Impairments

**Blurred Vision**:
- **Algorithm**: Separable Gaussian blur
- **Use Case**: Simulates cataracts, uncorrected refractive errors
- **Implementation**: Two-pass convolution (horizontal + vertical)

**Ghosting (Diplopia)**:
- **Algorithm**: Offset image overlay with transparency
- **Use Case**: Simulates double vision
- **Implementation**: Blend shifted image copy with original

**Yellowing**:
- **Algorithm**: Color temperature shift toward yellow
- **Use Case**: Simulates aging lens, early cataracts
- **Implementation**: Increase red/green channels, reduce blue

**Loss of Contrast**:
- **Algorithm**: Compress color range toward middle gray
- **Use Case**: Simulates reduced contrast sensitivity
- **Implementation**: Linear interpolation toward gray (128, 128, 128)

**Bright Light (Photophobia)**:
- **Algorithm**: Brightness increase + color washout
- **Use Case**: Simulates light sensitivity
- **Implementation**: Brighten + desaturate toward white

---

## Filter Presets (Phase C)

**NEW**: Filter presets allow you to simulate realistic, complex vision conditions by applying multiple filters in sequence.

### What Are Presets?

Presets are named combinations of filters that simulate real-world vision conditions. Each preset applies multiple filters sequentially, where each filter's output becomes the next filter's input, creating authentic combined effects.

**Example**: The "Advanced Cataracts" preset applies:
1. Heavy blur (15px radius, 3 iterations)
2. Yellow tint (80% intensity)
3. Contrast loss (60% reduction)

This creates a realistic simulation of severe cataracts that's more accurate than applying a single blur filter.

### Built-in Presets

**Advanced Cataracts**
- Severe cataracts with heavy blur, yellowing, and contrast loss
- Simulates: Late-stage cataracts requiring surgery
- Filters: Blur(15px, 3×) + Yellowing(80%) + Contrast Loss(60%)

**Aging Vision (65+)**
- Typical age-related vision changes
- Simulates: Normal aging effects in seniors
- Filters: Blur(4px) + Yellowing(30%) + Contrast Loss(25%)

**Aging Vision (80+)**
- Advanced aging with significant degradation
- Simulates: Elderly vision with early macular degeneration
- Filters: Blur(10px, 2×) + Yellowing(70%) + Contrast Loss(50%) + Central Vision Loss

**Outdoor Viewing**
- Bright sunlight conditions with glare
- Simulates: Using a device outdoors in direct sunlight
- Filters: Bright Light(80%, 60% washout) + Contrast Loss(40%)

**Night Vision**
- Low-light viewing conditions
- Simulates: Reduced visibility in dark environments
- Filters: Contrast Loss(55%) + Blur(3px)

### Using Presets

**In Vision Lab Mode:**
1. Open the Vision Simulator
2. Switch to "Vision Lab" tab
3. Select a node in Figma
4. Choose a preset from the "Filter Preset" dropdown
5. Preview updates in real-time with all filters applied

**Note**: When a preset is selected, single-filter controls are hidden. Clear the preset to use individual filters.

### Managing Custom Presets

**Import Presets:**
1. Click the settings icon next to "Filter Preset"
2. Click "Import Presets"
3. Select a JSON file containing preset definitions

**Export Presets:**
1. Open Preset Manager (settings icon)
2. Click the download icon next to any preset
3. Save as JSON file

**Delete Custom Presets:**
1. Open Preset Manager
2. Click the trash icon next to custom presets
3. Confirm deletion

**Built-in presets cannot be deleted** but can be exported and modified as custom presets.

### Preset File Format

Presets are stored as JSON:

```json
[
  {
    "id": "custom-preset-1",
    "name": "My Custom Preset",
    "description": "Description of what this simulates",
    "isBuiltIn": false,
    "filters": [
      {
        "type": "blurred",
        "config": {
          "radius": 8,
          "iterations": 2
        }
      },
      {
        "type": "yellowing",
        "config": {
          "intensity": 0.5,
          "temperature": 2500
        }
      }
    ]
  }
]
```

### Technical Implementation

**Sequential Application:**
- Filters are applied in order defined in the preset
- Each filter processes the output of the previous filter
- This creates authentic combined effects not possible with parallel processing

**Performance:**
- Presets are processed client-side using Canvas API
- Performance scales with number and complexity of filters
- Typical preset (3-4 filters) processes in <1 second for 800×600px images

**Supported Filter Types:**
- Color blindness (with severity control)
- Visual field defects (central/peripheral vision loss)
- Blur, ghosting, yellowing, contrast loss, bright light

---

## Data Flow Diagram

### Generate Mode (Canvas Copies)

```
User selects filters + clicks "Generate"
    ↓
UI → Plugin: VISION_SIMULATOR_GENERATE message
    ↓
Plugin: Get selected node
    ↓
Plugin: Create empty frames on canvas (one per filter)
    ↓
Plugin: Export selected node as PNG
    ↓
For each filter:
    ↓
  Plugin → UI: VISION_SIMULATOR_PROCESS_FILTER message
      ↓
  UI: Load image into Canvas
      ↓
  UI: Apply filter transformation
      ↓
  UI: Convert canvas to PNG
      ↓
  UI → Plugin: VISION_SIMULATOR_APPLY_FILTERED_IMAGE message
      ↓
  Plugin: Apply filtered image to frame
    ↓
Plugin → UI: VISION_SIMULATOR_GENERATE_RESULT (success)
```

### Simulation Mode (Live Preview)

```
User selects filter from dropdown
    ↓
UI → Plugin: VISION_SIMULATOR_REQUEST_PREVIEW message
    ↓
Plugin: Get selected node
    ↓
Plugin: Export selected node as PNG
    ↓
Plugin → UI: VISION_SIMULATOR_PREVIEW_DATA message
    ↓
UI: Load image into Canvas
    ↓
UI: Apply filter transformation
    ↓
UI: Display filtered image in preview area
    ↓
User changes zoom level or filter → Re-apply transformation
```

---

## User Interaction Flow

### Generate Mode

1. User opens Vision Simulator tool
2. User stays on "Generate" tab (default)
3. User selects design element in Figma canvas
4. User checks filters to apply:
   - Individual checkboxes for each filter
   - "Select all simulations" checkbox for all filters
5. User clicks "Generate" button
6. Plugin creates frames next to original design
7. Each frame shows the design with a different filter applied
8. Labels appear above each frame (e.g., "Protanopia", "Blurred")

### Simulation Mode

1. User opens Vision Simulator tool
2. User clicks "Simulation" tab
3. User selects design element in Figma canvas
4. User clicks "Load Preview" button
5. Preview appears in panel
6. User selects filter from "Simulation" dropdown
7. Preview updates in real-time to show filtered version
8. User adjusts zoom level to inspect details
9. User clicks "Reload Preview" to refresh with new selection

---

## Technical Implementation

### Color Transformation Matrices

**Protanopia Matrix**:
```
[0.567, 0.433, 0.0  ]
[0.558, 0.442, 0.0  ]
[0.0,   0.242, 0.758]
```

**Deuteranopia Matrix**:
```
[0.625, 0.375, 0.0]
[0.7,   0.3,   0.0]
[0.0,   0.3,   0.7]
```

**Tritanopia Matrix**:
```
[0.95, 0.05,  0.0  ]
[0.0,  0.433, 0.567]
[0.0,  0.475, 0.525]
```

**Achromatopsia Matrix** (Grayscale using luminance weights):
```
[0.299, 0.587, 0.114]
[0.299, 0.587, 0.114]
[0.299, 0.587, 0.114]
```

### Gaussian Blur Algorithm

```typescript
// Create Gaussian kernel
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

// Apply separable blur (horizontal then vertical)
// Two-pass convolution for O(n×m×k) instead of O(n×m×k²)
```

### Performance Optimizations

1. **Separable Gaussian Blur**: O(n×m×k) instead of O(n×m×k²)
2. **Canvas API**: Hardware-accelerated image processing
3. **Progressive Rendering**: Filters applied on-demand
4. **Image Downsampling**: Preview images limited to 800×600px max
5. **Client-side Processing**: No server roundtrips

---

## Scientific/Technical References

### Color Blindness Simulation

1. **Brettel, H., Viénot, F., & Mollon, J. D. (1997)**
   "Computerized simulation of color appearance for dichromats"
   *Journal of the Optical Society of America A*, 14(10), 2647-2655.
   [DOI: 10.1364/JOSAA.14.002647](https://doi.org/10.1364/JOSAA.14.002647)

2. **Machado, G. M., Oliveira, M. M., & Fernandes, L. A. (2009)**
   "A physiologically-based model for simulation of color vision deficiency"
   *IEEE Transactions on Visualization and Computer Graphics*, 15(6), 1291-1298.
   [DOI: 10.1109/TVCG.2009.113](https://doi.org/10.1109/TVCG.2009.113)
   [Project Page](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html)

### WCAG Guidelines

3. **WCAG 2.1: Use of Color (1.4.1)**
   [https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)

4. **WCAG 2.1: Contrast (Minimum) (1.4.3)**
   [https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

### Color Blindness Information

5. **National Eye Institute: Color Blindness**
   [https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/color-blindness](https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/color-blindness)

6. **Color Blindness Simulation Research**
   [https://ixora.io/projects/colorblindness/color-blindness-simulation-research/](https://ixora.io/projects/colorblindness/color-blindness-simulation-research/)

---

## External Resources & Dependencies

### npm Packages

None - Uses native browser Canvas API and TypeScript

### Reference Implementations

1. **Daltonize Algorithm** (Color blindness simulation)
   [https://github.com/DaltonLens/libDaltonLens](https://github.com/DaltonLens/libDaltonLens)

2. **Color Matrix Reference**
   [https://github.com/skratchdot/color-blind](https://github.com/skratchdot/color-blind)

### Tools & Inspiration

3. **Color Oracle** (Desktop color blindness simulator)
   [https://colororacle.org/](https://colororacle.org/)

4. **Stark Plugin** (Figma accessibility plugin)
   Reference for UX patterns (two-tab interface)

---

## Testing Approach

### Manual Testing Checklist

**Generate Mode**:
- [ ] Select a colorful design with text and graphics
- [ ] Check all filters and click Generate
- [ ] Verify 9 frames are created next to original
- [ ] Verify each frame has correct label
- [ ] Verify filters are visually distinct
- [ ] Test with complex nested components
- [ ] Test with images
- [ ] Test with gradients

**Simulation Mode**:
- [ ] Select a design element
- [ ] Click "Load Preview" - verify preview appears
- [ ] Switch between filters - verify real-time updates
- [ ] Test zoom levels (25%, 50%, 100%, 200%, 400%)
- [ ] Click "Reload Preview" - verify refresh works
- [ ] Test with large images (performance)

**Filter Accuracy**:
- [ ] Protanopia: Red-green confusion (red→brownish, green→tan)
- [ ] Deuteranopia: Red-green confusion (similar to protanopia)
- [ ] Tritanopia: Blue-yellow confusion (blue→greenish, yellow→pink)
- [ ] Achromatopsia: Pure grayscale, no color
- [ ] Blurred: Gaussian blur visible
- [ ] Ghosting: Double image effect visible
- [ ] Yellowing: Yellow/warm tint visible
- [ ] Loss of Contrast: Flatter, less vibrant
- [ ] Bright Light: Washed out, lighter

### Test Color Combinations

| Color Pair | Normal | Protanopia | Deuteranopia | Tritanopia |
|------------|--------|------------|--------------|------------|
| Red (#FF0000) vs Green (#00FF00) | Distinct | Similar | Similar | Distinct |
| Blue (#0000FF) vs Yellow (#FFFF00) | Distinct | Distinct | Distinct | Similar |
| Red (#FF0000) vs Blue (#0000FF) | Distinct | Distinct | Distinct | Distinct |
| Orange (#FFA500) vs Green (#00FF00) | Distinct | Confused | Confused | Distinct |

---

## Known Limitations

1. **Simplified Color Blindness Models**: Uses Brettel's dichromacy model; doesn't account for anomalous trichromacy (partial color deficiency)
2. **No Severity Adjustment**: Filters simulate complete color blindness; doesn't support mild/moderate cases
3. **Image-only Simulation**: Cannot simulate interactive elements (hover states, animations)
4. **Performance**: Large images (>4000×4000px) may slow down processing
5. **No Real-time Canvas Monitoring**: Generate mode requires manual regeneration if design changes
6. **Single Node Export**: Can only simulate one design element at a time

---

## Future Enhancements

1. **Severity Slider**: Adjust color blindness intensity (mild, moderate, severe)
2. **Anomalous Trichromacy**: Support partial color deficiencies (protanomaly, deuteranomaly, tritanomaly)
3. **Batch Processing**: Simulate multiple elements simultaneously
4. **Side-by-side Comparison**: Split-screen original vs filtered view
5. **Filter Combinations**: Apply multiple filters simultaneously (e.g., yellowing + blur for aging vision)
6. **Export Simulations**: Save filtered images as PNG/JPG
7. **Cataracts Simulation**: More advanced aging vision effects
8. **Macular Degeneration**: Central vision blur/distortion
9. **Real-time Monitoring**: Auto-regenerate when design changes (like Typography monitoring)
10. **Accessibility Score**: Analyze how well design works across all filters

---

**Tool Status**: ✅ Fully Implemented
**Version**: 1.0
**Last Updated**: 2025-11-23
**Scientific Accuracy**: High (based on peer-reviewed research)
**Performance**: Optimized (Canvas API, separable blur)
