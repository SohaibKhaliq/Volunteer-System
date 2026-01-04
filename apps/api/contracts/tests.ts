
import '@japa/api-client'
import User from 'App/Models/User'

declare module '@japa/api-client' {
  interface ApiClient {
    loginAs(user: User): this
  }
}
