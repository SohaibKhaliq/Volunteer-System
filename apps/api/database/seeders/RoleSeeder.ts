import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Role from 'App/Models/Role'

export default class RoleSeeder extends BaseSeeder {
  public async run() {
    await Role.updateOrCreateMany('slug', [
      {
        name: 'Super Admin',
        slug: 'admin',
        description: 'Platform administrator with full access'
      },
      {
        name: 'Organization',
        slug: 'organization',
        description: 'Organization manager'
      },
      {
        name: 'Volunteer',
        slug: 'volunteer',
        description: 'Standard volunteer user'
      }
    ])
  }
}
