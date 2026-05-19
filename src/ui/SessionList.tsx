import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import ApiLoggerService from '../ApiLoggerService';
import type { ApiSession } from '../models';
import { Theme } from './theme';
import { BackIcon } from './Icons';
import { ConfirmationModal } from './components/ConfirmationModal';

interface Props {
  onSelectSession: (session: ApiSession) => void;
  onBack: () => void;
}

export const SessionList: React.FC<Props> = ({ onSelectSession, onBack }) => {
  const [sessions, setSessions] = React.useState<ApiSession[]>(
    ApiLoggerService.getSessions()
  );
  const [clearAllVisible, setClearAllVisible] = React.useState(false);
  const [deleteSessionData, setDeleteSessionData] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  React.useEffect(() => {
    const unsubscribe = ApiLoggerService.subscribe(() => {
      setSessions([...ApiLoggerService.getSessions()]);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleDeleteSession = (id: string, name: string) => {
    setDeleteSessionData({ id, name });
  };

  const handleConfirmDelete = () => {
    if (deleteSessionData) {
      ApiLoggerService.deleteSession(deleteSessionData.id);
      setDeleteSessionData(null);
    }
  };

  const handleClearAll = () => {
    setClearAllVisible(true);
  };

  const handleConfirmClearAll = () => {
    ApiLoggerService.clearAll();
    setClearAllVisible(false);
  };

  const renderItem = ({ item }: { item: ApiSession }) => {
    const date = new Date(item.startTime);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = date.toLocaleTimeString([], { hour12: false });

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onSelectSession(item)}
        onLongPress={() => handleDeleteSession(item.id, item.name)}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSubtitle}>
            {formattedDate} at {formattedTime} • {item.logs.length} logs
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <BackIcon size={24} color={Theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>API Sessions</Text>
        </View>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearAll}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No sessions found</Text>}
      />

      <ConfirmationModal
        visible={clearAllVisible}
        title="Clear All Sessions"
        message="Are you sure you want to delete all recorded sessions? This action cannot be undone."
        confirmText="Clear All"
        isDestructive
        onCancel={() => setClearAllVisible(false)}
        onConfirm={handleConfirmClearAll}
      />

      <ConfirmationModal
        visible={!!deleteSessionData}
        title="Delete Session"
        message={`Are you sure you want to delete "${deleteSessionData?.name}"?`}
        confirmText="Delete"
        isDestructive
        onCancel={() => setDeleteSessionData(null)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: Theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  clearAll: {
    color: Theme.colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 20,
    color: Theme.colors.textSecondary,
    marginLeft: Theme.spacing.sm,
    fontWeight: '300',
  },
  separator: {
    height: 0, // Removed separator in favor of margin between cards
  },
  empty: {
    textAlign: 'center',
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xl,
    fontSize: 16,
  },
});
