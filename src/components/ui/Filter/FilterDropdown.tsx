import React, { useState, useRef, useEffect } from "react";
import "./FilterDropdown.css";
import { FilterIcon } from "./FilterIcon";
import { SimulationType } from "../../../utils/vision-simulator.types";
import { FILTER_METADATA } from "../../../utils/vision-simulator.constants";

interface FilterOption {
  value: SimulationType;
  label: string;
  groupLabel?: string;
  showIcon?: boolean;
}

interface FilterDropdownProps {
  value: SimulationType;
  onChange: (value: SimulationType) => void;
  options: FilterOption[];
  className?: string;
  placeholder?: string;
  showPlaceholder?: boolean;
}

/**
 * Custom dropdown component that supports icons for filter options
 */
export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  value,
  onChange,
  options,
  className = "",
  placeholder,
  showPlaceholder = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const handleOptionClick = (option: FilterOption) => {
    onChange(option.value);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  // Group options by their groupLabel
  const groupedOptions: { [key: string]: FilterOption[] } = {};
  options.forEach((option) => {
    const group = option.groupLabel || "Other";
    if (!groupedOptions[group]) {
      groupedOptions[group] = [];
    }
    groupedOptions[group].push(option);
  });

  return (
    <div
      className={`filter-dropdown ${className}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        className="filter-dropdown__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="filter-dropdown__button-content">
          {!showPlaceholder && selectedOption?.showIcon && (
            <FilterIcon filterId={value} size="tiny" />
          )}
          <span
            className={`filter-dropdown__button-text ${
              showPlaceholder ? "filter-dropdown__button-text--placeholder" : ""
            }`}
          >
            {showPlaceholder
              ? placeholder || "Select filter..."
              : selectedOption?.label || "Select filter..."}
          </span>
        </span>
        <svg
          className="filter-dropdown__chevron"
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
        <div className="filter-dropdown__menu" role="listbox">
          {Object.entries(groupedOptions).map(([groupLabel, groupOptions]) => (
            <div key={groupLabel} className="filter-dropdown__group">
              {groupLabel !== "None" && (
                <div className="filter-dropdown__group-label">{groupLabel}</div>
              )}
              {groupOptions.map((option) => (
                <button
                  key={option.value}
                  className={`filter-dropdown__option ${
                    value === option.value
                      ? "filter-dropdown__option--selected"
                      : ""
                  }`}
                  onClick={() => handleOptionClick(option)}
                  role="option"
                  aria-selected={value === option.value}
                >
                  {option.showIcon && (
                    <FilterIcon filterId={option.value} size="tiny" />
                  )}
                  <span className="filter-dropdown__option-text">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
