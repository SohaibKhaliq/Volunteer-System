import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class GamificationBadgeSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 25
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const badges = [
      { name: 'Rising Star', category: 'performance', points: 100, icon: '⭐', criteria: 'Complete 10 tasks in first month' },
      { name: 'Dedication Medal', category: 'commitment', points: 200, icon: '🏅', criteria: '6 months of continuous service' },
      { name: 'Team Champion', category: 'teamwork', points: 150, icon: '🏆', criteria: 'Lead 5 successful team projects' },
      { name: 'Early Adopter', category: 'milestone', points: 50, icon: '🎯', criteria: 'First 100 volunteers to join' },
      { name: 'Mentor Master', category: 'leadership', points: 250, icon: '👨‍🏫', criteria: 'Successfully mentor 5 volunteers' },
      { name: 'Century Club', category: 'hours', points: 500, icon: '💯', criteria: '100 hours of volunteering' },
      { name: 'Perfect Attendance', category: 'reliability', points: 100, icon: '✅', criteria: 'No missed shifts for 3 months' },
      { name: 'Skill Master', category: 'training', points: 200, icon: '🎓', criteria: 'Complete 5 training courses' },
      { name: 'Community Hero', category: 'impact', points: 300, icon: '🦸', criteria: 'Impact 100+ lives' },
      { name: 'Sustainability Champion', category: 'impact', points: 150, icon: '🌱', criteria: '10 environmental activities' },
      { name: 'Night Owl', category: 'dedication', points: 75, icon: '🦉', criteria: '20 evening/night shifts' },
      { name: 'Weekend Warrior', category: 'dedication', points: 75, icon: '⚔️', criteria: '25 weekend shifts' },
      { name: 'Safety First', category: 'compliance', points: 100, icon: '🦺', criteria: 'Zero safety incidents for 1 year' },
      { name: 'Innovator', category: 'creativity', points: 175, icon: '💡', criteria: 'Propose 3 implemented ideas' },
      { name: 'Event Master', category: 'expertise', points: 200, icon: '🎪', criteria: 'Plan 5 major events' },
      { name: 'Fundraiser', category: 'impact', points: 250, icon: '💰', criteria: 'Raise $10,000 for the cause' },
      { name: 'Ambassador', category: 'recruitment', points: 150, icon: '📣', criteria: 'Recruit 10 volunteers' },
      { name: 'Diversity Champion', category: 'inclusion', points: 125, icon: '🌈', criteria: 'Promote diversity initiatives' },
      { name: 'Tech Guru', category: 'skills', points: 100, icon: '💻', criteria: 'Support 50 digital tasks' },
      { name: 'Wellness Advocate', category: 'wellbeing', points: 100, icon: '🧘', criteria: 'Lead 10 wellness activities' },
      { name: 'Youth Supporter', category: 'impact', points: 150, icon: '👶', criteria: '50 hours youth programs' },
      { name: 'Senior Care Star', category: 'impact', points: 150, icon: '👴', criteria: '50 hours senior care' },
      { name: 'All-Rounder', category: 'versatility', points: 200, icon: '🌟', criteria: 'Volunteer in 10 different roles' },
      { name: 'Loyal Veteran', category: 'loyalty', points: 500, icon: '💚', criteria: '5 years of service' },
      { name: 'Legendary', category: 'elite', points: 1000, icon: '👑', criteria: 'All achievements unlocked' }
    ]

    const rows = badges.slice(0, RECORD_COUNT).map((badge, index) => ({
      name: badge.name,
      description: badge.criteria,
      category: badge.category,
      points: badge.points,
      icon: badge.icon,
      criteria_json: JSON.stringify({ requirement: badge.criteria }),
      rarity: index < 5 ? 'common' : index < 15 ? 'rare' : 'legendary',
      is_active: 1,
      display_order: index + 1,
      created_at: timestamp,
      updated_at: timestamp
    }))

    if (!rows.length) {
      console.log('GamificationBadgeSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO gamification_badges (name,description,category,points,icon,criteria_json,rarity,is_active,display_order,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE description=VALUES(description),points=VALUES(points),is_active=VALUES(is_active),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.name, row.description, row.category, row.points, row.icon, row.criteria_json, row.rarity, row.is_active, row.display_order, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`GamificationBadgeSeeder: upserted ${rows.length} badges`)
    } catch (error) {
      await trx.rollback()
      console.error('GamificationBadgeSeeder failed', error)
      throw error
    }
  }
}
