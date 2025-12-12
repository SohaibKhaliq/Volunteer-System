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
}
