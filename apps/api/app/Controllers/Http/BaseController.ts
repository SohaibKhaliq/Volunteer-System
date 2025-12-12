import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { LucidModel, ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'

/**
 * Base CRUD Controller
 * Provides common CRUD operations to reduce code duplication
 * Extend this class and override methods as needed
 */
export default abstract class BaseController {
  /**
   * The model class for this controller
   */
  protected abstract get model(): LucidModel

  /**
   * Fields allowed for creation
   */
  protected abstract get createFields(): string[]

  /**
   * Fields allowed for updates
   */
  protected abstract get updateFields(): string[]

  /**
   * Default order by configuration
   */
  protected get defaultOrderBy(): { column: string; direction: 'asc' | 'desc' } {
    return { column: 'id', direction: 'desc' }
  }

  /**
   * Apply filters to query based on request query string
   * Override this method to implement custom filters
   */
  protected applyFilters(
    query: ModelQueryBuilderContract<LucidModel>,
    filters: Record<string, any>
  ): ModelQueryBuilderContract<LucidModel> {
    return query
  }

  /**
   * Apply pagination to query
   */
  protected applyPagination(
    query: ModelQueryBuilderContract<LucidModel>,
    page: number = 1,
    perPage: number = 20
  ): ModelQueryBuilderContract<LucidModel> {
    return query.paginate(page, perPage)
  }

  /**
   * Authorize action - override for custom authorization
   */
  protected async authorize(
    context: HttpContextContract,
    action: 'index' | 'show' | 'store' | 'update' | 'destroy',
    resource?: any
  ): Promise<boolean> {
    return true
  }

  /**
   * Transform data before creation
   */
  protected transformCreateData(data: any): any {
    return data
  }

  /**
   * Transform data before update
   */
  protected transformUpdateData(data: any): any {
    return data
  }

  /**
   * After create hook
   */
  protected async afterCreate(resource: any, context: HttpContextContract): Promise<void> {
    // Override in child classes if needed
  }

  /**
   * After update hook
   */
  protected async afterUpdate(resource: any, context: HttpContextContract): Promise<void> {
    // Override in child classes if needed
  }

  /**
   * After destroy hook
   */
  protected async afterDestroy(resource: any, context: HttpContextContract): Promise<void> {
    // Override in child classes if needed
  }

  /**
   * List all resources
   */
  public async index({ request, response, auth }: HttpContextContract) {
    if (!(await this.authorize({ request, response, auth } as HttpContextContract, 'index'))) {
      return response.unauthorized({ error: { message: 'Not authorized' } })
    }

    const { page, perPage, ...filters } = request.qs()
    let query = this.model.query()

    // Apply default ordering
    query = query.orderBy(this.defaultOrderBy.column, this.defaultOrderBy.direction)

    // Apply filters
    query = this.applyFilters(query, filters)

    // Apply pagination if requested (check for truthy values properly)
    if (page != null || perPage != null) {
      const result = await this.applyPagination(query, Number(page) || 1, Number(perPage) || 20)
      return response.ok(result)
    }

    const rows = await query
    return response.ok(rows)
  }

  /**
   * Show a single resource
   */
  public async show({ params, response, auth, request }: HttpContextContract) {
    const resource = await this.model.find(params.id)

    if (!resource) {
      return response.notFound({ error: { message: 'Resource not found' } })
    }

    if (
      !(await this.authorize({ request, response, auth } as HttpContextContract, 'show', resource))
    ) {
      return response.unauthorized({ error: { message: 'Not authorized' } })
    }

    return response.ok(resource)
  }

  /**
   * Create a new resource
   */
  public async store({ request, response, auth }: HttpContextContract) {
    if (!(await this.authorize({ request, response, auth } as HttpContextContract, 'store'))) {
      return response.unauthorized({ error: { message: 'Not authorized' } })
    }

    const payload = request.only(this.createFields)
    const transformedData = this.transformCreateData(payload)
    const resource = await this.model.create(transformedData)

    await this.afterCreate(resource, { request, response, auth } as HttpContextContract)

    return response.created(resource)
  }

  /**
   * Update an existing resource
   */
  public async update({ params, request, response, auth }: HttpContextContract) {
    const resource = await this.model.find(params.id)

    if (!resource) {
      return response.notFound({ error: { message: 'Resource not found' } })
    }

    if (
      !(await this.authorize(
        { request, response, auth } as HttpContextContract,
        'update',
        resource
      ))
    ) {
      return response.unauthorized({ error: { message: 'Not authorized' } })
    }

    const payload = request.only(this.updateFields)
    const transformedData = this.transformUpdateData(payload)
    resource.merge(transformedData)
    await resource.save()

    await this.afterUpdate(resource, { request, response, auth } as HttpContextContract)

    return response.ok(resource)
  }

  /**
   * Delete a resource
   */
  public async destroy({ params, response, auth, request }: HttpContextContract) {
    const resource = await this.model.find(params.id)

    if (!resource) {
      return response.notFound({ error: { message: 'Resource not found' } })
    }

    if (
      !(await this.authorize(
        { request, response, auth } as HttpContextContract,
        'destroy',
        resource
      ))
    ) {
      return response.unauthorized({ error: { message: 'Not authorized' } })
    }

    await resource.delete()

    await this.afterDestroy(resource, { request, response, auth } as HttpContextContract)

    return response.noContent()
  }
}
