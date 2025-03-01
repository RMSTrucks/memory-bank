export interface CacheOptions {
    ttl?: number;  // Time to live in seconds
    maxSize?: number;  // Maximum number of items
    namespace?: string;  // Cache namespace
}

export class Cache {
    private store: Map<string, { value: any; expires: number }>;
    private options: Required<CacheOptions>;

    constructor(
        namespace: string,
        maxSize: number = 1000,
        ttl: number = 3600
    ) {
        this.store = new Map();
        this.options = {
            namespace,
            maxSize,
            ttl
        };
    }

    async get<T>(key: string): Promise<T | null> {
        const item = this.store.get(this.getNamespacedKey(key));
        if (!item) return null;

        if (Date.now() > item.expires) {
            this.store.delete(this.getNamespacedKey(key));
            return null;
        }

        return item.value as T;
    }

    async set(key: string, value: any): Promise<void> {
        if (this.store.size >= this.options.maxSize) {
            // Remove oldest entry
            const firstKey = this.store.keys().next().value;
            this.store.delete(firstKey);
        }

        this.store.set(this.getNamespacedKey(key), {
            value,
            expires: Date.now() + (this.options.ttl * 1000)
        });
    }

    async delete(key: string): Promise<void> {
        this.store.delete(this.getNamespacedKey(key));
    }

    async clear(): Promise<void> {
        this.store.clear();
    }

    private getNamespacedKey(key: string): string {
        return `${this.options.namespace}:${key}`;
    }
}
