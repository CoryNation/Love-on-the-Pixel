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
  Water, 
  People, 
  Settings,
  Favorite
} from '@mui/icons-material';
import WavePage from '@/components/WavePage';
import PersonsPage from '@/components/PersonsPage';
import SettingsPage from '@/components/SettingsPage';
import TreasuredPage from '@/components/TreasuredPage';

export default function Dashboard() {
  const [currentTab, setCurrentTab] = useState(0);

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
            icon={<People />} 
          />
          <BottomNavigationAction 
            label="Treasured" 
            icon={<span style={{ fontSize: '1.2rem', color: '#667eea' }}>◆</span>} 
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
