import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { ApiLogger } from '../../index';
import { Theme } from '../theme';

interface Props {
  text?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * A ready-to-use button component that opens the API Logger session list.
 */
export const ApiLoggerButton: React.FC<Props> = ({
  text = 'Open API Logs',
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={() => ApiLogger.open()}
    >
      <Text style={[styles.buttonText, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
