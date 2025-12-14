import Logger from '@ioc:Adonis/Core/Logger'

/**
 * Australian Compliance Service
 * Handles WWCC and NPC validation for Australian states/territories
 */
export default class ComplianceService {
  /**
   * WWCC Validation Patterns by State/Territory
   */
  private static readonly WWCC_PATTERNS: Record<string, RegExp> = {
    VIC: /^\d{8}[A-Za-z]$/, // 8 digits + check letter
    NSW: /^WWC\d{7}[EV]$/, // WWC prefix + 7 digits + E/V
    QLD: /^\d{5,7}\/\d{1,2}$/, // Blue Card: 5-7 digits / 1-2 digits
    WA: /^\d{6,7}$/, // 6-7 digits
    SA: /^\d{7}$/, // 7 digits
    TAS: /^\d{8}$/, // 8 digits
    NT: /^\d{6,8}$/, // 6-8 digits
    ACT: /^\d{8}$/ // 8 digits
  }

  /**
   * Validate WWCC number based on state/territory
   */
  public static validateWWCC(wwccNumber: string, state: string): {
    valid: boolean
    message?: string
  } {
    const normalizedState = state.toUpperCase()
    const pattern = this.WWCC_PATTERNS[normalizedState]

    if (!pattern) {
      return {
        valid: false,
        message: `Invalid state/territory: ${state}. Must be one of: ${Object.keys(this.WWCC_PATTERNS).join(', ')}`
      }
    }

    const isValid = pattern.test(wwccNumber.trim())

    if (!isValid) {
      return {
        valid: false,
        message: this.getWWCCFormatMessage(normalizedState)
      }
    }

    return { valid: true }
  }

  /**
   * Get format message for WWCC by state
   */
  private static getWWCCFormatMessage(state: string): string {
    const formats: Record<string, string> = {
      VIC: 'Victoria WWCC must be 8 digits followed by a letter (e.g., 12345678A)',
      NSW: 'NSW WWCC must start with WWC, followed by 7 digits and E or V (e.g., WWC1234567E)',
      QLD: 'Queensland Blue Card must be 5-7 digits, slash, then 1-2 digits (e.g., 12345/1)',
      WA: 'Western Australia WWCC must be 6-7 digits (e.g., 123456)',
      SA: 'South Australia WWCC must be 7 digits (e.g., 1234567)',
      TAS: 'Tasmania WWCC must be 8 digits (e.g., 12345678)',
      NT: 'Northern Territory WWCC must be 6-8 digits (e.g., 123456)',
      ACT: 'Australian Capital Territory WWCC must be 8 digits (e.g., 12345678)'
    }
    return formats[state] || `Invalid WWCC format for ${state}`
  }

  /**
   * Check if a compliance document is expiring soon (within specified days)
   */
  public static isExpiringSoon(expiryDate: Date, daysThreshold: number = 30): boolean {
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= daysThreshold
  }

  /**
   * Check if a compliance document has expired
   */
  public static isExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate
  }

  /**
   * Validate Australian mobile phone number
   */
  public static validateAustralianMobile(phone: string): {
    valid: boolean
    message?: string
  } {
    // Australian mobile format: 04XX XXX XXX or +61 4XX XXX XXX
    const cleanPhone = phone.replace(/\s+/g, '')
    const mobilePattern = /^(\+?61|0)4\d{8}$/

    if (!mobilePattern.test(cleanPhone)) {
      return {
        valid: false,
        message: 'Australian mobile must start with 04 and be 10 digits (e.g., 0412 345 678)'
      }
    }

    return { valid: true }
  }

  /**
   * Validate Australian Business Number (ABN)
   */
  public static validateABN(abn: string): {
    valid: boolean
    message?: string
  } {
    // Remove spaces and validate length
    const cleanABN = abn.replace(/\s+/g, '')

    if (!/^\d{11}$/.test(cleanABN)) {
      return {
        valid: false,
        message: 'ABN must be 11 digits (e.g., 12 345 678 901)'
      }
    }

    // ABN checksum validation
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
    let sum = 0

    for (let i = 0; i < 11; i++) {
      let digit = parseInt(cleanABN[i])
      if (i === 0) {
        digit -= 1 // Subtract 1 from first digit
      }
      sum += digit * weights[i]
    }

    if (sum % 89 !== 0) {
      return {
        valid: false,
        message: 'Invalid ABN checksum'
      }
    }

    return { valid: true }
  }

  /**
   * Get compliance status badge info
   */
  public static getComplianceStatus(
    expiryDate?: Date | null,
    verified?: boolean
  ): {
    status: 'verified' | 'expiring' | 'expired' | 'pending'
    variant: 'default' | 'warning' | 'destructive' | 'secondary'
    label: string
  } {
    if (!expiryDate) {
      return {
        status: 'pending',
        variant: 'secondary',
        label: 'Pending Verification'
      }
    }

    if (!verified) {
      return {
        status: 'pending',
        variant: 'secondary',
        label: 'Awaiting Verification'
      }
    }

    if (this.isExpired(expiryDate)) {
      return {
        status: 'expired',
        variant: 'destructive',
        label: 'Expired'
      }
    }

    if (this.isExpiringSoon(expiryDate, 30)) {
      return {
        status: 'expiring',
        variant: 'warning',
        label: 'Expiring Soon'
      }
    }

    return {
      status: 'verified',
      variant: 'default',
      label: 'Verified'
    }
  }

  /**
   * Log compliance check for audit purposes
   */
  public static async logComplianceCheck(
    userId: number,
    checkType: string,
    result: 'pass' | 'fail',
    details?: Record<string, any>
  ): Promise<void> {
    try {
      // Log for audit trail
      Logger.info('Compliance Check', {
        userId,
        checkType,
        result,
        details,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      Logger.error('Failed to log compliance check', error)
    }
  }

  /**
   * Get days until expiry
   */
  public static getDaysUntilExpiry(expiryDate: Date): number {
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Format WWCC number for display
   */
  public static formatWWCC(wwccNumber: string, state: string): string {
    const normalizedState = state.toUpperCase()
    const clean = wwccNumber.replace(/\s+/g, '')

    // Format based on state
    switch (normalizedState) {
      case 'VIC':
        // 12345678A → 1234 5678 A
        return clean.replace(/(\d{4})(\d{4})([A-Za-z])/, '$1 $2 $3')
      case 'NSW':
        // WWC1234567E → WWC 1234567 E
        return clean.replace(/(WWC)(\d{7})([EV])/, '$1 $2 $3')
      case 'QLD':
        // Already has slash, just return
        return clean
      default:
        // Insert space every 4 digits for readability
        return clean.replace(/(\d{4})/g, '$1 ').trim()
    }
  }
}
