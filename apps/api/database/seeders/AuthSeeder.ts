import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Role from 'App/Models/Role'

export default class AuthSeeder extends BaseSeeder {
  public async run() {
    // Create default roles if they don't exist
    const roles = [
      {
        name: 'volunteer',
        slug: 'volunteer',
        description: 'Default volunteer role with basic permissions'
      },
      {
        name: 'coordinator',
        slug: 'coordinator',
        description: 'Volunteer coordinator with extended permissions'
      },
      {
        name: 'organization_admin',
        slug: 'organization-admin',
        description: 'Organization administrator role'
      },
      {
        name: 'admin',
        slug: 'admin',
        description: 'System administrator with full permissions'
      }
    ]

    for (const roleData of roles) {
      const existingRole = await Role.query().where('name', roleData.name).first()

      if (!existingRole) {
        await Role.create(roleData)
        console.log(`✓ Created role: ${roleData.name}`)
      } else {
        console.log(`- Role already exists: ${roleData.name}`)
      }
    }

    console.log('✓ Auth seeder completed')
  }
}
