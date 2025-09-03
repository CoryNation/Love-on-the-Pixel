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
import { bidirectionalConnectionsService, type Affirmation } from '@/lib/bidirectional-connections';
import { AFFIRMATION_THEMES, getThemeColor, getThemeEmoji, getThemeById } from '@/lib/affirmationThemes';

export default function TreasuredPage() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTreasured();
    
    // Make refreshTreasured available globally for other components with debouncing
    if (typeof window !== 'undefined') {
      let refreshTimeout: NodeJS.Timeout;
      (window as any).refreshTreasured = () => {
        // Debounce refresh calls to prevent excessive API requests
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          loadTreasured();
        }, 100);
      };
    }
  }, []);

  const loadTreasured = async () => {
    try {
      setLoading(true);
      // Force a fresh fetch by adding a timestamp to bypass any caching
      const receivedAffirmations = await bidirectionalConnectionsService.getReceivedAffirmations();
      const treasured = receivedAffirmations.filter(aff => aff.is_favorite);
      setAffirmations(treasured);
    } catch (err) {
      setError('Failed to load treasured items. Please try again.');
      console.error('Error loading treasured items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (id: string) => {
    try {
      setAffirmations(prev => 
        prev.filter(aff => aff.id !== id)
      );
      await bidirectionalConnectionsService.toggleFavorite(id, false);
      
      // Refresh the list to ensure it's up to date
      await loadTreasured();
    } catch (err) {
      console.error('Error updating treasured item:', err);
      loadTreasured();
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
        console.error('Error sharing:', error);
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
        <CircularProgress sx={{ color: 'white' }} />
        <Typography sx={{ color: 'white', marginTop: 2 }}>
          Loading treasured items...
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
          onClick={loadTreasured} 
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
          No treasured items yet. Start treasuring love notes to see them here!
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
       {/* Removed page title - now only in button tray */}
       <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
         <Button
           onClick={loadTreasured}
           variant="outlined"
           sx={{ 
             color: 'white', 
             borderColor: 'white',
             '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
           }}
         >
           Refresh
         </Button>
       </Box>

      {/* Treasured List */}
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
                  icon={<span>{getThemeEmoji(affirmation.category)}</span>}
                  label={getThemeById(affirmation.category)?.name || affirmation.category}
                  sx={{
                    backgroundColor: getThemeColor(affirmation.category),
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
                                         <span style={{ fontSize: '1rem', color: '#e74c3c' }}>💎</span>
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
                                 Treasured on {new Date(affirmation.updated_at).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </List>
    </Box>
  );
}
