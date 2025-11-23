/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import HealthCheck from '@ioc:Adonis/Core/HealthCheck'
import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.get('/health', async ({ response }) => {
  const report = await HealthCheck.getReport()
  return report.healthy ? response.ok(report) : response.badRequest(report)
})

Route.resource('offers', 'OffersController')
  .middleware({
    // store: ['auth:api'],
    // destroy: ['auth:api'],
    // update: ['auth:api']
  })
  .apiOnly()

Route.resource('carpooling-ads', 'CarpoolingAdsController')
  .middleware({
    // store: ['auth:api'],
    // destroy: ['auth:api'],
    // update: ['auth:api']
  })
  .apiOnly()

Route.resource('help-requests', 'HelpRequestsController')
  .middleware({
    // store: ['auth:api'],
    // destroy: ['auth:api'],
    // update: ['auth:api']
  })
  .apiOnly()

Route.resource('types', 'TypesController')
  .middleware({
    // store: ['auth:api'],
    // destroy: ['auth:api'],
    // update: ['auth:api']
  })
  .apiOnly()

Route.resource('users', 'UsersController')
  .middleware({
    '*': ['auth']
  })
  .apiOnly()

Route.resource('organizations', 'OrganizationsController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

Route.resource('roles', 'RolesController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

Route.resource('events', 'EventsController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

Route.resource('tasks', 'TasksController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

Route.resource('assignments', 'AssignmentsController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

Route.resource('compliance', 'ComplianceController')
  .middleware({ '*': ['auth'] })
  .apiOnly()

Route.get('/reports', 'ReportsController.index').middleware(['auth'])

// AI-driven helpers
Route.post('/ai/match', 'AiController.match') // returns suggested volunteers for a task
Route.post('/ai/forecast', 'AiController.forecast') // returns demand forecast for a date range

Route.post('/register', 'AuthController.register')
Route.post('/login', 'AuthController.login')
Route.post('/logout', 'AuthController.logout').middleware('auth:api')

Route.post('/authenticate', 'AuthController.authenticate')
