import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import Event from 'App/Models/Event'
import Task from 'App/Models/Task'
import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'

export default class EventTaskSeeder extends BaseSeeder {
  public async run() {
    console.log('EventTaskSeeder: starting with Models...')
    const now = DateTime.now()

    // 1. Ensure User organization@gmail.com exists
    let user = await User.findBy('email', 'organization@gmail.com')
    if (!user) {
      user = await User.create({
        email: 'organization@gmail.com',
        password: await Hash.make('12345678'),
        firstName: 'Org',
        lastName: 'Admin',
        phone: '+61 400 000 000',
        volunteerStatus: 'active',
        roleStatus: 'active',
        isAdmin: false,
        isDisabled: false,
        emailVerifiedAt: now
      })
    }

    // 2. Ensure Organization "Ballarat Disability Services" exists
    let org = await Organization.findBy('slug', 'ballarat-disability-services')
    if (!org) {
      org = await Organization.create({
        name: 'Ballarat Disability Services',
        slug: 'ballarat-disability-services',
        description: 'Supporting people with disabilities to live independently in the Ballarat region.',
        contactEmail: 'support@ballaratdisability.org.au',
        contactPhone: '+61 3 5331 5678',
        type: 'Disability Support',
        website: 'https://ballaratdisability.org.au',
        address: '81 Victoria Street',
        city: 'Ballarat',
        country: 'Australia',
        timezone: 'Australia/Melbourne',
        status: 'active',
        isApproved: true,
        isActive: true,
        publicProfile: true,
        ownerId: user.id
      })
    }

    // 3. Ensure User is an Admin in the organization
    await OrganizationTeamMember.firstOrCreate(
      { organizationId: org.id, userId: user.id },
      {
        role: 'admin',
        isActive: true,
        joinedAt: now
      }
    )

    // 4. Create Events
    const eventTitles = [
        'Weekly Social Mixer',
        'Skills Workshop: Independent Living',
        'Ballarat Inclusive Sports Day',
        'Monthly Volunteer Orientation'
    ]

    for (let i = 0; i < eventTitles.length; i++) {
        const start = now.plus({ days: (i + 1) * 2, hours: 10 })
        const end = start.plus({ hours: i % 2 === 0 ? 2 : 4 })

        const event = await Event.firstOrCreate(
            { organizationId: org.id, title: eventTitles[i] },
            {
                description: `A wonderful event: ${eventTitles[i]}. Join us for support and community building.`,
                location: '81 Victoria Street, Ballarat VIC 3350',
                startAt: start,
                endAt: end,
                isPublished: true,
                capacity: 20 + (i * 10)
            }
        )

        // 5. Create Tasks for each event (Simplified for re-runnability: delete existing tasks for this event if needed, or just skip if already has tasks)
        const taskCount = await Task.query().where('event_id', event.id).count('* as total').first()
        const totalTasks = Number((taskCount as any)?.$extras?.total || (taskCount as any)?.total || 0)
        
        if (totalTasks === 0) {
            const taskLevels = ['High', 'Medium', 'Low']
            const taskTitles = [
                'Setup and Decoration',
                'Guest Greeting & Registration',
                'Catering Assistance',
                'Activity Facilitation',
                'Cleanup & Feedback Collection'
            ]

            for (let j = 0; j < taskTitles.length; j++) {
                await Task.create({
                    eventId: event.id,
                    title: taskTitles[j],
                    description: `Help with ${taskTitles[j].toLowerCase()} for ${eventTitles[i]}.`,
                    startAt: start,
                    endAt: end,
                    slotCount: 2 + (j % 3),
                    status: 'open',
                    priority: taskLevels[j % 3],
                    requiredSkills: ['Communication', 'Teamwork']
                })
            }
        }
    }

    console.log('EventTaskSeeder: completed successfully.')
  }
}
