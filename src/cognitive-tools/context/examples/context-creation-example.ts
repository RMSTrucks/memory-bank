import { ContextBuilder } from '../services/context-builder.service';
import { FunctionalRequirement, NonFunctionalRequirement, TechnicalRequirement } from '../types/requirement';

/**
 * Example demonstrating how to use the Project Context Creation system
 */
async function demonstrateContextCreation() {
  // Initialize the context builder
  const contextBuilder = new ContextBuilder();

  // Create a new project context
  const contextResult = await contextBuilder.createContext({
    name: 'E-commerce Platform',
    description: 'A modern e-commerce platform with advanced features',
    version: '1.0.0',
    scope: {
      objectives: [
        'Build a scalable e-commerce platform',
        'Support multiple payment methods',
        'Provide analytics dashboard'
      ],
      deliverables: [
        'User authentication system',
        'Product catalog',
        'Shopping cart',
        'Payment processing',
        'Admin dashboard'
      ],
      constraints: [
        'Must comply with GDPR',
        'Must support mobile devices',
        'Must handle high traffic during sales'
      ],
      assumptions: [
        'Users have stable internet connection',
        'Payment gateway API is reliable'
      ],
      exclusions: [
        'Inventory management system',
        'Customer support system'
      ]
    },
    timeline: {
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-09-30'),
      milestones: [
        {
          title: 'MVP Release',
          date: new Date('2025-06-30'),
          deliverables: [
            'Basic user authentication',
            'Product catalog',
            'Shopping cart'
          ]
        },
        {
          title: 'Beta Release',
          date: new Date('2025-08-31'),
          deliverables: [
            'Payment processing',
            'User profiles',
            'Basic analytics'
          ]
        }
      ]
    },
    stakeholders: [
      {
        name: 'Sarah Johnson',
        role: 'Product Owner',
        responsibilities: [
          'Product vision',
          'Feature prioritization',
          'Stakeholder communication'
        ],
        contactInfo: {
          email: 'sarah@example.com',
          slack: '@sarah'
        }
      },
      {
        name: 'Mike Chen',
        role: 'Technical Lead',
        responsibilities: [
          'Technical architecture',
          'Code quality',
          'Performance optimization'
        ],
        contactInfo: {
          email: 'mike@example.com',
          slack: '@mike'
        }
      }
    ]
  });

  if (!contextResult.success || !contextResult.data) {
    console.error('Failed to create context:', contextResult.error);
    return;
  }

  const context = contextResult.data;
  console.log('Created project context:', {
    id: context.id,
    name: context.name,
    stakeholders: context.stakeholders.length
  });

  // Define requirements
  const requirements = [
    // Functional Requirements
    {
      type: 'functional' as const,
      title: 'User Authentication',
      description: 'Users should be able to sign up, log in, and manage their accounts',
      priority: 'high' as const,
      acceptance: [
        'Users can sign up with email and password',
        'Users can log in with email and password',
        'Users can reset their password',
        'Users can update their profile information'
      ],
      dependencies: [],
      implementation: {
        estimatedComplexity: 'medium' as const,
        technicalNotes: 'Use JWT for authentication, implement password reset via email'
      },
      tags: ['auth', 'security', 'user-management'],
      metadata: {}
    },
    {
      type: 'functional' as const,
      title: 'Shopping Cart Management',
      description: 'Users should be able to add, remove, and modify items in their cart',
      priority: 'high' as const,
      acceptance: [
        'Users can add products to cart',
        'Users can update product quantities',
        'Users can remove products from cart',
        'Cart persists across sessions'
      ],
      dependencies: ['User Authentication'],
      implementation: {
        estimatedComplexity: 'medium' as const,
        technicalNotes: 'Use Redis for cart storage, implement cart merging for logged-in users'
      },
      tags: ['cart', 'user-experience'],
      metadata: {}
    },

    // Non-functional Requirements
    {
      type: 'non-functional' as const,
      title: 'System Performance',
      description: 'System should maintain high performance under load',
      priority: 'high' as const,
      category: 'performance' as const,
      metrics: [
        {
          measure: 'Page Load Time',
          target: '<2 seconds',
          current: '3 seconds'
        },
        {
          measure: 'API Response Time',
          target: '<200ms',
          current: '300ms'
        }
      ],
      tags: ['performance', 'scalability'],
      metadata: {}
    },

    // Technical Requirements
    {
      type: 'technical' as const,
      title: 'Database Scalability',
      description: 'Database system must scale horizontally to handle increased load',
      priority: 'high' as const,
      category: 'infrastructure' as const,
      constraints: [
        'Must support automatic sharding',
        'Must maintain ACID compliance',
        'Must support automated backups'
      ],
      impact: {
        scope: 'System-wide data persistence and performance',
        risk: 'high',
        mitigation: 'Use proven cloud database service with built-in scaling'
      },
      tags: ['database', 'scalability', 'infrastructure'],
      metadata: {}
    }
  ];

  // Add requirements to context
  const updateResult = await contextBuilder.addRequirements(context, requirements);

  if (!updateResult.success || !updateResult.data) {
    console.error('Failed to add requirements:', updateResult.error);
    return;
  }

  const updatedContext = updateResult.data;
  console.log('Updated context with requirements:', {
    totalRequirements: updatedContext.requirements.length,
    relationships: updatedContext.requirementRelationships.length,
    healthScore: updatedContext.metadata.healthScore,
    completeness: updatedContext.metadata.completeness
  });

  // Log analysis results
  console.log('Requirements by type:', {
    functional: updatedContext.requirements.filter(r => r.type === 'functional').length,
    nonFunctional: updatedContext.requirements.filter(r => r.type === 'non-functional').length,
    technical: updatedContext.requirements.filter(r => r.type === 'technical').length
  });

  console.log('Identified patterns:', updatedContext.relatedPatterns);
  console.log('Implementation plan phases:', updatedContext.implementationPlan.phases.length);
  console.log('Identified risks:', updatedContext.risks.length);
}

// Run the example
demonstrateContextCreation().catch(console.error);
