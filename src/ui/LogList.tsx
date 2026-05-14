import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import ApiLoggerService from '../ApiLoggerService';
import type { ApiLog, ApiSession } from '../models';
import { Theme } from './theme';
import { DropdownMenu } from './DropdownMenu';
import {
  SearchIcon,
  EmailIcon,
  ShareIcon,
  MenuIcon,
  BackIcon,
  TimeIcon,
  PhoneIcon,
  EditIcon,
  DeleteIcon
} from './Icons';
import { HighlightedText } from './components/HighlightedText';
import { PromptModal } from './components/PromptModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { EmailModal } from './components/EmailModal';
import { generateHtmlReport } from '../utils/HtmlReportGenerator';

interface Props {
  session: ApiSession;
  onBack: () => void;
  onSelectLog: (log: ApiLog) => void;
}

export const LogList: React.FC<Props> = ({ session, onBack, onSelectLog }) => {
  const [search, setSearch] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState({ x: 0, y: 0 });
  const [renameModalVisible, setRenameModalVisible] = React.useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [emailModalVisible, setEmailModalVisible] = React.useState(false);

  const getMethodColor = (method: string) => {
    const m = method.toLowerCase();
    // @ts-ignore
    return Theme.colors.methods[m] || Theme.colors.methods.other;
  };

  const handleEditName = () => {
    setRenameModalVisible(true);
  };

  const handleSaveName = (newName: string) => {
    if (newName.trim()) {
      ApiLoggerService.renameSession(session.id, newName.trim());
    }
    setRenameModalVisible(false);
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    ApiLoggerService.deleteSession(session.id);
    setDeleteModalVisible(false);
    onBack();
  };

  const handleMenuPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuAnchor({ x: pageX, y: pageY + 20 });
    setMenuVisible(true);
  };

  const menuItems = [
    {
      label: 'Edit Name',
      icon: <EditIcon size={16} color={Theme.colors.text} />,
      onPress: handleEditName,
    },
    {
      label: 'Delete Session',
      icon: <DeleteIcon size={16} color={Theme.colors.error} />,
      isDestructive: true,
      onPress: handleDelete,
    },
  ];

  const formatBody = (body: any) => {
    if (!body) return 'No body';
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return body;
      }
    }
    try {
      return JSON.stringify(body, null, 2);
    } catch (e) {
      return '[Error stringifying body]';
    }
  };

  const formatLogForReport = (log: ApiLog) => {
    return `URL: ${log.url}
Method: ${log.method.toUpperCase()}
Status: ${log.statusCode || '---'}
Duration: ${log.duration}ms
Time: ${new Date(log.timestamp).toISOString()}
Screen: ${log.screenName || '/'}

[Request Headers]
${JSON.stringify(log.requestHeaders, null, 2)}

[Request Body]
${formatBody(log.requestBody)}

[Response Headers]
${JSON.stringify(log.responseHeaders, null, 2)}

[Response Body]
${formatBody(log.responseBody)}

--------------------------------------------------------------------------------
`;
  };

  const generateReportFiles = async (senderName?: string) => {
    const reportHeader = `API SESSION REPORT
Session: ${session.name}
ID: ${session.id}
Date: ${new Date(session.startTime).toLocaleString()}
${senderName ? `Sender: ${senderName}\n` : ''}Logs Count: ${session.logs.length}
================================================================================

`;
    const logsContent = session.logs.map(formatLogForReport).join('\n');
    const fullContent = reportHeader + logsContent;
    const fileName = `api_report_${session.id.substring(0, 8)}.txt`;
    const path = `${RNFS.CachesDirectoryPath}/${fileName}`;

    await RNFS.writeFile(path, fullContent, 'utf8');
    return { path, fileName, fullContent };
  };

  const handleSendEmail = async (recipients: string[], senderName: string) => {
    const config = ApiLoggerService.getConfig();
    const { smtpConfig } = config;

    const { path, fileName } = await generateReportFiles(senderName);
    const htmlBody = generateHtmlReport(session, senderName);

    if (smtpConfig) {
      try {
        // Attempt background send via SMTP if config is present
        // Using a dynamic require to avoid forcing dependency on all users
        const Mailer = require('react-native-smtp-mailer').default;
        await Mailer.sendMail({
          mailhost: smtpConfig.server,
          port: smtpConfig.port.toString(),
          ssl: smtpConfig.port === 465, // Typically 465 is SSL, 587 is TLS
          username: smtpConfig.username,
          password: smtpConfig.password || '',
          recipients: recipients.join(','),
          subject: `API Logs Report: ${session.name}`,
          htmlBody: htmlBody,
          attachmentPaths: [path],
          attachmentNames: [fileName],
          attachmentTypes: ['txt'], // Required for Android
        });
        Alert.alert('Success', 'Email report sent successfully.');
      } catch (e: any) {
        console.error('SMTP Send Error:', e);
        throw new Error(`Failed to send via SMTP: ${e.message}. Ensure react-native-smtp-mailer is installed.`);
      }
    } else {
      // Fallback to regular Share with email filter
      try {
        await Share.open({
          title: `API Logs: ${session.name}`,
          subject: `API Logs Report: ${session.name}`,
          message: `Summary:\nTotal Requests: ${session.logs.length}\nDate: ${new Date(session.startTime).toLocaleString()}\n\nPlease see the attached log file for full details.`,
          url: `file://${path}`,
          type: 'text/plain',
          email: recipients[0], // Pre-fill first recipient if possible
          failOnCancel: false,
        });
      } catch (e: any) {
        if (e.message !== 'User did not share') {
          throw e;
        }
      }
    }
  };

  const exportLogs = async () => {
    // Basic check to see if native modules are linked
    if (!RNFS.CachesDirectoryPath) {
      Alert.alert(
        'Feature Unavailable',
        'Sharing requires react-native-fs and react-native-share to be correctly installed and linked.'
      );
      return;
    }

    const { path, fileName, fullContent } = await generateReportFiles();

    // FOR DEBUGGING: Save a copy to Android Downloads folder
    if (Platform.OS === 'android' && RNFS.DownloadDirectoryPath) {
      try {
        const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        await RNFS.writeFile(downloadPath, fullContent, 'utf8');
        console.log('Debug: File saved to Downloads:', downloadPath);
      } catch (downloadErr) {
        console.warn('Debug: Could not save to Downloads (likely permission issue):', downloadErr);
      }
    }

    const shareOptions: any = {
      title: 'Share API Logs Report',
      type: 'text/plain',
      filename: fileName,
      url: `file://${path}`,
    };

    console.log('Share Options:', shareOptions);

    await Share.open(shareOptions).catch((error: any) => {
      if (error.message !== 'User did not share') {
        console.error('Share Export Error:', error);
      }
    });
  };

  const renderItem = ({ item }: { item: ApiLog }) => {
    const statusColor = item.isError ? Theme.colors.error : Theme.colors.success;
    const methodColor = getMethodColor(item.method);
    const dateObj = new Date(item.timestamp);

    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onSelectLog(item)}
      >
        <View style={styles.itemMain}>
          <View style={styles.itemTopRow}>
            <View style={styles.badgeRow}>
              <View style={[styles.methodBadge, { borderColor: methodColor }]}>
                <Text style={[styles.methodText, { color: methodColor }]}>{item.method.toUpperCase()}</Text>
              </View>
              <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{item.statusCode || '---'}</Text>
              </View>
            </View>
            <Text style={styles.itemTime}>{formattedTime}</Text>
          </View>

          <HighlightedText
            text={item.url}
            highlight={search}
            style={styles.url}
          />

          <View style={styles.itemBottomRow}>
            <View style={styles.metaInfo}>
              <TimeIcon size={12} color={Theme.colors.textSecondary} />
              <View style={{ width: 4 }} />
              <Text style={styles.metaText}>{item.duration}ms</Text>
              <View style={styles.metaSpace} />
              <PhoneIcon size={12} color={Theme.colors.textSecondary} />
              <View style={{ width: 4 }} />
              <Text style={styles.metaText} numberOfLines={1}>{item.screenName || '/'}</Text>
            </View>
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredLogs = session.logs.filter((l) =>
    l.url.toLowerCase().includes(search.toLowerCase()) ||
    l.method.toLowerCase().includes(search.toLowerCase())
  );

  const config = ApiLoggerService.getConfig();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <BackIcon size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        {!showSearch ? (
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title} numberOfLines={1}>API Logs</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{session.name}</Text>
          </View>
        ) : (
          <TextInput
            style={styles.headerSearchInput}
            placeholder="Search logs..."
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        )}
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.iconButton}>
            <SearchIcon size={20} color={Theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEmailModalVisible(true)} style={styles.iconButton}>
            <EmailIcon size={20} color={Theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={exportLogs} style={styles.iconButton}>
            <ShareIcon size={20} color={Theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleMenuPress} style={styles.iconButton}>
            <MenuIcon size={20} color={Theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
          <Text style={[styles.filterText, styles.activeFilterText]}>ALL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>SUCCESS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>ERROR</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredLogs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <DropdownMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        anchor={menuAnchor}
        items={menuItems}
      />

      <PromptModal
        visible={renameModalVisible}
        title="Edit Session Name"
        message="Enter a new name for this session"
        defaultValue={session.name}
        onCancel={() => setRenameModalVisible(false)}
        onSave={handleSaveName}
      />

      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Session"
        message="Are you sure you want to delete this session?"
        confirmText="Delete"
        isDestructive
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
      />

      <EmailModal
        visible={emailModalVisible}
        onClose={() => setEmailModalVisible(false)}
        onSend={handleSendEmail}
        defaultRecipients={config.smtpConfig?.defaultRecipients}
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
    alignItems: 'center',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    minHeight: 64,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.text,
    marginLeft: Theme.spacing.md,
    paddingVertical: 0,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  filterBar: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Theme.colors.surfaceVariant,
  },
  activeFilter: {
    backgroundColor: Theme.colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
  },
  activeFilterText: {
    color: '#FFF',
  },
  list: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  item: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: Theme.colors.border,
  },
  itemMain: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  methodText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemTime: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  url: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 10,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  metaSpace: {
    width: 12,
  },
});
