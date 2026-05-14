import { useEffect } from 'react';
import { ApiLogger } from './index';

/**
 * A helper for React Navigation to track screen transitions.
 */
export function onNavigationStateChange(state: any) {
  if (!state) return;

  const getActiveRouteName = (navState: any): string | undefined => {
    if (!navState || !navState.routes) return undefined;
    const route = navState.routes[navState.index || 0];
    if (route.state) {
      return getActiveRouteName(route.state);
    }
    return route.name;
  };

  const name = getActiveRouteName(state);
  if (name) {
    ApiLogger.setScreenName(name);
  }
}

/**
 * A Navigator Observer class for React Navigation (compatibility layer)
 */
export class ApiNavigatorObserver {
  onStateChange(state: any) {
    onNavigationStateChange(state);
  }
}

/**
 * A drop-in component for React Navigation to automatically track screens.
 * Must be placed inside a <NavigationContainer>.
 */
export const ApiLoggerScreenTracker = () => {
  try {
    const { useNavigation } = require('@react-navigation/native');
    const navigation = useNavigation();

    useEffect(() => {
      const updateScreenName = () => {
        try {
          const route = navigation.getCurrentRoute();
          if (route) {
            ApiLogger.setScreenName(route.name);
          }
        } catch (e) {
          onNavigationStateChange(navigation.getState());
        }
      };

      const unsubscribe = navigation.addListener('state', () => {
        updateScreenName();
      });

      updateScreenName();

      return unsubscribe;
    }, [navigation]);
  } catch (e) {
    console.warn('[ApiLogger] @react-navigation/native not found. Screen tracking disabled.');
  }

  return null;
};
