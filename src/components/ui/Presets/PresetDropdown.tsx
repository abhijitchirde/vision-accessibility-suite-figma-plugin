import React, { useState, useRef, useEffect } from "react";
import "./PresetDropdown.css";
import { FilterPreset } from "../../../utils/vision-simulator.types";

interface PresetDropdownProps {
  presets: FilterPreset[];
  selectedPreset: FilterPreset | null;
  onChange: (preset: FilterPreset | null) => void;
  className?: string;
}

/**
 * Custom dropdown component for preset selection
 * Shows built-in and custom presets with a divider between them
 */
export const PresetDropdown: React.FC<PresetDropdownProps> = ({
  presets,
  selectedPreset,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const builtInPresets = presets.filter((p) => p.isBuiltIn);
  const customPresets = presets.filter((p) => !p.isBuiltIn);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true);
    }
  };

  const handleOptionClick = (preset: FilterPreset | null) => {
    onChange(preset);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div
      className={`preset-dropdown ${className}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        className="preset-dropdown__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="preset-dropdown__button-text">
          {selectedPreset?.name || "No preset selected"}
        </span>
        <svg
          className="preset-dropdown__chevron"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <path
            d="M2 4 L6 8 L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="preset-dropdown__menu" role="listbox">
          {/* No preset option */}
          <button
            className={`preset-dropdown__option ${
              !selectedPreset ? "preset-dropdown__option--selected" : ""
            }`}
            onClick={() => handleOptionClick(null)}
            role="option"
            aria-selected={!selectedPreset}
          >
            <span className="preset-dropdown__option-text">
              No preset selected
            </span>
          </button>

          {/* Built-in presets */}
          {builtInPresets.length > 0 && (
            <>
              <div className="preset-dropdown__divider" />
              {builtInPresets.map((preset) => (
                <button
                  key={preset.id}
                  className={`preset-dropdown__option ${
                    selectedPreset?.id === preset.id
                      ? "preset-dropdown__option--selected"
                      : ""
                  }`}
                  onClick={() => handleOptionClick(preset)}
                  role="option"
                  aria-selected={selectedPreset?.id === preset.id}
                >
                  <span className="preset-dropdown__option-text">
                    {preset.name}
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Custom presets */}
          {customPresets.length > 0 && (
            <>
              <div className="preset-dropdown__divider" />
              {customPresets.map((preset) => (
                <button
                  key={preset.id}
                  className={`preset-dropdown__option ${
                    selectedPreset?.id === preset.id
                      ? "preset-dropdown__option--selected"
                      : ""
                  }`}
                  onClick={() => handleOptionClick(preset)}
                  role="option"
                  aria-selected={selectedPreset?.id === preset.id}
                >
                  <span className="preset-dropdown__option-text">
                    {preset.name}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
