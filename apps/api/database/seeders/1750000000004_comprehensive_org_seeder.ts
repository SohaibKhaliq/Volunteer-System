import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import { DateTime } from 'luxon'

/**
 * Comprehensive seeder for a single organization account (organization@gmail.com)
 * - Creates a primary organization with contact email organization@gmail.com
 * - Adds an admin team member (same email)
 * - Creates 40 volunteers with mixed activity
 * - Creates monthly events across the last 12 months
 * - Generates volunteer_hours for volunteers (some frequent, some occasional)
 *
 * This seeder is intended for development/testing only (not production). It's
 * idempotent (checks for existing organization / users by email) so it can be
 * re-run safely in most dev test environments.
 */

export default class ComprehensiveOrgSeeder extends BaseSeeder {
  public async run() {
    console.info('ComprehensiveOrgSeeder disabled — using 000_all_australia_seeder instead')
    return

    // Check if organization exists
    let org = await Database.from('organizations').where('contact_email', orgEmail).first()

    if (!org) {
      const insert = await Database.table('organizations').insert({
        name: 'Comprehensive Org',
        description: 'Dev seeder organization for populating features and analytics',
        contact_email: orgEmail,
        contact_phone: '+1-555-000-0000',
        logo: null,
        type: 'Nonprofit',
        website: 'https://example.org',
        address: '123 Example St, Dev City',
        is_approved: true,
        is_active: true,
        public_profile: true,
        auto_approve_volunteers: true,
        created_at: DateTime.now().toSQL({ includeOffset: false }),
        updated_at: DateTime.now().toSQL({ includeOffset: false })
      })

      const [id] = insert as number[]
      org = await Database.from('organizations').where('id', id).first()
    }

    const orgId = org.id

    // Create or get admin user
    let admin = await Database.from('users').where('email', orgEmail).first()
    if (!admin) {
      const [adminId] = await Database.table('users').insert({
        email: orgEmail,
        password: 'password',
        first_name: 'Org',
        last_name: 'Admin',
        is_admin: true,
        created_at: DateTime.now().toSQL({ includeOffset: false }),
        updated_at: DateTime.now().toSQL({ includeOffset: false })
      })
      admin = await Database.from('users').where('id', adminId).first()
    }

    // Ensure admin is a team member
    const existingTeam = await Database.from('organization_team_members')
      .where({ organization_id: orgId, user_id: admin.id })
      .first()
    if (!existingTeam) {
      await Database.table('organization_team_members').insert({
        organization_id: orgId,
        user_id: admin.id,
        role: 'Admin',
        created_at: DateTime.now().toSQL({ includeOffset: false }),
        updated_at: DateTime.now().toSQL({ includeOffset: false })
      })
    }

    // Create volunteers (idempotent by email). We'll create 40 volunteers
    const volunteersCount = 40
    const volunteers: { id: number }[] = []

    for (let i = 1; i <= volunteersCount; i++) {
      const email = `vol${i}@comprehensive.local`
      let user = await Database.from('users').where('email', email).first()

      if (!user) {
        const [uid] = await Database.table('users').insert({
          email,
          password: 'password',
          first_name: `Volunteer${i}`,
          last_name: 'Seed',
          is_admin: false,
          created_at: DateTime.now()
            .minus({ days: Math.floor(Math.random() * 400) })
            .toSQL({ includeOffset: false }),
          updated_at: DateTime.now().toSQL({ includeOffset: false })
        })
        user = await Database.from('users').where('id', uid).first()
      }

      volunteers.push({ id: user.id })

      // Add relationship pivot (organization_volunteers) idempotently
      const existing = await Database.from('organization_volunteers')
        .where({ organization_id: orgId, user_id: user.id })
        .first()
      if (!existing) {
        // define role and status distribution
        const roleRand = Math.random()
        const role = roleRand > 0.95 ? 'admin' : roleRand > 0.8 ? 'coordinator' : 'volunteer'
        const statusRand = Math.random()
        const status = statusRand > 0.9 ? 'pending' : statusRand > 0.2 ? 'active' : 'inactive'

        // joined_at spread across 12 months
        const monthsAgo = Math.floor(Math.random() * 12)
        const joinedAt = DateTime.now().minus({
          months: monthsAgo,
          days: Math.floor(Math.random() * 28)
        })

        await Database.table('organization_volunteers').insert({
          organization_id: orgId,
          user_id: user.id,
          role,
          status,
          joined_at: joinedAt.toSQL({ includeOffset: false }),
          created_at: joinedAt.toSQL({ includeOffset: false }),
          updated_at: DateTime.now().toSQL({ includeOffset: false })
        })
      }
    }

    // Create monthly events for last 12 months (idempotent by title+org)
    const monthsToSeed = 12
    const now = DateTime.now()
    const eventIds: number[] = []

    for (let m = 0; m < monthsToSeed; m++) {
      const monthDate = now.minus({ months: m }).startOf('month').plus({ days: 10 })
      const title = `Community Event ${monthDate.toFormat('yyyy-LL')}`

      let existingEvent = await Database.from('events')
        .where({ organization_id: orgId, title })
        .first()
      if (!existingEvent) {
        const [eid] = await Database.table('events').insert({
          organization_id: orgId,
          title,
          description: 'Seeded monthly community event',
          location: 'Community Hall',
          start_at: monthDate.toSQL({ includeOffset: false }),
          end_at: monthDate.plus({ hours: 3 }).toSQL({ includeOffset: false }),
          capacity: 100,
          is_published: true,
          created_at: DateTime.now().toSQL({ includeOffset: false }),
          updated_at: DateTime.now().toSQL({ includeOffset: false })
        })
        eventIds.push(eid as number)
      } else {
        eventIds.push(existingEvent.id)
      }
    }

    // Generate volunteer_hours: for each volunteer, create random entries across last 12 months
    const vhEntries = []
    const activeVolunteers = volunteers.slice(0, Math.floor(volunteers.length * 0.6)) // 60% active

    for (const v of volunteers) {
      // Determine activity level
      const activitySeed = Math.random()
      const monthsToUse =
        activitySeed > 0.9
          ? 12
          : activitySeed > 0.7
            ? 8
            : activitySeed > 0.5
              ? 6
              : activitySeed > 0.2
                ? 3
                : 1

      for (let m = 0; m < monthsToUse; m++) {
        // Each month the volunteer may contribute 1-3 contributions (events/hours)
        const contributions = Math.floor(Math.random() * 3) + 1
        const monthDate = now.minus({ months: m })

        for (let c = 0; c < contributions; c++) {
          const day = Math.min(28, Math.floor(Math.random() * 28) + 1)
          const date = monthDate.set({ day })
          // choose an event id 50% of the time
          const eventId =
            Math.random() > 0.5 ? eventIds[Math.floor(Math.random() * eventIds.length)] : null
          const hours = parseFloat((Math.random() * 4 + 1).toFixed(2)) // between 1 and 5 hours

          vhEntries.push({
            user_id: v.id,
            event_id: eventId,
            date: date.toSQLDate(),
            hours,
            status: 'approved',
            created_at: date.toSQL({ includeOffset: false }),
            updated_at: DateTime.now().toSQL({ includeOffset: false })
          })
        }
      }
    }

    // Insert volunteer_hours batched
    const batchSize = 200
    for (let i = 0; i < vhEntries.length; i += batchSize) {
      const batch = vhEntries.slice(i, i + batchSize)
      try {
        await Database.table('volunteer_hours').multiInsert(batch)
      } catch (error) {
        console.log('Error inserting volunteer_hours batch:', error.message)
      }
    }

    // Add some invites (idempotent) for demonstration
    const inviteEmail = 'invited_volunteer@comprehensive.local'
    const existingInvite = await Database.from('organization_invites')
      .where({ organization_id: orgId, email: inviteEmail })
      .first()
    if (!existingInvite) {
      await Database.table('organization_invites').insert({
        organization_id: orgId,
        email: inviteEmail,
        token: Math.random().toString(36).slice(2, 12),
        role: 'volunteer',
        status: 'pending',
        expires_at: DateTime.now().plus({ days: 30 }).toSQL({ includeOffset: false }),
        message: 'Welcome — seeded invite for testing',
        created_at: DateTime.now().toSQL({ includeOffset: false }),
        updated_at: DateTime.now().toSQL({ includeOffset: false })
      })
    }

    // consolidated seeder now responsible for this data
  }
}
