import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Skill from 'App/Models/Skill'

export default class SkillsController {
  public async index({ response }: HttpContextContract) {
    const skills = await Skill.all()
    return response.ok(skills)
  }

  public async store({ auth, request, response }: HttpContextContract) {
    // Only Admin
    await auth.use('api').authenticate()
    if (!auth.user?.isAdmin) return response.forbidden()

    const data = request.only(['name', 'category'])
    const skill = await Skill.create(data)
    return response.created(skill)
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    // Only Admin
    await auth.use('api').authenticate()
    if (!auth.user?.isAdmin) return response.forbidden()

    const skill = await Skill.find(params.id)
    if (skill) await skill.delete()
    return response.noContent()
  }
}
