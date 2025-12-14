import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

/**
 * Response Helper
 * Standardizes API responses across the application
 */
export default class ResponseHelper {
  /**
   * Success response with data
   */
  public static success(response: any, data: any, message?: string, meta?: any) {
    const payload: any = { data }
    if (message) payload.message = message
    if (meta) payload.meta = meta
    return response.ok(payload)
  }

  /**
   * Created response (201)
   */
  public static created(response: any, data: any, message?: string) {
    const payload: any = { data }
    if (message) payload.message = message
    return response.created(payload)
  }

  /**
   * No content response (204)
   */
  public static noContent(response: any) {
    return response.noContent()
  }

  /**
   * Error response with message
   */
  public static error(response: any, message: string, statusCode: number = 400, errors?: any) {
    const payload: any = { error: { message } }
    if (errors) payload.error.errors = errors
    return response.status(statusCode).json(payload)
  }

  /**
   * Not found response (404)
   */
  public static notFound(response: any, message: string = 'Resource not found') {
    return response.notFound({ error: { message } })
  }

  /**
   * Unauthorized response (401)
   */
  public static unauthorized(response: any, message: string = 'Not authorized') {
    return response.unauthorized({ error: { message } })
  }

  /**
   * Forbidden response (403)
   */
  public static forbidden(response: any, message: string = 'Access forbidden') {
    return response.forbidden({ error: { message } })
  }

  /**
   * Bad request response (400)
   */
  public static badRequest(response: any, message: string, errors?: any) {
    return this.error(response, message, 400, errors)
  }

  /**
   * Validation error response (422)
   */
  public static validationError(response: any, errors: any) {
    return response.unprocessableEntity({
      error: {
        message: 'Validation failed',
        errors
      }
    })
  }

  /**
   * Internal server error response (500)
   */
  public static serverError(response: any, message: string = 'Internal server error') {
    return response.internalServerError({ error: { message } })
  }

  /**
   * Paginated response
   */
  public static paginated(response: any, data: any) {
    // Data from Lucid paginate already has the correct format
    return response.ok(data)
  }

  /**
   * List response (array of items)
   */
  public static list(response: any, items: any[], meta?: any) {
    const payload: any = { data: items }
    if (meta) payload.meta = meta
    return response.ok(payload)
  }
}
