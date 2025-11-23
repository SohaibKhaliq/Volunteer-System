import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Role from 'App/Models/Role'
import User from 'App/Models/User'

import Permission from 'App/Models/Permission'
import Organization from 'App/Models/Organization'
import Event from 'App/Models/Event'
import Task from 'App/Models/Task'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class InitialDataSeeder extends BaseSeeder {
  public async run() {
    const roles = ['admin', 'coordinator', 'volunteer']
    const permissions = [
      'manage_users',
      'manage_events',
      'approve_organizations',
      'manage_compliance'
    ]

    // Create roles
    const createdRoles: Role[] = []
    for (const name of roles) {
      const r = await Role.firstOrCreate({ name }, { name })
      createdRoles.push(r)
    }

    // Create permissions
    const createdPermissions: Permission[] = []
    for (const name of permissions) {
      const p = await Permission.firstOrCreate({ name }, { name })
      createdPermissions.push(p)
    }

    // Attach permissions to admin role
    const allPerms = createdPermissions.length ? createdPermissions : await Permission.all()
    const adminRole = createdRoles.find((r) => r.name === 'admin')!

    for (const p of allPerms) {
      const exists = await Database.query()
        .from('role_permissions')
        .where('role_id', adminRole.id)
        .andWhere('permission_id', p.id)
        .first()

      if (!exists) {
        await Database.table('role_permissions').insert({
          role_id: adminRole.id,
          permission_id: p.id
        })
      }
    }

    // Create organization
    const org = await Organization.create({
      name: 'Community Helpers',
      description: 'Sample org'
    })

    // Create event with LUXON DateTime
    const event = await Event.create({
      title: 'Park Clean Up',
      description: 'Weekly park clean up',
      organizationId: org.id,
      startAt: DateTime.now(), // FIXED
      isPublished: true
    })

    // Create task
    await Task.create({
      eventId: event.id,
      title: 'Trash Pickup',
      description: 'Pick up litter',
      slotCount: 5
    })

    // Create admin user if not exists
    const existing = await User.findBy('email', 'admin@gmail.com')
    if (!existing) {
      const adminUser = await User.create({
        email: 'admin@gmail.com',
        password: 'password',
        isAdmin: true,
        firstName: 'Dev',
        lastName: 'Admin'
      })

      const adminRole = createdRoles.find((r) => r.name === 'admin')!
      const userRoleExists = await Database.query()
        .from('user_roles')
        .where('user_id', adminUser.id)
        .andWhere('role_id', adminRole.id)
        .first()

      if (!userRoleExists) {
        await Database.table('user_roles').insert({
          user_id: adminUser.id,
          role_id: adminRole.id
        })
      }
    }
  }
}
