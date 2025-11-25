/**
 * SeveritySlider Component
 *
 * A slider control for adjusting color vision deficiency severity from 0% (normal vision)
 * to 100% (complete dichromacy). Includes preset buttons for common severity levels.
 */

import React from 'react';
import './SeveritySlider.css';
import { SEVERITY_PRESETS } from '../vision-simulator.constants';

export interface SeveritySliderProps {
  /** Current severity value (0-1) */
  value: number;
  /** Callback when severity changes */
  onChange: (severity: number) => void;
  /** Label for the slider */
  label?: string;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Whether to show the current percentage */
  showPercentage?: boolean;
}

/**
 * SeveritySlider component for adjusting color vision deficiency severity
 *
 * Features:
 * - Slider from 0% (normal) to 100% (complete)
 * - Preset buttons: Mild (30%), Moderate (60%), Severe (90%), Complete (100%)
 * - Visual percentage display
 * - Tooltip showing severity meaning
 */
export const SeveritySlider: React.FC<SeveritySliderProps> = ({
  value,
  onChange,
  label = 'Severity',
  disabled = false,
  showPercentage = true,
}) => {
  const percentage = Math.round(value * 100);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    onChange(newValue);
  };

  const handlePresetClick = (presetValue: number) => {
    if (!disabled) {
      onChange(presetValue);
    }
  };

  /**
   * Get severity description based on percentage
   */
  const getSeverityDescription = (): string => {
    if (percentage === 0) return 'Normal vision';
    if (percentage <= 30) return 'Mild partial deficiency';
    if (percentage <= 60) return 'Moderate partial deficiency';
    if (percentage < 100) return 'Severe partial deficiency';
    return 'Complete dichromacy';
  };

  return (
    <div className="severity-slider">
      <div className="severity-slider__header">
        <label className="severity-slider__label">{label}</label>
        {showPercentage && (
          <span className="severity-slider__percentage" title={getSeverityDescription()}>
            {percentage}%
          </span>
        )}
      </div>

      <div className="severity-slider__slider-container">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          className="severity-slider__slider"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-valuetext={`${percentage}% - ${getSeverityDescription()}`}
        />
        <div className="severity-slider__track-labels">
          <span className="severity-slider__track-label">Normal</span>
          <span className="severity-slider__track-label">Complete</span>
        </div>
      </div>

      <div className="severity-slider__presets">
        <button
          type="button"
          className={`severity-slider__preset ${value === SEVERITY_PRESETS.mild ? 'severity-slider__preset--active' : ''}`}
          onClick={() => handlePresetClick(SEVERITY_PRESETS.mild)}
          disabled={disabled}
          title="Mild partial deficiency (30%)"
        >
          Mild
        </button>
        <button
          type="button"
          className={`severity-slider__preset ${value === SEVERITY_PRESETS.moderate ? 'severity-slider__preset--active' : ''}`}
          onClick={() => handlePresetClick(SEVERITY_PRESETS.moderate)}
          disabled={disabled}
          title="Moderate partial deficiency (60%)"
        >
          Moderate
        </button>
        <button
          type="button"
          className={`severity-slider__preset ${value === SEVERITY_PRESETS.severe ? 'severity-slider__preset--active' : ''}`}
          onClick={() => handlePresetClick(SEVERITY_PRESETS.severe)}
          disabled={disabled}
          title="Severe partial deficiency (90%)"
        >
          Severe
        </button>
        <button
          type="button"
          className={`severity-slider__preset ${value === SEVERITY_PRESETS.complete ? 'severity-slider__preset--active' : ''}`}
          onClick={() => handlePresetClick(SEVERITY_PRESETS.complete)}
          disabled={disabled}
          title="Complete dichromacy (100%)"
        >
          Complete
        </button>
      </div>

      <p className="severity-slider__description">{getSeverityDescription()}</p>
    </div>
  );
};
