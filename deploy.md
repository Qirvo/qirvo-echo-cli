# Secure npm Deployment Guide

## Prerequisites
1. Ensure you're logged into npm: `npm whoami`
2. If not logged in: `npm login`

## Deployment Steps

### 1. Final Security Check
```bash
# Verify no sensitive files will be published
npm pack --dry-run

# Should only show:
# - dist/ folder (built JavaScript)
# - README.md
# - LICENSE
# - package.json
```

### 2. Version Management
```bash
# For patch version (1.0.1 -> 1.0.2)
npm version patch

# For minor version (1.0.1 -> 1.1.0)
npm version minor

# For major version (1.0.1 -> 2.0.0)
npm version major
```

### 3. Publish to npm
```bash
# Build and publish
npm run build
npm publish

# For scoped packages (if needed)
npm publish --access public
```

### 4. Verify Publication
```bash
# Check your package on npm
npm view @qirvo/echo-cli

# Test installation
npm install -g @qirvo/echo-cli@latest
```

## Post-Deployment

### User Setup Instructions
Users will need to:
1. Install: `npm install -g @qirvo/echo-cli`
2. Copy config: `cp .env.example .env.local` (in their global npm folder)
3. Configure Firebase credentials in `.env.local`
4. Authenticate: `e config setup`

### Security Notes
- ✅ Firebase credentials never leave user's machine
- ✅ .env files automatically excluded from package
- ✅ Users provide their own Firebase config
- ✅ CLI works with graceful fallback if Firebase unavailable

## Troubleshooting

If users report Firebase issues:
1. Check they copied .env.example to .env.local
2. Verify Firebase config values are correct
3. Ensure they ran `e config setup`
4. CLI will show helpful setup instructions automatically
