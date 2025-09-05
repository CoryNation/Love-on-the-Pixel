'use client';

import { useState } from 'react';
import { 
  Box, 
  BottomNavigation, 
  BottomNavigationAction,
  Paper,
  Fade
} from '@mui/material';
import { 
  People, 
  Settings,
  Favorite
} from '@mui/icons-material';
import DiamondIcon from '@mui/icons-material/Diamond';
import dynamic from 'next/dynamic';

// Lazy load heavy components to improve initial bundle size
const WavePage = dynamic(() => import('@/components/WavePage'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

const PersonsPage = dynamic(() => import('@/components/PersonsPage'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

const SettingsPage = dynamic(() => import('@/components/SettingsPage'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

const TreasuredPage = dynamic(() => import('@/components/TreasuredPage'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import NotificationBadge from '@/components/NotificationBadge';
import NotificationInitializer from '@/components/NotificationInitializer';

function DashboardContent() {
  const [currentTab, setCurrentTab] = useState(0);
  const { hasPendingInvitations } = useNotifications();

  const renderContent = () => {
    switch (currentTab) {
      case 0:
        return <WavePage />;
      case 1:
        return <PersonsPage />;
      case 2:
        return <TreasuredPage />;
      case 3:
        return <SettingsPage />;
      default:
        return <WavePage />;
    }
  };

  // Refresh treasured items when switching to treasured tab
  const handleTabChange = (event: any, newValue: number) => {
    setCurrentTab(newValue);
    
    // If switching to treasured tab, refresh the treasured items
    if (newValue === 2 && typeof window !== 'undefined' && (window as any).refreshTreasured) {
      (window as any).refreshTreasured();
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Initialize Notifications */}
      <NotificationInitializer />
      
      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Fade in={true} timeout={300}>
          <Box sx={{ height: '100%' }}>
            {renderContent()}
          </Box>
        </Fade>
      </Box>

      {/* Bottom Navigation */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }} 
        elevation={3}
      >
        <BottomNavigation
          value={currentTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiBottomNavigationAction-root': {
              color: '#95a5a6',
              '&.Mui-selected': {
                color: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)'
              }
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              '&.Mui-selected': {
                fontSize: '0.75rem'
              }
            }
          }}
          showLabels
        >
          <BottomNavigationAction 
            label="Pixels" 
            icon={<Favorite />} 
          />
          <BottomNavigationAction 
            label="Persons" 
            icon={
              <Box sx={{ position: 'relative' }}>
                <People />
                <NotificationBadge 
                  hasNotifications={hasPendingInvitations} 
                  size={10}
                  position="top-right"
                />
              </Box>
            } 
          />
          <BottomNavigationAction 
            label="Treasured" 
            icon={<DiamondIcon />} 
          />
          <BottomNavigationAction 
            label="Settings" 
            icon={<Settings />} 
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
