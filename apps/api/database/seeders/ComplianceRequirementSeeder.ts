import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ComplianceRequirementSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 20
    const now = new Date()
    const timestamp = now.toISOString()

    const orgsResult = await Database.rawQuery('SELECT id FROM organizations ORDER BY id ASC LIMIT 50')
    const orgIds = orgsResult[0].map((row: any) => row.id)

    if (orgIds.length === 0) {
      console.log('ComplianceRequirementSeeder: no organizations found, skipping')
      return
    }

    const requirements = [
      { name: 'Police Check', description: 'National police clearance required', type: 'background_check', mandatory: true },
      { name: 'Working with Children Check', description: 'WWC check for roles involving minors', type: 'background_check', mandatory: true },
      { name: 'First Aid Certificate', description: 'Current first aid certification', type: 'training', mandatory: false },
      { name: 'WHS Induction', description: 'Complete workplace health and safety induction', type: 'training', mandatory: true },
      { name: 'Code of Conduct Acknowledgment', description: 'Read and acknowledge code of conduct', type: 'document', mandatory: true },
      { name: 'Privacy Policy Acknowledgment', description: 'Acknowledge privacy policy', type: 'document', mandatory: true },
      { name: 'Volunteer Agreement', description: 'Sign volunteer agreement', type: 'document', mandatory: true },
      { name: 'Reference Check', description: 'Two professional references', type: 'background_check', mandatory: false },
      { name: 'Driver License Verification', description: 'Valid driver license for transport roles', type: 'credential', mandatory: false },
      { name: 'Food Safety Certificate', description: 'Food handler certification', type: 'training', mandatory: false },
      { name: 'Child Protection Training', description: 'Complete child protection training', type: 'training', mandatory: true },
      { name: 'Manual Handling Training', description: 'Safe manual handling certification', type: 'training', mandatory: false },
      { name: 'Orientation Session', description: 'Attend volunteer orientation', type: 'training', mandatory: true },
      { name: 'Identity Verification', description: 'Provide proof of identity', type: 'credential', mandatory: true },
      { name: 'Emergency Contact Details', description: 'Provide emergency contact information', type: 'document', mandatory: true }
    ]

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const req = requirements[i % requirements.length]
      const orgId = orgIds[i % orgIds.length]

      rows.push({
        organization_id: orgId,
        name: req.name,
        description: req.description,
        requirement_type: req.type,
        is_mandatory: req.mandatory ? 1 : 0,
        is_active: 1,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('ComplianceRequirementSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO compliance_requirements (organization_id,name,description,requirement_type,is_mandatory,is_active,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE description=VALUES(description),is_active=VALUES(is_active),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.organization_id, row.name, row.description, row.requirement_type, row.is_mandatory, row.is_active, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`ComplianceRequirementSeeder: upserted ${rows.length} compliance requirements`)
    } catch (error) {
      await trx.rollback()
      console.error('ComplianceRequirementSeeder failed', error)
      throw error
    }
  }
}
