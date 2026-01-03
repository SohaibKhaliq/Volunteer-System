/**
 * Contract source: https://git.io/Jfefs
 *
 * Feel free to let us know via PR, if you find something broken in this contract
 * file.
 */

declare module '@ioc:Adonis/Addons/Swagger' {
  export interface SwaggerConfig {
    uiEnabled: boolean
    uiUrl: string
    specEnabled: boolean
    specUrl: string
    middleware: string[]
    options: {
      definition: any
      apis: string[]
      basePath: string
    }
    mode: 'PRODUCTION' | 'RUNTIME'
    specFilePath: string
  }

  const Swagger: SwaggerConfig
  export default Swagger
}
