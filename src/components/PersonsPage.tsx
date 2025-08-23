'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import { 
  Send, 
  PersonAdd,
  Refresh,
  Close
} from '@mui/icons-material';
import { shareInvitationService, type ShareInvitationData } from '@/lib/shareInvitationService';
import { userProfileService } from '@/lib/userProfile';
import { personsService, type Person } from '@/lib/personsService';
import { useAuth } from '@/contexts/AuthContext';



export default function PersonsPage() {
  const { user } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [newPerson, setNewPerson] = useState({ name: '', email: '', relationship: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  // Load persons on component mount
  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      const data = await personsService.getAll();
      setPersons(data);
    } catch (error) {
      console.error('Error loading persons:', error);
    }
  };

  const handleAddPerson = async () => {
    if (newPerson.name) {
      try {
        setLoading(true);
        
        // Get current user's profile for the invitation
        const userProfile = await userProfileService.getCurrentProfile();
        
        const invitationData: ShareInvitationData = {
          inviterName: userProfile?.full_name || user?.email || 'Someone',
          inviterEmail: user?.email || '',
          inviteeName: newPerson.name.trim(),
          customMessage: customMessage.trim() || undefined
        };

        // Store invitation in database
        console.log('Storing invitation in database...');
        await shareInvitationService.storeInvitation(invitationData);
        console.log('Invitation stored successfully');
        
        // Share invitation
        console.log('About to share invitation...');
        await shareInvitationService.shareInvitation(invitationData);
        console.log('Share invitation completed');
        
        // Add person to database
        await personsService.create({
          name: newPerson.name.trim(),
          email: newPerson.email.trim() || undefined,
          relationship: newPerson.relationship.trim() || undefined
        });
        
        // Reload persons list
        await loadPersons();
        
        setNewPerson({ name: '', email: '', relationship: '' });
        setCustomMessage('');
        setOpenAddDialog(false);
        
        // Show success message
        alert('Person added and invitation shared successfully!');
      } catch (error) {
        console.error('Error adding person and sharing invitation:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        alert(`Failed to add person or share invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendAffirmation = () => {
    if (message.trim() && selectedPerson) {
      // Here you would send the affirmation to the selected person
      console.log('Sending to:', selectedPerson.name, 'Message:', message);
      setMessage('');
      setOpenSendDialog(false);
      setSelectedPerson(null);
    }
  };

  const handleRegenerateShare = async (person: Person) => {
    try {
      setLoading(true);
      
      // Get current user's profile for the invitation
      const userProfile = await userProfileService.getCurrentProfile();
      
      const invitationData: ShareInvitationData = {
        inviterName: userProfile?.full_name || user?.email || 'Someone',
        inviterEmail: user?.email || '',
        inviteeName: person.name,
        customMessage: undefined
      };

      // Store invitation in database
      await shareInvitationService.storeInvitation(invitationData);
      
      // Share invitation
      await shareInvitationService.shareInvitation(invitationData);
      
      alert('New invitation link generated and shared successfully!');
    } catch (error) {
      console.error('Error regenerating share:', error);
      alert('Failed to regenerate invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePerson = async (person: Person) => {
    if (confirm(`Are you sure you want to remove ${person.name} from your connections?`)) {
      try {
        setLoading(true);
        await personsService.delete(person.id);
        await loadPersons(); // Reload the list
        alert(`${person.name} has been removed from your connections.`);
      } catch (error) {
        console.error('Error deleting person:', error);
        alert('Failed to remove person. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };



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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
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
        <IconButton 
          onClick={() => setOpenAddDialog(true)}
          sx={{ 
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.2)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
          }}
        >
          <PersonAdd />
        </IconButton>
      </Box>

      {/* Persons List */}
      <List sx={{ padding: 0 }}>
        {persons.map((person) => (
          <Card
            key={person.id}
            sx={{
              marginBottom: 2,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2
            }}
          >
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ fontSize: '1.5rem' }}>
                  {person.avatar || person.name.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={person.name}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {person.email}
                    </Typography>
                    <Chip 
                      label={person.relationship} 
                      size="small" 
                      sx={{ backgroundColor: '#667eea', color: 'white' }}
                    />
                  </Box>
                }
              />
                             <ListItemSecondaryAction>
                 <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                   {/* Send Affirmation Button */}
                   <Button
                     variant="contained"
                     onClick={() => {
                       setSelectedPerson(person);
                       setOpenSendDialog(true);
                     }}
                     disabled={loading}
                     sx={{
                       backgroundColor: '#667eea',
                       color: 'white',
                       borderRadius: 2,
                       padding: '8px 16px',
                       minWidth: 'auto',
                       fontSize: '0.875rem',
                       textTransform: 'none',
                       '&:hover': {
                         backgroundColor: '#5a6fd8'
                       }
                     }}
                   >
                     Send ❤️
                   </Button>
                   
                   {/* Regenerate Share Link Button */}
                   <IconButton
                     onClick={() => handleRegenerateShare(person)}
                     disabled={loading}
                     sx={{ 
                       color: '#667eea',
                       backgroundColor: 'rgba(102, 126, 234, 0.1)',
                       '&:hover': { 
                         backgroundColor: 'rgba(102, 126, 234, 0.2)',
                         color: '#5a6fd8'
                       }
                     }}
                     title="Regenerate share link"
                   >
                     <Refresh />
                   </IconButton>
                   
                   {/* Delete Person Button */}
                   <IconButton
                     onClick={() => handleDeletePerson(person)}
                     disabled={loading}
                     sx={{ 
                       color: '#e74c3c',
                       backgroundColor: 'rgba(231, 76, 60, 0.1)',
                       '&:hover': { 
                         backgroundColor: 'rgba(231, 76, 60, 0.2)',
                         color: '#c0392b'
                       }
                     }}
                     title={`Remove ${person.name}`}
                   >
                     <Close />
                   </IconButton>
                 </Box>
               </ListItemSecondaryAction>
            </ListItem>
          </Card>
        ))}
      </List>

             {/* Add Person Dialog */}
       <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
         <DialogTitle>Add Person & Share Invitation</DialogTitle>
         <DialogContent>
                       <Typography variant="body2" sx={{ marginBottom: 2, color: 'text.secondary' }}>
              Add a new person to your connections. You&apos;ll be able to share a custom invitation message with them.
            </Typography>
           <TextField
             fullWidth
             label="Name"
             value={newPerson.name}
             onChange={(e) => setNewPerson(prev => ({ ...prev, name: e.target.value }))}
             sx={{ marginBottom: 2, marginTop: 1 }}
           />
           <TextField
             fullWidth
             label="Relationship"
             value={newPerson.relationship}
             onChange={(e) => setNewPerson(prev => ({ ...prev, relationship: e.target.value }))}
             sx={{ marginBottom: 2 }}
           />
           <TextField
             fullWidth
             multiline
             rows={3}
             label="Custom Invitation Message (Optional)"
             value={customMessage}
             onChange={(e) => setCustomMessage(e.target.value)}
             placeholder="Write a personal message to invite them to join Love on the Pixel..."
             helperText="Leave blank to use the default message"
           />
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setOpenAddDialog(false)} disabled={loading}>Cancel</Button>
           <Button 
             onClick={handleAddPerson} 
             variant="contained"
             disabled={loading || !newPerson.name.trim()}
           >
             {loading ? 'Adding...' : 'Add Person & Share Invitation'}
           </Button>
         </DialogActions>
       </Dialog>

      {/* Send Affirmation Dialog */}
      <Dialog open={openSendDialog} onClose={() => setOpenSendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Love Note to {selectedPerson?.name}</DialogTitle>
        <DialogContent>
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
          <Button onClick={() => setOpenSendDialog(false)}>Cancel</Button>
          <Button onClick={handleSendAffirmation} variant="contained">Send</Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
}
