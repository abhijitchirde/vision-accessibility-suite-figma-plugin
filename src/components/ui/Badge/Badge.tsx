import React from 'react';
import './Badge.css';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'medium',
  children,
}) => {
  const classNames = ['badge', `badge--${variant}`, `badge--${size}`].join(' ');

  return <span className={classNames}>{children}</span>;
};
