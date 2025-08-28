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
  Tab,
  Alert
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
import { newInvitationService, type Invitation } from '@/lib/newInvitationService';
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
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [invitationTabValue, setInvitationTabValue] = useState(0);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [addedPerson, setAddedPerson] = useState<{ email: string; shareUrl: string } | null>(null);
  const [newPerson, setNewPerson] = useState({ email: '' });
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonType | null>(null);
  const [message, setMessage] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('love');

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    try {
      const [personsData, allInvitations, pending] = await Promise.all([
        personsService.getAll(),
        newInvitationService.getSentInvitations(),
        newInvitationService.getPendingInvitations()
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
        
        const { invitation, shareUrl } = await newInvitationService.addPerson(newPerson.email);
        
        setAddedPerson({ email: newPerson.email, shareUrl });
        setShowShareOptions(true);
        
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
        
        await newInvitationService.sendAffirmation(
          selectedPerson.email, 
          message, 
          selectedTheme
        );
        
        alert('Affirmation sent! It will appear in their Wellspring when they join.');
        setMessage('');
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
      const shareUrl = `${window.location.origin}/sign-up?inviter=${user?.id}&invitee=${person.email}`;
      await newInvitationService.shareInvitation(shareUrl, person.email);
    } catch (error) {
      console.error('Error sharing invitation:', error);
    }
  };

  const handleDeletePerson = async (id: string) => {
    if (confirm('Are you sure you want to delete this person?')) {
      try {
        await personsService.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting person:', error);
        alert('Failed to delete person. Please try again.');
      }
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await newInvitationService.acceptInvitation(invitationId);
      await loadData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await newInvitationService.declineInvitation(invitationId);
      await loadData();
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation. Please try again.');
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending Invitation" size="small" color="warning" />;
      case 'accepted':
        return <Chip label="Connected" size="small" color="success" />;
      case 'declined':
        return <Chip label="Declined" size="small" color="error" />;
      default:
        return <Chip label="Unknown" size="small" />;
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 300 }}>
          Persons
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setOpenAddDialog(true)}
          sx={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)'
            }
          }}
        >
          Add Person
        </Button>
      </Box>

      {/* Main Content */}
      <Card
        sx={{
          flex: 1,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              color: '#95a5a6',
              '&.Mui-selected': {
                color: '#667eea'
              }
            }
          }}
        >
          <Tab label="My Persons" />
          <Tab label="Invitations" />
        </Tabs>

        {/* My Persons Tab */}
        <TabPanel value={tabValue} index={0}>
          <List sx={{ maxHeight: '50vh', overflow: 'auto' }}>
            {persons.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No persons added yet. Add your first person to start connecting!
              </Typography>
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
                          {getStatusChip('pending')}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        onClick={() => {
                          setSelectedPerson(person);
                          setOpenSendDialog(true);
                        }}
                        sx={{ 
                          color: 'white',
                          backgroundColor: '#ff69b4',
                          '&:hover': {
                            backgroundColor: '#ff1493'
                          }
                        }}
                        variant="contained"
                        size="small"
                      >
                        Send
                      </Button>
                      <IconButton
                        onClick={() => handleShareInvitation(person)}
                        sx={{ color: '#667eea' }}
                        title="Share invitation"
                      >
                        <Share />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeletePerson(person.id)}
                        sx={{ color: '#e74c3c' }}
                        title="Delete person"
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
              sx={{
                '& .MuiTab-root': {
                  color: '#95a5a6',
                  '&.Mui-selected': {
                    color: '#667eea'
                  }
                }
              }}
            >
              <Tab label="Received" />
              <Tab label="Sent" />
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
                      primary={invitation.inviter_name || invitation.inviter_email}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {invitation.inviter_email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sent {formatDate(invitation.created_at)}
                          </Typography>
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
                      primary={invitation.invitee_email}
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
              onClick={() => addedPerson && newInvitationService.shareInvitation(addedPerson.shareUrl, addedPerson.email)}
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
                  backgroundColor: selectedTheme === key ? theme.color : 'transparent',
                  color: selectedTheme === key ? 'white' : 'inherit',
                  border: `1px solid ${theme.color}`,
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
            sx={{
              backgroundColor: '#ff69b4',
              '&:hover': {
                backgroundColor: '#ff1493'
              }
            }}
          >
            {loading ? 'Sending...' : 'Send Affirmation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}