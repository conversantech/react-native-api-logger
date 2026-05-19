import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Theme } from './theme';

interface MenuItem {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  isDestructive?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
  anchor: { x: number; y: number };
}

export const DropdownMenu: React.FC<Props> = ({
  visible,
  onClose,
  items,
  anchor,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View
            style={[
              styles.menu,
              {
                top: anchor.y,
                right: Dimensions.get('window').width - anchor.x,
              },
            ]}
          >
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.item, index < items.length - 1 && styles.border]}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
              >
                {item.icon && (
                  <View style={styles.iconContainer}>{item.icon}</View>
                )}
                <Text
                  style={[
                    styles.label,
                    item.isDestructive && styles.destructiveText,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  iconContainer: {
    marginRight: Theme.spacing.sm,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: Theme.colors.text,
  },
  destructiveText: {
    color: Theme.colors.error,
  },
});
