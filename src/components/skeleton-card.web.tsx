import React from 'react';
import { useColorScheme } from 'react-native';

export interface SkeletonCardProps {
  delay?: number; // Delay in seconds for animations
  style?: React.CSSProperties;
}

export function SkeletonCard({ delay = 0, style }: SkeletonCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Card theme styles
  const cardStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
    borderRadius: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    // Light/dark responsive theme
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.65)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.55)',
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(31, 38, 135, 0.04)',
    
    // Float animation with delay
    animationName: 'skeletonFloat',
    animationDuration: '6s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDelay: `${delay}s`,
    ...style,
  };

  const shimmerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'linear-gradient(90deg, transparent 0%, rgba(91, 95, 255, 0.18) 25%, rgba(124, 58, 237, 0.18) 50%, rgba(56, 189, 248, 0.16) 75%, transparent 100%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 3.5s infinite linear',
    animationDelay: `${delay * 0.5}s`,
    opacity: 0.85,
  };

  const scanLineStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, rgba(91, 95, 255, 0.4), rgba(124, 58, 237, 0.4), rgba(56, 189, 248, 0.3), transparent)',
    pointerEvents: 'none',
    zIndex: 5,
    animation: 'skeletonScan 5s infinite ease-in-out',
    animationDelay: `${delay * 0.8}s`,
  };

  // Sparkles container style
  const sparklesStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12%',
    right: '15%',
    width: '12px',
    height: '12px',
    pointerEvents: 'none',
    opacity: 0.7,
    animation: 'skeletonSparkle 4s infinite ease-in-out',
    animationDelay: `${delay + 1}s`,
  };

  return (
    <div style={cardStyle}>
      {/* Inject custom CSS keyframes dynamically */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes skeletonFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes skeletonShimmer {
          0% { background-position: -150% 0; }
          100% { background-position: 150% 0; }
        }
        @keyframes skeletonScan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.8; }
        }
        @keyframes skeletonBreathingGlow {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(91, 95, 255, 0); }
          50% { transform: scale(1.08); box-shadow: 0 0 15px rgba(91, 95, 255, 0.25); }
        }
        @keyframes skeletonSparkle {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 0.8; }
        }
        @media (prefers-reduced-motion: reduce) {
          div {
            animation: none !important;
          }
        }
      `}} />

      {/* Shimmer sweep */}
      <div style={shimmerStyle} />

      {/* Laser scan line */}
      <div style={scanLineStyle} />

      {/* Sparks */}
      <svg style={sparklesStyle} viewBox="0 0 24 24" fill="none">
        <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" fill="url(#sparkleGradient)" />
        <defs>
          <linearGradient id="sparkleGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5B5FFF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
      </svg>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', gap: '16px' }}>
        
        {/* Top Header Placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Circular mic icon placeholder with breathing glow */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(91, 95, 255, 0.08)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(91, 95, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'skeletonBreathingGlow 3s infinite ease-in-out',
              animationDelay: `${delay}s`
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#5B5FFF',
                opacity: 0.6
              }} />
            </div>

            {/* AI badge placeholder */}
            <div style={{
              width: '110px',
              height: '22px',
              borderRadius: '9999px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(91, 95, 255, 0.05)',
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(91, 95, 255, 0.08)',
              animation: 'skeletonPulse 2.5s infinite ease-in-out',
              animationDelay: `${delay + 0.3}s`
            }} />
          </div>

          {/* Three dot menu placeholder */}
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
          }} />
        </div>

        {/* Content Body Placeholders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Title Placeholder */}
          <div style={{
            width: '65%',
            height: '22px',
            borderRadius: '6px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)',
            animation: 'skeletonPulse 2s infinite ease-in-out',
            animationDelay: `${delay + 0.1}s`
          }} />
          
          {/* Subtitle Placeholder */}
          <div style={{
            width: '40%',
            height: '14px',
            borderRadius: '4px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)',
            animation: 'skeletonPulse 2s infinite ease-in-out',
            animationDelay: `${delay + 0.2}s`
          }} />
        </div>

        {/* AI Summary Section Placeholder (3-4 lines) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0' }}>
          <div style={{
            width: '95%',
            height: '12px',
            borderRadius: '4px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
            animation: 'skeletonPulse 2s infinite ease-in-out',
            animationDelay: `${delay + 0.3}s`
          }} />
          <div style={{
            width: '88%',
            height: '12px',
            borderRadius: '4px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
            animation: 'skeletonPulse 2s infinite ease-in-out',
            animationDelay: `${delay + 0.4}s`
          }} />
          <div style={{
            width: '92%',
            height: '12px',
            borderRadius: '4px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
            animation: 'skeletonPulse 2s infinite ease-in-out',
            animationDelay: `${delay + 0.5}s`
          }} />
          <div style={{
            width: '60%',
            height: '12px',
            borderRadius: '4px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
            animation: 'skeletonPulse 2s infinite ease-in-out',
            animationDelay: `${delay + 0.6}s`
          }} />
        </div>

        {/* Metadata Pills Placeholder */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.03)',
            border: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(15, 23, 42, 0.04)',
          }} />
          <div style={{
            width: '65px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.03)',
            border: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(15, 23, 42, 0.04)',
          }} />
          <div style={{
            width: '75px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.03)',
            border: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(15, 23, 42, 0.04)',
          }} />
        </div>

        {/* Bottom CTA / Actions Placeholders */}
        <div style={{
          marginTop: '8px',
          paddingTop: '16px',
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            width: '140px',
            height: '14px',
            borderRadius: '4px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
            animation: 'skeletonPulse 2s infinite ease-in-out',
            animationDelay: `${delay + 0.7}s`
          }} />
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
          }} />
        </div>

      </div>
    </div>
  );
}

export default SkeletonCard;
