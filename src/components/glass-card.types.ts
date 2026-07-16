import React from 'react';

export interface GlassCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  badgeText?: string;
  badgeType?: 'success' | 'processing' | 'default' | 'danger';
  icon?: React.ReactNode;
  chips?: string[];
  actionText?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  metaBadges?: { icon: React.ReactNode; text: string }[];
  style?: any;
  children?: React.ReactNode;
}
