import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Clipboard,
  TextInput,
} from 'react-native';
import type { ApiLog } from '../models';
import { Theme } from './theme';
import { BackIcon, SearchIcon, CopyIcon, CloseIcon } from './Icons';
import { HighlightedText } from './components/HighlightedText';

interface Props {
  log: ApiLog;
  onBack: () => void;
}

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.sectionHeaderContainer}>
    <View style={styles.sectionBar} />
    <Text style={styles.sectionTitleText}>{title}</Text>
  </View>
);

const OverviewRow: React.FC<{
  label: string;
  value: string;
  highlight: string;
  valueColor?: string;
}> = ({ label, value, highlight, valueColor }) => (
  <View style={styles.overviewRow}>
    <Text style={styles.overviewLabel}>{label}</Text>
    <HighlightedText
      text={value}
      highlight={highlight}
      style={[styles.overviewValue, valueColor ? { color: valueColor } : {}]}
    />
  </View>
);

export const LogDetail: React.FC<Props> = ({ log, onBack }) => {
  const [activeTab, setActiveTab] = React.useState<'request' | 'response'>(
    'request'
  );
  const [search, setSearch] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);

  const copyToClipboard = (content: any) => {
    const text =
      typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    Clipboard.setString(text);
  };

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

  const getMethodColor = (method: string) => {
    const m = method.toLowerCase();
    // @ts-ignore
    return Theme.colors.methods[m] || Theme.colors.methods.other;
  };

  const formattedDate = (() => {
    const d = new Date(log.timestamp);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  })();

  const formattedTime = new Date(log.timestamp).toLocaleTimeString([], {
    hour12: false,
  });

  const renderRequest = () => (
    <ScrollView style={styles.content}>
      <SectionTitle title="Overview" />
      <View style={styles.sectionContent}>
        <OverviewRow label="URL" value={log.url} highlight={search} />
        <OverviewRow
          label="Method"
          value={log.method.toUpperCase()}
          highlight={search}
          valueColor={getMethodColor(log.method)}
        />
        <OverviewRow label="Time" value={formattedTime} highlight={search} />
        <OverviewRow label="Date" value={formattedDate} highlight={search} />
        <OverviewRow
          label="Duration"
          value={`${log.duration}ms`}
          highlight={search}
        />
        <OverviewRow
          label="Screen"
          value={log.screenName || '/'}
          highlight={search}
        />
      </View>

      <SectionTitle title="Headers" />
      <View style={styles.codeBlock}>
        <HighlightedText
          text={JSON.stringify(log.requestHeaders, null, 2)}
          highlight={search}
          style={styles.codeText}
        />
      </View>

      <SectionTitle title="Body" />
      <View style={styles.codeBlock}>
        <HighlightedText
          text={formatBody(log.requestBody)}
          highlight={search}
          style={styles.codeText}
        />
      </View>
    </ScrollView>
  );

  const renderResponse = () => (
    <ScrollView style={styles.content}>
      <SectionTitle title="Overview" />
      <View style={styles.sectionContent}>
        <OverviewRow
          label="Status Code"
          value={log.statusCode?.toString() || '---'}
          highlight={search}
          valueColor={log.isError ? Theme.colors.error : Theme.colors.success}
        />
      </View>

      <SectionTitle title="Headers" />
      <View style={styles.codeBlock}>
        <HighlightedText
          text={JSON.stringify(log.responseHeaders, null, 2)}
          highlight={search}
          style={styles.codeText}
        />
      </View>

      <SectionTitle title="Body" />
      <View style={styles.codeBlock}>
        <HighlightedText
          text={formatBody(log.responseBody)}
          highlight={search}
          style={styles.codeText}
        />
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerIcon}>
          <BackIcon size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        {!showSearch ? (
          <Text style={styles.headerTitle}>Log Details</Text>
        ) : (
          <TextInput
            style={styles.searchInput}
            placeholder="Search in details..."
            value={search}
            onChangeText={setSearch}
            autoFocus
            autoCapitalize="none"
          />
        )}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => {
              if (showSearch && search) {
                setSearch('');
                setShowSearch(false);
              } else {
                setShowSearch(!showSearch);
              }
            }}
          >
            {showSearch && search ? (
              <CloseIcon size={22} color={Theme.colors.text} />
            ) : (
              <SearchIcon
                size={22}
                color={showSearch ? Theme.colors.primary : Theme.colors.text}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => {
              const requestHeaders = JSON.stringify(
                log.requestHeaders,
                null,
                2
              );
              const requestBody = formatBody(log.requestBody);
              const responseHeaders = JSON.stringify(
                log.responseHeaders,
                null,
                2
              );
              const responseBody = formatBody(log.responseBody);

              const text = `URL: ${log.url}
Method: ${log.method.toUpperCase()}
Status: ${log.statusCode || '---'}
Duration: ${log.duration}ms

[Request Headers]
${requestHeaders}

[Request Body]
${requestBody}

[Response Headers]
${responseHeaders}

[Response Body]
${responseBody}`;

              copyToClipboard(text);
            }}
          >
            <CopyIcon size={22} color={Theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'request' && styles.activeTab]}
          onPress={() => setActiveTab('request')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'request' && styles.activeTabText,
            ]}
          >
            Request
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'response' && styles.activeTab]}
          onPress={() => setActiveTab('response')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'response' && styles.activeTabText,
            ]}
          >
            Response
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'request' ? renderRequest() : renderResponse()}
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
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    minHeight: 60,
  },
  headerIcon: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.text,
    marginLeft: Theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.text,
    marginLeft: Theme.spacing.md,
    paddingVertical: 0,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  activeTabText: {
    color: Theme.colors.primary,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  sectionBar: {
    width: 4,
    height: 18,
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
    marginRight: Theme.spacing.sm,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.primary,
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: Theme.colors.border,
  },
  overviewRow: {
    flexDirection: 'row',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  overviewLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  overviewValue: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: '500',
  },
  codeBlock: {
    backgroundColor: '#F8F9FA',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
});
