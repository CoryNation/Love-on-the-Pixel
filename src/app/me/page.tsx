'use client';

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Person from '@mui/icons-material/Person';
import Logout from '@mui/icons-material/Logout';
import Edit from '@mui/icons-material/Edit';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Notifications from '@mui/icons-material/Notifications';
import Favorite from '@mui/icons-material/Favorite';
import VolunteerActivism from '@mui/icons-material/VolunteerActivism';
import PrivacyTip from '@mui/icons-material/PrivacyTip';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileService, type UserProfile } from '@/lib/userProfile';
import dynamic from 'next/dynamic';

const NotificationSettingsPage = dynamic(() => import('@/components/NotificationSettingsPage'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

const CheckoutDialog = dynamic(() => import('@/components/buy-us-a-date/CheckoutDialog'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

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
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
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
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
          Account
        </Typography>
        
        {/* Profile Section */}
        <Box sx={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: 2, 
          padding: '8px 16px', 
          marginBottom: '8px',
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
              margin: '0 auto 8px',
              border: '3px solid rgba(255,255,255,0.3)'
            }}
          >
            {profile?.full_name?.charAt(0) || <Person />}
          </Avatar>
          <Typography variant="h6" sx={{ color: '#2c3e50', marginBottom: '4px' }}>
            {profile?.full_name || 'User'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
            {user?.email}
          </Typography>
        </Box>
      </Box>

      {/* Show Your Appreciation Section */}
      <Card variant="outlined" sx={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: 2,
        marginBottom: '8px'
      }}>
        <CardContent sx={{ padding: '8px 16px 8px' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <VolunteerActivism sx={{ color: '#667eea' }} />
            <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 500 }}>
              Show Your Appreciation
            </Typography>
          </Stack>
          <Typography sx={{ mb: 2, color: 'text.secondary', fontSize: '14px' }}>
            Love on the Pixel began as a small gift between my wife and me — a way to send each other love, encouragement, and little reminders of our bond. What started as a simple gesture grew into this app, and now we'd love for you to be part of our story. Every dollar you send goes directly toward a date or shared experience that brings us closer together. Your support doesn't just keep the app alive — it creates real moments of love in our marriage.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Favorite />}
            onClick={() => setCheckoutOpen(true)}
            aria-label="Open Buy Us a Date"
            sx={{
              backgroundColor: '#e91e63',
              '&:hover': {
                backgroundColor: '#c2185b',
              }
            }}
          >
            Buy Us a Date
          </Button>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Box sx={{ flex: 1, marginBottom: '8px' }}>
        <Box 
          onClick={() => setNotificationDialogOpen(true)}
          sx={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: 2,
            padding: '8px 16px',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.05)'
            }
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Notifications sx={{ color: '#667eea' }} />
            <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 500 }}>
              Notification Settings
            </Typography>
          </Stack>
          <Typography sx={{ color: 'text.secondary', fontSize: '14px' }}>
            Manage push notification preferences
          </Typography>
        </Box>
      </Box>

      {/* Privacy Policy Link */}
      <Box 
        onClick={() => setPrivacyDialogOpen(true)}
        sx={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: 2,
          padding: '8px 16px',
          marginBottom: '8px',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.05)'
          }
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <PrivacyTip sx={{ color: '#667eea' }} />
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 500 }}>
            Privacy Policy
          </Typography>
        </Stack>
        <Typography sx={{ color: 'text.secondary', fontSize: '14px' }}>
          Read our privacy policy and data practices
        </Typography>
      </Box>

      {/* Sign Out Section */}
      <Box sx={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: 2,
        padding: '8px 16px',
        marginBottom: 8 // Add bottom margin to account for bottom navigation
      }}>
        <Button
          startIcon={<Logout />}
          onClick={handleSignOut}
          fullWidth
          sx={{
            color: '#e74c3c',
            '&:hover': {
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

      {/* Checkout Dialog */}
      <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      {/* Privacy Policy Dialog */}
      <Dialog 
        open={privacyDialogOpen} 
        onClose={() => setPrivacyDialogOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="privacy-dialog-title"
      >
        <DialogTitle id="privacy-dialog-title">
          Privacy Policy for Love on the Pixel
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#667eea', mt: 3 }}>
                Information We Collect
              </Typography>
              <Typography variant="body1" paragraph>
                Love on the Pixel collects the following information to provide our service:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Account Information:</strong> Email address for account creation and authentication
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Profile Information:</strong> Your name and profile photo (optional)
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Content:</strong> Affirmation messages you create and send to others
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Connections:</strong> Information about your connections with other users
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#667eea' }}>
                How We Use Your Information
              </Typography>
              <Typography variant="body1" paragraph>
                We use your information exclusively to:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  Provide the core functionality of sending and receiving affirmations
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Manage your account and user connections
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Improve our service and user experience
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Ensure the security and integrity of our platform
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#667eea' }}>
                Data Storage and Security
              </Typography>
              <Typography variant="body1" paragraph>
                Your data is stored securely using Supabase, a trusted cloud database service that implements industry-standard security measures including:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  Encryption at rest and in transit
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Regular security audits and updates
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Compliance with data protection regulations
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#667eea' }}>
                Data Sharing
              </Typography>
              <Typography variant="body1" paragraph>
                We do not sell, trade, or otherwise transfer your personal information to third parties. Your affirmations are only shared with the specific users you choose to send them to.
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#667eea' }}>
                Your Rights
              </Typography>
              <Typography variant="body1" paragraph>
                You have the right to:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  Access, update, or delete your account information
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Delete your account and all associated data
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Request a copy of your personal data
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Opt out of certain data collection (where applicable)
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#667eea' }}>
                Contact Us
              </Typography>
              <Typography variant="body1" paragraph>
                If you have any questions about this privacy policy or our data practices, please contact us at:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                Email: Info@BuildTBD.com
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivacyDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

