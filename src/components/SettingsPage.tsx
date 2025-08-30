'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Typography, 
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  Settings, 
  Person, 
  Logout,
  Edit,
  Delete,
  PhotoCamera
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileService, type UserProfile } from '@/lib/userProfile';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    photo_url: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (user?.id) {
      try {
        const data = await userProfileService.getCurrentProfile();
        setProfile(data);
        setEditForm({
          full_name: data?.full_name || '',
          photo_url: data?.photo_url || ''
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setEditLoading(true);
        const photoUrl = await userProfileService.uploadProfilePhoto(file);
        setEditForm(prev => ({ ...prev, photo_url: photoUrl }));
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Failed to upload photo. Please try again.');
      } finally {
        setEditLoading(false);
      }
    }
  };

  const handleEditProfile = async () => {
    if (!editForm.full_name.trim()) return;

    try {
      setEditLoading(true);
      console.log('Attempting to update profile with:', {
        full_name: editForm.full_name.trim(),
        photo_url: editForm.photo_url
      });
      
      await userProfileService.upsertProfile({
        full_name: editForm.full_name.trim(),
        photo_url: editForm.photo_url
      });
      

      await loadProfile();
      setEditDialogOpen(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // Add account deletion logic here
        alert('Account deletion feature coming soon.');
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2
        }}
      >
        <Typography sx={{ color: 'white' }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: 2
      }}
    >
      {/* Header */}
      <Box sx={{ marginBottom: 3, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 300,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            marginBottom: 2
          }}
        >
          Settings
        </Typography>
        
        {/* Profile Section */}
        <Box sx={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: 2, 
          padding: 2, 
          marginBottom: 2,
          position: 'relative'
        }}>
          <IconButton
            onClick={() => setEditDialogOpen(true)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: '#667eea'
            }}
          >
            <Edit />
          </IconButton>
          <Avatar
            src={profile?.photo_url}
            sx={{ 
              width: 80, 
              height: 80, 
              margin: '0 auto 16px',
              border: '3px solid rgba(255,255,255,0.3)'
            }}
          >
            {profile?.full_name?.charAt(0) || <Person />}
          </Avatar>
          <Typography variant="h6" sx={{ color: '#2c3e50', marginBottom: 1 }}>
            {profile?.full_name || 'User'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
            {user?.email}
          </Typography>
        </Box>
      </Box>

      {/* Settings List */}
      <Box sx={{ flex: 1, marginBottom: 2 }}>
        <List sx={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          {/* Account Settings Section Header */}
          <ListItem sx={{ 
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e9ecef'
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#000000',
                fontWeight: 600,
                width: '100%',
                textAlign: 'center'
              }}
            >
              Account Settings
            </Typography>
          </ListItem>
          
          <ListItem button onClick={handleDeleteAccount}>
            <ListItemIcon>
              <Delete sx={{ color: '#e74c3c' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Delete Account" 
              secondary="Permanently delete your account and data"
              sx={{ '& .MuiListItemText-primary': { color: '#e74c3c' } }}
            />
          </ListItem>
        </List>
      </Box>

      {/* Sign Out Section */}
      <Box sx={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: 2,
        padding: 2,
        marginBottom: 8 // Add bottom margin to account for bottom navigation
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#2c3e50',
            fontWeight: 600,
            marginBottom: 2,
            textAlign: 'center'
          }}
        >
          Sign Out
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Logout />}
          onClick={handleSignOut}
          fullWidth
          sx={{
            color: '#e74c3c',
            borderColor: '#e74c3c',
            '&:hover': {
              borderColor: '#c0392b',
              backgroundColor: 'rgba(231, 76, 60, 0.1)'
            }
          }}
        >
          Sign Out
        </Button>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          {/* Photo Upload Section */}
          <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
            <Avatar
              src={editForm.photo_url}
              sx={{ 
                width: 100, 
                height: 100, 
                margin: '0 auto 16px',
                border: '3px solid #e9ecef'
              }}
            >
              {editForm.full_name?.charAt(0) || <Person />}
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ marginBottom: 2 }}
            >
              Change Photo
            </Button>
          </Box>

          <TextField
            fullWidth
            label="Full Name"
            value={editForm.full_name}
            onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
            sx={{ marginBottom: 2 }}
            placeholder="Enter your full name"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={editLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditProfile} 
            variant="contained"
            disabled={editLoading || !editForm.full_name.trim()}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
