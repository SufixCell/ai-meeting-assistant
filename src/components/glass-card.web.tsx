import React, { useRef, useState } from 'react';
import { GlassCardProps } from './glass-card.types';
import { useColorScheme } from 'react-native';

export function GlassCard({
  title,
  subtitle,
  description,
  badgeText,
  badgeType = 'default',
  icon,
  chips = [],
  actionText,
  onPress,
  rightElement,
  metaBadges = [],
  style,
  children,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 0, y: 0 });
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setGlare({ x, y });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Max 6 degrees tilt
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  // Radial gradient for the hover glare effect
  const glareStyle = hovered
    ? {
        background: `radial-gradient(circle 320px at ${glare.x}px ${glare.y}px, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 40%, rgba(56, 189, 248, 0) 80%), radial-gradient(circle 180px at ${glare.x}px ${glare.y}px, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 70%)`,
        opacity: 1,
      }
    : { opacity: 0 };

  // Combine inline styles for the card
  const cardStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
    borderRadius: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s, box-shadow 0.3s',
    transform: hovered 
      ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.03)` 
      : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
    cursor: onPress ? 'pointer' : 'default',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    outline: 'none',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    // Theme styles
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.70)',
    borderColor: hovered 
      ? (isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.5)')
      : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'),
    boxShadow: hovered
      ? (isDark ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.1)' : '0 12px 40px rgba(31, 38, 135, 0.1), 0 0 20px rgba(99, 102, 241, 0.15)')
      : (isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(31, 38, 135, 0.06)'),
    color: isDark ? '#FFFFFF' : '#0F172A',
    ...style,
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onPress}
      style={cardStyle}
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onPress) {
          e.preventDefault();
          onPress();
        }
      }}
    >
      {/* Glare and reflections overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          transition: 'opacity 0.3s ease',
          ...glareStyle,
        }}
      />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {icon && (
              <div style={{
                padding: '10px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.06)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)',
                color: '#6366F1',
              }}>
                {icon}
              </div>
            )}
            {badgeText && (
              <span style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.025em',
                border: '1px solid',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: badgeType === 'success'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : badgeType === 'processing'
                    ? 'rgba(91, 95, 255, 0.1)'
                    : badgeType === 'danger'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(255, 255, 255, 0.05)',
                borderColor: badgeType === 'success'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : badgeType === 'processing'
                    ? 'rgba(91, 95, 255, 0.2)'
                    : badgeType === 'danger'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)',
                color: badgeType === 'success'
                  ? '#10B981'
                  : badgeType === 'processing'
                    ? '#5B5FFF'
                    : badgeType === 'danger'
                      ? '#EF4444'
                      : '#9CA3AF',
              }}>
                {(badgeType === 'processing' || badgeType === 'danger') && (
                  <span style={{
                    height: '6px',
                    width: '6px',
                    borderRadius: '50%',
                    backgroundColor: badgeType === 'danger' ? '#EF4444' : '#5B5FFF',
                    display: 'inline-block',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }} />
                )}
                {badgeText}
              </span>
            )}
          </div>
          {rightElement && <div style={{ display: 'flex', alignItems: 'center' }}>{rightElement}</div>}
        </div>

        {/* Content Body */}
        <div style={{ flexGrow: 1 }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 600,
            letterSpacing: '-0.025em',
            margin: '0 0 8px 0',
            color: isDark ? '#FFFFFF' : '#0F172A',
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{
              fontSize: '14px',
              fontWeight: 400,
              margin: '0 0 12px 0',
              color: isDark ? '#9CA3AF' : '#64748B',
            }}>
              {subtitle}
            </p>
          )}
          {description && (
            <p style={{
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '20px',
              margin: '0 0 16px 0',
              color: isDark ? '#D1D5DB' : '#475569',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {description}
            </p>
          )}
        </div>

        {/* Meta Badges */}
        {metaBadges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            {metaBadges.map((badge, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(240, 240, 243, 0.8)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)',
                  color: isDark ? '#9CA3AF' : '#64748B',
                }}
              >
                {badge.icon}
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Chips */}
        {chips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {chips.map((chip, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: '1px solid',
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.06)',
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)',
                  color: isDark ? '#818CF8' : '#4F46E5',
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        {actionText && (
          <div style={{ marginTop: '8px', display: 'flex' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 16px',
              cursor: 'pointer',
              boxShadow: isDark ? '0 4px 12px rgba(99, 102, 241, 0.2)' : '0 4px 12px rgba(99, 102, 241, 0.3)',
              transition: 'background-color 0.2s',
            }}>
              <span>{actionText}</span>
              <span style={{
                display: 'inline-block',
                transform: hovered ? 'translateX(4px)' : 'translateX(0)',
                transition: 'transform 0.2s ease',
              }}>
                →
              </span>
            </button>
          </div>
        )}

        {/* Children Render Block */}
        {children && (
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)',
            width: '100%',
          }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export default GlassCard;
