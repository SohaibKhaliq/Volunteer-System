/**
 * Geolocation Service
 * Handles location-based validation for shift check-ins
 */
export default class GeolocationService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  public static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  /**
   * Check if user is within allowed radius of shift location
   * Default radius is 200 meters for Australian workplace safety compliance
   */
  public static isWithinRadius(
    userLat: number,
    userLon: number,
    shiftLat: number,
    shiftLon: number,
    radiusMeters: number = 200
  ): {
    within: boolean
    distance: number
    message?: string
  } {
    const distance = this.calculateDistance(userLat, userLon, shiftLat, shiftLon)
    const within = distance <= radiusMeters

    return {
      within,
      distance: Math.round(distance),
      message: within
        ? `Within range (${Math.round(distance)}m from shift location)`
        : `Outside range (${Math.round(distance)}m from shift location, ${Math.round(distance - radiusMeters)}m over limit)`
    }
  }

  /**
   * Validate coordinates are within Australia
   * Rough bounding box: lat -44 to -10, lon 113 to 154
   */
  public static isWithinAustralia(lat: number, lon: number): boolean {
    return lat >= -44 && lat <= -10 && lon >= 113 && lon <= 154
  }

  /**
   * Format distance for display
   */
  public static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  /**
   * Get major Australian city coordinates (for seeding/testing)
   */
  public static getAustralianCities(): Record<
    string,
    { lat: number; lon: number; name: string }
  > {
    return {
      sydney: { lat: -33.8688, lon: 151.2093, name: 'Sydney, NSW' },
      melbourne: { lat: -37.8136, lon: 144.9631, name: 'Melbourne, VIC' },
      brisbane: { lat: -27.4698, lon: 153.0251, name: 'Brisbane, QLD' },
      perth: { lat: -31.9505, lon: 115.8605, name: 'Perth, WA' },
      adelaide: { lat: -34.9285, lon: 138.6007, name: 'Adelaide, SA' },
      hobart: { lat: -42.8821, lon: 147.3272, name: 'Hobart, TAS' },
      darwin: { lat: -12.4634, lon: 130.8456, name: 'Darwin, NT' },
      canberra: { lat: -35.2809, lon: 149.13, name: 'Canberra, ACT' }
    }
  }

  /**
   * Validate geolocation data structure
   */
  public static validateCoordinates(
    lat?: number,
    lon?: number
  ): {
    valid: boolean
    message?: string
  } {
    if (lat === undefined || lon === undefined) {
      return {
        valid: false,
        message: 'Latitude and longitude are required'
      }
    }

    if (isNaN(lat) || isNaN(lon)) {
      return {
        valid: false,
        message: 'Invalid coordinates format'
      }
    }

    if (lat < -90 || lat > 90) {
      return {
        valid: false,
        message: 'Latitude must be between -90 and 90'
      }
    }

    if (lon < -180 || lon > 180) {
      return {
        valid: false,
        message: 'Longitude must be between -180 and 180'
      }
    }

    return { valid: true }
  }

  /**
   * Get accuracy level description
   */
  public static getAccuracyLevel(accuracyMeters?: number): {
    level: 'high' | 'medium' | 'low' | 'unknown'
    description: string
  } {
    if (!accuracyMeters) {
      return {
        level: 'unknown',
        description: 'Accuracy unknown'
      }
    }

    if (accuracyMeters <= 10) {
      return {
        level: 'high',
        description: 'High accuracy (GPS)'
      }
    }

    if (accuracyMeters <= 50) {
      return {
        level: 'medium',
        description: 'Medium accuracy (WiFi/Cell)'
      }
    }

    return {
      level: 'low',
      description: 'Low accuracy'
    }
  }

  /**
   * Create geolocation metadata for storage
   */
  public static createGeolocationMetadata(
    lat: number,
    lon: number,
    accuracy?: number,
    timestamp?: Date
  ): Record<string, any> {
    return {
      latitude: lat,
      longitude: lon,
      accuracy: accuracy || null,
      timestamp: timestamp || new Date(),
      withinAustralia: this.isWithinAustralia(lat, lon),
      accuracyLevel: this.getAccuracyLevel(accuracy).level
    }
  }
}
