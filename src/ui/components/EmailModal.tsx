import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Theme } from '../theme';
import type { RecipientConfig } from '../../models';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSend: (recipients: string[], senderName: string) => Promise<void>;
  defaultRecipients?: RecipientConfig[];
  initialSenderName?: string;
}

export const EmailModal: React.FC<Props> = ({
  visible,
  onClose,
  onSend,
  defaultRecipients = [],
  initialSenderName = '',
}) => {
  const [selectedRecipients, setSelectedRecipients] = React.useState<string[]>(
    []
  );
  const [senderName, setSenderName] = React.useState(initialSenderName);
  const [customEmail, setCustomEmail] = React.useState('');
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setSelectedRecipients([]);
      setSenderName(initialSenderName);
      setCustomEmail('');
      setSending(false);
    }
  }, [visible, initialSenderName]);

  const toggleRecipient = (email: string) => {
    if (selectedRecipients.includes(email)) {
      setSelectedRecipients(selectedRecipients.filter((e) => e !== email));
    } else {
      setSelectedRecipients([...selectedRecipients, email]);
    }
  };

  const addCustomEmail = () => {
    const trimmed = customEmail.trim();
    if (trimmed && !selectedRecipients.includes(trimmed)) {
      if (trimmed.includes('@')) {
        setSelectedRecipients([...selectedRecipients, trimmed]);
        setCustomEmail('');
      } else {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      }
    }
  };

  const handleSend = async () => {
    if (selectedRecipients.length === 0) {
      Alert.alert(
        'No Recipients',
        'Please select or enter at least one recipient.'
      );
      return;
    }

    setSending(true);
    try {
      await onSend(selectedRecipients, senderName.trim());
      onClose();
    } catch (error: any) {
      Alert.alert('Send Error', error.message || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Send Email Report</Text>
          <Text style={styles.subtitle}>
            Configure and send the session report
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Name</Text>
            <TextInput
              style={styles.inputLarge}
              placeholder="Enter your name..."
              placeholderTextColor="#999"
              value={senderName}
              onChangeText={setSenderName}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recipients</Text>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
            >
              {defaultRecipients.map((recipient) => (
                <TouchableOpacity
                  key={recipient.email}
                  style={[
                    styles.chip,
                    selectedRecipients.includes(recipient.email) &&
                      styles.chipSelected,
                  ]}
                  onPress={() => toggleRecipient(recipient.email)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedRecipients.includes(recipient.email) &&
                        styles.chipTextSelected,
                    ]}
                  >
                    {recipient.name} ({recipient.email})
                  </Text>
                </TouchableOpacity>
              ))}

              {selectedRecipients
                .filter(
                  (email) => !defaultRecipients.some((r) => r.email === email)
                )
                .map((email) => (
                  <TouchableOpacity
                    key={email}
                    style={[styles.chip, styles.chipSelected]}
                    onPress={() => toggleRecipient(email)}
                  >
                    <Text style={[styles.chipText, styles.chipTextSelected]}>
                      {email}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.inputLarge, { flex: 1 }]}
              placeholder="Add custom email..."
              placeholderTextColor="#999"
              value={customEmail}
              onChangeText={setCustomEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onSubmitEditing={addCustomEmail}
            />
            <TouchableOpacity style={styles.addButton} onPress={addCustomEmail}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={sending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.sendButton,
                selectedRecipients.length === 0 && styles.disabledButton,
              ]}
              onPress={handleSend}
              disabled={sending || selectedRecipients.length === 0}
            >
              {sending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.sendButtonText}>Send Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: 24,
    maxHeight: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  inputLarge: {
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#000', // Solid black for better visibility
    backgroundColor: '#FFF',
  },
  scroll: {
    maxHeight: 180,
  },
  scrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
  },
  chipSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Theme.colors.text,
  },
  chipTextSelected: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    height: 52,
    justifyContent: 'center',
    borderRadius: Theme.borderRadius.md,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: Theme.colors.primary,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
