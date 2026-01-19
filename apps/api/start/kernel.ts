/*
|--------------------------------------------------------------------------
| Application middleware
|--------------------------------------------------------------------------
|
| This file is used to define middleware for HTTP requests. You can register
| middleware as a `closure` or an IoC container binding. The bindings are
| preferred, since they keep this file clean.
|
*/

import Server from '@ioc:Adonis/Core/Server'
import { initCommunicationSender } from 'App/Services/CommunicationSender'
import { initInviteSender } from 'App/Services/InviteSender'
import { initScheduler } from 'App/Services/SchedulerService'
import { initResourceNotifier } from 'App/Services/ResourceNotifier'

/*
|--------------------------------------------------------------------------
| Global middleware
|--------------------------------------------------------------------------
|
| An array of global middleware, that will be executed in the order they
| are defined for every HTTP requests.
|
*/
Server.middleware.register([
  () => import('@ioc:Adonis/Core/BodyParser'),
  () => import('@ioc:Adonis/Addons/RmbMiddleware'),
  () => import('App/Middleware/SilentAuth')
])

/*
|--------------------------------------------------------------------------
| Named middleware
|--------------------------------------------------------------------------
|
| Named middleware are defined as key-value pair. The value is the namespace
| or middleware function and key is the alias. Later you can use these
| alias on individual routes. For example:
|
| { auth: () => import('App/Middleware/Auth') }
|
| and then use it as follows
|
| Route.get('dashboard', 'UserController.dashboard').middleware('auth')
|
*/
Server.middleware.registerNamed({
  auth: () => import('App/Middleware/Auth'),
  admin: () => import('App/Middleware/Admin'),
  permission: () => import('App/Middleware/Permission'),
  throttle: () => import('@adonisjs/limiter/build/throttle')
})

// start background workers/services
// Background workers should not be started when running short-lived ace CLI commands
// (like `node ace list:routes`, `node ace migration:run`, etc.) which boot the app
// then immediately shut it down. Starting background intervals in those cases leads
// to races where workers attempt DB work during shutdown and produce spurious
// 'aborted' errors from the connection pool. Skip starting workers when running
// as an ace CLI command or during tests.
const runningAsAce = process.argv.some((arg) => String(arg).includes('ace'))
if (!runningAsAce && process.env.NODE_ENV !== 'test') {
  try {
    initCommunicationSender()
  } catch (e) {
    // avoid crashing the boot if sender fails to start
    // eslint-disable-next-line no-console
    console.error('Failed to start communication sender', e)
  }

  try {
    initInviteSender()
  } catch (e) {
    // avoid crashing the boot if invite sender fails
    // eslint-disable-next-line no-console
    console.error('Failed to start invite sender', e)
  }

  try {
    initScheduler()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to start scheduler', e)
  }

  try {
    initResourceNotifier()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to start resource notifier', e)
  }
} else {
  // Non-server runs (ace commands / tests) will skip background workers to avoid
  // short-lived boot/shutdown races with the DB connection pool.
  // eslint-disable-next-line no-console
  console.log('Skipping background workers: running as ace/test or CLI command')
}


