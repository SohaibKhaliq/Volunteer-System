import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'

export default class MainSeeder extends BaseSeeder {
  private async seed(Seeder: { default: typeof BaseSeeder }) {
    await new Seeder.default(this.client).run()
  }

  public async run() {
    console.log('Starting database seeding...')
    
    await this.seed(await import('./UserSeeder'))
    await this.seed(await import('./OrganizationSeeder'))
    await this.seed(await import('./TeamSeeder'))
    await this.seed(await import('./OrganizationVolunteerSeeder'))
    await this.seed(await import('./OpportunitySeeder'))
    await this.seed(await import('./EventSeeder'))
    await this.seed(await import('./ApplicationSeeder'))
    await this.seed(await import('./CourseSeeder'))
    await this.seed(await import('./CourseEnrollmentSeeder'))
    await this.seed(await import('./TaskSeeder'))
    await this.seed(await import('./VolunteerHourSeeder'))
    await this.seed(await import('./AttendanceSeeder'))
    await this.seed(await import('./NotificationSeeder'))

    console.log('Database seeding completed successfully!')
  }
}
