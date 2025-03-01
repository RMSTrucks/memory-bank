import * as dotenv from 'dotenv';

/**
 * Service for managing configuration and environment variables
 */
export class ConfigService {
  private config: { [key: string]: string };

  constructor() {
    // Load environment variables from .env file
    dotenv.config();
    this.config = process.env as { [key: string]: string };
  }

  /**
   * Get configuration value
   */
  public get(key: string): string {
    const value = this.config[key];
    if (!value) {
      throw new Error(`Configuration key "${key}" not found`);
    }
    return value;
  }

  /**
   * Get optional configuration value
   */
  public getOptional(key: string, defaultValue?: string): string | undefined {
    return this.config[key] || defaultValue;
  }

  /**
   * Check if configuration key exists
   */
  public has(key: string): boolean {
    return key in this.config;
  }

  /**
   * Get all configuration values
   */
  public getAll(): { [key: string]: string } {
    return { ...this.config };
  }
}
