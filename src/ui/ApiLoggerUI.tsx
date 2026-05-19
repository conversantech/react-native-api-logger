import React from 'react';
import { Modal, SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import type { ApiLog, ApiSession } from '../models';
import { SessionList } from './SessionList';
import { LogList } from './LogList';
import { LogDetail } from './LogDetail';
import { Theme } from './theme';
import ApiLoggerService from '../ApiLoggerService';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ApiLoggerUI: React.FC<Props> = ({ visible, onClose }) => {
  const [selectedSession, setSelectedSession] =
    React.useState<ApiSession | null>(null);
  const [selectedLog, setSelectedLog] = React.useState<ApiLog | null>(null);

  React.useEffect(() => {
    const unsubscribe = ApiLoggerService.subscribe(() => {
      if (selectedSession) {
        // Refresh selected session data from the service
        const updated = ApiLoggerService.getSessions().find(
          (s) => s.id === selectedSession.id
        );
        if (updated) {
          setSelectedSession({ ...updated });
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, [selectedSession]);

  const handleBack = () => {
    if (selectedLog) {
      setSelectedLog(null);
    } else if (selectedSession) {
      setSelectedSession(null);
    } else {
      onClose();
    }
  };

  const renderContent = () => {
    if (selectedLog) {
      return (
        <LogDetail log={selectedLog} onBack={() => setSelectedLog(null)} />
      );
    }

    if (selectedSession) {
      return (
        <LogList
          session={selectedSession}
          onBack={() => setSelectedSession(null)}
          onSelectLog={setSelectedLog}
        />
      );
    }

    return (
      <SessionList onSelectSession={setSelectedSession} onBack={onClose} />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleBack}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>{renderContent()}</SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
});
