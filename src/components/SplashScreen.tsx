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

const enterFade = keyframes`
  from { opacity: 0 }
  to   { opacity: 1 }
`;

// Center flash: quick in/out
const flashPulse = keyframes`
  0%   { transform: scale(0.2); opacity: 0 }
  45%  { transform: scale(1.22); opacity: .9 }
  100% { transform: scale(1.35); opacity: 0 }
`;

// Heart pop
const heartPop = keyframes`
  0%   { transform: scale(.85); opacity: 0 }
  60%  { transform: scale(1.08); opacity: 1 }
  100% { transform: scale(1);    opacity: 1 }
`;

// Title rise
const titleRise = keyframes`
  from { transform: translateY(-8px); opacity: 0 }
  to   { transform: translateY(0);    opacity: 1 }
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
  // start at an edge, end near center spiral
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delayMs: number;
  hue: number; // for RGB-ish (r, g, b)
  size: number;
};

export default function SplashScreen({
  children,
  minDurationMs = 2300,
  dotCount = 56,
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

  // Compute center (fallback values; we’ll use CSS centering in layout)
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

    const spiralPoint = (i: number) => {
      const angle = i * 0.5;
      const radius = 18 + i * 1.6;
      return {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      };
    };

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    return Array.from({ length: dotCount }).map((_, i) => {
      const edge = Math.floor(Math.random() * 4);
      let startX = 0,
        startY = 0;
      if (edge === 0) {
        startX = rand(-40, w + 40);
        startY = -60;
      }
      if (edge === 1) {
        startX = w + 60;
        startY = rand(-40, h + 40);
      }
      if (edge === 2) {
        startX = rand(-40, w + 40);
        startY = h + 60;
      }
      if (edge === 3) {
        startX = -60;
        startY = rand(-40, h + 40);
      }
      const target = spiralPoint(i);
      // RGB cycling
      const hue = [0, 130, 210][i % 3]; // red-ish, green-ish, blue-ish
      const size = rand(6, 11);
      const delayMs = i * 35;

      return {
        id: i,
        startX,
        startY,
        endX: target.x + rand(-10, 10),
        endY: target.y + rand(-10, 10),
        delayMs,
        hue,
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
        animation: `${enterFade} 200ms ease-out`,
      }}
    >
      {/* DOTS */}
      {!reduced &&
        client &&
        dots.map((d) => (
          <Box
            key={d.id}
            aria-hidden
            sx={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: d.size,
              height: d.size,
              borderRadius: '999px',
              backgroundColor: `hsl(${d.hue} 85% 60%)`,
              opacity: 0.85,
              transform: `translate(${d.startX}px, ${d.startY}px)`,
              animation: `dot-move-${d.id} 900ms cubic-bezier(.2,.8,.2,1) ${d.delayMs}ms forwards`,
              // each dot gets its own keyframes injected via sx
              [`@keyframes dot-move-${d.id}`]: {
                from: {
                  transform: `translate(${d.startX}px, ${d.startY}px)`,
                  opacity: 0,
                } as any,
                to: {
                  transform: `translate(${d.endX}px, ${d.endY}px)`,
                  opacity: 1,
                } as any,
              },
            }}
          />
        ))}

      {/* CENTER FLASH */}
      {!reduced && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 999,
            backgroundColor: '#fff',
            opacity: 0,
            animation: `${flashPulse} 260ms ease-out ${Math.max(
              0,
              900 + (dotCount - 1) * 35 - 200
            )}ms both`,
          }}
        />
      )}

      {/* HEART */}
      <Box
        aria-label="Love on the Pixel heart logo"
        sx={{
          position: 'absolute',
          display: 'grid',
          placeItems: 'center',
          width: 200,
          height: 200,
          animation: reduced
            ? `${enterFade} 280ms ease-out 120ms both`
            : `${heartPop} 420ms ease-out ${900 + (dotCount - 1) * 35}ms both`,
        }}
      >
        <FavoriteIcon
          sx={{
            fontSize: 140,
            color: HEART_PINK,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.25))',
          }}
          aria-hidden
        />
      </Box>

      {/* CURVED TITLE (SVG textPath) */}
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
            ? `${enterFade} 280ms ease-out 160ms both`
            : `${titleRise} 380ms ease-out ${
                900 + (dotCount - 1) * 35 + 150
              }ms both`,
          px: 2,
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

      {/* Tagline for accessibility (visually subtle) */}
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
        }}
      >
        Messages of Love &amp; Affirmation
      </Typography>
    </Box>
  );
}

