"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 120;
  const MAX_PULL = 200;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && startY > 0 && !isRefreshing) {
        const y = e.touches[0].clientY;
        const diff = y - startY;
        if (diff > 0) {
          // Add resistance
          const newPullDistance = Math.min(diff * 0.5, MAX_PULL);
          setPullDistance(newPullDistance);
          setCurrentY(y);
          // Prevent default pull-to-refresh on some browsers
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isRefreshing) return;

      if (pullDistance > THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(THRESHOLD); // Snap to threshold
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
          setStartY(0);
          setCurrentY(0);
        }
      } else {
        // Snap back
        setPullDistance(0);
        setStartY(0);
        setCurrentY(0);
      }
    };

    // We attach listeners to the window/body to capture drags even if they start on children
    // but we only activate if we are at the top.
    // However, for React, we can attach to the container.
    // Attaching to the container is safer for "between cards" or specific sections.
    // But for a global "pull down", window listeners are often better.
    // Let's try attaching to the div first.

    const element = contentRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startY, pullDistance, isRefreshing, onRefresh]);

  return (
    <div ref={contentRef} className="relative min-h-screen">
      {/* Refresh Indicator */}
      <div
        className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex justify-center overflow-hidden transition-all duration-200 ease-out"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div className="flex h-full items-end pb-4">
          <div className="bg-background/80 rounded-full border p-2 shadow-md backdrop-blur-sm">
            <Loader2
              className={`text-primary size-6 ${isRefreshing ? "animate-spin" : ""}`}
              style={{
                transform: `rotate(${pullDistance * 2}deg)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing
            ? "transform 0.2s"
            : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
