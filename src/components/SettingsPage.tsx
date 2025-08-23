'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  Notifications, 
  Security, 
  Palette, 
  Language, 
  Help, 
  Logout,
  Person
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || ''
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUpdateProfile = () => {
    // Here you would update the user profile
    console.log('Updating profile:', profileData);
    setOpenProfileDialog(false);
  };

  return (
    <Box
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
        paddingBottom: 8,
        overflow: 'auto'
      }}
    >
      {/* Header */}
      <Typography 
        variant="h4" 
        sx={{ 
          color: 'white', 
          fontWeight: 300,
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          marginBottom: 3
        }}
      >
        Settings
      </Typography>

      {/* Settings List */}
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2
        }}
      >
        <List>
          <ListItem onClick={() => setOpenProfileDialog(true)} sx={{ cursor: 'pointer' }}>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText 
              primary="Profile" 
              secondary={user?.email}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Notifications />
            </ListItemIcon>
            <ListItemText primary="Push Notifications" />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Palette />
            </ListItemIcon>
            <ListItemText primary="Dark Mode" />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText primary="Privacy & Security" />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Language />
            </ListItemIcon>
            <ListItemText primary="Language" secondary="English" />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Help />
            </ListItemIcon>
            <ListItemText primary="Help & Support" />
          </ListItem>

          <Divider />

          <ListItem onClick={handleSignOut} sx={{ cursor: 'pointer' }}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Sign Out" />
          </ListItem>
        </List>
      </Card>

      {/* Profile Dialog */}
      <Dialog open={openProfileDialog} onClose={() => setOpenProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={profileData.name}
            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
            sx={{ marginBottom: 2, marginTop: 1 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            disabled
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProfileDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateProfile} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
