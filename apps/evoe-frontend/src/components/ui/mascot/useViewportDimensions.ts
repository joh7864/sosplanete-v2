import { useState, useEffect } from 'react';

export function useViewportDimensions() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isLandscapeMobile =
    windowDimensions.width > windowDimensions.height && windowDimensions.height < 620;
  const isDesktopWide =
    windowDimensions.width >= 1200 && windowDimensions.height >= 650;
  const isSmallPortrait =
    windowDimensions.height >= windowDimensions.width && windowDimensions.width < 430;

  return {
    windowDimensions,
    isLandscapeMobile,
    isDesktopWide,
    isSmallPortrait,
  };
}
