import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import HelpRequest from 'App/Models/HelpRequest'
import Type from 'App/Models/Type'

export default class FixHelpRequestTypesSeeder extends BaseSeeder {
  public async run() {
    console.log('Starting FixHelpRequestTypesSeeder...')
    
    // Fetch all types for reference
    const types = await Type.all()
    const medicalType = types.find(t => t.type === 'medical')
    const generalType = types.find(t => t.type === 'logistics') || types[0]

    if (!types.length) {
      console.log('No types found in database. Please run TypeSeeder first.')
      return
    }

    const helpRequests = await HelpRequest.query().preload('types')
    let fixedCount = 0

    for (const request of helpRequests) {
      // If no types are associated
      if (request.types.length === 0) {
        // Determine type based on content
        const content = ((request.description || '') + ' ' + (request.source || '')).toLowerCase()
        let typeToAttach = generalType

        if (content.includes('medical') || content.includes('bleeding') || content.includes('injury')) {
          typeToAttach = medicalType || generalType
        }
        
        // Attach the type
        if (typeToAttach) {
          await request.related('types').attach([typeToAttach.id])
          fixedCount++
        }
      }
    }

    console.log(`FixHelpRequestTypesSeeder completed. Fixed ${fixedCount} requests.`)
  }
}
