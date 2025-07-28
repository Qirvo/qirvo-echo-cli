import { Command } from 'commander';
import chalk from 'chalk';
import { ApiService } from '../services/ApiService';
import { ConfigService } from '../services/ConfigService';

const RemoteCommandHandler = require('../remote-command-handler');

export class RemoteCommand {
  private apiService: ApiService;
  private configService: ConfigService;
  private remoteHandler: any = null;

  constructor(apiService: ApiService, configService: ConfigService) {
    this.apiService = apiService;
    this.configService = configService;
  }

  getCommand(): Command {
    const command = new Command('remote');
    command.description('Remote command execution - listen for commands from dashboard');

    // Start remote listener
    command
      .command('start')
      .description('Start listening for remote commands from dashboard')
      .option('-u, --url <url>', 'Dashboard URL', 'https://app.qirvo.ai')
      .action(async (options) => {
        await this.startRemoteListener(options.url);
      });

    // Stop remote listener
    command
      .command('stop')
      .description('Stop listening for remote commands')
      .action(async () => {
        await this.stopRemoteListener();
      });

    // Show remote status
    command
      .command('status')
      .description('Show remote command listener status')
      .action(async () => {
        await this.showStatus();
      });

    // Test remote connection
    command
      .command('test')
      .description('Test connection to dashboard')
      .option('-u, --url <url>', 'Dashboard URL', 'https://app.qirvo.ai')
      .action(async (options) => {
        await this.testConnection(options.url);
      });

    return command;
  }

  private async startRemoteListener(dashboardUrl: string): Promise<void> {
    try {
      console.log(chalk.cyan('🚀 Starting remote command listener...'));

      // Check if already running
      if (this.remoteHandler && this.remoteHandler.isActive) {
        console.log(chalk.yellow('⚠️  Remote listener is already running'));
        return;
      }

      // Get authentication token
      const token = await this.getAuthToken();
      if (!token) {
        console.log(chalk.red('❌ Authentication required. Please run: e config login'));
        return;
      }

      // Initialize remote handler
      this.remoteHandler = new RemoteCommandHandler(dashboardUrl, token);

      // Start listening
      await this.remoteHandler.start();

      console.log(chalk.green('✅ Remote command listener started successfully'));
      console.log(chalk.gray(`📡 Listening for commands from: ${dashboardUrl}`));
      console.log(chalk.gray('💡 You can now send commands from the dashboard'));
      console.log(chalk.gray('🛑 Press Ctrl+C to stop the listener'));

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n🛑 Shutting down remote listener...'));
        await this.stopRemoteListener();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log(chalk.yellow('\n🛑 Shutting down remote listener...'));
        await this.stopRemoteListener();
        process.exit(0);
      });

      // Keep the process alive
      await this.keepAlive();

    } catch (error: any) {
      console.error(chalk.red('❌ Failed to start remote listener:'), error.message);
      process.exit(1);
    }
  }

  private async stopRemoteListener(): Promise<void> {
    try {
      if (!this.remoteHandler) {
        console.log(chalk.yellow('⚠️  Remote listener is not running'));
        return;
      }

      console.log(chalk.cyan('🛑 Stopping remote command listener...'));
      await this.remoteHandler.stop();
      this.remoteHandler = null;
      console.log(chalk.green('✅ Remote command listener stopped'));

    } catch (error: any) {
      console.error(chalk.red('❌ Error stopping remote listener:'), error.message);
    }
  }

  private async showStatus(): Promise<void> {
    try {
      console.log(chalk.cyan('📊 Remote Command Listener Status'));
      console.log('─'.repeat(40));

      if (!this.remoteHandler) {
        console.log(chalk.red('Status: ') + chalk.gray('Not running'));
        console.log(chalk.gray('Use "e remote start" to begin listening for commands'));
        return;
      }

      const sessionInfo = this.remoteHandler.getSessionInfo();

      console.log(chalk.green('Status: ') + chalk.white('Running'));
      console.log(chalk.blue('Session ID: ') + chalk.gray(sessionInfo.sessionId.slice(0, 8) + '...'));
      console.log(chalk.blue('Version: ') + chalk.gray(sessionInfo.version));
      console.log(chalk.blue('Platform: ') + chalk.gray(sessionInfo.platform));
      console.log(chalk.blue('Capabilities: ') + chalk.gray(sessionInfo.capabilities.join(', ')));
      console.log(chalk.blue('Active: ') + (sessionInfo.isActive ? chalk.green('Yes') : chalk.red('No')));

    } catch (error: any) {
      console.error(chalk.red('❌ Error getting status:'), error.message);
    }
  }

  private async testConnection(dashboardUrl: string): Promise<void> {
    try {
      console.log(chalk.cyan('🔍 Testing connection to dashboard...'));

      // Get authentication token
      const token = await this.getAuthToken();
      if (!token) {
        console.log(chalk.red('❌ Authentication required. Please run: e config login'));
        return;
      }

      // Test API connection
      const response = await fetch(`${dashboardUrl}/api/cli-session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: any = await response.json();
        console.log(chalk.green('✅ Connection successful'));
        console.log(chalk.gray(`📡 Dashboard URL: ${dashboardUrl}`));
        console.log(chalk.gray(`🔗 Active sessions: ${data.sessions?.length || 0}`));
      } else {
        const errorData: any = await response.json().catch(() => ({}));
        console.log(chalk.red('❌ Connection failed'));
        console.log(chalk.gray(`Status: ${response.status} ${response.statusText}`));
        console.log(chalk.gray(`Error: ${errorData.error || 'Unknown error'}`));
      }

    } catch (error: any) {
      console.error(chalk.red('❌ Connection test failed:'), error.message);
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // Get the configured auth token
      const authToken = this.configService.getAuthToken();
      
      if (authToken) {
        return authToken;
      }

      // If no auth token, check if user is logged in with Firebase
      const firebaseCredentials = this.configService.getFirebaseCredentials();
      if (firebaseCredentials) {
        console.log(chalk.red('❌ Firebase credentials found but no auth token configured.'));
        console.log(chalk.yellow('💡 Please run: e config setup-cli-password'));
        console.log(chalk.gray('   This will generate a proper authentication token for remote CLI access.'));
        return null;
      }

      console.log(chalk.red('❌ No authentication configured.'));
      console.log(chalk.yellow('💡 Please run: e config setup'));
      return null;

    } catch (error: any) {
      console.error(chalk.red('❌ Error getting auth token:'), error.message);
      return null;
    }
  }

  private async keepAlive(): Promise<void> {
    return new Promise((resolve) => {
      // Keep the process alive until interrupted
      const interval = setInterval(() => {
        if (!this.remoteHandler || !this.remoteHandler.isActive) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  }
}
