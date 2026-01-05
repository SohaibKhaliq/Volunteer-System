import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BackgroundCheck from 'App/Models/BackgroundCheck'

export default class BackgroundChecksController {
  public async index({ response }: HttpContextContract) {
    const checks = await BackgroundCheck.query().preload('user')
    return response.ok(checks)
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = request.only(['user_id', 'notes', 'requested_at'])
    const check = await BackgroundCheck.create(payload)
    return response.created(check)
  }

  public async show({ params, response }: HttpContextContract) {
    const check = await BackgroundCheck.find(params.id)
    if (!check) return response.notFound()
    await check.load('user')
    return response.ok(check)
  }

  public async update({ params, request, response }: HttpContextContract) {
    const check = await BackgroundCheck.find(params.id)
    if (!check) return response.notFound()
    check.merge(request.only(['status', 'result', 'completed_at', 'notes']))
    
    const file = request.file('file', {
      size: '10mb',
      extnames: ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']
    })

    if (file) {
      if (!file.isValid) {
        return response.badRequest(file.errors)
      }
      await file.moveToDisk('background_checks')
      check.filePath = file.fileName
      check.fileName = file.clientName
    }

    await check.save()
    return response.ok(check)
  }

  public async getFile({ params, response }: HttpContextContract) {
    const check = await BackgroundCheck.find(params.id)
    if (!check || !check.filePath) return response.notFound()
    
    // Lazy import Drive to avoid top-level issues if not configured, though typically it is.
    const Drive = (await import('@ioc:Adonis/Core/Drive')).default
    
    if (await Drive.exists(`background_checks/${check.filePath}`)) {
      const stream = await Drive.getStream(`background_checks/${check.filePath}`)
      return response.stream(stream)
    }
    return response.notFound('File not found on disk')
  }

  public async destroy({ params, response }: HttpContextContract) {
    const check = await BackgroundCheck.find(params.id)
    if (!check) return response.notFound()
    await check.delete()
    return response.noContent()
  }
}
