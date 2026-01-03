/**
 * File source: https://bit.ly/3ukaHTz
 *
 * Feel free to let us know via PR, if you find something broken in this contract
 * file.
 */

import type { Config } from '@japa/runner'
import TestUtils from '@ioc:Adonis/Core/TestUtils'
import { assert, runFailedTests, specReporter, apiClient } from '@japa/preset-adonis'

export const plugins: Required<Config>['plugins'] = [assert(), apiClient()]

/*
|--------------------------------------------------------------------------
| Japa Reporters
|--------------------------------------------------------------------------
|
| Japa reporters displays/saves the progress of tests as they are executed.
| By default, we register the spec reporter to show a detailed report
| of tests on the terminal.
|
*/
export const reporters: Required<Config>['reporters'] = [specReporter()]

/*
|--------------------------------------------------------------------------
| Runner hooks
|--------------------------------------------------------------------------
|
| Runner hooks are executed after booting the AdonisJS app and
| before the test files are imported.
|
| You can perform actions like starting the HTTP server or running migrations
| within the runner hooks
|
*/
export const runnerHooks: Pick<Required<Config>, 'setup' | 'teardown'> = {
  setup: [
    () => TestUtils.ace().loadCommands(),
    async () => {
      console.log('BOOTSTRAP LOADED - MIGRATION HOOK COMMENTED OUT')
      console.log('Running auth setup hook...')
      const { defineTestsBindings } = require('@adonisjs/auth/build/src/Bindings/Tests')
      const { default: Application } = await import('@ioc:Adonis/Core/Application')
      const { ApiClient, ApiRequest } = require('@japa/api-client')

      try {
        const Auth = Application.container.resolveBinding('Adonis/Addons/Auth')

        console.log('ApiClient has macro?', typeof ApiClient.macro)

        if (typeof ApiClient.macro === 'function') {
          defineTestsBindings(ApiRequest, ApiClient, Auth)
          console.log('Called defineTestsBindings')
        } else {
          console.error('ApiClient does not support macros!')
        }

        // Manual check/shim
        if (!(ApiClient.prototype as any).loginAs) {
          console.log('Manually adding loginAs shim...')
          ApiClient.macro('loginAs', function (this: any, user: any) {
            const client = this

            // Generate token promise
            const tokenPromise = (async () => {
              const AuthBinding: any = Application.container.resolveBinding('Adonis/Addons/Auth')
              const apiConfig = AuthBinding.config?.guards?.api
              let serializer: any = null

              if (apiConfig) {
                let provider = null
                if (apiConfig.provider) {
                  const pDriver = apiConfig.provider.driver
                  if (pDriver === 'lucid' && AuthBinding.makeLucidProvider) {
                    provider = AuthBinding.makeLucidProvider(apiConfig.provider)
                  } else if (AuthBinding.makeUserProviderInstance) {
                    try {
                      provider = AuthBinding.makeUserProviderInstance(apiConfig.provider)
                    } catch (e) {}
                  }
                }

                const driver = apiConfig.driver
                if (driver === 'oat' && AuthBinding.makeOatGuard) {
                  serializer = AuthBinding.makeOatGuard('api', apiConfig, provider)
                } else if (driver === 'session' && AuthBinding.makeSessionGuard) {
                  serializer = AuthBinding.makeSessionGuard('api', apiConfig, provider)
                } else if (driver === 'basic' && AuthBinding.makeBasicAuthGuard) {
                  serializer = AuthBinding.makeBasicAuthGuard('api', apiConfig, provider)
                } else {
                  serializer = AuthBinding.makeMapping('api', apiConfig)
                }
              }

              if (serializer) {
                const tokenResult = await serializer.login(user)
                const token = tokenResult || serializer.token
                const tokenString = token?.token || token

                console.log(
                  'Login Shim Generated Token:',
                  tokenString || 'undefined',
                  'Type:',
                  token?.type || 'bearer'
                )

                return tokenString
              }
              return null
            })()

            // Store token promise on client for later use
            client._authTokenPromise = tokenPromise

            // Helper to create a request wrapper that awaits token before executing
            const createAuthenticatedRequest = (method: string, ...args: any[]) => {
              const request = (client as any)[method](...args)
              
              // Store original then method
              const originalThen = request.then.bind(request)
              
              // Override then to inject auth header before executing
              request.then = function(onFulfilled: any, onRejected: any) {
                return tokenPromise.then((token: string | null) => {
                  if (token) {
                    // Use .header() instead of .set() as .set() might not exist on Japa wrapper
                    if (typeof request.header === 'function') {
                      request.header('Authorization', `Bearer ${token}`)
                    } else if (typeof request.set === 'function') {
                      request.set('Authorization', `Bearer ${token}`)
                    }
                  }
                  return originalThen(onFulfilled, onRejected)
                })
              }
              
              return request
            }

            // Create a thenable wrapper that:
            // 1. When awaited directly: returns token string
            // 2. When chained with .post(), .get(), etc: returns authenticated request
            const wrapper: any = {
              // Make it thenable so it can be awaited to get token
              then: (resolve: any, reject: any) => {
                return tokenPromise.then(resolve, reject)
              },
              
              // Proxy HTTP methods to return authenticated requests
              get: (...args: any[]) => createAuthenticatedRequest('get', ...args),
              post: (...args: any[]) => createAuthenticatedRequest('post', ...args),
              put: (...args: any[]) => createAuthenticatedRequest('put', ...args),
              patch: (...args: any[]) => createAuthenticatedRequest('patch', ...args),
              delete: (...args: any[]) => createAuthenticatedRequest('delete', ...args)
            }

            return wrapper
          })
        }

        if ((ApiClient.prototype as any).loginAs) {
          console.log('ApiClient.prototype.loginAs NOW exists')
        }
      } catch (err) {
        console.error('Failed to define test bindings', err)
      }
    }
  ],
  teardown: []
}

/*
|--------------------------------------------------------------------------
| Configure individual suites
|--------------------------------------------------------------------------
|
| The configureSuite method gets called for every test suite registered
| within ".adonisrc.json" file.
|
| You can use this method to configure suites. For example: Only start
| the HTTP server when it is a functional suite.
*/
export const configureSuite: Required<Config>['configureSuite'] = (suite) => {
  if (suite.name === 'functional') {
    suite.setup(() => TestUtils.httpServer().start())
  }
}
