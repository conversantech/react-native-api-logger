import React from 'react';
import ApiLoggerService from './ApiLoggerService';
import { ApiLoggerUI } from './ui/ApiLoggerUI';
import { ApiLoggerScreenTracker, ApiNavigatorObserver } from './navigation';
import { ApiLoggerWrapper } from './ui/components/ApiLoggerWrapper';
import { ApiLoggerToggle } from './ui/components/ApiLoggerToggle';
import { ApiLoggerButton } from './ui/components/ApiLoggerButton';
import type { ApiLoggerConfig } from './models';

/**
 * Main API Logger controller
 */
export const ApiLogger = {
  /**
   * Initialize the logger with configuration
   */
  initialize: (config?: ApiLoggerConfig) => ApiLoggerService.initialize(config),

  /**
   * Open the debugger UI
   */
  open: () => {
    // @ts-ignore
    if (global.__apiLoggerSetVisible) {
      // @ts-ignore
      global.__apiLoggerSetVisible(true);
    }
  },

  /**
   * Manually enable the logger (starts capturing and persists state)
   */
  enable: () => ApiLoggerService.enable(),

  /**
   * Manually disable the logger (stops capturing and persists state)
   */
  disable: () => ApiLoggerService.disable(),

  /**
   * Check if the logger is currently enabled
   */
  isEnabled: () => ApiLoggerService.isEnabled(),

  /**
   * Set the current screen name manually
   */
  setScreenName: (name: string) => ApiLoggerService.setScreenName(name),

  /**
   * Navigator observer for automatic screen tracking
   */
  navigatorObserver: () => new ApiNavigatorObserver(),
};

/**
 * Root component to be placed at the top of your app
 */
export const ApiLoggerRoot: React.FC = () => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // @ts-ignore
    global.__apiLoggerSetVisible = setVisible;
    return () => {
      // @ts-ignore
      global.__apiLoggerSetVisible = undefined;
    };
  }, []);

  if (!visible) return null;

  return <ApiLoggerUI visible={visible} onClose={() => setVisible(false)} />;
};

/**
 * Screen tracker component to be placed inside NavigationContainer
 */
export {
  ApiLoggerScreenTracker,
  ApiLoggerWrapper,
  ApiLoggerToggle,
  ApiLoggerButton,
};

export * from './models';
