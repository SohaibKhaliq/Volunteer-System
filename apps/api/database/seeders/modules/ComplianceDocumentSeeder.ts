import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ComplianceDocumentSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 30
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const orgsResult = await Database.rawQuery('SELECT id FROM organizations ORDER BY id ASC LIMIT 50')
    const orgIds = orgsResult[0].map((row: any) => row.id)

    if (orgIds.length === 0) {
      console.log('ComplianceDocumentSeeder: no organizations found, skipping')
      return
    }

    const documents = [
      { title: 'Code of Conduct', description: 'Organizational code of conduct and ethics', type: 'policy', required: true },
      { title: 'Privacy Policy', description: 'Data privacy and protection policy', type: 'policy', required: true },
      { title: 'Safety Guidelines', description: 'Workplace health and safety guidelines', type: 'guideline', required: true },
      { title: 'Volunteer Agreement', description: 'Standard volunteer agreement and terms', type: 'agreement', required: true },
      { title: 'Child Protection Policy', description: 'Child safety and protection procedures', type: 'policy', required: true },
      { title: 'Emergency Procedures', description: 'Emergency response and evacuation procedures', type: 'guideline', required: true },
      { title: 'Confidentiality Agreement', description: 'Information confidentiality requirements', type: 'agreement', required: true },
      { title: 'Anti-Discrimination Policy', description: 'Equal opportunity and anti-discrimination policy', type: 'policy', required: true },
      { title: 'WHS Induction', description: 'Work health and safety induction material', type: 'training', required: true },
      { title: 'Manual Handling Guidelines', description: 'Safe manual handling procedures', type: 'guideline', required: false },
      { title: 'First Aid Policy', description: 'First aid and medical emergency procedures', type: 'policy', required: false },
      { title: 'Social Media Policy', description: 'Guidelines for social media use', type: 'policy', required: false },
      { title: 'Vehicle Use Policy', description: 'Organization vehicle usage policy', type: 'policy', required: false },
      { title: 'Financial Procedures', description: 'Financial handling and reporting procedures', type: 'guideline', required: false },
      { title: 'Grievance Process', description: 'Complaint and grievance procedure', type: 'guideline', required: true }
    ]

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const doc = documents[i % documents.length]
      const orgId = orgIds[i % orgIds.length]

      rows.push({
        organization_id: orgId,
        description: doc.description,
        doc_type: doc.type,
        is_required: doc.required ? 1 : 0,
        is_active: 1,
        content: `This is the ${doc.title} document content`,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('ComplianceDocumentSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO compliance_documents (organization_id,description,doc_type,is_required,is_active,content,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE description=VALUES(description),is_active=VALUES(is_active),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.organization_id, row.description, row.doc_type, row.is_required, row.is_active, row.content, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`ComplianceDocumentSeeder: upserted ${rows.length} compliance documents`)
    } catch (error) {
      await trx.rollback()
      console.error('ComplianceDocumentSeeder failed', error)
      throw error
    }
  }
}
