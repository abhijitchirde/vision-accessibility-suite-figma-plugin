/**
 * RadiusSlider Component
 *
 * Reusable slider for adjusting visual field defect radius
 * (e.g., central vision loss radius, tunnel vision radius)
 */

import React from "react";
import "./RadiusSlider.css";

export interface RadiusSliderProps {
  value: number; // Radius value (pixels or percentage)
  onChange: (radius: number) => void;
  label?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  showValue?: boolean;
  unit?: string; // Unit to display (default: "px")
}

export const RadiusSlider: React.FC<RadiusSliderProps> = ({
  value,
  onChange,
  label = "Radius",
  min = 50,
  max = 300,
  disabled = false,
  showValue = true,
  unit = "px",
}) => {
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  // Determine step based on unit - use 1 for percentages, 10 for pixels
  const step = unit === "%" ? 1 : 10;

  return (
    <div className="radius-slider">
      <div className="radius-slider__header">
        <label className="radius-slider__label">{label}</label>
        {showValue && (
          <span className="radius-slider__value">
            {value}
            {unit}
          </span>
        )}
      </div>

      <input
        type="range"
        className="radius-slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
        disabled={disabled}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} ${unit === "%" ? "percent" : "pixels"}`}
      />
    </div>
  );
};
