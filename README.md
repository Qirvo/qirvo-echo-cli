# Echo CLI (NPM)

A Node.js command-line interface for task management, Git operations, and AI assistance that integrates with the Qirvo Dashboard.

## Installation

### Via NPM (Recommended)

```bash
npm install -g @qirvo/echo-cli
```

### From Source

```bash
git clone <repository-url>
cd echo-cli-npm
npm install
npm run build
npm link
```

## Configuration

### 1. Setup and Authentication

The CLI connects to the Qirvo Dashboard using secure backend authentication. **No Firebase configuration required!**

**Simply run the setup command:**
```bash
e config setup
```

This will prompt you for:
- **API URL**: Your Qirvo Dashboard URL (default: http://localhost:3000)
- **Email & Password**: Your Qirvo account credentials

> 🔐 **How it works**: The CLI securely authenticates with your Qirvo backend and stores an encrypted token for subsequent requests.

This will interactively prompt you for:
- **API URL**: Your Qirvo Dashboard URL (default: http://localhost:3000)
- **User ID**: Your Firebase user ID
- **Auth Token**: Your Firebase authentication token

You can also configure non-interactively:

```bash
echo config setup --api-url "https://your-dashboard.com" --user-id "your-user-id" --auth-token "your-token"
```

### Getting Your Configuration Values

1. **API URL**: The URL where your Qirvo Dashboard is hosted
2. **User ID**: Found in your browser's developer tools under Firebase Auth
3. **Auth Token**: Your Firebase ID token (can be obtained from browser developer tools)

## Commands

### Task Management

```bash
# List all tasks
echo task list
echo task ls                    # Alias

# Add a new task
echo task add "Complete project documentation"
echo task add "Review code" -d "Review the new feature implementation"

# Complete a task
echo task complete <task-id>
echo task done <task-id>        # Alias

# Delete a task
echo task delete <task-id>
echo task rm <task-id>          # Alias
```

### Git Operations

```bash
# Show git status
echo git status

# Commit changes
echo git commit "Add new feature"

# List branches
echo git branches
echo git branch                 # Alias
```

### AI Assistant

```bash
# Ask the AI agent a question
echo agent ask "How do I optimize this SQL query?"
```

### Memory Management

```bash
# List saved memories
echo memory list
echo memory ls                  # Alias

# Save a memory
echo memory save "Important meeting notes" -c "Discussion about project timeline"

# Search memories
echo memory search "project timeline"

# Get a specific memory
echo memory get <memory-id>

# Delete a memory
echo memory delete <memory-id>
echo memory rm <memory-id>      # Alias
```

### Session Logs

```bash
# List recent command sessions
echo logs list
echo logs ls                    # Alias

# Show usage statistics
echo logs stats

# Show today's activity
echo logs today
```

### Configuration

```bash
# Show current configuration
echo config show

# Test API connection
echo config test

# Setup configuration
echo config setup

# Clear all configuration
echo config clear
```

### General

```bash
# Show version information
echo version

# Show help
echo --help
echo <command> --help
```

## Examples

### Daily Workflow

```bash
# Check your tasks for the day
echo task list

# Add a new task
echo task add "Review pull requests"

# Check git status
echo git status

# Commit your changes
echo git commit "Fix bug in user authentication"

# Ask AI for help
echo agent ask "Best practices for error handling in TypeScript"

# Save important information
echo memory save "Code review checklist" -c "Check for proper error handling, type safety, and test coverage"
```

### Configuration Management

```bash
# Check if CLI is configured
echo config show

# Setup for local development
echo config setup --api-url "http://localhost:3000"

# Setup for production
echo config setup --api-url "https://dashboard.qirvo.com"

# Test connection
echo config test

# Clear configuration if needed
echo config clear
```

## Features

### 🎨 **Rich CLI Experience**
- **Colorful Output**: Uses chalk for colorful, readable output
- **Loading Spinners**: Visual feedback with ora spinners during operations
- **Interactive Setup**: User-friendly configuration with inquirer prompts
- **Command Aliases**: Short aliases for frequently used commands

### 🔧 **Configuration Management**
- **Persistent Config**: Stores configuration in user's home directory
- **Interactive Setup**: Guided configuration process
- **Connection Testing**: Verify API connectivity
- **Easy Reconfiguration**: Clear and reset configuration as needed

### 🚀 **Performance**
- **Fast Startup**: Optimized for quick command execution
- **Error Handling**: Comprehensive error messages and recovery
- **Timeout Management**: Configurable request timeouts
- **Retry Logic**: Built-in retry for network operations

## Integration with Qirvo Dashboard

Echo CLI integrates seamlessly with your Qirvo Dashboard by:

1. **Syncing Tasks**: Tasks created/modified via CLI appear in your web dashboard
2. **Git Integration**: Git operations are reflected in your dashboard's Git panel
3. **AI Assistance**: Uses the same AI agent as your web dashboard
4. **Memory System**: Shared memory storage accessible from both CLI and web
5. **Session Logs**: All CLI activity is logged and visible in your dashboard

## Development

### Building from Source

```bash
npm install
npm run build
```

### Running in Development

```bash
npm run dev -- <command> <args>
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Testing

```bash
npm test
```

### Publishing

```bash
npm run build
npm publish
```

## Troubleshooting

### Common Issues

**"CLI not configured" error:**
```bash
echo config setup
```

**Connection timeout:**
- Check your API URL is correct
- Ensure your dashboard is running
- Verify your auth token is valid

**Permission denied:**
- Check your auth token hasn't expired
- Verify your user ID is correct

**Command not found after installation:**
```bash
npm install -g @qirvo/echo-cli
# Or if installed locally:
npm link
```

### Getting Help

```bash
# General help
echo --help

# Command-specific help
echo task --help
echo git --help
echo agent --help
```

### Configuration File Location

The configuration is stored at:
- **Windows**: `%USERPROFILE%\.echo-cli\config.json`
- **macOS/Linux**: `~/.echo-cli/config.json`

## Requirements

- **Node.js**: Version 16.0.0 or higher
- **NPM**: Version 7.0.0 or higher (comes with Node.js)

## License

MIT License - see LICENSE file for details.

## Support

For support, please visit the Qirvo Dashboard or contact support through the web interface.

## Comparison with .NET Version

| Feature | NPM Version | .NET Version |
|---------|-------------|--------------|
| Installation | `npm install -g` | `dotnet tool install` |
| Runtime | Node.js | .NET Runtime |
| Config Location | `~/.echo-cli/` | `%APPDATA%/EchoCLI/` |
| Interactive Setup | ✅ Rich prompts | ✅ Console prompts |
| Colored Output | ✅ Chalk | ❌ Plain text |
| Loading Spinners | ✅ Ora | ❌ Plain text |
| Command Aliases | ✅ Multiple aliases | ❌ Limited aliases |

Both versions provide the same core functionality and API integration, so choose based on your preferred runtime environment.
