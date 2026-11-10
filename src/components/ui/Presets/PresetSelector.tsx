import React from "react";
import "./PresetSelector.css";
import { FilterPreset } from "../../../utils/vision-simulator.types";
import { Icon } from "../Icon/Icon";
import { PresetDropdown } from "./PresetDropdown";

interface PresetSelectorProps {
  presets: FilterPreset[];
  selectedPreset: FilterPreset | null;
  onSelectPreset: (preset: FilterPreset | null) => void;
  onManagePresets?: () => void;
  /** Heading above the dropdown (default "Presets") */
  label?: string;
}

/**
 * Preset selector dropdown component
 *
 * Allows users to select from built-in and custom presets that apply
 * multiple filters in sequence to simulate real-world conditions.
 */
export const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  selectedPreset,
  onSelectPreset,
  onManagePresets,
  label = "Presets",
}) => {
  return (
    <div className="preset-selector">
      <div className="preset-selector__header">
        <label className="preset-selector__label">{label}</label>
      </div>

      <div className="preset-selector__controls">
        <PresetDropdown
          presets={presets}
          selectedPreset={selectedPreset}
          onChange={onSelectPreset}
          className="preset-selector__dropdown"
        />

        {selectedPreset && (
          <button
            className="preset-selector__reset-btn"
            onClick={() => onSelectPreset(null)}
            title="Clear: start with no simulations"
          >
            <Icon name="close" size={12} />
            Reset
          </button>
        )}

        {onManagePresets && (
          <button
            className="preset-selector__manage-btn"
            onClick={onManagePresets}
            title="Manage presets"
          >
            <Icon name="settings" size={16} />
          </button>
        )}
      </div>

      {selectedPreset && (
        <div className="preset-selector__info">
          <p className="preset-selector__description">
            {selectedPreset.description}
          </p>
          <div className="preset-selector__filters">
            {selectedPreset.filters.length} filter
            {selectedPreset.filters.length !== 1 ? "s" : ""} applied
          </div>
        </div>
      )}
    </div>
  );
};
