import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ApiService } from '../services/ApiService';

export class TaskCommand {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  getCommand(): Command {
    const taskCommand = new Command('task')
      .description('Task management operations');

    // task list
    taskCommand
      .command('list')
      .alias('ls')
      .description('List all tasks')
      .action(async () => {
        const spinner = ora('Fetching tasks...').start();
        try {
          const result = await this.apiService.getTasks();
          spinner.stop();
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to fetch tasks');
          console.error(chalk.red(error));
        }
      });

    // task add
    taskCommand
      .command('add <title>')
      .description('Add a new task')
      .option('-d, --description <description>', 'Task description')
      .action(async (title: string, options: { description?: string }) => {
        const spinner = ora('Adding task...').start();
        try {
          const result = await this.apiService.addTask(title, options.description);
          spinner.succeed('Task added successfully');
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to add task');
          console.error(chalk.red(error));
        }
      });

    // task complete
    taskCommand
      .command('complete <id>')
      .alias('done')
      .description('Mark a task as complete')
      .action(async (id: string) => {
        const spinner = ora('Completing task...').start();
        try {
          const result = await this.apiService.completeTask(id);
          spinner.succeed('Task completed');
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to complete task');
          console.error(chalk.red(error));
        }
      });

    // task delete
    taskCommand
      .command('delete <id>')
      .alias('rm')
      .description('Delete a task')
      .action(async (id: string) => {
        const spinner = ora('Deleting task...').start();
        try {
          const result = await this.apiService.deleteTask(id);
          spinner.succeed('Task deleted');
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to delete task');
          console.error(chalk.red(error));
        }
      });

    return taskCommand;
  }
}
