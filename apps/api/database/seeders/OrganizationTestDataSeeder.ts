import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import Event from 'App/Models/Event'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  public async run() {
    // Create test organizations
    const organizations = await Organization.createMany([
      {
        name: 'Green Earth Foundation',
        description: 'Environmental conservation and sustainability initiatives',
        contactEmail: 'contact@greenearth.org',
        contactPhone: '+1-555-0101',
        isApproved: true,
        isActive: true
      },
      {
        name: 'Community Helpers Network',
        description: 'Supporting local communities through volunteer programs',
        contactEmail: 'info@communityhelpers.org',
       contactPhone: '+1-555-0102',
        isApproved: true,
        isActive: true
      },
      {
        name: 'Youth Mentorship Program',
        description: 'Connecting mentors with youth for personal development',
        contactEmail: 'mentors@youthprogram.org',
        contactPhone: '+1-555-0103',
        isApproved: true,
        isActive: true
      }
    ])

    // Create test users for team members and volunteers
    const teamUsers = await User.createMany([
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@example.com',
        password: 'password123'
      },
      {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@example.com',
        password: 'password123'
      },
      {
        firstName: 'Carol',
        lastName: 'Williams',
        email: 'carol.williams@example.com',
        password: 'password123'
      }
    ])

    // Create team members for each organization
    for (const org of organizations) {
      await OrganizationTeamMember.createMany([
        {
          organizationId: org.id,
          userId: teamUsers[0].id,
          role: 'Admin'
        },
        {
          organizationId: org.id,
          userId: teamUsers[1].id,
          role: 'Coordinator'
        },
        {
          organizationId: org.id,
          userId: teamUsers[2].id,
          role: 'Member'
        }
      ])
    }

    // Create volunteer users
    const volunteerUsers = await User.createMany([
      { firstName: 'David', lastName: 'Brown', email: 'david.brown@example.com', password: 'password123' },
      { firstName: 'Emma', lastName: 'Davis', email: 'emma.davis@example.com', password: 'password123' },
      { firstName: 'Frank', lastName: 'Miller', email: 'frank.miller@example.com', password: 'password123' },
      { firstName: 'Grace', lastName: 'Wilson', email: 'grace.wilson@example.com', password: 'password123' },
      { firstName: 'Henry', lastName: 'Moore', email: 'henry.moore@example.com', password: 'password123' },
      { firstName: 'Ivy', lastName: 'Taylor', email: 'ivy.taylor@example.com', password: 'password123' },
      { firstName: 'Jack', lastName: 'Anderson', email: 'jack.anderson@example.com', password: 'password123' },
      { firstName: 'Kate', lastName: 'Thomas', email: 'kate.thomas@example.com', password: 'password123' },
      { firstName: 'Leo', lastName: 'Jackson', email: 'leo.jackson@example.com', password: 'password123' },
      { firstName: 'Mia', lastName: 'White', email: 'mia.white@example.com', password: 'password123' },
      { firstName: 'Noah', lastName: 'Harris', email: 'noah.harris@example.com', password: 'password123' },
      { firstName: 'Olivia', lastName: 'Martin', email: 'olivia.martin@example.com', password: 'password123' },
      { firstName: 'Peter', lastName: 'Garcia', email: 'peter.garcia@example.com', password: 'password123' },
      { firstName: 'Quinn', lastName: 'Martinez', email: 'quinn.martinez@example.com', password: 'password123' },
      { firstName: 'Rachel', lastName: 'Robinson', email: 'rachel.robinson@example.com', password: 'password123' }
    ])

    // Create volunteers for each organization
    const statuses = ['Active', 'Active', 'Active', 'Inactive', 'Pending']
    const roles = ['Volunteer', 'Volunteer', 'Team Lead', 'Volunteer', 'Volunteer']
    const skills = [
      ['First Aid', 'Event Planning'],
      ['Teaching', 'Mentoring'],
      ['Logistics', 'Coordination'],
      ['Public Speaking', 'Fundraising'],
      ['IT Support', 'Data Entry'],
      ['Photography', 'Social Media'],
      ['Cooking', 'Food Service'],
      ['Construction', 'Repair'],
      ['Gardening', 'Agriculture'],
      ['Translation', 'Interpretation']
    ]

    for (const org of organizations) {
      for (let i = 0; i < volunteerUsers.length; i++) {
        const volunteer = volunteerUsers[i]
        await OrganizationVolunteer.create({
          organizationId: org.id,
          userId: volunteer.id,
          status: statuses[i % statuses.length],
          role: roles[i % roles.length],
          hours: Math.floor(Math.random() * 200),
          rating: Math.random() * 2 + 3, // 3-5 rating
          skills: skills[i % skills.length].join(', ')
        })
      }
    }

    // Create events for each organization
    const eventTypes = ['Community Service', 'Education', 'Environmental', 'Health', 'Emergency Response']
    const eventTitles = [
      'Beach Cleanup Drive',
      'Youth Tutoring Session',
      'Tree Planting Campaign',
      'Blood Donation Event',
      'Disaster Relief Fundraiser',
      'Food Bank Distribution',
      'Senior Care Visit',
      'Park Restoration',
      'Community Garden Setup',
      'Literacy Program'
    ]

    for (const org of organizations) {
      for (let i = 0; i < 10; i++) {
        const startDate = DateTime.now().plus({ days: Math.floor(Math.random() * 60) - 30 })
        await Event.create({
          organizationId: org.id,
          title: eventTitles[i],
          description: `${eventTitles[i]} organized by ${org.name}`,
          eventType: eventTypes[i % eventTypes.length],
          location: `${i + 1}00 Main Street, City`,
          startAt: startDate.toJSDate(),
          endAt: startDate.plus({ hours: 4 }).toJSDate(),
          capacity: Math.floor(Math.random() * 50) + 20,
          status: startDate > DateTime.now() ? 'Upcoming' : 'Completed'
        })
      }
    }

    // Create volunteer hours entries
    const events = await Event.all()
    const volunteers = await OrganizationVolunteer.all()

    for (let i = 0; i < 100; i++) {
      const volunteer = volunteers[Math.floor(Math.random() * volunteers.length)]
      const event = events[Math.floor(Math.random() * events.length)]
      const date = DateTime.now().minus({ days: Math.floor(Math.random() * 180) })
      const hours = Math.floor(Math.random() * 8) + 1
      const statusOptions = ['approved', 'approved', 'approved', 'pending', 'rejected']

      await Database.table('volunteer_hours').insert({
        user_id: volunteer.userId,
        event_id: event.id,
        date: date.toSQLDate(),
        hours: hours,
        description: `Volunteered at ${event.title}`,
        status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
        created_at: date.toSQL(),
        updated_at: date.toSQL()
      })
    }

    console.log('✅ Organization test data seeded successfully!')
    console.log(`   - Created ${organizations.length} organizations`)
    console.log(`   - Created ${teamUsers.length * organizations.length} team members`)
    console.log(`   - Created ${volunteerUsers.length * organizations.length} volunteers`)
    console.log(`   - Created ${10 * organizations.length} events`)
    console.log(`   - Created 100 volunteer hours entries`)
  }
}
