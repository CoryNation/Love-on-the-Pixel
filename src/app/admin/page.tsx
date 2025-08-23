'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { affirmationsService } from '@/lib/affirmations';

export default function AdminPage() {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('love');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setErrorMessage('Please enter a message');
      setShowError(true);
      return;
    }

    try {
      setLoading(true);
      await affirmationsService.create({
        message: message.trim(),
        category
      });
      
      setShowSuccess(true);
      setMessage('');
      setCategory('love');
    } catch (error) {
      console.error('Error creating affirmation:', error);
      setErrorMessage('Failed to create love note. Please try again.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 500,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4
        }}
      >
        <CardContent sx={{ padding: 4 }}>
          <Typography variant="h4" sx={{ marginBottom: 3, textAlign: 'center', color: '#2c3e50' }}>
            Add New Love Note
          </Typography>

          <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ marginBottom: 3 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="love">💕 Love</MenuItem>
                <MenuItem value="encouragement">💪 Encouragement</MenuItem>
                <MenuItem value="appreciation">🙏 Appreciation</MenuItem>
                <MenuItem value="gratitude">💝 Gratitude</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{ marginBottom: 3 }}
              placeholder="Write your message of love, encouragement, or appreciation..."
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                borderRadius: 2,
                height: 56
              }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Love Note'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Love note added successfully! 💕
        </Alert>
      </Snackbar>

      <Snackbar
        open={showError}
        autoHideDuration={4000}
        onClose={() => setShowError(false)}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
