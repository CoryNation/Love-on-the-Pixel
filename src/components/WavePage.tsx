'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  TextField,
  Fab
} from '@mui/material';
import { 
  Favorite, 
  FavoriteBorder, 
  Share, 
  Edit,
  Delete,
  Person,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import DiamondIcon from '@mui/icons-material/Diamond';
import { bidirectionalConnectionsService, type Affirmation } from '@/lib/bidirectional-connections';
import { userProfileService, type UserProfile } from '@/lib/userProfile';
import { useAuth } from '@/contexts/AuthContext';
import { AFFIRMATION_THEMES, getThemeColor, getThemeEmoji, getThemeById } from '@/lib/affirmationThemes';

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
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);
  const [sentLoading, setSentLoading] = useState(false);

  // Swipe functionality refs
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next affirmation
        handleNextAffirmation();
      } else {
        // Swipe right - previous affirmation
        handlePreviousAffirmation();
      }
    }
  };

  const loadInitialAffirmation = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load received affirmations for the main view (limit to prevent timeout)
      const receivedAffirmations = await bidirectionalConnectionsService.getReceivedAffirmations(100);
      setReceivedAffirmations(receivedAffirmations);
      
      if (receivedAffirmations.length > 0) {
        // Get a random unread affirmation first
        const unread = receivedAffirmations.filter(aff => aff.status === 'delivered');
        const affirmation = unread.length > 0 ? unread[0] : receivedAffirmations[0];
        
        setCurrentAffirmation(affirmation);
        
        // Use sender profile information from the affirmation data
        if (affirmation.sender_name || affirmation.sender_photo_url) {
          setSenderProfile({
            id: affirmation.sender_id,
            full_name: affirmation.sender_name || '',
            photo_url: affirmation.sender_photo_url || '',
            created_at: '',
            updated_at: ''
          });
        }
        
        // Mark as read if it wasn't already
        if (affirmation.status === 'delivered') {
          await bidirectionalConnectionsService.markAffirmationAsRead(affirmation.id);
        }
      }
      
      // Only load sent affirmations if we're on the sent tab or need them
      if (user?.id && activeTab === 'sent') {
        const sent = await bidirectionalConnectionsService.getSentAffirmations(50);
        setSentAffirmations(sent);
      }
    } catch (err) {
      setError('Failed to load love notes. Please try again.');
      console.error('Error loading affirmations:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab]);

  const loadSentAffirmations = useCallback(async () => {
    if (user?.id && sentAffirmations.length === 0) {
      try {
        setSentLoading(true);
        // Add limit to prevent timeout issues
        const sent = await bidirectionalConnectionsService.getSentAffirmations(50); // Limit to 50 most recent
        setSentAffirmations(sent);
      } catch (err) {
        console.error('Error loading sent affirmations:', err);
        // Set empty array to prevent infinite loading state
        setSentAffirmations([]);
      } finally {
        setSentLoading(false);
      }
    }
  }, [user?.id, sentAffirmations.length]);

  useEffect(() => {
    if (user?.id) {
      loadInitialAffirmation();
    }
  }, [user?.id, loadInitialAffirmation]);

  // Make refreshAffirmations available globally for other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let refreshTimeout: NodeJS.Timeout;
      (window as any).refreshAffirmations = () => {
        // Debounce refresh calls to prevent excessive API requests
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          // Only refresh received affirmations by default
          if (activeTab === 'received') {
            loadInitialAffirmation();
          } else {
            // If on sent tab, refresh both
            loadInitialAffirmation();
            loadSentAffirmations();
          }
        }, 100);
      };
    }
  }, [loadInitialAffirmation, loadSentAffirmations, activeTab]);

  const filteredAffirmations = useMemo(() => 
    activeTab === 'received' 
      ? receivedAffirmations.filter(aff => selectedTheme === 'all' || aff.category === selectedTheme)
      : sentAffirmations.filter(aff => selectedTheme === 'all' || aff.category === selectedTheme),
    [activeTab, selectedTheme, receivedAffirmations, sentAffirmations]
  );

  // Update currentAffirmation when theme filter changes
  useEffect(() => {
    if (activeTab === 'received' && filteredAffirmations.length > 0) {
      // If current affirmation is not in filtered results, set to first filtered affirmation
      const isCurrentInFiltered = currentAffirmation && filteredAffirmations.some(aff => aff.id === currentAffirmation.id);
      if (!isCurrentInFiltered) {
        const unread = filteredAffirmations.filter(aff => aff.status === 'delivered');
        const affirmation = unread.length > 0 ? unread[0] : filteredAffirmations[0];
        setCurrentAffirmation(affirmation);
        
        // Update sender profile for the new affirmation
        if (affirmation.sender_name || affirmation.sender_photo_url) {
          setSenderProfile({
            id: affirmation.sender_id,
            full_name: affirmation.sender_name || '',
            photo_url: affirmation.sender_photo_url || '',
            created_at: '',
            updated_at: ''
          });
        }
      }
    }
  }, [selectedTheme, activeTab]); // Remove filteredAffirmations from dependencies

  const handleNextAffirmation = useCallback(async () => {
    if (filteredAffirmations.length === 0) return;
    
    const currentIndex = filteredAffirmations.findIndex(aff => aff.id === currentAffirmation?.id);
    const nextIndex = (currentIndex + 1) % filteredAffirmations.length;
    const nextAffirmation = filteredAffirmations[nextIndex];
    
    setCurrentAffirmation(nextAffirmation);
    
    // Update sender profile for the new affirmation
    if (nextAffirmation.sender_name || nextAffirmation.sender_photo_url) {
      setSenderProfile({
        id: nextAffirmation.sender_id,
        full_name: nextAffirmation.sender_name || '',
        photo_url: nextAffirmation.sender_photo_url || '',
        created_at: '',
        updated_at: ''
      });
    }
    
    // Mark as read
    if (nextAffirmation.status === 'delivered') {
      await bidirectionalConnectionsService.markAffirmationAsRead(nextAffirmation.id);
    }
  }, [filteredAffirmations, currentAffirmation]);

  const handlePreviousAffirmation = useCallback(async () => {
    if (filteredAffirmations.length === 0) return;
    
    const currentIndex = filteredAffirmations.findIndex(aff => aff.id === currentAffirmation?.id);
    const prevIndex = currentIndex === 0 ? filteredAffirmations.length - 1 : currentIndex - 1;
    const prevAffirmation = filteredAffirmations[prevIndex];
    
    setCurrentAffirmation(prevAffirmation);
    
    // Update sender profile for the new affirmation
    if (prevAffirmation.sender_name || prevAffirmation.sender_photo_url) {
      setSenderProfile({
        id: prevAffirmation.sender_id,
        full_name: prevAffirmation.sender_name || '',
        photo_url: prevAffirmation.sender_photo_url || '',
        created_at: '',
        updated_at: ''
      });
    }
    
    // Mark as read
    if (prevAffirmation.status === 'delivered') {
      await bidirectionalConnectionsService.markAffirmationAsRead(prevAffirmation.id);
    }
  }, [filteredAffirmations, currentAffirmation]);

  const handleToggleFavorite = async (affirmation: Affirmation) => {
    try {

      setFavoriteLoading(affirmation.id);
      await bidirectionalConnectionsService.toggleFavorite(affirmation.id, !affirmation.is_favorite);
      
      // Update received affirmations state
      const updatedReceivedAffirmations = receivedAffirmations.map(aff => 
        aff.id === affirmation.id 
          ? { ...aff, is_favorite: !aff.is_favorite }
          : aff
      );
      setReceivedAffirmations(updatedReceivedAffirmations);
      
      // Update sent affirmations state
      const updatedSentAffirmations = sentAffirmations.map(aff => 
        aff.id === affirmation.id 
          ? { ...aff, is_favorite: !aff.is_favorite }
          : aff
      );
      setSentAffirmations(updatedSentAffirmations);
      
      // Update current affirmation if it's the one being favorited
      if (currentAffirmation?.id === affirmation.id) {
        setCurrentAffirmation({ ...affirmation, is_favorite: !affirmation.is_favorite });
      }
      
              // Refresh treasured page if it exists
        if (typeof window !== 'undefined' && (window as any).refreshTreasured) {
          (window as any).refreshTreasured();
        }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(null);
    }
  };

  const handleEditAffirmation = (affirmation: Affirmation) => {
    setEditingAffirmation(affirmation);
    setEditForm({
      message: affirmation.message,
      category: affirmation.category
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAffirmation) return;
    
    try {
      setEditLoading(true);
      
      // Note: The new service doesn't have an update method, so we'll need to implement it
      // For now, we'll just close the dialog
      setEditDialogOpen(false);
      setEditingAffirmation(null);
      
      // Refresh affirmations
      await loadInitialAffirmation();
    } catch (error) {
      console.error('Error saving edit:', error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAffirmation = async (affirmation: Affirmation) => {
    if (!confirm('Are you sure you want to delete this affirmation?')) return;
    
    try {
      // Note: The new service doesn't have a delete method, so we'll need to implement it
      // For now, we'll just remove it from local state
      const updatedAffirmations = receivedAffirmations.filter(aff => aff.id !== affirmation.id);
      setReceivedAffirmations(updatedAffirmations);
      
      if (currentAffirmation?.id === affirmation.id) {
        setCurrentAffirmation(updatedAffirmations[0] || null);
      }
    } catch (error) {
      console.error('Error deleting affirmation:', error);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
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
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
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
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 3 
      }}>
        <Box sx={{ textAlign: 'center' }}>
          {/* Removed page title and catchphrase - now only in button tray */}
        </Box>
        
                 {/* Tab Buttons */}
         <Box sx={{ display: 'flex', gap: 1 }}>
           <Button
             variant={activeTab === 'received' ? 'contained' : 'outlined'}
             onClick={() => setActiveTab('received')}
             sx={{
               color: activeTab === 'received' ? 'white' : 'white',
               borderColor: 'white',
               '&:hover': {
                 borderColor: 'white',
                 backgroundColor: activeTab === 'received' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'
               }
             }}
           >
             Received
           </Button>
           <Button
             variant={activeTab === 'sent' ? 'contained' : 'outlined'}
             onClick={() => {
               setActiveTab('sent');
               loadSentAffirmations();
             }}
             sx={{
               color: activeTab === 'sent' ? 'white' : 'white',
               borderColor: 'white',
               '&:hover': {
                 borderColor: 'white',
                 backgroundColor: activeTab === 'sent' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'
               }
             }}
           >
             Sent
           </Button>
         </Box>
      </Box>

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

      {/* Main Content */}
      {activeTab === 'received' ? (
        // Received Affirmations View
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {currentAffirmation ? (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'flex-start',
              padding: 2,
              paddingTop: 4
            }}>
              <Card 
                ref={cardRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  maxWidth: '500px',
                  width: '100%',
                  borderRadius: 0,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  transform: 'translateY(-20px)'
                }}
              >
                {/* Notecard-style background pattern */}
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '40px',
                  background: 'linear-gradient(90deg, transparent 0%, transparent 40px, #f0f0f0 40px, #f0f0f0 42px, transparent 42px)',
                  backgroundSize: '42px 100%',
                  opacity: 0.3
                }} />
                
                <CardContent sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  padding: 4,
                  textAlign: 'center',
                  minHeight: '400px'
                }}>
                  {/* Sender Info */}
                  <Box sx={{ marginBottom: 3 }}>
                    <Avatar
                      src={senderProfile?.photo_url}
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        margin: '0 auto 1rem',
                        backgroundColor: '#667eea',
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    >
                      {senderProfile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                      From {senderProfile?.full_name || 'Someone special'}
                    </Typography>
                    {!senderProfile?.full_name && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        (Sender hasn't set their name yet)
                      </Typography>
                    )}
                  </Box>

                  {/* Affirmation Content */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="h3" sx={{ marginBottom: 1, fontSize: '3rem' }}>
                      {getThemeEmoji(currentAffirmation.category)}
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        marginBottom: 3,
                        color: getThemeColor(currentAffirmation.category),
                        fontWeight: 500,
                        textAlign: 'center'
                      }}
                    >
                      {getThemeById(currentAffirmation.category)?.name || currentAffirmation.category}
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        marginBottom: 3,
                        lineHeight: 1.6,
                        fontStyle: 'italic',
                        color: getThemeColor(currentAffirmation.category),
                        fontWeight: 400,
                        padding: '0 1rem'
                      }}
                    >
                      "{currentAffirmation.message}"
                    </Typography>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: 3,
                    padding: '0 16px'
                  }}>
                    <Fab
                      onClick={handlePreviousAffirmation}
                      aria-label="Previous affirmation"
                      sx={{ 
                        width: 80,
                        height: 80,
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.2)'
                        }
                      }}
                    >
                      <NavigateBefore sx={{ fontSize: 28 }} />
                    </Fab>
                    
                    <IconButton
                      onClick={() => handleToggleFavorite(currentAffirmation)}
                      disabled={favoriteLoading === currentAffirmation.id}
                      sx={{ 
                        color: currentAffirmation.is_favorite ? '#e74c3c' : '#667eea',
                        backgroundColor: currentAffirmation.is_favorite ? 'rgba(231, 76, 60, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                        '&:hover': {
                          backgroundColor: currentAffirmation.is_favorite ? 'rgba(231, 76, 60, 0.2)' : 'rgba(102, 126, 234, 0.2)'
                        }
                      }}
                    >
                      {favoriteLoading === currentAffirmation.id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        currentAffirmation.is_favorite ? <DiamondIcon sx={{ fontSize: '1.2rem', color: '#e74c3c' }} /> : <DiamondIcon sx={{ fontSize: '1.2rem', color: '#667eea' }} />
                      )}
                    </IconButton>
                    
                    <Fab
                      onClick={handleNextAffirmation}
                      aria-label="Next affirmation"
                      sx={{ 
                        width: 80,
                        height: 80,
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.2)'
                        }
                      }}
                    >
                      <NavigateNext sx={{ fontSize: 28 }} />
                    </Fab>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Card sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.95)'
            }}>
              <Box sx={{ textAlign: 'center', padding: 4 }}>
                <Typography variant="h5" color="text.secondary" sx={{ marginBottom: 2 }}>
                  No affirmations yet
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  When someone sends you an affirmation, it will appear here.
                </Typography>
              </Box>
            </Card>
          )}
        </Box>
      ) : (
        // Sent Affirmations View
        <Card sx={{ 
          flex: 1, 
          backgroundColor: 'rgba(255,255,255,0.95)',
          overflow: 'auto'
        }}>
          {sentLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress />
            </Box>
          ) : filteredAffirmations.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" color="text.secondary">
                No sent affirmations yet
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Start sending love notes to see them here!
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredAffirmations.map((affirmation) => (
                <Card key={affirmation.id} sx={{ margin: 1, boxShadow: 'none', border: '1px solid #eee' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                          <Typography variant="h6" sx={{ marginRight: 1 }}>
                            {getThemeEmoji(affirmation.category)}
                          </Typography>
                          <Typography variant="subtitle1" color="text.secondary">
                            To {affirmation.recipient_name || 'Someone special'}
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ marginBottom: 1, fontStyle: 'italic' }}>
                          "{affirmation.message}"
                        </Typography>
                        <Chip 
                          label={getThemeById(affirmation.category)?.name || affirmation.category}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleFavorite(affirmation)}
                          disabled={favoriteLoading === affirmation.id}
                          sx={{ color: affirmation.is_favorite ? '#e74c3c' : '#667eea' }}
                        >
                          {favoriteLoading === affirmation.id ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            affirmation.is_favorite ? <DiamondIcon sx={{ fontSize: '1rem', color: '#e74c3c' }} /> : <DiamondIcon sx={{ fontSize: '1rem', color: '#667eea' }} />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditAffirmation(affirmation)}
                          sx={{ color: '#667eea' }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAffirmation(affirmation)}
                          sx={{ color: '#ff6b6b' }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Affirmation</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Message"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={editForm.message}
            onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            Theme:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {AFFIRMATION_THEMES.map((theme) => (
              <Chip
                key={theme.id}
                label={`${theme.emoji} ${theme.name}`}
                onClick={() => setEditForm({ ...editForm, category: theme.id })}
                sx={{ 
                  backgroundColor: editForm.category === theme.id ? theme.color : 'transparent',
                  color: editForm.category === theme.id ? 'white' : 'inherit',
                  border: `1px solid ${theme.color}`,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.color,
                    color: 'white'
                  }
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveEdit} 
            disabled={editLoading || !editForm.message.trim()}
            variant="contained"
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
