import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'

export default class MainSeeder extends BaseSeeder {
  private async seed(Seeder: { default: typeof BaseSeeder }) {
    await new Seeder.default(this.client).run()
  }

  public async run() {
    console.log('Starting database seeding...')
    
    // Core data
    await this.seed(await import('./UserSeeder'))
    await this.seed(await import('./OrganizationSeeder'))
    
    // RBAC
    await this.seed(await import('./RoleSeeder'))
    await this.seed(await import('./PermissionSeeder'))
    await this.seed(await import('./RolePermissionSeeder'))
    await this.seed(await import('./UserRoleSeeder'))
    
    // Organization structure
    await this.seed(await import('./TeamSeeder'))
    await this.seed(await import('./OrganizationVolunteerSeeder'))
    await this.seed(await import('./OrganizationInviteSeeder'))
    
    // Events and opportunities
    await this.seed(await import('./OpportunitySeeder'))
    await this.seed(await import('./EventSeeder'))
    await this.seed(await import('./ApplicationSeeder'))
    
    // Training
    await this.seed(await import('./CourseSeeder'))
    await this.seed(await import('./CourseEnrollmentSeeder'))
    
    // Tasks and assignments
    await this.seed(await import('./TaskSeeder'))
    await this.seed(await import('./AssignmentSeeder'))
    
    // Resources
    await this.seed(await import('./ResourceSeeder'))
    await this.seed(await import('./ResourceAssignmentSeeder'))
    
    // Shifts
    await this.seed(await import('./ShiftSeeder'))
    await this.seed(await import('./ShiftTaskSeeder'))
    await this.seed(await import('./ShiftAssignmentSeeder'))
    
    // Tracking
    await this.seed(await import('./VolunteerHourSeeder'))
    await this.seed(await import('./AttendanceSeeder'))
    
    // Feedback and surveys
    await this.seed(await import('./SurveySeeder'))
    await this.seed(await import('./SurveyResponseSeeder'))
    
    // Compliance
    await this.seed(await import('./BackgroundCheckSeeder'))
    await this.seed(await import('./ComplianceDocumentSeeder'))
    await this.seed(await import('./ComplianceRequirementSeeder'))
    
    // Gamification
    await this.seed(await import('./AchievementSeeder'))
    
    // Notifications
    await this.seed(await import('./NotificationSeeder'))

    console.log('Database seeding completed successfully!')
  }
}
