import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ApiService } from '../services/ApiService';

export class AgentCommand {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  getCommand(): Command {
    const agentCommand = new Command('agent')
      .description('AI assistance');

    // agent ask
    agentCommand
      .command('ask <question>')
      .description('Ask the AI agent a question')
      .action(async (question: string) => {
        const spinner = ora('🤖 Asking AI agent...').start();
        try {
          const result = await this.apiService.askAgent(question);
          spinner.stop();
          console.log(chalk.cyan('🤖 AI Response:'));
          console.log(result);
        } catch (error) {
          spinner.fail('Failed to get AI response');
          console.error(chalk.red(error));
        }
      });

    return agentCommand;
  }
}
