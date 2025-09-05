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
  dotCount = 1200, // 1200 dots for complete screen coverage including bottom row
}: SplashScreenProps) {
  // Safely get auth state, handling SSR case
  let authInitializing = false;
  let isAuthenticated = false;
  try {
    const authContext = useAuth();
    authInitializing = authContext?.loading || false;
    isAuthenticated = authContext?.user !== null;
  } catch (error) {
    // AuthContext not available during SSR, that's fine
    authInitializing = false;
    isAuthenticated = false;
  }
  
  const prefersReducedMotion = usePrefersReducedMotion();

  const [client, setClient] = useState(false);
  const [ready, setReady] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showClickPrompt, setShowClickPrompt] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    // Start heart transition immediately
    setIsTransitioning(true);
    // Navigate after heart grows and fades away
    setTimeout(() => {
      setIsVisible(false);
      // The children (AuthProvider) will handle routing to login or dashboard
      // based on authentication state
    }, 1000); // 1 second for heart grow-fill animation
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
    
    // RGB pixel colors harmonized with app theme
    const colors = [
      // Red variations (harmonized with heart pink)
      '#ff6b9d', // Primary pink-red
      '#ff4757', // Bright red
      '#ff3838', // Pure red
      '#ff6348', // Orange-red
      '#ff7675', // Soft red
      
      // Green variations (complementary to purple theme)
      '#00b894', // Teal green
      '#00cec9', // Cyan green
      '#55a3ff', // Blue-green
      '#74b9ff', // Light blue-green
      '#a29bfe', // Purple-green
      
      // Blue variations (matching gradient theme)
      '#6c5ce7', // Primary blue (matches gradient)
      '#5f27cd', // Deep blue
      '#3742fa', // Royal blue
      '#2f3542', // Dark blue
      '#5352ed', // Electric blue
    ];

    // Grid calculation to ensure complete screen coverage
    const gridCols = Math.ceil(Math.sqrt(dotCount));
    const gridRows = Math.ceil(dotCount / gridCols);
    
    // Ensure we have enough rows to fill the entire height
    const actualRows = Math.max(gridRows, Math.ceil(h / (w / gridCols)));
    
    // Calculate spacing to fill the entire screen from edge to edge
    const spacingX = w / gridCols;
    const spacingY = h / actualRows;

    // Create a shuffled array of positions for semi-random distribution
    const positions = Array.from({ length: dotCount }, (_, i) => {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      return {
        x: (col * spacingX) + (spacingX / 2),
        y: (row * spacingY) + (spacingY / 2),
      };
    });
    
    // Add extra dots to fill bottom row if needed
    const extraDotsNeeded = Math.max(0, (actualRows * gridCols) - dotCount);
    for (let i = 0; i < extraDotsNeeded; i++) {
      const col = (dotCount + i) % gridCols;
      const row = Math.floor((dotCount + i) / gridCols);
      positions.push({
        x: (col * spacingX) + (spacingX / 2),
        y: (row * spacingY) + (spacingY / 2),
      });
    }
    
    // Shuffle positions for semi-random distribution
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    return Array.from({ length: positions.length }).map((_, i) => {
      // Use shuffled positions for semi-random landing spots
      const endX = positions[i].x;
      const endY = positions[i].y;

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

      // More randomized colors and sizes
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = rand(4, 7); // Size range 4-7px (no tiny dots)
      const delayMs = i * 1.5; // Fast appearance, ~2.5 seconds total

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

  // Always render children behind splash screen for Lighthouse FCP
  // Splash screen will overlay on top until user clicks to continue

  // Reduced motion: just fade logo/title in and out quickly
  const reduced = prefersReducedMotion;

  return (
    <>
      {/* Always render children for Lighthouse FCP */}
      {children}
      
      {/* Splash screen overlay - only render when visible */}
      {isVisible && (
      <Box
        role="img"
        aria-label="Loading Love on the Pixel"
        onClick={handleClickToContinue}
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: `linear-gradient(180deg, ${GRADIENT_TOP} 0%, ${GRADIENT_BOTTOM} 100%)`,
          color: '#fff',
          animation: isTransitioning 
            ? 'splash-fade-out 1000ms ease-out forwards'
            : `${backgroundFade} 500ms ease-out`,
          overflow: 'hidden',
          cursor: 'pointer',
          // Fade out splash screen while keeping heart visible
          '@keyframes splash-fade-out': {
            '0%': { opacity: 1 },
            '30%': { opacity: 0.7 },
            '100%': { opacity: 0 },
          },
        }}
      >
      {/* LIGHT REFLECTION OVERLAY - Pixel colors shining on background */}
      {!reduced && client && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            background: 'transparent',
            backgroundImage: dots.map((d) => 
              `radial-gradient(circle at ${d.endX}px ${d.endY}px, ${d.color}20 0px, ${d.color}10 20px, transparent 40px)`
            ).join(', '),
            opacity: 0,
            animation: 'light-reflection-fade 3000ms ease-out 2000ms forwards',
            '@keyframes light-reflection-fade': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 },
            },
          }}
        />
      )}

      {/* DOT MATRIX - Independent container for full screen coverage */}
      {!reduced && client && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
          }}
        >
          {dots.map((d) => (
            <Box
              key={d.id}
              aria-hidden
              sx={{
                position: 'absolute',
                width: d.size,
                height: d.size,
                borderRadius: '50%',
                backgroundColor: d.color,
                opacity: 0,
                transform: `translate(${d.startX}px, ${d.startY}px)`,
                animation: `wind-gust-${d.id} 2500ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d.delayMs}ms forwards`,
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
        </Box>
      )}


      {/* MAIN CONTENT - Centered flexbox container */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >

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

        {/* HEART ICON - 40% larger with grow-to-fill transition */}
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
              : isTransitioning 
                ? 'heart-grow-fill 1000ms ease-out forwards'
                : `${heartTitleAppear} 600ms ease-out 2200ms both`,
            zIndex: 20,
            // Heart grows to fill screen and fades away
            '@keyframes heart-grow-fill': {
              '0%': {
                transform: 'scale(1)',
                opacity: 1,
              },
              '70%': {
                transform: 'scale(8)',
                opacity: 1,
              },
              '100%': {
                transform: 'scale(12)',
                opacity: 0,
              },
            },
          }}
        >
          {/* STAR SPARKLES AT TOP-RIGHT OF HEART */}
          {!isTransitioning && (
            <>
              {/* Large 8-point star */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '20%',
                  left: '70%',
                  width: '24px',
                  height: '24px',
                  animation: 'star-twinkle 2s ease-in-out infinite 0s',
                  zIndex: 25,
                  '@keyframes star-twinkle': {
                    '0%, 100%': {
                      opacity: 0,
                      transform: 'scale(0.5) rotate(0deg)',
                    },
                    '50%': {
                      opacity: 1,
                      transform: 'scale(1.2) rotate(180deg)',
                    },
                  },
                }}
              >
                <svg width="24" height="24" viewBox="0 0 16 16">
                  <path
                    d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
                    fill="#ffffff"
                    stroke="#ffd700"
                    strokeWidth="0.5"
                  />
                </svg>
              </Box>

              {/* Medium 6-point star */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '15%',
                  left: '75%',
                  width: '18px',
                  height: '18px',
                  animation: 'star-twinkle 2.5s ease-in-out infinite 0.5s',
                  zIndex: 25,
                  '@keyframes star-twinkle': {
                    '0%, 100%': {
                      opacity: 0,
                      transform: 'scale(0.3) rotate(0deg)',
                    },
                    '50%': {
                      opacity: 0.9,
                      transform: 'scale(1) rotate(120deg)',
                    },
                  },
                }}
              >
                <svg width="18" height="18" viewBox="0 0 12 12">
                  <path
                    d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z"
                    fill="#ffd700"
                    stroke="#ffffff"
                    strokeWidth="0.3"
                  />
                </svg>
              </Box>

              {/* Small 5-point star */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '25%',
                  left: '80%',
                  width: '12px',
                  height: '12px',
                  animation: 'star-twinkle 1.8s ease-in-out infinite 1s',
                  zIndex: 25,
                  '@keyframes star-twinkle': {
                    '0%, 100%': {
                      opacity: 0,
                      transform: 'scale(0.2) rotate(0deg)',
                    },
                    '50%': {
                      opacity: 0.8,
                      transform: 'scale(0.8) rotate(72deg)',
                    },
                  },
                }}
              >
                <svg width="12" height="12" viewBox="0 0 8 8">
                  <path
                    d="M4 0L4.8 3.2L8 4L4.8 4.8L4 8L3.2 4.8L0 4L3.2 3.2L4 0Z"
                    fill="#ffffff"
                    stroke="#ffd700"
                    strokeWidth="0.2"
                  />
                </svg>
              </Box>

              {/* Tiny sparkle above */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '10%',
                  left: '72%',
                  width: '9px',
                  height: '9px',
                  animation: 'star-twinkle 1.5s ease-in-out infinite 1.5s',
                  zIndex: 25,
                  '@keyframes star-twinkle': {
                    '0%, 100%': {
                      opacity: 0,
                      transform: 'scale(0.1) rotate(0deg)',
                    },
                    '50%': {
                      opacity: 0.7,
                      transform: 'scale(0.6) rotate(90deg)',
                    },
                  },
                }}
              >
                <svg width="9" height="9" viewBox="0 0 6 6">
                  <path
                    d="M3 0L3.6 2.4L6 3L3.6 3.6L3 6L2.4 3.6L0 3L2.4 2.4L3 0Z"
                    fill="#ffd700"
                  />
                </svg>
              </Box>
            </>
          )}

          <FavoriteIcon
            sx={{
              fontSize: 196, // 40% larger (140 * 1.4)
              color: HEART_PINK,
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5)) drop-shadow(0 4px 12px rgba(0,0,0,0.3)) drop-shadow(0 0 30px rgba(255, 105, 180, 0.8)) drop-shadow(0 0 60px rgba(255, 105, 180, 0.6)) drop-shadow(0 0 90px rgba(255, 105, 180, 0.4))',
              animation: isTransitioning ? 'none' : 'heart-glow 2s ease-in-out infinite alternate',
              '@keyframes heart-glow': {
                '0%': {
                  filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5)) drop-shadow(0 4px 12px rgba(0,0,0,0.3)) drop-shadow(0 0 30px rgba(255, 105, 180, 0.8)) drop-shadow(0 0 60px rgba(255, 105, 180, 0.6)) drop-shadow(0 0 90px rgba(255, 105, 180, 0.4))',
                },
                '100%': {
                  filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.6)) drop-shadow(0 6px 16px rgba(0,0,0,0.4)) drop-shadow(0 0 40px rgba(255, 105, 180, 1)) drop-shadow(0 0 80px rgba(255, 105, 180, 0.8)) drop-shadow(0 0 120px rgba(255, 105, 180, 0.6))',
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
            px: { xs: 4, sm: 2 }, // 16px padding on mobile (4 * 4px)
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
              filter="drop-shadow(0 6px 18px rgba(0,0,0,0.6)) drop-shadow(0 3px 9px rgba(0,0,0,0.4)) drop-shadow(0 0 20px rgba(255,255,255,0.3))"
            >
              <textPath href="#title-arc" startOffset="50%">
                Love on the Pixel
              </textPath>
            </text>
          </Box>
        </Box>
      </Box>

      {/* Tagline removed per user request */}

      {/* Click to Continue Prompt - Always visible */}
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
    </Box>
      )}
    </>
  );
}