import React, { useId } from 'react';
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

const UNIT_WORDS: Record<string, string> = {
  px: "pixels",
  "%": "percent",
  K: "kelvin",
};

/** 4 -> "4", 0.45 -> "0.45", 2.5 -> "2.5" */
const formatNumber = (value: number) => String(Number(value.toFixed(2)));

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
  const id = useId();
  const displayValue = `${formatNumber(value)}${unit ?? ""}`;
  const spokenValue = unit
    ? `${formatNumber(value)} ${UNIT_WORDS[unit] ?? unit}`
    : formatNumber(value);

  return (
    <div className="filter-parameter-slider">
      <div className="filter-parameter-slider__header">
        <label className="filter-parameter-slider__label" htmlFor={id}>
          {label}
        </label>
        <span className="filter-parameter-slider__value">{displayValue}</span>
      </div>

      <input
        id={id}
        type="range"
        className="filter-parameter-slider__range"
        aria-valuetext={spokenValue}
        aria-describedby={description ? `${id}-description` : undefined}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />

      {description && (
        <p className="filter-parameter-slider__description" id={`${id}-description`}>
          {description}
        </p>
      )}
    </div>
  );
};
