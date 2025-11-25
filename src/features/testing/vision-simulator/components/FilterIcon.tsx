import React from 'react';
import { FILTER_ICONS } from '../vision-simulator-icons';
import './FilterIcon.css';

interface FilterIconProps {
  filterId: string;
  size?: 'small' | 'medium';
}

/**
 * Icon SVG components for each filter type
 */
const IconSymbols: Record<string, React.FC<{ color: string; size: number }>> = {
  'blur-circle': ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" fill={color} opacity="0.3" />
      <circle cx="12" cy="12" r="6" fill={color} opacity="0.5" />
      <circle cx="12" cy="12" r="4" fill={color} opacity="0.8" />
    </svg>
  ),
  'double-square': ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="6" width="12" height="12" fill={color} opacity="0.4" />
      <rect x="9" y="9" width="12" height="12" fill={color} opacity="0.7" />
    </svg>
  ),
  'diamond': ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4 L20 12 L12 20 L4 12 Z" fill={color} />
    </svg>
  ),
  'low-contrast-circle': ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" fill="#E0E0E0" />
      <circle cx="12" cy="12" r="6" fill={color} />
    </svg>
  ),
  'starburst': ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" fill={color} />
      <path d="M12 2 L12 8" stroke={color} strokeWidth="2" />
      <path d="M12 16 L12 22" stroke={color} strokeWidth="2" />
      <path d="M2 12 L8 12" stroke={color} strokeWidth="2" />
      <path d="M16 12 L22 12" stroke={color} strokeWidth="2" />
      <path d="M5 5 L9 9" stroke={color} strokeWidth="2" />
      <path d="M15 15 L19 19" stroke={color} strokeWidth="2" />
      <path d="M19 5 L15 9" stroke={color} strokeWidth="2" />
      <path d="M9 15 L5 19" stroke={color} strokeWidth="2" />
    </svg>
  ),
  'center-dot': ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" opacity="0.3" />
      <circle cx="12" cy="12" r="5" fill={color} opacity="0.8" />
    </svg>
  ),
  'tunnel': ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.7" />
      <circle cx="12" cy="12" r="5" fill="white" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
    </svg>
  ),
};

/**
 * FilterIcon displays either horizontal color bars or icon symbols
 * representing the visual characteristics of each vision impairment condition
 */
export const FilterIcon: React.FC<FilterIconProps> = ({ filterId, size = 'small' }) => {
  const iconData = FILTER_ICONS[filterId];

  if (!iconData) {
    return null;
  }

  const iconSize = size === 'small' ? 24 : 32;

  // Render color bars for color-blind filters
  if (iconData.type === 'color-bars') {
    return (
      <div
        className={`filter-icon filter-icon--bars filter-icon--${size}`}
        aria-label={iconData.description}
        title={iconData.description}
      >
        {iconData.colors.map((color, index) => (
          <div
            key={index}
            className="filter-icon__bar"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    );
  }

  // Render icon symbol for other filters
  const IconComponent = IconSymbols[iconData.icon];
  if (!IconComponent) {
    return null;
  }

  return (
    <div
      className={`filter-icon filter-icon--symbol filter-icon--${size}`}
      aria-label={iconData.description}
      title={iconData.description}
    >
      <IconComponent color={iconData.color} size={iconSize} />
    </div>
  );
};
