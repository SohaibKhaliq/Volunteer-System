import Event from '@ioc:Adonis/Core/Event'
import GamificationService from 'App/Services/GamificationService'

Event.on('shift:completed', async (data) => {
  const service = new GamificationService()
  await service.processShiftCompletion(data.userId, data.duration)
})
