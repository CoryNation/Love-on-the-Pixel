'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Chip,
  CircularProgress,
  Alert,
  Button,
  List
} from '@mui/material';
import { 
  Favorite, 
  Share
} from '@mui/icons-material';
import { affirmationsService, type Affirmation } from '@/lib/affirmations';

export default function FavoritesPage() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const allAffirmations = await affirmationsService.getAll();
      const favorites = allAffirmations.filter(aff => aff.is_favorite);
      setAffirmations(favorites);
    } catch (err) {
      setError('Failed to load favorites. Please try again.');
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (id: string) => {
    try {
      setAffirmations(prev => 
        prev.filter(aff => aff.id !== id)
      );
      await affirmationsService.toggleFavorite(id, false);
    } catch (err) {
      console.error('Error updating favorite:', err);
      loadFavorites();
    }
  };

  const handleShare = async (affirmation: Affirmation) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'A message of love for you',
          text: affirmation.message,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
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
        <CircularProgress sx={{ color: 'white' }} />
        <Typography sx={{ color: 'white', marginTop: 2 }}>
          Loading favorites...
        </Typography>
      </Box>
    );
  }

  if (error) {
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
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
        <Button 
          onClick={loadFavorites} 
          variant="contained" 
          sx={{ marginTop: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  if (affirmations.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
          paddingBottom: 8
        }}
      >
        <Typography sx={{ color: 'white', textAlign: 'center' }}>
          No favorites yet. Start favoriting love notes to see them here!
        </Typography>
      </Box>
    );
  }

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
        Favorites
      </Typography>

      {/* Favorites List */}
      <List sx={{ padding: 0 }}>
                 {affirmations.map((affirmation) => (
          <Card
            key={affirmation.id}
            sx={{
              marginBottom: 2,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2
            }}
          >
            <CardContent sx={{ padding: 3 }}>
              {/* Category Badge */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                <Chip
                  icon={<span>{getCategoryEmoji(affirmation.category)}</span>}
                  label={affirmation.category}
                  sx={{
                    backgroundColor: getCategoryColor(affirmation.category),
                    color: 'white',
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={() => handleShare(affirmation)}
                    sx={{ color: '#7f8c8d' }}
                    size="small"
                  >
                    <Share />
                  </IconButton>
                  <IconButton
                    onClick={() => handleUnfavorite(affirmation.id)}
                    sx={{ color: '#e74c3c' }}
                    size="small"
                  >
                    <Favorite />
                  </IconButton>
                </Box>
              </Box>

              {/* Message */}
              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.6,
                  color: '#2c3e50',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  marginBottom: 2
                }}
              >
                &ldquo;{affirmation.message}&rdquo;
              </Typography>

              {/* Date */}
              <Typography
                variant="caption"
                sx={{
                  color: '#7f8c8d',
                  fontStyle: 'italic'
                }}
              >
                Favorited on {new Date(affirmation.updated_at).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </List>
    </Box>
  );
}
