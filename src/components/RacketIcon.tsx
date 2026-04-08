import React from 'react';
import Svg, { Path, Ellipse, Line, G } from 'react-native-svg';

interface RacketIconProps {
  size?: number;
  color?: string;
}

export const RacketIcon = ({ size = 24, color = 'currentColor' }: RacketIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Racket Head (Oval) */}
      <Ellipse 
        cx="12" 
        cy="8.5" 
        rx="6" 
        ry="7" 
        stroke={color} 
        strokeWidth="2" 
      />
      
      {/* Strings (Vertical) */}
      <Line x1="10" y1="2.5" x2="10" y2="14.5" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <Line x1="12" y1="1.5" x2="12" y2="15.5" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <Line x1="14" y1="2.5" x2="14" y2="14.5" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      
      {/* Strings (Horizontal) */}
      <Line x1="6.5" y1="6" x2="17.5" y2="6" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <Line x1="5.5" y1="8.5" x2="18.5" y2="8.5" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      <Line x1="6.5" y1="11" x2="17.5" y2="11" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      
      {/* Throat / Connection */}
      <Path 
        d="M9 15L12 18L15 15" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Shaft */}
      <Line 
        x1="12" 
        y1="18" 
        x2="12" 
        y2="22" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      
      {/* Handle Base */}
      <Line 
        x1="10" 
        y1="23" 
        x2="14" 
        y2="23" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </Svg>
  );
};
