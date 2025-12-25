import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import AchievementEvaluationService from 'App/Services/AchievementEvaluationService'
import User from 'App/Models/User'

export default class EvaluateAchievements extends BaseCommand {
  public static commandName = 'evaluate:achievements'
  public static description = 'Evaluate and award achievements to volunteers based on their activity'

  @flags.number({ description: 'Evaluate for a specific user ID' })
  public userId?: number

  @flags.number({ description: 'Evaluate a specific achievement ID' })
  public achievementId?: number

  @flags.number({ description: 'Batch size for processing users', default: 50 })
  public batchSize: number = 50

  public static settings = {
    loadApp: true,
    stayAlive: false
  }

  public async run() {
    try {
      this.logger.info('Starting achievement evaluation...')

      if (this.userId) {
        // Evaluate for specific user
        this.logger.info(`Evaluating achievements for user ${this.userId}`)
        const result = await AchievementEvaluationService.evaluateForUser(
          this.userId,
          this.achievementId
        )
        this.logger.success(
          `✅ User ${this.userId}: ${result.awarded} awarded, ${result.updated} updated`
        )
      } else {
        // Evaluate for all users in batches
        const totalUsers = await User.query().count('* as total')
        const total = Number(totalUsers[0].$extras.total)
        this.logger.info(`Evaluating achievements for ${total} users...`)

        let processed = 0
        let totalAwarded = 0
        let totalUpdated = 0

        // Process in batches
        for (let offset = 0; offset < total; offset += this.batchSize) {
          const users = await User.query().select('id').offset(offset).limit(this.batchSize)

          for (const user of users) {
            try {
              const result = await AchievementEvaluationService.evaluateForUser(
                user.id,
                this.achievementId
              )
              totalAwarded += result.awarded
              totalUpdated += result.updated
              processed++

              if (result.awarded > 0) {
                this.logger.info(
                  `  User ${user.id}: ${result.awarded} awarded, ${result.updated} updated`
                )
              }
            } catch (error) {
              this.logger.error(`Error evaluating user ${user.id}: ${error.message}`)
            }
          }

          this.logger.info(`Progress: ${processed}/${total} users processed`)
        }

        this.logger.success(
          `✅ Evaluation complete: ${totalAwarded} achievements awarded, ${totalUpdated} progress records updated`
        )
      }
    } catch (error) {
      this.logger.error(`Achievement evaluation failed: ${error.message}`)
      this.exitCode = 1
    }
  }
}
