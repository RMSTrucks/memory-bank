/**
 * Common Utility Functions Template
 *
 * A template for creating utility functions with TypeScript
 */

export const template = `/**
 * {{moduleName}} - Common utility functions
 */

{{#if includeValidation}}
/**
 * Validation utilities
 */
export const validation = {
  /**
   * Check if a value is defined (not null or undefined)
   * @param value - The value to check
   * @returns True if the value is defined
   */
  isDefined: <T>(value: T | null | undefined): value is T => {
    return value !== null && value !== undefined;
  },

  /**
   * Check if a string is empty
   * @param value - The string to check
   * @returns True if the string is empty or only whitespace
   */
  isEmpty: (value: string): boolean => {
    return value.trim() === '';
  },

  /**
   * Check if a string is a valid email address
   * @param email - The email address to validate
   * @returns True if the email is valid
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  },

  /**
   * Check if a string is a valid URL
   * @param url - The URL to validate
   * @returns True if the URL is valid
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Check if a value is a number
   * @param value - The value to check
   * @returns True if the value is a number
   */
  isNumber: (value: any): value is number => {
    return typeof value === 'number' && !isNaN(value);
  },

  /**
   * Check if a value is an integer
   * @param value - The value to check
   * @returns True if the value is an integer
   */
  isInteger: (value: any): boolean => {
    return Number.isInteger(value);
  },

  /**
   * Check if a value is within a range
   * @param value - The value to check
   * @param min - The minimum value (inclusive)
   * @param max - The maximum value (inclusive)
   * @returns True if the value is within the range
   */
  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  }
};
{{/if}}

{{#if includeFormatting}}
/**
 * Formatting utilities
 */
export const formatting = {
  /**
   * Format a number as currency
   * @param value - The number to format
   * @param currency - The currency code (default: 'USD')
   * @param locale - The locale (default: 'en-US')
   * @returns Formatted currency string
   */
  formatCurrency: (value: number, currency: string = 'USD', locale: string = 'en-US'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(value);
  },

  /**
   * Format a number with commas
   * @param value - The number to format
   * @param decimalPlaces - The number of decimal places (default: 2)
   * @param locale - The locale (default: 'en-US')
   * @returns Formatted number string
   */
  formatNumber: (value: number, decimalPlaces: number = 2, locale: string = 'en-US'): string => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value);
  },

  /**
   * Format a percentage
   * @param value - The value to format (0-1)
   * @param decimalPlaces - The number of decimal places (default: 0)
   * @param locale - The locale (default: 'en-US')
   * @returns Formatted percentage string
   */
  formatPercent: (value: number, decimalPlaces: number = 0, locale: string = 'en-US'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value);
  },

  /**
   * Truncate a string to a maximum length
   * @param text - The text to truncate
   * @param maxLength - The maximum length
   * @param suffix - The suffix to add when truncated (default: '...')
   * @returns Truncated string
   */
  truncate: (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  /**
   * Convert a string to title case
   * @param text - The text to convert
   * @returns Title case string
   */
  toTitleCase: (text: string): string => {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Convert a string to camel case
   * @param text - The text to convert
   * @returns Camel case string
   */
  toCamelCase: (text: string): string => {
    return text
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, c => c.toLowerCase());
  },

  /**
   * Convert a string to kebab case
   * @param text - The text to convert
   * @returns Kebab case string
   */
  toKebabCase: (text: string): string => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase();
  },

  /**
   * Convert a string to snake case
   * @param text - The text to convert
   * @returns Snake case string
   */
  toSnakeCase: (text: string): string => {
    return text
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .toLowerCase();
  }
};
{{/if}}

{{#if includeDateTime}}
/**
 * Date and time utilities
 */
export const dateTime = {
  /**
   * Format a date
   * @param date - The date to format
   * @param format - The format string (default: 'YYYY-MM-DD')
   * @param locale - The locale (default: 'en-US')
   * @returns Formatted date string
   */
  formatDate: (date: Date, format: string = 'YYYY-MM-DD', locale: string = 'en-US'): string => {
    // Simple format implementation
    // For more complex formatting, consider using a library like date-fns or moment
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  /**
   * Get the relative time from now
   * @param date - The date to compare
   * @param locale - The locale (default: 'en-US')
   * @returns Relative time string
   */
  getRelativeTime: (date: Date, locale: string = 'en-US'): string => {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const now = new Date();
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (Math.abs(diffInDays) > 0) {
      return rtf.format(diffInDays, 'day');
    }
    if (Math.abs(diffInHours) > 0) {
      return rtf.format(diffInHours, 'hour');
    }
    if (Math.abs(diffInMinutes) > 0) {
      return rtf.format(diffInMinutes, 'minute');
    }
    return rtf.format(diffInSeconds, 'second');
  },

  /**
   * Add days to a date
   * @param date - The date to modify
   * @param days - The number of days to add
   * @returns New date
   */
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Add months to a date
   * @param date - The date to modify
   * @param months - The number of months to add
   * @returns New date
   */
  addMonths: (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  },

  /**
   * Get the start of a day
   * @param date - The date
   * @returns Date at start of day
   */
  startOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  /**
   * Get the end of a day
   * @param date - The date
   * @returns Date at end of day
   */
  endOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },

  /**
   * Check if a date is today
   * @param date - The date to check
   * @returns True if the date is today
   */
  isToday: (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  },

  /**
   * Check if a date is in the past
   * @param date - The date to check
   * @returns True if the date is in the past
   */
  isPast: (date: Date): boolean => {
    return date.getTime() < Date.now();
  },

  /**
   * Check if a date is in the future
   * @param date - The date to check
   * @returns True if the date is in the future
   */
  isFuture: (date: Date): boolean => {
    return date.getTime() > Date.now();
  }
};
{{/if}}

{{#if includeObject}}
/**
 * Object utilities
 */
export const object = {
  /**
   * Deep clone an object
   * @param obj - The object to clone
   * @returns Cloned object
   */
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => object.deepClone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = object.deepClone(obj[key]);
      }
    }

    return cloned;
  },

  /**
   * Merge objects deeply
   * @param target - The target object
   * @param sources - The source objects
   * @returns Merged object
   */
  deepMerge: <T>(target: T, ...sources: Partial<T>[]): T => {
    if (!sources.length) {
      return target;
    }

    const source = sources.shift();
    if (source === undefined) {
      return target;
    }

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) {
            Object.assign(target, { [key]: {} });
          }
          object.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return object.deepMerge(target, ...sources);

    function isObject(item: any): item is Record<string, any> {
      return item && typeof item === 'object' && !Array.isArray(item);
    }
  },

  /**
   * Pick properties from an object
   * @param obj - The source object
   * @param keys - The keys to pick
   * @returns New object with picked properties
   */
  pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  /**
   * Omit properties from an object
   * @param obj - The source object
   * @param keys - The keys to omit
   * @returns New object without omitted properties
   */
  omit: <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj } as Omit<T, K>;
    keys.forEach(key => {
      delete result[key as unknown as keyof typeof result];
    });
    return result;
  },

  /**
   * Check if an object is empty
   * @param obj - The object to check
   * @returns True if the object is empty
   */
  isEmpty: (obj: object): boolean => {
    return Object.keys(obj).length === 0;
  },

  /**
   * Get nested property from an object safely
   * @param obj - The object to get the property from
   * @param path - The property path (e.g., 'user.address.city')
   * @param defaultValue - The default value if the property doesn't exist
   * @returns The property value or default value
   */
  get: <T>(obj: any, path: string, defaultValue?: T): T | undefined => {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }

    return (result === undefined) ? defaultValue : result;
  },

  /**
   * Set nested property in an object
   * @param obj - The object to set the property in
   * @param path - The property path (e.g., 'user.address.city')
   * @param value - The value to set
   * @returns The modified object
   */
  set: <T extends object>(obj: T, path: string, value: any): T => {
    const keys = path.split('.');
    let current = obj as any;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return obj;
  }
};
{{/if}}

{{#if includeArray}}
/**
 * Array utilities
 */
export const array = {
  /**
   * Chunk an array into smaller arrays
   * @param arr - The array to chunk
   * @param size - The chunk size
   * @returns Array of chunks
   */
  chunk: <T>(arr: T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  },

  /**
   * Get unique items from an array
   * @param arr - The array
   * @returns Array with unique items
   */
  unique: <T>(arr: T[]): T[] => {
    return [...new Set(arr)];
  },

  /**
   * Group array items by a key
   * @param arr - The array to group
   * @param keyFn - Function to get the key for each item
   * @returns Object with grouped items
   */
  groupBy: <T, K extends string | number | symbol>(arr: T[], keyFn: (item: T) => K): Record<K, T[]> => {
    return arr.reduce((result, item) => {
      const key = keyFn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
      return result;
    }, {} as Record<K, T[]>);
  },

  /**
   * Shuffle an array
   * @param arr - The array to shuffle
   * @returns Shuffled array
   */
  shuffle: <T>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  /**
   * Get the intersection of arrays
   * @param arrays - The arrays to intersect
   * @returns Array with common items
   */
  intersection: <T>(...arrays: T[][]): T[] => {
    if (arrays.length === 0) {
      return [];
    }
    if (arrays.length === 1) {
      return [...arrays[0]];
    }

    return arrays.reduce((result, arr) => {
      return result.filter(item => arr.includes(item));
    });
  },

  /**
   * Get the difference between arrays
   * @param arr - The base array
   * @param ...others - The arrays to compare against
   * @returns Array with items not in other arrays
   */
  difference: <T>(arr: T[], ...others: T[][]): T[] => {
    const combined = others.flat();
    return arr.filter(item => !combined.includes(item));
  },

  /**
   * Sort an array by a key
   * @param arr - The array to sort
   * @param key - The key to sort by
   * @param direction - The sort direction (default: 'asc')
   * @returns Sorted array
   */
  sortBy: <T>(arr: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
    const multiplier = direction === 'asc' ? 1 : -1;
    return [...arr].sort((a, b) => {
      if (a[key] < b[key]) {
        return -1 * multiplier;
      }
      if (a[key] > b[key]) {
        return 1 * multiplier;
      }
      return 0;
    });
  },

  /**
   * Find the first item that matches a predicate
   * @param arr - The array to search
   * @param predicate - The predicate function
   * @returns The first matching item or undefined
   */
  findFirst: <T>(arr: T[], predicate: (item: T) => boolean): T | undefined => {
    return arr.find(predicate);
  },

  /**
   * Find the last item that matches a predicate
   * @param arr - The array to search
   * @param predicate - The predicate function
   * @returns The last matching item or undefined
   */
  findLast: <T>(arr: T[], predicate: (item: T) => boolean): T | undefined => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (predicate(arr[i])) {
        return arr[i];
      }
    }
    return undefined;
  }
};
{{/if}}

{{#if includeErrorHandling}}
/**
 * Error handling utilities
 */
export const errorHandling = {
  /**
   * Try to execute a function and return a result or default value
   * @param fn - The function to execute
   * @param defaultValue - The default value to return if an error occurs
   * @returns The function result or default value
   */
  tryCatch: <T, D = undefined>(fn: () => T, defaultValue?: D): T | D => {
    try {
      return fn();
    } catch (error) {
      return defaultValue as D;
    }
  },

  /**
   * Create a custom error class
   * @param name - The error name
   * @returns Custom error class
   */
  createErrorClass: (name: string) => {
    return class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = name;
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, CustomError);
        }
      }
    };
  },

  /**
   * Retry a function multiple times
   * @param fn - The function to retry
   * @param options - Retry options
   * @returns Promise with the function result
   */
  retry: async <T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      delay?: number;
      backoff?: boolean;
      onRetry?: (error: Error, attempt: number) => void;
    } = {}
  ): Promise<T> => {
    const { maxRetries = 3, delay = 1000, backoff = true, onRetry } = options;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          if (onRetry) {
            onRetry(lastError, attempt);
          }

          const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError!;
  },

  /**
   * Create a timeout promise
   * @param ms - The timeout in milliseconds
   * @param message - The error message
   * @returns Promise that rejects after the timeout
   */
  timeout: (ms: number, message: string = 'Operation timed out'): Promise<never> => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  },

  /**
   * Execute a function with a timeout
   * @param fn - The function to execute
   * @param ms - The timeout in milliseconds
   * @param message - The error message
   * @returns Promise with the function result
   */
  withTimeout: async <T>(
    fn: () => Promise<T>,
    ms: number,
    message: string = 'Operation timed out'
  ): Promise<T> => {
    return Promise.race([
      fn(),
      errorHandling.timeout(ms, message)
    ]);
  }
};
{{/if}}

export default {
  {{#if includeValidation}}validation,{{/if}}
  {{#if includeFormatting}}formatting,{{/if}}
  {{#if includeDateTime}}dateTime,{{/if}}
  {{#if includeObject}}object,{{/if}}
  {{#if includeArray}}array,{{/if}}
  {{#if includeErrorHandling}}errorHandling{{/if}}
};
`;

/**
 * Default variable values for the template
 */
export const defaultVariables = {
  moduleName: "Utils",
  includeValidation: true,
  includeFormatting: true,
  includeErrorHandling: true,
  includeDateTime: true,
  includeObject: true,
  includeArray: true
};

/**
 * Metadata for the template
 */
export const metadata = {
  name: "Common Utility Functions",
  description: "A template for creating utility functions with TypeScript",
  category: "utility",
  tags: ["utility", "functions", "typescript", "helpers"],
  framework: "TypeScript",
  language: "TypeScript",
  complexity: "moderate",
  usageCount: 0,
  createdAt: "2025-02-26T00:00:00.000Z",
  updatedAt: "2025-02-26T00:00:00.000Z"
};
