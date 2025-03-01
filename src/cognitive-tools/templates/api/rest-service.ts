/**
 * REST API Service Template
 *
 * A template for creating REST API service classes with TypeScript
 */

export const template = `import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Interface for the {{resourceName}} resource
 */
export interface {{resourceInterface}} {
  id: {{idType}};
{{#if resourceProperties}}
{{resourceProperties}}
{{/if}}
  createdAt?: string;
  updatedAt?: string;
}

/**
 * {{serviceName}} - Service for interacting with the {{resourceName}} API
 */
export class {{serviceName}} {
  private apiClient: AxiosInstance;
  private baseUrl: string;

  /**
   * Constructor
   * @param baseUrl - Base URL for the API
   * @param config - Optional Axios configuration
   */
  constructor(baseUrl: string = '/api', config: AxiosRequestConfig = {}) {
    this.baseUrl = baseUrl;
    this.apiClient = axios.create({
      baseURL: baseUrl,
      ...config
    });

    // Add request interceptor for authentication if needed
    this.apiClient.interceptors.request.use(
      (config) => {
        // Example: Add auth token to headers
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = \`Bearer \${token}\`;
        // }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle specific error cases
        if (error.response) {
          // Server responded with a status code outside of 2xx range
          console.error('API Error:', error.response.status, error.response.data);

          // Handle specific status codes
          switch (error.response.status) {
            case 401:
              // Unauthorized - handle authentication error
              break;
            case 403:
              // Forbidden - handle permission error
              break;
            case 404:
              // Not found - handle resource not found
              break;
            case 500:
              // Server error - handle server error
              break;
          }
        } else if (error.request) {
          // Request was made but no response was received
          console.error('API Error: No response received', error.request);
        } else {
          // Error setting up the request
          console.error('API Error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all {{resourceName}} resources
   * @param params - Optional query parameters
   * @returns Promise with array of {{resourceName}} objects
   */
  async getAll(params: Record<string, any> = {}): Promise<{{resourceInterface}}[]> {
    try {
      const response: AxiosResponse<{{resourceInterface}}[]> = await this.apiClient.get(
        '/{{resourceEndpoint}}',
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching {{resourceName}} list:', error);
      throw error;
    }
  }

  /**
   * Get a {{resourceName}} by ID
   * @param id - The {{resourceName}} ID
   * @returns Promise with the {{resourceName}} object
   */
  async getById(id: {{idType}}): Promise<{{resourceInterface}}> {
    try {
      const response: AxiosResponse<{{resourceInterface}}> = await this.apiClient.get(
        \`/{{resourceEndpoint}}/\${id}\`
      );
      return response.data;
    } catch (error) {
      console.error(\`Error fetching {{resourceName}} with ID \${id}:\`, error);
      throw error;
    }
  }

  /**
   * Create a new {{resourceName}}
   * @param data - The {{resourceName}} data
   * @returns Promise with the created {{resourceName}} object
   */
  async create(data: Omit<{{resourceInterface}}, 'id' | 'createdAt' | 'updatedAt'>): Promise<{{resourceInterface}}> {
    try {
      const response: AxiosResponse<{{resourceInterface}}> = await this.apiClient.post(
        '/{{resourceEndpoint}}',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error creating {{resourceName}}:', error);
      throw error;
    }
  }

  /**
   * Update a {{resourceName}}
   * @param id - The {{resourceName}} ID
   * @param data - The {{resourceName}} data to update
   * @returns Promise with the updated {{resourceName}} object
   */
  async update(id: {{idType}}, data: Partial<Omit<{{resourceInterface}}, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{{resourceInterface}}> {
    try {
      const response: AxiosResponse<{{resourceInterface}}> = await this.apiClient.put(
        \`/{{resourceEndpoint}}/\${id}\`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(\`Error updating {{resourceName}} with ID \${id}:\`, error);
      throw error;
    }
  }

  /**
   * Delete a {{resourceName}}
   * @param id - The {{resourceName}} ID
   * @returns Promise with the deleted {{resourceName}} object or success status
   */
  async delete(id: {{idType}}): Promise<void> {
    try {
      await this.apiClient.delete(\`/{{resourceEndpoint}}/\${id}\`);
    } catch (error) {
      console.error(\`Error deleting {{resourceName}} with ID \${id}:\`, error);
      throw error;
    }
  }

  {{#if hasSearch}}
  /**
   * Search for {{resourceName}} resources
   * @param query - The search query
   * @param params - Additional query parameters
   * @returns Promise with array of matching {{resourceName}} objects
   */
  async search(query: string, params: Record<string, any> = {}): Promise<{{resourceInterface}}[]> {
    try {
      const response: AxiosResponse<{{resourceInterface}}[]> = await this.apiClient.get(
        '/{{resourceEndpoint}}/search',
        {
          params: {
            q: query,
            ...params
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error searching {{resourceName}}:', error);
      throw error;
    }
  }
  {{/if}}

  {{#if hasBatch}}
  /**
   * Batch create multiple {{resourceName}} resources
   * @param items - Array of {{resourceName}} data
   * @returns Promise with array of created {{resourceName}} objects
   */
  async batchCreate(items: Array<Omit<{{resourceInterface}}, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{{resourceInterface}}[]> {
    try {
      const response: AxiosResponse<{{resourceInterface}}[]> = await this.apiClient.post(
        '/{{resourceEndpoint}}/batch',
        { items }
      );
      return response.data;
    } catch (error) {
      console.error('Error batch creating {{resourceName}}:', error);
      throw error;
    }
  }

  /**
   * Batch update multiple {{resourceName}} resources
   * @param items - Array of {{resourceName}} data with IDs
   * @returns Promise with array of updated {{resourceName}} objects
   */
  async batchUpdate(items: Array<Pick<{{resourceInterface}}, 'id'> & Partial<Omit<{{resourceInterface}}, 'id' | 'createdAt' | 'updatedAt'>>>): Promise<{{resourceInterface}}[]> {
    try {
      const response: AxiosResponse<{{resourceInterface}}[]> = await this.apiClient.put(
        '/{{resourceEndpoint}}/batch',
        { items }
      );
      return response.data;
    } catch (error) {
      console.error('Error batch updating {{resourceName}}:', error);
      throw error;
    }
  }

  /**
   * Batch delete multiple {{resourceName}} resources
   * @param ids - Array of {{resourceName}} IDs to delete
   * @returns Promise with success status
   */
  async batchDelete(ids: {{idType}}[]): Promise<void> {
    try {
      await this.apiClient.delete('/{{resourceEndpoint}}/batch', {
        data: { ids }
      });
    } catch (error) {
      console.error('Error batch deleting {{resourceName}}:', error);
      throw error;
    }
  }
  {{/if}}
}

export default {{serviceName}};
`;

/**
 * Default variable values for the template
 */
export const defaultVariables = {
  serviceName: "ExampleService",
  resourceName: "Example",
  resourceInterface: "Example",
  resourceEndpoint: "examples",
  resourceProperties: "  name: string;\n  description: string;",
  idType: "string",
  hasSearch: true,
  hasBatch: true
};

/**
 * Metadata for the template
 */
export const metadata = {
  name: "REST API Service",
  description: "A template for creating REST API service classes with TypeScript",
  category: "api",
  tags: ["api", "service", "rest", "typescript", "backend"],
  framework: "Axios",
  language: "TypeScript",
  complexity: "moderate",
  usageCount: 0,
  createdAt: "2025-02-26T00:00:00.000Z",
  updatedAt: "2025-02-26T00:00:00.000Z"
};
