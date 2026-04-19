import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { RacketIcon } from './RacketIcon';

interface AddRacketLogoProps {
  size?: number;
  color?: string;
  plusColor?: string;
}

export const AddRacketLogo = ({ 
  size = 24, 
  color = '#000', 
  plusColor = '#FFF' 
}: AddRacketLogoProps) => {
  const racketSize = size * 0.85;
  const plusCircleSize = size * 0.45;
  
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Raquette penchée et bold */}
        <G transform="rotate(-20, 10, 12) translate(0, -0.5)">
          <RacketIcon size={20} color={color} strokeWidth={2.2} />
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
