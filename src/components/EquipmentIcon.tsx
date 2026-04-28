import React from 'react';
import Svg, { Ellipse, Line, Circle, G } from 'react-native-svg';

interface EquipmentIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const EquipmentIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: EquipmentIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G transform="translate(-2, -2)">
        {/* Racket (shifted to the top left) */}
        <Ellipse cx="10" cy="8.5" rx="5" ry="6" stroke={color} strokeWidth={strokeWidth} />
        {/* Strings vertical */}
        <Line x1="8" y1="4.5" x2="8" y2="12.5" stroke={color} strokeWidth={strokeWidth / 2} strokeOpacity="0.5" />
        <Line x1="10" y1="3.5" x2="10" y2="13.5" stroke={color} strokeWidth={strokeWidth / 2} strokeOpacity="0.5" />
        <Line x1="12" y1="4.5" x2="12" y2="12.5" stroke={color} strokeWidth={strokeWidth / 2} strokeOpacity="0.5" />
        {/* Strings horizontal */}
        <Line x1="6" y1="6.5" x2="14" y2="6.5" stroke={color} strokeWidth={strokeWidth / 2} strokeOpacity="0.5" />
        <Line x1="5.5" y1="8.5" x2="14.5" y2="8.5" stroke={color} strokeWidth={strokeWidth / 2} strokeOpacity="0.5" />
        <Line x1="6" y1="10.5" x2="14" y2="10.5" stroke={color} strokeWidth={strokeWidth / 2} strokeOpacity="0.5" />
        
        {/* Shaft & Handle */}
        <Line x1="10" y1="14.5" x2="10" y2="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <Line x1="8.5" y1="20" x2="11.5" y2="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </G>

      {/* String Reel (Bobine) on the bottom right */}
      <G transform="translate(6, 6)">
        {/* Outer reel ring */}
        <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={strokeWidth} fill="#1E1E1E" fillOpacity="0.2" />
        {/* Inner reel hole */}
        <Circle cx="12" cy="12" r="1.5" stroke={color} strokeWidth={strokeWidth} />
        {/* Wrapped string lines */}
        <Circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth={strokeWidth / 2} />
        <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth={strokeWidth / 2} />
      </G>
    </Svg>
  );
};
