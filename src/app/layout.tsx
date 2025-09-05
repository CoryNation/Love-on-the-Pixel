import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import SplashScreen from "@/components/SplashScreen";
import { performanceMonitor } from "@/lib/performance";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // Optimize font loading
  preload: true,
});

export const metadata: Metadata = {
  title: "Love on the Pixel",
  description: "Messages of Love & Affirmation",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Love on the Pixel"
  },
  // Performance optimizations
  robots: {
    index: true,
    follow: true,
  },
  // Preload critical resources
  other: {
    'preload': '/favicon.ico',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#667eea"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Love on the Pixel</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Love on the Pixel" />
        
        {/* Critical resource prioritization */}
        <link rel="preload" href="/favicon.ico" as="image" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload critical JavaScript chunks */}
        <link rel="modulepreload" href="/_next/static/chunks/react.js" />
        <link rel="modulepreload" href="/_next/static/chunks/mui.js" />
        
        {/* Critical CSS inlining for above-the-fold content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; padding: 0; font-family: var(--font-inter), Arial, Helvetica, sans-serif; }
            html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
          `
        }} />
        
        {/* Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
              
              // Performance monitoring
              window.addEventListener('load', function() {
                if (window.performance) {
                  const navigation = window.performance.getEntriesByType('navigation')[0];
                  if (navigation) {
                    console.log('Performance Metrics:', {
                      'DOM Content Loaded': (navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).toFixed(2) + 'ms',
                      'Load Complete': (navigation.loadEventEnd - navigation.loadEventStart).toFixed(2) + 'ms',
                      'First Byte': (navigation.responseStart - navigation.requestStart).toFixed(2) + 'ms',
                      'DOM Interactive': (navigation.domInteractive - navigation.navigationStart).toFixed(2) + 'ms',
                    });
                  }
                }
              });
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        style={{ 
          margin: 0, 
          padding: 0, 
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <SplashScreen minDurationMs={4000} dotCount={1200}>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </SplashScreen>
      </body>
    </html>
  );
}
