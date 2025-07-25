import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ApiService } from '../services/ApiService';

export class LogsCommand {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  getCommand(): Command {
    const logsCommand = new Command('logs')
      .description('Session logs operations');

    // logs list
    logsCommand
      .command('list')
      .alias('ls')
      .description('List recent command sessions')
      .action(async () => {
        const spinner = ora('Fetching logs...').start();
        try {
          const result = await this.apiService.getLogs();
          spinner.stop();
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to fetch logs');
          console.error(chalk.red(error));
        }
      });

    // logs stats
    logsCommand
      .command('stats')
      .description('Show usage statistics')
      .action(async () => {
        const spinner = ora('Fetching statistics...').start();
        try {
          const result = await this.apiService.getLogsStats();
          spinner.stop();
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to fetch statistics');
          console.error(chalk.red(error));
        }
      });

    // logs today
    logsCommand
      .command('today')
      .description("Show today's activity")
      .action(async () => {
        const spinner = ora("Fetching today's activity...").start();
        try {
          const result = await this.apiService.getLogsToday();
          spinner.stop();
          console.log(result);
        } catch (error) {
          spinner.fail("Failed to fetch today's activity");
          console.error(chalk.red(error));
        }
      });

    return logsCommand;
  }
}
