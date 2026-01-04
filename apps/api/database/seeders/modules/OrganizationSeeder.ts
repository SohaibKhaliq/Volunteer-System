import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

type SeedOrganization = {
  name: string
  description: string
  contactEmail: string
  contactPhone: string
  type: string
  website: string
  address: string
  city: string
  state: string
  country: string
}

export default class OrganizationSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 50
    const baseOrganizations: SeedOrganization[] = [
      {
        name: 'Sydney Community Care',
        description: 'Providing support services to vulnerable communities across Sydney',
        contactEmail: 'contact@sydneycare.org.au',
        contactPhone: '+61 2 9234 5678',
        type: 'Non-Profit',
        website: 'https://sydneycare.org.au',
        address: '45 George Street',
        city: 'Sydney',
        state: 'NSW',
        country: 'Australia'
      },
      {
        name: 'Melbourne Youth Foundation',
        description: 'Empowering young people through education and mentorship programs',
        contactEmail: 'info@melbourneyouth.org.au',
        contactPhone: '+61 3 9876 5432',
        type: 'Charity',
        website: 'https://melbourneyouth.org.au',
        address: '88 Bourke Street',
        city: 'Melbourne',
        state: 'VIC',
        country: 'Australia'
      },
      {
        name: 'Brisbane Wildlife Rescue',
        description: 'Dedicated to the rescue and rehabilitation of native Australian wildlife',
        contactEmail: 'rescue@brisbanewildlife.org.au',
        contactPhone: '+61 7 3456 7890',
        type: 'Environmental',
        website: 'https://brisbanewildlife.org.au',
        address: '25 Adelaide Street',
        city: 'Brisbane',
        state: 'QLD',
        country: 'Australia'
      },
      {
        name: 'Perth Homeless Support',
        description: 'Providing shelter, meals, and support services to people experiencing homelessness',
        contactEmail: 'help@perthhomeless.org.au',
        contactPhone: '+61 8 9234 5678',
        type: 'Social Services',
        website: 'https://perthhomeless.org.au',
        address: '9 St Georges Terrace',
        city: 'Perth',
        state: 'WA',
        country: 'Australia'
      },
      {
        name: 'Adelaide Food Bank',
        description: 'Fighting hunger by providing food assistance to families in need',
        contactEmail: 'donate@adelaidefoodbank.org.au',
        contactPhone: '+61 8 8234 5678',
        type: 'Food Relief',
        website: 'https://adelaidefoodbank.org.au',
        address: '102 King William Street',
        city: 'Adelaide',
        state: 'SA',
        country: 'Australia'
      },
      {
        name: 'Hobart Arts Collective',
        description: 'Supporting local artists and bringing art to the community',
        contactEmail: 'contact@hobartarts.org.au',
        contactPhone: '+61 3 6234 5678',
        type: 'Arts & Culture',
        website: 'https://hobartarts.org.au',
        address: '14 Davey Street',
        city: 'Hobart',
        state: 'TAS',
        country: 'Australia'
      },
      {
        name: 'Canberra Mental Health Network',
        description: 'Providing mental health support and advocacy services',
        contactEmail: 'support@canberramh.org.au',
        contactPhone: '+61 2 6234 5678',
        type: 'Health',
        website: 'https://canberramh.org.au',
        address: '18 London Circuit',
        city: 'Canberra',
        state: 'ACT',
        country: 'Australia'
      },
      {
        name: 'Darwin Indigenous Support',
        description: 'Celebrating and supporting Indigenous culture and communities',
        contactEmail: 'contact@darwinindigenous.org.au',
        contactPhone: '+61 8 8934 5678',
        type: 'Cultural',
        website: 'https://darwinindigenous.org.au',
        address: '3 Mitchell Street',
        city: 'Darwin',
        state: 'NT',
        country: 'Australia'
      },
      {
        name: 'Gold Coast Environmental Alliance',
        description: 'Protecting coastal ecosystems and promoting sustainable practices',
        contactEmail: 'info@gcenvironmental.org.au',
        contactPhone: '+61 7 5555 1234',
        type: 'Environmental',
        website: 'https://gcenvironmental.org.au',
        address: '5 The Esplanade',
        city: 'Surfers Paradise',
        state: 'QLD',
        country: 'Australia'
      },
      {
        name: 'Newcastle Literacy Program',
        description: 'Teaching reading and writing skills to adults and children',
        contactEmail: 'learn@newcastleliteracy.org.au',
        contactPhone: '+61 2 4987 6543',
        type: 'Education',
        website: 'https://newcastleliteracy.org.au',
        address: '5 King Street',
        city: 'Newcastle',
        state: 'NSW',
        country: 'Australia'
      },
      {
        name: 'Geelong Seniors Care',
        description: 'Supporting elderly residents with companionship and assistance',
        contactEmail: 'care@geelongseniors.org.au',
        contactPhone: '+61 3 5234 5678',
        type: 'Aged Care',
        website: 'https://geelongseniors.org.au',
        address: '14 Victoria Street',
        city: 'Geelong',
        state: 'VIC',
        country: 'Australia'
      },
      {
        name: 'Wollongong Beach Clean',
        description: 'Organizing regular beach cleanups and ocean conservation activities',
        contactEmail: 'cleanup@wollongongbeach.org.au',
        contactPhone: '+61 2 4234 5678',
        type: 'Environmental',
        website: 'https://wollongongbeach.org.au',
        address: '26 Harbour Street',
        city: 'Wollongong',
        state: 'NSW',
        country: 'Australia'
      },
      {
        name: 'Cairns Reef Foundation',
        description: 'Protecting and restoring the Great Barrier Reef',
        contactEmail: 'protect@cairnsreef.org.au',
        contactPhone: '+61 7 4034 5678',
        type: 'Environmental',
        website: 'https://cairnsreef.org.au',
        address: '22 The Esplanade',
        city: 'Cairns',
        state: 'QLD',
        country: 'Australia'
      },
      {
        name: 'Bendigo Heritage Society',
        description: 'Preserving local history and heritage sites',
        contactEmail: 'heritage@bendigoheritage.org.au',
        contactPhone: '+61 3 5444 5678',
        type: 'Heritage',
        website: 'https://bendigoheritage.org.au',
        address: '39 High Street',
        city: 'Bendigo',
        state: 'VIC',
        country: 'Australia'
      },
      {
        name: 'Fremantle Community Kitchen',
        description: 'Providing meals and cooking classes for the community',
        contactEmail: 'meals@fremantlekitchen.org.au',
        contactPhone: '+61 8 9335 5678',
        type: 'Food Relief',
        website: 'https://fremantlekitchen.org.au',
        address: '2 Marine Terrace',
        city: 'Fremantle',
        state: 'WA',
        country: 'Australia'
      },
      {
        name: 'Launceston Animal Shelter',
        description: 'Rescuing and rehoming abandoned animals',
        contactEmail: 'adopt@launcestonanimals.org.au',
        contactPhone: '+61 3 6334 5678',
        type: 'Animal Welfare',
        website: 'https://launcestonanimals.org.au',
        address: '34 Cameron Street',
        city: 'Launceston',
        state: 'TAS',
        country: 'Australia'
      },
      {
        name: 'Toowoomba Community Gardens',
        description: 'Creating urban gardens and teaching sustainable agriculture',
        contactEmail: 'grow@toowoombagarden.org.au',
        contactPhone: '+61 7 4639 5678',
        type: 'Environmental',
        website: 'https://toowoombagarden.org.au',
        address: '70 Margaret Street',
        city: 'Toowoomba',
        state: 'QLD',
        country: 'Australia'
      },
      {
        name: 'Ballarat Disability Services',
        description: 'Supporting people with disabilities to live independently',
        contactEmail: 'support@ballaratdisability.org.au',
        contactPhone: '+61 3 5331 5678',
        type: 'Disability Support',
        website: 'https://ballaratdisability.org.au',
        address: '81 Victoria Street',
        city: 'Ballarat',
        state: 'VIC',
        country: 'Australia'
      },
      {
        name: 'Alice Springs Youth Hub',
        description: 'Providing safe spaces and activities for young people',
        contactEmail: 'youth@alicespringshub.org.au',
        contactPhone: '+61 8 8952 5678',
        type: 'Youth Services',
        website: 'https://alicespringshub.org.au',
        address: '101 Stuart Highway',
        city: 'Alice Springs',
        state: 'NT',
        country: 'Australia'
      },
      {
        name: 'Parramatta Cultural Exchange',
        description: 'Celebrating diversity through multicultural events and programs',
        contactEmail: 'culture@parramattaexchange.org.au',
        contactPhone: '+61 2 9687 5678',
        type: 'Cultural',
        website: 'https://parramattaexchange.org.au',
        address: '45 George Street',
        city: 'Parramatta',
        state: 'NSW',
        country: 'Australia'
      },
      {
        name: 'Glenelg Surf Lifesaving',
        description: 'Keeping beaches safe through volunteer lifeguards',
        contactEmail: 'patrol@glenelgsurf.org.au',
        contactPhone: '+61 8 8295 5678',
        type: 'Safety & Emergency',
        website: 'https://glenelgsurf.org.au',
        address: '60 Jetty Road',
        city: 'Glenelg',
        state: 'SA',
        country: 'Australia'
      },
      {
        name: 'Richmond Sports Academy',
        description: 'Providing sports programs for disadvantaged youth',
        contactEmail: 'sports@richmondsports.org.au',
        contactPhone: '+61 3 9429 5678',
        type: 'Sports & Recreation',
        website: 'https://richmondsports.org.au',
        address: '77 Swan Street',
        city: 'Richmond',
        state: 'VIC',
        country: 'Australia'
      },
      {
        name: 'Bunbury Emergency Relief',
        description: 'Providing emergency assistance to families in crisis',
        contactEmail: 'help@bunburyrelief.org.au',
        contactPhone: '+61 8 9721 5678',
        type: 'Emergency Services',
        website: 'https://bunburyrelief.org.au',
        address: '120 Bussell Highway',
        city: 'Bunbury',
        state: 'WA',
        country: 'Australia'
      },
      {
        name: 'Coffs Harbour Marine Care',
        description: 'Protecting marine life and coastal habitats',
        contactEmail: 'ocean@coffsmarine.org.au',
        contactPhone: '+61 2 6652 5678',
        type: 'Environmental',
        website: 'https://coffsmarine.org.au',
        address: '55 Pacific Highway',
        city: 'Coffs Harbour',
        state: 'NSW',
        country: 'Australia'
      },
      {
        name: 'Ipswich Family Support',
        description: 'Supporting families through counselling and practical assistance',
        contactEmail: 'families@ipswichsupport.org.au',
        contactPhone: '+61 7 3281 5678',
        type: 'Family Services',
        website: 'https://ipswichsupport.org.au',
        address: '15 Ruthven Street',
        city: 'Ipswich',
        state: 'QLD',
        country: 'Australia'
      },
      {
        name: 'St Kilda Community Centre',
        description: 'Providing community programs and support services',
        contactEmail: 'community@stkildacentre.org.au',
        contactPhone: '+61 3 9534 5678',
        type: 'Community Services',
        website: 'https://stkildacentre.org.au',
        address: '6 Grey Street',
        city: 'St Kilda',
        state: 'VIC',
        country: 'Australia'
      },
      {
        name: 'Albury Refugee Welcome',
        description: 'Supporting refugees and asylum seekers to settle in Australia',
        contactEmail: 'welcome@alburyrefugee.org.au',
        contactPhone: '+61 2 6021 5678',
        type: 'Refugee Services',
        website: 'https://alburyrefugee.org.au',
        address: '48 Dean Street',
        city: 'Albury',
        state: 'NSW',
        country: 'Australia'
      },
      {
        name: 'Geraldton Education Trust',
        description: 'Providing scholarships and educational support',
        contactEmail: 'education@geraldtontrust.org.au',
        contactPhone: '+61 8 9964 5678',
        type: 'Education',
        website: 'https://geraldtontrust.org.au',
        address: '85 Marine Terrace',
        city: 'Geraldton',
        state: 'WA',
        country: 'Australia'
      },
      {
        name: 'Carlton Legal Aid',
        description: 'Providing free legal advice to disadvantaged communities',
        contactEmail: 'legal@carltonaid.org.au',
        contactPhone: '+61 3 9347 5678',
        type: 'Legal Services',
        website: 'https://carltonaid.org.au',
        address: '41 Victoria Street',
        city: 'Carlton',
        state: 'VIC',
        country: 'Australia'
      },
      {
        name: 'Strathpine Youth Connect',
        description: 'Connecting young people with employment and training opportunities',
        contactEmail: 'connect@strathpineyouth.org.au',
        contactPhone: '+61 7 3205 5678',
        type: 'Youth Services',
        website: 'https://strathpineyouth.org.au',
        address: '73 Gympie Road',
        city: 'Strathpine',
        state: 'QLD',
        country: 'Australia'
      },
      {
        name: 'Brighton Community Health',
        description: 'Providing accessible healthcare services to the community',
        contactEmail: 'health@brightonhealth.org.au',
        contactPhone: '+61 3 9592 5678',
        type: 'Health',
        website: 'https://brightonhealth.org.au',
        address: '30 Bay Street',
        city: 'Brighton',
        state: 'VIC',
        country: 'Australia'
      },
      {
        name: 'Northbridge Arts Initiative',
        description: 'Supporting emerging artists and creative industries',
        contactEmail: 'arts@northbridgearts.org.au',
        contactPhone: '+61 8 9328 5678',
        type: 'Arts & Culture',
        website: 'https://northbridgearts.org.au',
        address: '8 James Street',
        city: 'Northbridge',
        state: 'WA',
        country: 'Australia'
      },
      {
        name: 'Kalgoorlie Mining History',
        description: 'Preserving and sharing the history of gold mining',
        contactEmail: 'history@kalgoorliehistory.org.au',
        contactPhone: '+61 8 9021 5678',
        type: 'Heritage',
        website: 'https://kalgoorliehistory.org.au',
        address: '7 Hannan Street',
        city: 'Kalgoorlie',
        state: 'WA',
        country: 'Australia'
      },
      {
        name: 'Warrnambool Maritime Foundation',
        description: 'Celebrating maritime heritage and ocean conservation',
        contactEmail: 'maritime@warrnamboolsea.org.au',
        contactPhone: '+61 3 5562 5678',
        type: 'Maritime',
        website: 'https://warrnamboolsea.org.au',
        address: '4 Raglan Parade',
        city: 'Warrnambool',
        state: 'VIC',
        country: 'Australia'
      },
      {
        name: 'Southbank Creative Studios',
        description: 'Providing affordable studio space for artists',
        contactEmail: 'studios@southbankcreative.org.au',
        contactPhone: '+61 3 9686 5678',
        type: 'Arts & Culture',
        website: 'https://southbankcreative.org.au',
        address: '64 City Road',
        city: 'Southbank',
        state: 'VIC',
        country: 'Australia'
      },
      {
        name: 'Braddon Sustainability Hub',
        description: 'Promoting sustainable living and environmental awareness',
        contactEmail: 'green@braddonsustain.org.au',
        contactPhone: '+61 2 6262 5678',
        type: 'Environmental',
        website: 'https://braddonsustain.org.au',
        address: '13 Limestone Avenue',
        city: 'Braddon',
        state: 'ACT',
        country: 'Australia'
      },
      {
        name: 'Manly Surf Education',
        description: 'Teaching water safety and surfing skills',
        contactEmail: 'surf@manlysurf.org.au',
        contactPhone: '+61 2 9977 5678',
        type: 'Sports & Recreation',
        website: 'https://manlysurf.org.au',
        address: '8 Beach Road',
        city: 'Manly',
        state: 'NSW',
        country: 'Australia'
      },
      {
        name: 'Chatswood Business Mentors',
        description: 'Connecting experienced professionals with emerging entrepreneurs',
        contactEmail: 'mentors@chatswoodbusiness.org.au',
        contactPhone: '+61 2 9419 5678',
        type: 'Business Development',
        website: 'https://chatswoodbusiness.org.au',
        address: '23 Victoria Avenue',
        city: 'Chatswood',
        state: 'NSW',
        country: 'Australia'
      },
      {
        name: 'Cronulla Veterans Support',
        description: 'Supporting military veterans and their families',
        contactEmail: 'veterans@cronullasupport.org.au',
        contactPhone: '+61 2 9523 5678',
        type: 'Veterans Services',
        website: 'https://cronullasupport.org.au',
        address: '27 Gerrale Street',
        city: 'Cronulla',
        state: 'NSW',
        country: 'Australia'
      },
      {
        name: 'Gosford Childrens Theatre',
        description: 'Providing performing arts education for children',
        contactEmail: 'theatre@gosfordkids.org.au',
        contactPhone: '+61 2 4325 5678',
        type: 'Arts & Culture',
        website: 'https://gosfordkids.org.au',
        address: '12 Mann Street',
        city: 'Gosford',
        state: 'NSW',
        country: 'Australia'
      },
      {
        name: 'Kingston Conservation Group',
        description: 'Protecting local bushland and native species',
        contactEmail: 'conservation@kingstongroup.org.au',
        contactPhone: '+61 3 6229 5678',
        type: 'Environmental',
        website: 'https://kingstongroup.org.au',
        address: '10 Channel Highway',
        city: 'Kingston',
        state: 'TAS',
        country: 'Australia'
      },
      {
        name: 'Palmerston Youth Sports',
        description: 'Organizing sports programs for young people',
        contactEmail: 'sports@palmerstonyouth.org.au',
        contactPhone: '+61 8 8932 5678',
        type: 'Sports & Recreation',
        website: 'https://palmerstonyouth.org.au',
        address: '28 Yarrawonga Road',
        city: 'Palmerston',
        state: 'NT',
        country: 'Australia'
      },
      {
        name: 'South Brisbane Financial Literacy',
        description: 'Teaching money management skills to low-income families',
        contactEmail: 'finance@southbrisbanelit.org.au',
        contactPhone: '+61 7 3844 5678',
        type: 'Financial Education',
        website: 'https://southbrisbanelit.org.au',
        address: '21 Anne Street',
        city: 'South Brisbane',
        state: 'QLD',
        country: 'Australia'
      },
      {
        name: 'Mount Lawley Music School',
        description: 'Offering affordable music lessons to all ages',
        contactEmail: 'music@mountlawleymusic.org.au',
        contactPhone: '+61 8 9370 5678',
        type: 'Arts & Culture',
        website: 'https://mountlawleymusic.org.au',
        address: '11 Walcott Street',
        city: 'Mount Lawley',
        state: 'WA',
        country: 'Australia'
      },
      {
        name: 'Wagga Wagga Farmers Connect',
        description: 'Supporting local farmers and promoting regional produce',
        contactEmail: 'farmers@waggafarmers.org.au',
        contactPhone: '+61 2 6921 5678',
        type: 'Agricultural',
        website: 'https://waggafarmers.org.au',
        address: '18 Baylis Street',
        city: 'Wagga Wagga',
        state: 'NSW',
        country: 'Australia'
      },
      {
        name: 'Parramatta Park Multicultural Services',
        description: 'Supporting multicultural communities through integration programs',
        contactEmail: 'multicultural@ppark.org.au',
        contactPhone: '+61 7 4053 5678',
        type: 'Community Services',
        website: 'https://ppark.org.au',
        address: '22 Mulgrave Road',
        city: 'Parramatta Park',
        state: 'QLD',
        country: 'Australia'
      },
      {
        name: 'Adelaide North Emergency Housing',
        description: 'Providing temporary accommodation to those in crisis',
        contactEmail: 'housing@adelaidenorth.org.au',
        contactPhone: '+61 8 8262 5678',
        type: 'Housing Services',
        website: 'https://adelaidenorth.org.au',
        address: '50 North Terrace',
        city: 'Adelaide',
        state: 'SA',
        country: 'Australia'
      },
      {
        name: 'Melbourne Central Tech Skills',
        description: 'Teaching digital literacy and technology skills',
        contactEmail: 'tech@melbournetech.org.au',
        contactPhone: '+61 3 9654 5678',
        type: 'Technology Education',
        website: 'https://melbournetech.org.au',
        address: '90 Spencer Street',
        city: 'Melbourne',
        state: 'VIC',
        country: 'Australia'
      },
      {
        name: 'Rundle Mall Community Outreach',
        description: 'Connecting city workers with volunteer opportunities',
        contactEmail: 'outreach@rundlemall.org.au',
        contactPhone: '+61 8 8212 5678',
        type: 'Community Services',
        website: 'https://rundlemall.org.au',
        address: '62 Rundle Mall',
        city: 'Adelaide',
        state: 'SA',
        country: 'Australia'
      },
      {
        name: 'Flinders Street Homeless Advocacy',
        description: 'Advocating for the rights and welfare of homeless individuals',
        contactEmail: 'advocacy@flindersadvocacy.org.au',
        contactPhone: '+61 3 9650 5678',
        type: 'Advocacy',
        website: 'https://flindersadvocacy.org.au',
        address: '16 Flinders Street',
        city: 'Melbourne',
        state: 'VIC',
        country: 'Australia'
      }
    ]

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    // Get users to assign as owners
    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    const rows = baseOrganizations.slice(0, RECORD_COUNT).map((org, index) => {
      const slug = `${org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(index + 1).toString().padStart(3, '0')}`
      const ownerId = userIds.length > 0 ? userIds[index % userIds.length] : null
      const logo = Math.random() > 0.5 ? `/uploads/logos/${slug}.png` : null
      
      return {
        name: org.name,
        slug: slug,
        description: org.description,
        contact_email: org.contactEmail,
        contact_phone: org.contactPhone,
        type: org.type,
        website: org.website,
        address: org.address,
        city: org.city,
        country: org.country,
        timezone: 'Australia/Sydney',
        status: 'active',
        is_approved: true,
        is_active: true,
        public_profile: true,
        auto_approve_volunteers: false,
        owner_id: ownerId,
        logo: logo,
        created_at: timestamp,
        updated_at: timestamp
      }
    })

    if (!rows.length) {
      console.log('OrganizationSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO organizations (name,slug,description,contact_email,contact_phone,type,website,address,city,country,timezone,status,is_approved,is_active,public_profile,auto_approve_volunteers,owner_id,logo,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),contact_email=VALUES(contact_email),contact_phone=VALUES(contact_phone),type=VALUES(type),website=VALUES(website),address=VALUES(address),city=VALUES(city),country=VALUES(country),timezone=VALUES(timezone),status=VALUES(status),is_approved=VALUES(is_approved),is_active=VALUES(is_active),public_profile=VALUES(public_profile),auto_approve_volunteers=VALUES(auto_approve_volunteers),owner_id=VALUES(owner_id),logo=VALUES(logo),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.name,
      row.slug,
      row.description,
      row.contact_email,
      row.contact_phone,
      row.type,
      row.website,
      row.address,
      row.city,
      row.country,
      row.timezone,
      row.status,
      row.is_approved,
      row.is_active,
      row.public_profile,
      row.auto_approve_volunteers,
      row.owner_id,
      row.logo,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`OrganizationSeeder: upserted ${rows.length} organizations`)
    } catch (error) {
      await trx.rollback()
      console.error('OrganizationSeeder failed', error)
      throw error
    }
  }
}
