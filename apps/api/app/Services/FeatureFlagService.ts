import FeatureFlag from 'App/Models/FeatureFlag'
import AuthorizationService from './AuthorizationService'
import User from 'App/Models/User'

export default class FeatureFlagService {
  public static async isEnabled(key: string, user?: User, env?: string): Promise<boolean> {
    const flag = await FeatureFlag.query().where('key', key).first()
    if (!flag) return false

    if (flag.enabled) return true

    if (!flag.conditions) return false

    try {
      const conditions =
        typeof flag.conditions === 'string' ? JSON.parse(flag.conditions) : flag.conditions

      // Check per-role enablement
      if (conditions.roles && Array.isArray(conditions.roles) && user) {
        for (const roleName of conditions.roles) {
          const has = await AuthorizationService.userHasPermission(user, `role:${roleName}`)
          if (has) return true
        }
      }

      // Environment-level override
      if (conditions.env && conditions.env[env || 'development']) return true
    } catch (err) {
      return flag.enabled
    }

    return false
  }
}
