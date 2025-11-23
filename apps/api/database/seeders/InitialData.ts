import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Role from 'App/Models/Role'
import Permission from 'App/Models/Permission'
import Organization from 'App/Models/Organization'
import Event from 'App/Models/Event'
import Task from 'App/Models/Task'
import Database from '@ioc:Adonis/Lucid/Database'

export default class InitialDataSeeder extends BaseSeeder {
  public async run() {
    const roles = ['admin', 'coordinator', 'volunteer']
    const permissions = [
      'manage_users',
      'manage_events',
      'approve_organizations',
      'manage_compliance'
    ]

    const createdRoles = await Promise.all(roles.map((name) => Role.create({ name })))
    await Promise.all(permissions.map((name) => Permission.create({ name })))

    // attach simple permission mapping: give admin all permissions
    const allPerms = await Permission.all()
    const adminRole = createdRoles.find((r) => r.name === 'admin')!

    for (const p of allPerms) {
      await Database.table('role_permissions').insert({
        role_id: adminRole.id,
        permission_id: p.id
      })
    }

    // create sample organization and event
    const org = await Organization.create({ name: 'Community Helpers', description: 'Sample org' })
    const event = await Event.create({
      title: 'Park Clean Up',
      description: 'Weekly park clean up',
      organizationId: org.id,
      startAt: new Date().toISOString(),
      isPublished: true
    })
    await Task.create({
      eventId: event.id,
      title: 'Trash Pickup',
      description: 'Pick up litter',
      slotCount: 5
    })
  }
}
