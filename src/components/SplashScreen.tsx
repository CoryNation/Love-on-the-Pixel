'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { keyframes } from '@mui/system';
import { useAuth } from '@/contexts/AuthContext';

// If you export your initializer, import it:
import { notificationService } from '@/lib/notificationService';

type SplashScreenProps = {
  children: React.ReactNode;
  /** Minimum time (ms) to keep splash visible so animation completes */
  minDurationMs?: number;
  /** Total pixel dots to animate */
  dotCount?: number;
};

const GRADIENT_TOP = '#667eea';
const GRADIENT_BOTTOM = '#764ba2';
const HEART_PINK = '#ff6b9d';

// Background fade in
const backgroundFade = keyframes`
  from { opacity: 0 }
  to   { opacity: 1 }
`;

// Wind gust effect - dots flowing in from edges
const windGust = keyframes`
  0%   { transform: translate(var(--start-x), var(--start-y)) scale(0); opacity: 0 }
  20%  { transform: translate(var(--mid-x), var(--mid-y)) scale(1); opacity: 0.8 }
  100% { transform: translate(var(--end-x), var(--end-y)) scale(1); opacity: 1 }
`;

// Swirling motion toward center
const swirlToCenter = keyframes`
  0%   { transform: translate(var(--end-x), var(--end-y)) scale(1); opacity: 1 }
  100% { transform: translate(50vw, 50vh) scale(0.3); opacity: 0.3 }
`;

// Center glow/spark effect
const centerGlow = keyframes`
  0%   { transform: scale(0); opacity: 0 }
  50%  { transform: scale(1.5); opacity: 0.8 }
  100% { transform: scale(1); opacity: 1 }
`;

// Heart and title appear together
const heartTitleAppear = keyframes`
  0%   { transform: scale(0.8); opacity: 0 }
  100% { transform: scale(1); opacity: 1 }
`;

/** Utility to detect reduced motion */
const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(m.matches);
    onChange();
    m.addEventListener?.('change', onChange);
    return () => m.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
};

type Dot = {
  id: number;
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  delayMs: number;
  color: string;
  size: number;
};

export default function SplashScreen({
  children,
  minDurationMs = 4000, // 4 seconds total (2.5s animation + 1.5s hold)
  dotCount = 120, // More dots to fill the screen
}: SplashScreenProps) {
  // Safely get auth state, handling SSR case
  let authInitializing = false;
  try {
    const authContext = useAuth();
    authInitializing = authContext?.loading || false;
  } catch (error) {
    // AuthContext not available during SSR, that's fine
    authInitializing = false;
  }
  
  const prefersReducedMotion = usePrefersReducedMotion();

  const [client, setClient] = useState(false);
  const [ready, setReady] = useState(false);

  // Mark client to avoid SSR layout thrash for randoms
  useEffect(() => setClient(true), []);

  // Init notifications on first mount (non-blocking)
  useEffect(() => {
    // Safe-guard: ignore errors; splash should not hang
    notificationService?.initialize?.().catch(() => {});
  }, []);

  // Compute viewport dimensions
  const [viewport, setViewport] = useState({ w: 1080, h: 1920 });
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Precompute dots (client only to keep SSR stable)
  const dots: Dot[] = useMemo(() => {
    if (!client) return [];
    const { w, h } = viewport;
    const center = { x: w / 2, y: h / 2 };

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    
    // Colors similar to favicon - vibrant and varied
    const colors = [
      '#ff6b9d', // Pink
      '#667eea', // Blue
      '#764ba2', // Purple
      '#f093fb', // Light pink
      '#4facfe', // Light blue
      '#43e97b', // Green
      '#fa709a', // Coral
      '#a8edea', // Mint
      '#ffecd2', // Peach
      '#fcb69f', // Orange
    ];

    return Array.from({ length: dotCount }).map((_, i) => {
      // Start from edges (wind gust effect)
      const edge = Math.floor(Math.random() * 4);
      let startX = 0, startY = 0;
      
      if (edge === 0) { // Top
        startX = rand(-100, w + 100);
        startY = -100;
      } else if (edge === 1) { // Right
        startX = w + 100;
        startY = rand(-100, h + 100);
      } else if (edge === 2) { // Bottom
        startX = rand(-100, w + 100);
        startY = h + 100;
      } else { // Left
        startX = -100;
        startY = rand(-100, h + 100);
      }

      // Mid point for wind gust effect
      const midX = startX + (center.x - startX) * 0.3 + rand(-50, 50);
      const midY = startY + (center.y - startY) * 0.3 + rand(-50, 50);

      // End point - scattered across screen
      const endX = rand(50, w - 50);
      const endY = rand(50, h - 50);

      const color = colors[i % colors.length];
      const size = rand(4, 12);
      const delayMs = i * 20; // Staggered appearance

      return {
        id: i,
        startX,
        startY,
        midX,
        midY,
        endX,
        endY,
        delayMs,
        color,
        size,
      };
    });
  }, [client, viewport, dotCount]);

  // Gate exit when both: min duration has elapsed AND auth finished initializing
  useEffect(() => {
    let cancelled = false;

    const waitMin = new Promise<void>((res) => setTimeout(res, minDurationMs));
    const waitAuth = new Promise<void>((res) => {
      if (!authInitializing) return res();
      const i = setInterval(() => {
        if (!authInitializing) {
          clearInterval(i);
          res();
        }
      }, 50);
    });

    Promise.all([waitMin, waitAuth]).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [authInitializing, minDurationMs]);

  if (ready) return <>{children}</>;

  // Reduced motion: just fade logo/title in and out quickly
  const reduced = prefersReducedMotion;

  return (
    <Box
      role="img"
      aria-label="Loading Love on the Pixel"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(180deg, ${GRADIENT_TOP} 0%, ${GRADIENT_BOTTOM} 100%)`,
        color: '#fff',
        animation: `${backgroundFade} 500ms ease-out`,
        overflow: 'hidden',
      }}
    >
      {/* PIXEL DOTS - Wind Gust Effect */}
      {!reduced && client && dots.map((d) => (
        <Box
          key={d.id}
          aria-hidden
          sx={{
            position: 'absolute',
            width: d.size,
            height: d.size,
            borderRadius: '2px', // Square pixels like favicon
            backgroundColor: d.color,
            opacity: 0,
            transform: `translate(${d.startX}px, ${d.startY}px)`,
            animation: `wind-gust-${d.id} 2500ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d.delayMs}ms forwards`,
            // Each dot gets its own keyframes
            [`@keyframes wind-gust-${d.id}`]: {
              '0%': {
                transform: `translate(${d.startX}px, ${d.startY}px) scale(0)`,
                opacity: 0,
              } as any,
              '20%': {
                transform: `translate(${d.midX}px, ${d.midY}px) scale(1)`,
                opacity: 0.8,
              } as any,
              '80%': {
                transform: `translate(${d.endX}px, ${d.endY}px) scale(1)`,
                opacity: 1,
              } as any,
              '100%': {
                transform: `translate(${d.endX}px, ${d.endY}px) scale(1)`,
                opacity: 1,
              } as any,
            },
          }}
        />
      ))}

      {/* CENTER GLOW/SPARK */}
      {!reduced && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,107,157,0.6) 50%, transparent 100%)',
            opacity: 0,
            animation: `${centerGlow} 600ms ease-out 2000ms both`,
            zIndex: 10,
          }}
        />
      )}

      {/* HEART ICON */}
      <Box
        aria-label="Love on the Pixel heart logo"
        sx={{
          position: 'absolute',
          display: 'grid',
          placeItems: 'center',
          width: 200,
          height: 200,
          animation: reduced
            ? `${heartTitleAppear} 500ms ease-out 500ms both`
            : `${heartTitleAppear} 600ms ease-out 2200ms both`,
          zIndex: 20,
        }}
      >
        <FavoriteIcon
          sx={{
            fontSize: 140,
            color: HEART_PINK,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
          }}
          aria-hidden
        />
      </Box>

      {/* CURVED TITLE */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: { xs: '18%', sm: '15%' },
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          animation: reduced
            ? `${heartTitleAppear} 500ms ease-out 700ms both`
            : `${heartTitleAppear} 600ms ease-out 2400ms both`,
          px: 2,
          zIndex: 20,
        }}
      >
        <Box
          component="svg"
          width={{ xs: 320, sm: 420 }}
          height={{ xs: 120, sm: 140 }}
          viewBox="0 0 420 140"
          role="img"
          aria-label="Love on the Pixel"
          sx={{ overflow: 'visible' }}
        >
          {/* Arc path to follow */}
          <path
            id="title-arc"
            d="M20,110 C140,20 280,20 400,110"
            fill="none"
            stroke="transparent"
          />
          <text
            fontFamily="Poppins, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
            fontSize="32"
            fontWeight={700}
            fill="#ffffff"
            textAnchor="middle"
          >
            <textPath href="#title-arc" startOffset="50%">
              Love on the Pixel
            </textPath>
          </text>
        </Box>
      </Box>

      {/* Tagline */}
      <Typography
        role="status"
        aria-live="polite"
        sx={{
          position: 'absolute',
          bottom: { xs: 24, sm: 32 },
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'rgba(255,255,255,.9)',
          fontSize: { xs: 12, sm: 14 },
          letterSpacing: 0.5,
          opacity: 0.85,
          animation: reduced
            ? `${heartTitleAppear} 500ms ease-out 900ms both`
            : `${heartTitleAppear} 600ms ease-out 2600ms both`,
          zIndex: 20,
        }}
      >
        Messages of Love &amp; Affirmation
      </Typography>
    </Box>
  );
}