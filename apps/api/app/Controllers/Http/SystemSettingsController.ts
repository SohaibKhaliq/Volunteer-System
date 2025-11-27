import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SystemSetting from 'App/Models/SystemSetting'

export default class SystemSettingsController {
  public async index({ response }: HttpContextContract) {
    const settings = await SystemSetting.all()
    // Convert to key-value pair object for easier frontend consumption
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, any>)
    return response.ok(settingsMap)
  }

  public async update({ request, response }: HttpContextContract) {
    const settings = request.body()
    // Expecting { key: value } object
    for (const [key, value] of Object.entries(settings)) {
      await SystemSetting.updateOrCreate({ key }, { value: String(value) })
    }
    return response.ok({ message: 'Settings updated' })
  }
}
