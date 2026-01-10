import { SwaggerConfig } from '@ioc:Adonis/Addons/Swagger'

export default {
  uiEnabled: true, // Disable or enable Swagger UI
  uiUrl: 'docs', // URL path for Swagger UI (will be /docs)
  specEnabled: true, // Disable or enable OpenAPI spec endpoint
  specUrl: '/swagger.json', // OpenAPI spec endpoint

  middleware: [], // Middlewares to apply on the swagger routes

  options: {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Volunteer Management System API',
        version: '1.0.0',
        description: `
Comprehensive API for managing volunteers, organizations, opportunities, shifts, hours tracking, compliance, achievements, and more.

## Features
- User Management & Authentication
- Organization Management
- Volunteer Opportunities & Applications
- Shift Scheduling & Assignments
- Attendance & Hours Tracking
- Compliance & Background Checks
- Communications & Notifications
- Achievements & Gamification
- Resource Management
- Reporting & Analytics
- Import/Export
- AI Features
- Calendar Integration
- Admin Panel
- Volunteer Portal
        `.trim(),
        contact: {
          name: 'API Support',
          email: 'support@example.com'
        }
      },
      servers: [
        {
          url: 'http://localhost:3333',
          description: 'Development server'
        },
        {
          url: 'https://api.yourdomain.com',
          description: 'Production server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Authentication using JWT token'
          },
          apiAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'API token authentication'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ],
      tags: [
        {
          name: 'Authentication',
          description: 'Authentication and authorization endpoints'
        },
        {
          name: 'User Preferences',
          description: 'User preferences and settings management'
        },
        {
          name: 'Contact Form',
          description: 'Public contact form submissions'
        },
        {
          name: 'Organizations',
          description: 'Organization management'
        },
        {
          name: 'Opportunities',
          description: 'Volunteer opportunities'
        },
        {
          name: 'Applications',
          description: 'Application management'
        },
        {
          name: 'Events',
          description: 'Event management'
        },
        {
          name: 'Shifts',
          description: 'Shift scheduling and assignments'
        },
        {
          name: 'Attendance',
          description: 'Attendance tracking'
        },
        {
          name: 'Hours',
          description: 'Volunteer hours tracking'
        },
        {
          name: 'Tasks',
          description: 'Task and assignment management'
        },
        {
          name: 'Compliance',
          description: 'Compliance and background checks'
        },
        {
          name: 'Resources',
          description: 'Resource management'
        },
        {
          name: 'Communications',
          description: 'Communication and notification management'
        },
        {
          name: 'Notifications',
          description: 'User notifications'
        },
        {
          name: 'Achievements',
          description: 'Achievements and gamification'
        },
        {
          name: 'Courses',
          description: 'Course and training management'
        },
        {
          name: 'Surveys',
          description: 'Survey and feedback system'
        },
        {
          name: 'Documents',
          description: 'Document library and acknowledgments'
        },
        {
          name: 'Reports',
          description: 'Reporting and analytics'
        },
        {
          name: 'Import/Export',
          description: 'Data import and export operations'
        },
        {
          name: 'AI',
          description: 'AI-powered features'
        },
        {
          name: 'Centrelink',
          description: 'Australian Centrelink reporting'
        },
        {
          name: 'Calendar',
          description: 'Calendar integration (iCal feeds)'
        },
        {
          name: 'Audit',
          description: 'Audit logging'
        },
        {
          name: 'System',
          description: 'System settings and configuration'
        },
        {
          name: 'Scheduled Jobs',
          description: 'Scheduled job management'
        },
        {
          name: 'Community',
          description: 'Community features (offers, carpooling, help requests)'
        },
        {
          name: 'Admin',
          description: 'Platform administration (super admin only)'
        },
        {
          name: 'Volunteer Panel',
          description: 'End-user volunteer portal'
        },
        {
          name: 'Organization Panel',
          description: 'Organization management panel'
        }
      ]
    },

    apis: ['app/**/*.ts', 'start/routes.ts', 'start/organization.ts'],
    basePath: '/'
  },
  mode: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'RUNTIME',
  specFilePath: 'docs/swagger.json'
} as SwaggerConfig
