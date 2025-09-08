'use client';
import * as React from 'react';
import { Card, CardContent, Stack, Typography, Button, Avatar } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

type Props = {
  title?: string;           // e.g., "Coffee Date"
  recap: string;            // short snippet of what you did
  supporterName?: string;   // optional
  onBuy: () => void;
};

export default function DateCard({ title = 'Date Recap', recap, supporterName, onBuy }: Props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.5} alignItems="center">
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            {title}
          </Typography>
          {!!supporterName && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 28, height: 28 }}>{supporterName[0]}</Avatar>
              <Typography variant="caption">Thanks, {supporterName}!</Typography>
            </Stack>
          )}
          <Typography align="center">{recap}</Typography>
          <Button
            variant="contained"
            startIcon={<FavoriteIcon />}
            onClick={onBuy}
            aria-label="Buy us a date from recap card"
            sx={{ 
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            Buy Us a Date
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

