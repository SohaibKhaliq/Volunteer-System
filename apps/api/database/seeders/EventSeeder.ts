import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

type SeedEvent = {
  title: string
  description: string
  location: string
  city: string
  state: string
  capacity: number
  daysFromNow: number
  durationHours: number
}

export default class EventSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 50

    const baseEvents: SeedEvent[] = [
      {
        title: 'Community BBQ Fundraiser',
        description: 'Join us for a sausage sizzle to raise funds for local families in need',
        location: 'Victoria Park',
        city: 'Sydney',
        state: 'NSW',
        capacity: 100,
        daysFromNow: 5,
        durationHours: 4
      },
      {
        title: 'Charity Run for Kids',
        description: '5km fun run to raise money for childrens hospital',
        location: 'Albert Park Lake',
        city: 'Melbourne',
        state: 'VIC',
        capacity: 200,
        daysFromNow: 14,
        durationHours: 3
      },
      {
        title: 'Environmental Awareness Day',
        description: 'Educational workshops and activities about environmental protection',
        location: 'South Bank Parklands',
        city: 'Brisbane',
        state: 'QLD',
        capacity: 150,
        daysFromNow: 21,
        durationHours: 6
      },
      {
        title: 'Volunteer Recognition Evening',
        description: 'Celebrating our volunteers with dinner and awards',
        location: 'Swan River Function Centre',
        city: 'Perth',
        state: 'WA',
        capacity: 80,
        daysFromNow: 28,
        durationHours: 4
      },
      {
        title: 'Food Drive Collection Day',
        description: 'Help collect and sort food donations for local food banks',
        location: 'Adelaide Showground',
        city: 'Adelaide',
        state: 'SA',
        capacity: 50,
        daysFromNow: 7,
        durationHours: 6
      },
      {
        title: 'Winter Clothing Appeal',
        description: 'Collecting warm clothing for people experiencing homelessness',
        location: 'Hobart Town Hall',
        city: 'Hobart',
        state: 'TAS',
        capacity: 40,
        daysFromNow: 10,
        durationHours: 5
      },
      {
        title: 'Mental Health Awareness Walk',
        description: 'Walk together to raise awareness about mental health',
        location: 'Lake Burley Griffin',
        city: 'Canberra',
        state: 'ACT',
        capacity: 120,
        daysFromNow: 15,
        durationHours: 2
      },
      {
        title: 'Indigenous Culture Festival',
        description: 'Celebrate Indigenous culture with performances, art and food',
        location: 'Mindil Beach',
        city: 'Darwin',
        state: 'NT',
        capacity: 250,
        daysFromNow: 35,
        durationHours: 8
      },
      {
        title: 'Book Fair and Swap',
        description: 'Bring books to swap and support literacy programs',
        location: 'Broadbeach Community Centre',
        city: 'Surfers Paradise',
        state: 'QLD',
        capacity: 60,
        daysFromNow: 12,
        durationHours: 4
      },
      {
        title: 'Pet Adoption Day',
        description: 'Meet rescue animals looking for forever homes',
        location: 'Newcastle Showground',
        city: 'Newcastle',
        state: 'NSW',
        capacity: 100,
        daysFromNow: 18,
        durationHours: 5
      },
      {
        title: 'Senior Citizens Christmas Lunch',
        description: 'Festive lunch and entertainment for elderly residents',
        location: 'Geelong RSL',
        city: 'Geelong',
        state: 'VIC',
        capacity: 80,
        daysFromNow: 60,
        durationHours: 3
      },
      {
        title: 'Ocean Discovery Workshop',
        description: 'Learn about marine biology and conservation',
        location: 'Wollongong Science Centre',
        city: 'Wollongong',
        state: 'NSW',
        capacity: 40,
        daysFromNow: 22,
        durationHours: 4
      },
      {
        title: 'Reef Restoration Symposium',
        description: 'Conference on coral reef restoration techniques',
        location: 'Cairns Convention Centre',
        city: 'Cairns',
        state: 'QLD',
        capacity: 150,
        daysFromNow: 45,
        durationHours: 7
      },
      {
        title: 'Historic Building Open Day',
        description: 'Tour historic buildings and learn about heritage conservation',
        location: 'Bendigo Town Hall',
        city: 'Bendigo',
        state: 'VIC',
        capacity: 70,
        daysFromNow: 16,
        durationHours: 5
      },
      {
        title: 'Community Cooking Competition',
        description: 'Friendly cooking competition with proceeds to charity',
        location: 'Fremantle Markets',
        city: 'Fremantle',
        state: 'WA',
        capacity: 50,
        daysFromNow: 20,
        durationHours: 4
      },
      {
        title: 'Animal Welfare Fundraiser Gala',
        description: 'Elegant dinner to raise funds for animal rescue',
        location: 'Launceston Country Club',
        city: 'Launceston',
        state: 'TAS',
        capacity: 100,
        daysFromNow: 42,
        durationHours: 5
      },
      {
        title: 'Sustainable Living Expo',
        description: 'Learn about sustainable practices and green technologies',
        location: 'Toowoomba Showgrounds',
        city: 'Toowoomba',
        state: 'QLD',
        capacity: 200,
        daysFromNow: 30,
        durationHours: 6
      },
      {
        title: 'Disability Awareness Day',
        description: 'Educational sessions about disability inclusion',
        location: 'Ballarat Town Hall',
        city: 'Ballarat',
        state: 'VIC',
        capacity: 80,
        daysFromNow: 25,
        durationHours: 5
      },
      {
        title: 'Youth Leadership Summit',
        description: 'Empowering young people to become community leaders',
        location: 'Alice Springs Convention Centre',
        city: 'Alice Springs',
        state: 'NT',
        capacity: 60,
        daysFromNow: 40,
        durationHours: 8
      },
      {
        title: 'Multicultural Food Festival',
        description: 'Celebrate diversity through food from around the world',
        location: 'Parramatta Park',
        city: 'Parramatta',
        state: 'NSW',
        capacity: 300,
        daysFromNow: 28,
        durationHours: 6
      },
      {
        title: 'Beach Safety Workshop',
        description: 'Learn surf lifesaving skills and water safety',
        location: 'Glenelg Beach',
        city: 'Glenelg',
        state: 'SA',
        capacity: 50,
        daysFromNow: 11,
        durationHours: 3
      },
      {
        title: 'Youth Sports Carnival',
        description: 'Multi-sport event for disadvantaged youth',
        location: 'Richmond Oval',
        city: 'Richmond',
        state: 'VIC',
        capacity: 120,
        daysFromNow: 19,
        durationHours: 6
      },
      {
        title: 'Emergency Preparedness Workshop',
        description: 'Learn how to prepare for natural disasters',
        location: 'Bunbury Community Hall',
        city: 'Bunbury',
        state: 'WA',
        capacity: 60,
        daysFromNow: 17,
        durationHours: 3
      },
      {
        title: 'Marine Conservation Symposium',
        description: 'Expert talks on protecting marine ecosystems',
        location: 'Coffs Harbour University',
        city: 'Coffs Harbour',
        state: 'NSW',
        capacity: 100,
        daysFromNow: 33,
        durationHours: 6
      },
      {
        title: 'Family Support Network Launch',
        description: 'Launch event for new family counselling service',
        location: 'Ipswich Civic Centre',
        city: 'Ipswich',
        state: 'QLD',
        capacity: 70,
        daysFromNow: 24,
        durationHours: 3
      },
      {
        title: 'Community Art Exhibition',
        description: 'Showcase local artists and raise funds for art programs',
        location: 'St Kilda Gallery',
        city: 'St Kilda',
        state: 'VIC',
        capacity: 90,
        daysFromNow: 27,
        durationHours: 4
      },
      {
        title: 'Refugee Welcome BBQ',
        description: 'Community gathering to welcome new refugees',
        location: 'Albury Botanic Gardens',
        city: 'Albury',
        state: 'NSW',
        capacity: 80,
        daysFromNow: 13,
        durationHours: 4
      },
      {
        title: 'Education Scholarship Awards',
        description: 'Awards ceremony for scholarship recipients',
        location: 'Geraldton Town Hall',
        city: 'Geraldton',
        state: 'WA',
        capacity: 50,
        daysFromNow: 50,
        durationHours: 3
      },
      {
        title: 'Legal Aid Open Day',
        description: 'Free legal advice and information sessions',
        location: 'Carlton Community Centre',
        city: 'Carlton',
        state: 'VIC',
        capacity: 60,
        daysFromNow: 9,
        durationHours: 5
      },
      {
        title: 'Youth Employment Expo',
        description: 'Connect young people with job opportunities',
        location: 'Strathpine Shopping Centre',
        city: 'Strathpine',
        state: 'QLD',
        capacity: 150,
        daysFromNow: 23,
        durationHours: 6
      },
      {
        title: 'Community Health Fair',
        description: 'Free health screenings and wellness information',
        location: 'Brighton Town Hall',
        city: 'Brighton',
        state: 'VIC',
        capacity: 120,
        daysFromNow: 26,
        durationHours: 5
      },
      {
        title: 'Indigenous Art Workshop',
        description: 'Learn traditional Indigenous art techniques',
        location: 'Northbridge Cultural Centre',
        city: 'Northbridge',
        state: 'WA',
        capacity: 30,
        daysFromNow: 18,
        durationHours: 4
      },
      {
        title: 'Gold Mining History Tour',
        description: 'Guided tour of historic gold mining sites',
        location: 'Super Pit Lookout',
        city: 'Kalgoorlie',
        state: 'WA',
        capacity: 40,
        daysFromNow: 15,
        durationHours: 3
      },
      {
        title: 'Maritime Heritage Festival',
        description: 'Celebrate local maritime history and culture',
        location: 'Warrnambool Foreshore',
        city: 'Warrnambool',
        state: 'VIC',
        capacity: 200,
        daysFromNow: 38,
        durationHours: 6
      },
      {
        title: 'Artist Studio Open House',
        description: 'Meet local artists and view their work',
        location: 'Southbank Arts Precinct',
        city: 'Southbank',
        state: 'VIC',
        capacity: 100,
        daysFromNow: 21,
        durationHours: 5
      },
      {
        title: 'Sustainability Summit',
        description: 'Conference on environmental sustainability practices',
        location: 'Braddon Conference Centre',
        city: 'Braddon',
        state: 'ACT',
        capacity: 150,
        daysFromNow: 44,
        durationHours: 7
      },
      {
        title: 'Learn to Surf Day',
        description: 'Free surfing lessons for beginners',
        location: 'Manly Beach',
        city: 'Manly',
        state: 'NSW',
        capacity: 60,
        daysFromNow: 8,
        durationHours: 4
      },
      {
        title: 'Startup Business Pitch Night',
        description: 'Entrepreneurs pitch ideas to business mentors',
        location: 'Chatswood Innovation Hub',
        city: 'Chatswood',
        state: 'NSW',
        capacity: 80,
        daysFromNow: 29,
        durationHours: 3
      },
      {
        title: 'Veterans Anzac Day Service',
        description: 'Anzac Day commemoration service',
        location: 'Cronulla War Memorial',
        city: 'Cronulla',
        state: 'NSW',
        capacity: 150,
        daysFromNow: 120,
        durationHours: 2
      },
      {
        title: 'Childrens Theatre Festival',
        description: 'Week of theatre performances for children',
        location: 'Gosford Entertainment Centre',
        city: 'Gosford',
        state: 'NSW',
        capacity: 200,
        daysFromNow: 36,
        durationHours: 6
      },
      {
        title: 'Bushland Restoration Day',
        description: 'Community working bee to restore native bushland',
        location: 'Kingston Nature Reserve',
        city: 'Kingston',
        state: 'TAS',
        capacity: 40,
        daysFromNow: 12,
        durationHours: 5
      },
      {
        title: 'Under 16s Football Tournament',
        description: 'Youth football competition',
        location: 'Palmerston Recreation Centre',
        city: 'Palmerston',
        state: 'NT',
        capacity: 100,
        daysFromNow: 31,
        durationHours: 8
      },
      {
        title: 'Money Management Seminar',
        description: 'Learn budgeting and financial planning skills',
        location: 'South Brisbane Library',
        city: 'South Brisbane',
        state: 'QLD',
        capacity: 50,
        daysFromNow: 14,
        durationHours: 3
      },
      {
        title: 'Community Concert for Charity',
        description: 'Live music performances with proceeds to local charity',
        location: 'Mount Lawley Town Hall',
        city: 'Mount Lawley',
        state: 'WA',
        capacity: 120,
        daysFromNow: 32,
        durationHours: 4
      },
      {
        title: 'Regional Farmers Market',
        description: 'Monthly farmers market supporting local producers',
        location: 'Wagga Wagga Marketplace',
        city: 'Wagga Wagga',
        state: 'NSW',
        capacity: 200,
        daysFromNow: 6,
        durationHours: 5
      },
      {
        title: 'Cultural Integration Fair',
        description: 'Help migrants connect with community services',
        location: 'Parramatta Park Cultural Hall',
        city: 'Parramatta Park',
        state: 'QLD',
        capacity: 90,
        daysFromNow: 20,
        durationHours: 5
      },
      {
        title: 'Housing Crisis Forum',
        description: 'Community forum on affordable housing solutions',
        location: 'Adelaide Convention Centre',
        city: 'Adelaide',
        state: 'SA',
        capacity: 100,
        daysFromNow: 37,
        durationHours: 4
      },
      {
        title: 'Seniors Digital Skills Day',
        description: 'Help seniors learn smartphones and computers',
        location: 'Melbourne Library',
        city: 'Melbourne',
        state: 'VIC',
        capacity: 40,
        daysFromNow: 11,
        durationHours: 4
      },
      {
        title: 'City Centre Volunteer Fair',
        description: 'Connect volunteers with community organizations',
        location: 'Rundle Mall',
        city: 'Adelaide',
        state: 'SA',
        capacity: 150,
        daysFromNow: 16,
        durationHours: 6
      },
      {
        title: 'Homelessness Awareness Vigil',
        description: 'Candlelight vigil to raise awareness about homelessness',
        location: 'Federation Square',
        city: 'Melbourne',
        state: 'VIC',
        capacity: 200,
        daysFromNow: 25,
        durationHours: 2
      }
    ]

    const now = new Date()
    const timestamp = now.toISOString()

    const orgResult = await Database.rawQuery('SELECT id FROM organizations ORDER BY id ASC LIMIT 50')
    const organizationIds = orgResult[0].map((row: any) => row.id)

    if (organizationIds.length === 0) {
      console.log('EventSeeder: no organizations found, skipping')
      return
    }

    const rows = baseEvents.slice(0, RECORD_COUNT).map((event, index) => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + event.daysFromNow)
      const endDate = new Date(startDate)
      endDate.setHours(endDate.getHours() + event.durationHours)

      return {
        organization_id: organizationIds[index % organizationIds.length],
        title: event.title,
        description: event.description,
        location: `${event.location}, ${event.city}, ${event.state}`,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        capacity: event.capacity,
        is_published: true,
        created_at: timestamp,
        updated_at: timestamp
      }
    })

    if (!rows.length) {
      console.log('EventSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO events (organization_id,title,description,location,start_at,end_at,capacity,is_published,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),location=VALUES(location),start_at=VALUES(start_at),end_at=VALUES(end_at),capacity=VALUES(capacity),is_published=VALUES(is_published),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.organization_id,
      row.title,
      row.description,
      row.location,
      row.start_at,
      row.end_at,
      row.capacity,
      row.is_published,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`EventSeeder: upserted ${rows.length} events`)
    } catch (error) {
      await trx.rollback()
      console.error('EventSeeder failed', error)
      throw error
    }
  }
}
