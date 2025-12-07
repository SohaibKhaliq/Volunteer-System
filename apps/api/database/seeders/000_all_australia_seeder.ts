import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

/**
 * Single consolidated seeder for the entire app containing Australia-related demo data.
 * - This replaces the multiple small seeders previously used in development.
 * - Idempotent operations used so re-running is safe for development databases.
 * - Safety: this seeder will skip execution unless NODE_ENV is development or explicitly allowed
 */
export default class AustraliaFullSeeder extends BaseSeeder {
  public async run() {
    const env = process.env.NODE_ENV || 'development'
    if (env !== 'development' && env !== 'test') {
      this.logger.info(
        'AustraliaFullSeeder skipped - not running in non-development/test environment'
      )
      return
    }

    const now = DateTime.now()

    // --- Types (if table exists) ---
    try {
      const existingTypes = await Database.from('types').count('* as total')
      const total = Number(existingTypes?.[0]?.total || 0)
      if (total === 0) {
        const allowTypes = ['rescue', 'medical_assistance', 'food', 'shelter', 'other']
        await Database.table('types').multiInsert(
          allowTypes.map((t) => ({ type: t, created_at: now.toSQL(), updated_at: now.toSQL() }))
        )
      }
    } catch (e) {
      this.logger.warn('Skipping types seeding: table may not exist or error', e?.message)
    }

    // --- Roles & Permissions ---
    try {
      const roles = ['admin', 'org_manager', 'volunteer']
      for (const r of roles) {
        await Database.table('roles')
          .where('name', r)
          .first()
          .then((rExists) => {
            if (!rExists) {
              return Database.table('roles').insert({
                name: r,
                created_at: now.toSQL(),
                updated_at: now.toSQL()
              })
            }
          })
      }

      const permissions = ['manage_users', 'manage_events', 'view_reports', 'manage_compliance']
      for (const p of permissions) {
        await Database.table('permissions')
          .where('name', p)
          .first()
          .then((pExists) => {
            if (!pExists) {
              return Database.table('permissions').insert({
                name: p,
                created_at: now.toSQL(),
                updated_at: now.toSQL()
              })
            }
          })
      }

      // attach all permissions to admin role
      const admin = await Database.from('roles').where('name', 'admin').first()
      const perms = await Database.from('permissions').select('id')
      if (admin && perms.length) {
        for (const p of perms) {
          const exists = await Database.from('role_permissions')
            .where('role_id', admin.id)
            .andWhere('permission_id', p.id)
            .first()
          if (!exists)
            await Database.table('role_permissions').insert({
              role_id: admin.id,
              permission_id: p.id,
              created_at: now.toSQL(),
              updated_at: now.toSQL()
            })
        }
      }
    } catch (e) {
      this.logger.warn(
        'Skipping roles/permissions seeding: table may not exist or error',
        e?.message
      )
    }

    // --- Organizations (Australian examples) ---
    const orgsToCreate = [
      {
        key: 'red-cross',
        name: 'Australian Red Cross',
        description: 'Disaster relief and community services across Australia',
        contact_email: 'info@redcross.org.au',
        contact_phone: '+61 2 9261 7000',
        address: 'Sydney, NSW',
        type: 'Nonprofit'
      },
      {
        key: 'nsw-rfs',
        name: 'NSW Rural Fire Service',
        description: 'RFS NSW',
        contact_email: 'info@rfs.nsw.gov.au',
        contact_phone: '+61 2 8741 5555',
        address: 'New South Wales',
        type: 'Emergency Services'
      },
      {
        key: 'salvation-army',
        name: 'Salvation Army Australia',
        description: 'Social services and relief',
        contact_email: 'contact@salvationarmy.org.au',
        contact_phone: '+61 131 234',
        address: 'Australia wide',
        type: 'Nonprofit'
      },
      {
        key: 'lifeline',
        name: 'Lifeline Australia',
        description: '24/7 crisis support',
        contact_email: 'support@lifeline.org.au',
        contact_phone: '13 11 14',
        address: 'Australia wide',
        type: 'Nonprofit'
      },
      {
        key: 'ses-vic',
        name: 'SES Victoria',
        description: 'State Emergency Service Victoria',
        contact_email: 'contact@ses.vic.gov.au',
        contact_phone: '+61 3 9310 0000',
        address: 'Victoria',
        type: 'Emergency Services'
      }
    ]

    const createdOrgs: Record<string, any> = {}
    for (const o of orgsToCreate) {
      let org = await Database.from('organizations').where('name', o.name).first()
      if (!org) {
        const [id] = await Database.table('organizations').insert({
          name: o.name,
          description: o.description,
          contact_email: o.contact_email,
          contact_phone: o.contact_phone,
          address: o.address,
          type: o.type,
          is_approved: true,
          is_active: true,
          public_profile: true,
          created_at: now.toSQL(),
          updated_at: now.toSQL()
        })
        org = await Database.from('organizations').where('id', id).first()
      }
      createdOrgs[o.key] = org
    }

    // --- Users (admin + volunteers across Australian cities) ---
    const adminEmail = 'admin@aus.local'
    let adminUser = await Database.from('users').where('email', adminEmail).first()
    if (!adminUser) {
      const [adminId] = await Database.table('users').insert({
        email: adminEmail,
        password: 'password',
        first_name: 'Platform',
        last_name: 'Admin',
        is_admin: true,
        created_at: now.toSQL(),
        updated_at: now.toSQL()
      })
      adminUser = await Database.from('users').where('id', adminId).first()
    }

    const cities = [
      'Sydney',
      'Melbourne',
      'Brisbane',
      'Perth',
      'Adelaide',
      'Hobart',
      'Darwin',
      'Canberra'
    ]
    const volunteerList: any[] = []
    for (let i = 0; i < 80; i++) {
      const city = cities[i % cities.length]
      const email = `${city.toLowerCase()}.vol${i}@aus.example.com`
      let u = await Database.from('users').where('email', email).first()
      if (!u) {
        const [uid] = await Database.table('users').insert({
          email,
          password: 'password',
          first_name: `Vol${i}`,
          last_name: city,
          phone: `+61 4${String(100000 + i).slice(-8)}`,
          volunteer_status: 'active',
          created_at: now.toSQL(),
          updated_at: now.toSQL()
        })
        u = await Database.from('users').where('id', uid).first()
      }
      volunteerList.push(u)
    }

    // --- Team members & volunteers assignments ---
    for (const key of Object.keys(createdOrgs)) {
      const org = createdOrgs[key]
      // make adminUser an org team admin
      const existingTeam = await Database.from('organization_team_members')
        .where({ organization_id: org.id, user_id: adminUser.id })
        .first()
      if (!existingTeam) {
        await Database.table('organization_team_members').insert({
          organization_id: org.id,
          user_id: adminUser.id,
          role: 'Admin',
          created_at: now.toSQL(),
          updated_at: now.toSQL()
        })
      }

      // add volunteers to this org
      const toAdd = volunteerList.slice(0, 20) // assign first 20 volunteers to each org
      for (const u of toAdd) {
        const exists = await Database.from('organization_volunteers')
          .where({ organization_id: org.id, user_id: u.id })
          .first()
        if (!exists) {
          await Database.table('organization_volunteers').insert({
            organization_id: org.id,
            user_id: u.id,
            role: Math.random() > 0.9 ? 'admin' : 'volunteer',
            status: Math.random() > 0.1 ? 'active' : 'inactive',
            joined_at: now.minus({ days: Math.floor(Math.random() * 400) }).toSQL(),
            created_at: now.toSQL(),
            updated_at: now.toSQL()
          })
        }
      }
    }

    // --- Events, Tasks, and Volunteer Hours ---
    const seedEventForOrg = async (org: any, idx: number) => {
      const title = `${org.name} - Community Event #${idx + 1}`
      let event = await Database.from('events').where({ organization_id: org.id, title }).first()
      if (!event) {
        const start = now.plus({ days: (idx + 1) * 3 })
        const [eid] = await Database.table('events').insert({
          organization_id: org.id,
          title,
          description: `${title} — volunteering opportunity in Australia`,
          location: `${idx + 1}00 ${org.name.split(' ')[0]} St, ${cities[idx % cities.length]}`,
          start_at: start.toSQL(),
          end_at: start.plus({ hours: 4 }).toSQL(),
          capacity: 50 + Math.floor(Math.random() * 150),
          is_published: true,
          created_at: now.toSQL(),
          updated_at: now.toSQL()
        })
        event = await Database.from('events').where('id', eid).first()
      }

      // add several tasks for the event
      for (let t = 0; t < 3; t++) {
        const ttitle = `${event.title} - Task ${t + 1}`
        const exists = await Database.from('tasks')
          .where({ event_id: event.id, title: ttitle })
          .first()
        if (!exists) {
          await Database.table('tasks').insert({
            event_id: event.id,
            title: ttitle,
            description: 'Task seeded for demos',
            slot_count: 5,
            created_at: now.toSQL(),
            updated_at: now.toSQL()
          })
        }
      }

      // generate some volunteer_hours for this event
      const volunteersForOrg = await Database.from('organization_volunteers')
        .where('organization_id', org.id)
        .select('user_id')
      for (let h = 0; h < Math.min(8, volunteersForOrg.length); h++) {
        const chosen = volunteersForOrg[h]
        if (!chosen) continue
        await Database.table('volunteer_hours').insert({
          user_id: chosen.user_id,
          event_id: event.id,
          date: now.minus({ days: Math.floor(Math.random() * 180) }).toISODate(),
          hours: Number((Math.random() * 4 + 1).toFixed(2)),
          status: 'approved',
          created_at: now.toSQL(),
          updated_at: now.toSQL()
        })
      }

      return event
    }

    for (const [idx, key] of Object.keys(createdOrgs).entries()) {
      const org = createdOrgs[key]
      // create 4 events per org
      for (let e = 0; e < 4; e++) {
        await seedEventForOrg(org, e)
      }
    }

    // --- Invitations (organization_invites) sample ---
    for (const key of Object.keys(createdOrgs)) {
      const org = createdOrgs[key]
      const inviteEmail = `${key}.invite@example.com`
      const existing = await Database.from('organization_invites')
        .where({ organization_id: org.id, email: inviteEmail })
        .first()
      if (!existing) {
        await Database.table('organization_invites').insert({
          organization_id: org.id,
          email: inviteEmail,
          token: Math.random().toString(36).slice(2, 12),
          role: 'volunteer',
          status: 'pending',
          expires_at: now.plus({ days: 60 }).toSQL(),
          message: 'Invitation seeded by AustraliaFullSeeder',
          created_at: now.toSQL(),
          updated_at: now.toSQL()
        })
      }
    }

    // --- Courses & Enrollments ---
    try {
      const courses = [
        { title: 'First Aid (HLTAID011)', instructor: 'Red Cross Trainer' },
        { title: 'Volunteer Management — Coordinators', instructor: 'Salvation Army' }
      ]
      for (const c of courses) {
        const existing = await Database.from('courses').where('title', c.title).first()
        let courseId
        if (!existing) {
          const [cid] = await Database.table('courses').insert({
            title: c.title,
            description: `${c.title} — seeded`,
            instructor: c.instructor,
            start_at: now.plus({ days: 5 }).toSQL(),
            end_at: now.plus({ days: 6 }).toSQL(),
            capacity: 30,
            status: 'Open',
            created_at: now.toSQL(),
            updated_at: now.toSQL()
          })
          courseId = cid
        } else {
          courseId = existing.id
        }

        // enroll some volunteers
        const vols = await Database.from('organization_volunteers').select('user_id').limit(6)
        for (const v of vols) {
          const enrollExists = await Database.from('course_enrollments')
            .where({ course_id: courseId, user_id: v.user_id })
            .first()
          if (!enrollExists) {
            await Database.table('course_enrollments').insert({
              course_id: courseId,
              user_id: v.user_id,
              status: 'Enrolled',
              progress: 0,
              created_at: now.toSQL(),
              updated_at: now.toSQL()
            })
          }
        }
      }
    } catch (e) {
      this.logger.warn('Skipping courses seeding (maybe table missing)', e?.message)
    }

    // --- Offers, Resources, Help Requests, Surveys ---
    try {
      // Offers / resources / help requests seeded lightly
      const offers = [
        { name: 'Collection Hub', description: 'Offer to host collection centre', city: 'Sydney' },
        {
          name: 'Transport Vehicle',
          description: 'Offer trucks for distribution',
          city: 'Melbourne'
        }
      ]
      for (const o of offers) {
        const exists = await Database.from('offers').where('name', o.name).first()
        if (!exists) {
          await Database.table('offers').insert({
            longitude: -33.86,
            latitude: -33.86,
            address: `${o.city} CBD`,
            description: o.description,
            status: 'planned',
            name: o.name,
            phone: '+61 400 000 000',
            email: `${o.name.replace(/\s+/g, '').toLowerCase()}@example.com`,
            is_on_site: 1,
            user_id: adminUser.id,
            created_at: now.toSQL(),
            updated_at: now.toSQL(),
            files: '[]'
          })
        }
      }

      const resources = [
        { name: 'Blankets', quantity: 500, organization_key: 'red-cross' },
        { name: 'Water Bottles', quantity: 2000, organization_key: 'salvation-army' }
      ]
      for (const r of resources) {
        const org = createdOrgs[r.organization_key]
        if (!org) continue
        const existing = await Database.from('resources')
          .where({ organization_id: org.id, name: r.name })
          .first()
        if (!existing) {
          await Database.table('resources').insert({
            name: r.name,
            quantity: r.quantity,
            status: 'Available',
            organization_id: org.id,
            created_at: now.toSQL(),
            updated_at: now.toSQL()
          })
        }
      }

      const helpExists = await Database.from('help_requests').count('* as total')
      if (Number(helpExists?.[0]?.total || 0) === 0) {
        await Database.table('help_requests').insert({
          longitude: -33.86,
          latitude: -33.86,
          address: 'Sydney',
          description: 'Family requires assistance after storm',
          source: 'community',
          status: 'requested',
          name: 'Family',
          phone: '+61 400 000 001',
          email: 'needs@example.com',
          is_on_site: 1,
          created_at: now.toSQL(),
          updated_at: now.toSQL(),
          files: '[]'
        })
      }

      const surveyExists = await Database.from('surveys').count('* as total')
      if (Number(surveyExists?.[0]?.total || 0) === 0) {
        const [sid] = await Database.table('surveys').insert({
          title: 'Volunteer Satisfaction Survey',
          description: 'Short survey for seeded events',
          status: 'Open',
          created_at: now.toSQL(),
          updated_at: now.toSQL()
        })
        await Database.table('survey_responses').insert({
          survey_id: sid,
          user_id: volunteerList[0]?.id ?? adminUser.id,
          answers: JSON.stringify({ q1: 'satisfied' }),
          created_at: now.toSQL()
        })
      }
    } catch (e) {
      this.logger.warn(
        'Skipping offers/resources/help requests or surveys (maybe tables missing)',
        e?.message
      )
    }

    // --- Achievements default set ---
    try {
      const existingAch = await Database.from('achievements').count('* as total')
      if (Number(existingAch?.[0]?.total || 0) === 0) {
        const defaults = [
          {
            key: 'early-adopter',
            title: 'Early Adopter',
            description: 'Joined the platform 2+ years ago',
            criteria: JSON.stringify({ type: 'member_days', threshold: 730 }),
            points: 50,
            is_enabled: true
          },
          {
            key: '50-hours',
            title: '50 Hours Club',
            description: 'Contributed 50+ approved volunteering hours',
            criteria: JSON.stringify({ type: 'hours', threshold: 50 }),
            points: 100,
            is_enabled: true
          }
        ]
        for (const a of defaults) {
          await Database.table('achievements').insert({
            ...a,
            created_at: now.toSQL(),
            updated_at: now.toSQL()
          })
        }
      }
    } catch (e) {
      this.logger.warn('Skipping achievements seeding (maybe table missing)', e?.message)
    }

    // --- Scheduled jobs / meta seeds (simple examples) ---
    try {
      const jobExists = await Database.from('scheduled_jobs')
        .where('job_name', 'audit-maintenance')
        .first()
      if (!jobExists) {
        await Database.table('scheduled_jobs').insert({
          job_name: 'audit-maintenance',
          schedule: '0 2 * * *',
          is_enabled: 1,
          created_at: now.toSQL(),
          updated_at: now.toSQL()
        })
      }
    } catch (e) {
      this.logger.warn('Skipping scheduled_jobs seed', e?.message)
    }

    // final summary
    this.logger.info(
      'AustraliaFullSeeder: successful — organizations:',
      Object.keys(createdOrgs).length
    )
    this.logger.info('AustraliaFullSeeder: users:', volunteerList.length + (adminUser ? 1 : 0))
  }
}
