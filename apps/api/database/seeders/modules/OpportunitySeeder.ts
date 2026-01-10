import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

type SeedOpportunity = {
  title: string
  description: string
  location: string
  city: string
  state: string
  type: string
  capacity: number
  daysFromNow: number
  durationHours: number
}

export default class OpportunitySeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 150 // Increased from 50

    const baseOpportunities: SeedOpportunity[] = [
      {
        title: 'Beach Cleanup - Bondi Beach',
        description:
          'Join us for a community beach cleanup to protect our marine life and keep our beaches pristine',
        location: 'Bondi Beach',
        city: 'Sydney',
        state: 'NSW',
        type: 'event',
        capacity: 30,
        daysFromNow: 7,
        durationHours: 3
      },
      {
        title: 'Food Bank Sorting',
        description: 'Help sort and pack food donations for families in need',
        location: 'Melbourne Community Centre',
        city: 'Melbourne',
        state: 'VIC',
        type: 'shift',
        capacity: 15,
        daysFromNow: 3,
        durationHours: 4
      },
      {
        title: 'Youth Mentoring Program',
        description: 'Become a mentor to support young people in achieving their goals',
        location: 'Brisbane Youth Hub',
        city: 'Brisbane',
        state: 'QLD',
        type: 'recurring',
        capacity: 20,
        daysFromNow: 14,
        durationHours: 2
      },
      {
        title: 'Wildlife Rescue Training',
        description: 'Learn how to safely rescue and care for injured native wildlife',
        location: 'Perth Wildlife Centre',
        city: 'Perth',
        state: 'WA',
        type: 'event',
        capacity: 25,
        daysFromNow: 10,
        durationHours: 6
      },
      {
        title: 'Meals on Wheels Delivery',
        description: 'Deliver nutritious meals to elderly residents in their homes',
        location: 'Adelaide Community Kitchen',
        city: 'Adelaide',
        state: 'SA',
        type: 'shift',
        capacity: 12,
        daysFromNow: 2,
        durationHours: 3
      },
      {
        title: 'Art Workshop for Seniors',
        description: 'Facilitate creative art sessions for elderly community members',
        location: 'Hobart Community Centre',
        city: 'Hobart',
        state: 'TAS',
        type: 'event',
        capacity: 8,
        daysFromNow: 5,
        durationHours: 2
      },
      {
        title: 'Mental Health First Aid Training',
        description: 'Get certified in mental health first aid to support your community',
        location: 'Canberra Training Centre',
        city: 'Canberra',
        state: 'ACT',
        type: 'event',
        capacity: 30,
        daysFromNow: 21,
        durationHours: 8
      },
      {
        title: 'Indigenous Cultural Workshop',
        description: 'Participate in a cultural learning experience with Indigenous elders',
        location: 'Darwin Cultural Centre',
        city: 'Darwin',
        state: 'NT',
        type: 'event',
        capacity: 40,
        daysFromNow: 30,
        durationHours: 4
      },
      {
        title: 'Coastal Revegetation Project',
        description: 'Plant native species to restore coastal dunes and prevent erosion',
        location: 'Gold Coast Foreshore',
        city: 'Surfers Paradise',
        state: 'QLD',
        type: 'event',
        capacity: 50,
        daysFromNow: 12,
        durationHours: 4
      },
      {
        title: 'Adult Literacy Tutoring',
        description: 'Tutor adults in reading and writing skills',
        location: 'Newcastle Library',
        city: 'Newcastle',
        state: 'NSW',
        type: 'recurring',
        capacity: 10,
        daysFromNow: 6,
        durationHours: 2
      },
      {
        title: 'Elderly Companionship Visit',
        description: 'Spend quality time with isolated seniors in aged care',
        location: 'Geelong Aged Care Facility',
        city: 'Geelong',
        state: 'VIC',
        type: 'recurring',
        capacity: 20,
        daysFromNow: 4,
        durationHours: 2
      },
      {
        title: 'Ocean Cleanup Dive',
        description: 'Scuba dive to remove debris from the ocean floor',
        location: 'Wollongong Marina',
        city: 'Wollongong',
        state: 'NSW',
        type: 'event',
        capacity: 15,
        daysFromNow: 18,
        durationHours: 5
      },
      {
        title: 'Reef Monitoring Survey',
        description: 'Help scientists collect data on reef health and marine biodiversity',
        location: 'Great Barrier Reef',
        city: 'Cairns',
        state: 'QLD',
        type: 'event',
        capacity: 12,
        daysFromNow: 45,
        durationHours: 6
      },
      {
        title: 'Heritage Building Restoration',
        description: 'Assist with preserving historic buildings and sites',
        location: 'Bendigo Historic District',
        city: 'Bendigo',
        state: 'VIC',
        type: 'shift',
        capacity: 8,
        daysFromNow: 9,
        durationHours: 6
      },
      {
        title: 'Community Cooking Class',
        description: 'Teach cooking skills to low-income families',
        location: 'Fremantle Community Kitchen',
        city: 'Fremantle',
        state: 'WA',
        type: 'event',
        capacity: 6,
        daysFromNow: 8,
        durationHours: 3
      },
      {
        title: 'Animal Shelter Care',
        description: 'Help care for rescued animals awaiting adoption',
        location: 'Launceston Animal Shelter',
        city: 'Launceston',
        state: 'TAS',
        type: 'shift',
        capacity: 10,
        daysFromNow: 1,
        durationHours: 4
      },
      {
        title: 'Community Garden Planting',
        description: 'Help establish and maintain community vegetable gardens',
        location: 'Toowoomba Community Gardens',
        city: 'Toowoomba',
        state: 'QLD',
        type: 'recurring',
        capacity: 15,
        daysFromNow: 7,
        durationHours: 3
      },
      {
        title: 'Disability Support Assistant',
        description: 'Assist people with disabilities in daily activities',
        location: 'Ballarat Disability Centre',
        city: 'Ballarat',
        state: 'VIC',
        type: 'shift',
        capacity: 8,
        daysFromNow: 5,
        durationHours: 4
      },
      {
        title: 'Youth Sports Coaching',
        description: 'Coach young people in various sports activities',
        location: 'Alice Springs Youth Centre',
        city: 'Alice Springs',
        state: 'NT',
        type: 'recurring',
        capacity: 12,
        daysFromNow: 10,
        durationHours: 2
      },
      {
        title: 'Multicultural Festival Helper',
        description: 'Assist with organizing and running multicultural community events',
        location: 'Parramatta Park',
        city: 'Parramatta',
        state: 'NSW',
        type: 'event',
        capacity: 40,
        daysFromNow: 28,
        durationHours: 8
      },
      {
        title: 'Surf Lifesaving Patrol',
        description: 'Join the beach patrol to ensure swimmer safety',
        location: 'Glenelg Beach',
        city: 'Glenelg',
        state: 'SA',
        type: 'shift',
        capacity: 6,
        daysFromNow: 3,
        durationHours: 4
      },
      {
        title: 'Sports Program for Youth',
        description: 'Run sports activities for disadvantaged children',
        location: 'Richmond Sports Complex',
        city: 'Richmond',
        state: 'VIC',
        type: 'recurring',
        capacity: 15,
        daysFromNow: 6,
        durationHours: 3
      },
      {
        title: 'Emergency Relief Distribution',
        description: 'Help distribute emergency supplies to families in crisis',
        location: 'Bunbury Relief Centre',
        city: 'Bunbury',
        state: 'WA',
        type: 'shift',
        capacity: 10,
        daysFromNow: 2,
        durationHours: 4
      },
      {
        title: 'Marine Life Education',
        description: 'Educate school groups about ocean conservation',
        location: 'Coffs Harbour Aquarium',
        city: 'Coffs Harbour',
        state: 'NSW',
        type: 'event',
        capacity: 5,
        daysFromNow: 15,
        durationHours: 4
      },
      {
        title: 'Family Counselling Support',
        description: 'Provide administrative support for family counselling services',
        location: 'Ipswich Family Centre',
        city: 'Ipswich',
        state: 'QLD',
        type: 'shift',
        capacity: 4,
        daysFromNow: 8,
        durationHours: 4
      },
      {
        title: 'Community Centre Programs',
        description: 'Help run various community programs and activities',
        location: 'St Kilda Community Centre',
        city: 'St Kilda',
        state: 'VIC',
        type: 'recurring',
        capacity: 12,
        daysFromNow: 5,
        durationHours: 3
      },
      {
        title: 'Refugee Settlement Support',
        description: 'Help refugees settle into their new community',
        location: 'Albury Settlement Centre',
        city: 'Albury',
        state: 'NSW',
        type: 'recurring',
        capacity: 10,
        daysFromNow: 12,
        durationHours: 3
      },
      {
        title: 'Education Scholarship Mentor',
        description: 'Mentor scholarship recipients through their education journey',
        location: 'Geraldton Education Centre',
        city: 'Geraldton',
        state: 'WA',
        type: 'recurring',
        capacity: 8,
        daysFromNow: 20,
        durationHours: 2
      },
      {
        title: 'Legal Aid Assistant',
        description: 'Provide administrative support at legal aid clinics',
        location: 'Carlton Legal Centre',
        city: 'Carlton',
        state: 'VIC',
        type: 'shift',
        capacity: 6,
        daysFromNow: 7,
        durationHours: 4
      },
      {
        title: 'Youth Employment Workshop',
        description: 'Help young people develop job-seeking skills',
        location: 'Strathpine Youth Hub',
        city: 'Strathpine',
        state: 'QLD',
        type: 'event',
        capacity: 20,
        daysFromNow: 14,
        durationHours: 4
      },
      {
        title: 'Community Health Screening',
        description: 'Assist nurses with community health screening events',
        location: 'Brighton Health Centre',
        city: 'Brighton',
        state: 'VIC',
        type: 'event',
        capacity: 8,
        daysFromNow: 17,
        durationHours: 6
      },
      {
        title: 'Arts Workshop Facilitator',
        description: 'Lead creative workshops for emerging artists',
        location: 'Northbridge Arts Space',
        city: 'Northbridge',
        state: 'WA',
        type: 'event',
        capacity: 12,
        daysFromNow: 11,
        durationHours: 3
      },
      {
        title: 'Mining Heritage Tour Guide',
        description: 'Guide visitors through historic mining sites',
        location: 'Kalgoorlie Museum',
        city: 'Kalgoorlie',
        state: 'WA',
        type: 'shift',
        capacity: 4,
        daysFromNow: 6,
        durationHours: 4
      },
      {
        title: 'Maritime Museum Volunteer',
        description: 'Assist with maritime museum operations and exhibitions',
        location: 'Warrnambool Maritime Museum',
        city: 'Warrnambool',
        state: 'VIC',
        type: 'shift',
        capacity: 6,
        daysFromNow: 4,
        durationHours: 4
      },
      {
        title: 'Artist Studio Support',
        description: 'Help artists with studio setup and exhibition preparation',
        location: 'Southbank Studios',
        city: 'Southbank',
        state: 'VIC',
        type: 'event',
        capacity: 10,
        daysFromNow: 9,
        durationHours: 4
      },
      {
        title: 'Sustainability Workshop',
        description: 'Run workshops on sustainable living practices',
        location: 'Braddon Hub',
        city: 'Braddon',
        state: 'ACT',
        type: 'event',
        capacity: 25,
        daysFromNow: 16,
        durationHours: 3
      },
      {
        title: 'Surf Safety Instructor',
        description: 'Teach water safety and surf skills to beginners',
        location: 'Manly Beach',
        city: 'Manly',
        state: 'NSW',
        type: 'event',
        capacity: 10,
        daysFromNow: 13,
        durationHours: 4
      },
      {
        title: 'Business Mentoring Session',
        description: 'Mentor aspiring entrepreneurs in business development',
        location: 'Chatswood Business Centre',
        city: 'Chatswood',
        state: 'NSW',
        type: 'recurring',
        capacity: 15,
        daysFromNow: 8,
        durationHours: 2
      },
      {
        title: 'Veterans Support Group',
        description: 'Facilitate or support veterans support group meetings',
        location: 'Cronulla Veterans Centre',
        city: 'Cronulla',
        state: 'NSW',
        type: 'recurring',
        capacity: 12,
        daysFromNow: 7,
        durationHours: 2
      },
      {
        title: 'Childrens Theatre Production',
        description: 'Help with childrens theatre performances and workshops',
        location: 'Gosford Theatre',
        city: 'Gosford',
        state: 'NSW',
        type: 'event',
        capacity: 15,
        daysFromNow: 25,
        durationHours: 6
      },
      {
        title: 'Bushland Conservation Work',
        description: 'Remove weeds and plant native species in conservation areas',
        location: 'Kingston Reserve',
        city: 'Kingston',
        state: 'TAS',
        type: 'event',
        capacity: 20,
        daysFromNow: 11,
        durationHours: 5
      },
      {
        title: 'Youth Sports Tournament',
        description: 'Organize and referee youth sports tournaments',
        location: 'Palmerston Sports Ground',
        city: 'Palmerston',
        state: 'NT',
        type: 'event',
        capacity: 8,
        daysFromNow: 19,
        durationHours: 6
      },
      {
        title: 'Financial Literacy Workshop',
        description: 'Teach budgeting and financial management skills',
        location: 'South Brisbane Centre',
        city: 'South Brisbane',
        state: 'QLD',
        type: 'event',
        capacity: 18,
        daysFromNow: 10,
        durationHours: 3
      },
      {
        title: 'Music Lessons for Kids',
        description: 'Teach music lessons to children from low-income families',
        location: 'Mount Lawley Music School',
        city: 'Mount Lawley',
        state: 'WA',
        type: 'recurring',
        capacity: 8,
        daysFromNow: 5,
        durationHours: 2
      },
      {
        title: 'Farmers Market Helper',
        description: 'Assist with organizing and running community farmers markets',
        location: 'Wagga Wagga Showground',
        city: 'Wagga Wagga',
        state: 'NSW',
        type: 'event',
        capacity: 12,
        daysFromNow: 7,
        durationHours: 4
      },
      {
        title: 'Multicultural Integration Program',
        description: 'Support migrants with language skills and cultural integration',
        location: 'Parramatta Park Community Hall',
        city: 'Parramatta Park',
        state: 'QLD',
        type: 'recurring',
        capacity: 15,
        daysFromNow: 12,
        durationHours: 3
      },
      {
        title: 'Emergency Housing Support',
        description: 'Help families moving into emergency accommodation',
        location: 'Adelaide Housing Centre',
        city: 'Adelaide',
        state: 'SA',
        type: 'shift',
        capacity: 6,
        daysFromNow: 3,
        durationHours: 4
      },
      {
        title: 'Digital Skills Training',
        description: 'Teach computer and internet skills to seniors',
        location: 'Melbourne Tech Hub',
        city: 'Melbourne',
        state: 'VIC',
        type: 'recurring',
        capacity: 10,
        daysFromNow: 6,
        durationHours: 2
      },
      {
        title: 'Community Outreach Event',
        description: 'Connect city workers with local volunteer opportunities',
        location: 'Rundle Mall',
        city: 'Adelaide',
        state: 'SA',
        type: 'event',
        capacity: 30,
        daysFromNow: 15,
        durationHours: 4
      },
      {
        title: 'Homeless Rights Advocacy',
        description: 'Support advocacy campaigns for homeless individuals',
        location: 'Flinders Street Centre',
        city: 'Melbourne',
        state: 'VIC',
        type: 'event',
        capacity: 20,
        daysFromNow: 22,
        durationHours: 3
      }
    ]

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const orgResult = await Database.rawQuery(
      'SELECT id FROM organizations ORDER BY id ASC LIMIT 50'
    )
    const organizationIds = orgResult[0].map((row: any) => row.id)

    if (organizationIds.length === 0) {
      console.log('OpportunitySeeder: no organizations found, skipping')
      return
    }

    const rows = baseOpportunities.slice(0, RECORD_COUNT).map((opp, index) => {
      const slug = `${opp.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(index + 1).toString().padStart(3, '0')}`
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + opp.daysFromNow)
      const endDate = new Date(startDate)
      endDate.setHours(endDate.getHours() + opp.durationHours)

      return {
        organization_id: organizationIds[index % organizationIds.length],
        title: opp.title,
        slug: slug,
        description: opp.description,
        location: `${opp.location}, ${opp.city}, ${opp.state}`,
        capacity: opp.capacity,
        type: opp.type,
        start_at: startDate.toISOString().slice(0, 19).replace('T', ' '),
        end_at: endDate.toISOString().slice(0, 19).replace('T', ' '),
        status: 'published',
        visibility: 'public',
        created_at: timestamp,
        updated_at: timestamp
      }
    })

    if (!rows.length) {
      console.log('OpportunitySeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO opportunities (organization_id,title,slug,description,location,capacity,type,start_at,end_at,status,visibility,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),location=VALUES(location),capacity=VALUES(capacity),type=VALUES(type),start_at=VALUES(start_at),end_at=VALUES(end_at),status=VALUES(status),visibility=VALUES(visibility),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.organization_id,
      row.title,
      row.slug,
      row.description,
      row.location,
      row.capacity,
      row.type,
      row.start_at,
      row.end_at,
      row.status,
      row.visibility,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`OpportunitySeeder: upserted ${rows.length} opportunities`)
    } catch (error) {
      await trx.rollback()
      console.error('OpportunitySeeder failed', error)
      throw error
    }
  }
}
