import { ApiClient, ApiRequest } from '@japa/api-client'
import Application from '@ioc:Adonis/Core/Application'

export async function authPlugin() {
  const { defineTestsBindings } = await import('@adonisjs/auth/build/src/Bindings/Tests')
  const Auth = Application.container.resolveBinding('Adonis/Addons/Auth')
  defineTestsBindings(ApiRequest, ApiClient, Auth)
}
