import { LucidModel, ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'

/**
 * Query Service
 * Provides reusable query building patterns
 */
export default class QueryService {
  /**
   * Apply pagination to a query
   */
  public static paginate<T extends LucidModel>(
    query: ModelQueryBuilderContract<T>,
    page: number = 1,
    perPage: number = 20
  ) {
    return query.paginate(page, perPage)
  }

  /**
   * Apply search filter to query
   * Searches across multiple fields
   */
  public static search<T extends LucidModel>(
    query: ModelQueryBuilderContract<T>,
    searchTerm: string,
    fields: string[]
  ) {
    if (!searchTerm || !fields.length) return query

    return query.where((subQuery) => {
      fields.forEach((field, index) => {
        if (index === 0) {
          subQuery.where(field, 'LIKE', `%${searchTerm}%`)
        } else {
          subQuery.orWhere(field, 'LIKE', `%${searchTerm}%`)
        }
      })
    })
  }

  /**
   * Apply date range filter
   */
  public static dateRange<T extends LucidModel>(
    query: ModelQueryBuilderContract<T>,
    field: string,
    startDate?: string,
    endDate?: string
  ) {
    if (startDate) {
      query = query.where(field, '>=', startDate)
    }
    if (endDate) {
      query = query.where(field, '<=', endDate)
    }
    return query
  }

  /**
   * Apply ordering
   */
  public static orderBy<T extends LucidModel>(
    query: ModelQueryBuilderContract<T>,
    column: string = 'created_at',
    direction: 'asc' | 'desc' = 'desc'
  ) {
    return query.orderBy(column, direction)
  }

  /**
   * Apply status filter
   */
  public static filterByStatus<T extends LucidModel>(
    query: ModelQueryBuilderContract<T>,
    status?: string | string[]
  ) {
    if (!status) return query

    if (Array.isArray(status)) {
      return query.whereIn('status', status)
    }

    return query.where('status', status)
  }

  /**
   * Apply multiple filters dynamically
   */
  public static applyFilters<T extends LucidModel>(
    query: ModelQueryBuilderContract<T>,
    filters: Record<string, any>
  ) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle array values (IN queries)
        if (Array.isArray(value)) {
          query = query.whereIn(key, value)
        }
        // Handle range queries (object with min/max)
        else if (typeof value === 'object' && ('min' in value || 'max' in value)) {
          if (value.min !== undefined) {
            query = query.where(key, '>=', value.min)
          }
          if (value.max !== undefined) {
            query = query.where(key, '<=', value.max)
          }
        }
        // Handle simple equality
        else {
          query = query.where(key, value)
        }
      }
    })
    return query
  }

  /**
   * Build a query with common patterns
   */
  public static buildQuery<T extends LucidModel>(
    model: T,
    options: {
      search?: { term: string; fields: string[] }
      filters?: Record<string, any>
      status?: string | string[]
      dateRange?: { field: string; start?: string; end?: string }
      orderBy?: { column: string; direction?: 'asc' | 'desc' }
      pagination?: { page: number; perPage: number }
      relations?: string[]
    }
  ) {
    let query = model.query()

    // Apply search
    if (options.search?.term) {
      query = this.search(query, options.search.term, options.search.fields)
    }

    // Apply filters
    if (options.filters) {
      query = this.applyFilters(query, options.filters)
    }

    // Apply status filter
    if (options.status) {
      query = this.filterByStatus(query, options.status)
    }

    // Apply date range
    if (options.dateRange) {
      query = this.dateRange(
        query,
        options.dateRange.field,
        options.dateRange.start,
        options.dateRange.end
      )
    }

    // Apply ordering
    if (options.orderBy) {
      query = this.orderBy(query, options.orderBy.column, options.orderBy.direction)
    }

    // Preload relations
    if (options.relations) {
      options.relations.forEach((relation) => {
        query = query.preload(relation as any)
      })
    }

    // Apply pagination if requested
    if (options.pagination) {
      return this.paginate(query, options.pagination.page, options.pagination.perPage)
    }

    return query
  }
}
