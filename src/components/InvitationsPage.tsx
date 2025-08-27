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
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Person, 
  PersonAdd,
  Check,
  Close,
  Email,
  Refresh
} from '@mui/icons-material';
import { emailInvitationService, type Invitation } from '@/lib/emailInvitationService';
import { useAuth } from '@/contexts/AuthContext';

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
      id={`invitations-tabpanel-${index}`}
      aria-labelledby={`invitations-tab-${index}`}
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

export default function InvitationsPage() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newInvitation, setNewInvitation] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadInvitations();
  }, [user?.id]);

  const loadInvitations = async () => {
    try {
      const [allInvitations, pending] = await Promise.all([
        emailInvitationService.getInvitations(),
        emailInvitationService.getPendingInvitations()
      ]);
      
      setInvitations(allInvitations);
      setPendingInvitations(pending);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const handleAddInvitation = async () => {
    if (newInvitation.name.trim() && newInvitation.email.trim()) {
      try {
        setLoading(true);
        
        await emailInvitationService.createInvitation({
          invitee_name: newInvitation.name,
          invitee_email: newInvitation.email,
          custom_message: newInvitation.message || undefined
        });
        
        setNewInvitation({ name: '', email: '', message: '' });
        setOpenAddDialog(false);
        await loadInvitations();
        
        alert('Invitation sent successfully!');
      } catch (error) {
        console.error('Error creating invitation:', error);
        alert('Failed to send invitation. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await emailInvitationService.acceptInvitation(invitationId);
      await loadInvitations();
      alert('Invitation accepted! You are now connected.');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await emailInvitationService.declineInvitation(invitationId);
      await loadInvitations();
      alert('Invitation declined.');
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation. Please try again.');
    }
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
          Invitations
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
          Send Invitation
        </Button>
      </Box>

      {/* Tabs */}
      <Card sx={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Sent (${invitations.length})`} />
          <Tab label={`Pending (${pendingInvitations.length})`} />
        </Tabs>

        {/* Sent Invitations Tab */}
        <TabPanel value={tabValue} index={0}>
          <List>
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
        </TabPanel>

        {/* Pending Invitations Tab */}
        <TabPanel value={tabValue} index={1}>
          <List>
            {pendingInvitations.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No pending invitations. All your invitations have been responded to!
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
        </TabPanel>
      </Card>

      {/* Add Invitation Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Invitation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Person Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newInvitation.name}
            onChange={(e) => setNewInvitation({ ...newInvitation, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={newInvitation.email}
            onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Personal Message (Optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newInvitation.message}
            onChange={(e) => setNewInvitation({ ...newInvitation, message: e.target.value })}
            placeholder="Add a personal message to your invitation..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddInvitation} 
            disabled={loading || !newInvitation.name.trim() || !newInvitation.email.trim()}
            variant="contained"
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
