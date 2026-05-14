import React from 'react';
import { View, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { ApiLogger } from '../../index';

interface Props {
  children: React.ReactNode;
  tapCount?: number;
  tapTimeout?: number; // ms
  enabled?: boolean;
}

/**
 * A wrapper component that detects secret tap gestures to open the API Logger.
 * By default, it requires 6 rapid taps within 2 seconds.
 */
export const ApiLoggerWrapper: React.FC<Props> = ({
  children,
  tapCount = 6,
  tapTimeout = 2000,
  enabled = true,
}) => {
  const [taps, setTaps] = React.useState<number>(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleTap = () => {
    if (!enabled) return;

    // Reset timer on every tap
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const nextTaps = taps + 1;
    
    if (nextTaps >= tapCount) {
      // Trigger reached!
      setTaps(0);
      ApiLogger.open();
    } else {
      setTaps(nextTaps);
      
      // Start/Restart the timeout
      timerRef.current = setTimeout(() => {
        setTaps(0);
      }, tapTimeout);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
