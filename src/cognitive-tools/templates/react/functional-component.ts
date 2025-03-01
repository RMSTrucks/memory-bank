/**
 * React Functional Component Template
 *
 * A template for creating React functional components with TypeScript
 */

export const template = `import React, { useState, useEffect } from 'react';
{{#if hasStyles}}
import './{{fileName}}.css';
{{/if}}

/**
 * Props for the {{componentName}} component
 */
export interface {{componentName}}Props {
{{#if propsInterface}}
{{propsInterface}}
{{else}}
  /**
   * Optional className for styling
   */
  className?: string;
{{/if}}
}

/**
 * {{componentDescription}}
 *
 * @param props - Component props
 * @returns React component
 */
export const {{componentName}} = ({
{{#if destructuredProps}}
  {{destructuredProps}}{{#if hasDefaultProps}},{{/if}}
{{/if}}
{{#if hasDefaultProps}}
  className = ''
{{/if}}
}: {{componentName}}Props) => {
{{#if hasState}}
  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  {{#if hasData}}
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  {{/if}}

{{/if}}
{{#if hasEffects}}
  // Effects
  useEffect(() => {
    // Component mount effect
    {{#if hasData}}
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Replace with actual data fetching logic
        const response = await fetch('https://api.example.com/data');
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    {{/if}}

    // Cleanup function
    return () => {
      // Cleanup logic here
    };
  }, []); // Empty dependency array means this effect runs once on mount

{{/if}}
{{#if hasHandlers}}
  // Event handlers
  const handleClick = () => {
    console.log('Component clicked');
  };

{{/if}}
  return (
    <div className={\`{{kebabCaseName}}{{#if hasDefaultProps}} \${className}\`{{else}}\`{{/if}}>
      <h2>{{componentName}}</h2>
      {{#if hasState}}
      {isLoading && <p>Loading...</p>}
      {{#if hasData}}
      {error && <p className="error">{error}</p>}
      {data && (
        <div className="data-container">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      {{/if}}
      {{/if}}
      {{#if hasHandlers}}
      <button onClick={handleClick}>Click me</button>
      {{/if}}
    </div>
  );
};

export default {{componentName}};
`;

/**
 * Default variable values for the template
 */
export const defaultVariables = {
  componentName: "ExampleComponent",
  componentDescription: "A reusable React component",
  fileName: "example-component",
  kebabCaseName: "example-component",
  propsInterface: "",
  destructuredProps: "",
  hasDefaultProps: true,
  hasState: true,
  hasData: true,
  hasEffects: true,
  hasHandlers: true,
  hasStyles: true
};

/**
 * Metadata for the template
 */
export const metadata = {
  name: "React Functional Component",
  description: "A template for creating React functional components with TypeScript",
  category: "react",
  tags: ["react", "component", "typescript", "frontend"],
  framework: "React",
  language: "TypeScript",
  complexity: "moderate",
  usageCount: 0,
  createdAt: "2025-02-26T00:00:00.000Z",
  updatedAt: "2025-02-26T00:00:00.000Z"
};
