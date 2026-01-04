import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class OrganizationInviteSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 30
    const now = new Date()
    const timestamp = now.toISOString()

    const orgsResult = await Database.rawQuery('SELECT id FROM organizations ORDER BY id ASC LIMIT 50')
    const orgIds = orgsResult[0].map((row: any) => row.id)

    const usersResult = await Database.rawQuery('SELECT id FROM users ORDER BY id ASC LIMIT 10')
    const userIds = usersResult[0].map((row: any) => row.id)

    if (orgIds.length === 0) {
      console.log('OrganizationInviteSeeder: no organizations found, skipping')
      return
    }

    const statuses = ['pending', 'accepted', 'rejected', 'expired']
    const roles = ['volunteer', 'coordinator', 'volunteer-manager']
    const rows: any[] = []

    for (let i = 0; i < RECORD_COUNT; i++) {
      const orgId = orgIds[i % orgIds.length]
      const invitedBy = userIds.length > 0 ? userIds[i % userIds.length] : null
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const role = roles[Math.floor(Math.random() * roles.length)]

      const email = `volunteer${i + 1}+invite@example.com.au`
      const inviteCode = `INV-${Date.now().toString(36).toUpperCase()}-${(i + 1).toString().padStart(4, '0')}`

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 14)

      const respondedAt = status !== 'pending' ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString() : null

      rows.push({
        organization_id: orgId,
        email: email,
        role: role,
        invite_code: inviteCode,
        status: status,
        invited_by: invitedBy,
        expires_at: expiresAt.toISOString(),
        responded_at: respondedAt,
        created_at: timestamp,
        updated_at: timestamp
      })
    }

    if (!rows.length) {
      console.log('OrganizationInviteSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO organization_invites (organization_id,email,role,invite_code,status,invited_by,expires_at,responded_at,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE status=VALUES(status),responded_at=VALUES(responded_at),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.organization_id, row.email, row.role, row.invite_code, row.status, row.invited_by, row.expires_at, row.responded_at, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`OrganizationInviteSeeder: upserted ${rows.length} organization invites`)
    } catch (error) {
      await trx.rollback()
      console.error('OrganizationInviteSeeder failed', error)
      throw error
    }
  }
}
