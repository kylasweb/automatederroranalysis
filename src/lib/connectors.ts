import { db } from './db';

export interface TeamsConfig {
  webhookUrl: string;
  channel?: string;
  title?: string;
  color?: string;
  mentionUsers?: string[];
  mentionGroups?: string[];
}

export interface JiraConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
  projectKey: string;
  issueType?: string;
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  issueLabels?: string[];
}

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  from: string;
  to: string[];
  subject?: string;
}

export interface WebhookConfig {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
}

export type ConnectorConfig = 
  | TeamsConfig 
  | JiraConfig 
  | GitHubConfig 
  | SlackConfig 
  | EmailConfig 
  | WebhookConfig;

export class ConnectorService {
  static async sendToTeams(connectorId: string, message: string, title?: string) {
    try {
      const connector = await db.connector.findUnique({
        where: { id: connectorId }
      });

      if (!connector || connector.type !== 'TEAMS') {
        throw new Error('Invalid Teams connector');
      }

      const config = JSON.parse(connector.config) as TeamsConfig;
      
      if (!config.webhookUrl) {
        throw new Error('Teams webhook URL is required');
      }

      const payload = {
        title: title || config.title || 'Notification',
        text: message,
        themeColor: config.color || '0076D7'
      };

      if (config.mentionUsers && config.mentionUsers.length > 0) {
        const mentions = config.mentionUsers.map(user => `<at>${user}</at>`).join(' ');
        payload.text = `${mentions}\n${message}`;
      }

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Teams webhook failed: ${response.status}`);
      }

      return { success: true, message: 'Message sent to Teams successfully' };
    } catch (error) {
      console.error('Error sending to Teams:', error);
      throw error;
    }
  }

  static async testTeamsConnection(config: TeamsConfig) {
    try {
      if (!config.webhookUrl) {
        throw new Error('Teams webhook URL is required');
      }

      const testMessage = {
        title: 'Test Connection',
        text: 'This is a test message from the connector system',
        themeColor: '28A745'
      };

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
      });

      if (!response.ok) {
        throw new Error(`Teams connection test failed: ${response.status}`);
      }

      return { success: true, message: 'Teams connection test successful' };
    } catch (error) {
      console.error('Teams connection test failed:', error);
      throw error;
    }
  }

  static async validateTeamsConfig(config: Partial<TeamsConfig>) {
    const errors: string[] = [];

    if (!config.webhookUrl) {
      errors.push('Webhook URL is required');
    } else if (!config.webhookUrl.startsWith('https://')) {
      errors.push('Webhook URL must be a valid HTTPS URL');
    }

    if (config.mentionUsers && !Array.isArray(config.mentionUsers)) {
      errors.push('Mention users must be an array');
    }

    if (config.mentionGroups && !Array.isArray(config.mentionGroups)) {
      errors.push('Mention groups must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static getDefaultTeamsConfig(): TeamsConfig {
    return {
      webhookUrl: '',
      channel: 'General',
      title: 'System Notification',
      color: '0076D7',
      mentionUsers: [],
      mentionGroups: []
    };
  }

  static getTeamsConfigSchema() {
    return {
      type: 'object',
      properties: {
        webhookUrl: {
          type: 'string',
          description: 'Microsoft Teams incoming webhook URL',
          format: 'uri'
        },
        channel: {
          type: 'string',
          description: 'Default channel for notifications',
          default: 'General'
        },
        title: {
          type: 'string',
          description: 'Default title for messages',
          default: 'System Notification'
        },
        color: {
          type: 'string',
          description: 'Theme color for message cards',
          default: '0076D7',
          pattern: '^[0-9A-Fa-f]{6}$'
        },
        mentionUsers: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'List of users to mention in notifications',
          default: []
        },
        mentionGroups: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'List of groups to mention in notifications',
          default: []
        }
      },
      required: ['webhookUrl']
    };
  }
}