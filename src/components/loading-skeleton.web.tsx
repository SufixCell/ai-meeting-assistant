import React from 'react';
import { useColorScheme } from 'react-native';
import { SkeletonCard } from './skeleton-card';

export function LoadingSkeleton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const containerStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: isDark ? '#0D0E12' : '#F8FAFC',
    padding: '24px',
    paddingTop: '60px',
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  };

  const textPulseStyle: React.CSSProperties = {
    animation: 'skeletonPulse 2s infinite ease-in-out',
  };

  return (
    <div style={containerStyle}>
      {/* Background Mesh Gradient Orbs */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-100px',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        backgroundColor: 'rgba(124, 58, 237, 0.04)',
        filter: 'blur(90px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '100px',
        left: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        backgroundColor: 'rgba(91, 95, 255, 0.04)',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      {/* Header Placeholders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          width: '140px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
          ...textPulseStyle
        }} />
        <div style={{
          width: '240px',
          height: '14px',
          borderRadius: '4px',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
          ...textPulseStyle,
          animationDelay: '0.2s'
        }} />
      </div>

      {/* Search Bar Placeholder */}
      <div style={{
        width: '100%',
        height: '48px',
        borderRadius: '16px',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.5)',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'skeletonPulse 2s infinite ease-in-out',
        animationDelay: '0.3s'
      }} />

      {/* Filter Chips Placeholder */}
      <div style={{ display: 'flex', gap: '8px', overflow: 'hidden', width: '100%' }}>
        <div style={{
          width: '76px',
          height: '32px',
          borderRadius: '9999px',
          backgroundColor: isDark ? 'rgba(91, 95, 255, 0.08)' : 'rgba(91, 95, 255, 0.1)',
          border: isDark ? '1px solid rgba(91, 95, 255, 0.15)' : '1px solid rgba(91, 95, 255, 0.2)',
        }} />
        {[84, 88, 72].map((w, idx) => (
          <div key={idx} style={{
            width: `${w}px`,
            height: '32px',
            borderRadius: '9999px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.5)',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255, 255, 255, 0.4)',
            animation: 'skeletonPulse 2s infinite ease-in-out',
            animationDelay: `${0.1 * (idx + 1)}s`
          }} />
        ))}
      </div>

      {/* Grid of Skeleton Cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flexGrow: 1,
        paddingBottom: '110px' // For bottom navigation space
      }}>
        <SkeletonCard delay={0} />
        <SkeletonCard delay={0.2} />
        <SkeletonCard delay={0.4} />
      </div>

      {/* Bottom Pagination Dots */}
      <div style={{
        position: 'absolute',
        bottom: '100px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        zIndex: 20
      }}>
        <div style={{
          width: '18px',
          height: '6px',
          borderRadius: '3px',
          backgroundColor: '#5B5FFF',
          boxShadow: '0 0 8px rgba(91, 95, 255, 0.4)'
        }} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: '6px',
            height: '6px',
            borderRadius: '3px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.15)',
          }} />
        ))}
      </div>
    </div>
  );
}

export default LoadingSkeleton;
