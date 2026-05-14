export interface ApiLog {
  id: string;
  sessionId: string;
  method: string;
  url: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  statusCode?: number;
  timestamp: number; // ms
  duration: number; // ms
  screenName?: string;
  isError: boolean;
}

export interface ApiSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  logs: ApiLog[];
}

export interface RecipientConfig {
  name: string;
  email: string;
}

export interface SmtpConfig {
  server: string;
  port: number;
  username: string;
  password?: string;
  fromEmail: string;
  defaultRecipients?: RecipientConfig[];
}

export interface ApiLoggerConfig {
  enabled?: boolean;
  maxLogsPerSession?: number;
  maxSessions?: number;
  enableInRelease?: boolean;
  initiallyEnabled?: boolean;
  smtpConfig?: SmtpConfig;
}
