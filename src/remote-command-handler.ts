import axios from 'axios';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';
import * as os from 'os';

// Interface definitions
interface CommandRequest {
  id: string;
  command: string;
  args?: string[];
  workingDirectory?: string;
  timeout?: number;
  type: 'echo-cli' | 'system';
  userId: string;
  sessionId: string;
  createdAt: string;
}

interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

interface SessionInfo {
  sessionId: string;
  isActive: boolean;
  capabilities: string[];
  version: string;
  platform: string;
}

export default class RemoteCommandHandler {
  private apiUrl: string;
  private authToken: string;
  private sessionId: string;
  private isActive: boolean;
  private pollInterval: NodeJS.Timeout | null;
  private heartbeatInterval: NodeJS.Timeout | null;
  private capabilities: string[];
  private version: string;
  private platform: string;
  private startTime: Date;
  private commandCount: number;
  private lastHeartbeat: Date | null;
  private lastCommandCheck: Date | null;

  constructor(apiUrl: string, authToken: string) {
    // Validate and clean the API URL
    if (!apiUrl) {
      console.error('❌ ERROR: API URL is empty or undefined!');
      throw new Error('API URL is required');
    }

    if (typeof apiUrl !== 'string') {
      console.error(`❌ ERROR: API URL is not a string, got: ${typeof apiUrl}`);
      throw new Error('API URL must be a string');
    }

    // Ensure URL doesn't end with slash for consistent concatenation
    this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    this.authToken = authToken;
    this.sessionId = randomUUID();
    this.isActive = false;
    this.pollInterval = null;
    this.heartbeatInterval = null;
    this.capabilities = ['echo-cli', 'system-commands'];
    this.version = require('../package.json').version;
    this.platform = `${os.platform()}-${os.arch()}`;
    this.startTime = new Date();
    this.commandCount = 0;
    this.lastHeartbeat = null;
    this.lastCommandCheck = null;

    console.log(`✅ Remote handler initialized successfully`);
    console.log(`🔗 Final API URL: '${this.apiUrl}'`);
    console.log(`🔑 Session ID: ${this.sessionId.slice(0, 8)}...`);
  }

  /**
   * Start the remote command listener
   */
  async start(): Promise<void> {
    try {
      console.log('🔗 Starting remote command handler...');

      // Register CLI session
      await this.registerSession();

      // Start polling for commands
      this.startPolling();

      // Start heartbeat
      this.startHeartbeat();

      this.isActive = true;
      this.startTime = new Date();

      // Display initial status
      this.displayStartupBanner();

      // Start status display updates
      this.startStatusDisplay();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to start remote command handler:', errorMessage);
      throw error;
    }
  }

  /**
   * Stop the remote command listener
   */
  async stop(): Promise<void> {
    try {
      console.log('🛑 Stopping remote command handler...');

      this.isActive = false;

      // Clear intervals
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Deactivate session
      await this.deactivateSession();

      console.log('✅ Remote command handler stopped');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error stopping remote command handler:', errorMessage);
    }
  }

  /**
   * Register CLI session with the backend
   */
  async registerSession(): Promise<void> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/cli-session`,
        {
          sessionId: this.sessionId,
          capabilities: this.capabilities,
          version: this.version,
          platform: this.platform
        },
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to register session');
      }

      console.log('📝 CLI session registered successfully');

    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to register CLI session:', errorMessage);
      throw error;
    }
  }

  /**
   * Deactivate CLI session
   */
  async deactivateSession(): Promise<void> {
    try {
      await axios.delete(
        `${this.apiUrl}/api/cli-session?sessionId=${this.sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      );
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to deactivate session:', errorMessage);
    }
  }

  /**
   * Start polling for pending commands
   */
  startPolling(): void {
    this.pollInterval = setInterval(async () => {
      if (!this.isActive) return;

      try {
        await this.checkForCommands();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error during polling:', errorMessage);
      }
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Start heartbeat to keep session alive
   */
  startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (!this.isActive) return;

      try {
        await axios.put(
          `${this.apiUrl}/api/cli-session`,
          { sessionId: this.sessionId },
          {
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        this.lastHeartbeat = new Date();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Heartbeat failed:', errorMessage);
      }
    }, 30000); // Heartbeat every 30 seconds
  }

  /**
   * Check for pending commands
   */
  async checkForCommands(): Promise<void> {
    try {
      this.lastCommandCheck = new Date();

      const fullUrl = `${this.apiUrl}/api/remote-cli?action=pending&sessionId=${this.sessionId}`;

      const response = await axios.get(
        fullUrl,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      );

      if (response.data.success && response.data.commands.length > 0) {
        console.log(`📨 Received ${response.data.commands.length} command(s) from dashboard`);
        for (const command of response.data.commands) {
          await this.executeCommand(command);
        }
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error checking for commands:', errorMessage);
    }
  }

  /**
   * Execute a remote command
   */
  async executeCommand(commandRequest: CommandRequest): Promise<void> {
    const startTime = Date.now();
    let result: string | null = null;
    let error: string | null = null;

    // Increment command counter
    this.commandCount++;

    try {
      console.log(`\n🚀 [${this.commandCount}] Executing: ${commandRequest.command}`);
      console.log(`🔄 Command Type: ${commandRequest.command.startsWith(':') ? 'Echo CLI' : 'System'}`);

      // Check if it's an Echo CLI command
      if (commandRequest.command.startsWith(':')) {
        result = await this.executeEchoCommand(commandRequest);
      } else {
        result = await this.executeSystemCommand(commandRequest);
      }

      const executionTime = Date.now() - startTime;
      console.log(`✅ [${this.commandCount}] Command completed in ${executionTime}ms`);
      if (result) {
        console.log(`📝 Output: ${result.slice(0, 100)}${result.length > 100 ? '...' : ''}`);
      }

    } catch (err: unknown) {
      error = err instanceof Error ? err.message : String(err);
      console.error(`❌ [${this.commandCount}] Command failed: ${error}`);
    }

    const executionTime = Date.now() - startTime;

    // Report result back to server
    await this.reportCommandResult(commandRequest, result, error, executionTime);
    console.log(`📤 [${this.commandCount}] Result reported to dashboard\n`);
  }

  /**
   * Execute Echo CLI command
   */
  async executeEchoCommand(commandRequest: CommandRequest): Promise<string> {
    try {
      // Import the echo command handler
      const { handleEchoCommand } = await import('./echo-command-handler');

      const result = await handleEchoCommand(
        commandRequest.command,
        this.authToken,
        this.apiUrl
      );

      return result;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Echo CLI command failed: ${errorMessage}`);
    }
  }

  /**
   * Execute system command
   */
  async executeSystemCommand(commandRequest: CommandRequest): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const { command, args = [], workingDirectory, timeout = 30000 } = commandRequest;

      // Build full command
      const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command;

      const options: any = {
        timeout,
        maxBuffer: 1024 * 1024, // 1MB buffer
        encoding: 'utf8'
      };

      if (workingDirectory) {
        options.cwd = workingDirectory;
      }

      exec(fullCommand, options, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${error.message}`));
          return;
        }

        // Convert to string if it's a buffer
        const stdoutStr = stdout ? stdout.toString() : '';
        const stderrStr = stderr ? stderr.toString() : '';
        const output = stdoutStr || stderrStr || 'Command completed successfully';
        resolve(output.trim());
      });
    });
  }

  /**
   * Report command result back to server
   */
  async reportCommandResult(
    commandRequest: CommandRequest,
    result: string | null,
    error: string | null,
    executionTime: number
  ): Promise<void> {
    try {
      // Import crypto properly
      const crypto = require('crypto');

      // Generate a command ID based on the request
      const commandId = crypto
        .createHash('sha256')
        .update(`${this.sessionId}-${commandRequest.command}-${Date.now()}`)
        .digest('hex')
        .slice(0, 16);

      const response = await axios.put(
        `${this.apiUrl}/api/remote-cli`,
        {
          commandId,
          result: {
            success: !error,
            output: result,
            error,
            executionTime,
            commandId,
            timestamp: new Date().toISOString()
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        console.error('❌ Failed to report command result:', response.data.error);
      }

    } catch (err: unknown) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : err instanceof Error ? err.message : String(err);
      console.error('❌ Error reporting command result:', errorMessage);
    }
  }

  /**
   * Display startup banner with initial status
   */
  private displayStartupBanner(): void {
    console.clear();
    console.log('\n' + '='.repeat(70));
    console.log('🚀 QIRVO ECHO CLI - REMOTE COMMAND LISTENER');
    console.log('='.repeat(70));
    console.log(`📡 Dashboard URL: ${this.apiUrl}`);
    console.log(`🔑 Session ID: ${this.sessionId.slice(0, 8)}...`);
    console.log(`💻 Platform: ${this.platform}`);
    console.log(`📦 Version: ${this.version}`);
    console.log(`⚡ Capabilities: ${this.capabilities.join(', ')}`);
    console.log(`🕐 Started: ${this.startTime.toLocaleString()}`);
    console.log('='.repeat(70));
    console.log('✅ CLI is now listening for remote commands from the dashboard');
    console.log('🛑 Press Ctrl+C to stop the listener\n');
  }

  /**
   * Start periodic status display updates
   */
  private startStatusDisplay(): void {
    // Update status every 10 seconds
    setInterval(() => {
      if (this.isActive) {
        this.displayLiveStatus();
      }
    }, 10000);
  }

  /**
   * Display live status updates
   */
  private displayLiveStatus(): void {
    const uptime = this.getUptime();
    const now = new Date();

    console.log('\n' + '-'.repeat(50));
    console.log('📊 LIVE STATUS UPDATE');
    console.log('-'.repeat(50));
    console.log(`🕐 Current Time: ${now.toLocaleTimeString()}`);
    console.log(`⏱️  Uptime: ${uptime}`);
    console.log(`📈 Commands Executed: ${this.commandCount}`);
    console.log(`💓 Last Heartbeat: ${this.lastHeartbeat ? this.lastHeartbeat.toLocaleTimeString() : 'Never'}`);
    console.log(`🔍 Last Command Check: ${this.lastCommandCheck ? this.lastCommandCheck.toLocaleTimeString() : 'Never'}`);
    console.log(`🔗 Connection Status: ${this.isActive ? '🟢 Active' : '🔴 Inactive'}`);
    console.log('-'.repeat(50) + '\n');
  }

  /**
   * Get formatted uptime string
   */
  private getUptime(): string {
    const now = new Date();
    const uptimeMs = now.getTime() - this.startTime.getTime();
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      isActive: this.isActive,
      capabilities: this.capabilities,
      version: this.version,
      platform: this.platform,
      startTime: this.startTime,
      commandCount: this.commandCount,
      uptime: this.getUptime()
    };
  }
}

module.exports = RemoteCommandHandler;
