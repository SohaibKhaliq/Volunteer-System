import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shift from 'App/Models/Shift'
import { createShiftSchema, updateShiftSchema } from 'App/Validators/shiftValidator'
import User from 'App/Models/User'
import ShiftAssignment from 'App/Models/ShiftAssignment'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ShiftsController {
  public async index({ request }: HttpContextContract) {
    const eventId = request.input('event_id')
    const query = Shift.query()
    if (eventId) query.where('event_id', eventId)
    return query.orderBy('start_at', 'asc')
  }

  // Suggest volunteers for a shift based on skills and past assignments
  public async suggest({ params, request, response }: HttpContextContract) {
    const shiftId = Number(params.id)
    const limit = Number(request.input('limit', 10))
    const shift = await Shift.find(shiftId)
    if (!shift) return response.notFound({ message: 'Shift not found' })

    // gather required skills from shift tasks (best-effort)
    await shift.load('tasks')
    const requiredSkills: string[] = []
    for (const t of shift.tasks) {
      try {
        const skills = typeof t.skills === 'string' ? JSON.parse(t.skills) : t.skills
        if (Array.isArray(skills))
          requiredSkills.push(...skills.map((s: any) => String(s).toLowerCase()))
      } catch (e) {
        // ignore parse errors
      }
    }

    // heuristics: users with matching skills + history of similar tasks
    // fetch users with non-empty profileMetadata (may contain skills) and recent assignments
    const users = await Database.from('users').select(
      'id',
      'first_name',
      'last_name',
      'profile_metadata'
    )

    const scores: Record<number, number> = {}

    // map skill matches
    for (const u of users) {
      let score = 0
      try {
        const meta = u.profile_metadata ? JSON.parse(u.profile_metadata) : null
        const userSkills: string[] = meta?.skills ?? meta?.skill_tags ?? []
        if (Array.isArray(userSkills)) {
          for (const s of userSkills) {
            if (requiredSkills.includes(String(s).toLowerCase())) score += 2
          }
        }
      } catch (e) {}
      scores[u.id] = score
    }

    // boost users with past assignments for the same event or similar task titles
    const past = await ShiftAssignment.query().preload('shift')
    for (const a of past) {
      if (!a.shift) continue
      // if same event, boost
      if (a.shift.eventId && a.shift.eventId === shift.eventId) {
        scores[a.userId] = (scores[a.userId] || 0) + 3
      }
      // if task title similarity, small boost (we don't have task here)
    }

    // convert to list and sort by score
    const result = Object.keys(scores)
      .map((k) => ({ user_id: Number(k), score: scores[Number(k)] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // enrich with user names
    const userIds = result.map((r) => r.user_id)
    const userRows = await User.query().whereIn('id', userIds)
    const byId: Record<number, any> = {}
    userRows.forEach((u) => (byId[u.id] = u))

    const suggestions = result.map((r) => ({
      user: byId[r.user_id] ?? { id: r.user_id },
      score: r.score
    }))
    return { suggestions }
  }

  public async show({ params }: HttpContextContract) {
    const shift = await Shift.findOrFail(params.id)
    await shift.loadMany(['tasks', 'assignments'])
    return shift
  }

  public async store({ request, auth, response }: HttpContextContract) {
    const payload = createShiftSchema.parse(request.only(Object.keys(request.body())))
    // basic validation: start < end
    if (
      payload.start_at &&
      payload.end_at &&
      new Date(payload.start_at) >= new Date(payload.end_at)
    ) {
      return response.badRequest({ message: 'start_at must be before end_at' })
    }
    const shift = await Shift.create(payload as any)
    return shift
  }

  public async update({ params, request }: HttpContextContract) {
    const shift = await Shift.findOrFail(params.id)
    const payload = updateShiftSchema.parse(request.only(Object.keys(request.body())))
    if (
      payload.start_at &&
      payload.end_at &&
      new Date(payload.start_at) >= new Date(payload.end_at)
    ) {
      return { message: 'start_at must be before end_at' } as any
    }
    shift.merge(payload as any)
    await shift.save()
    return shift
  }

  public async destroy({ params }: HttpContextContract) {
    const shift = await Shift.findOrFail(params.id)
    await shift.delete()
  }
}
