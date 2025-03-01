import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import TemplateManager from './template-manager';

/**
 * Interface for code generation options
 */
export interface CodeGenerationOptions {
  templateId: string;
  outputPath: string;
  variables: Record<string, any>;
  overwrite?: boolean;
}

/**
 * Interface for code generation result
 */
export interface CodeGenerationResult {
  success: boolean;
  filePath?: string;
  error?: Error;
}

/**
 * Code Generation Manager class for generating code from templates
 */
export class CodeGenerationManager {
  private templateManager: TemplateManager;

  /**
   * Constructor
   * @param templateManager The template manager to use
   */
  constructor(templateManager?: TemplateManager) {
    this.templateManager = templateManager || new TemplateManager();
  }

  /**
   * Initialize the code generation manager
   */
  async initialize(): Promise<void> {
    try {
      await this.templateManager.initialize();
      logger.info('Code Generation Manager initialized');
    } catch (error) {
      logger.error('Failed to initialize Code Generation Manager', error);
      throw error;
    }
  }

  /**
   * Generate code from a template
   * @param options The code generation options
   * @returns A promise with the code generation result
   */
  async generateCode(options: CodeGenerationOptions): Promise<CodeGenerationResult> {
    try {
      // Check if the output file already exists
      if (!options.overwrite && await this.fileExists(options.outputPath)) {
        return {
          success: false,
          error: new Error(`File already exists: ${options.outputPath}`)
        };
      }

      // Generate the file
      const filePath = await this.templateManager.generateFile(
        options.templateId,
        options.outputPath,
        options.variables
      );

      return {
        success: true,
        filePath
      };
    } catch (error) {
      logger.error(`Failed to generate code: ${options.outputPath}`, error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Generate multiple files from templates
   * @param optionsArray An array of code generation options
   * @returns A promise with an array of code generation results
   */
  async generateMultiple(optionsArray: CodeGenerationOptions[]): Promise<CodeGenerationResult[]> {
    const results: CodeGenerationResult[] = [];

    for (const options of optionsArray) {
      const result = await this.generateCode(options);
      results.push(result);
    }

    return results;
  }

  /**
   * Generate a React component
   * @param componentName The name of the component
   * @param outputDir The output directory
   * @param props The component props
   * @param options Additional options
   * @returns A promise with the code generation result
   */
  async generateReactComponent(
    componentName: string,
    outputDir: string,
    props: Record<string, string> = {},
    options: Partial<CodeGenerationOptions> = {}
  ): Promise<CodeGenerationResult> {
    // Create props interface from props object
    const propsInterface = Object.entries(props)
      .map(([name, type]) => `  /** ${name} */\n  ${name}: ${type};`)
      .join('\n');

    // Create destructured props string
    const destructuredProps = Object.keys(props).join(', ');

    // Set up variables for the template
    const variables = {
      componentName,
      componentDescription: `${componentName} component`,
      propsInterface,
      destructuredProps,
      ...options.variables
    };

    // Set up the output path
    const outputPath = path.join(outputDir, `${componentName}.tsx`);

    // Generate the component
    return this.generateCode({
      templateId: 'react/functional-component',
      outputPath,
      variables,
      overwrite: options.overwrite
    });
  }

  /**
   * Generate an API service
   * @param serviceName The name of the service
   * @param outputDir The output directory
   * @param resourceName The name of the resource
   * @param resourceProperties The resource properties
   * @param options Additional options
   * @returns A promise with the code generation result
   */
  async generateApiService(
    serviceName: string,
    outputDir: string,
    resourceName: string,
    resourceProperties: Record<string, string> = {},
    options: Partial<CodeGenerationOptions> = {}
  ): Promise<CodeGenerationResult> {
    // Create resource properties string
    const resourcePropertiesStr = Object.entries(resourceProperties)
      .map(([name, type]) => `  ${name}: ${type};`)
      .join('\n');

    // Set up variables for the template
    const variables = {
      serviceName,
      resourceName,
      resourceInterface: `${resourceName}`,
      resourceEndpoint: resourceName.toLowerCase(),
      resourceProperties: resourcePropertiesStr,
      idType: resourceProperties.id || 'string',
      ...options.variables
    };

    // Set up the output path
    const outputPath = path.join(outputDir, `${serviceName}.ts`);

    // Generate the service
    return this.generateCode({
      templateId: 'api/rest-service',
      outputPath,
      variables,
      overwrite: options.overwrite
    });
  }

  /**
   * Generate utility functions
   * @param moduleName The name of the module
   * @param outputDir The output directory
   * @param options Additional options
   * @returns A promise with the code generation result
   */
  async generateUtilityFunctions(
    moduleName: string,
    outputDir: string,
    options: Partial<CodeGenerationOptions> & {
      includeValidation?: boolean;
      includeFormatting?: boolean;
      includeErrorHandling?: boolean;
      includeDateTime?: boolean;
      includeObject?: boolean;
      includeArray?: boolean;
    } = {}
  ): Promise<CodeGenerationResult> {
    // Set up variables for the template
    const variables = {
      moduleName,
      includeValidation: options.includeValidation !== false,
      includeFormatting: options.includeFormatting !== false,
      includeErrorHandling: options.includeErrorHandling !== false,
      includeDateTime: options.includeDateTime !== false,
      includeObject: options.includeObject !== false,
      includeArray: options.includeArray !== false,
      ...options.variables
    };

    // Set up the output path
    const outputPath = path.join(outputDir, `${moduleName.toLowerCase()}.ts`);

    // Generate the utility functions
    return this.generateCode({
      templateId: 'utility/common-utils',
      outputPath,
      variables,
      overwrite: options.overwrite
    });
  }

  /**
   * Generate a Jest unit test
   * @param moduleName The name of the module being tested
   * @param outputDir The output directory
   * @param options Additional options
   * @returns A promise with the code generation result
   */
  async generateJestTest(
    moduleName: string,
    outputDir: string,
    options: Partial<CodeGenerationOptions> & {
      importPath?: string;
      testDescription?: string;
      includeMocks?: boolean;
      includeBeforeAfter?: boolean;
      includeAsyncTests?: boolean;
    } = {}
  ): Promise<CodeGenerationResult> {
    // Set up variables for the template
    const variables = {
      moduleName,
      moduleExports: moduleName,
      importPath: options.importPath || `../src/${moduleName.toLowerCase()}`,
      testDescription: options.testDescription || `${moduleName} functionality`,
      includeMocks: options.includeMocks !== false,
      includeBeforeAfter: options.includeBeforeAfter !== false,
      includeAsyncTests: options.includeAsyncTests !== false,
      ...options.variables
    };

    // Set up the output path
    const outputPath = path.join(outputDir, `${moduleName.toLowerCase()}.test.ts`);

    // Generate the test
    return this.generateCode({
      templateId: 'test/jest-unit-test',
      outputPath,
      variables,
      overwrite: options.overwrite
    });
  }

  /**
   * Generate a complete feature
   * @param featureName The name of the feature
   * @param outputDir The output directory
   * @param options Additional options
   * @returns A promise with an array of code generation results
   */
  async generateFeature(
    featureName: string,
    outputDir: string,
    options: {
      components?: Array<{ name: string; props: Record<string, string> }>;
      services?: Array<{ name: string; resourceName: string; properties: Record<string, string> }>;
      utils?: Array<{ name: string }>;
      tests?: boolean;
      overwrite?: boolean;
    } = {}
  ): Promise<CodeGenerationResult[]> {
    const results: CodeGenerationResult[] = [];
    const featureDir = path.join(outputDir, featureName);

    // Create feature directory structure
    await this.createDirectories([
      featureDir,
      path.join(featureDir, 'components'),
      path.join(featureDir, 'services'),
      path.join(featureDir, 'utils'),
      path.join(featureDir, 'tests')
    ]);

    // Generate components
    if (options.components) {
      for (const component of options.components) {
        const result = await this.generateReactComponent(
          component.name,
          path.join(featureDir, 'components'),
          component.props,
          { overwrite: options.overwrite }
        );
        results.push(result);
      }
    }

    // Generate services
    if (options.services) {
      for (const service of options.services) {
        const result = await this.generateApiService(
          service.name,
          path.join(featureDir, 'services'),
          service.resourceName,
          service.properties,
          { overwrite: options.overwrite }
        );
        results.push(result);
      }
    }

    // Generate utils
    if (options.utils) {
      for (const util of options.utils) {
        const result = await this.generateUtilityFunctions(
          util.name,
          path.join(featureDir, 'utils'),
          { overwrite: options.overwrite }
        );
        results.push(result);
      }
    }

    // Generate tests
    if (options.tests !== false) {
      // Generate component tests
      if (options.components) {
        for (const component of options.components) {
          const result = await this.generateJestTest(
            component.name,
            path.join(featureDir, 'tests'),
            {
              importPath: `../components/${component.name}`,
              testDescription: `${component.name} component`,
              overwrite: options.overwrite
            }
          );
          results.push(result);
        }
      }

      // Generate service tests
      if (options.services) {
        for (const service of options.services) {
          const result = await this.generateJestTest(
            service.name,
            path.join(featureDir, 'tests'),
            {
              importPath: `../services/${service.name}`,
              testDescription: `${service.name} service`,
              overwrite: options.overwrite
            }
          );
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Check if a file exists
   * @param filePath The file path
   * @returns A promise that resolves to true if the file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create directories
   * @param directories The directories to create
   */
  private async createDirectories(directories: string[]): Promise<void> {
    for (const dir of directories) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }
}

export default CodeGenerationManager;
