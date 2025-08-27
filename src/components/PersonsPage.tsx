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
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import { 
  Person, 
  PersonAdd,
  Favorite,
  Refresh,
  Delete
} from '@mui/icons-material';
import { bidirectionalConnectionsService, type PersonWithConnection } from '@/lib/bidirectional-connections';
import { shareInvitationService } from '@/lib/shareInvitationService';
import { userProfileService } from '@/lib/userProfile';
import { useAuth } from '@/contexts/AuthContext';
import { AFFIRMATION_THEMES } from '@/lib/affirmationThemes';

export default function PersonsPage() {
  const { user } = useAuth();
  const [persons, setPersons] = useState<PersonWithConnection[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonWithConnection | null>(null);
  const [newPerson, setNewPerson] = useState({ name: '' });
  const [message, setMessage] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('love');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPersons();
  }, [user?.id]);

  const loadPersons = async () => {
    try {
      const data = await bidirectionalConnectionsService.getPersonsWithConnections();
      setPersons(data);
    } catch (error) {
      console.error('Error loading persons:', error);
    }
  };

  const handleAddPerson = async () => {
    if (newPerson.name.trim()) {
      try {
        setLoading(true);
        
        // Try to find if this person is an existing user
        const existingUser = await bidirectionalConnectionsService.findUserByName(newPerson.name);
        
        if (existingUser) {
          // Person exists - create bidirectional connection
          await bidirectionalConnectionsService.addPersonWithConnection(newPerson.name, existingUser.id);
        } else {
          // Person doesn't exist - add without connection for now
          await bidirectionalConnectionsService.addPersonWithConnection(newPerson.name);
        }
        
        setNewPerson({ name: '' });
        setOpenAddDialog(false);
        await loadPersons();
      } catch (error) {
        console.error('Error adding person:', error);
        alert('Failed to add person. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendInvitation = async (person: PersonWithConnection) => {
    try {
      // Get current user's profile for the invitation
      const userProfile = await userProfileService.getCurrentProfile();
      
      await shareInvitationService.shareInvitation({
        inviterName: userProfile?.full_name || user?.email || 'A friend',
        inviterEmail: user?.email || '',
        inviteeName: person.name,
        customMessage: `Hi ${person.name}! I'd love to share affirmations and words of encouragement with you through Love on the Pixel. Join me in spreading love and positivity! 💕`
      });

      // Store the invitation in the database
      await shareInvitationService.storeInvitation({
        inviterName: userProfile?.full_name || user?.email || 'A friend',
        inviterEmail: user?.email || '',
        inviteeName: person.name,
        customMessage: `Hi ${person.name}! I'd love to share affirmations and words of encouragement with you through Love on the Pixel. Join me in spreading love and positivity! 💕`
      });

    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  const handleSendAffirmation = async () => {
    if (message.trim() && selectedPerson) {
      try {
        setLoading(true);
        
        console.log('Sending affirmation to:', selectedPerson);
        
        // Check if the person has a connected user ID (they've accepted the connection)
        if (selectedPerson.connected_user_id) {
          // Person has accepted the connection - send affirmation
          console.log('Person has accepted connection, sending affirmation to user_id:', selectedPerson.connected_user_id);
          
          const newAffirmation = await bidirectionalConnectionsService.createAffirmation({
            message: message.trim(),
            category: selectedTheme,
            recipient_id: selectedPerson.connected_user_id
          });
          
          console.log('Created affirmation:', newAffirmation);
        } else if (selectedPerson.email) {
          // Person hasn't accepted the connection yet, but we have their email - create pending affirmation
          console.log('Person hasn\'t accepted connection yet, creating pending affirmation for email:', selectedPerson.email);
          
          await bidirectionalConnectionsService.createPendingAffirmation(
            message.trim(),
            selectedTheme,
            selectedPerson.email
          );
          
          console.log('Created pending affirmation for email:', selectedPerson.email);
        } else {
          // Person hasn't accepted the connection yet and we don't have their email - show message
          alert('This person needs to accept your invitation before you can send them affirmations.');
          return;
        }
        
        setMessage('');
        setSelectedTheme('love');
        setOpenSendDialog(false);
        
        // Show success message
        alert('Affirmation sent successfully!');
        
        // Refresh the affirmations in WavePage
        if (typeof window !== 'undefined' && (window as any).refreshAffirmations) {
          (window as any).refreshAffirmations();
        }
        
      } catch (error) {
        console.error('Error sending affirmation:', error);
        alert('Failed to send affirmation. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeletePerson = async (id: string) => {
    if (confirm('Are you sure you want to delete this person?')) {
      try {
        // If the person has a connected user ID, remove the bidirectional connection
        const person = persons.find(p => p.id === id);
        if (person?.connected_user_id) {
          await bidirectionalConnectionsService.removeBidirectionalConnection(person.connected_user_id);
        }
        
        // Note: The person will remain in the persons list but the connection will be removed
        // This allows affirmations to persist even if connections are removed
        
        await loadPersons();
      } catch (error) {
        console.error('Error deleting person:', error);
        alert('Failed to delete person. Please try again.');
      }
    }
  };

  const getConnectionStatusChip = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Chip label="Connected" color="success" size="small" />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'blocked':
        return <Chip label="Blocked" color="error" size="small" />;
      default:
        return <Chip label="No Connection" color="default" size="small" />;
    }
  };

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
      <Card sx={{ flex: 1, overflow: 'auto', backgroundColor: 'rgba(255,255,255,0.95)' }}>
        <List>
          {persons.map((person) => (
            <ListItem
              key={person.id}
              sx={{
                borderBottom: '1px solid #eee',
                '&:last-child': { borderBottom: 'none' }
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ backgroundColor: '#667eea' }}>
                  <Person />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={person.name}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    {getConnectionStatusChip(person.connection_status)}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {person.connection_status === 'accepted' && (
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setSelectedPerson(person);
                        setOpenSendDialog(true);
                      }}
                      sx={{ color: '#667eea' }}
                    >
                      <Favorite />
                    </IconButton>
                  )}
                  {person.connection_status === 'no_connection' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleSendInvitation(person)}
                      sx={{ color: '#667eea', borderColor: '#667eea' }}
                    >
                      Invite
                    </Button>
                  )}
                  <IconButton
                    edge="end"
                    onClick={() => handleDeletePerson(person.id)}
                    sx={{ color: '#ff6b6b' }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Card>

      {/* Add Person Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add New Person</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Person Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newPerson.name}
            onChange={(e) => setNewPerson({ name: e.target.value })}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddPerson} 
            disabled={loading || !newPerson.name.trim()}
            variant="contained"
          >
            {loading ? 'Adding...' : 'Add Person'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Affirmation Dialog */}
      <Dialog open={openSendDialog} onClose={() => setOpenSendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Affirmation to {selectedPerson?.name}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Message"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            Theme:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {Object.entries(AFFIRMATION_THEMES).map(([key, theme]) => (
              <Chip
                key={key}
                label={theme.name}
                onClick={() => setSelectedTheme(key)}
                color={selectedTheme === key ? 'primary' : 'default'}
                variant={selectedTheme === key ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSendAffirmation} 
            disabled={loading || !message.trim()}
            variant="contained"
          >
            {loading ? 'Sending...' : 'Send Affirmation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
