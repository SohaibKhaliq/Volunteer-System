import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'
import Organization from 'App/Models/Organization'
import ComplianceDocument from 'App/Models/ComplianceDocument'
import Opportunity from 'App/Models/Opportunity'
import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import GeolocationService from 'App/Services/GeolocationService'

export default class AustralianSeeder extends BaseSeeder {
  public async run() {
    // Australian first names
    const firstNames = [
      'Matilda',
      'Lachlan',
      'Isabella',
      'Oliver',
      'Charlotte',
      'Jack',
      'Amelia',
      'William',
      'Mia',
      'Noah',
      'Ava',
      'James',
      'Sophie',
      'Thomas',
      'Emily',
      'Benjamin',
      'Grace',
      'Lucas',
      'Lily',
      'Henry'
    ]

    const lastNames = [
      'Smith',
      'Jones',
      'Williams',
      'Brown',
      'Wilson',
      'Taylor',
      'Anderson',
      'Thomas',
      'Roberts',
      'Johnson',
      'White',
      'Martin',
      'Thompson',
      'Walker',
      'Young',
      'Harris',
      'King',
      'Clark',
      'Lewis',
      'Robinson'
    ]

    // Australian cities with coordinates
    const cities = GeolocationService.getAustralianCities()
    const cityNames = Object.keys(cities)

    // Create organizations in major Australian cities
    const organizations = await Promise.all([
      Organization.create({
        name: 'Sydney Community Care',
        description: 'Supporting vulnerable communities across greater Sydney',
        address: '123 George Street, Sydney NSW 2000',
        city: 'Sydney',
        country: 'Australia',
        latitude: cities.sydney.lat,
        longitude: cities.sydney.lon,
        abn: '12345678901', // Would use real ABN in production
        phone: '0412345678',
        email: 'contact@sydneycare.org.au',
        website: 'https://sydneycare.org.au',
        status: 'active',
        publicProfile: true
      }),
      Organization.create({
        name: 'Melbourne Volunteer Hub',
        description: 'Connecting volunteers with opportunities in Melbourne',
        address: '456 Collins Street, Melbourne VIC 3000',
        city: 'Melbourne',
        country: 'Australia',
        latitude: cities.melbourne.lat,
        longitude: cities.melbourne.lon,
        abn: '98765432109',
        phone: '0423456789',
        email: 'hello@melbournevolunteers.org.au',
        website: 'https://melbournevolunteers.org.au',
        status: 'active',
        publicProfile: true
      }),
      Organization.create({
        name: 'Brisbane Aid Network',
        description: 'Emergency assistance and community support in Brisbane',
        address: '789 Queen Street, Brisbane QLD 4000',
        city: 'Brisbane',
        country: 'Australia',
        latitude: cities.brisbane.lat,
        longitude: cities.brisbane.lon,
        abn: '45678912345',
        phone: '0434567890',
        email: 'info@brisbaneaid.org.au',
        website: 'https://brisbaneaid.org.au',
        status: 'active',
        publicProfile: true
      })
    ])

    console.log(`Created ${organizations.length} Australian organizations`)

    // Create 20 volunteers with Australian names and mobile numbers
    const volunteers = []
    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[i % firstNames.length]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const mobile = `04${Math.floor(10000000 + Math.random() * 90000000)}` // Australian mobile format

      const volunteer = await User.create({
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com.au`,
        password: await Hash.make('password123'),
        firstName,
        lastName,
        phone: mobile,
        bio: `G'day! I'm ${firstName} and I'm passionate about volunteering in the community.`,
        address: `${Math.floor(Math.random() * 999)} Main Street`,
        city: cityNames[i % cityNames.length],
        country: 'Australia',
        isAdmin: false,
        isDisabled: false
      })

      volunteers.push(volunteer)
    }

    console.log(`Created ${volunteers.length} Australian volunteers`)

    // Create compliance documents with various states
    const states = ['VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT']
    const wwccNumbers = {
      VIC: '12345678A',
      NSW: 'WWC1234567E',
      QLD: '12345/1',
      WA: '123456',
      SA: '1234567',
      TAS: '12345678',
      NT: '1234567',
      ACT: '12345678'
    }

    // Mix of verified, pending, and expiring compliance docs
    const complianceStatuses = ['verified', 'pending', 'expiring']

    for (let i = 0; i < 15; i++) {
      const volunteer = volunteers[i]
      const state = states[i % states.length]
      const status = complianceStatuses[i % 3]

      // Calculate expiry date based on status
      let expiresAt: DateTime
      if (status === 'expiring') {
        // Expires in 15 days (trigger expiring soon alert)
        expiresAt = DateTime.now().plus({ days: 15 })
      } else if (status === 'verified') {
        // Expires in 6 months
        expiresAt = DateTime.now().plus({ months: 6 })
      } else {
        // Pending - expires in 1 year
        expiresAt = DateTime.now().plus({ years: 1 })
      }

      await ComplianceDocument.create({
        userId: volunteer.id,
        docType: 'wwcc',
        status: status,
        issuedAt: DateTime.now().minus({ months: 3 }),
        expiresAt: expiresAt,
        metadata: {
          wwcc: {
            number: wwccNumbers[state],
            state: state,
            formatted: wwccNumbers[state]
          },
          state: state
        }
      })

      // Add police check for some volunteers
      if (i % 3 === 0) {
        await ComplianceDocument.create({
          userId: volunteer.id,
          docType: 'police_check',
          status: 'verified',
          issuedAt: DateTime.now().minus({ months: 1 }),
          expiresAt: DateTime.now().plus({ years: 3 }),
          metadata: {
            checkType: 'National Police Check',
            state: state
          }
        })
      }
    }

    console.log(`Created compliance documents for ${15} volunteers`)

    // Create opportunities with Australian locations
    const opportunityTitles = [
      'Community Garden Maintenance',
      'Food Bank Assistant',
      'Elderly Care Companion',
      'Beach Clean-Up Volunteer',
      'Wildlife Rescue Support',
      'Youth Mentoring Program',
      'Emergency Relief Distribution',
      'Community Events Coordinator'
    ]

    for (let i = 0; i < opportunityTitles.length; i++) {
      const org = organizations[i % organizations.length]
      const cityKey = cityNames[i % cityNames.length]
      const cityData = cities[cityKey]

      await Opportunity.create({
        organizationId: org.id,
        title: opportunityTitles[i],
        description: `Join us for ${opportunityTitles[i].toLowerCase()} in ${cityData.name}. Make a difference in your local community!`,
        location: cityData.name,
        latitude: cityData.lat,
        longitude: cityData.lon,
        startDate: DateTime.now().plus({ days: 7 }),
        endDate: DateTime.now().plus({ days: 37 }),
        status: 'published',
        category: 'Community Service',
        requiredVolunteers: 5 + Math.floor(Math.random() * 10),
        metadata: {
          requiresWWCC: i % 2 === 0,
          requiresPoliceCheck: i % 3 === 0,
          geofenceRadius: 200, // 200m for Australian workplace safety
          city: cityData.name
        }
      })
    }

    console.log(`Created ${opportunityTitles.length} opportunities with Australian locations`)

    console.log('✅ Australian seeder completed successfully!')
    console.log('---')
    console.log('Test Credentials:')
    console.log('Email: matilda.smith0@example.com.au')
    console.log('Password: password123')
    console.log('---')
    console.log('Organizations created in: Sydney, Melbourne, Brisbane')
    console.log('Volunteers with Australian mobile numbers (04XX XXX XXX)')
    console.log('WWCC compliance docs across all AU states')
    console.log('15 compliance documents with mixed statuses (verified/pending/expiring)')
  }
}
