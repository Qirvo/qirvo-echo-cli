#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { TaskCommand } from './commands/TaskCommand';
import { GitCommand } from './commands/GitCommand';
import { AgentCommand } from './commands/AgentCommand';
import { MemoryCommand } from './commands/MemoryCommand';
import { LogsCommand } from './commands/LogsCommand';
import { ConfigCommand } from './commands/ConfigCommand';
import { ConfigService } from './services/ConfigService';
import { ApiService } from './services/ApiService';
import { FirebaseAuthService } from './services/FirebaseAuthService';

const program = new Command();

// Initialize services
const configService = new ConfigService();
const firebaseAuthService = new FirebaseAuthService(configService);
const apiService = new ApiService(configService, firebaseAuthService);

// Initialize commands
const taskCommand = new TaskCommand(apiService);
const gitCommand = new GitCommand(apiService);
const agentCommand = new AgentCommand(apiService);
const memoryCommand = new MemoryCommand(apiService);
const logsCommand = new LogsCommand(apiService);
const configCommand = new ConfigCommand(configService, firebaseAuthService);

// Configure main program
program
  .name('qecho')
  .description('Echo CLI - Command-line interface for task management, Git operations, and AI assistance')
  .version('1.0.0');

// Add commands
program.addCommand(taskCommand.getCommand());
program.addCommand(gitCommand.getCommand());
program.addCommand(agentCommand.getCommand());
program.addCommand(memoryCommand.getCommand());
program.addCommand(logsCommand.getCommand());
program.addCommand(configCommand.getCommand());

// Add version command
program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log(chalk.cyan('Echo CLI v1.0.0'));
    console.log(chalk.gray('Built for Qirvo Dashboard Integration'));
    console.log();
    console.log(chalk.yellow('Commands available:'));
    console.log('  task     - Task management');
    console.log('  git      - Git operations');
    console.log('  agent    - AI assistance');
    console.log('  memory   - Memory management');
    console.log('  logs     - Session logs');
    console.log('  config   - Configuration');
    console.log();
    console.log(chalk.gray("Use 'qecho <command> --help' for more information about a command."));
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow("Use 'qecho --help' for available commands."));
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
