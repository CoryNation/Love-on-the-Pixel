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
  Button
} from '@mui/material';
import { 
  Favorite, 
  FavoriteBorder, 
  Share, 
  ArrowBack, 
  ArrowForward,
  Edit,
  Delete
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { affirmationsService, type Affirmation } from '@/lib/affirmations';

export default function WavePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [sentAffirmations, setSentAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    loadAffirmations();
  }, []);

  const loadAffirmations = async () => {
    try {
      setLoading(true);
      const data = await affirmationsService.getAll();
      setAffirmations(data);
      
      // For now, we'll simulate sent affirmations
      // In a real app, you'd filter by created_by field
      const sent = data.filter(aff => aff.created_by === 'current-user-id');
      setSentAffirmations(sent);
    } catch (err) {
      setError('Failed to load love notes. Please try again.');
      console.error('Error loading affirmations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (id: string) => {
    try {
      const affirmation = affirmations.find(a => a.id === id);
      if (!affirmation) return;

      const newFavoriteStatus = !affirmation.is_favorite;
      
      setAffirmations(prev => 
        prev.map(aff => 
          aff.id === id ? { ...aff, is_favorite: newFavoriteStatus } : aff
        )
      );

      await affirmationsService.toggleFavorite(id, newFavoriteStatus);
    } catch (err) {
      console.error('Error updating favorite:', err);
      loadAffirmations();
    }
  };

  const handleShare = async () => {
    const currentAffirmation = affirmations[currentIndex];
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'A message of love for you',
          text: currentAffirmation.message,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % affirmations.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + affirmations.length) % affirmations.length);
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
          Loading love notes...
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
          onClick={loadAffirmations} 
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
          padding: 2
        }}
      >
        <Typography sx={{ color: 'white', textAlign: 'center' }}>
          No love notes yet. Add some in the admin panel!
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        paddingBottom: 8, // Space for bottom navigation
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box sx={{ position: 'absolute', top: 20, left: 20, right: 20 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            color: 'white', 
            textAlign: 'center',
            fontWeight: 300,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            marginBottom: 2
          }}
        >
          Love Notes
        </Typography>

        {/* Tab Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => setActiveTab('received')}
            sx={{
              width: '70%',
              color: 'white',
              borderColor: 'white',
              backgroundColor: activeTab === 'received' ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Affirmations Received
          </Button>
          <Button
            variant="outlined"
            onClick={() => setActiveTab('sent')}
            sx={{
              width: '30%',
              color: 'white',
              borderColor: 'white',
              backgroundColor: activeTab === 'sent' ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Sent
          </Button>
        </Box>
      </Box>

      {/* Content based on active tab */}
      {activeTab === 'received' ? (
        <>
          {/* Main Card */}
          <Box sx={{ width: '100%', maxWidth: 400, position: 'relative' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
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
                      icon={<span>{getCategoryEmoji(affirmations[currentIndex].category)}</span>}
                      label={affirmations[currentIndex].category}
                      sx={{
                        backgroundColor: getCategoryColor(affirmations[currentIndex].category),
                        color: 'white',
                        fontWeight: 600,
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                  </Box>

                  <CardContent sx={{ padding: 4, textAlign: 'center' }}>
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
                      &ldquo;{affirmations[currentIndex].message}&rdquo;
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
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <IconButton
                      onClick={() => handleFavorite(affirmations[currentIndex].id)}
                      sx={{
                        color: affirmations[currentIndex].is_favorite ? '#e74c3c' : '#bdc3c7',
                        '&:hover': { color: '#e74c3c' }
                      }}
                    >
                      {affirmations[currentIndex].is_favorite ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={prevCard} sx={{ color: '#7f8c8d' }}>
                        <ArrowBack />
                      </IconButton>
                      <IconButton onClick={nextCard} sx={{ color: '#7f8c8d' }}>
                        <ArrowForward />
                      </IconButton>
                    </Box>

                    <IconButton onClick={handleShare} sx={{ color: '#7f8c8d' }}>
                      <Share />
                    </IconButton>
                  </Box>
                </Card>
              </motion.div>
            </AnimatePresence>
          </Box>

          {/* Navigation Dots */}
          <Box sx={{ display: 'flex', gap: 1, marginTop: 3 }}>
            {affirmations.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentIndex(index)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Box>

          {/* Counter */}
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              marginTop: 2,
              fontSize: '0.875rem'
            }}
          >
            {currentIndex + 1} of {affirmations.length}
          </Typography>
        </>
      ) : (
        /* Sent Affirmations List View */
        <Box sx={{ width: '100%', maxWidth: 600, marginTop: 2 }}>
          {sentAffirmations.length === 0 ? (
            <Typography sx={{ color: 'white', textAlign: 'center' }}>
              No sent affirmations yet. Start sending love notes to see them here!
            </Typography>
          ) : (
            <List sx={{ padding: 0 }}>
              {sentAffirmations.map((affirmation) => (
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
                    {/* Category Badge and Actions */}
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
                          onClick={() => handleShare()}
                          sx={{ color: '#7f8c8d' }}
                          size="small"
                        >
                          <Share />
                        </IconButton>
                        <IconButton
                          onClick={() => console.log('Edit affirmation:', affirmation.id)}
                          sx={{ color: '#667eea' }}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => console.log('Delete affirmation:', affirmation.id)}
                          sx={{ color: '#e74c3c' }}
                          size="small"
                        >
                          <Delete />
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
                      Sent on {new Date(affirmation.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}
    </Box>
  );
}
