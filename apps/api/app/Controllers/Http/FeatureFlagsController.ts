import FeatureFlag from 'App/Models/FeatureFlag'
import BaseController from './BaseController'
import AuditLog from 'App/Models/AuditLog'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class FeatureFlagsController extends BaseController {
  protected get model() {
    return FeatureFlag
  }

  protected get createFields() {
    return ['key', 'description', 'enabled', 'conditions']
  }

  protected get updateFields() {
    return ['description', 'enabled', 'conditions']
  }

  public async update({ params, request, auth, response }: HttpContextContract) {
    const payload = request.only(this.updateFields)
    const flag = await FeatureFlag.findOrFail(params.id)
    flag.merge(payload)
    await flag.save()

    // Audit
    await AuditLog.safeCreate({
      userId: auth.user?.id ?? 0,
      action: 'feature_flag_updated',
      targetType: 'feature_flag',
      targetId: flag.id,
      details: `Feature flag ${flag.key} updated`,
      metadata: JSON.stringify(payload)
    })

    return response.ok(flag)
  }
}
