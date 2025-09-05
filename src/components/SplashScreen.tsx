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
  0%   { transform: translate(var(--start-x), var(--start-y)) scale(0); opacity: 0 }
  30%  { transform: translate(var(--mid-x), var(--mid-y)) scale(1.2); opacity: 0.8 }
  70%  { transform: translate(var(--swirl-x), var(--swirl-y)) scale(0.8); opacity: 0.9 }
  100% { transform: translate(var(--end-x), var(--end-y)) scale(1); opacity: 1 }
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
  swirlX: number;
  swirlY: number;
  endX: number;
  endY: number;
  delayMs: number;
  color: string;
  size: number;
  animationType: 'wind' | 'swirl';
};

export default function SplashScreen({
  children,
  minDurationMs = 4000, // 4 seconds total (2.5s animation + 1.5s hold)
  dotCount = 600, // Increased from 400 to 600 for better visual impact while maintaining performance
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
    const lastDotDelay = (dotCount - 1) * 1.5; // Last dot's delay in ms
    const animationDuration = 2500; // Animation duration in ms (restored for complex animations)
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

  // Precompute dots (client only to keep SSR stable) - Restored complex movements
  const dots: Dot[] = useMemo(() => {
    if (!client) return [];
    const { w, h } = viewport;

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    
    // Expanded color palette for more visual variety
    const colors = [
      '#ff6b9d', '#ff4757', '#00b894', '#00cec9', '#6c5ce7', '#5f27cd',
      '#ffa502', '#ff6348', '#2ed573', '#1e90ff', '#ff3838', '#ff9ff3'
    ];

    // More complex grid calculation for better distribution
    const gridCols = Math.ceil(Math.sqrt(dotCount));
    const gridRows = Math.ceil(dotCount / gridCols);
    const spacingX = w / gridCols;
    const spacingY = h / gridRows;

    return Array.from({ length: dotCount }, (_, i) => {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const endX = (col * spacingX) + (spacingX / 2) + rand(-spacingX * 0.3, spacingX * 0.3);
      const endY = (row * spacingY) + (spacingY / 2) + rand(-spacingY * 0.3, spacingY * 0.3);

      // More varied starting positions with 8 different edges/corners
      const edge = i % 8;
      let startX = 0, startY = 0;
      
      if (edge === 0) { // Top
        startX = rand(0, w);
        startY = -rand(50, 150);
      } else if (edge === 1) { // Top-right
        startX = w + rand(50, 150);
        startY = -rand(50, 150);
      } else if (edge === 2) { // Right
        startX = w + rand(50, 150);
        startY = rand(0, h);
      } else if (edge === 3) { // Bottom-right
        startX = w + rand(50, 150);
        startY = h + rand(50, 150);
      } else if (edge === 4) { // Bottom
        startX = rand(0, w);
        startY = h + rand(50, 150);
      } else if (edge === 5) { // Bottom-left
        startX = -rand(50, 150);
        startY = h + rand(50, 150);
      } else if (edge === 6) { // Left
        startX = -rand(50, 150);
        startY = rand(0, h);
      } else { // Top-left
        startX = -rand(50, 150);
        startY = -rand(50, 150);
      }

      // More complex mid point calculation with some randomness
      const midX = startX + (endX - startX) * (0.3 + rand(0, 0.4));
      const midY = startY + (endY - startY) * (0.3 + rand(0, 0.4));

      // Swirl point calculation for swirling animation
      const centerX = w / 2;
      const centerY = h / 2;
      const angle = Math.atan2(endY - centerY, endX - centerX) + (Math.PI / 4) * (i % 2 === 0 ? 1 : -1);
      const swirlRadius = Math.sqrt((endX - centerX) ** 2 + (endY - centerY) ** 2) * 0.7;
      const swirlX = centerX + Math.cos(angle) * swirlRadius;
      const swirlY = centerY + Math.sin(angle) * swirlRadius;

      const color = colors[i % colors.length];
      const size = 4 + rand(0, 3); // Variable size for more visual interest
      const delayMs = i * 1.5; // Faster animation for more dynamic feel
      const animationType = i % 3 === 0 ? 'swirl' : 'wind'; // Mix of animation types

      return {
        id: i,
        startX,
        startY,
        midX,
        midY,
        swirlX,
        swirlY,
        endX,
        endY,
        delayMs,
        color,
        size,
        animationType,
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
      
      {/* Splash screen overlay */}
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
      {/* Simplified background glow effect */}
      {!reduced && client && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
            opacity: 0,
            animation: 'background-glow 2000ms ease-out 1000ms forwards',
            '@keyframes background-glow': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 },
            },
          }}
        />
      )}

      {/* RESTORED DOT MATRIX - Using CSS Grid with complex animations */}
      {!reduced && client && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(dotCount))}, 1fr)`,
            gridTemplateRows: `repeat(${Math.ceil(dotCount / Math.ceil(Math.sqrt(dotCount)))}, 1fr)`,
            gap: 0,
          }}
        >
          {dots.map((d, index) => (
            <Box
              key={d.id}
              aria-hidden
              sx={{
                width: d.size,
                height: d.size,
                borderRadius: '50%',
                backgroundColor: d.color,
                opacity: 0,
                transform: 'scale(0)',
                animation: d.animationType === 'swirl' 
                  ? `swirl-dot-appear 2500ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d.delayMs}ms forwards`
                  : `wind-dot-appear 2500ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d.delayMs}ms forwards`,
                willChange: 'transform, opacity', // Optimize for animations
                '--start-x': `${d.startX}px`,
                '--start-y': `${d.startY}px`,
                '--mid-x': `${d.midX}px`,
                '--mid-y': `${d.midY}px`,
                '--swirl-x': `${d.swirlX}px`,
                '--swirl-y': `${d.swirlY}px`,
                '--end-x': `${d.endX}px`,
                '--end-y': `${d.endY}px`,
                '@keyframes wind-dot-appear': {
                  '0%': {
                    transform: 'translate(var(--start-x), var(--start-y)) scale(0)',
                    opacity: 0,
                  },
                  '20%': {
                    transform: 'translate(var(--mid-x), var(--mid-y)) scale(1)',
                    opacity: 0.8,
                  },
                  '100%': {
                    transform: 'translate(var(--end-x), var(--end-y)) scale(1)',
                    opacity: 1,
                  },
                },
                '@keyframes swirl-dot-appear': {
                  '0%': {
                    transform: 'translate(var(--start-x), var(--start-y)) scale(0)',
                    opacity: 0,
                  },
                  '30%': {
                    transform: 'translate(var(--mid-x), var(--mid-y)) scale(1.2)',
                    opacity: 0.8,
                  },
                  '70%': {
                    transform: 'translate(var(--swirl-x), var(--swirl-y)) scale(0.8)',
                    opacity: 0.9,
                  },
                  '100%': {
                    transform: 'translate(var(--end-x), var(--end-y)) scale(1)',
                    opacity: 1,
                  },
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
    </>
  );
}