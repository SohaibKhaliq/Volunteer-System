interface ValidationError {
  row: number
  field: string
  message: string
  value?: any
}

interface BatchValidationResult {
  valid: boolean
  totalRecords: number
  validRecords: number
  invalidRecords: number
  errors: ValidationError[]
}

export default class DataValidationService {
  /**
   * Validate volunteer data
   */
  public static validateVolunteer(record: any, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = []

    // Email is required and must be valid
    if (!record.email) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Email is required'
      })
    } else if (!this.isValidEmail(record.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Invalid email format',
        value: record.email
      })
    }

    // First name validation (optional but if provided, check length)
    if (record.first_name && record.first_name.length > 100) {
      errors.push({
        row: rowNumber,
        field: 'first_name',
        message: 'First name must be less than 100 characters',
        value: record.first_name
      })
    }

    // Last name validation (optional but if provided, check length)
    if (record.last_name && record.last_name.length > 100) {
      errors.push({
        row: rowNumber,
        field: 'last_name',
        message: 'Last name must be less than 100 characters',
        value: record.last_name
      })
    }

    // Role validation
    const validRoles = ['Volunteer', 'volunteer', 'Lead', 'lead']
    if (record.role && !validRoles.includes(record.role)) {
      errors.push({
        row: rowNumber,
        field: 'role',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        value: record.role
      })
    }

    // Status validation
    const validStatuses = ['Active', 'active', 'Inactive', 'inactive', 'Pending', 'pending']
    if (record.status && !validStatuses.includes(record.status)) {
      errors.push({
        row: rowNumber,
        field: 'status',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        value: record.status
      })
    }

    return errors
  }

  /**
   * Validate opportunity data
   */
  public static validateOpportunity(record: any, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = []

    // Title is required
    if (!record.title) {
      errors.push({
        row: rowNumber,
        field: 'title',
        message: 'Title is required'
      })
    } else if (record.title.length > 255) {
      errors.push({
        row: rowNumber,
        field: 'title',
        message: 'Title must be less than 255 characters',
        value: record.title
      })
    }

    // Start date is required and must be valid ISO format
    if (!record.start_at) {
      errors.push({
        row: rowNumber,
        field: 'start_at',
        message: 'Start date is required'
      })
    } else if (!this.isValidISODate(record.start_at)) {
      errors.push({
        row: rowNumber,
        field: 'start_at',
        message: 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss)',
        value: record.start_at
      })
    }

    // End date validation (optional but must be valid if provided)
    if (record.end_at && !this.isValidISODate(record.end_at)) {
      errors.push({
        row: rowNumber,
        field: 'end_at',
        message: 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss)',
        value: record.end_at
      })
    }

    // Capacity validation
    if (record.capacity && (!Number.isInteger(Number(record.capacity)) || Number(record.capacity) < 0)) {
      errors.push({
        row: rowNumber,
        field: 'capacity',
        message: 'Capacity must be a positive integer',
        value: record.capacity
      })
    }

    // Type validation
    const validTypes = ['event', 'ongoing', 'project']
    if (record.type && !validTypes.includes(record.type.toLowerCase())) {
      errors.push({
        row: rowNumber,
        field: 'type',
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        value: record.type
      })
    }

    // Status validation
    const validStatuses = ['draft', 'published', 'cancelled', 'completed']
    if (record.status && !validStatuses.includes(record.status.toLowerCase())) {
      errors.push({
        row: rowNumber,
        field: 'status',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        value: record.status
      })
    }

    // Visibility validation
    const validVisibilities = ['public', 'private', 'unlisted']
    if (record.visibility && !validVisibilities.includes(record.visibility.toLowerCase())) {
      errors.push({
        row: rowNumber,
        field: 'visibility',
        message: `Invalid visibility. Must be one of: ${validVisibilities.join(', ')}`,
        value: record.visibility
      })
    }

    return errors
  }

  /**
   * Validate hours data
   */
  public static validateHours(record: any, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = []

    // Email is required (to identify the volunteer)
    if (!record.email) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Email is required to identify the volunteer'
      })
    } else if (!this.isValidEmail(record.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Invalid email format',
        value: record.email
      })
    }

    // Hours is required and must be positive
    if (!record.hours) {
      errors.push({
        row: rowNumber,
        field: 'hours',
        message: 'Hours is required'
      })
    } else {
      const hours = Number(record.hours)
      if (isNaN(hours) || hours <= 0) {
        errors.push({
          row: rowNumber,
          field: 'hours',
          message: 'Hours must be a positive number',
          value: record.hours
        })
      } else if (hours > 24) {
        errors.push({
          row: rowNumber,
          field: 'hours',
          message: 'Hours cannot exceed 24 per entry',
          value: record.hours
        })
      }
    }

    // Date is required and must be valid
    if (!record.date) {
      errors.push({
        row: rowNumber,
        field: 'date',
        message: 'Date is required'
      })
    } else if (!this.isValidDate(record.date)) {
      errors.push({
        row: rowNumber,
        field: 'date',
        message: 'Invalid date format. Use YYYY-MM-DD',
        value: record.date
      })
    }

    // Status validation
    const validStatuses = ['Pending', 'pending', 'Approved', 'approved', 'Rejected', 'rejected']
    if (record.status && !validStatuses.includes(record.status)) {
      errors.push({
        row: rowNumber,
        field: 'status',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        value: record.status
      })
    }

    return errors
  }

  /**
   * Batch validate records
   */
  public static validateBatch(entityType: string, records: any[]): BatchValidationResult {
    const allErrors: ValidationError[] = []
    let validCount = 0

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const rowNumber = i + 2 // +2 because row 1 is header, and array is 0-indexed

      let errors: ValidationError[] = []

      switch (entityType) {
        case 'volunteers':
          errors = this.validateVolunteer(record, rowNumber)
          break
        case 'opportunities':
          errors = this.validateOpportunity(record, rowNumber)
          break
        case 'hours':
          errors = this.validateHours(record, rowNumber)
          break
        default:
          errors = [{
            row: rowNumber,
            field: 'entity_type',
            message: `Unknown entity type: ${entityType}`
          }]
      }

      if (errors.length === 0) {
        validCount++
      } else {
        allErrors.push(...errors)
      }
    }

    return {
      valid: allErrors.length === 0,
      totalRecords: records.length,
      validRecords: validCount,
      invalidRecords: records.length - validCount,
      errors: allErrors
    }
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate ISO date format
   */
  private static isValidISODate(dateString: string): boolean {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  /**
   * Validate simple date format (YYYY-MM-DD)
   */
  private static isValidDate(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateString)) return false

    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }
}

export { ValidationError, BatchValidationResult }
