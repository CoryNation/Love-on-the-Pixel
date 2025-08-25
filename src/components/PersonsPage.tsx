'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  IconButton, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Typography, 
  Card,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Person, 
  PersonAdd,
  Favorite,
  Refresh,
  Delete
} from '@mui/icons-material';
import { personsService, type Person } from '@/lib/personsService';
import { affirmationsService } from '@/lib/affirmations';
import { useAuth } from '@/contexts/AuthContext';
import { AFFIRMATION_THEMES } from '@/lib/affirmationThemes';

export default function PersonsPage() {
  const { user } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [newPerson, setNewPerson] = useState({ name: '' });
  const [message, setMessage] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('love');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPersons();
  }, [user?.id]);

  const loadPersons = async () => {
    try {
      const data = await personsService.getAll();
      setPersons(data);
    } catch (error) {
      console.error('Error loading persons:', error);
    }
  };

  const handleAddPerson = async () => {
    if (newPerson.name.trim()) {
      try {
        setLoading(true);
        await personsService.create(newPerson);
        setNewPerson({ name: '' });
        setOpenAddDialog(false);
        await loadPersons();
      } catch (error) {
        console.error('Error adding person:', error);
        alert('Failed to add person or share invitation');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendAffirmation = async () => {
    if (message.trim() && selectedPerson) {
      try {
        setLoading(true);
        
        console.log('Sending affirmation to:', selectedPerson);
        console.log('Selected person user_id:', selectedPerson.user_id);
        console.log('Current user:', user?.id);
        
        // Check if the recipient has signed up (has a user_id)
        if (!selectedPerson.user_id) {
          // Recipient hasn't signed up yet - store the affirmation with pending status
          console.log('Creating pending affirmation for email:', selectedPerson.email);
          const newAffirmation = await affirmationsService.create({
            message: message.trim(),
            category: selectedTheme,
            recipient_id: null, // No recipient_id since they haven't signed up
            recipient_email: selectedPerson.email // Store email for later matching
          });
          console.log('Created pending affirmation:', newAffirmation);
        } else {
          // Recipient has signed up - create delivered affirmation
          console.log('Creating delivered affirmation for user_id:', selectedPerson.user_id);
          const newAffirmation = await affirmationsService.create({
            message: message.trim(),
            category: selectedTheme,
            recipient_id: selectedPerson.user_id
          });
          console.log('Created delivered affirmation:', newAffirmation);
        }

        setMessage('');
        setSelectedTheme('love');
        setOpenSendDialog(false);
        setSelectedPerson(null);
        
        // Refresh the affirmations in WavePage
        if (typeof window !== 'undefined' && (window as any).refreshAffirmations) {
          (window as any).refreshAffirmations();
        }
        
        alert('Affirmation sent successfully!');
      } catch (error) {
        console.error('Error sending affirmation:', error);
        alert('Failed to send affirmation. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeletePerson = async (personId: string) => {
    if (confirm('Are you sure you want to remove this person?')) {
      try {
        await personsService.delete(personId);
        await loadPersons();
      } catch (error) {
        console.error('Error deleting person:', error);
        alert('Failed to delete person. Please try again.');
      }
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 300,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          Persons
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setOpenAddDialog(true)}
          sx={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.3)'
            }
          }}
        >
          Add Person
        </Button>
      </Box>

      {/* Persons List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {persons.length === 0 ? (
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              padding: 3,
              textAlign: 'center'
            }}
          >
            <Typography variant="body1" sx={{ color: '#2c3e50' }}>
              No persons added yet. Add someone special to start sending affirmations!
            </Typography>
          </Card>
        ) : (
          <List>
            {persons.map((person) => (
              <Card
                key={person.id}
                sx={{
                  marginBottom: 1,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2
                }}
              >
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={person.name}
                    secondary={
                      person.user_id && (
                        <span style={{ color: '#27ae60' }}>
                          • Signed up
                        </span>
                      )
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="contained"
                      endIcon={<Favorite />}
                      onClick={() => {
                        setSelectedPerson(person);
                        setOpenSendDialog(true);
                      }}
                      sx={{ 
                        backgroundColor: '#667eea',
                        color: 'white',
                        marginRight: 1,
                        '&:hover': {
                          backgroundColor: '#5a6fd8'
                        }
                      }}
                      size="small"
                    >
                      Send
                    </Button>
                    <IconButton
                      edge="end"
                      onClick={() => {
                        // Send invitation logic here
                        alert('Invitation sent!');
                      }}
                      sx={{ color: '#667eea', marginRight: 1 }}
                      title="Send invitation"
                    >
                      <Refresh />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeletePerson(person.id)}
                      sx={{ color: '#e74c3c' }}
                      title="Delete person"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Card>
            ))}
          </List>
        )}
      </Box>

      {/* Add Person Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add Person</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={newPerson.name}
            onChange={(e) => setNewPerson({ name: e.target.value })}
            sx={{ marginTop: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAddPerson} variant="contained" disabled={loading || !newPerson.name.trim()}>
            {loading ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Affirmation Dialog */}
      <Dialog 
        open={openSendDialog} 
        onClose={() => setOpenSendDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Affirmation to {selectedPerson?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ marginBottom: 2, color: 'text.secondary' }}>
            Choose a theme and write your message of love, encouragement, or appreciation.
          </Typography>
          
          {/* Theme Selection */}
          <Typography variant="subtitle2" sx={{ marginBottom: 1, fontWeight: 600 }}>
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
                variant={selectedTheme === theme.id ? 'contained' : 'outlined'}
                onClick={() => setSelectedTheme(theme.id)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 1,
                  minHeight: 60,
                  backgroundColor: selectedTheme === theme.id ? theme.color : 'transparent',
                  borderColor: theme.color,
                  color: selectedTheme === theme.id ? 'white' : theme.color,
                  '&:hover': {
                    backgroundColor: selectedTheme === theme.id ? theme.color : `${theme.color}20`,
                    borderColor: theme.color,
                    color: selectedTheme === theme.id ? 'white' : theme.color,
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
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ marginTop: 1 }}
            placeholder="Write your message of love, encouragement, or appreciation..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendAffirmation} 
            variant="contained"
            disabled={loading || !message.trim()}
          >
            {loading ? 'Sending...' : 'Send Affirmation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
