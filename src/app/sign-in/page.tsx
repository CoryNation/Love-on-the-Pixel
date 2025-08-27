'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link
} from '@mui/material';
import { Favorite } from '@mui/icons-material';
import { authService } from '@/lib/auth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.signIn(email, password);
      router.push('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4
        }}
      >
        <CardContent sx={{ padding: 4 }}>
          {/* App Title and Icon */}
          <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
            <Favorite 
              sx={{ 
                fontSize: 48, 
                color: '#667eea', 
                marginBottom: 1,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }} 
            />
            <Typography 
              variant="h3" 
              sx={{ 
                marginBottom: 1, 
                color: '#2c3e50',
                fontWeight: 300,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Love on the Pixel
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#7f8c8d',
                fontStyle: 'italic',
                marginBottom: 2
              }}
            >
              Spread love, one pixel at a time 💕
            </Typography>
          </Box>

          <Typography variant="h5" sx={{ marginBottom: 3, textAlign: 'center', color: '#2c3e50' }}>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ marginBottom: 2 }}
              required
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ marginBottom: 3 }}
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                borderRadius: 2,
                height: 56
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', marginTop: 2 }}>
            <Link href="/sign-up" sx={{ color: '#667eea' }}>
              Don&apos;t have an account? Sign up
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
