'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

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

  if (!user) {
    return null; // Will redirect to sign-in
  }

  return <>{children}</>;
}
