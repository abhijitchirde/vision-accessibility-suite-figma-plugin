# Phase 4b: Enhanced Vision Simulator - Detailed Planning Document

**Version**: 1.0
**Created**: 2025-11-25
**Status**: 📋 Planning
**Parent Phase**: Phase 4 (Vision Simulator)

---

## Executive Summary

This document outlines the enhancement plan for the Vision Simulator, transforming it from a basic color blindness and visual impairment simulator into a comprehensive vision accessibility testing suite. The enhancements will add **partial color vision deficiencies** (the most common form affecting ~8% of males), **visual field defects** for layout testing, and **severity controls** for realistic testing scenarios.

### Current State (Phase 4 - Completed ✅)

**What We Have:**
- ✅ 4 complete color blindness types (Protanopia, Deuteranopia, Tritanopia, Achromatopsia)
- ✅ 5 other visual impairments (Blurred, Ghosting, Yellowing, Loss of Contrast, Bright Light)
- ✅ Two-mode interface (Generate mode + Simulation mode)
- ✅ Scientific accuracy (Brettel-Viénot-Mollon transformation matrices)
- ✅ 9 total filter types

**What We're Missing:**
- ❌ Partial color vision deficiencies (5-8x more common than complete)
- ❌ Severity controls (most conditions exist on a spectrum)
- ❌ Visual field defects (central/peripheral vision loss)
- ❌ Combined condition presets (realistic real-world scenarios)
- ❌ Layout testing capabilities (only tests appearance currently)

### Target State (Phase 4b - Planned)

**What We'll Add:**
- ✅ 3 partial color vision deficiencies with severity slider (0-100%)
- ✅ 2 visual field defects (central + peripheral vision loss)
- ✅ Severity controls for all existing filters
- ✅ Combined condition presets (e.g., "Advanced Cataracts", "Aging Vision 65+")
- ✅ Layout testing dimension (not just color/clarity)

**Impact:**
- Covers **~8% of males** with color vision deficiencies (vs ~1% currently)
- Tests **layout and positioning**, not just appearance
- More **realistic** testing (mild to severe conditions)
- **Comprehensive** vision accessibility testing suite

---

## Why These Enhancements?

### 1. Current Coverage Gap

**Color Vision Deficiencies by Prevalence:**

| Condition | Current Coverage | Prevalence (Males) | Prevalence (Females) |
|-----------|-----------------|-------------------|---------------------|
| **Deuteranomaly** (weak green) | ❌ Not covered | **~5-6%** | ~0.4% |
| **Protanomaly** (weak red) | ❌ Not covered | **~1%** | ~0.01% |
| Deuteranopia (no green) | ✅ Covered | ~1% | ~0.01% |
| Protanopia (no red) | ✅ Covered | ~1% | ~0.01% |
| **Tritanomaly** (weak blue) | ❌ Not covered | **~0.01%** | ~0.01% |
| Tritanopia (no blue) | ✅ Covered | ~0.001% | ~0.001% |
| Achromatopsia (no color) | ✅ Covered | ~0.003% | ~0.003% |

**Key Insight:** We're currently testing for ~2% of males, but missing the **6%** with partial deficiencies.

**Deuteranomaly alone is 5x more common than all complete color blindness types combined!**

### 2. Design Decisions This Helps

#### With Severity Slider + Partial Color Vision:
- ✅ **Color palette selection** - Test if color schemes work for mild/moderate/severe cases
- ✅ **UI state differentiation** - Hover, active, disabled, selected states
- ✅ **Data visualization** - Charts, graphs, color-coded information
- ✅ **Status indicators** - Success/warning/error colors
- ✅ **Link visibility** - Can users distinguish links from text?
- ✅ **Form validation** - Error states visible enough?

#### With Visual Field Defects:
- ✅ **Information hierarchy** - Is critical info visible with peripheral/central loss?
- ✅ **Navigation placement** - Can users with tunnel vision find nav?
- ✅ **Multi-column layouts** - Do columns work with field defects?
- ✅ **Modal positioning** - Are modals visible with vision loss?
- ✅ **Notification placement** - Can users see alerts/toasts?
- ✅ **Banner placement** - Top banners visible with central vision loss?

#### With Combined Presets:
- ✅ **Aging population** - Test for 65+, 80+ user scenarios
- ✅ **Real-world conditions** - Conditions rarely occur in isolation
- ✅ **Progressive conditions** - Test mild → moderate → severe progression

---

## Implementation Phases

### Phase A: Color Vision Completeness (Weeks 1-2)
**Goal:** Make the simulator cover the full spectrum of color vision deficiencies

#### What We'll Build:
1. **Severity Slider System**
   - 0% = Normal vision
   - 100% = Complete dichromacy (current implementation)
   - Intermediate values = Anomalous trichromacy
   - Linear interpolation between identity matrix and dichromacy matrix

2. **Partial Color Vision Deficiencies**
   - **Protanomaly** (weak red) - interpolation between identity and protanopia matrix
   - **Deuteranomaly** (weak green) - interpolation between identity and deuteranopia matrix
   - **Tritanomaly** (weak blue) - interpolation between identity and tritanopia matrix

3. **Updated UI**
   - Severity slider (0-100%) for color blindness filters
   - Real-time preview as slider changes
   - Preset severity buttons: Mild (30%), Moderate (60%), Severe (90%)
   - Tooltip showing what percentage represents (e.g., "60% = Moderate Deuteranomaly")

#### Technical Approach:

**Matrix Interpolation Algorithm:**
```typescript
/**
 * Interpolate between identity matrix (normal vision) and
 * dichromacy matrix (complete color blindness)
 *
 * @param severity 0-1 (0 = normal, 1 = complete dichromacy)
 * @param dichromacyMatrix Target transformation matrix
 */
function interpolateColorMatrix(
  severity: number,
  dichromacyMatrix: TransformationMatrix
): TransformationMatrix {
  // Identity matrix (normal vision)
  const identityMatrix: TransformationMatrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  // Linear interpolation
  return [
    [
      identityMatrix[0][0] * (1 - severity) + dichromacyMatrix[0][0] * severity,
      identityMatrix[0][1] * (1 - severity) + dichromacyMatrix[0][1] * severity,
      identityMatrix[0][2] * (1 - severity) + dichromacyMatrix[0][2] * severity,
    ],
    [
      identityMatrix[1][0] * (1 - severity) + dichromacyMatrix[1][0] * severity,
      identityMatrix[1][1] * (1 - severity) + dichromacyMatrix[1][1] * severity,
      identityMatrix[1][2] * (1 - severity) + dichromacyMatrix[1][2] * severity,
    ],
    [
      identityMatrix[2][0] * (1 - severity) + dichromacyMatrix[2][0] * severity,
      identityMatrix[2][1] * (1 - severity) + dichromacyMatrix[2][1] * severity,
      identityMatrix[2][2] * (1 - severity) + dichromacyMatrix[2][2] * severity,
    ],
  ];
}
```

**Example Usage:**
```typescript
// Mild deuteranomaly (30% severity)
const mildMatrix = interpolateColorMatrix(0.3, DEUTERANOPIA_MATRIX);

// Moderate deuteranomaly (60% severity)
const moderateMatrix = interpolateColorMatrix(0.6, DEUTERANOPIA_MATRIX);

// Severe deuteranomaly (90% severity) - almost complete deuteranopia
const severeMatrix = interpolateColorMatrix(0.9, DEUTERANOPIA_MATRIX);

// Complete deuteranopia (100% severity) - same as current implementation
const completeMatrix = interpolateColorMatrix(1.0, DEUTERANOPIA_MATRIX);
```

#### Files to Modify:
- `vision-simulator.types.ts` - Add severity to filter metadata
- `vision-simulator.constants.ts` - Add default severity values
- `image-utils.ts` - Add matrix interpolation function
- `VisionSimulatorPanel.tsx` - Add severity slider UI
- `VisionSimulatorPanel.css` - Style severity controls

#### New Types:
```typescript
export interface ColorBlindnessConfig {
  type: ColorBlindnessType;
  severity: number; // 0-1 (0 = normal, 1 = complete)
}

export interface FilterWithSeverity {
  filter: SimulationType;
  severity?: number; // Optional, defaults to 1.0 for backwards compatibility
}
```

---

### Phase B: Layout Testing (Weeks 2-3)
**Goal:** Add visual field defect simulations for testing layout and positioning

#### What We'll Build:

1. **Central Vision Loss (Macular Degeneration)**
   - Blur/obscure center of view
   - Clear periphery
   - Adjustable radius (affects how large the center blind spot is)
   - Adjustable severity (0% = no blur, 100% = complete central blindness)

2. **Peripheral Vision Loss / Tunnel Vision (Glaucoma)**
   - Clear center
   - Blur/darken edges (vignette effect)
   - Adjustable radius (affects size of clear "tunnel")
   - Adjustable severity (0% = no loss, 100% = extreme tunnel vision)

#### Technical Approach:

**Central Vision Loss Algorithm:**
```typescript
/**
 * Apply central vision loss (macular degeneration simulation)
 * Blurs/darkens the center while keeping periphery clear
 */
export function applyCentralVisionLoss(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  config: CentralVisionLossConfig
): Uint8ClampedArray {
  const { radius, severity } = config; // radius in pixels, severity 0-1
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
      const blurFactor = Math.max(0, 1 - distance / radius) * severity;

      if (blurFactor > 0) {
        // Apply blur and darkening
        const gray = imageData[idx] * 0.299 + imageData[idx + 1] * 0.587 + imageData[idx + 2] * 0.114;
        result[idx] = imageData[idx] * (1 - blurFactor) + gray * blurFactor * 0.5;
        result[idx + 1] = imageData[idx + 1] * (1 - blurFactor) + gray * blurFactor * 0.5;
        result[idx + 2] = imageData[idx + 2] * (1 - blurFactor) + gray * blurFactor * 0.5;
      }
    }
  }

  return result;
}
```

**Peripheral Vision Loss Algorithm:**
```typescript
/**
 * Apply peripheral vision loss (glaucoma/tunnel vision simulation)
 * Blurs/darkens edges while keeping center clear
 */
export function applyPeripheralVisionLoss(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  config: PeripheralVisionLossConfig
): Uint8ClampedArray {
  const { tunnelRadius, severity } = config; // tunnelRadius in pixels, severity 0-1
  const result = new Uint8ClampedArray(imageData);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate darkening factor (0 at center, 1 at edges)
      const darkenFactor = Math.max(0, (distance - tunnelRadius) / (maxDistance - tunnelRadius)) * severity;

      if (darkenFactor > 0) {
        // Apply vignette darkening
        result[idx] = imageData[idx] * (1 - darkenFactor * 0.7);
        result[idx + 1] = imageData[idx + 1] * (1 - darkenFactor * 0.7);
        result[idx + 2] = imageData[idx + 2] * (1 - darkenFactor * 0.7);
      }
    }
  }

  return result;
}
```

#### New Filter Types:
```typescript
export type VisionFieldType =
  | 'central-vision-loss'    // Macular degeneration
  | 'peripheral-vision-loss'; // Glaucoma/tunnel vision

export interface CentralVisionLossConfig {
  radius: number; // Radius of affected area in pixels
  severity: number; // 0-1 (0 = no loss, 1 = complete center blindness)
}

export interface PeripheralVisionLossConfig {
  tunnelRadius: number; // Radius of clear center area in pixels
  severity: number; // 0-1 (0 = no loss, 1 = extreme tunnel vision)
}
```

#### UI Updates:
- Add "Vision Field Defects" category in filter dropdown
- Add radius slider for both central and peripheral loss
- Add severity slider for field defect intensity
- Visual overlay showing affected area (optional)
- Preview side-by-side to show what's visible vs not

---

### Phase C: Realism & Presets (Weeks 3-4)
**Goal:** Add severity controls to existing filters and create realistic combined presets

#### What We'll Build:

1. **Severity Controls for Existing Filters**
   - Blur intensity (1-20px radius)
   - Yellowing intensity (0-100%)
   - Contrast loss intensity (0-100%)
   - Ghosting offset and opacity
   - Bright light intensity

2. **Combined Condition Presets**
   - **"Advanced Cataracts"** = Blur (high) + Yellowing (high) + Contrast Loss (medium) + Halos
   - **"Aging Vision (65+)"** = Yellowing (mild) + Blur (mild) + Contrast Loss (mild)
   - **"Aging Vision (80+)"** = Yellowing (high) + Blur (high) + Contrast Loss (high) + Central Vision Loss (mild)
   - **"Outdoor Viewing"** = Bright Light (high) + Contrast Loss (medium)
   - **"Night Vision"** = Contrast Loss (high) + Blur (mild)

3. **Preset Management**
   - Save custom presets
   - Load preset configurations
   - Share presets (export/import JSON)
   - Default presets library

#### Technical Approach:

**Preset System:**
```typescript
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: FilterConfig[];
  category: 'aging' | 'conditions' | 'environmental' | 'custom';
}

export interface FilterConfig {
  type: SimulationType;
  severity?: number;
  customConfig?: any; // Filter-specific config
}

// Example preset
const advancedCataractsPreset: FilterPreset = {
  id: 'advanced-cataracts',
  name: 'Advanced Cataracts',
  description: 'Severe cataracts with blur, yellowing, contrast loss, and halos',
  category: 'conditions',
  filters: [
    { type: 'blurred', severity: 0.9, customConfig: { radius: 12 } },
    { type: 'yellowing', severity: 0.85 },
    { type: 'loss-of-contrast', severity: 0.6 },
    // Note: Halos to be added in future
  ],
};
```

**Apply Multiple Filters Sequentially:**
```typescript
/**
 * Apply multiple filters in sequence
 * Each filter operates on the output of the previous filter
 */
export async function applyFilterPreset(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  preset: FilterPreset
): Promise<Uint8ClampedArray> {
  let result = new Uint8ClampedArray(imageData);

  for (const filterConfig of preset.filters) {
    result = await applyFilter(result, width, height, filterConfig);
  }

  return result;
}
```

#### UI Updates:
- Preset dropdown in both Generate and Simulation modes
- "Save as Preset" button
- Preset manager modal (view, edit, delete custom presets)
- Import/Export preset functionality
- Preset preview cards with descriptions

---

## Scientific References & Research

### Color Vision Deficiency Prevalence
- **Source**: "Color Vision Deficiency" by Birch (2012), Survey of Ophthalmology
- **URL**: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3485537/

### Macular Degeneration Statistics
- **Source**: National Eye Institute, Age-Related Macular Degeneration Data
- **URL**: https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/age-related-macular-degeneration
- **Prevalence**: ~11% of people 80+, ~2% of people 50+

### Glaucoma Statistics
- **Source**: Glaucoma Research Foundation
- **URL**: https://www.glaucoma.org/glaucoma/glaucoma-facts-and-stats.php
- **Prevalence**: ~3% of people 40+, increases with age

### Color Vision Simulation Methods
- **Brettel et al. (1997)**: "Computerized simulation of color appearance for dichromats"
- **Machado et al. (2009)**: "A Physiologically-based Model for Simulation of Color Vision Deficiency"
- **URL**: https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html

---

## Implementation Order & Dependencies

### Phase A Dependencies
- **Requires**: Phase 4 completion (existing matrix transformations)
- **Blocks**: Nothing (independent)
- **Complexity**: Medium (linear interpolation)
- **Risk**: Low (well-understood mathematics)

### Phase B Dependencies
- **Requires**: Phase 4 completion (image processing pipeline)
- **Blocks**: Phase C (presets need field defects)
- **Complexity**: High (new filter algorithms)
- **Risk**: Medium (need to test performance with pixel iteration)

### Phase C Dependencies
- **Requires**: Phase A + Phase B completion (severity system + all filters)
- **Blocks**: Nothing (final enhancement)
- **Complexity**: Medium (preset system design)
- **Risk**: Low (mostly UI/UX work)

---

## Success Criteria

### Phase A Success Metrics
- [ ] Severity slider works for all color blindness types (0-100%)
- [ ] Mild/Moderate/Severe preset buttons work correctly
- [ ] Matrix interpolation produces visually correct results
- [ ] Real-time preview updates smoothly (<200ms latency)
- [ ] Generate mode creates frames with correct severity

### Phase B Success Metrics
- [ ] Central vision loss correctly blurs center, keeps periphery clear
- [ ] Peripheral vision loss correctly creates tunnel vision effect
- [ ] Radius slider changes affected area size
- [ ] Severity slider changes intensity
- [ ] Both filters work in Generate and Simulation modes
- [ ] Performance acceptable (<1s for 800×600px image)

### Phase C Success Metrics
- [ ] Severity controls work for all existing filters
- [ ] At least 5 default presets implemented
- [ ] Preset manager UI functional (save/load/delete)
- [ ] Multiple filters apply correctly in sequence
- [ ] Export/import preset functionality works
- [ ] Preset descriptions are clear and helpful

---

## Testing Strategy

### Visual Validation Testing
- Compare simulations against known reference images
- Test with color blindness simulation websites (Coblis, Color Oracle)
- User testing with people who have actual color vision deficiencies (if possible)

### Performance Testing
- Test with images of various sizes (200×200px to 4000×4000px)
- Measure processing time for each filter
- Ensure UI remains responsive during processing
- Memory leak testing with repeated filter applications

### Edge Case Testing
- Severity = 0% (should match original)
- Severity = 100% (should match Phase 4 complete deficiency)
- Extreme radius values for field defects
- Combined presets with many filters
- Very small and very large images

---

## Known Limitations & Future Enhancements

### Limitations
1. **Linear Interpolation**: Real anomalous trichromacy is more complex than linear interpolation suggests
2. **Field Defects**: Simplified models, real conditions are more irregular
3. **Performance**: Multiple filters in presets may be slow on large images
4. **No Individual Variation**: People with same condition see differently

### Future Enhancements
1. **Advanced Algorithms**:
   - Non-linear severity curves for more accurate anomalous trichromacy
   - Machado et al. (2009) physiologically-based model

2. **More Conditions**:
   - Diabetic retinopathy (dark spots, distortion)
   - Halos/glare effects
   - Floaters simulation
   - Visual snow

3. **Advanced Presets**:
   - Age-based progression (simulate vision at 60, 70, 80 years)
   - Disease progression (early → advanced stages)
   - Environmental combinations (outdoor + glare, night + cataracts)

4. **Export & Sharing**:
   - Export filtered images directly
   - Share presets with team
   - Generate comparison reports (original vs filtered)

---

## File Structure Changes

### New Files to Create:
```
src/features/testing/vision-simulator/
├── presets/                                    ← NEW
│   ├── preset.types.ts                        Types for presets
│   ├── default-presets.ts                     Built-in preset library
│   └── preset-manager.ts                      Save/load/manage presets
│
└── components/
    ├── SeveritySlider.tsx                      ← NEW (reusable slider)
    ├── SeveritySlider.css
    ├── PresetSelector.tsx                      ← NEW (preset dropdown)
    ├── PresetSelector.css
    ├── PresetManager.tsx                       ← NEW (preset management modal)
    └── PresetManager.css
```

### Files to Modify:
```
src/features/testing/vision-simulator/
├── vision-simulator.types.ts                   Add severity, presets, field defects
├── vision-simulator.constants.ts               Add default severity values, new configs
├── image-utils.ts                              Add interpolation, field defect algorithms
├── vision-simulator.ts                         Handle presets in Generate mode
└── components/
    ├── VisionSimulatorPanel.tsx               Add severity controls, preset UI
    └── VisionSimulatorPanel.css               Style new controls
```

---

## Timeline Estimate

### Phase A: Color Vision Completeness (1-2 weeks)
- **Week 1**: Implement matrix interpolation, add severity to existing filters
- **Week 2**: UI implementation (sliders, presets buttons), testing

### Phase B: Layout Testing (1 week)
- **Days 1-3**: Implement central and peripheral vision loss algorithms
- **Days 4-5**: UI integration (radius/severity sliders)
- **Days 6-7**: Testing and refinement

### Phase C: Realism & Presets (1 week)
- **Days 1-3**: Add severity to remaining filters, implement preset system
- **Days 4-5**: Create default presets, preset manager UI
- **Days 6-7**: Testing, documentation, polish

**Total Duration**: 3-4 weeks

---

## User Stories & Use Cases

### User Story 1: Designer Testing Color Palette
**As a** product designer
**I want to** test my color palette with mild deuteranomaly (the most common color vision deficiency)
**So that** I can ensure 95% of users can distinguish my UI states

**Acceptance Criteria:**
- [ ] Can select "Deuteranomaly" filter
- [ ] Can set severity to 30% (mild)
- [ ] Can see real-time preview
- [ ] Can generate frame with mild deuteranomaly applied

### User Story 2: Designer Testing Dashboard Layout
**As a** UX designer
**I want to** test if my dashboard sidebar is visible to users with tunnel vision
**So that** I can ensure users with glaucoma can navigate my app

**Acceptance Criteria:**
- [ ] Can select "Peripheral Vision Loss" filter
- [ ] Can adjust tunnel radius
- [ ] Can see which UI elements become invisible
- [ ] Can reposition navigation if needed

### User Story 3: Designer Testing for Aging Population
**As a** healthcare app designer
**I want to** test my design with "Aging Vision (80+)" preset
**So that** I can ensure my elderly users can use the app

**Acceptance Criteria:**
- [ ] Can select "Aging Vision (80+)" preset
- [ ] Preset applies blur + yellowing + contrast loss + mild central vision loss
- [ ] Can see if text is still readable
- [ ] Can adjust font sizes if needed

---

## Conclusion

Phase 4b transforms the Vision Simulator from a basic tool covering ~2% of the population with complete color blindness into a comprehensive suite covering:
- **~8% of males** with color vision deficiencies (including partial)
- **~14% of people 80+** with age-related vision loss
- **Both appearance and layout** testing dimensions
- **Realistic scenarios** with combined conditions

This makes it a truly professional-grade accessibility testing tool that designers can rely on for making inclusive design decisions.

---

**Document Status**: ✅ Complete
**Ready for Implementation**: Yes
**Next Step**: Review with user, then begin Phase A implementation
