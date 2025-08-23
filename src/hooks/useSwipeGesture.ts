import { useEffect, useRef, useState } from 'react';

interface SwipeConfig {
  minSwipeDistance?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const useSwipeGesture = (config: SwipeConfig = {}) => {
  const { minSwipeDistance = 50, onSwipeLeft, onSwipeRight } = config;
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
      setCurrentX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      setCurrentX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;

      const swipeDistance = currentX - startX;
      const isSwipeLeft = swipeDistance < -minSwipeDistance;
      const isSwipeRight = swipeDistance > minSwipeDistance;

      if (isSwipeLeft && onSwipeLeft) {
        onSwipeLeft();
      } else if (isSwipeRight && onSwipeRight) {
        onSwipeRight();
      }

      setIsDragging(false);
      setStartX(0);
      setCurrentX(0);
    };

    // Mouse events for desktop testing
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setStartX(e.clientX);
      setCurrentX(e.clientX);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setCurrentX(e.clientX);
    };

    const handleMouseUp = () => {
      if (!isDragging) return;

      const swipeDistance = currentX - startX;
      const isSwipeLeft = swipeDistance < -minSwipeDistance;
      const isSwipeRight = swipeDistance > minSwipeDistance;

      if (isSwipeLeft && onSwipeLeft) {
        onSwipeLeft();
      } else if (isSwipeRight && onSwipeRight) {
        onSwipeRight();
      }

      setIsDragging(false);
      setStartX(0);
      setCurrentX(0);
    };

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Mouse events
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, startX, currentX, minSwipeDistance, onSwipeLeft, onSwipeRight]);

  const swipeOffset = isDragging ? currentX - startX : 0;

  return {
    elementRef,
    isDragging,
    swipeOffset,
  };
};
