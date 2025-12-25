import Permission from 'App/Models/Permission'
import BaseController from './BaseController'

export default class PermissionsController extends BaseController {
  protected get model() {
    return Permission
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
}
