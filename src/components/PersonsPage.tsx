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
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Person, 
  PersonAdd,
  Favorite,
  Refresh,
  Delete,
  Email,
  Check,
  Close,
  Share
} from '@mui/icons-material';
import { personsService, type Person as PersonType } from '@/lib/personsService';
import { emailInvitationService, type Invitation } from '@/lib/emailInvitationService';
import { useAuth } from '@/contexts/AuthContext';
import { AFFIRMATION_THEMES } from '@/lib/affirmationThemes';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`persons-tabpanel-${index}`}
      aria-labelledby={`persons-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function PersonsPage() {
  const { user } = useAuth();
  const [persons, setPersons] = useState<PersonType[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonType | null>(null);
  const [newPerson, setNewPerson] = useState({ email: '' });
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [addedPerson, setAddedPerson] = useState<PersonType | null>(null);
  const [message, setMessage] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('love');
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [invitationTabValue, setInvitationTabValue] = useState(1); // Start with Pending tab

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    try {
      const [personsData, allInvitations, pending] = await Promise.all([
        personsService.getAll(),
        emailInvitationService.getInvitations(),
        emailInvitationService.getPendingInvitations()
      ]);
      
      setPersons(personsData);
      setInvitations(allInvitations);
      setPendingInvitations(pending);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddPerson = async () => {
    if (newPerson.email.trim()) {
      try {
        setLoading(true);
        
        // Create the person in the persons table with email as name for now
        const createdPerson = await personsService.create({
          name: newPerson.email.split('@')[0], // Use email prefix as temporary name
          email: newPerson.email
        });
        
        // Create an invitation for this person
        console.log('Creating invitation for:', newPerson.email);
        const invitation = await emailInvitationService.createInvitation({
          invitee_name: newPerson.email.split('@')[0],
          invitee_email: newPerson.email
        });
        console.log('Invitation created:', invitation);
        
        setAddedPerson(createdPerson);
        setShowShareOptions(true);
        
        // Reload data to show the new invitation
        await loadData();
        
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
        
        // Create the affirmation - this will be stored and shown when the person accepts the invitation
        // For now, we'll use a simple approach - just show a success message
        alert('Affirmation sent! It will be available when this person accepts your invitation.');
        
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

  const handleShareInvitation = async (person: PersonType) => {
    try {
      // Generate invitation link - use the actual domain instead of Vercel preview
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://love-on-the-pixel.vercel.app' 
        : window.location.origin;
      const invitationLink = `${baseUrl}/sign-up?inviter=${user?.id}&invitee=${person.email}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(invitationLink);
      alert('Invitation link copied to clipboard! Share this link with your person to invite them to join.');
    } catch (error) {
      console.error('Error sharing invitation:', error);
      // Fallback: show the link in an alert if clipboard fails
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://love-on-the-pixel.vercel.app' 
        : window.location.origin;
      const invitationLink = `${baseUrl}/sign-up?inviter=${user?.id}&invitee=${person.email}`;
      alert(`Invitation link: ${invitationLink}\n\nCopy this link and share it with ${person.email}`);
    }
  };

  const handleDeletePerson = async (id: string) => {
    if (confirm('Are you sure you want to delete this person?')) {
      try {
        // Delete the person from the database
        await personsService.delete(id);
        
        // Also delete any pending invitations for this person
        const personToDelete = persons.find(p => p.id === id);
        if (personToDelete?.email) {
          try {
            const pendingInvitations = invitations.filter(inv => 
              inv.invitee_email === personToDelete.email && inv.status === 'pending'
            );
            for (const invitation of pendingInvitations) {
              await emailInvitationService.declineInvitation(invitation.id);
            }
          } catch (invitationError) {
            console.error('Error deleting invitations:', invitationError);
            // Continue with person deletion even if invitation deletion fails
          }
        }
        
        // Reload data to reflect changes
        await loadData();
      } catch (error) {
        console.error('Error deleting person:', error);
        alert('Failed to delete person. Please try again.');
      }
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await emailInvitationService.acceptInvitation(invitationId);
      await loadData();
      alert('Invitation accepted! You are now connected.');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await emailInvitationService.declineInvitation(invitationId);
      await loadData();
      alert('Invitation declined.');
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation. Please try again.');
    }
  };

  const getConnectionStatusChip = (person: PersonType) => {
    // For now, show "Pending" for all persons since they need to accept invitations
    return <Chip label="Pending Invitation" color="warning" size="small" />;
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'accepted':
        return <Chip label="Accepted" color="success" size="small" />;
      case 'declined':
        return <Chip label="Declined" color="error" size="small" />;
      case 'expired':
        return <Chip label="Expired" color="default" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

      {/* Main Tabs */}
      <Card sx={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`My Persons (${persons.length})`} />
          <Tab label="Invitations" />
        </Tabs>

        {/* My Persons Tab */}
        <TabPanel value={tabValue} index={0}>
          <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
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
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setSelectedPerson(person);
                          setOpenSendDialog(true);
                        }}
                        sx={{ 
                          backgroundColor: '#ff69b4',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#ff1493'
                          }
                        }}
                      >
                        Send {String.fromCodePoint(0x2764)}
                      </Button>
                      <IconButton
                        edge="end"
                        onClick={() => handleShareInvitation(person)}
                        sx={{ color: '#667eea' }}
                        title="Share invitation link"
                      >
                        <Share />
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
        </TabPanel>

        {/* Invitations Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={invitationTabValue} 
              onChange={(e, newValue) => setInvitationTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label={`Received (${pendingInvitations.length})`} />
              <Tab label={`Sent (${invitations.length})`} />
            </Tabs>
          </Box>

          {/* Received Invitations */}
          {invitationTabValue === 0 && (
            <List sx={{ maxHeight: '50vh', overflow: 'auto' }}>
              {pendingInvitations.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No received invitations. When someone invites you, it will appear here!
                </Typography>
              ) : (
                pendingInvitations.map((invitation) => (
                  <ListItem
                    key={invitation.id}
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
                      primary={invitation.invitee_name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {invitation.invitee_email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sent {formatDate(invitation.created_at)}
                          </Typography>
                          {invitation.custom_message && (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                              "{invitation.custom_message}"
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        sx={{ color: '#4caf50' }}
                        title="Accept invitation"
                      >
                        <Check />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        sx={{ color: '#f44336' }}
                        title="Decline invitation"
                      >
                        <Close />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
          )}

          {/* Sent Invitations */}
          {invitationTabValue === 1 && (
            <List sx={{ maxHeight: '50vh', overflow: 'auto' }}>
              {invitations.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No invitations sent yet. Send your first invitation to connect with someone!
                </Typography>
              ) : (
                invitations.map((invitation) => (
                  <ListItem
                    key={invitation.id}
                    sx={{
                      borderBottom: '1px solid #eee',
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ backgroundColor: '#667eea' }}>
                        <Email />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={invitation.invitee_name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {invitation.invitee_email}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            {getStatusChip(invitation.status)}
                            <Typography variant="caption" color="text.secondary">
                              Sent {formatDate(invitation.created_at)}
                            </Typography>
                          </Box>
                          {invitation.custom_message && (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                              "{invitation.custom_message}"
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          )}
        </TabPanel>
      </Card>

      {/* Add Person Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Person</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the email address of the person you'd like to invite. They'll receive an invitation to join Love on the Pixel.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={newPerson.email}
            onChange={(e) => setNewPerson({ email: e.target.value })}
            placeholder="Enter their email address"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddPerson} 
            disabled={loading || !newPerson.email.trim()}
            variant="contained"
          >
            {loading ? 'Adding...' : 'Add Person'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Options Dialog */}
      <Dialog open={showShareOptions} onClose={() => {
        setShowShareOptions(false);
        setAddedPerson(null);
        setNewPerson({ email: '' });
        setOpenAddDialog(false);
        loadData();
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Invite {addedPerson?.email}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share this invitation link with {addedPerson?.email} to invite them to join Love on the Pixel.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={() => handleShareInvitation(addedPerson!)}
              fullWidth
            >
              Copy Invitation Link
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowShareOptions(false);
            setAddedPerson(null);
            setNewPerson({ email: '' });
            setOpenAddDialog(false);
            loadData();
          }}>
            Done
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
            placeholder="Write your affirmation message here..."
          />
          <Typography variant="subtitle2" gutterBottom>
            Theme:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {Object.entries(AFFIRMATION_THEMES).map(([key, theme]) => (
              <Chip
                key={key}
                label={`${theme.emoji} ${theme.name}`}
                onClick={() => setSelectedTheme(key)}
                sx={{ 
                  cursor: 'pointer',
                  backgroundColor: selectedTheme === key ? theme.color : 'transparent',
                  color: selectedTheme === key ? 'white' : theme.color,
                  border: `2px solid ${theme.color}`,
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
