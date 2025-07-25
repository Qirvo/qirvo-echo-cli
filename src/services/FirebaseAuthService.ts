import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, Auth, User } from 'firebase/auth';
import { ConfigService } from './ConfigService';
import chalk from 'chalk';

export class FirebaseAuthService {
    private app: FirebaseApp | null = null;
    private auth: Auth | null = null;
    private configService: ConfigService;
    private currentUser: User | null = null;
    private isFirebaseAvailable: boolean = false;

    constructor(configService: ConfigService) {
        this.configService = configService;

        // Firebase authentication disabled for security compliance
        // CLI now uses backend-only authentication
        console.log(chalk.blue('🔗 Using secure backend authentication...'));
        this.isFirebaseAvailable = false;
        this.app = null;
        this.auth = null;
    }

    /**
     * Check if Firebase authentication is available
     */
    isAvailable(): boolean {
        return this.isFirebaseAvailable && this.auth !== null;
    }

    /**
     * Authenticate with email and password, then store credentials for auto-refresh
     */
    async authenticateWithCredentials(email: string, password: string): Promise<boolean> {
        if (!this.isAvailable()) {
            console.log(chalk.yellow('⚠️  Firebase authentication not available. Please check your configuration.'));
            return false;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(this.auth!, email, password);
            this.currentUser = userCredential.user;

            // Store credentials securely for auto-refresh
            this.configService.setFirebaseCredentials(email, password);

            // Get and store initial token
            const token = await this.currentUser.getIdToken();
            this.configService.setAuthToken(token);

            return true;
        } catch (error: any) {
            console.error(chalk.red(`Authentication failed: ${error.message}`));
            return false;
        }
    }

    /**
     * Get a fresh Firebase token, automatically refreshing if needed
     */
    async getFreshToken(): Promise<string | null> {
        try {
            // If we have a current user, try to get a fresh token
            if (this.currentUser) {
                return await this.currentUser.getIdToken(true); // Force refresh
            }

            // If no current user, try to re-authenticate with stored credentials
            const credentials = this.configService.getFirebaseCredentials();
            if (credentials) {
                const success = await this.authenticateWithCredentials(credentials.email, credentials.password);
                if (success && this.currentUser) {
                    return await (this.currentUser as User).getIdToken(true);
                }
            }

            return null;
        } catch (error: any) {
            console.error(chalk.red(`Token refresh failed: ${error.message}`));
            return null;
        }
    }

    /**
     * Get a valid Firebase token, refreshing if necessary
     */
    async getValidToken(): Promise<string | null> {
        if (!this.isAvailable()) {
            // Firebase not available, return stored token if any
            return this.configService.getAuthToken() || null;
        }

        try {
            let token = this.configService.getAuthToken();

            if (!token) {
                // No token stored, need to authenticate
                return await this.getFreshToken();
            }

            // Check if token is expired by trying to decode it
            if (this.isTokenExpired(token)) {
                console.log(chalk.yellow('Token expired, refreshing...'));
                const freshToken = await this.getFreshToken();
                if (freshToken) {
                    this.configService.setAuthToken(freshToken);
                    return freshToken;
                }
                return null;
            }

            return token;
        } catch (error: any) {
            console.error(chalk.red(`Token validation failed: ${error.message}`));
            return await this.getFreshToken();
        }
    }

    /**
     * Check if a JWT token is expired
     */
    private isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        } catch {
            return true; // If we can't parse it, consider it expired
        }
    }

    /**
     * Sign out and clear stored credentials
     */
    async signOut(): Promise<void> {
        try {
            if (this.auth) {
                await this.auth.signOut();
            }
            this.currentUser = null;
            this.configService.clearFirebaseCredentials();
            this.configService.setAuthToken('');
        } catch (error: any) {
            console.error(chalk.red(`Sign out failed: ${error.message}`));
        }
    }
}
