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
  List,
  Avatar
} from '@mui/material';
import { 
  Favorite, 
  FavoriteBorder, 
  Share, 
  ArrowBack, 
  ArrowForward,
  Edit,
  Delete,
  Person
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { affirmationsService, type Affirmation } from '@/lib/affirmations';
import { userProfileService, type UserProfile } from '@/lib/userProfile';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

export default function WavePage() {
  const [currentAffirmation, setCurrentAffirmation] = useState<Affirmation | null>(null);
  const [sentAffirmations, setSentAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [senderProfile, setSenderProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadInitialAffirmation();
  }, []);

  const loadInitialAffirmation = async () => {
    try {
      setLoading(true);
      
      // Load a random unviewed affirmation first
      let affirmation = await affirmationsService.getRandomUnviewed();
      
      // If no unviewed affirmations, get a random viewed one
      if (!affirmation) {
        affirmation = await affirmationsService.getRandomViewed();
      }
      
      if (affirmation) {
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
      
      // Load sent affirmations
      const allAffirmations = await affirmationsService.getAll();
      const sent = allAffirmations.filter(aff => aff.created_by === 'current-user-id');
      setSentAffirmations(sent);
    } catch (err) {
      setError('Failed to load love notes. Please try again.');
      console.error('Error loading affirmations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNextUnviewed = async () => {
    try {
      const affirmation = await affirmationsService.getRandomUnviewed();
      if (affirmation) {
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
      const affirmation = await affirmationsService.getRandomViewed();
      if (affirmation) {
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

  // Swipe gesture handlers
  const { elementRef, isDragging, swipeOffset } = useSwipeGesture({
    onSwipeLeft: loadNextUnviewed, // Swipe left = new unviewed
    onSwipeRight: loadRandomViewed, // Swipe right = random viewed
  });

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
           onClick={loadInitialAffirmation} 
           variant="contained" 
           sx={{ marginTop: 2 }}
         >
          Try Again
        </Button>
      </Box>
    );
  }

  if (!currentAffirmation) {
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
              color: activeTab === 'received' ? 'white' : '#95a5a6',
              borderColor: activeTab === 'received' ? 'white' : '#95a5a6',
              backgroundColor: activeTab === 'received' ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': {
                borderColor: activeTab === 'received' ? 'white' : '#95a5a6',
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
              color: activeTab === 'sent' ? 'white' : '#95a5a6',
              borderColor: activeTab === 'sent' ? 'white' : '#95a5a6',
              backgroundColor: activeTab === 'sent' ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': {
                borderColor: activeTab === 'sent' ? 'white' : '#95a5a6',
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
           <Box 
             ref={elementRef}
             sx={{ 
               width: '100%', 
               maxWidth: 400, 
               position: 'relative',
               transform: isDragging ? `translateX(${swipeOffset}px)` : 'translateX(0)',
               transition: isDragging ? 'none' : 'transform 0.3s ease'
             }}
           >
             <AnimatePresence mode="wait">
               <motion.div
                 key={currentAffirmation.id}
                 initial={{ opacity: 0, scale: 0.8, x: 0 }}
                 animate={{ opacity: 1, scale: 1, x: 0 }}
                 exit={{ 
                   opacity: 0, 
                   scale: 0.8, 
                   x: swipeOffset > 0 ? -300 : 300 
                 }}
                 transition={{ duration: 0.3, ease: "easeInOut" }}
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
               </motion.div>
             </AnimatePresence>
           </Box>

                       {/* Swipe Instructions */}
            <Box sx={{ display: 'flex', gap: 4, marginTop: 3, justifyContent: 'center', alignItems: 'center' }}>
              {/* Left Arrow */}
              <Box
                sx={{
                  position: 'relative',
                  width: 120,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '15px solid transparent',
                    borderBottom: '15px solid transparent',
                    borderRight: '20px solid rgba(255,255,255,0.3)',
                    zIndex: 1
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
                    borderRadius: '30px 0 0 30px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      textAlign: 'center',
                      lineHeight: 1.2
                    }}
                  >
                    Swipe right<br />for viewed
                  </Typography>
                </Box>
              </Box>

              {/* Right Arrow */}
              <Box
                sx={{
                  position: 'relative',
                  width: 120,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '15px solid transparent',
                    borderBottom: '15px solid transparent',
                    borderLeft: '20px solid rgba(255,255,255,0.3)',
                    zIndex: 1
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(270deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
                    borderRadius: '0 30px 30px 0',
                    border: '1px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      textAlign: 'center',
                      lineHeight: 1.2
                    }}
                  >
                    Swipe left<br />for new
                  </Typography>
                </Box>
              </Box>
            </Box>
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
