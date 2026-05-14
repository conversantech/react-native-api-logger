import React from 'react';
import { Text } from 'react-native';

interface Props {
  text: string;
  highlight: string;
  style?: any;
  numberOfLines?: number;
}

export const HighlightedText: React.FC<Props> = ({ 
  text, 
  highlight, 
  style, 
  numberOfLines 
}) => {
  if (!highlight.trim()) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) => (
        <Text
          key={i}
          style={
            part.toLowerCase() === highlight.toLowerCase()
              ? { backgroundColor: '#FFE082', color: '#000' }
              : {}
          }
        >
          {part}
        </Text>
      ))}
    </Text>
  );
};
