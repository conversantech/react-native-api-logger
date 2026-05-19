import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiLoggerConfig, ApiLog, ApiSession } from './models';
import { uuid } from './uuid';
import { initializeNetworkInterceptor } from './NetworkInterceptor';

const STORAGE_KEY_SESSIONS = '@api_logger_sessions';
const STORAGE_KEY_ENABLED = '@api_logger_enabled';

class ApiLoggerService {
  private config: ApiLoggerConfig = {
    enabled: true,
    maxSessions: 10,
    enableInRelease: false,
  };

  private sessions: ApiSession[] = [];
  private currentSessionId: string | null = null;
  private isInitialized: boolean = false;
  private subscribers: Set<() => void> = new Set();
  private currentScreenName: string = '';

  async initialize(config: ApiLoggerConfig = {}) {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };

    // Initialize network interception immediately
    initializeNetworkInterceptor();

    const isRelease = !__DEV__;
    if (isRelease && !this.config.enableInRelease) {
      this.config.enabled = false;
    } else {
      if (this.config.initiallyEnabled !== undefined) {
        this.config.enabled = this.config.initiallyEnabled;
        await this.persistEnabledState(this.config.enabled);
      } else {
        const persistedEnabled =
          await AsyncStorage.getItem(STORAGE_KEY_ENABLED);
        if (persistedEnabled !== null) {
          this.config.enabled = persistedEnabled === 'true';
        }
      }
    }

    await this.loadSessions();

    if (this.config.enabled) {
      this.startNewSession();
    }

    this.isInitialized = true;
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach((sub) => sub());
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private async persistEnabledState(enabled: boolean) {
    await AsyncStorage.setItem(STORAGE_KEY_ENABLED, enabled.toString());
  }

  async enable() {
    if (this.config.enabled) return;
    this.config.enabled = true;
    await this.persistEnabledState(true);
    this.startNewSession();
    this.notifySubscribers();
  }

  async disable() {
    if (!this.config.enabled) return;
    this.config.enabled = false;
    await this.persistEnabledState(false);
    this.currentSessionId = null;
    this.notifySubscribers();
  }

  isEnabled(): boolean {
    return !!this.config.enabled;
  }

  setScreenName(name: string) {
    this.currentScreenName = name;
  }

  getCurrentScreenName(): string {
    return this.currentScreenName;
  }

  private async loadSessions() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_SESSIONS);
      if (data) {
        this.sessions = JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
  }

  private async saveSessions() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_SESSIONS,
        JSON.stringify(this.sessions)
      );
      this.notifySubscribers();
    } catch (e) {
      console.error('Failed to save sessions', e);
    }
  }

  private startNewSession() {
    if (!this.config.enabled) return;

    const newSession: ApiSession = {
      id: uuid(),
      name: `Session ${new Date().toLocaleString()}`,
      startTime: Date.now(),
      logs: [],
    };

    this.sessions.unshift(newSession);
    this.currentSessionId = newSession.id;

    if (this.sessions.length > (this.config.maxSessions || 10)) {
      this.sessions = this.sessions.slice(0, this.config.maxSessions);
    }

    this.saveSessions();
  }

  // Backward compatibility alias
  addLog(log: Partial<ApiLog>) {
    return this.logRequest(log);
  }

  async logRequest(log: Partial<ApiLog>): Promise<string | null> {
    if (!this.config.enabled) return null;

    if (!this.currentSessionId) {
      this.startNewSession();
    }

    const session = this.sessions.find((s) => s.id === this.currentSessionId);
    if (!session || !this.currentSessionId) return null;

    const fullLog: ApiLog = {
      id: uuid(),
      sessionId: this.currentSessionId,
      url: log.url || '',
      method: log.method || '',
      requestHeaders: log.requestHeaders || {},
      requestBody: log.requestBody,
      timestamp: Date.now(),
      duration: 0,
      isError: false,
      screenName: this.currentScreenName,
      ...log,
    };

    session.logs.unshift(fullLog);

    if (
      this.config.maxLogsPerSession &&
      session.logs.length > this.config.maxLogsPerSession
    ) {
      session.logs = session.logs.slice(0, this.config.maxLogsPerSession);
    }

    this.saveSessions();
    return fullLog.id;
  }

  async logResponse(logId: string, response: Partial<ApiLog>) {
    if (!this.config.enabled) return;

    const session = this.sessions.find((s) => s.id === this.currentSessionId);
    if (!session) return;

    const logIndex = session.logs.findIndex((l) => l.id === logId);
    if (logIndex === -1) return;

    const logEntry = session.logs[logIndex];
    if (logEntry) {
      session.logs[logIndex] = {
        ...logEntry,
        ...response,
        duration: Date.now() - logEntry.timestamp,
      } as ApiLog;
    }

    this.saveSessions();
  }

  getSessions(): ApiSession[] {
    return this.sessions;
  }

  getConfig(): ApiLoggerConfig {
    return this.config;
  }

  renameSession(id: string, newName: string) {
    const session = this.sessions.find((s) => s.id === id);
    if (session) {
      session.name = newName;
      this.saveSessions();
    }
  }

  deleteSession(id: string) {
    this.sessions = this.sessions.filter((s) => s.id !== id);
    if (this.currentSessionId === id) {
      this.currentSessionId = null;
    }
    this.saveSessions();
  }

  clearAll() {
    this.sessions = [];
    this.currentSessionId = null;
    this.saveSessions();
  }
}

export default new ApiLoggerService();
