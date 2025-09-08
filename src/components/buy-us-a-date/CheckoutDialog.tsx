'use client';
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, Stack, Button, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';

type Props = { open: boolean; onClose: () => void; };

// Price identifiers: set in .env
const ONE_TIME_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_ONE_TIME_PRICE_ID!;
const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!;

export default function CheckoutDialog({ open, onClose }: Props) {
  const [mode, setMode] = React.useState<'one'|'monthly'>('one');
  const priceId = mode === 'one' ? ONE_TIME_PRICE_ID : MONTHLY_PRICE_ID;

  const handleCheckout = async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });
    const data = await res.json();
    if (data?.url) window.location.href = data.url;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="checkout-title">
      <DialogTitle id="checkout-title">Support Options</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => v && setMode(v)}
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

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            100% of your support funds a real date or experience that brings us closer. Thank you!
          </Typography>

          <Button variant="contained" onClick={handleCheckout} aria-label="Go to secure Stripe checkout">
            Continue to Secure Checkout
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

