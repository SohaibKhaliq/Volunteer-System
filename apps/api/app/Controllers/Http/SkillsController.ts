import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

export default class SkillsController {
  public async search({ request, response }: HttpContextContract) {
    const q = String(request.input('q', '')).trim()
    if (!q) {
      return response.ok([])
    }

    // Search the `skills` table by name (case-insensitive)
    try {
      const rows = await Database.from('skills')
        .where('name', 'like', `%${q}%`)
        .orderBy('name', 'asc')
        .limit(20)
        .select('id', 'name')

      return response.ok(rows.map((r) => ({ id: r.id, name: r.name })))
    } catch (err) {
      // Fallback: return empty
      // eslint-disable-next-line no-console
      console.warn('Skills search failed', err)
      return response.internalServerError({ message: 'Skills search failed' })
    }
  }
}
