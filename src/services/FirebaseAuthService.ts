import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, Auth, User } from 'firebase/auth';
import { ConfigService } from './ConfigService';
import chalk from 'chalk';

export class FirebaseAuthService {
    private app: FirebaseApp;
    private auth: Auth;
    private configService: ConfigService;
    private currentUser: User | null = null;

    constructor(configService: ConfigService) {
        this.configService = configService;

        // Firebase configuration - you'll need to add this to your config
        const firebaseConfig = {
            apiKey: "AIzaSyBgjhQu5mpQsi6h5IXIeDJNm7SvI2zM-ew", // You'll need to get this from your Firebase project
            authDomain: "commandcentre0.firebaseapp.com",
            projectId: "commandcentre0",
            storageBucket: "commandcentre0.firebasestorage.app",
            messagingSenderId: "729256280572",
            appId: "1:729256280572:web:d7fc14e9a6a717e2683279"
        };

        // Initialize Firebase
        if (!getApps().length) {
            this.app = initializeApp(firebaseConfig);
        } else {
            this.app = getApps()[0];
        }

        this.auth = getAuth(this.app);
    }

    /**
     * Authenticate with email and password, then store credentials for auto-refresh
     */
    async authenticateWithCredentials(email: string, password: string): Promise<boolean> {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
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
            await this.auth.signOut();
            this.currentUser = null;
            this.configService.clearFirebaseCredentials();
            this.configService.setAuthToken('');
        } catch (error: any) {
            console.error(chalk.red(`Sign out failed: ${error.message}`));
        }
    }
}
