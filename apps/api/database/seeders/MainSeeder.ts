import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'

export default class MainSeeder extends BaseSeeder {
  private async seed(Seeder: { default: typeof BaseSeeder }) {
    await new Seeder.default(this.client).run()
  }

  public async run() {
    console.log('Starting database seeding...')
    
    // Core data
    await this.seed(await import('./modules/UserSeeder'))
    await this.seed(await import('./modules/OrganizationSeeder'))
    
    // RBAC
    await this.seed(await import('./modules/RoleSeeder'))
    await this.seed(await import('./modules/PermissionSeeder'))
    await this.seed(await import('./modules/RolePermissionSeeder'))
    await this.seed(await import('./modules/UserRoleSeeder'))
    
    // Organization structure
    await this.seed(await import('./modules/TeamSeeder'))
    await this.seed(await import('./modules/OrganizationVolunteerSeeder'))
    await this.seed(await import('./modules/OrganizationInviteSeeder'))
    
    // Events and opportunities
    await this.seed(await import('./modules/OpportunitySeeder'))
    await this.seed(await import('./modules/EventSeeder'))
    await this.seed(await import('./modules/ApplicationSeeder'))
    
    // Training
    await this.seed(await import('./modules/CourseSeeder'))
    await this.seed(await import('./modules/CourseEnrollmentSeeder'))
    
    // Tasks and assignments
    await this.seed(await import('./modules/TaskSeeder'))
    await this.seed(await import('./modules/AssignmentSeeder'))
    
    // Resources
    await this.seed(await import('./modules/ResourceSeeder'))
    await this.seed(await import('./modules/ResourceAssignmentSeeder'))
    
    // Shifts
    await this.seed(await import('./modules/ShiftSeeder'))
    await this.seed(await import('./modules/ShiftTaskSeeder'))
    await this.seed(await import('./modules/ShiftAssignmentSeeder'))
    
    // Tracking
    await this.seed(await import('./modules/VolunteerHourSeeder'))
    await this.seed(await import('./modules/AttendanceSeeder'))
    
    // Feedback and surveys
    await this.seed(await import('./modules/SurveySeeder'))
    await this.seed(await import('./modules/SurveyResponseSeeder'))
    
    // Compliance
    await this.seed(await import('./modules/BackgroundCheckSeeder'))
    await this.seed(await import('./modules/ComplianceDocumentSeeder'))
    await this.seed(await import('./modules/ComplianceRequirementSeeder'))
    
    // Gamification
    await this.seed(await import('./modules/AchievementSeeder'))
    await this.seed(await import('./modules/UserAchievementSeeder'))
    await this.seed(await import('./modules/GamificationBadgeSeeder'))
    await this.seed(await import('./modules/UserBadgeSeeder'))
    
    // Documents
    await this.seed(await import('./modules/DocumentSeeder'))
    await this.seed(await import('./modules/DocumentAcknowledgmentSeeder'))
    
    // Communications
    await this.seed(await import('./modules/CommunicationSeeder'))
    await this.seed(await import('./modules/CommunicationLogSeeder'))
    await this.seed(await import('./modules/EngagementCampaignSeeder'))
    
    // Team membership
    await this.seed(await import('./modules/OrganizationTeamMemberSeeder'))
    
    // Audit and logs
    await this.seed(await import('./modules/AuditLogSeeder'))
    
    // Legacy features
    await this.seed(await import('./modules/TypeSeeder'))
    await this.seed(await import('./modules/HelpRequestSeeder'))
    await this.seed(await import('./modules/OfferSeeder'))
    await this.seed(await import('./modules/CarpoolingAdSeeder'))
    
    // System
    await this.seed(await import('./modules/ContactSubmissionSeeder'))
    await this.seed(await import('./modules/SystemSettingSeeder'))
    await this.seed(await import('./modules/FeatureFlagSeeder'))
    await this.seed(await import('./modules/ApiTokenSeeder'))
    
    // Notifications
    await this.seed(await import('./modules/NotificationSeeder'))

    console.log('Database seeding completed successfully!')
  }
}
