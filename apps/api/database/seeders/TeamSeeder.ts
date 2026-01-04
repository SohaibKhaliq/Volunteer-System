import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class TeamSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 50

    const teamData = [
      { name: 'Event Planning Team', description: 'Coordinates and organizes all community events' },
      { name: 'Fundraising Squad', description: 'Raises funds through various campaigns and activities' },
      { name: 'Marketing & Communications', description: 'Manages social media and public relations' },
      { name: 'Volunteer Coordinators', description: 'Recruits and manages volunteer relationships' },
      { name: 'Food Services Team', description: 'Prepares and distributes meals to community members' },
      { name: 'Youth Program Leaders', description: 'Runs educational and recreational programs for youth' },
      { name: 'Senior Support Team', description: 'Provides companionship and assistance to elderly residents' },
      { name: 'Environmental Action Group', description: 'Leads conservation and sustainability initiatives' },
      { name: 'Emergency Response Team', description: 'Provides rapid assistance during crises' },
      { name: 'Education Mentors', description: 'Tutors and mentors students in various subjects' },
      { name: 'Health & Wellness Team', description: 'Promotes healthy living and provides health screenings' },
      { name: 'Animal Care Team', description: 'Cares for and rehabilitates rescued animals' },
      { name: 'Arts & Culture Committee', description: 'Organizes cultural events and art exhibitions' },
      { name: 'Sports & Recreation', description: 'Runs sports programs and recreational activities' },
      { name: 'Technology Support', description: 'Provides IT support and digital literacy training' },
      { name: 'Legal Aid Volunteers', description: 'Assists with legal advice and documentation' },
      { name: 'Housing Support Team', description: 'Helps families find and maintain housing' },
      { name: 'Community Gardening', description: 'Maintains community gardens and teaches urban farming' },
      { name: 'Beach Patrol', description: 'Ensures beach safety and cleanliness' },
      { name: 'Heritage Preservation', description: 'Protects and promotes local heritage sites' },
      { name: 'Refugee Support', description: 'Assists refugees with settlement and integration' },
      { name: 'Mental Health Advocates', description: 'Provides mental health support and advocacy' },
      { name: 'Disability Services', description: 'Supports people with disabilities in daily activities' },
      { name: 'Financial Literacy', description: 'Teaches budgeting and money management skills' },
      { name: 'Community Safety Patrol', description: 'Monitors community safety and reports issues' },
      { name: 'Family Support Network', description: 'Provides counseling and support to families' },
      { name: 'Indigenous Programs', description: 'Celebrates and supports Indigenous culture' },
      { name: 'Marine Conservation', description: 'Protects ocean and marine ecosystems' },
      { name: 'Veterans Support', description: 'Assists military veterans and their families' },
      { name: 'Domestic Violence Support', description: 'Provides safe shelter and counseling services' },
      { name: 'Literacy Program', description: 'Teaches reading and writing skills to adults' },
      { name: 'Job Skills Training', description: 'Prepares unemployed individuals for work' },
      { name: 'Community Transport', description: 'Provides transport for elderly and disabled residents' },
      { name: 'Disaster Relief Team', description: 'Responds to natural disasters and emergencies' },
      { name: 'Youth Mentorship', description: 'Pairs young people with experienced mentors' },
      { name: 'Homelessness Outreach', description: 'Connects homeless individuals with services' },
      { name: 'Multicultural Liaison', description: 'Bridges cultural gaps in the community' },
      { name: 'Business Development', description: 'Mentors small businesses and entrepreneurs' },
      { name: 'Research & Data Team', description: 'Conducts research to improve programs' },
      { name: 'Volunteer Training', description: 'Trains and certifies new volunteers' },
      { name: 'Grant Writing Team', description: 'Writes proposals to secure funding' },
      { name: 'Community Engagement', description: 'Engages community members in programs' },
      { name: 'Sustainability Team', description: 'Implements green practices and education' },
      { name: 'Social Justice Advocates', description: 'Campaigns for equality and human rights' },
      { name: 'Neighborhood Watch', description: 'Promotes safety and crime prevention' },
      { name: 'Music Education', description: 'Provides music lessons to children' },
      { name: 'After School Program', description: 'Supervises children after school hours' },
      { name: 'Crisis Counseling', description: 'Provides immediate emotional support' },
      { name: 'Community Radio', description: 'Produces community radio programs' },
      { name: 'Urban Planning Group', description: 'Advocates for better urban development' }
    ]

    const now = new Date()
    const timestamp = now.toISOString()

    const orgsResult = await Database.rawQuery('SELECT id FROM organizations ORDER BY id ASC LIMIT 50')
    const orgIds = orgsResult[0].map((row: any) => row.id)

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 50')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (orgIds.length === 0) {
      console.log('TeamSeeder: no organizations found, skipping')
      return
    }

    const rows = teamData.slice(0, RECORD_COUNT).map((team, index) => {
      return {
        organization_id: orgIds[index % orgIds.length],
        name: team.name,
        description: team.description,
        lead_user_id: userIds.length > 0 ? userIds[index % userIds.length] : null,
        created_at: timestamp,
        updated_at: timestamp
      }
    })

    if (!rows.length) {
      console.log('TeamSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO teams (organization_id,name,description,lead_user_id,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),lead_user_id=VALUES(lead_user_id),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.organization_id,
      row.name,
      row.description,
      row.lead_user_id,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`TeamSeeder: upserted ${rows.length} teams`)
    } catch (error) {
      await trx.rollback()
      console.error('TeamSeeder failed', error)
      throw error
    }
  }
}
