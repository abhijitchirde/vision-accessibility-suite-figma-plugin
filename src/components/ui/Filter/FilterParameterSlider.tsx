import React from 'react';
import './FilterParameterSlider.css';

interface FilterParameterSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
}

/**
 * Generic slider component for filter parameters
 *
 * Used to control various filter parameters like blur radius,
 * yellowing intensity, contrast reduction, etc.
 */
export const FilterParameterSlider: React.FC<FilterParameterSliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.01,
  unit,
  description,
}) => {
  const displayValue = unit ? `${value.toFixed(2)}${unit}` : value.toFixed(2);

  return (
    <div className="filter-parameter-slider">
      <div className="filter-parameter-slider__header">
        <label className="filter-parameter-slider__label">{label}</label>
        <span className="filter-parameter-slider__value">{displayValue}</span>
      </div>

      <input
        type="range"
        className="filter-parameter-slider__range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />

      {description && (
        <p className="filter-parameter-slider__description">{description}</p>
      )}
    </div>
  );
};
