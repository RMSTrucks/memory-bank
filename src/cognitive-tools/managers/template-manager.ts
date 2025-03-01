import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { logger } from '../utils/logger';

// Define types for dynamic imports
interface ImportedTemplateModule {
  template: string;
  defaultVariables: Record<string, any>;
  metadata: TemplateMetadata;
}

/**
 * Interface for template metadata
 */
export interface TemplateMetadata {
  name: string;
  description: string;
  category: string;
  tags: string[];
  framework: string;
  language: string;
  complexity: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for a template module
 */
export interface TemplateModule {
  template: string;
  defaultVariables: Record<string, any>;
  metadata: TemplateMetadata;
}

/**
 * Template Manager class for handling code generation templates
 */
export class TemplateManager {
  private templatesDir: string;
  private templates: Map<string, TemplateModule> = new Map();
  private handlebars: typeof Handlebars;

  /**
   * Constructor
   * @param templatesDir The directory containing templates
   */
  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '../templates');
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Initialize the template manager
   */
  async initialize(): Promise<void> {
    try {
      await this.loadTemplates();
      logger.info(`Loaded ${this.templates.size} templates`);
    } catch (error) {
      logger.error('Failed to initialize template manager', error);
      throw error;
    }
  }

  /**
   * Load all templates from the templates directory
   */
  private async loadTemplates(): Promise<void> {
    try {
      // Get all subdirectories in the templates directory
      const categories = await fs.promises.readdir(this.templatesDir);

      for (const category of categories) {
        const categoryPath = path.join(this.templatesDir, category);
        const stats = await fs.promises.stat(categoryPath);

        if (stats.isDirectory()) {
          // Get all template files in the category directory
          const templateFiles = await fs.promises.readdir(categoryPath);

          for (const file of templateFiles) {
            if (file.endsWith('.ts') || file.endsWith('.js')) {
              const templatePath = path.join(categoryPath, file);
              await this.loadTemplate(category, templatePath);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to load templates', error);
      throw error;
    }
  }

  /**
   * Load a single template
   * @param category The template category
   * @param templatePath The path to the template file
   */
  private async loadTemplate(category: string, templatePath: string): Promise<void> {
    try {
      // Import the template module
      const importedModule = await import(templatePath);
      const templateName = path.basename(templatePath, path.extname(templatePath));
      const templateId = `${category}/${templateName}`;

      // Type check and cast the imported module
      if (
        typeof importedModule.template === 'string' &&
        typeof importedModule.defaultVariables === 'object' &&
        importedModule.defaultVariables !== null &&
        typeof importedModule.metadata === 'object' &&
        importedModule.metadata !== null
      ) {
        const templateModule: TemplateModule = {
          template: importedModule.template,
          defaultVariables: importedModule.defaultVariables as Record<string, any>,
          metadata: importedModule.metadata as TemplateMetadata
        };

        this.templates.set(templateId, templateModule);
        logger.debug(`Loaded template: ${templateId}`);
      } else {
        logger.warn(`Invalid template format: ${templatePath}`);
      }
    } catch (error) {
      logger.error(`Failed to load template: ${templatePath}`, error);
    }
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Register the #if helper
    this.handlebars.registerHelper('if', function(this: any, conditional: any, options: Handlebars.HelperOptions) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Register the #each helper
    this.handlebars.registerHelper('each', function(this: any, context: any[], options: Handlebars.HelperOptions) {
      let ret = '';

      for (let i = 0, j = context.length; i < j; i++) {
        ret = ret + options.fn(context[i]);
      }

      return ret;
    });

    // Register additional helpers as needed
    this.handlebars.registerHelper('eq', function(a: any, b: any) {
      return a === b;
    });

    this.handlebars.registerHelper('neq', function(a: any, b: any) {
      return a !== b;
    });

    this.handlebars.registerHelper('gt', function(a: any, b: any) {
      return a > b;
    });

    this.handlebars.registerHelper('lt', function(a: any, b: any) {
      return a < b;
    });

    this.handlebars.registerHelper('gte', function(a: any, b: any) {
      return a >= b;
    });

    this.handlebars.registerHelper('lte', function(a: any, b: any) {
      return a <= b;
    });

    this.handlebars.registerHelper('and', function(a: any, b: any) {
      return a && b;
    });

    this.handlebars.registerHelper('or', function(a: any, b: any) {
      return a || b;
    });

    this.handlebars.registerHelper('not', function(a: any) {
      return !a;
    });
  }

  /**
   * Get all available templates
   * @returns A map of template IDs to template modules
   */
  getTemplates(): Map<string, TemplateModule> {
    return this.templates;
  }

  /**
   * Get a template by ID
   * @param templateId The template ID
   * @returns The template module or undefined if not found
   */
  getTemplate(templateId: string): TemplateModule | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get templates by category
   * @param category The category to filter by
   * @returns An array of template modules
   */
  getTemplatesByCategory(category: string): TemplateModule[] {
    const result: TemplateModule[] = [];

    for (const [id, template] of this.templates.entries()) {
      if (id.startsWith(`${category}/`)) {
        result.push(template);
      }
    }

    return result;
  }

  /**
   * Get templates by tag
   * @param tag The tag to filter by
   * @returns An array of template modules
   */
  getTemplatesByTag(tag: string): TemplateModule[] {
    const result: TemplateModule[] = [];

    for (const [, template] of this.templates.entries()) {
      if (template.metadata.tags.includes(tag)) {
        result.push(template);
      }
    }

    return result;
  }

  /**
   * Render a template with variables
   * @param templateId The template ID
   * @param variables The variables to use for rendering
   * @returns The rendered template
   */
  renderTemplate(templateId: string, variables: Record<string, any> = {}): string {
    const templateModule = this.getTemplate(templateId);

    if (!templateModule) {
      throw new Error(`Template not found: ${templateId}`);
    }

    try {
      // Ensure defaultVariables is a valid object
      const defaultVars = templateModule.defaultVariables || {};

      // Merge default variables with provided variables
      const mergedVariables = {
        ...defaultVars,
        ...variables
      };

      // Compile and render the template
      const compiledTemplate = this.handlebars.compile(templateModule.template);
      const rendered = compiledTemplate(mergedVariables);

      // Update usage count
      templateModule.metadata.usageCount += 1;
      templateModule.metadata.updatedAt = new Date().toISOString();

      return rendered;
    } catch (error) {
      logger.error(`Failed to render template: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * Generate a file from a template
   * @param templateId The template ID
   * @param outputPath The path to write the file to
   * @param variables The variables to use for rendering
   * @returns The path to the generated file
   */
  async generateFile(
    templateId: string,
    outputPath: string,
    variables: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Render the template with type-safe variables
      const safeVariables: Record<string, any> = variables || {};
      const content = this.renderTemplate(templateId, safeVariables);

      // Ensure the directory exists
      const outputDir = path.dirname(outputPath);
      await fs.promises.mkdir(outputDir, { recursive: true });

      // Write the file
      await fs.promises.writeFile(outputPath, content, 'utf8');

      logger.info(`Generated file: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error(`Failed to generate file: ${outputPath}`, error);
      throw error;
    }
  }

  /**
   * Add a new template
   * @param templateId The template ID
   * @param template The template string
   * @param defaultVariables The default variables
   * @param metadata The template metadata
   */
  addTemplate(
    templateId: string,
    template: string,
    defaultVariables: Record<string, any>,
    metadata: TemplateMetadata
  ): void {
    this.templates.set(templateId, {
      template,
      defaultVariables,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      }
    });

    logger.info(`Added template: ${templateId}`);
  }

  /**
   * Update an existing template
   * @param templateId The template ID
   * @param template The template string
   * @param defaultVariables The default variables
   * @param metadata The template metadata
   */
  updateTemplate(
    templateId: string,
    template?: string,
    defaultVariables?: Record<string, any>,
    metadata?: Partial<TemplateMetadata>
  ): void {
    const existingTemplate = this.getTemplate(templateId);

    if (!existingTemplate) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Ensure we have valid objects
    const safeDefaultVars = defaultVariables || existingTemplate.defaultVariables || {};
    const safeMetadata = metadata || {};

    this.templates.set(templateId, {
      template: template || existingTemplate.template,
      defaultVariables: safeDefaultVars,
      metadata: {
        ...existingTemplate.metadata,
        ...safeMetadata,
        updatedAt: new Date().toISOString()
      }
    });

    logger.info(`Updated template: ${templateId}`);
  }

  /**
   * Remove a template
   * @param templateId The template ID
   */
  removeTemplate(templateId: string): void {
    if (!this.templates.has(templateId)) {
      throw new Error(`Template not found: ${templateId}`);
    }

    this.templates.delete(templateId);
    logger.info(`Removed template: ${templateId}`);
  }

  /**
   * Save a template to disk
   * @param templateId The template ID
   * @param overwrite Whether to overwrite an existing file
   */
  async saveTemplateToDisk(templateId: string, overwrite: boolean = false): Promise<string> {
    const templateModule = this.getTemplate(templateId);

    if (!templateModule) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const [category, name] = templateId.split('/');
    const outputDir = path.join(this.templatesDir, category);
    const outputPath = path.join(outputDir, `${name}.ts`);

    // Check if the file already exists
    if (!overwrite) {
      try {
        await fs.promises.access(outputPath);
        throw new Error(`Template file already exists: ${outputPath}`);
      } catch (error: any) {
        // File doesn't exist, we can proceed
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    // Ensure the directory exists
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Create the template file content
    const content = `/**
 * ${templateModule.metadata.name} Template
 *
 * ${templateModule.metadata.description}
 */

export const template = \`${templateModule.template.replace(/`/g, '\\`')}\`;

/**
 * Default variable values for the template
 */
export const defaultVariables = ${JSON.stringify(templateModule.defaultVariables, null, 2)};

/**
 * Metadata for the template
 */
export const metadata = ${JSON.stringify(templateModule.metadata, null, 2)};
`;

    // Write the file
    await fs.promises.writeFile(outputPath, content, 'utf8');

    logger.info(`Saved template to disk: ${outputPath}`);
    return outputPath;
  }
}

export default TemplateManager;
