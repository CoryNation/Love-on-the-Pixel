'use client';

import { useState, useEffect, useCallback } from 'react';
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
  List,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  Favorite, 
  FavoriteBorder, 
  Share, 
  Edit,
  Delete,
  Person
} from '@mui/icons-material';
import { affirmationsService, type Affirmation } from '@/lib/affirmations';
import { userProfileService, type UserProfile } from '@/lib/userProfile';
import { useAuth } from '@/contexts/AuthContext';
import { AFFIRMATION_THEMES, getThemeColor, getThemeEmoji } from '@/lib/affirmationThemes';

export default function WavePage() {
  const { user } = useAuth();
  const [currentAffirmation, setCurrentAffirmation] = useState<Affirmation | null>(null);
  const [sentAffirmations, setSentAffirmations] = useState<Affirmation[]>([]);
  const [receivedAffirmations, setReceivedAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [senderProfile, setSenderProfile] = useState<UserProfile | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('all'); // Filter by theme

  // Add new state for edit functionality
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAffirmation, setEditingAffirmation] = useState<Affirmation | null>(null);
  const [editForm, setEditForm] = useState({
    message: '',
    category: 'love'
  });
  const [editLoading, setEditLoading] = useState(false);

  const loadInitialAffirmation = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load received affirmations for the main view
      const receivedAffirmations = await affirmationsService.getReceived();
      setReceivedAffirmations(receivedAffirmations);
      
      if (receivedAffirmations.length > 0) {
        // Get a random unviewed affirmation first
        const unviewed = receivedAffirmations.filter(aff => !aff.viewed);
        const affirmation = unviewed.length > 0 ? unviewed[0] : receivedAffirmations[0];
        
        setCurrentAffirmation(affirmation);
        
        // Load sender profile if available
        if (affirmation.created_by) {
          try {
            const profile = await userProfileService.getProfileById(affirmation.created_by);
            setSenderProfile(profile);
          } catch (err) {
            console.error('Error loading sender profile:', err);
          }
        }
        
        // Mark as viewed if it wasn't already
        if (!affirmation.viewed) {
          await affirmationsService.markAsViewed(affirmation.id);
        }
      }
      
      // Load sent affirmations for the sent tab
      if (user?.id) {
        const sent = await affirmationsService.getSent();
        setSentAffirmations(sent);
      }
    } catch (err) {
      setError('Failed to load love notes. Please try again.');
      console.error('Error loading affirmations:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadInitialAffirmation();
    
    // Listen for new affirmations being created
    const handleAffirmationCreated = () => {
      loadInitialAffirmation();
    };
    
    window.addEventListener('affirmationCreated', handleAffirmationCreated);
    
    return () => {
      window.removeEventListener('affirmationCreated', handleAffirmationCreated);
    };
  }, [loadInitialAffirmation]);

  // Add a refresh function that can be called from outside
  const refreshAffirmations = useCallback(() => {
    loadInitialAffirmation();
  }, [loadInitialAffirmation]);

  // Expose the refresh function globally for now (for testing)
  useEffect(() => {
    (window as Window & { refreshAffirmations?: () => void }).refreshAffirmations = refreshAffirmations;
    return () => {
      delete (window as Window & { refreshAffirmations?: () => void }).refreshAffirmations;
    };
  }, [refreshAffirmations]);

  const handleDeleteAffirmation = async (affirmationId: string) => {
    if (confirm('Are you sure you want to delete this affirmation?')) {
      try {
        await affirmationsService.delete(affirmationId);
        
        // Remove from local state
        setSentAffirmations(prev => prev.filter(aff => aff.id !== affirmationId));
        
        // Also check if the current affirmation was deleted and refresh if needed
        if (currentAffirmation?.id === affirmationId) {
          // Reload the initial affirmation since the current one was deleted
          await loadInitialAffirmation();
        }
        
        alert('Affirmation deleted successfully!');
      } catch (error) {
        console.error('Error deleting affirmation:', error);
        alert('Failed to delete affirmation. Please try again.');
      }
    }
  };

  const handleFavorite = async () => {
    if (!currentAffirmation) return;
    
    try {
      const newFavoriteStatus = !currentAffirmation.is_favorite;
      
      setCurrentAffirmation(prev => 
        prev ? { ...prev, is_favorite: newFavoriteStatus } : null
      );

      await affirmationsService.toggleFavorite(currentAffirmation.id, newFavoriteStatus);
    } catch (err) {
      console.error('Error updating favorite:', err);
      loadInitialAffirmation();
    }
  };

  const handleShare = async () => {
    if (!currentAffirmation) return;
    
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

  // Filter affirmations by selected theme
  const getFilteredAffirmations = (affirmations: Affirmation[]) => {
    if (selectedTheme === 'all') {
      return affirmations;
    }
    return affirmations.filter(aff => aff.category === selectedTheme);
  };

  const filteredSentAffirmations = getFilteredAffirmations(sentAffirmations);
  const filteredReceivedAffirmations = getFilteredAffirmations(receivedAffirmations);

  // Update the current affirmation when theme filter changes
  useEffect(() => {
    if (activeTab === 'received' && filteredReceivedAffirmations.length > 0) {
      // If current affirmation is not in filtered list, find a new one
      const currentInFiltered = currentAffirmation && 
        filteredReceivedAffirmations.some(aff => aff.id === currentAffirmation.id);
      
      if (!currentInFiltered) {
        // Get a random unviewed affirmation first from filtered list
        const unviewed = filteredReceivedAffirmations.filter(aff => !aff.viewed);
        const affirmation = unviewed.length > 0 ? unviewed[0] : filteredReceivedAffirmations[0];
        
        setCurrentAffirmation(affirmation);
        
        // Load sender profile if available
        if (affirmation.created_by) {
          userProfileService.getProfileById(affirmation.created_by)
            .then(profile => setSenderProfile(profile))
            .catch(err => console.error('Error loading sender profile:', err));
        }
      }
    }
  }, [selectedTheme, filteredReceivedAffirmations, currentAffirmation, activeTab]);

  const loadNextUnviewed = async () => {
    try {
      // Get unviewed affirmations from filtered list
      const unviewed = filteredReceivedAffirmations.filter(aff => !aff.viewed);
      
      if (unviewed.length > 0) {
        const affirmation = unviewed[0]; // Take the first unviewed
        setCurrentAffirmation(affirmation);
        
        // Load sender profile
        if (affirmation.created_by) {
          try {
            const profile = await userProfileService.getProfileById(affirmation.created_by);
            setSenderProfile(profile);
          } catch (err) {
            console.error('Error loading sender profile:', err);
          }
        }
        
        // Mark as viewed
        await affirmationsService.markAsViewed(affirmation.id);
      }
    } catch (err) {
      console.error('Error loading next unviewed affirmation:', err);
    }
  };

  const loadRandomViewed = async () => {
    try {
      // Get viewed affirmations from filtered list
      const viewed = filteredReceivedAffirmations.filter(aff => aff.viewed);
      
      if (viewed.length > 0) {
        // Get a random viewed affirmation
        const randomIndex = Math.floor(Math.random() * viewed.length);
        const affirmation = viewed[randomIndex];
        
        setCurrentAffirmation(affirmation);
        
        // Load sender profile
        if (affirmation.created_by) {
          try {
            const profile = await userProfileService.getProfileById(affirmation.created_by);
            setSenderProfile(profile);
          } catch (err) {
            console.error('Error loading sender profile:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error loading random viewed affirmation:', err);
    }
  };

  // Update category functions to use the new theme system
  const getCategoryColor = (category: string) => {
    return getThemeColor(category);
  };

  const getCategoryEmoji = (category: string) => {
    return getThemeEmoji(category);
  };

  // Add edit functions
  const handleEditAffirmation = (affirmation: Affirmation) => {
    setEditingAffirmation(affirmation);
    setEditForm({
      message: affirmation.message,
      category: affirmation.category
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAffirmation || !editForm.message.trim()) return;

    try {
      setEditLoading(true);
      
      // Update the affirmation
      await affirmationsService.update(editingAffirmation.id, {
        message: editForm.message.trim(),
        category: editForm.category
      });

      // Refresh the affirmations
      await loadInitialAffirmation();
      
      // Close the dialog
      setEditDialogOpen(false);
      setEditingAffirmation(null);
      setEditForm({ message: '', category: 'love' });
      
      alert('Affirmation updated successfully!');
    } catch (error) {
      console.error('Error updating affirmation:', error);
      alert('Failed to update affirmation. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingAffirmation(null);
    setEditForm({ message: '', category: 'love' });
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
          onClick={loadInitialAffirmation} 
          variant="contained" 
          sx={{ marginTop: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  // Remove the early return for empty state - always show the main layout
  return (
    <Box
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ marginBottom: 2, width: '100%' }}>
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
          Affirmations
        </Typography>

        {/* Theme Filter */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 1,
          marginBottom: 2,
          flexWrap: 'wrap'
        }}>
          <Button
            variant={selectedTheme === 'all' ? 'contained' : 'outlined'}
            onClick={() => setSelectedTheme('all')}
            sx={{
              color: selectedTheme === 'all' ? 'white' : 'white',
              borderColor: 'white',
              backgroundColor: selectedTheme === 'all' ? 'rgba(255,255,255,0.3)' : 'transparent',
              textTransform: 'none',
              fontSize: '0.875rem',
              padding: '4px 12px',
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: selectedTheme === 'all' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                borderColor: 'white'
              }
            }}
          >
            All
          </Button>
          {AFFIRMATION_THEMES.map((theme) => (
            <Button
              key={theme.id}
              variant={selectedTheme === theme.id ? 'contained' : 'outlined'}
              onClick={() => setSelectedTheme(theme.id)}
              sx={{
                color: selectedTheme === theme.id ? 'white' : 'white',
                borderColor: 'white',
                backgroundColor: selectedTheme === theme.id ? 'rgba(255,255,255,0.3)' : 'transparent',
                textTransform: 'none',
                fontSize: '0.875rem',
                padding: '4px 8px',
                minWidth: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': {
                  backgroundColor: selectedTheme === theme.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                  borderColor: 'white'
                }
              }}
            >
              <span style={{ fontSize: '1rem' }}>{theme.emoji}</span>
              {theme.name}
            </Button>
          ))}
        </Box>

        {/* Custom Tab Buttons - Always visible */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          padding: '0 10%'
        }}>
          <Button
            variant={activeTab === 'received' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('received')}
            sx={{
              flex: 1,
              height: 48,
              color: activeTab === 'received' ? 'white' : 'white',
              borderColor: 'white',
              backgroundColor: activeTab === 'received' ? 'rgba(255,255,255,0.3)' : 'transparent',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: activeTab === 'received' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                borderColor: 'white'
              }
            }}
          >
            Received ({filteredReceivedAffirmations.length})
          </Button>
          <Button
            variant={activeTab === 'sent' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('sent')}
            sx={{
              flex: 1,
              height: 48,
              color: activeTab === 'sent' ? 'white' : 'white',
              borderColor: 'white',
              backgroundColor: activeTab === 'sent' ? 'rgba(255,255,255,0.3)' : 'transparent',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: activeTab === 'sent' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                borderColor: 'white'
              }
            }}
          >
            Sent ({filteredSentAffirmations.length})
          </Button>
        </Box>
      </Box>

      {/* Content based on active tab */}
      <Box sx={{ flex: 1, overflow: 'hidden', marginTop: 1, width: '100%' }}>
        {activeTab === 'received' ? (
          // Received tab content
          filteredReceivedAffirmations.length === 0 ? (
            // Empty state for received tab
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography sx={{ color: 'white', textAlign: 'center' }}>
                {selectedTheme === 'all' 
                  ? 'Add someone special to "Persons" to receive affirmation cards!'
                  : `No ${AFFIRMATION_THEMES.find(t => t.id === selectedTheme)?.name.toLowerCase()} affirmations received yet.`
                }
              </Typography>
            </Box>
          ) : (
            // Show received affirmations card view
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {/* Main Card */}
              <Box 
                sx={{ 
                  width: '100%', 
                  maxWidth: 400, 
                  position: 'relative'
                }}
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
                    overflow: 'hidden',
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' }
                  }}
                >
                  {/* Sender Profile */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Avatar
                      src={senderProfile?.photo_url}
                      sx={{ 
                        width: 48, 
                        height: 48,
                        border: '2px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      {senderProfile?.full_name?.charAt(0) || <Person />}
                    </Avatar>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#2c3e50',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {senderProfile?.full_name || 'Anonymous'}
                    </Typography>
                  </Box>

                  {/* Category Badge */}
                  <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <Chip
                      icon={<span>{getCategoryEmoji(currentAffirmation.category)}</span>}
                      label={AFFIRMATION_THEMES.find(t => t.id === currentAffirmation.category)?.name || currentAffirmation.category}
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

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', gap: 2, marginTop: 3, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={loadRandomViewed}
                  disabled={filteredReceivedAffirmations.filter(aff => aff.viewed).length === 0}
                  sx={{
                    minWidth: 140,
                    height: 48,
                    color: 'white',
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.2)'
                    },
                    '&:disabled': {
                      color: 'rgba(255,255,255,0.5)',
                      borderColor: 'rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  Viewed Affirmation
                </Button>
                <Button
                  variant="outlined"
                  onClick={loadNextUnviewed}
                  disabled={filteredReceivedAffirmations.filter(aff => !aff.viewed).length === 0}
                  sx={{
                    minWidth: 140,
                    height: 48,
                    color: 'white',
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.2)'
                    },
                    '&:disabled': {
                      color: 'rgba(255,255,255,0.5)',
                      borderColor: 'rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  New Affirmation
                </Button>
              </Box>
            </Box>
          )
        ) : (
          // Sent tab content
          <Box
            sx={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              // Custom scrollbar styling
              '&::-webkit-scrollbar': {
                width: '24px !important',
                height: '24px !important',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent !important',
                border: 'none !important',
                width: '24px !important',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#ff6b9d !important',
                borderRadius: '12px !important',
                border: '2px solid transparent !important',
                backgroundClip: 'content-box !important',
                minHeight: '40px !important',
                '&:hover': {
                  background: '#ff5a8a !important',
                },
              },
              '&::-webkit-scrollbar-button': {
                display: 'none !important',
                height: '0 !important',
                width: '0 !important',
              },
              '&::-webkit-scrollbar-corner': {
                background: 'transparent !important',
              },
              scrollbarColor: '#ff6b9d transparent',
              '& *': {
                scrollbarWidth: 'auto',
                scrollbarColor: '#ff6b9d transparent',
              },
            }}
          >
            {filteredSentAffirmations.length === 0 ? (
              <Typography sx={{ color: 'white', textAlign: 'center', marginTop: 2 }}>
                {selectedTheme === 'all' 
                  ? 'No sent affirmations yet. Start sending love notes to see them here!'
                  : `No ${AFFIRMATION_THEMES.find(t => t.id === selectedTheme)?.name.toLowerCase()} affirmations sent yet.`
                }
              </Typography>
            ) : (
              <Box sx={{ 
                width: '100%', 
                maxWidth: 600,
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                padding: '0 16px'
              }}>
                <List sx={{ 
                  padding: 0, 
                  width: '100%', 
                  maxWidth: '100%',
                  margin: 0
                }}>
                  {filteredSentAffirmations.map((affirmation) => (
                    <Card
                      key={affirmation.id}
                      sx={{
                        marginBottom: 2,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        width: '100%',
                      }}
                    >
                      <CardContent sx={{ padding: 3 }}>
                        {/* Category Badge and Actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                          <Chip
                            icon={<span>{getCategoryEmoji(affirmation.category)}</span>}
                            label={AFFIRMATION_THEMES.find(t => t.id === affirmation.category)?.name || affirmation.category}
                            sx={{
                              backgroundColor: getCategoryColor(affirmation.category),
                              color: 'white',
                              fontWeight: 600,
                              '& .MuiChip-icon': { color: 'white' }
                            }}
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              onClick={() => handleEditAffirmation(affirmation)}
                              sx={{ color: '#667eea' }}
                              size="small"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDeleteAffirmation(affirmation.id)}
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
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Edit Affirmation Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCancelEdit} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Edit Affirmation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ marginBottom: 2, color: 'text.secondary' }}>
            Update your affirmation message and theme.
          </Typography>
          
          {/* Theme Selection */}
          <Typography variant="subtitle2" sx={{ marginBottom: 1, marginTop: 1, fontWeight: 600 }}>
            Choose Theme:
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: 1, 
            marginBottom: 2 
          }}>
            {AFFIRMATION_THEMES.map((theme) => (
              <Button
                key={theme.id}
                variant={editForm.category === theme.id ? 'contained' : 'outlined'}
                onClick={() => setEditForm(prev => ({ ...prev, category: theme.id }))}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 1,
                  minHeight: 60,
                  backgroundColor: editForm.category === theme.id ? theme.color : 'transparent',
                  borderColor: theme.color,
                  color: editForm.category === theme.id ? 'white' : theme.color,
                  '&:hover': {
                    backgroundColor: editForm.category === theme.id ? theme.color : `${theme.color}20`,
                    borderColor: theme.color,
                    color: editForm.category === theme.id ? 'white' : theme.color,
                  }
                }}
              >
                <span style={{ fontSize: '1.5rem', marginBottom: 4 }}>{theme.emoji}</span>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {theme.name}
                </Typography>
              </Button>
            ))}
          </Box>
          
          {/* Message */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Message"
            value={editForm.message}
            onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
            sx={{ marginTop: 1 }}
            placeholder="Write your message of love, encouragement, or appreciation..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} disabled={editLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={editLoading || !editForm.message.trim()}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
