import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { ConfigService } from '../services/ConfigService';
import { ApiService } from '../services/ApiService';
import { FirebaseAuthService } from '../services/FirebaseAuthService';

export class ConfigCommand {
  private configService: ConfigService;
  private firebaseAuthService: FirebaseAuthService;

  constructor(configService: ConfigService, firebaseAuthService: FirebaseAuthService) {
    this.configService = configService;
    this.firebaseAuthService = firebaseAuthService;
  }

  getCommand(): Command {
    const configCommand = new Command('config')
      .description('Configuration management');

    // config setup
    configCommand
      .command('setup')
      .description('Setup CLI configuration')
      .option('--api-url <url>', 'API URL (default: http://localhost:3000)')
      .option('--user-id <id>', 'User ID')
      .option('--auth-token <token>', 'Authentication token')
      .action(async (options: { apiUrl?: string; userId?: string; authToken?: string }) => {
        console.log(chalk.cyan('🔧 Setting up Echo CLI configuration...'));
        console.log();

        let { apiUrl, userId, authToken } = options;

        // Interactive setup if options not provided
        if (!apiUrl || !userId) {
          await this.setupConfig();
        } else {
          // Save provided configuration
          this.configService.setApiUrl(apiUrl);
          this.configService.setUserId(userId);
          if (authToken) {
            this.configService.setAuthToken(authToken);
          }
          console.log(chalk.green('✅ Configuration saved successfully!'));
        }
      });

    // config show
    configCommand
      .command('show')
      .description('Show current configuration')
      .action(() => {
        const config = this.configService.getAll();
        const isConfigured = this.configService.isConfigured();

        console.log(chalk.cyan('📋 Current Configuration:'));
        console.log();
        console.log(`API URL: ${chalk.yellow(config.apiUrl || 'Not set')}`);
        console.log(`User ID: ${chalk.yellow(config.userId || 'Not set')}`);
        console.log(`Auth Token: ${chalk.yellow(config.authToken ? '[HIDDEN]' : 'Not set')}`);
        console.log(`Config file: ${chalk.gray(this.configService.getConfigPath())}`);
        console.log();
        console.log(`Status: ${isConfigured ? chalk.green('✅ Configured') : chalk.red('❌ Not configured')}`);

        if (!isConfigured) {
          console.log();
          console.log(chalk.yellow('💡 Run "qecho config setup" to configure the CLI.'));
        }
      });

    // config test
    configCommand
      .command('test')
      .description('Test API connection')
      .action(async () => {
        if (!this.configService.isConfigured()) {
          console.log(chalk.red('❌ CLI not configured. Run "qecho config setup" first.'));
          return;
        }

        const spinner = ora('🔍 Testing API connection...').start();

        try {
          const apiService = new ApiService(this.configService);
          const success = await apiService.testConnection();

          if (success) {
            spinner.succeed('Connection test successful!');
            console.log(chalk.green('✅ Your Echo CLI is properly configured and connected.'));
          } else {
            spinner.fail('Connection test failed');
            console.log(chalk.red('❌ Unable to connect to the API. Please check your configuration.'));
            console.log(chalk.yellow('💡 Run "qecho config show" to verify your settings.'));
          }
        } catch (error) {
          spinner.fail('Connection test failed');
          console.error(chalk.red(`❌ Error: ${error}`));
        }
      });

    // config clear
    configCommand
      .command('clear')
      .description('Clear all configuration')
      .action(async () => {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to clear all configuration?',
            default: false
          }
        ]);

        if (confirm) {
          this.configService.clear();
          console.log(chalk.green('✅ Configuration cleared successfully.'));
          console.log(chalk.yellow('💡 Run "qecho config setup" to reconfigure.'));
        } else {
          console.log(chalk.gray('Configuration not cleared.'));
        }
      });

    return configCommand;
  }

  private async setupConfig(): Promise<void> {
    console.log(chalk.blue('\n🔧 Setting up qecho CLI configuration...\n'));

    const questions = [
      {
        type: 'input',
        name: 'apiUrl',
        message: 'Enter your API URL:',
        default: 'https://commandcentre.qirvo.com',
        validate: (input: string) => {
          if (!input.trim()) return 'API URL is required';
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      },
      {
        type: 'input',
        name: 'userId',
        message: 'Enter your User ID (Firebase UID):',
        validate: (input: string) => input.trim() ? true : 'User ID is required'
      },
      {
        type: 'input',
        name: 'email',
        message: 'Enter your Firebase email:',
        validate: (input: string) => {
          if (!input.trim()) return 'Email is required';
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(input) ? true : 'Please enter a valid email address';
        }
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your Firebase password:',
        validate: (input: string) => input.trim() ? true : 'Password is required'
      }
    ];

    const answers = await inquirer.prompt(questions);

    // Save basic configuration
    this.configService.setApiUrl(answers.apiUrl);
    this.configService.setUserId(answers.userId);

    console.log(chalk.blue('\n🔐 Authenticating with Firebase...'));
    
    // Authenticate with Firebase and get token
    const authSuccess = await this.firebaseAuthService.authenticateWithCredentials(
      answers.email,
      answers.password
    );

    if (!authSuccess) {
      console.log(chalk.red('\n❌ Firebase authentication failed!'));
      console.log(chalk.yellow('Please check your email and password and try again.'));
      return;
    }

    console.log(chalk.green('\n✅ Firebase authentication successful!'));
    console.log(chalk.green('✅ Configuration saved successfully!'));
    console.log(chalk.gray(`Config file: ${this.configService.getConfigPath()}`));

    // Test the connection
    console.log(chalk.blue('\n🔍 Testing connection...'));
    await this.testConnection();
  }

  private async testConnection(): Promise<void> {
    try {
      const apiService = new ApiService(this.configService);
      const success = await apiService.testConnection();

      if (success) {
        console.log(chalk.green('✅ Connection test successful!'));
        console.log(chalk.green('Your qecho CLI is properly configured and connected.'));
      } else {
        console.log(chalk.red('❌ Connection test failed!'));
        console.log(chalk.yellow('Please check your configuration and try again.'));
      }
    } catch (error: any) {
      console.log(chalk.red('❌ Connection test failed!'));
      console.log(chalk.red(`Error: ${error.message}`));
    }
  }
}
