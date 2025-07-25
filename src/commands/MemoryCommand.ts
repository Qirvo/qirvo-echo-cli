import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ApiService } from '../services/ApiService';

export class MemoryCommand {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  getCommand(): Command {
    const memoryCommand = new Command('memory')
      .description('Memory management operations');

    // memory list
    memoryCommand
      .command('list')
      .alias('ls')
      .description('List all saved memories')
      .action(async () => {
        const spinner = ora('Fetching memories...').start();
        try {
          const result = await this.apiService.getMemories();
          spinner.stop();
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to fetch memories');
          console.error(chalk.red(error));
        }
      });

    // memory save
    memoryCommand
      .command('save <title>')
      .description('Save a new memory')
      .option('-c, --content <content>', 'Memory content')
      .action(async (title: string, options: { content?: string }) => {
        const spinner = ora('Saving memory...').start();
        try {
          const result = await this.apiService.saveMemory(title, options.content || '');
          spinner.succeed('Memory saved successfully');
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to save memory');
          console.error(chalk.red(error));
        }
      });

    // memory search
    memoryCommand
      .command('search <query>')
      .description('Search memories')
      .action(async (query: string) => {
        const spinner = ora('Searching memories...').start();
        try {
          const result = await this.apiService.searchMemories(query);
          spinner.stop();
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to search memories');
          console.error(chalk.red(error));
        }
      });

    // memory get
    memoryCommand
      .command('get <id>')
      .description('Get a specific memory by ID')
      .action(async (id: string) => {
        const spinner = ora('Fetching memory...').start();
        try {
          const result = await this.apiService.getMemory(id);
          spinner.stop();
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to fetch memory');
          console.error(chalk.red(error));
        }
      });

    // memory delete
    memoryCommand
      .command('delete <id>')
      .alias('rm')
      .description('Delete a memory by ID')
      .action(async (id: string) => {
        const spinner = ora('Deleting memory...').start();
        try {
          const result = await this.apiService.deleteMemory(id);
          spinner.succeed('Memory deleted');
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to delete memory');
          console.error(chalk.red(error));
        }
      });

    return memoryCommand;
  }
}
