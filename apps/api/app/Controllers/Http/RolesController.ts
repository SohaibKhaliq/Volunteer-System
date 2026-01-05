import Role from 'App/Models/Role'
import BaseController from './BaseController'

export default class RolesController extends BaseController {
  protected get model() {
    return Role
  }

  protected get createFields() {
    return ['name', 'description']
  }

  protected get updateFields() {
    return ['name', 'description']
  }

  protected get defaultOrderBy() {
    return { column: 'id', direction: 'asc' as const }
  }

  // Preload permissions when listing roles
  public async index(ctx: any) {
    const { request, response } = ctx
    const { page, perPage, ...filters } = request.qs()
    let query = (this.model as typeof Role).query().preload('permissions')

    query = query.orderBy(this.defaultOrderBy.column, this.defaultOrderBy.direction)
    query = this.applyFilters(query, filters)

    if (page != null || perPage != null) {
      const result = await this.applyPagination(query, Number(page) || 1, Number(perPage) || 20)
      return response.ok(result)
    }

    const rows = await query
    return response.ok(rows)
  }

  // Handle permission syncing after creation
  protected async afterCreate(role: Role, { request }: any): Promise<void> {
    const permissions = request.input('permissions')
    if (permissions && Array.isArray(permissions)) {
      await role.related('permissions').sync(permissions)
    }
    await role.load('permissions')
  }

  // Handle permission syncing after update
  protected async afterUpdate(role: Role, { request }: any): Promise<void> {
    const permissions = request.input('permissions')
    if (permissions && Array.isArray(permissions)) {
      await role.related('permissions').sync(permissions)
    }
    await role.load('permissions')
  }
}
