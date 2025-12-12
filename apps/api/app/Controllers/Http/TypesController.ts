import Type from 'App/Models/Type'
import BaseController from './BaseController'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class TypesController extends BaseController {
  protected get model() {
    return Type
  }

  protected get createFields() {
    return ['type', 'name', 'category', 'description']
  }

  protected get updateFields() {
    return ['type', 'name', 'category', 'description']
  }

  protected get defaultOrderBy() {
    return { column: 'id', direction: 'asc' as const }
  }

  /**
   * Transform data before creation - ensure type is a valid enum value
   */
  protected transformCreateData(data: any): any {
    const allowed = Object.values(require('../../contracts/requests').RequestTypes)
    const validType = data.type && allowed.includes(data.type) ? data.type : 'other'

    return {
      type: validType,
      name: data.name || null,
      category: data.category || 'General',
      description: data.description || null
    }
  }

  /**
   * Transform data before update - ensure type is a valid enum value
   */
  protected async transformUpdateData(data: any): Promise<any> {
    const result: any = {}

    if (data.type) {
      const allowed = Object.values(require('../../contracts/requests').RequestTypes)
      if (allowed.includes(data.type)) {
        result.type = data.type
      }
    }

    if (data.name !== undefined) result.name = data.name
    if (data.category !== undefined) result.category = data.category
    if (data.description !== undefined) result.description = data.description

    return result
  }

  /**
   * Override update to handle async transform
   */
  public async update({ params, request, response, auth }: HttpContextContract) {
    const resource = await this.model.find(params.id)

    if (!resource) {
      return response.notFound({ error: { message: 'Resource not found' } })
    }

    if (!(await this.authorize({ request, response, auth } as any, 'update', resource))) {
      return response.unauthorized({ error: { message: 'Not authorized' } })
    }

    const payload = request.only(this.updateFields)
    const transformedData = await this.transformUpdateData(payload)
    resource.merge(transformedData)
    await resource.save()

    await this.afterUpdate(resource, { request, response, auth } as any)

    return response.ok(resource)
  }
}
