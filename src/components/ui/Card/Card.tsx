import React from 'react';
import './Card.css';
import { Icon } from '../Icon/Icon';

interface CardProps {
  icon?: string;
  iconColor?: string;
  title: string;
  description?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  icon,
  iconColor = 'var(--figma-color-text-brand)',
  title,
  description,
  onClick,
  disabled = false,
}) => {
  const classNames = [
    'card',
    onClick ? 'card--clickable' : '',
    disabled ? 'card--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} onClick={!disabled ? onClick : undefined}>
      <div className="card__content">
        {icon && (
          <div className="card__icon" style={{ color: iconColor }}>
            <Icon name={icon} size={24} />
          </div>
        )}
        <div className="card__text">
          <h3 className="card__title">{title}</h3>
          {description && <p className="card__description">{description}</p>}
        </div>
      </div>
      {onClick && !disabled && (
        <div className="card__arrow">
          <Icon name="chevron-right" size={20} />
        </div>
      )}
    </div>
  );
};
