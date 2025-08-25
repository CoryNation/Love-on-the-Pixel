import { Box, Typography, Container, Paper } from '@mui/material';

export default function Privacy() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#667eea', fontWeight: 'bold' }}>
          Privacy Policy for Love on the Pixel
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#667eea', mt: 3 }}>
            Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            Love on the Pixel collects the following information to provide our service:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1" paragraph>
              <strong>Account Information:</strong> Email address for account creation and authentication
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Profile Information:</strong> Your name and profile photo (optional)
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Content:</strong> Affirmation messages you create and send to others
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Connections:</strong> Information about your connections with other users
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#667eea' }}>
            How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use your information exclusively to:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1" paragraph>
              Provide the core functionality of sending and receiving affirmations
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Manage your account and user connections
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Improve our service and user experience
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Ensure the security and integrity of our platform
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#667eea' }}>
            Data Storage and Security
          </Typography>
          <Typography variant="body1" paragraph>
            Your data is stored securely using Supabase, a trusted cloud database service that implements industry-standard security measures including:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1" paragraph>
              Encryption at rest and in transit
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Regular security audits and updates
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Compliance with data protection regulations
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#667eea' }}>
            Data Sharing
          </Typography>
          <Typography variant="body1" paragraph>
            We do not sell, trade, or otherwise transfer your personal information to third parties. Your affirmations are only shared with the specific users you choose to send them to.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#667eea' }}>
            Your Rights
          </Typography>
          <Typography variant="body1" paragraph>
            You have the right to:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1" paragraph>
              Access, update, or delete your account information
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Delete your account and all associated data
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Request a copy of your personal data
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Opt out of certain data collection (where applicable)
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#667eea' }}>
            Children's Privacy
          </Typography>
          <Typography variant="body1" paragraph>
            Love on the Pixel is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#667eea' }}>
            Changes to This Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#667eea' }}>
            Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about this privacy policy or our data practices, please contact us at:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Email: Info@BuildTBD.com
          </Typography>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            This privacy policy is effective as of {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
