import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SystemSetting from 'App/Models/SystemSetting'

export default class SystemSettingsController {
  public async index({ response }: HttpContextContract) {
    const settings = await SystemSetting.query().orderBy('category', 'asc').orderBy('key', 'asc')
    return response.ok(settings)
  }

  public async update({ request, response, auth }: HttpContextContract) {
    const settings = request.body()
    const user = auth.user!
    
    // Expecting { key: value } object
    for (const [key, value] of Object.entries(settings)) {
      const setting = await SystemSetting.findBy('key', key)
      if (setting) {
        const oldValue = setting.value
        setting.value = typeof value === 'object' ? JSON.stringify(value) : String(value)
        await setting.save()
        
        // Audit Log for each change
        const AuditLog = (await import('App/Models/AuditLog')).default
        await AuditLog.safeCreate({
          userId: user.id,
          action: 'system_setting_updated',
          targetType: 'system_setting',
          targetId: setting.id,
          details: `Updated setting ${key}`,
          metadata: JSON.stringify({ key, old: oldValue, new: setting.value }),
          ipAddress: request.ip()
        }).catch(() => {})
      }
    }
    return response.ok({ message: 'Settings updated' })
  }
}
