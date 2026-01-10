import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Skill from 'App/Models/Skill'

export default class SkillsController {
  public async search({ request, response }: HttpContextContract) {
    const q = String(request.input('q', '')).trim()
    if (!q) {
      return response.ok([])
    }

    try {
      // Find matching skills
      const skills = await Skill.query()
        .whereRaw('LOWER(name) LIKE ?', [`%${q.toLowerCase()}%`])
        .orderBy('name', 'asc')
        .limit(20)
        .select('id', 'name')

      if (skills.length > 0) {
        return response.ok(skills.map((s) => ({ id: s.id, name: s.name })))
      }

      // If no skill matches, create it (idempotent on name)
      const existing = await Skill.query().whereRaw('LOWER(name) = ?', [q.toLowerCase()]).first()

      const created = existing ?? (await Skill.create({ name: q }))

      return response.ok([{ id: created.id, name: created.name }])
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Skills search failed', err)
      return response.internalServerError({ message: 'Skills search failed' })
    }
  }
}
