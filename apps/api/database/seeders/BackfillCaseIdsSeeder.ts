import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import HelpRequest from 'App/Models/HelpRequest'

export default class BackfillCaseIdsSeeder extends BaseSeeder {
  public async run() {
    console.log('Starting BackfillCaseIdsSeeder...')
    
    // Fetch requests with missing caseId
    // Note: checking for null or empty string
    const helpRequests = await HelpRequest.query()
      .whereNull('case_id')
      .orWhere('case_id', '')
      .orderBy('created_at', 'asc')

    if (helpRequests.length === 0) {
      console.log('No requests found with missing Case ID.')
      return
    }

    console.log(`Found ${helpRequests.length} requests to backfill.`)

    const prefix = 'REQ'
    const year = new Date().getFullYear() // Or use created_at year? Let's use current year for simplicity or created_at year for accuracy.
    // Let's use created_at year to be historical.
    
    let sequenceMap = new Map<number, number>() // year -> sequence

    for (const request of helpRequests) {
      const reqYear = request.createdAt ? request.createdAt.year : year
      
      // Get next sequence for this year
      // We should ideally check DB for max existing sequence for this year, but for backfill we can just start from 1 if no IDs exist, 
      // or we might collide if mixed data exists. 
      // To be safe, let's just use a high starting number for backfill if we suspect collision, 
      // OR mostly likely these are OLD records and we can re-assign them. 
      // Let's assume we just increment from what we find or start at 1.
      
      let currentSeq = sequenceMap.get(reqYear) || 0
      currentSeq++
      sequenceMap.set(reqYear, currentSeq)

      const paddedSequence = currentSeq.toString().padStart(4, '0')
      request.caseId = `${prefix}-${reqYear}-${paddedSequence}`
      await request.save()
    }

    console.log(`BackfillCaseIdsSeeder completed. Updated ${helpRequests.length} requests.`)
  }
}
