import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Type from 'App/Models/Type'
import BaseController from './BaseController'
import { RequestTypes } from '../../../contracts/requests'

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
   * Validate enum type value
   */
  private validateType(type: string): string {
    const allowed = Object.values(RequestTypes)
    return type && allowed.includes(type) ? type : 'other'
  }

  /**
   * Transform data before creation - ensure type is a valid enum value
   */
  protected transformCreateData(data: any): any {
    return {
      type: this.validateType(data.type),
      name: data.name || null,
      category: data.category || 'General',
      description: data.description || null
    }
  }

  /**
   * Transform data before update - ensure type is a valid enum value
   */
  protected transformUpdateData(data: any): any {
    const result: any = {}

    if (data.type) {
      const allowed = Object.values(RequestTypes)
      if (allowed.includes(data.type)) {
        result.type = data.type
      }
    }

    if (data.name !== undefined) result.name = data.name
    if (data.category !== undefined) result.category = data.category
    if (data.description !== undefined) result.description = data.description

    return result
  }
}
