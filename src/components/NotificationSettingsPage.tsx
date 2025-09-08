'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Notifications from '@mui/icons-material/Notifications';
import NotificationsOff from '@mui/icons-material/NotificationsOff';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface NotificationPreferences {
  notifications_enabled: boolean;
  invitation_received: boolean;
  affirmation_received: boolean;
  affirmation_treasured: boolean;
  love_reminder: boolean;
  frequency: 'every_time' | 'once_daily';
}

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifications_enabled: true,
    invitation_received: true,
    affirmation_received: true,
    affirmation_treasured: false,
    love_reminder: false,
    frequency: 'every_time'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadNotificationPreferences();
    }
  }, [user]);

  const loadNotificationPreferences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setPreferences({
          notifications_enabled: data.notifications_enabled ?? true,
          invitation_received: data.invitation_received ?? true,
          affirmation_received: data.affirmation_received ?? true,
          affirmation_treasured: data.affirmation_treasured ?? false,
          love_reminder: data.love_reminder ?? false,
          frequency: data.frequency ?? 'every_time'
        });
      }
    } catch (err) {
      console.error('Error loading notification preferences:', err);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationPreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user?.id,
          notifications_enabled: preferences.notifications_enabled,
          invitation_received: preferences.invitation_received,
          affirmation_received: preferences.affirmation_received,
          affirmation_treasured: preferences.affirmation_treasured,
          love_reminder: preferences.love_reminder,
          frequency: preferences.frequency,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSuccess('Notification preferences saved successfully!');
      
      // Request notification permission if enabling
      if (preferences.notifications_enabled) {
        await requestNotificationPermission();
      }
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      setError('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Please enable notifications in your browser settings to receive push notifications');
        return;
      }
      
      // Get FCM token after permission is granted
      try {
        const { notificationService } = await import('@/lib/notificationService');
        const token = await notificationService.requestPermissionAndGetToken();
        if (token) {
          console.log('FCM token obtained successfully');
        }
      } catch (error) {
        console.error('Error getting FCM token:', error);
        setError('Failed to set up push notifications');
      }
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2, maxWidth: '600px', margin: '0 auto' }}>
      <Typography variant="h4" sx={{ marginBottom: 3, textAlign: 'center' }}>
        Notification Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ marginBottom: 2 }}>
          {success}
        </Alert>
      )}

      <Card sx={{ marginBottom: 3 }}>
        <CardContent>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.notifications_enabled}
                  onChange={(e) => handlePreferenceChange('notifications_enabled', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {preferences.notifications_enabled ? <Notifications color="primary" /> : <NotificationsOff />}
                  <Typography variant="h6">Enable Push Notifications</Typography>
                </Box>
              }
            />
          </FormGroup>
        </CardContent>
      </Card>

      <Card sx={{ marginBottom: 3, opacity: preferences.notifications_enabled ? 1 : 0.5 }}>
        <CardContent>
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Notification Types
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.invitation_received}
                  onChange={(e) => handlePreferenceChange('invitation_received', e.target.checked)}
                  disabled={!preferences.notifications_enabled}
                />
              }
              label={
                <Typography>When invitation is received</Typography>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.affirmation_received}
                  onChange={(e) => handlePreferenceChange('affirmation_received', e.target.checked)}
                  disabled={!preferences.notifications_enabled}
                />
              }
              label={
                <Typography>When affirmation card is received</Typography>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.affirmation_treasured}
                  onChange={(e) => handlePreferenceChange('affirmation_treasured', e.target.checked)}
                  disabled={!preferences.notifications_enabled}
                />
              }
              label={
                <Typography>When an affirmation card is Treasured</Typography>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.love_reminder}
                  onChange={(e) => handlePreferenceChange('love_reminder', e.target.checked)}
                  disabled={!preferences.notifications_enabled}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FavoriteBorder sx={{ color: '#e91e63' }} />
                  <Typography>Remind me when it's been 2+ days since I showed my love</Typography>
                </Box>
              }
            />
          </FormGroup>
        </CardContent>
      </Card>

      <Card sx={{ marginBottom: 3, opacity: preferences.notifications_enabled ? 1 : 0.5 }}>
        <CardContent>
          <FormControl component="fieldset" disabled={!preferences.notifications_enabled}>
            <FormLabel component="legend">
              <Typography variant="h6">Notification Frequency</Typography>
            </FormLabel>
            <RadioGroup
              value={preferences.frequency}
              onChange={(e) => handlePreferenceChange('frequency', e.target.value)}
            >
              <FormControlLabel
                value="every_time"
                control={<Radio />}
                label="Notify every time"
              />
              <FormControlLabel
                value="once_daily"
                control={<Radio />}
                label="Notify 1 time per day"
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          onClick={saveNotificationPreferences}
          disabled={saving}
          sx={{ minWidth: '120px' }}
        >
          {saving ? <CircularProgress size={20} /> : 'Save Settings'}
        </Button>
      </Box>

      {!preferences.notifications_enabled && (
        <Alert severity="info" sx={{ marginTop: 2 }}>
          Notifications are currently disabled. Enable them above to receive push notifications.
        </Alert>
      )}
    </Box>
  );
}
