import axios from 'axios';

/**
 * Parse CLI command format and convert to dashboard format
 */
function parseCliCommand(command: string): { dashboardCommand: string; args: string[] } {
  // Remove the leading ':' if present
  const cleanCommand = command.startsWith(':') ? command.slice(1) : command;
  const parts = cleanCommand.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return { dashboardCommand: ':help', args: [] };
  }
  
  const [mainCommand, subCommand, ...args] = parts;
  
  // Map CLI commands to dashboard command format
  switch (mainCommand.toLowerCase()) {
    case 'agent':
      if (subCommand === 'ask') {
        return { dashboardCommand: ':agent', args: args };
      }
      return { dashboardCommand: ':agent', args: [subCommand, ...args].filter(Boolean) };
    
    case 'task':
      if (subCommand === 'add' || subCommand === 'create') {
        return { dashboardCommand: ':task add', args: args };
      }
      if (subCommand === 'list') {
        return { dashboardCommand: ':task list', args: args };
      }
      if (subCommand === 'complete' || subCommand === 'done') {
        return { dashboardCommand: ':task complete', args: args };
      }
      if (subCommand === 'delete' || subCommand === 'remove') {
        return { dashboardCommand: ':task delete', args: args };
      }
      return { dashboardCommand: ':task list', args: [] };
    
    case 'git':
      if (subCommand === 'status' || !subCommand) {
        return { dashboardCommand: ':git status', args: args };
      }
      if (subCommand === 'commit') {
        return { dashboardCommand: ':git commit', args: args };
      }
      if (subCommand === 'branches') {
        return { dashboardCommand: ':git branches', args: args };
      }
      if (subCommand === 'prs' || subCommand === 'pr') {
        return { dashboardCommand: ':git prs', args: args };
      }
      if (subCommand === 'config') {
        return { dashboardCommand: ':git config', args: args };
      }
      return { dashboardCommand: ':git status', args: [] };
    
    case 'help':
    case 'h':
      return { dashboardCommand: ':help', args: args };
    
    case 'clear':
    case 'cls':
      return { dashboardCommand: ':clear', args: args };
    
    case 'version':
      return { dashboardCommand: ':version', args: args };
    
    case 'time':
      return { dashboardCommand: ':time', args: args };
    
    case 'plugin':
    case 'plugins':
      return { dashboardCommand: ':plugin', args: [subCommand, ...args].filter(Boolean) };
    
    case 'memory':
      return { dashboardCommand: ':memory', args: args };
    
    case 'logs':
      return { dashboardCommand: ':logs', args: args };
    
    default:
      // If it's already in dashboard format (starts with :), pass through
      if (command.startsWith(':')) {
        const [cmd, ...cmdArgs] = command.split(/\s+/);
        return { dashboardCommand: cmd, args: cmdArgs };
      }
      // Otherwise, treat as a plugin or unknown command
      return { dashboardCommand: `:${mainCommand}`, args: [subCommand, ...args].filter(Boolean) };
  }
}

/**
 * Handle Echo CLI commands for remote execution
 */
export async function handleEchoCommand(
  command: string, 
  authToken: string, 
  apiUrl: string
): Promise<string> {
  try {
    // Parse and convert CLI command format to dashboard format
    const { dashboardCommand, args } = parseCliCommand(command);
    
    // Send command to the backend API
    const response = await axios.post(
      `${apiUrl}/api/echo-command`,
      { 
        command: dashboardCommand,
        args: args
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      return response.data.output || 'Command executed successfully';
    } else {
      throw new Error(response.data.error || 'Command execution failed');
    }

  } catch (error: unknown) {
    // Handle axios errors properly
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`API request failed: ${errorMessage}`);
  }
}
