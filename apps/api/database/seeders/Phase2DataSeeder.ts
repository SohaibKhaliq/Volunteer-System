import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Organization from 'App/Models/Organization'
import User from 'App/Models/User'
import Team from 'App/Models/Team'
import Opportunity from 'App/Models/Opportunity'
import Application from 'App/Models/Application'
import Attendance from 'App/Models/Attendance'
import OrganizationTeamMember from 'App/Models/OrganizationTeamMember'
import OrganizationVolunteer from 'App/Models/OrganizationVolunteer'
import { DateTime } from 'luxon'

export default class Phase2DataSeeder extends BaseSeeder {
  public async run() {
    // Create test organization
    const org = await Organization.firstOrCreate(
      { name: 'Community Volunteers Hub' },
      {
        name: 'Community Volunteers Hub',
        slug: 'community-volunteers-hub',
        description: 'A comprehensive volunteer organization for community service',
        contactEmail: 'contact@communityhub.org',
        contactPhone: '555-123-4567',
        address: '123 Main Street',
        city: 'San Francisco',
        country: 'USA',
        timezone: 'America/Los_Angeles',
        status: 'active',
        isApproved: true,
        isActive: true,
        publicProfile: true,
        autoApproveVolunteers: false,
        settings: {
          allowQRCheckin: true,
          requireDocuments: false,
          notifyOnApply: true,
          notifyOnCheckin: true
        }
      }
    )

    // Create admin user
    const adminUser = await User.firstOrCreate(
      { email: 'admin@communityhub.org' },
      {
        email: 'admin@communityhub.org',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true
      }
    )

    // Create coordinator user
    const coordinatorUser = await User.firstOrCreate(
      { email: 'coordinator@communityhub.org' },
      {
        email: 'coordinator@communityhub.org',
        password: 'coord123',
        firstName: 'Sarah',
        lastName: 'Coordinator'
      }
    )

    // Create some volunteer users
    const volunteerEmails = [
      { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe' },
      { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith' },
      { email: 'bob.wilson@example.com', firstName: 'Bob', lastName: 'Wilson' },
      { email: 'alice.johnson@example.com', firstName: 'Alice', lastName: 'Johnson' },
      { email: 'mike.brown@example.com', firstName: 'Mike', lastName: 'Brown' },
      { email: 'emily.davis@example.com', firstName: 'Emily', lastName: 'Davis' },
      { email: 'chris.lee@example.com', firstName: 'Chris', lastName: 'Lee' },
      { email: 'lisa.martinez@example.com', firstName: 'Lisa', lastName: 'Martinez' },
      { email: 'david.garcia@example.com', firstName: 'David', lastName: 'Garcia' },
      { email: 'susan.taylor@example.com', firstName: 'Susan', lastName: 'Taylor' }
    ]

    const volunteers: User[] = []
    for (const vol of volunteerEmails) {
      const user = await User.firstOrCreate(
        { email: vol.email },
        {
          email: vol.email,
          password: 'volunteer123',
          firstName: vol.firstName,
          lastName: vol.lastName
        }
      )
      volunteers.push(user)
    }

    // Add admin and coordinator to org team
    await OrganizationTeamMember.firstOrCreate(
      { organizationId: org.id, userId: adminUser.id },
      {
        organizationId: org.id,
        userId: adminUser.id,
        role: 'Admin'
      }
    )

    await OrganizationTeamMember.firstOrCreate(
      { organizationId: org.id, userId: coordinatorUser.id },
      {
        organizationId: org.id,
        userId: coordinatorUser.id,
        role: 'Coordinator'
      }
    )

    // Add volunteers to organization
    for (const volunteer of volunteers) {
      await OrganizationVolunteer.firstOrCreate(
        { organizationId: org.id, userId: volunteer.id },
        {
          organizationId: org.id,
          userId: volunteer.id,
          role: 'Volunteer',
          status: 'Active',
          hours: Math.floor(Math.random() * 100),
          rating: Math.floor(Math.random() * 5) + 1
        }
      )
    }

    // Create teams
    const teams = [
      {
        name: 'Event Coordination',
        description: 'Coordinates all volunteer events',
        lead: coordinatorUser
      },
      { name: 'Outreach', description: 'Community outreach and volunteer recruitment', lead: null },
      { name: 'Training', description: 'Volunteer training and development', lead: null },
      { name: 'Communications', description: 'Internal and external communications', lead: null }
    ]

    const createdTeams: Team[] = []
    for (const teamData of teams) {
      const team = await Team.firstOrCreate(
        { organizationId: org.id, name: teamData.name },
        {
          organizationId: org.id,
          name: teamData.name,
          description: teamData.description,
          leadUserId: teamData.lead?.id
        }
      )
      createdTeams.push(team)
    }

    // Create opportunities
    const now = DateTime.now()
    const opportunities = [
      {
        title: 'Beach Cleanup Day',
        description: 'Join us for our monthly beach cleanup event. Supplies provided.',
        location: 'Ocean Beach, San Francisco',
        capacity: 30,
        type: 'event',
        startAt: now.plus({ days: 7 }).set({ hour: 9 }),
        endAt: now.plus({ days: 7 }).set({ hour: 13 }),
        status: 'published',
        visibility: 'public',
        teamId: createdTeams[0].id
      },
      {
        title: 'Food Bank Volunteer Shift',
        description: 'Help sort and distribute food at the local food bank.',
        location: 'SF Food Bank, 900 Pennsylvania Ave',
        capacity: 15,
        type: 'shift',
        startAt: now.plus({ days: 3 }).set({ hour: 10 }),
        endAt: now.plus({ days: 3 }).set({ hour: 14 }),
        status: 'published',
        visibility: 'public',
        teamId: createdTeams[0].id
      },
      {
        title: 'Senior Center Visit',
        description: 'Visit with seniors, play games, and provide companionship.',
        location: 'Golden Gate Senior Center',
        capacity: 10,
        type: 'event',
        startAt: now.plus({ days: 10 }).set({ hour: 14 }),
        endAt: now.plus({ days: 10 }).set({ hour: 17 }),
        status: 'published',
        visibility: 'org-only',
        teamId: createdTeams[1].id
      },
      {
        title: 'Volunteer Orientation',
        description: 'Orientation session for new volunteers.',
        location: 'Community Center, Room 101',
        capacity: 25,
        type: 'event',
        startAt: now.plus({ days: 5 }).set({ hour: 18 }),
        endAt: now.plus({ days: 5 }).set({ hour: 20 }),
        status: 'published',
        visibility: 'public',
        teamId: createdTeams[2].id
      },
      {
        title: 'Park Restoration Project',
        description: 'Help restore native plants in the local park.',
        location: 'Golden Gate Park',
        capacity: 20,
        type: 'event',
        startAt: now.plus({ days: 14 }).set({ hour: 8 }),
        endAt: now.plus({ days: 14 }).set({ hour: 12 }),
        status: 'draft',
        visibility: 'public',
        teamId: createdTeams[0].id
      },
      {
        title: 'Weekly Reading Program',
        description: 'Read to children at the local library.',
        location: "Main Library, Children's Section",
        capacity: 5,
        type: 'recurring',
        startAt: now.plus({ days: 2 }).set({ hour: 15 }),
        endAt: now.plus({ days: 2 }).set({ hour: 16 }),
        status: 'published',
        visibility: 'public',
        teamId: createdTeams[1].id
      }
    ]

    const createdOpportunities: Opportunity[] = []
    for (const oppData of opportunities) {
      const opp = await Opportunity.firstOrCreate(
        { organizationId: org.id, title: oppData.title },
        {
          organizationId: org.id,
          teamId: oppData.teamId,
          title: oppData.title,
          slug: Opportunity.generateSlug(oppData.title),
          description: oppData.description,
          location: oppData.location,
          capacity: oppData.capacity,
          type: oppData.type,
          startAt: oppData.startAt,
          endAt: oppData.endAt,
          status: oppData.status,
          visibility: oppData.visibility,
          checkinCode: Opportunity.generateCheckinCode(),
          createdBy: adminUser.id
        }
      )
      createdOpportunities.push(opp)
    }

    // Create some applications for published opportunities
    const publishedOpps = createdOpportunities.filter((o) => o.status === 'published')

    for (let i = 0; i < publishedOpps.length; i++) {
      const opp = publishedOpps[i]
      // Each opportunity gets 3-5 applications
      const numApplicants = Math.floor(Math.random() * 3) + 3

      for (let j = 0; j < numApplicants && j < volunteers.length; j++) {
        const volunteer = volunteers[(i * 2 + j) % volunteers.length]
        const statuses = ['applied', 'accepted', 'accepted', 'accepted', 'rejected']
        const status = statuses[Math.floor(Math.random() * statuses.length)]

        await Application.firstOrCreate(
          { opportunityId: opp.id, userId: volunteer.id },
          {
            opportunityId: opp.id,
            userId: volunteer.id,
            status,
            appliedAt: now.minus({ days: Math.floor(Math.random() * 5) + 1 }),
            respondedAt:
              status !== 'applied' ? now.minus({ days: Math.floor(Math.random() * 3) }) : undefined,
            notes: status === 'rejected' ? 'Capacity reached' : undefined
          }
        )
      }
    }

    // Create some attendance records for accepted applications
    const acceptedApplications = await Application.query()
      .where('status', 'accepted')
      .preload('opportunity')
      .preload('user')

    for (const app of acceptedApplications) {
      // 70% chance of having attendance
      if (Math.random() < 0.7 && app.opportunity && app.opportunity.startAt < now) {
        const checkInAt = app.opportunity.startAt.plus({ minutes: Math.floor(Math.random() * 30) })
        const hasCheckedOut = Math.random() < 0.8
        const checkOutAt = hasCheckedOut
          ? app.opportunity.endAt?.minus({ minutes: Math.floor(Math.random() * 30) })
          : undefined

        await Attendance.firstOrCreate(
          { opportunityId: app.opportunityId, userId: app.userId },
          {
            opportunityId: app.opportunityId,
            userId: app.userId,
            checkInAt,
            checkOutAt,
            method: Math.random() < 0.6 ? 'qr' : 'manual'
          }
        )
      }
    }

    console.log('Phase 2 seeder completed successfully!')
    console.log(`Created/updated:`)
    console.log(`  - 1 organization`)
    console.log(`  - ${2 + volunteers.length} users`)
    console.log(`  - ${createdTeams.length} teams`)
    console.log(`  - ${createdOpportunities.length} opportunities`)
    console.log(`  - Applications and attendances`)
  }
}
