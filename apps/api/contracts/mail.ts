/**
 * Contract source: https://git.io/JvgAT
 *
 * Feel free to let us know via PR, if you find something broken in this contract
 * file.
 */

declare module '@ioc:Adonis/Addons/Mail' {
  import { MailManager } from '@adonisjs/mail'
  const Mail: MailManager<any>
  export default Mail
}
