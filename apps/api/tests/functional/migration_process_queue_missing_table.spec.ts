import { test } from '@japa/runner'
import InviteSendJob from 'App/Models/InviteSendJob'

test.group('Migration and worker startup resilience', () => {
  test('processQueue should not throw if invite_send_jobs table is missing', async () => {
    const { processQueue } = await import('App/Services/InviteSender')

    // Temporarily monkeypatch InviteSendJob.query to simulate a missing table error
    const model: any = InviteSendJob as any
    const origQuery = model.query
    model.query = () => {
      throw new Error("Table 'vol2.invite_send_jobs' doesn't exist")
    }

    try {
      // The function should handle the missing-table error and return without throwing
      await processQueue()
      test.assert(true)
    } finally {
      model.query = origQuery
    }
  })
})
