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
import FavoritesPage from '@/components/FavoritesPage';

export default function Dashboard() {
  const [currentTab, setCurrentTab] = useState(0);

  const renderContent = () => {
    switch (currentTab) {
      case 0:
        return <WavePage />;
      case 1:
        return <PersonsPage />;
      case 2:
        return <FavoritesPage />;
      case 3:
        return <SettingsPage />;
      default:
        return <WavePage />;
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
          onChange={(event, newValue) => setCurrentTab(newValue)}
          sx={{
            '& .MuiBottomNavigationAction-root': {
              color: '#95a5a6 !important',
              '&.Mui-selected': {
                color: '#667eea !important'
              },
              '& .MuiBottomNavigationAction-label': {
                color: '#95a5a6 !important',
                '&.Mui-selected': {
                  color: '#667eea !important'
                }
              }
            }
          }}
        >
          <BottomNavigationAction 
            label="Wave" 
            icon={<Water />} 
          />
          <BottomNavigationAction 
            label="Persons" 
            icon={<People />} 
          />
          <BottomNavigationAction 
            label="Favorites" 
            icon={<Favorite />} 
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
