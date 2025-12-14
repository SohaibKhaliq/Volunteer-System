/**
 * Dynamic Configuration Service
 * Provides runtime configuration for various system components
 */
export default class DynamicConfigService {
  /**
   * Get searchable fields for a given resource type
   */
  public static getSearchableFields(resourceType: string): string[] {
    const searchConfigs: Record<string, string[]> = {
      users: ['name', 'email', 'bio'],
      organizations: ['name', 'description', 'website', 'address'],
      opportunities: ['title', 'description', 'location'],
      events: ['title', 'description', 'location'],
      tasks: ['title', 'description'],
      volunteers: ['name', 'email', 'skills'],
      resources: ['name', 'description', 'category'],
      achievements: ['title', 'description'],
      courses: ['title', 'description'],
      roles: ['name', 'description']
    }

    return searchConfigs[resourceType] || ['name', 'description']
  }

  /**
   * Get filterable fields for a given resource type
   */
  public static getFilterableFields(resourceType: string): string[] {
    const filterConfigs: Record<string, string[]> = {
      users: ['status', 'role', 'isAdmin'],
      organizations: ['status', 'type', 'city', 'country'],
      opportunities: ['status', 'organizationId', 'category'],
      events: ['status', 'organizationId', 'category'],
      tasks: ['status', 'priority', 'assigneeId'],
      volunteers: ['status', 'organizationId'],
      resources: ['status', 'category', 'organizationId'],
      achievements: ['organizationId', 'isEnabled'],
      courses: ['status', 'category'],
      backgroundChecks: ['status', 'userId']
    }

    return filterConfigs[resourceType] || ['status']
  }

  /**
   * Get sortable fields for a given resource type
   */
  public static getSortableFields(resourceType: string): string[] {
    const sortConfigs: Record<string, string[]> = {
      users: ['id', 'name', 'email', 'createdAt', 'updatedAt'],
      organizations: ['id', 'name', 'createdAt', 'updatedAt'],
      opportunities: ['id', 'title', 'createdAt', 'startDate', 'endDate'],
      events: ['id', 'title', 'createdAt', 'startDate', 'endDate'],
      tasks: ['id', 'title', 'priority', 'dueDate', 'createdAt'],
      volunteers: ['id', 'name', 'createdAt', 'totalHours'],
      resources: ['id', 'name', 'quantity', 'createdAt'],
      achievements: ['id', 'title', 'points', 'createdAt']
    }

    return sortConfigs[resourceType] || ['id', 'createdAt']
  }

  /**
   * Get default sort configuration for a resource type
   */
  public static getDefaultSort(resourceType: string): { field: string; direction: 'asc' | 'desc' } {
    const defaultSorts: Record<string, { field: string; direction: 'asc' | 'desc' }> = {
      users: { field: 'id', direction: 'desc' },
      organizations: { field: 'id', direction: 'desc' },
      opportunities: { field: 'startDate', direction: 'desc' },
      events: { field: 'startDate', direction: 'desc' },
      tasks: { field: 'priority', direction: 'desc' },
      volunteers: { field: 'createdAt', direction: 'desc' },
      resources: { field: 'name', direction: 'asc' },
      achievements: { field: 'points', direction: 'desc' },
      roles: { field: 'id', direction: 'asc' },
      types: { field: 'id', direction: 'asc' }
    }

    return defaultSorts[resourceType] || { field: 'id', direction: 'desc' }
  }

  /**
   * Get pagination configuration for a resource type
   */
  public static getPaginationConfig(resourceType: string): {
    defaultPerPage: number
    maxPerPage: number
  } {
    const paginationConfigs: Record<string, { defaultPerPage: number; maxPerPage: number }> = {
      users: { defaultPerPage: 20, maxPerPage: 100 },
      organizations: { defaultPerPage: 20, maxPerPage: 100 },
      opportunities: { defaultPerPage: 15, maxPerPage: 50 },
      events: { defaultPerPage: 15, maxPerPage: 50 },
      tasks: { defaultPerPage: 25, maxPerPage: 100 },
      volunteers: { defaultPerPage: 20, maxPerPage: 100 },
      resources: { defaultPerPage: 20, maxPerPage: 100 },
      achievements: { defaultPerPage: 30, maxPerPage: 100 },
      auditLogs: { defaultPerPage: 50, maxPerPage: 200 }
    }

    return paginationConfigs[resourceType] || { defaultPerPage: 20, maxPerPage: 100 }
  }

  /**
   * Get status options for a resource type
   */
  public static getStatusOptions(resourceType: string): string[] {
    const statusConfigs: Record<string, string[]> = {
      users: ['active', 'inactive', 'suspended'],
      organizations: ['pending', 'active', 'suspended', 'archived'],
      opportunities: ['draft', 'published', 'active', 'completed', 'cancelled'],
      events: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
      tasks: ['pending', 'in_progress', 'completed', 'cancelled'],
      applications: ['pending', 'accepted', 'rejected', 'withdrawn'],
      volunteerHours: ['pending', 'approved', 'rejected'],
      backgroundChecks: ['pending', 'in_progress', 'cleared', 'flagged'],
      resources: ['available', 'assigned', 'maintenance', 'retired']
    }

    return statusConfigs[resourceType] || ['active', 'inactive']
  }

  /**
   * Get validation rules for a resource type
   */
  public static getValidationRules(
    resourceType: string,
    action: 'create' | 'update'
  ): Record<string, any> {
    // This could be extended with more complex validation rules
    const validationConfigs: Record<string, Record<string, any>> = {
      roles: {
        create: {
          name: 'required|string|min:2|max:100',
          description: 'string|max:500'
        },
        update: {
          name: 'string|min:2|max:100',
          description: 'string|max:500'
        }
      },
      types: {
        create: {
          type: 'required|string',
          name: 'required|string|min:2|max:100',
          category: 'string|max:100',
          description: 'string|max:500'
        },
        update: {
          type: 'string',
          name: 'string|min:2|max:100',
          category: 'string|max:100',
          description: 'string|max:500'
        }
      }
    }

    return validationConfigs[resourceType]?.[action] || {}
  }

  /**
   * Check if a field is searchable for a resource type
   */
  public static isSearchableField(resourceType: string, field: string): boolean {
    return this.getSearchableFields(resourceType).includes(field)
  }

  /**
   * Check if a field is filterable for a resource type
   */
  public static isFilterableField(resourceType: string, field: string): boolean {
    return this.getFilterableFields(resourceType).includes(field)
  }

  /**
   * Check if a field is sortable for a resource type
   */
  public static isSortableField(resourceType: string, field: string): boolean {
    return this.getSortableFields(resourceType).includes(field)
  }

  /**
   * Get allowed file upload extensions for a resource type
   */
  public static getAllowedFileExtensions(uploadType: string): string[] {
    const extensionConfigs: Record<string, string[]> = {
      profile: ['jpg', 'jpeg', 'png', 'gif'],
      document: ['pdf', 'doc', 'docx', 'txt'],
      compliance: ['pdf', 'jpg', 'jpeg', 'png'],
      helpRequest: ['png', 'jpg', 'jpeg', 'pdf', 'txt', 'doc', 'docx'],
      offer: ['png', 'jpg', 'jpeg', 'pdf', 'txt', 'doc', 'docx'],
      carpooling: ['png', 'jpg', 'jpeg', 'pdf', 'txt', 'doc', 'docx'],
      resource: ['jpg', 'jpeg', 'png', 'pdf'],
      general: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt']
    }

    return extensionConfigs[uploadType] || extensionConfigs.general
  }

  /**
   * Get max file size for upload type (in bytes)
   */
  public static getMaxFileSize(uploadType: string): number {
    const sizeConfigs: Record<string, number> = {
      profile: 2 * 1024 * 1024, // 2MB
      document: 10 * 1024 * 1024, // 10MB
      compliance: 10 * 1024 * 1024, // 10MB
      general: 5 * 1024 * 1024 // 5MB
    }

    return sizeConfigs[uploadType] || sizeConfigs.general
  }
}
