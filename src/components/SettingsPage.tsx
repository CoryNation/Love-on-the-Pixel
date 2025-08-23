'use client';

import { useState, useEffect } from 'react';
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
  TextField,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Notifications, 
  Security, 
  Palette, 
  Language, 
  Help, 
  Logout,
  Person,
  PhotoCamera,
  CloudUpload
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileService, type UserProfile } from '@/lib/userProfile';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: user?.email || ''
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await userProfileService.getCurrentProfile();
      setUserProfile(profile);
      if (profile) {
        setProfileData({
          fullName: profile.full_name || '',
          email: profile.email
        });
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await userProfileService.upsertProfile({
        full_name: profileData.fullName,
        photo_url: userProfile?.photo_url
      });
      
      await loadUserProfile();
      setOpenProfileDialog(false);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setError(null);
      
      const photoUrl = await userProfileService.uploadProfilePhoto(file);
      
      await userProfileService.upsertProfile({
        full_name: profileData.fullName,
        photo_url: photoUrl
      });
      
      await loadUserProfile();
    } catch (err) {
      setError('Failed to upload photo. Please try again.');
      console.error('Error uploading photo:', err);
    } finally {
      setUploadingPhoto(false);
    }
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
              <Avatar
                src={userProfile?.photo_url}
                sx={{ width: 32, height: 32 }}
              >
                {userProfile?.full_name?.charAt(0) || <Person />}
              </Avatar>
            </ListItemIcon>
            <ListItemText 
              primary={userProfile?.full_name || "Profile"} 
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
          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Profile Photo Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 3 }}>
            <Avatar
              src={userProfile?.photo_url}
              sx={{ 
                width: 80, 
                height: 80, 
                marginBottom: 2,
                border: '3px solid #667eea'
              }}
            >
              {userProfile?.full_name?.charAt(0) || <Person />}
            </Avatar>
            
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={handlePhotoUpload}
            />
            <label htmlFor="photo-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={uploadingPhoto ? <CircularProgress size={16} /> : <PhotoCamera />}
                disabled={uploadingPhoto}
                sx={{ marginBottom: 1 }}
              >
                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </label>
          </Box>

          <TextField
            fullWidth
            label="Full Name"
            value={profileData.fullName}
            onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={profileData.email}
            disabled
            sx={{ marginBottom: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProfileDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateProfile} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
