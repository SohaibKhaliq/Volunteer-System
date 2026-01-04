import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class AchievementSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 30
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const achievements = [
      { name: 'First Event', description: 'Attended your first volunteer event', category: 'milestone', points: 10, icon: '🎉', requirement: 'events_attended:1' },
      { name: '10 Hours Volunteer', description: 'Completed 10 hours of volunteering', category: 'hours', points: 20, icon: '⏰', requirement: 'hours_completed:10' },
      { name: '50 Hours Volunteer', description: 'Completed 50 hours of volunteering', category: 'hours', points: 50, icon: '⭐', requirement: 'hours_completed:50' },
      { name: '100 Hours Volunteer', description: 'Completed 100 hours of volunteering', category: 'hours', points: 100, icon: '🏆', requirement: 'hours_completed:100' },
      { name: 'Team Player', description: 'Joined a volunteer team', category: 'teamwork', points: 15, icon: '🤝', requirement: 'teams_joined:1' },
      { name: 'Loyal Volunteer', description: 'Volunteered for 1 year', category: 'loyalty', points: 75, icon: '💚', requirement: 'days_active:365' },
      { name: 'Early Bird', description: 'Checked in early 5 times', category: 'punctuality', points: 10, icon: '🐦', requirement: 'early_checkins:5' },
      { name: 'Course Completer', description: 'Completed your first training course', category: 'training', points: 25, icon: '📚', requirement: 'courses_completed:1' },
      { name: 'Certified Volunteer', description: 'Obtained 3 certifications', category: 'training', points: 50, icon: '🎓', requirement: 'certifications:3' },
      { name: 'Event Organizer', description: 'Helped organize an event', category: 'leadership', points: 40, icon: '📋', requirement: 'events_organized:1' },
      { name: 'Survey Superstar', description: 'Completed 5 feedback surveys', category: 'feedback', points: 15, icon: '📝', requirement: 'surveys_completed:5' },
      { name: 'Community Champion', description: 'Volunteered at 10 different events', category: 'variety', points: 60, icon: '🌟', requirement: 'unique_events:10' },
      { name: 'Helpful Hand', description: 'Assisted 10 people directly', category: 'impact', points: 30, icon: '🙌', requirement: 'people_helped:10' },
      { name: 'Perfect Attendance', description: 'Perfect attendance for a month', category: 'reliability', points: 35, icon: '✅', requirement: 'perfect_months:1' },
      { name: 'Marathon Volunteer', description: 'Completed 200 hours of volunteering', category: 'hours', points: 150, icon: '🏃', requirement: 'hours_completed:200' },
      { name: 'Night Owl', description: 'Completed 5 evening shifts', category: 'dedication', points: 20, icon: '🦉', requirement: 'evening_shifts:5' },
      { name: 'Weekend Warrior', description: 'Volunteered 10 weekends', category: 'dedication', points: 25, icon: '⚔️', requirement: 'weekend_shifts:10' },
      { name: 'Resource Master', description: 'Managed resources for 5 events', category: 'management', points: 30, icon: '📦', requirement: 'resources_managed:5' },
      { name: 'Safety First', description: 'Completed safety training', category: 'training', points: 20, icon: '🦺', requirement: 'safety_trained:1' },
      { name: 'Diversity Champion', description: 'Worked with 5 different organizations', category: 'variety', points: 45, icon: '🌈', requirement: 'organizations:5' },
      { name: 'Mentor', description: 'Mentored a new volunteer', category: 'leadership', points: 35, icon: '👨‍🏫', requirement: 'volunteers_mentored:1' },
      { name: 'Social Butterfly', description: 'Attended 3 social events', category: 'engagement', points: 15, icon: '🦋', requirement: 'social_events:3' },
      { name: 'Going the Extra Mile', description: 'Exceeded expected hours in a shift', category: 'dedication', points: 25, icon: '🚶', requirement: 'overtime_shifts:5' },
      { name: 'Fundraising Star', description: 'Participated in fundraising event', category: 'impact', points: 40, icon: '💰', requirement: 'fundraising_events:1' },
      { name: 'Environmental Hero', description: 'Participated in 3 environmental activities', category: 'impact', points: 30, icon: '🌱', requirement: 'environmental_events:3' },
      { name: 'Youth Supporter', description: 'Worked with youth programs 5 times', category: 'impact', points: 35, icon: '👶', requirement: 'youth_programs:5' },
      { name: 'Senior Care Champion', description: 'Assisted senior citizens 5 times', category: 'impact', points: 35, icon: '👴', requirement: 'senior_care:5' },
      { name: 'Tech Savvy', description: 'Used digital tools for volunteering', category: 'skills', points: 20, icon: '💻', requirement: 'digital_tasks:5' },
      { name: 'Ambassador', description: 'Referred 3 new volunteers', category: 'recruitment', points: 50, icon: '📣', requirement: 'referrals:3' },
      { name: 'Quick Learner', description: 'Completed induction in record time', category: 'training', points: 15, icon: '⚡', requirement: 'fast_induction:1' }
    ]

    const rows = achievements.slice(0, RECORD_COUNT).map((achievement) => ({
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      points: achievement.points,
      icon: achievement.icon,
      requirement: achievement.requirement,
      is_active: 1,
      created_at: timestamp,
      updated_at: timestamp
    }))

    if (!rows.length) {
      console.log('AchievementSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?)').join(',')
    const sql = 'INSERT INTO achievements (name,description,category,points,icon,requirement_json,is_active,created_at,updated_at) VALUES ' + placeholders +
      ' ON DUPLICATE KEY UPDATE description=VALUES(description),points=VALUES(points),is_active=VALUES(is_active),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [row.name, row.description, row.category, row.points, row.icon, row.requirement, row.is_active, row.created_at, row.updated_at])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`AchievementSeeder: upserted ${rows.length} achievements`)
    } catch (error) {
      await trx.rollback()
      console.error('AchievementSeeder failed', error)
      throw error
    }
  }
}
