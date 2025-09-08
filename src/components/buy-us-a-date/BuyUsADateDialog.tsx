'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CheckoutDialog from './CheckoutDialog';

type Props = { open: boolean; onClose: () => void; };

export default function BuyUsADateDialog({ open, onClose }: Props) {
  const [tab, setTab] = React.useState(0);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  const handleBuy = () => setCheckoutOpen(true);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="buy-us-a-date-title">
        <DialogTitle id="buy-us-a-date-title" sx={{ pb: 0 }}>
          Show Your Appreciation
        </DialogTitle>

        <DialogContent dividers sx={{ position: 'relative', pb: 10 }}>
          <Typography sx={{ mb: 2 }}>
            Choose how you'd like to support our love story and help fund real moments that bring us closer together.
          </Typography>

          {/* Sticky CTA */}
          <Box
            sx={{
              position: 'sticky',
              bottom: -16, // sit over dialog padding
              display: 'flex',
              justifyContent: 'center',
              mt: 3,
              pt: 2,
              pb: 1,
              background: 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0))',
            }}
          >
            <Button
              variant="contained"
              startIcon={<FavoriteIcon />}
              onClick={handleBuy}
              aria-label="Proceed to payment to buy us a date"
              sx={{
                backgroundColor: '#e91e63',
                '&:hover': {
                  backgroundColor: '#c2185b',
                }
              }}
            >
              Buy Us a Date
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}

