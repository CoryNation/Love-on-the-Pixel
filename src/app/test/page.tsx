'use client';

import { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Chip,
  Button
} from '@mui/material';
import { 
  Favorite, 
  FavoriteBorder, 
  Share
} from '@mui/icons-material';

// Mock data for testing
const mockAffirmations = [
  {
    id: '1',
    message: 'You are loved beyond measure, and your presence in this world makes it a better place.',
    category: 'love',
    is_favorite: false,
    viewed: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'user1',
    sender_name: 'Anonymous',
    sender_photo_url: null
  },
  {
    id: '2',
    message: 'Your strength inspires others, and your courage lights the way for those around you.',
    category: 'encouragement',
    is_favorite: true,
    viewed: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    created_by: 'user2',
    sender_name: 'Friend',
    sender_photo_url: null
  },
  {
    id: '3',
    message: 'Thank you for being exactly who you are. The world needs your unique light.',
    category: 'appreciation',
    is_favorite: false,
    viewed: false,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    created_by: 'user3',
    sender_name: 'Family',
    sender_photo_url: null
  }
];

export default function TestPage() {
  const [currentAffirmation, setCurrentAffirmation] = useState<typeof mockAffirmations[0] | null>(mockAffirmations[0]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleFavorite = () => {
        setCurrentAffirmation(prev =>
      prev ? { ...prev, is_favorite: !prev.is_favorite } : null
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'A message of love for you',
          text: currentAffirmation?.message || '',
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      alert('Sharing not supported in this browser');
    }
  };

  const nextAffirmation = () => {
    const nextIndex = (currentIndex + 1) % mockAffirmations.length;
    setCurrentIndex(nextIndex);
    setCurrentAffirmation(mockAffirmations[nextIndex]);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'love': return '#ff6b9d';
      case 'encouragement': return '#4ecdc4';
      case 'appreciation': return '#45b7d1';
      case 'gratitude': return '#96ceb4';
      default: return '#96ceb4';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'love': return '💕';
      case 'encouragement': return '💪';
      case 'appreciation': return '🙏';
      case 'gratitude': return '💝';
      default: return '💝';
    }
  };

  if (!currentAffirmation) {
    return (
      <Box sx={{ padding: 2, textAlign: 'center' }}>
        <Typography>No affirmations available</Typography>
      </Box>
    );
  }

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
      <Typography 
        variant="h4" 
        sx={{ 
          color: 'white', 
          textAlign: 'center',
          fontWeight: 300,
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          marginBottom: 4
        }}
      >
        Love Notes - Test Mode
      </Typography>

      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Card
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 4,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            minHeight: 300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Category Badge */}
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <Chip
              icon={<span>{getCategoryEmoji(currentAffirmation.category)}</span>}
              label={currentAffirmation.category}
              sx={{
                backgroundColor: getCategoryColor(currentAffirmation.category),
                color: 'white',
                fontWeight: 600,
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          </Box>

          <CardContent sx={{ padding: 4, textAlign: 'center', paddingTop: 8 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: '1.25rem',
                lineHeight: 1.6,
                color: '#2c3e50',
                fontWeight: 400,
                marginBottom: 3,
                fontStyle: 'italic'
              }}
            >
              &ldquo;{currentAffirmation.message}&rdquo;
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#7f8c8d',
                fontStyle: 'italic',
                marginTop: 2
              }}
            >
              With love, always
            </Typography>
          </CardContent>

          {/* Action Buttons */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 3
            }}
          >
            <IconButton
              onClick={handleFavorite}
              sx={{
                color: currentAffirmation.is_favorite ? '#e74c3c' : '#bdc3c7',
                '&:hover': { color: '#e74c3c' }
              }}
            >
              {currentAffirmation.is_favorite ? <Favorite /> : <FavoriteBorder />}
            </IconButton>

            <IconButton onClick={handleShare} sx={{ color: '#7f8c8d' }}>
              <Share />
            </IconButton>
          </Box>
        </Card>
      </Box>

      {/* Navigation Button */}
      <Box sx={{ marginTop: 3 }}>
        <Button
          variant="outlined"
          onClick={nextAffirmation}
          sx={{
            minWidth: 140,
            height: 48,
            color: 'white',
            borderColor: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255,255,255,0.2)'
            }
          }}
        >
          Next Affirmation
        </Button>
      </Box>

      {/* Test Info */}
      <Box sx={{ marginTop: 4, textAlign: 'center' }}>
        <Typography sx={{ color: 'white', fontSize: '0.9rem', opacity: 0.8 }}>
          Test Mode - No database connection required
        </Typography>
        <Typography sx={{ color: 'white', fontSize: '0.8rem', opacity: 0.6 }}>
          Affirmation {currentIndex + 1} of {mockAffirmations.length}
        </Typography>
      </Box>
    </Box>
  );
}
