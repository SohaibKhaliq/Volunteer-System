import GamificationBadge from 'App/Models/GamificationBadge'
import UserBadge from 'App/Models/UserBadge'
import User from 'App/Models/User'
import Event from '@ioc:Adonis/Core/Event'

export default class GamificationService {

  /**
   * Process shift completion for XP and Badges
   */
  public async processShiftCompletion(userId: number, shiftDurationHours: number) {
    const user = await User.find(userId)
    if (!user) return

    // 1. Award XP (e.g. 10 XP per hour)
    const xpEarned = Math.floor(shiftDurationHours * 10)
    // Assuming user has an XP column or we store it elsewhere.

    // 2. Check for Badges
    await this.checkBadges(user, xpEarned)
  }

  /**
   * Check all badges against user stats
   */
  private async checkBadges(user: User, recentXp: number) {
    const allBadges = await GamificationBadge.all()

    // Get user's existing badges
    const userBadges = await UserBadge.query().where('userId', user.id)
    const ownedBadgeIds = new Set(userBadges.map(ub => ub.badgeId))

    for (const badge of allBadges) {
        if (ownedBadgeIds.has(badge.id)) continue;

        let rules: any = {}
        try {
            if (typeof badge.rulesJson === 'object') {
                rules = badge.rulesJson
            } else {
                rules = JSON.parse(badge.rulesJson)
            }
        } catch (e) {
            console.error(\`Invalid rules JSON for badge \${badge.id}\`)
            continue
        }

        // Simple Rule Engine
        let awarded = false

        if (rules.type === 'total_hours') {
            // Mock: fetching total hours
            const totalHours = 100
            if (totalHours >= rules.threshold) awarded = true
        } else if (rules.type === 'first_shift') {
            awarded = true
        }

        if (awarded) {
            await UserBadge.create({
                userId: user.id,
                badgeId: badge.id
            })
            // Emit event for real-time notification
            Event.emit('badge:awarded', { userId: user.id, badge })
        }
    }
  }
}
