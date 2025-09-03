'use client';

import { Box } from '@mui/material';

interface NotificationBadgeProps {
  hasNotifications: boolean;
  size?: number;
  color?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function NotificationBadge({ 
  hasNotifications, 
  size = 8, 
  color = '#e74c3c',
  position = 'top-right'
}: NotificationBadgeProps) {
  if (!hasNotifications) return null;

  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return { top: 0, right: 0 };
      case 'top-left':
        return { top: 0, left: 0 };
      case 'bottom-right':
        return { bottom: 0, right: 0 };
      case 'bottom-left':
        return { bottom: 0, left: 0 };
      default:
        return { top: 0, right: 0 };
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        border: '2px solid white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 1,
        ...getPositionStyles()
      }}
    />
  );
}
