/**
 * Project and Code Generation Example
 *
 * This example demonstrates how to use the Project Manager and Code Generation Manager
 * to create a project, add requirements, and generate code.
 */

import { cognitiveTools } from '../index';
import {
  Project,
  ProjectType,
  ProjectStatus,
  RequirementType,
  RequirementPriority,
  RequirementStatus,
  CodeTemplate,
  CodeTemplateType,
  ProgrammingLanguage,
  TemplateVariableType,
  ComplexityLevel,
  PatternType,
  ImplementationComponentType,
  ImportanceLevel
} from '../types';
import { CodeGenerationManager } from '../managers/code-generation-manager';

// Create an instance of the CodeGenerationManager
const codeGenerationManager = new CodeGenerationManager();

/**
 * Run the example
 */
async function runExample() {
  try {
    // Initialize the Cognitive Tools
    await cognitiveTools.initialize();
    console.log('Cognitive Tools initialized');

    // Create a new project
    const projectId = await createProject();
    console.log(`Project created with ID: ${projectId}`);

    // Add requirements to the project
    const requirementId = await addRequirement(projectId);
    console.log(`Requirement added with ID: ${requirementId}`);

    // Create a code template
    const templateId = await createCodeTemplate();
    console.log(`Code template created with ID: ${templateId}`);

    // Generate code from the template
    const generationRequestId = await generateCode(templateId, projectId);
    console.log(`Code generation request created with ID: ${generationRequestId}`);

    // Since we're using our implementation, we'll just log the request ID
    // In a real implementation, we would have a method to get the generation result
    console.log('Code generation request created successfully');
    console.log(`You can use the request ID: ${generationRequestId} to retrieve the result`);

    console.log('Example completed successfully');
  } catch (error) {
    console.error('Error running example:', error);
  }
}

/**
 * Create a new project
 * @returns Project ID
 */
async function createProject(): Promise<string> {
  const project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Example Web Application',
    description: 'A simple web application to demonstrate the Project Manager',
    type: ProjectType.WEB_APP,
    status: ProjectStatus.PLANNING,
    metadata: {
      tags: ['example', 'web', 'demo'],
      importance: ImportanceLevel.MEDIUM,
      startDate: new Date().toISOString(),
      stakeholders: ['Cline', 'User'],
    },
    requirements: [],
    architecture: [],
    implementation: [],
    testing: [],
    deployment: []
  };

  return cognitiveTools.createProject(project);
}

/**
 * Add a requirement to a project
 * @param projectId Project ID
 * @returns Requirement ID
 */
async function addRequirement(projectId: string): Promise<string> {
  const requirement = {
    title: 'User Authentication',
    description: 'Users should be able to register, log in, and log out of the application',
    type: RequirementType.FUNCTIONAL,
    priority: RequirementPriority.MUST_HAVE,
    status: RequirementStatus.APPROVED,
    acceptanceCriteria: [
      'Users can register with email and password',
      'Users can log in with email and password',
      'Users can log out',
      'Password must be at least 8 characters long'
    ]
  };

  return cognitiveTools.addRequirement(projectId, requirement);
}

/**
 * Create a code template
 * @returns Template ID
 */
async function createCodeTemplate(): Promise<string> {
  const template: Omit<CodeTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'React Authentication Component',
    description: 'A React component for user authentication',
    type: CodeTemplateType.COMPONENT,
    language: ProgrammingLanguage.TYPESCRIPT,
    framework: 'React',
    content: `import React, { useState } from 'react';

interface AuthProps {
  title: string;
  onSubmit: (email: string, password: string) => void;
  submitButtonText: string;
}

const {{componentName}} = ({ title, onSubmit, submitButtonText }: AuthProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    onSubmit(email, password);
  };

  return (
    <div className="auth-form">
      <h2>{title}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button type="submit">{submitButtonText}</button>
      </form>
    </div>
  );
};

export default {{componentName}};`,
    variables: [
      {
        name: 'componentName',
        description: 'The name of the component',
        type: TemplateVariableType.STRING,
        defaultValue: 'AuthForm',
        isRequired: true
      }
    ],
    examples: [
      `import React from 'react';
import AuthForm from './AuthForm';

const LoginPage = () => {
  const handleLogin = (email, password) => {
    // Handle login logic
    console.log('Logging in with', email, password);
  };

  return (
    <div className="login-page">
      <AuthForm
        title="Log In"
        onSubmit={handleLogin}
        submitButtonText="Log In"
      />
    </div>
  );
};

export default LoginPage;`
    ],
    metadata: {
      tags: ['react', 'authentication', 'form', 'typescript'],
      patternTypes: [PatternType.STRUCTURAL],
      componentTypes: [ImplementationComponentType.COMPONENT],
      complexity: ComplexityLevel.MODERATE,
      usageCount: 0,
      rating: 4.5
    }
  };

  return cognitiveTools.createCodeTemplate(template);
}

/**
 * Generate code from a template
 * @param templateId Template ID
 * @param projectId Project ID
 * @returns Generation request ID
 */
async function generateCode(templateId: string, projectId: string): Promise<string> {
  const request = {
    templateId,
    projectId,
    name: 'Authentication Form',
    description: 'A React component for user authentication',
    variables: {
      componentName: 'AuthForm'
    },
    outputPath: 'src/components',
    metadata: {
      tags: ['react', 'authentication', 'form'],
      purpose: 'User authentication requirement implementation'
    }
  };

  return cognitiveTools.createCodeGenerationRequest(request);
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample();
}

export { runExample };
