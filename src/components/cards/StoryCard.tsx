'use client';
import * as React from 'react';
import { Card, CardContent, Stack, Typography, Button } from '@mui/material';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';

type Props = {
  snippet: string;
  onBuy: () => void;
};

export default function StoryCard({ snippet, onBuy }: Props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.5} alignItems="center">
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            Our Story
          </Typography>
          <Typography align="center">{snippet}</Typography>
          <Button
            variant="contained"
            startIcon={<VolunteerActivismIcon />}
            onClick={onBuy}
            aria-label="Buy us a date from story card"
          >
            Buy Us a Date
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

