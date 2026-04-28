import React from 'react';
import Svg, { Circle, G } from 'react-native-svg';

interface StringReelIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const StringReelIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: StringReelIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G transform="translate(0, 0)">
        {/* Outer reel ring */}
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} fill="#1E1E1E" fillOpacity="0.1" />
        {/* Inner reel hole */}
        <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth={strokeWidth} />
        {/* Wrapped string lines */}
        <Circle cx="12" cy="12" r="7" stroke={color} strokeWidth={strokeWidth / 2} strokeOpacity="0.6" />
        <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={strokeWidth / 2} strokeOpacity="0.6" />
      </G>
    </Svg>
  );
};
