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
// Removed swirlToCenter animation that was causing flash

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
  dotCount = 1000, // 1000 dots for complete screen coverage
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
  const [isVisible, setIsVisible] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showClickPrompt, setShowClickPrompt] = useState(false);

  // Mark client to avoid SSR layout thrash for randoms
  useEffect(() => setClient(true), []);

  // Init notifications on first mount (non-blocking)
  useEffect(() => {
    // Safe-guard: ignore errors; splash should not hang
    notificationService?.initialize?.().catch(() => {});
  }, []);

  // Handle animation completion and click-to-continue
  useEffect(() => {
    if (!client) return;
    
    // Set animation complete after dots finish animating (based on last dot's delay + animation duration)
    const lastDotDelay = (dotCount - 1) * 3; // Last dot's delay in ms
    const animationDuration = 2500; // Animation duration in ms
    const totalTime = lastDotDelay + animationDuration;
    
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      setShowClickPrompt(true);
    }, totalTime);

    return () => clearTimeout(timer);
  }, [client, dotCount]);

  const handleClickToContinue = () => {
    // Add a small delay to allow smooth transition
    setTimeout(() => {
      setIsVisible(false);
    }, 50);
  };

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

    // Simple grid calculation for even distribution across entire screen
    const gridCols = Math.ceil(Math.sqrt(dotCount));
    const gridRows = Math.ceil(dotCount / gridCols);
    
    const cellWidth = w / gridCols;
    const cellHeight = h / gridRows;

    return Array.from({ length: dotCount }).map((_, i) => {
      // Calculate grid position for final resting place
      const gridCol = i % gridCols;
      const gridRow = Math.floor(i / gridCols);
      
      // Position dots evenly across the entire screen with small random offset
      const baseX = gridCol * cellWidth + cellWidth / 2;
      const baseY = gridRow * cellHeight + cellHeight / 2;
      const endX = baseX + rand(-cellWidth * 0.2, cellWidth * 0.2);
      const endY = baseY + rand(-cellHeight * 0.2, cellHeight * 0.2);

      // Start from all edges and corners for better coverage
      const edge = Math.floor(Math.random() * 8); // 8 starting positions
      let startX = 0, startY = 0;
      
      if (edge === 0) { // Top
        startX = rand(-300, w + 300);
        startY = rand(-300, -100);
      } else if (edge === 1) { // Top Right
        startX = rand(w + 100, w + 300);
        startY = rand(-300, -100);
      } else if (edge === 2) { // Right
        startX = rand(w + 100, w + 300);
        startY = rand(-300, h + 300);
      } else if (edge === 3) { // Bottom Right
        startX = rand(w + 100, w + 300);
        startY = rand(h + 100, h + 300);
      } else if (edge === 4) { // Bottom
        startX = rand(-300, w + 300);
        startY = rand(h + 100, h + 300);
      } else if (edge === 5) { // Bottom Left
        startX = rand(-300, -100);
        startY = rand(h + 100, h + 300);
      } else if (edge === 6) { // Left
        startX = rand(-300, -100);
        startY = rand(-300, h + 300);
      } else { // Top Left
        startX = rand(-300, -100);
        startY = rand(-300, -100);
      }

      // Mid point for wind gust effect - more dramatic curve
      const midX = startX + (endX - startX) * 0.3 + rand(-150, 150);
      const midY = startY + (endY - startY) * 0.3 + rand(-150, 150);

      const color = colors[i % colors.length];
      const size = rand(2, 6); // Smaller dots for better coverage
      const delayMs = i * 3; // Faster staggered appearance for 1000 dots

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

  // Wait for auth to be ready (but don't automatically show children - user controls when to continue)
  useEffect(() => {
    let cancelled = false;

    const waitAuth = new Promise<void>((res) => {
      if (!authInitializing) return res();
      const i = setInterval(() => {
        if (!authInitializing) {
          clearInterval(i);
          res();
        }
      }, 50);
    });

    waitAuth.then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [authInitializing]);

  // Only show children when user clicks to continue (isVisible becomes false)
  if (!isVisible) return <>{children}</>;

  // Reduced motion: just fade logo/title in and out quickly
  const reduced = prefersReducedMotion;

  return (
    <Box
      role="img"
      aria-label="Loading Love on the Pixel"
      onClick={showClickPrompt ? handleClickToContinue : undefined}
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
        cursor: showClickPrompt ? 'pointer' : 'default',
        transition: 'opacity 300ms ease-out',
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
            borderRadius: '50%', // Actual dots (circles)
            backgroundColor: d.color,
            opacity: 0,
            transform: `translate(${d.startX}px, ${d.startY}px)`,
            animation: `wind-gust-${d.id} 2500ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d.delayMs}ms forwards`,
            // Each dot gets its own keyframes - extended to hold final state
            [`@keyframes wind-gust-${d.id}`]: {
              '0%': {
                transform: `translate(${d.startX}px, ${d.startY}px) scale(0)`,
                opacity: 0,
              } as any,
              '15%': {
                transform: `translate(${d.midX}px, ${d.midY}px) scale(1)`,
                opacity: 0.8,
              } as any,
              '60%': {
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

      {/* HEART ICON - 40% larger */}
      <Box
        aria-label="Love on the Pixel heart logo"
        sx={{
          position: 'absolute',
          display: 'grid',
          placeItems: 'center',
          width: 280, // 40% larger (200 * 1.4)
          height: 280, // 40% larger (200 * 1.4)
          animation: reduced
            ? `${heartTitleAppear} 500ms ease-out 500ms both`
            : `${heartTitleAppear} 600ms ease-out 2200ms both`,
          zIndex: 20,
        }}
      >
        <FavoriteIcon
          sx={{
            fontSize: 196, // 40% larger (140 * 1.4)
            color: HEART_PINK,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3)) drop-shadow(0 0 20px rgba(255, 105, 180, 0.6)) drop-shadow(0 0 40px rgba(255, 105, 180, 0.4))',
            animation: 'heart-glow 2s ease-in-out infinite alternate',
            '@keyframes heart-glow': {
              '0%': {
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3)) drop-shadow(0 0 20px rgba(255, 105, 180, 0.6)) drop-shadow(0 0 40px rgba(255, 105, 180, 0.4))',
              },
              '100%': {
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3)) drop-shadow(0 0 30px rgba(255, 105, 180, 0.8)) drop-shadow(0 0 60px rgba(255, 105, 180, 0.6))',
              },
            },
          }}
          aria-hidden
        />
      </Box>

      {/* CURVED TITLE - 40% larger and closer to heart */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: { xs: '25%', sm: '22%' }, // Moved closer to heart
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
          width={{ xs: 448, sm: 588 }} // 40% larger (320*1.4, 420*1.4)
          height={{ xs: 168, sm: 196 }} // 40% larger (120*1.4, 140*1.4)
          viewBox="0 0 420 140"
          role="img"
          aria-label="Love on the Pixel"
          sx={{ overflow: 'visible' }}
        >
          {/* Arc path to follow - adjusted for closer positioning */}
          <path
            id="title-arc"
            d="M20,110 C140,30 280,30 400,110"
            fill="none"
            stroke="transparent"
          />
          <text
            fontFamily="Poppins, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
            fontSize="45" // 40% larger (32 * 1.4)
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
          bottom: { xs: 80, sm: 100 }, // Moved up to make room for click prompt
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

      {/* Click to Continue Prompt */}
      {showClickPrompt && (
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: 24, sm: 32 },
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 30,
            animation: 'click-prompt-fade 1s ease-out both',
            '@keyframes click-prompt-fade': {
              '0%': {
                opacity: 0,
                transform: 'translateY(20px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: { xs: 14, sm: 16 },
              fontWeight: 500,
              letterSpacing: 0.5,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            Click to Continue
          </Typography>
        </Box>
      )}
    </Box>
  );
}