import React from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Alert,
  StyleSheet,
} from 'react-native';
import { ApiLogger } from '../../index';

interface Props {
  children: React.ReactNode;
  tapCount?: number;
  tapTimeout?: number;
  onStatusChange?: (enabled: boolean) => void;
}

/**
 * A component that toggles the API Logger's enabled/disabled state
 * after a certain number of taps.
 */
export const ApiLoggerToggle: React.FC<Props> = ({
  children,
  tapCount = 3,
  tapTimeout = 1500,
  onStatusChange,
}) => {
  const [taps, setTaps] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handlePress = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const nextTaps = taps + 1;

    if (nextTaps >= tapCount) {
      setTaps(0);
      const currentlyEnabled = ApiLogger.isEnabled();
      if (currentlyEnabled) {
        await ApiLogger.disable();
        Alert.alert('API Logger', 'Network logging has been DISABLED.');
      } else {
        await ApiLogger.enable();
        Alert.alert('API Logger', 'Network logging has been ENABLED.');
      }
      onStatusChange?.(!currentlyEnabled);
    } else {
      setTaps(nextTaps);
      timerRef.current = setTimeout(() => setTaps(0), tapTimeout);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>{children}</View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
});
