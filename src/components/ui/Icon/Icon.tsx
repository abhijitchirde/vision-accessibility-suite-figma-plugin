import React from 'react';
import { SlFrame } from 'react-icons/sl';
import { IoSettingsOutline } from 'react-icons/io5';
import { VscSettings } from 'react-icons/vsc';
import { HiOutlineDownload, HiOutlineUpload, HiOutlineTrash, HiX, HiOutlineClipboard, HiOutlineClipboardCheck } from 'react-icons/hi';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = 'currentColor',
}) => {
  const icons: Record<string, JSX.Element> = {
    contrast: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <path
          d="M12 3V21M12 3C7.58172 3 4 6.58172 4 11C4 15.4183 7.58172 19 12 19"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
    ),
    'chevron-right': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M9 18L15 12L9 6"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    'chevron-left': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M15 18L9 12L15 6"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    'chevron-up': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M18 15L12 9L6 15"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    'chevron-down': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M6 9L12 15L18 9"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6L9 17L4 12"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    close: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M18 6L6 18M6 6L18 18"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    'refresh-cw': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 3v5h-5"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 21v-5h5"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    'alert-triangle': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="12"
          y1="9"
          x2="12"
          y2="13"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="12"
          y1="17"
          x2="12.01"
          y2="17"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    'alert-circle': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="12"
          y1="8"
          x2="12"
          y2="12"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="12"
          y1="16"
          x2="12.01"
          y2="16"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    settings: <IoSettingsOutline size={size} color={color} />,
    parameters: <VscSettings size={size} color={color} />,
    frame: <SlFrame size={size} color={color} />,
    download: <HiOutlineDownload size={size} color={color} />,
    upload: <HiOutlineUpload size={size} color={color} />,
    trash: <HiOutlineTrash size={size} color={color} />,
    x: <HiX size={size} color={color} />,
    clipboard: <HiOutlineClipboard size={size} color={color} />,
    'clipboard-check': <HiOutlineClipboardCheck size={size} color={color} />,
    edit: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    'check-circle': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="22 4 12 14.01 9 11.01"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    image: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          ry="2"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="8.5"
          cy="8.5"
          r="1.5"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="21 15 16 10 5 21"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return icons[name] || null;
};
