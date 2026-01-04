import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class EngagementCampaignSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 20
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const orgsResult = await Database.rawQuery('SELECT id FROM organizations ORDER BY id ASC LIMIT 50')
    const orgIds = orgsResult[0].map((row: any) => row.id)

    if (orgIds.length === 0) {
      console.log('EngagementCampaignSeeder: no organizations found, skipping')
      return
    }

    const campaigns = [
      { name: 'Welcome New Volunteers 2024', type: 'onboarding', goal: 50 },
      { name: 'Summer Volunteer Drive', type: 'recruitment', goal: 100 },
      { name: 'Volunteer Appreciation Week', type: 'retention', goal: 80 },
      { name: 'Skills Training Initiative', type: 'development', goal: 60 },
      { name: 'Re-engagement Campaign', type: 'retention', goal: 40 },
      { name: 'Community Impact Challenge', type: 'engagement', goal: 120 },
      { name: 'Youth Volunteer Program', type: 'recruitment', goal: 75 },
      { name: 'Monthly Newsletter Series', type: 'communication', goal: 200 },
      { name: 'Feedback Collection Drive', type: 'feedback', goal: 90 },
      { name: 'Year-End Celebration', type: 'recognition', goal: 150 }
    ]

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const campaign = campaigns[i % campaigns.length]
      const orgId = orgIds[i % orgIds.length]

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60) + 30)
      
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 60) + 30)

      const isActive = new Date() >= startDate && new Date() <= endDate

      rows.push({
        organization_id: orgId,
        name: `${campaign.name} ${Math.floor(i / campaigns.length) + 1}`,
        description: `${campaign.type} campaign to engage volunteers`,
        campaign_type: campaign.type,
        start_date: startDate.toISOString().slice(0, 19).replace('T', ' '),
        end_date: endDate.toISOString().slice(0, 19).replace('T', ' '),
        target_audience: 'all_volunteers',
        goal_metric: campaign.goal,
        current_metric: Math.floor(campaign.goal * (0.3 + Math.random() * 0.6)),
        status: isActive ? 'active' : (new Date() > endDate ? 'completed' : 'scheduled'),
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('EngagementCampaignSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO engagement_campaigns (organization_id,name,description,campaign_type,start_date,end_date,target_audience,goal_metric,current_metric,status,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE current_metric=VALUES(current_metric),status=VALUES(status),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.organization_id, row.name, row.description, row.campaign_type, row.start_date, row.end_date, row.target_audience, row.goal_metric, row.current_metric, row.status, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`EngagementCampaignSeeder: upserted ${rows.length} engagement campaigns`)
    } catch (error) {
      await trx.rollback()
      console.error('EngagementCampaignSeeder failed', error)
      throw error
    }
  }
}
