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
  TextField,
  Card,
  CardContent,
  Stack,
  Divider
} from '@mui/material';
import { 
  Person, 
  Logout,
  Edit,
  PhotoCamera,
  Notifications,
  Favorite as FavoriteIcon,
  VolunteerActivism as VolunteerActivismIcon,
  PrivacyTip
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileService, type UserProfile } from '@/lib/userProfile';
import NotificationSettingsPage from '@/components/NotificationSettingsPage';
import BuyUsADateDialog from '@/components/buy-us-a-date/BuyUsADateDialog';

export default function MeUsPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    photo_url: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [buyUsADateOpen, setBuyUsADateOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
    
    // Handle success/cancel messages from Stripe checkout
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const product = urlParams.get('product');
    
    if (success === 'true') {
      alert(`Thank you for supporting our ${product || 'love story'}! 💕 Your support means the world to us.`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === 'true') {
      alert('Payment was canceled. No worries - you can try again anytime!');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
        <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
          Me & Us
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
          
          <ListItem button onClick={() => setNotificationDialogOpen(true)}>
            <ListItemIcon>
              <Notifications sx={{ color: '#667eea' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Notification Settings" 
              secondary="Manage push notification preferences"
              sx={{ '& .MuiListItemText-primary': { color: '#2c3e50' } }}
            />
          </ListItem>
        </List>
      </Box>

      {/* Support Us Section */}
      <Card variant="outlined" sx={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: 2,
        marginBottom: 2
      }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <VolunteerActivismIcon color="primary" />
            <Typography variant="h6">Buy Us a Date</Typography>
          </Stack>
          <Typography sx={{ mb: 2, color: 'text.secondary' }}>
            Be part of our love story. Help fund real moments that bring us closer.
          </Typography>
          <Button
            variant="contained"
            startIcon={<FavoriteIcon />}
            onClick={() => setBuyUsADateOpen(true)}
            aria-label="Open Buy Us a Date"
          >
            Buy Us a Date
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Policy Link */}
      <Box sx={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: 2,
        padding: 2,
        marginBottom: 2
      }}>
        <ListItem 
          button 
          onClick={() => window.open('/privacy', '_blank')}
          sx={{ 
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.1)'
            }
          }}
        >
          <ListItemIcon>
            <PrivacyTip sx={{ color: '#667eea' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Privacy Policy" 
            secondary="Read our privacy policy and data practices"
            sx={{ '& .MuiListItemText-primary': { color: '#2c3e50' } }}
          />
        </ListItem>
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

      {/* Notification Settings Dialog */}
      <Dialog 
        open={notificationDialogOpen} 
        onClose={() => setNotificationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications sx={{ color: '#667eea' }} />
            <Typography variant="h6">Notification Settings</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <NotificationSettingsPage />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Buy Us a Date Dialog */}
      <BuyUsADateDialog open={buyUsADateOpen} onClose={() => setBuyUsADateOpen(false)} />
    </Box>
  );
}

