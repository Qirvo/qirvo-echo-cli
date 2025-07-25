import axios from 'axios';
import chalk from 'chalk';
import { ConfigService } from './ConfigService';
import { FirebaseAuthService } from './FirebaseAuthService';

// Type definitions for axios compatibility
type AxiosInstance = ReturnType<typeof axios.create>;
type AxiosResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
  request?: any;
};

export interface ApiResponse {
  success: boolean;
  output?: string;
  error?: string;
  data?: any;
  status?: number;
}

export class ApiService {
  private client: AxiosInstance;
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get a fresh authentication token using backend authentication
   */
  private async getFreshAuthToken(): Promise<string | null> {
    // Use stored token from backend authentication
    return this.configService.getAuthToken() || null;
  }

  /**
   * Authenticate with backend using email/password
   */
  async authenticateWithBackend(email: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const response = await this.client.post(`${this.getApiUrl()}/api/auth/login`, {
        email,
        password
      });

      if (response.data.success && response.data.token) {
        // Store the authentication token
        this.configService.setAuthToken(response.data.token);
        console.log(chalk.green('✅ Authentication successful'));
        return { success: true, token: response.data.token };
      } else {
        return { success: false, error: response.data.error || 'Authentication failed' };
      }
    } catch (error: any) {
      console.error(chalk.red('❌ Authentication failed'));
      if (error.response?.data?.error) {
        return { success: false, error: error.response.data.error };
      }
      return { success: false, error: error.message || 'Network error' };
    }
  }

  private getApiUrl(): string {
    return this.configService.getApiUrl();
  }

  async executeCommand(command: string, args: string[] = []): Promise<ApiResponse> {
    try {
      // Get fresh authentication token
      const authToken = await this.getFreshAuthToken();
      if (!authToken) {
        return {
          success: false,
          error: 'No authentication token available. Please run "e config setup" first.'
        };
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };

      const payload = {
        command,
        args,
        userId: this.configService.getUserId()
      };

      const response: AxiosResponse<any> = await this.client.post(`${this.getApiUrl()}/api/echo-command`, payload, {
        headers
      });

      return {
        success: true,
        output: response.data.output || 'Command executed successfully',
        data: response.data
      };
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.output || error.response.data?.message || 'API request failed',
          status: error.response.status
        };
      } else {
        return {
          success: false,
          error: error.message || 'Unknown error occurred'
        };
      }
    }
  }

  // Task operations
  async getTasks(): Promise<string> {
    const result = await this.executeCommand(':task list');
    return result.success ? (result.output || '') : (result.error || 'Failed to get tasks');
  }

  async addTask(title: string, description?: string): Promise<string> {
    const args = [title];
    if (description) {
      args.push('--description', description);
    }
    const result = await this.executeCommand(':task add', args);
    return result.success ? (result.output || '') : (result.error || 'Failed to add task');
  }

  async completeTask(taskId: string): Promise<string> {
    const result = await this.executeCommand(':task complete', [taskId]);
    return result.success ? (result.output || '') : (result.error || 'Failed to complete task');
  }

  async deleteTask(taskId: string): Promise<string> {
    const result = await this.executeCommand(':task delete', [taskId]);
    return result.success ? (result.output || '') : (result.error || 'Failed to delete task');
  }

  // Git operations
  async gitStatus(): Promise<string> {
    const result = await this.executeCommand(':git status');
    return result.success ? (result.output || '') : (result.error || 'Failed to get git status');
  }

  async gitCommit(message: string): Promise<string> {
    const result = await this.executeCommand(`:git commit "${message}"`);
    return result.success ? (result.output || '') : (result.error || 'Failed to commit changes');
  }

  async gitBranches(): Promise<string> {
    const result = await this.executeCommand(':git branches');
    return result.success ? (result.output || '') : (result.error || 'Failed to get git branches');
  }

  // AI Agent
  async askAgent(question: string): Promise<string> {
    const result = await this.executeCommand(`:agent "${question}"`);
    return result.success ? (result.output || '') : (result.error || 'Failed to ask agent');
  }

  // Memory operations
  async getMemories(): Promise<string> {
    const result = await this.executeCommand(':memory list');
    return result.success ? (result.output || '') : (result.error || 'Failed to get memories');
  }

  async saveMemory(title: string, content: string): Promise<string> {
    let command = `:memory save "${title}"`;
    if (content) {
      command += ` --content "${content}"`;
    }
    const result = await this.executeCommand(command);
    return result.success ? (result.output || '') : (result.error || 'Failed to save memory');
  }

  async searchMemories(query: string): Promise<string> {
    const result = await this.executeCommand(`:memory search "${query}"`);
    return result.success ? (result.output || '') : (result.error || 'Failed to search memories');
  }

  async getMemory(id: string): Promise<string> {
    const result = await this.executeCommand(`:memory get ${id}`);
    return result.success ? (result.output || '') : (result.error || 'Failed to get memory');
  }

  async deleteMemory(id: string): Promise<string> {
    const result = await this.executeCommand(`:memory delete ${id}`);
    return result.success ? (result.output || '') : (result.error || 'Failed to delete memory');
  }

  // Logs operations
  async getLogs(): Promise<string> {
    const result = await this.executeCommand(':logs list');
    return result.success ? (result.output || '') : (result.error || 'Failed to get logs');
  }

  async getLogsStats(): Promise<string> {
    const result = await this.executeCommand(':logs stats');
    return result.success ? (result.output || '') : (result.error || 'Failed to get logs stats');
  }

  async getLogsToday(): Promise<string> {
    const result = await this.executeCommand(':logs today');
    return result.success ? (result.output || '') : (result.error || 'Failed to get today\'s logs');
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.executeCommand('test');
      return result.success;
    } catch {
      return false;
    }
  }
}
