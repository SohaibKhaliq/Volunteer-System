import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  public async run() {
    // Get all organizations and users
    const organizations = await Database.from('organizations').select('id')
    const users = await Database.from('users').select('id')

    if (organizations.length === 0 || users.length === 0) {
      console.log('No organizations or users found. Skipping organization volunteers seeder.')
      return
    }

    const roles = ['volunteer', 'coordinator', 'admin']
    const statuses = ['active', 'inactive', 'pending']

    const organizationVolunteers = []

    // For each organization, assign 5-15 random volunteers
    for (const org of organizations) {
      const volunteerCount = Math.floor(Math.random() * 11) + 5 // 5-15 volunteers
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random())
      const selectedUsers = shuffledUsers.slice(0, Math.min(volunteerCount, users.length))

      for (const user of selectedUsers) {
        // Random role distribution: 70% volunteer, 20% coordinator, 10% admin
        const roleRand = Math.random()
        let role = 'volunteer'
        if (roleRand > 0.9) role = 'admin'
        else if (roleRand > 0.7) role = 'coordinator'

        // Status distribution: 80% active, 15% inactive, 5% pending
        const statusRand = Math.random()
        let status = 'active'
        if (statusRand > 0.95) status = 'pending'
        else if (statusRand > 0.8) status = 'inactive'

        // Random join date in the past year
        const daysAgo = Math.floor(Math.random() * 365)
        const joinedAt = DateTime.now().minus({ days: daysAgo })

        organizationVolunteers.push({
          organization_id: org.id,
          user_id: user.id,
          role,
          status,
          joined_at: joinedAt.toSQL(),
          notes: Math.random() > 0.7 ? 'Randomly generated volunteer assignment' : null,
          created_at: joinedAt.toSQL(),
          updated_at: DateTime.now().toSQL()
        })
      }
    }

    // Insert in batches to avoid conflicts
    const batchSize = 100
    for (let i = 0; i < organizationVolunteers.length; i += batchSize) {
      const batch = organizationVolunteers.slice(i, i + batchSize)
      try {
        await Database.table('organization_volunteers').multiInsert(batch)
      } catch (error) {
        console.log(`Error inserting batch ${i / batchSize + 1}:`, error.message)
      }
    }

    console.log(`✅ Seeded ${organizationVolunteers.length} organization-volunteer relationships`)
  }
}
