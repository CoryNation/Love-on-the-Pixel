'use client';
import * as React from 'react';
import {
  Box, Button, Dialog, DialogContent, DialogTitle, Tab, Tabs, Typography
} from '@mui/material';
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
          Buy Us a Date
        </DialogTitle>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="Buy us a date tabs"
          sx={{ px: 2 }}
        >
          <Tab label="Story" id="tab-story" aria-controls="panel-story" />
          <Tab label="Appreciation" id="tab-appreciation" aria-controls="panel-appreciation" />
        </Tabs>

        <DialogContent dividers sx={{ position: 'relative', pb: 10 }}>
          {/* Story */}
          {tab === 0 && (
            <Box id="panel-story" role="tabpanel" aria-labelledby="tab-story">
              <Typography sx={{ mb: 2 }}>
                Love on the Pixel began as a simple way for us to share small moments of love. When you "Buy Us a Date," you help turn those pixels into real memories — coffee, dinner, little adventures. Thank you for being part of our story.
              </Typography>
            </Box>
          )}

          {/* Appreciation (replace with your dynamic list later) */}
          {tab === 1 && (
            <Box id="panel-appreciation" role="tabpanel" aria-labelledby="tab-appreciation">
              <Typography sx={{ mb: 1, fontWeight: 600 }}>What your support made possible</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                • Cozy coffee date — time to laugh and breathe together. <br/>
                • A simple dinner where we dreamed about the next decade. <br/>
                • A sunset walk that turned into a tradition.
              </Typography>
            </Box>
          )}

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

