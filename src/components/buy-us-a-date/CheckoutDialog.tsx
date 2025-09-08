'use client';
import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { STRIPE_PRODUCTS, getPriceId, type StripeProduct } from '@/lib/stripeProducts';

type Props = { open: boolean; onClose: () => void; };

export default function CheckoutDialog({ open, onClose }: Props) {
  const [selectedProduct, setSelectedProduct] = React.useState<StripeProduct>(STRIPE_PRODUCTS[0]);
  const [mode, setMode] = React.useState<'one'|'monthly'>('one');
  const [loading, setLoading] = React.useState(false);

  const handleCheckout = async () => {
    const priceId = getPriceId(selectedProduct.id, mode === 'monthly');
    
    if (!priceId) {
      alert('This product is not available for the selected payment type.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId,
          productName: selectedProduct.name,
          productEmoji: selectedProduct.emoji
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('Unable to process payment. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Payment service is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on payment mode
  const availableProducts = STRIPE_PRODUCTS.filter(product => {
    if (mode === 'monthly') {
      return product.recurringPriceId; // Only show products with recurring options
    }
    return true; // All products available for one-time
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="checkout-title">
      <DialogTitle id="checkout-title">Choose Your Support</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Payment Mode Selection */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              How would you like to support us?
            </Typography>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, v) => {
                if (v) {
                  setMode(v);
                  // Reset to first available product when switching modes
                  const available = STRIPE_PRODUCTS.filter(product => 
                    v === 'monthly' ? product.recurringPriceId : true
                  );
                  if (available.length > 0) {
                    setSelectedProduct(available[0]);
                  }
                }
              }}
              aria-label="payment mode"
              sx={{ alignSelf: 'center' }}
            >
              <ToggleButton value="one" aria-label="one-time">
                One-time
              </ToggleButton>
              <ToggleButton value="monthly" aria-label="monthly">
                Monthly
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Product Selection Grid */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
              What would you like to fund?
            </Typography>
            <Grid container spacing={2}>
              {availableProducts.map((product) => (
                <Grid item xs={6} sm={4} key={product.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedProduct.id === product.id ? 2 : 1,
                      borderColor: selectedProduct.id === product.id ? 'primary.main' : 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {product.emoji}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {product.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {product.description}
                      </Typography>
                      {selectedProduct.id === product.id && (
                        <Chip 
                          label="Selected" 
                          size="small" 
                          color="primary" 
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Selected Product Summary */}
          <Box sx={{ 
            backgroundColor: 'action.hover', 
            borderRadius: 2, 
            p: 2, 
            textAlign: 'center' 
          }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              You're supporting:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedProduct.emoji} {selectedProduct.name} ({mode === 'one' ? 'One-time' : 'Monthly'})
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              100% of your support funds a real {selectedProduct.name.toLowerCase()} experience that brings us closer. Thank you!
            </Typography>
          </Box>

          {/* Checkout Button */}
          <Button 
            variant="contained" 
            onClick={handleCheckout} 
            disabled={loading}
            size="large"
            fullWidth
            aria-label="Go to secure Stripe checkout"
            sx={{
              backgroundColor: '#e91e63',
              '&:hover': {
                backgroundColor: '#c2185b',
              }
            }}
          >
            {loading ? 'Processing...' : `Continue to Secure Checkout`}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

