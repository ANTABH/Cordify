import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { StringReelIcon } from './StringReelIcon';

interface AddStringLogoProps {
  size?: number;
  color?: string;
  plusColor?: string;
}

export const AddStringLogo = ({ 
  size = 24, 
  color = '#000', 
  plusColor = '#FFF' 
}: AddStringLogoProps) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Bobine penchée */}
        <G transform="rotate(-15, 10, 12) translate(1, -1)">
          <StringReelIcon size={20} color={color} strokeWidth={2} />
        </G>
        
        {/* Rond par dessus un peu à côté */}
        <Circle 
          cx="17.5" 
          cy="16.5" 
          r="5.5" 
          fill={color} 
          stroke={plusColor === color ? 'transparent' : 'none'} 
        />
        
        {/* Petit + dedans */}
        <Path 
          d="M17.5 14v5M15 16.5h5" 
          stroke={plusColor} 
          strokeWidth="1.8" 
          strokeLinecap="round" 
        />
      </Svg>
    </View>
  );
};
