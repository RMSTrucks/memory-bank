/**
 * Jest Unit Test Template
 *
 * A template for creating Jest unit tests with TypeScript
 */

export const template = `import { {{#if hasDefaultExport}}default as {{moduleName}}{{else}}{{exportedItems}}{{/if}} } from '{{importPath}}';
{{#if additionalImports}}
{{additionalImports}}
{{/if}}

/**
 * {{testDescription}}
 */
describe('{{moduleName}}', () => {
  {{#if hasBeforeEach}}
  // Setup before each test
  beforeEach(() => {
    {{beforeEachSetup}}
  });
  {{/if}}

  {{#if hasAfterEach}}
  // Cleanup after each test
  afterEach(() => {
    {{afterEachCleanup}}
  });
  {{/if}}

  {{#if hasBeforeAll}}
  // Setup once before all tests
  beforeAll(() => {
    {{beforeAllSetup}}
  });
  {{/if}}

  {{#if hasAfterAll}}
  // Cleanup once after all tests
  afterAll(() => {
    {{afterAllCleanup}}
  });
  {{/if}}

  {{#if hasMocks}}
  // Mocks
  {{#each mocks}}
  const {{this.name}} = jest.fn({{#if this.implementation}}{{this.implementation}}{{/if}});
  {{/each}}
  {{/if}}

  {{#if hasBasicTests}}
  test('should exist', () => {
    expect({{moduleName}}).toBeDefined();
  });
  {{/if}}

  {{#if testFunctions}}
  {{#each testFunctions}}
  describe('{{this.name}}', () => {
    {{#if this.validInputTests}}
    test('should handle valid inputs correctly', () => {
      {{#each this.validInputTests}}
      expect({{../../../moduleName}}.{{../name}}({{this.input}})).{{this.assertion}};
      {{/each}}
    });
    {{/if}}

    {{#if this.invalidInputTests}}
    test('should handle invalid inputs correctly', () => {
      {{#each this.invalidInputTests}}
      expect(() => {{../../../moduleName}}.{{../name}}({{this.input}})).{{this.assertion}};
      {{/each}}
    });
    {{/if}}

    {{#if this.asyncTests}}
    test('should handle async operations correctly', async () => {
      {{#each this.asyncTests}}
      await expect({{../../../moduleName}}.{{../name}}({{this.input}})).{{this.assertion}};
      {{/each}}
    });
    {{/if}}

    {{#if this.mockTests}}
    test('should interact with dependencies correctly', () => {
      {{#each this.mockTests}}
      {{this.setup}}
      {{../../../moduleName}}.{{../name}}({{this.input}});
      {{this.assertion}}
      {{/each}}
    });
    {{/if}}
  });
  {{/each}}
  {{/if}}

  {{#if hasCustomTests}}
  {{#each customTests}}
  test('{{this.description}}', {{#if this.isAsync}}async {{/if}}() => {
    {{this.testCode}}
  });
  {{/each}}
  {{/if}}

  {{#if hasEdgeCases}}
  describe('edge cases', () => {
    {{#each edgeCases}}
    test('{{this.description}}', {{#if this.isAsync}}async {{/if}}() => {
      {{this.testCode}}
    });
    {{/each}}
  });
  {{/if}}

  {{#if hasErrorTests}}
  describe('error handling', () => {
    {{#each errorTests}}
    test('{{this.description}}', {{#if this.isAsync}}async {{/if}}() => {
      {{this.testCode}}
    });
    {{/each}}
  });
  {{/if}}

  {{#if hasSnapshotTests}}
  describe('snapshots', () => {
    {{#each snapshotTests}}
    test('{{this.description}}', () => {
      const result = {{../moduleName}}.{{this.functionName}}({{this.input}});
      expect(result).toMatchSnapshot();
    });
    {{/each}}
  });
  {{/if}}
});
`;

/**
 * Default variable values for the template
 */
export const defaultVariables = {
  moduleName: "ExampleModule",
  importPath: "../src/example-module",
  testDescription: "Unit tests for ExampleModule",
  hasDefaultExport: true,
  exportedItems: "{ functionOne, functionTwo }",
  additionalImports: "import { mockData } from '../__mocks__/mock-data';",
  hasBeforeEach: true,
  beforeEachSetup: "jest.clearAllMocks();",
  hasAfterEach: false,
  afterEachCleanup: "",
  hasBeforeAll: false,
  beforeAllSetup: "",
  hasAfterAll: false,
  afterAllCleanup: "",
  hasMocks: true,
  mocks: [
    {
      name: "mockFunction",
      implementation: "() => ({ success: true })"
    }
  ],
  hasBasicTests: true,
  testFunctions: [
    {
      name: "functionOne",
      validInputTests: [
        {
          input: "'test'",
          assertion: "toBe('TEST')"
        },
        {
          input: "'hello'",
          assertion: "toBe('HELLO')"
        }
      ],
      invalidInputTests: [
        {
          input: "null",
          assertion: "toThrow()"
        }
      ],
      asyncTests: [],
      mockTests: []
    },
    {
      name: "functionTwo",
      validInputTests: [
        {
          input: "1, 2",
          assertion: "toBe(3)"
        }
      ],
      invalidInputTests: [],
      asyncTests: [],
      mockTests: [
        {
          setup: "const spy = jest.spyOn(console, 'log');",
          input: "1, 2",
          assertion: "expect(spy).toHaveBeenCalledWith('Adding numbers');"
        }
      ]
    }
  ],
  hasCustomTests: true,
  customTests: [
    {
      description: "should handle a custom scenario",
      isAsync: false,
      testCode: "const result = ExampleModule.functionOne('custom');\nexpect(result).toBe('CUSTOM');"
    }
  ],
  hasEdgeCases: true,
  edgeCases: [
    {
      description: "should handle empty strings",
      isAsync: false,
      testCode: "expect(ExampleModule.functionOne('')).toBe('');"
    }
  ],
  hasErrorTests: true,
  errorTests: [
    {
      description: "should throw an error for invalid input",
      isAsync: false,
      testCode: "expect(() => ExampleModule.functionOne(undefined)).toThrow('Invalid input');"
    }
  ],
  hasSnapshotTests: true,
  snapshotTests: [
    {
      description: "should match snapshot for complex output",
      functionName: "generateReport",
      input: "mockData"
    }
  ]
};

/**
 * Metadata for the template
 */
export const metadata = {
  name: "Jest Unit Test",
  description: "A template for creating Jest unit tests with TypeScript",
  category: "test",
  tags: ["test", "jest", "unit test", "typescript", "testing"],
  framework: "Jest",
  language: "TypeScript",
  complexity: "moderate",
  usageCount: 0,
  createdAt: "2025-02-26T00:00:00.000Z",
  updatedAt: "2025-02-26T00:00:00.000Z"
};
