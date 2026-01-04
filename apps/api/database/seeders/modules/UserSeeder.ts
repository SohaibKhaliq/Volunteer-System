import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'
import Hash from '@ioc:Adonis/Core/Hash'

type SeedUser = {
  firstName: string
  lastName: string
  phone: string
  street: string
  suburb: string
  state: string
  postcode: string
}

export default class UserSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 50
    console.log('UserSeeder: starting...')
    const baseUsers: SeedUser[] = [
      {
        firstName: 'Amelia',
        lastName: 'Nguyen',
        phone: '+61 412 345 670',
        street: '12 Pitt Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000'
      },
      {
        firstName: 'Oliver',
        lastName: 'Singh',
        phone: '+61 412 345 671',
        street: '88 Bourke Street',
        suburb: 'Melbourne',
        state: 'VIC',
        postcode: '3000'
      },
      {
        firstName: 'Charlotte',
        lastName: 'Brown',
        phone: '+61 412 345 672',
        street: '25 Adelaide Street',
        suburb: 'Brisbane',
        state: 'QLD',
        postcode: '4000'
      },
      {
        firstName: 'Jack',
        lastName: 'Wilson',
        phone: '+61 412 345 673',
        street: '9 St Georges Terrace',
        suburb: 'Perth',
        state: 'WA',
        postcode: '6000'
      },
      {
        firstName: 'Isla',
        lastName: 'Thompson',
        phone: '+61 412 345 674',
        street: '102 King William Street',
        suburb: 'Adelaide',
        state: 'SA',
        postcode: '5000'
      },
      {
        firstName: 'Noah',
        lastName: 'Harris',
        phone: '+61 412 345 675',
        street: '14 Davey Street',
        suburb: 'Hobart',
        state: 'TAS',
        postcode: '7000'
      },
      {
        firstName: 'Ava',
        lastName: 'Robinson',
        phone: '+61 412 345 676',
        street: '18 London Circuit',
        suburb: 'Canberra',
        state: 'ACT',
        postcode: '2601'
      },
      {
        firstName: 'Leo',
        lastName: 'Martin',
        phone: '+61 412 345 677',
        street: '3 Mitchell Street',
        suburb: 'Darwin',
        state: 'NT',
        postcode: '0800'
      },
      {
        firstName: 'Mia',
        lastName: 'Clark',
        phone: '+61 412 345 678',
        street: '45 George Street',
        suburb: 'Parramatta',
        state: 'NSW',
        postcode: '2150'
      },
      {
        firstName: 'Lucas',
        lastName: 'White',
        phone: '+61 412 345 679',
        street: '77 Swan Street',
        suburb: 'Richmond',
        state: 'VIC',
        postcode: '3121'
      },
      {
        firstName: 'Evelyn',
        lastName: 'Hall',
        phone: '+61 412 345 680',
        street: '6 Grey Street',
        suburb: 'St Kilda',
        state: 'VIC',
        postcode: '3182'
      },
      {
        firstName: 'Henry',
        lastName: 'Allen',
        phone: '+61 412 345 681',
        street: '21 Anne Street',
        suburb: 'South Brisbane',
        state: 'QLD',
        postcode: '4101'
      },
      {
        firstName: 'Sophia',
        lastName: 'Young',
        phone: '+61 412 345 682',
        street: '5 The Esplanade',
        suburb: 'Surfers Paradise',
        state: 'QLD',
        postcode: '4217'
      },
      {
        firstName: 'William',
        lastName: 'King',
        phone: '+61 412 345 683',
        street: '2 Marine Terrace',
        suburb: 'Fremantle',
        state: 'WA',
        postcode: '6160'
      },
      {
        firstName: 'Chloe',
        lastName: 'Wright',
        phone: '+61 412 345 684',
        street: '19 Morphett Street',
        suburb: 'Glenelg',
        state: 'SA',
        postcode: '5045'
      },
      {
        firstName: 'Mason',
        lastName: 'Scott',
        phone: '+61 412 345 685',
        street: '34 Cameron Street',
        suburb: 'Launceston',
        state: 'TAS',
        postcode: '7250'
      },
      {
        firstName: 'Harper',
        lastName: 'Green',
        phone: '+61 412 345 686',
        street: '55 Pacific Highway',
        suburb: 'Coffs Harbour',
        state: 'NSW',
        postcode: '2450'
      },
      {
        firstName: 'Elijah',
        lastName: 'Baker',
        phone: '+61 412 345 687',
        street: '8 James Street',
        suburb: 'Northbridge',
        state: 'WA',
        postcode: '6003'
      },
      {
        firstName: 'Emily',
        lastName: 'Adams',
        phone: '+61 412 345 688',
        street: '62 Rundle Mall',
        suburb: 'Adelaide',
        state: 'SA',
        postcode: '5000'
      },
      {
        firstName: 'Ethan',
        lastName: 'Parker',
        phone: '+61 412 345 689',
        street: '70 Margaret Street',
        suburb: 'Toowoomba',
        state: 'QLD',
        postcode: '4350'
      },
      {
        firstName: 'Grace',
        lastName: 'Campbell',
        phone: '+61 412 345 690',
        street: '22 The Esplanade',
        suburb: 'Cairns',
        state: 'QLD',
        postcode: '4870'
      },
      {
        firstName: 'Samuel',
        lastName: 'Turner',
        phone: '+61 412 345 691',
        street: '14 Victoria Street',
        suburb: 'Geelong',
        state: 'VIC',
        postcode: '3220'
      },
      {
        firstName: 'Lily',
        lastName: 'Evans',
        phone: '+61 412 345 692',
        street: '26 Harbour Street',
        suburb: 'Wollongong',
        state: 'NSW',
        postcode: '2500'
      },
      {
        firstName: 'Benjamin',
        lastName: 'Cooper',
        phone: '+61 412 345 693',
        street: '15 Ruthven Street',
        suburb: 'Ipswich',
        state: 'QLD',
        postcode: '4305'
      },
      {
        firstName: 'Zoe',
        lastName: 'Collins',
        phone: '+61 412 345 694',
        street: '48 Dean Street',
        suburb: 'Albury',
        state: 'NSW',
        postcode: '2640'
      },
      {
        firstName: 'Daniel',
        lastName: 'Stewart',
        phone: '+61 412 345 695',
        street: '5 Macquarie Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000'
      },
      {
        firstName: 'Aria',
        lastName: 'Murphy',
        phone: '+61 412 345 696',
        street: '39 High Street',
        suburb: 'Bendigo',
        state: 'VIC',
        postcode: '3550'
      },
      {
        firstName: 'Logan',
        lastName: 'Richardson',
        phone: '+61 412 345 697',
        street: '101 Stuart Highway',
        suburb: 'Alice Springs',
        state: 'NT',
        postcode: '0870'
      },
      {
        firstName: 'Layla',
        lastName: 'Patel',
        phone: '+61 412 345 698',
        street: '28 Yarrawonga Road',
        suburb: 'Palmerston',
        state: 'NT',
        postcode: '0830'
      },
      {
        firstName: 'Jacob',
        lastName: 'Hughes',
        phone: '+61 412 345 699',
        street: '27 Barrack Street',
        suburb: 'Hobart',
        state: 'TAS',
        postcode: '7000'
      },
      {
        firstName: 'Scarlett',
        lastName: 'Ward',
        phone: '+61 412 345 700',
        street: '16 Flinders Street',
        suburb: 'Melbourne',
        state: 'VIC',
        postcode: '3000'
      },
      {
        firstName: 'Luca',
        lastName: 'Foster',
        phone: '+61 412 345 701',
        street: '85 Marine Terrace',
        suburb: 'Geraldton',
        state: 'WA',
        postcode: '6530'
      },
      {
        firstName: 'Hannah',
        lastName: 'Barnes',
        phone: '+61 412 345 702',
        street: '9 Sheridan Street',
        suburb: 'Cairns',
        state: 'QLD',
        postcode: '4870'
      },
      {
        firstName: 'Owen',
        lastName: 'Price',
        phone: '+61 412 345 703',
        street: '41 Victoria Street',
        suburb: 'Carlton',
        state: 'VIC',
        postcode: '3053'
      },
      {
        firstName: 'Ella',
        lastName: 'Powell',
        phone: '+61 412 345 704',
        street: '73 Gympie Road',
        suburb: 'Strathpine',
        state: 'QLD',
        postcode: '4500'
      },
      {
        firstName: 'Isaac',
        lastName: 'Bell',
        phone: '+61 412 345 705',
        street: '30 Bay Street',
        suburb: 'Brighton',
        state: 'VIC',
        postcode: '3186'
      },
      {
        firstName: 'Madison',
        lastName: 'Russell',
        phone: '+61 412 345 706',
        street: '60 Jetty Road',
        suburb: 'Glenelg',
        state: 'SA',
        postcode: '5045'
      },
      {
        firstName: 'Ryan',
        lastName: 'Diaz',
        phone: '+61 412 345 707',
        street: '11 Walcott Street',
        suburb: 'Mount Lawley',
        state: 'WA',
        postcode: '6050'
      },
      {
        firstName: 'Sofia',
        lastName: 'Torres',
        phone: '+61 412 345 708',
        street: '22 Mulgrave Road',
        suburb: 'Parramatta Park',
        state: 'QLD',
        postcode: '4870'
      },
      {
        firstName: 'Adam',
        lastName: 'Grant',
        phone: '+61 412 345 709',
        street: '5 King Street',
        suburb: 'Newcastle',
        state: 'NSW',
        postcode: '2300'
      },
      {
        firstName: 'Nora',
        lastName: 'Jenkins',
        phone: '+61 412 345 710',
        street: '81 Victoria Street',
        suburb: 'Ballarat',
        state: 'VIC',
        postcode: '3350'
      },
      {
        firstName: 'Levi',
        lastName: 'Kim',
        phone: '+61 412 345 711',
        street: '144 Ryrie Street',
        suburb: 'Geelong',
        state: 'VIC',
        postcode: '3220'
      },
      {
        firstName: 'Hazel',
        lastName: 'Morris',
        phone: '+61 412 345 712',
        street: '18 Baylis Street',
        suburb: 'Wagga Wagga',
        state: 'NSW',
        postcode: '2650'
      },
      {
        firstName: 'Carter',
        lastName: 'Long',
        phone: '+61 412 345 713',
        street: '90 Spencer Street',
        suburb: 'Melbourne',
        state: 'VIC',
        postcode: '3000'
      },
      {
        firstName: 'Audrey',
        lastName: 'Simmons',
        phone: '+61 412 345 714',
        street: '50 North Terrace',
        suburb: 'Adelaide',
        state: 'SA',
        postcode: '5000'
      },
      {
        firstName: 'Dylan',
        lastName: 'Reid',
        phone: '+61 412 345 715',
        street: '120 Bussell Highway',
        suburb: 'Bunbury',
        state: 'WA',
        postcode: '6230'
      },
      {
        firstName: 'Stella',
        lastName: 'Watson',
        phone: '+61 412 345 716',
        street: '7 Hannan Street',
        suburb: 'Kalgoorlie',
        state: 'WA',
        postcode: '6430'
      },
      {
        firstName: 'Miles',
        lastName: 'Brooks',
        phone: '+61 412 345 717',
        street: '4 Raglan Parade',
        suburb: 'Warrnambool',
        state: 'VIC',
        postcode: '3280'
      },
      {
        firstName: 'Peyton',
        lastName: 'Chavez',
        phone: '+61 412 345 718',
        street: '64 City Road',
        suburb: 'Southbank',
        state: 'VIC',
        postcode: '3006'
      },
      {
        firstName: 'Aaron',
        lastName: 'West',
        phone: '+61 412 345 719',
        street: '13 Limestone Avenue',
        suburb: 'Braddon',
        state: 'ACT',
        postcode: '2612'
      },
      {
        firstName: 'Vivian',
        lastName: 'Stone',
        phone: '+61 412 345 720',
        street: '8 Beach Road',
        suburb: 'Manly',
        state: 'NSW',
        postcode: '2095'
      },
      {
        firstName: 'Marcus',
        lastName: 'Lowe',
        phone: '+61 412 345 721',
        street: '23 Victoria Avenue',
        suburb: 'Chatswood',
        state: 'NSW',
        postcode: '2067'
      },
      {
        firstName: 'Julia',
        lastName: 'Ford',
        phone: '+61 412 345 722',
        street: '27 Gerrale Street',
        suburb: 'Cronulla',
        state: 'NSW',
        postcode: '2230'
      },
      {
        firstName: 'Natalie',
        lastName: 'Page',
        phone: '+61 412 345 723',
        street: '12 Mann Street',
        suburb: 'Gosford',
        state: 'NSW',
        postcode: '2250'
      },
      {
        firstName: 'Andre',
        lastName: 'Costa',
        phone: '+61 412 345 724',
        street: '10 Channel Highway',
        suburb: 'Kingston',
        state: 'TAS',
        postcode: '7050'
      }
    ]

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')
    const passwordHash = await Hash.make('12345678')

    const rows = baseUsers.slice(0, RECORD_COUNT).map((user, index) => {
      const emailLocal = `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}${index + 1}`
      return {
        email: `${emailLocal}@volunteers.au.org`,
        password: passwordHash,
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phone,
        volunteer_status: 'active',
        profile_metadata: JSON.stringify({
          street: user.street,
          suburb: user.suburb,
          state: user.state,
          postcode: user.postcode,
          country: 'Australia'
        }),
        created_at: timestamp,
        updated_at: timestamp,
        role_status: 'active',
        is_admin: false,
        is_disabled: false,
        email_verified_at: timestamp,
        last_active_at: timestamp
      }
    })

    if (!rows.length) {
      console.log('UserSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO users (email,password,first_name,last_name,phone,volunteer_status,profile_metadata,created_at,updated_at,role_status,is_admin,is_disabled,email_verified_at,last_active_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE first_name=VALUES(first_name),last_name=VALUES(last_name),phone=VALUES(phone),volunteer_status=VALUES(volunteer_status),profile_metadata=VALUES(profile_metadata),role_status=VALUES(role_status),is_admin=VALUES(is_admin),is_disabled=VALUES(is_disabled),updated_at=VALUES(updated_at),last_active_at=VALUES(last_active_at),email_verified_at=VALUES(email_verified_at)'

    const bindings = rows.flatMap((row) => [
      row.email,
      row.password,
      row.first_name,
      row.last_name,
      row.phone,
      row.volunteer_status,
      row.profile_metadata,
      row.created_at,
      row.updated_at,
      row.role_status,
      row.is_admin,
      row.is_disabled,
      row.email_verified_at,
      row.last_active_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`UserSeeder: upserted ${rows.length} users`)
    } catch (error) {
      await trx.rollback()
      console.error('UserSeeder failed', error)
      throw error
    }
  }
}
