import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ApiService } from '../services/ApiService';

export class GitCommand {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  getCommand(): Command {
    const gitCommand = new Command('git')
      .description('Git operations');

    // git status
    gitCommand
      .command('status')
      .description('Show git status')
      .action(async () => {
        const spinner = ora('Getting git status...').start();
        try {
          const result = await this.apiService.gitStatus();
          spinner.stop();
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to get git status');
          console.error(chalk.red(error));
        }
      });

    // git commit
    gitCommand
      .command('commit <message>')
      .description('Commit changes')
      .action(async (message: string) => {
        const spinner = ora('Committing changes...').start();
        try {
          const result = await this.apiService.gitCommit(message);
          spinner.succeed('Changes committed');
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to commit changes');
          console.error(chalk.red(error));
        }
      });

    // git branches
    gitCommand
      .command('branches')
      .alias('branch')
      .description('List branches')
      .action(async () => {
        const spinner = ora('Fetching branches...').start();
        try {
          const result = await this.apiService.gitBranches();
          spinner.stop();
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to fetch branches');
          console.error(chalk.red(error));
        }
      });

    return gitCommand;
  }
}
