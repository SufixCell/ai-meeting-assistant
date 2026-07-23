import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { useTheme } from '../theme';

interface NotiaLogoProps {
  size?: number;
  color?: string;
  style?: any;
}

export function NotiaLogo({ size = 28, color, style }: NotiaLogoProps) {
  const { theme } = useTheme();

  // Dynamic Theme Color Mapping as requested:
  // - Midnight: Bright Blue (#38BDF8) or Primary Glow
  // - Arctic: Solid Black (#000000)
  // - Executive: Warm Gold (#D4AF37)
  const getThemeColor = () => {
    if (color) return color;
    if (theme.name === 'arctic') return '#000000';
    if (theme.name === 'executive') return '#D4AF37';
    return '#38BDF8'; // Bright blue for midnight theme
  };

  const logoColor = getThemeColor();

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Outer N Shape: Diagonal and Right Stem */}
        <Path
          d="M 32 18 L 74 68 L 74 18 M 74 72 L 58 72 L 32 30"
          stroke={logoColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Microphone Capsule Body (Left stem of N) */}
        <Path
          d="M 22 28 C 22 18, 42 18, 42 28 L 42 46 C 42 50, 22 50, 22 46 Z"
          stroke={logoColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Capsule Horizontal Divider Line */}
        <Line
          x1="22"
          y1="46"
          x2="42"
          y2="46"
          stroke={logoColor}
          strokeWidth="4"
        />

        {/* Mesh Grid Lines inside Capsule */}
        <Line x1="28" y1="22" x2="38" y2="34" stroke={logoColor} strokeWidth="2.5" />
        <Line x1="24" y1="28" x2="34" y2="40" stroke={logoColor} strokeWidth="2.5" />
        <Line x1="30" y1="34" x2="38" y2="44" stroke={logoColor} strokeWidth="2.5" />

        <Line x1="36" y1="22" x2="26" y2="34" stroke={logoColor} strokeWidth="2.5" />
        <Line x1="40" y1="28" x2="30" y2="40" stroke={logoColor} strokeWidth="2.5" />
        <Line x1="34" y1="34" x2="26" y2="44" stroke={logoColor} strokeWidth="2.5" />

        {/* Outer U-shaped Microphone Cradle */}
        <Path
          d="M 16 42 C 16 60, 48 60, 48 42"
          stroke={logoColor}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Stand Stem */}
        <Line
          x1="32"
          y1="57"
          x2="32"
          y2="70"
          stroke={logoColor}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Stand Foot / Base T-Bar */}
        <Line
          x1="22"
          y1="70"
          x2="42"
          y2="70"
          stroke={logoColor}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
