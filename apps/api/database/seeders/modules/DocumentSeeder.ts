import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class DocumentSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 50
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ').slice(0, 19).replace('T', ' ')

    const orgsResult = await Database.rawQuery('SELECT id FROM organizations ORDER BY id ASC LIMIT 50')
    const orgIds = orgsResult[0].map((row: any) => row.id)

    if (orgIds.length === 0) {
      console.log('DocumentSeeder: no organizations found, skipping')
      return
    }

    const documents = [
      { title: 'Volunteer Handbook 2024', category: 'handbook', requiresAck: true, isPublic: false },
      { title: 'Safety Procedures Manual', category: 'safety', requiresAck: true, isPublic: false },
      { title: 'Event Planning Guide', category: 'guide', requiresAck: false, isPublic: true },
      { title: 'Code of Conduct', category: 'policy', requiresAck: true, isPublic: true },
      { title: 'Privacy Policy', category: 'policy', requiresAck: true, isPublic: true },
      { title: 'Emergency Response Plan', category: 'procedure', requiresAck: true, isPublic: false },
      { title: 'Volunteer Application Form', category: 'form', requiresAck: false, isPublic: true },
      { title: 'Training Materials', category: 'training', requiresAck: false, isPublic: false },
      { title: 'Equipment Usage Guidelines', category: 'guide', requiresAck: false, isPublic: false },
      { title: 'Incident Report Template', category: 'form', requiresAck: false, isPublic: false }
    ]

    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const doc = documents[i % documents.length]
      const orgId = orgIds[i % orgIds.length]
      const version = Math.floor(i / documents.length) + 1

      const publishedDate = Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ') : null
      const expiresDate = Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ') : null

      rows.push({
        title: `${doc.title} v${version}`,
        description: `Official ${doc.category} document for organizational use`,
        category: doc.category,
        file_path: `/documents/${doc.category}/${doc.title.toLowerCase().replace(/\s+/g, '-')}-v${version}.pdf`,
        file_name: `${doc.title.toLowerCase().replace(/\s+/g, '-')}-v${version}.pdf`,
        file_type: 'application/pdf',
        file_size: Math.floor(Math.random() * 5000000) + 100000,
        organization_id: orgId,
        requires_acknowledgment: doc.requiresAck ? 1 : 0,
        is_public: doc.isPublic ? 1 : 0,
        version: version,
        status: publishedDate ? 'published' : 'draft',
        published_at: publishedDate,
        expires_at: expiresDate,
        metadata: JSON.stringify({ author: 'Admin', department: 'Compliance' }),
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('DocumentSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO documents (title,description,category,file_path,file_name,file_type,file_size,organization_id,requires_acknowledgment,is_public,version,status,published_at,expires_at,metadata,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE description=VALUES(description),status=VALUES(status),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.title, row.description, row.category, row.file_path, row.file_name, row.file_type, row.file_size, row.organization_id, row.requires_acknowledgment, row.is_public, row.version, row.status, row.published_at, row.expires_at, row.metadata, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`DocumentSeeder: upserted ${rows.length} documents`)
    } catch (error) {
      await trx.rollback()
      console.error('DocumentSeeder failed', error)
      throw error
    }
  }
}
