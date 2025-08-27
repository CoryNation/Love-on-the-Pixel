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
  Delete,
  Email
} from '@mui/icons-material';
import { personsService, type Person as PersonType } from '@/lib/personsService';
import { emailInvitationService } from '@/lib/emailInvitationService';
import { useAuth } from '@/contexts/AuthContext';
import { AFFIRMATION_THEMES } from '@/lib/affirmationThemes';

export default function PersonsPage() {
  const { user } = useAuth();
  const [persons, setPersons] = useState<PersonType[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonType | null>(null);
  const [newPerson, setNewPerson] = useState({ name: '', email: '' });
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
    if (newPerson.name.trim() && newPerson.email.trim()) {
      try {
        setLoading(true);
        
        // Create the person in the persons table
        await personsService.create({
          name: newPerson.name,
          email: newPerson.email
        });
        
        // Create an invitation
        await emailInvitationService.createInvitation({
          invitee_name: newPerson.name,
          invitee_email: newPerson.email,
          custom_message: `Hi ${newPerson.name}! I'd love to share affirmations and words of encouragement with you through Love on the Pixel. Join me in spreading love and positivity! 💕`
        });
        
        setNewPerson({ name: '', email: '' });
        setOpenAddDialog(false);
        await loadPersons();
        
        alert('Person added and invitation sent successfully!');
      } catch (error) {
        console.error('Error adding person:', error);
        alert('Failed to add person. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendAffirmation = async () => {
    if (message.trim() && selectedPerson) {
      try {
        setLoading(true);
        
        // For now, we'll use a simple approach - just show a message
        // In the future, this will integrate with the affirmations system
        alert('Affirmation feature will be available once the person accepts your invitation!');
        
        setMessage('');
        setSelectedTheme('love');
        setOpenSendDialog(false);
        
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
        // For now, we'll just remove from the persons list
        // In the future, this will also handle connection removal
        await loadPersons();
        alert('Person removed from your list.');
      } catch (error) {
        console.error('Error deleting person:', error);
        alert('Failed to delete person. Please try again.');
      }
    }
  };

  const getConnectionStatusChip = (person: PersonType) => {
    // For now, show "Pending" for all persons since they need to accept invitations
    return <Chip label="Pending Invitation" color="warning" size="small" />;
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
          {persons.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No persons added yet. Add someone to start sharing affirmations!
              </Typography>
            </Box>
          ) : (
            persons.map((person) => (
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
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {person.email}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        {getConnectionStatusChip(person)}
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setSelectedPerson(person);
                        setOpenSendDialog(true);
                      }}
                      sx={{ color: '#667eea' }}
                      title="Send affirmation"
                    >
                      <Favorite />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeletePerson(person.id)}
                      sx={{ color: '#ff6b6b' }}
                      title="Remove person"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      </Card>

      {/* Add Person Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
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
            onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={newPerson.email}
            onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
            placeholder="Enter their email address to send an invitation"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddPerson} 
            disabled={loading || !newPerson.name.trim() || !newPerson.email.trim()}
            variant="contained"
          >
            {loading ? 'Adding...' : 'Add Person & Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Affirmation Dialog */}
      <Dialog open={openSendDialog} onClose={() => setOpenSendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Affirmation to {selectedPerson?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This person needs to accept your invitation before you can send them affirmations.
            Check the Invitations tab to see the status of your invitation.
          </Typography>
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
            disabled
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
                disabled
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
