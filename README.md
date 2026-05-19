# React Native API Tracker ⚡

[![npm version](https://img.shields.io/npm/v/@conversantech/react-native-api-tracker.svg)](https://www.npmjs.com/package/@conversantech/react-native-api-tracker)
[![license](https://img.shields.io/npm/l/@conversantech/react-native-api-tracker.svg)](https://github.com/conversantech/react-native-api-logger/blob/main/LICENSE)

A professional, **zero-boilerplate** network debugger for React Native. It automatically intercepts all outgoing network traffic (XMLHttpRequest/Fetch) and provides a beautiful, dashboard-style UI for inspection and reporting.

---

## 🚀 Key Features

- 🔌 **Zero-Config Interception**: Automatically catches all network traffic without changing your `fetch` or `axios` code.
- 📁 **Session-Based Logging**: API calls are grouped by session (one per app launch when enabled).
- 📧 **SMTP Dashboard Reports**: Send professional HTML summary emails with full `.txt` log attachments.
- 🔒 **Persistent Enable State**: Remembers if the logger is ON or OFF across app restarts.
- 📱 **Screen Tracking**: Automatically associates API calls with the screen they originated from.
- 🕵️ **Secret Activation**: Invisible tap gestures to reveal the debugger (e.g., 6 rapid taps).
- 🚥 **Dual Integration**: Choose between programmatic control (methods) or ready-made UI components.

---

## 📦 Installation

```bash
npm install @conversantech/react-native-api-tracker
# or
yarn add @conversantech/react-native-api-tracker
```

### Dependencies
This package requires the following peer dependencies:
- `@react-native-async-storage/async-storage`
- `react-native-fs`
- `react-native-share`
- `react-native-smtp-mailer` (Optional, for email reporting)

---

## 🛠️ Quick Start

### 1. Initialize
Call `ApiLogger.initialize()` at the entry point of your app (usually `index.js` or `App.tsx`).

```tsx
import { ApiLogger } from '@conversantech/react-native-api-tracker';

ApiLogger.initialize({
  enabled: true, // Default: true
  maxSessions: 10, // Keep last 10 sessions
  enableInRelease: false, // Security: Disable in production by default
});
```

### 2. Wrap your App
Place `ApiLoggerRoot` at the very top of your component tree.

```tsx
import { ApiLoggerRoot } from '@conversantech/react-native-api-tracker';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <ApiLoggerRoot />
      <YourAppContent />
    </View>
  );
}
```

---

## 🚥 Integration Options

### Option 1: Programmatic Methods
Control the logger from your own custom buttons or settings screens.

```tsx
import { ApiLogger } from '@conversantech/react-native-api-tracker';

// Enable/Disable (Persists state automatically)
await ApiLogger.enable();
await ApiLogger.disable();

// Check status
const isOn = ApiLogger.isEnabled();

// Open the Session List UI
ApiLogger.open();
```

### Option 2: Ready-made Components
Drop these components anywhere in your app for instant functionality.

#### `ApiLoggerToggle`
Wrap any element (like a logo or version text) to create a secret toggle.
```tsx
<ApiLoggerToggle tapCount={3}>
  <Text>Version 1.0 (Tap 3x to Toggle Debugger)</Text>
</ApiLoggerToggle>
```

#### `ApiLoggerButton`
A customizable button to open the logs.
```tsx
<ApiLoggerButton 
  text="View Network History" 
  style={{ backgroundColor: '#6200EE' }} 
/>
```

#### `ApiLoggerWrapper`
Wrap your whole app for a "Secret Activation" (invisible trigger).
```tsx
<ApiLoggerWrapper tapCount={6}>
  <AppContent />
</ApiLoggerWrapper>
```

---

## 📧 Email Reporting (SMTP)
To enable professional email reports, provide an `smtpConfig` during initialization.

```tsx
ApiLogger.initialize({
  smtpConfig: {
    server: 'smtp.gmail.com',
    port: 587,
    username: 'your-email@gmail.com',
    password: 'app-password',
    defaultRecipients: [
      { name: 'Dev Team', email: 'dev@example.com' }
    ],
  }
});
```
*The email includes a high-level HTML summary dashboard and an attached `.txt` file for full technical logs.*

---

## 📱 Screen Tracking
To automatically log which screen triggered an API call, use the `ApiLoggerScreenTracker` inside your `NavigationContainer`.

```tsx
import { ApiLoggerScreenTracker } from '@conversantech/react-native-api-tracker';

<NavigationContainer>
  <ApiLoggerScreenTracker />
  <AppStack />
</NavigationContainer>
```

---

## Created & Maintained By

This package is created and maintained by [Conversantech](https://conversantech.com).

## License

This project is licensed under the BSD-3-Clause License - see the [LICENSE](LICENSE) file for details.
Copyright (c) 2026 Conversantech.
