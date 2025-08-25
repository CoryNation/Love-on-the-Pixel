'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state while auth is loading
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
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
          Loading...
        </Typography>
      </Box>
    );
  }

  // Show loading state while component is mounting (prevents hydration mismatch)
  if (!mounted) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
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
          Loading...
        </Typography>
      </Box>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!user) {
    window.location.href = '/sign-in';
    return null;
  }

  return <>{children}</>;
}
