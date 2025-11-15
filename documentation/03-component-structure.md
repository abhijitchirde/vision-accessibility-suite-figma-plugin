# Accessibility Genie - Component Structure & UI Specifications

**Version**: 1.0
**Last Updated**: 2025-11-15
**Status**: Design Specification

---

## Table of Contents

1. [Overview](#overview)
2. [Design System](#design-system)
3. [Component Library](#component-library)
4. [View Components](#view-components)
5. [Panel Components](#panel-components)
6. [Component Props & APIs](#component-props--apis)

---

## Overview

This document defines the React component structure for Accessibility Genie, including the design system, shared UI components, views, and feature-specific panels.

### Design Goals

- **Consistent**: Unified design language across all features
- **Reusable**: Shared components reduce duplication
- **Accessible**: Plugin itself must be accessible
- **Themeable**: Support light and dark modes
- **Responsive**: Adapt to different panel sizes

---

## Design System

### Color Palette

#### Light Theme
```css
:root[data-theme="light"] {
  /* Primary colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-bg-tertiary: #e8e8e8;
  --color-bg-hover: #f0f0f0;

  /* Text colors */
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;

  /* Border colors */
  --color-border: #e0e0e0;
  --color-border-strong: #cccccc;

  /* Brand colors */
  --color-brand-primary: #6366f1; /* Indigo */
  --color-brand-hover: #4f46e5;

  /* Semantic colors */
  --color-success: #10b981;
  --color-success-bg: #d1fae5;
  --color-warning: #f59e0b;
  --color-warning-bg: #fef3c7;
  --color-error: #ef4444;
  --color-error-bg: #fee2e2;
  --color-info: #3b82f6;
  --color-info-bg: #dbeafe;

  /* WCAG level colors */
  --color-wcag-aaa: #10b981;
  --color-wcag-aa: #3b82f6;
  --color-wcag-fail: #ef4444;

  /* Feature category colors */
  --color-testing-tools: #8b5cf6; /* Purple */
  --color-annotation-tools: #06b6d4; /* Cyan */
}
```

#### Dark Theme
```css
:root[data-theme="dark"] {
  /* Primary colors */
  --color-bg-primary: #1a1a1a;
  --color-bg-secondary: #2a2a2a;
  --color-bg-tertiary: #3a3a3a;
  --color-bg-hover: #2f2f2f;

  /* Text colors */
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #a8a8a8;
  --color-text-tertiary: #707070;

  /* Border colors */
  --color-border: #404040;
  --color-border-strong: #525252;

  /* Brand colors */
  --color-brand-primary: #818cf8;
  --color-brand-hover: #6366f1;

  /* Semantic colors (adjusted for dark mode) */
  --color-success: #34d399;
  --color-success-bg: #064e3b;
  --color-warning: #fbbf24;
  --color-warning-bg: #78350f;
  --color-error: #f87171;
  --color-error-bg: #7f1d1d;
  --color-info: #60a5fa;
  --color-info-bg: #1e3a8a;

  /* WCAG level colors */
  --color-wcag-aaa: #34d399;
  --color-wcag-aa: #60a5fa;
  --color-wcag-fail: #f87171;

  /* Feature category colors */
  --color-testing-tools: #a78bfa;
  --color-annotation-tools: #22d3ee;
}
```

### Typography

```css
/* Font family */
--font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
                     'Roboto', 'Helvetica', 'Arial', sans-serif;
--font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Consolas', monospace;

/* Font sizes */
--font-size-xs: 11px;
--font-size-sm: 12px;
--font-size-base: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-2xl: 24px;

/* Font weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line heights */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Spacing

```css
/* Spacing scale (4px base unit) */
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
```

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

---

## Component Library

### 1. Button Component

**File**: `src/components/ui/Button/Button.tsx`

#### Variants

```tsx
import React from 'react';
import './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  children,
}) => {
  return (
    <button
      className={`
        btn
        btn--${variant}
        btn--${size}
        ${fullWidth ? 'btn--full-width' : ''}
        ${loading ? 'btn--loading' : ''}
      `}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Spinner size="small" />}
      {icon && iconPosition === 'left' && <span className="btn__icon">{icon}</span>}
      <span className="btn__text">{children}</span>
      {icon && iconPosition === 'right' && <span className="btn__icon">{icon}</span>}
    </button>
  );
};
```

#### Styles

```css
/* Button.module.css */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Sizes */
.btn--small {
  height: 28px;
  padding: 0 var(--spacing-3);
  font-size: var(--font-size-sm);
}

.btn--medium {
  height: 36px;
  padding: 0 var(--spacing-4);
  font-size: var(--font-size-base);
}

.btn--large {
  height: 44px;
  padding: 0 var(--spacing-6);
  font-size: var(--font-size-lg);
}

/* Variants */
.btn--primary {
  background-color: var(--color-brand-primary);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background-color: var(--color-brand-hover);
}

.btn--secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover:not(:disabled) {
  background-color: var(--color-bg-hover);
}

.btn--tertiary {
  background-color: transparent;
  color: var(--color-brand-primary);
}

.btn--tertiary:hover:not(:disabled) {
  background-color: var(--color-bg-hover);
}

.btn--ghost {
  background-color: transparent;
  color: var(--color-text-primary);
}

.btn--ghost:hover:not(:disabled) {
  background-color: var(--color-bg-hover);
}

.btn--destructive {
  background-color: var(--color-error);
  color: white;
}

.btn--destructive:hover:not(:disabled) {
  background-color: #dc2626;
}

/* States */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--loading {
  cursor: wait;
}

.btn--full-width {
  width: 100%;
}
```

---

### 2. Card Component

**File**: `src/components/ui/Card/Card.tsx`

```tsx
import React from 'react';
import './Card.module.css';
import { Icon } from '../Icon/Icon';
import { Badge } from '../Badge/Badge';

interface CardProps {
  icon?: string;
  iconColor?: string;
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'error' | 'info';
  };
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  icon,
  iconColor,
  title,
  description,
  badge,
  onClick,
  disabled = false,
  children,
}) => {
  return (
    <div
      className={`card ${onClick ? 'card--clickable' : ''} ${disabled ? 'card--disabled' : ''}`}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="card__header">
        {icon && (
          <div className="card__icon" style={{ color: iconColor }}>
            <Icon name={icon} size={20} />
          </div>
        )}
        <div className="card__title-wrapper">
          <h3 className="card__title">{title}</h3>
          {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
        </div>
      </div>

      {description && <p className="card__description">{description}</p>}

      {children && <div className="card__content">{children}</div>}

      {onClick && (
        <div className="card__arrow">
          <Icon name="chevron-right" size={16} />
        </div>
      )}
    </div>
  );
};
```

---

### 3. Badge Component

**File**: `src/components/ui/Badge/Badge.tsx`

```tsx
import React from 'react';
import './Badge.module.css';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'medium',
  children,
}) => {
  return (
    <span className={`badge badge--${variant} badge--${size}`}>
      {children}
    </span>
  );
};
```

```css
/* Badge.module.css */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

/* Sizes */
.badge--small {
  height: 18px;
  padding: 0 var(--spacing-2);
  font-size: var(--font-size-xs);
}

.badge--medium {
  height: 22px;
  padding: 0 var(--spacing-3);
  font-size: var(--font-size-sm);
}

.badge--large {
  height: 26px;
  padding: 0 var(--spacing-4);
  font-size: var(--font-size-base);
}

/* Variants */
.badge--success {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.badge--warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
}

.badge--error {
  background-color: var(--color-error-bg);
  color: var(--color-error);
}

.badge--info {
  background-color: var(--color-info-bg);
  color: var(--color-info);
}

.badge--neutral {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}
```

---

### 4. Modal Component

**File**: `src/components/ui/Modal/Modal.tsx`

```tsx
import React, { useEffect } from 'react';
import './Modal.module.css';
import { Icon } from '../Icon/Icon';
import { Button } from '../Button/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'medium',
  children,
  footer,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal modal--${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
};
```

---

### 5. Dropdown Component

**File**: `src/components/ui/Dropdown/Dropdown.tsx`

```tsx
import React, { useState, useRef, useEffect } from 'react';
import './Dropdown.module.css';
import { Icon } from '../Icon/Icon';

interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  size = 'medium',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`dropdown dropdown--${size}`}>
      <button
        className="dropdown__trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="dropdown__value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon name="chevron-down" size={16} />
      </button>

      {isOpen && (
        <div className="dropdown__menu">
          {options.map((option) => (
            <button
              key={option.value}
              className={`dropdown__option ${
                option.value === value ? 'dropdown__option--selected' : ''
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.icon && <Icon name={option.icon} size={16} />}
              <span>{option.label}</span>
              {option.value === value && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

### 6. Input Component

**File**: `src/components/ui/Input/Input.tsx`

```tsx
import React from 'react';
import './Input.module.css';

interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
  showCount?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  helperText,
  error,
  disabled = false,
  maxLength,
  showCount = false,
  size = 'medium',
}) => {
  return (
    <div className="input-wrapper">
      {label && <label className="input__label">{label}</label>}

      <input
        type={type}
        className={`input input--${size} ${error ? 'input--error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
      />

      {(helperText || showCount || error) && (
        <div className="input__footer">
          <span className={`input__helper ${error ? 'input__helper--error' : ''}`}>
            {error || helperText}
          </span>
          {showCount && maxLength && (
            <span className="input__count">
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
```

---

### 7. Toggle Component

**File**: `src/components/ui/Toggle/Toggle.tsx`

```tsx
import React from 'react';
import './Toggle.module.css';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'medium',
}) => {
  return (
    <label className={`toggle toggle--${size} ${disabled ? 'toggle--disabled' : ''}`}>
      <input
        type="checkbox"
        className="toggle__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="toggle__slider"></span>
      {label && <span className="toggle__label">{label}</span>}
    </label>
  );
};
```

---

### 8. List Component

**File**: `src/components/ui/List/List.tsx`

```tsx
import React from 'react';
import './List.module.css';

interface ListProps {
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  maxHeight?: number;
}

export const List: React.FC<ListProps> = ({
  children,
  emptyState,
  maxHeight,
}) => {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="list" style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }}>
      {hasChildren ? children : emptyState}
    </div>
  );
};

interface ListItemProps {
  onClick?: () => void;
  selected?: boolean;
  children: React.ReactNode;
}

export const ListItem: React.FC<ListItemProps> = ({
  onClick,
  selected = false,
  children,
}) => {
  return (
    <div
      className={`list-item ${onClick ? 'list-item--clickable' : ''} ${
        selected ? 'list-item--selected' : ''
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
```

---

### 9. Icon Component

**File**: `src/components/ui/Icon/Icon.tsx`

```tsx
import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
}) => {
  // Icon library - using Figma's built-in icons or Heroicons/Lucide
  const icons: Record<string, JSX.Element> = {
    'wand': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M15 4V2M15 16V14M8 9H10M20 9H22M17.8 11.8L19 13M17.8 6.2L19 5M3 21L12 12M12.2 6.2L11 5"
          stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'contrast': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
        <path d="M12 3V21M12 3C7.58172 3 4 6.58172 4 11C4 15.4183 7.58172 19 12 19"
          stroke={color} strokeWidth="2"/>
      </svg>
    ),
    'typography': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 7V4H20V7M9 20H15M12 4V20"
          stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'touch': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
          stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
      </svg>
    ),
    'eye': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
          stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
      </svg>
    ),
    // Add more icons as needed...
  };

  return icons[name] || null;
};
```

---

## View Components

### MainView Component

**File**: `src/components/views/MainView/MainView.tsx`

```tsx
import React, { useState } from 'react';
import './MainView.module.css';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { Icon } from '../../ui/Icon/Icon';
import { Badge } from '../../ui/Badge/Badge';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'testing' | 'annotation';
  enabled: boolean;
}

const TOOLS: Tool[] = [
  // Testing Tools
  {
    id: 'contrast',
    name: 'Contrast',
    description: 'Check color contrast ratios',
    icon: 'contrast',
    category: 'testing',
    enabled: true,
  },
  {
    id: 'typography',
    name: 'Typography',
    description: 'Validate font sizes and text',
    icon: 'typography',
    category: 'testing',
    enabled: true,
  },
  {
    id: 'touch-targets',
    name: 'Touch Targets',
    description: 'Measure tap target sizes',
    icon: 'touch',
    category: 'testing',
    enabled: true,
  },
  {
    id: 'vision-simulator',
    name: 'Vision Simulator',
    description: 'Simulate vision impairments',
    icon: 'eye',
    category: 'testing',
    enabled: true,
  },
  {
    id: 'auto-monitoring',
    name: 'Automatic Monitoring',
    description: 'Continuous accessibility checks',
    icon: 'shield',
    category: 'testing',
    enabled: true,
  },
  // Annotation Tools
  {
    id: 'alt-text',
    name: 'Alt-Text',
    description: 'Add alternative text to images',
    icon: 'image-text',
    category: 'annotation',
    enabled: true,
  },
  {
    id: 'focus-order',
    name: 'Focus Order',
    description: 'Define keyboard navigation',
    icon: 'arrow-path',
    category: 'annotation',
    enabled: true,
  },
  {
    id: 'headings',
    name: 'Headings',
    description: 'Annotate heading structure',
    icon: 'heading',
    category: 'annotation',
    enabled: true,
  },
  {
    id: 'landmarks',
    name: 'Landmarks',
    description: 'Define page landmarks',
    icon: 'map',
    category: 'annotation',
    enabled: true,
  },
  {
    id: 'notes',
    name: 'Accessibility Notes',
    description: 'Platform-specific annotations',
    icon: 'note',
    category: 'annotation',
    enabled: true,
  },
];

export const MainView: React.FC = () => {
  const [currentView, setCurrentView] = useState<'main' | string>('main');
  const [isScanning, setIsScanning] = useState(false);

  const handleAutoScan = () => {
    setIsScanning(true);
    // Send message to plugin code
    parent.postMessage({
      pluginMessage: { type: 'RUN_AUTO_SCAN' }
    }, '*');
  };

  const handleToolClick = (toolId: string) => {
    setCurrentView(toolId);
  };

  const testingTools = TOOLS.filter(t => t.category === 'testing' && t.enabled);
  const annotationTools = TOOLS.filter(t => t.category === 'annotation' && t.enabled);

  return (
    <div className="main-view">
      {/* Auto Scan Button */}
      <div className="main-view__header">
        <Button
          variant="primary"
          size="large"
          fullWidth
          icon={<Icon name="wand" size={20} />}
          onClick={handleAutoScan}
          loading={isScanning}
        >
          Auto Scan & Fix
        </Button>
      </div>

      {/* Testing Tools Section */}
      <section className="main-view__section">
        <h2 className="main-view__section-title">Testing tools</h2>
        <div className="main-view__tools">
          {testingTools.map((tool) => (
            <Card
              key={tool.id}
              icon={tool.icon}
              iconColor="var(--color-testing-tools)"
              title={tool.name}
              description={tool.description}
              onClick={() => handleToolClick(tool.id)}
            />
          ))}
        </div>
      </section>

      {/* Annotation Tools Section */}
      <section className="main-view__section">
        <h2 className="main-view__section-title">Annotation tools</h2>
        <div className="main-view__tools">
          {annotationTools.map((tool) => (
            <Card
              key={tool.id}
              icon={tool.icon}
              iconColor="var(--color-annotation-tools)"
              title={tool.name}
              description={tool.description}
              onClick={() => handleToolClick(tool.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
```

---

## Panel Components

### Contrast Panel Example

**File**: `src/components/panels/ContrastPanel/ContrastPanel.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import './ContrastPanel.module.css';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { List, ListItem } from '../../ui/List/List';
import { Dropdown } from '../../ui/Dropdown/Dropdown';
import { useFigmaMessage } from '../../../hooks/useFigmaMessage';

interface ContrastResult {
  nodeId: string;
  nodeName: string;
  foreground: string;
  background: string;
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  isLargeText: boolean;
}

export const ContrastPanel: React.FC = () => {
  const [results, setResults] = useState<ContrastResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [level, setLevel] = useState<'AA' | 'AAA'>('AA');
  const { sendMessage, isLoading } = useFigmaMessage();

  const handleCheck = async () => {
    const response = await sendMessage('RUN_CONTRAST_CHECK', {
      scope: 'page',
      level
    });
    if (response.success) {
      setResults(response.data.results);
    }
  };

  const filteredResults = results.filter((result) => {
    if (filter === 'all') return true;
    const passes = level === 'AA' ? result.passAA : result.passAAA;
    return filter === 'pass' ? passes : !passes;
  });

  return (
    <div className="contrast-panel">
      <div className="panel__header">
        <h1>Contrast Checker</h1>
        <p>Check color contrast ratios against WCAG standards</p>
      </div>

      <div className="panel__controls">
        <Dropdown
          options={[
            { value: 'AA', label: 'WCAG Level AA' },
            { value: 'AAA', label: 'WCAG Level AAA' },
          ]}
          value={level}
          onChange={(val) => setLevel(val as 'AA' | 'AAA')}
        />

        <Button
          variant="primary"
          onClick={handleCheck}
          loading={isLoading}
        >
          Check Page
        </Button>
      </div>

      <div className="panel__filters">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setFilter('all')}
        >
          All ({results.length})
        </Button>
        <Button
          variant={filter === 'pass' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setFilter('pass')}
        >
          Pass ({results.filter(r => level === 'AA' ? r.passAA : r.passAAA).length})
        </Button>
        <Button
          variant={filter === 'fail' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setFilter('fail')}
        >
          Fail ({results.filter(r => level === 'AA' ? !r.passAA : !r.passAAA).length})
        </Button>
      </div>

      <List maxHeight={400}>
        {filteredResults.map((result) => {
          const passes = level === 'AA' ? result.passAA : result.passAAA;
          return (
            <ListItem key={result.nodeId}>
              <div className="contrast-result">
                <div className="contrast-result__colors">
                  <div
                    className="color-swatch"
                    style={{ backgroundColor: result.foreground }}
                  />
                  <div
                    className="color-swatch"
                    style={{ backgroundColor: result.background }}
                  />
                </div>

                <div className="contrast-result__info">
                  <div className="contrast-result__name">{result.nodeName}</div>
                  <div className="contrast-result__ratio">
                    Ratio: {result.ratio.toFixed(2)}:1
                  </div>
                </div>

                <Badge variant={passes ? 'success' : 'error'}>
                  {passes ? `${level} ✓` : `${level} ✗`}
                </Badge>
              </div>
            </ListItem>
          );
        })}
      </List>
    </div>
  );
};
```

---

## Component Props & APIs

### Summary Table

| Component | Key Props | Variants | Notes |
|-----------|-----------|----------|-------|
| **Button** | variant, size, disabled, loading, icon | primary, secondary, tertiary, ghost, destructive | Supports left/right icon positioning |
| **Card** | icon, title, description, badge, onClick | - | Clickable cards for navigation |
| **Badge** | variant, size | success, warning, error, info, neutral | Status indicators |
| **Modal** | isOpen, onClose, title, size, footer | small, medium, large | Overlay with backdrop |
| **Dropdown** | options, value, onChange | - | Single select dropdown |
| **Input** | type, value, onChange, label, error, maxLength | text, number, email, password | Supports character count |
| **Toggle** | checked, onChange, label | - | On/off switch |
| **List** | children, emptyState, maxHeight | - | Scrollable list container |
| **Icon** | name, size, color | - | SVG icon library |

---

**Document Status**: ✅ Complete
**Last Review**: 2025-11-15
**Next Review**: After Phase 0 implementation
