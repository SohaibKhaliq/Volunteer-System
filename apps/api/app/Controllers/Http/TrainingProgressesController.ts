import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import UserTrainingProgress from 'App/Models/UserTrainingProgress'
import TrainingModule from 'App/Models/TrainingModule'
import { DateTime } from 'luxon'

export default class TrainingProgressesController {
    public async index({ auth, response }: HttpContextContract) {
        const modules = await TrainingModule.query()
            .where('is_active', true)
            .preload('organization')
        
        const progress = await UserTrainingProgress.query().where('user_id', auth.user!.id)
        const progressMap = new Map(progress.map(p => [p.moduleId, p]))

        const result = modules.map(m => {
            const p = progressMap.get(m.id)
            return {
                ...m.serialize(),
                user_progress: p ? p.serialize() : null
            }
        })
        
        return response.ok(result)
    }

    public async show({ auth, params, response }: HttpContextContract) {
        const module = await TrainingModule.findOrFail(params.moduleId)
        const progress = await UserTrainingProgress.query()
            .where('user_id', auth.user!.id)
            .where('module_id', module.id)
            .first()
            
        return response.ok({
            module,
            progress
        })
    }

    public async start({ auth, params, response }: HttpContextContract) {
        const module = await TrainingModule.findOrFail(params.moduleId)
        
        const progress = await UserTrainingProgress.firstOrCreate({
            userId: auth.user!.id,
            moduleId: module.id
        }, {
            status: 'in_progress'
        })
        
        return response.ok(progress)
    }

    public async complete({ auth, params, request, response }: HttpContextContract) {
        const module = await TrainingModule.findOrFail(params.moduleId)
        const { score } = request.only(['score'])
        
        const progress = await UserTrainingProgress.query()
            .where('user_id', auth.user!.id)
            .where('module_id', module.id)
            .firstOrFail()
            
        let passed = true
        if (module.passingCriteria && (module.passingCriteria as any).score) {
             if (score < (module.passingCriteria as any).score) passed = false
        }
        
        progress.score = score
        progress.status = passed ? 'completed' : 'failed'
        if (passed) progress.completedAt = DateTime.local()
        await progress.save()

        if (passed) {
             const Certificate = (await import('App/Models/Certificate')).default
             const CertificateTemplate = (await import('App/Models/CertificateTemplate')).default
            
             const template = await CertificateTemplate.query().where('is_global', true).first()
             
             if (template) {
                 await Certificate.firstOrCreate({
                     userId: auth.user!.id,
                     moduleId: module.id
                 }, {
                     organizationId: module.organizationId,
                     templateId: template.id,
                     status: 'active'
                 })
             }
        }

        return response.ok(progress)
    }
}
