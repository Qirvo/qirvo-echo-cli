import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';

export interface EchoConfig {
  apiUrl?: string;
  userId?: string;
  authToken?: string;
  firebaseEmail?: string;
  firebasePassword?: string;
}

export class ConfigService {
  private config: Conf<EchoConfig>;

  constructor() {
    this.config = new Conf<EchoConfig>({
      projectName: 'echo-cli',
      projectSuffix: '',
      configName: 'config',
      cwd: join(homedir(), '.echo-cli'),
      defaults: {
        apiUrl: 'https://app.qirvo.ai'
      }
    });
  }

  getApiUrl(): string {
    return this.config.get('apiUrl') || 'https://app.qirvo.ai';
  }

  getUserId(): string | undefined {
    return this.config.get('userId');
  }

  getAuthToken(): string | undefined {
    return this.config.get('authToken');
  }

  setApiUrl(apiUrl: string): void {
    this.config.set('apiUrl', apiUrl);
  }

  setUserId(userId: string): void {
    this.config.set('userId', userId);
  }

  setAuthToken(authToken: string): void {
    this.config.set('authToken', authToken);
  }

  isConfigured(): boolean {
    const apiUrl = this.getApiUrl();
    const userId = this.getUserId();
    const authToken = this.getAuthToken();

    return !!(apiUrl && userId && authToken);
  }

  getAll(): EchoConfig {
    return {
      apiUrl: this.getApiUrl(),
      userId: this.getUserId(),
      authToken: this.getAuthToken()
    };
  }

  clear(): void {
    this.config.clear();
  }

  getConfigPath(): string {
    return this.config.path;
  }

  // Firebase credential management
  setFirebaseCredentials(email: string, password: string): void {
    this.config.set('firebaseEmail', email);
    this.config.set('firebasePassword', password);
  }

  getFirebaseCredentials(): { email: string; password: string } | null {
    const email = this.config.get('firebaseEmail');
    const password = this.config.get('firebasePassword');

    if (email && password) {
      return { email, password };
    }

    return null;
  }

  clearFirebaseCredentials(): void {
    this.config.delete('firebaseEmail');
    this.config.delete('firebasePassword');
  }
}
