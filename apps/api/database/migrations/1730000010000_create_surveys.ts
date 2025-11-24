import BaseSchema from '@ioc:Adonis/Lucid/Schema'

// No-op migration: surveys table already exists in earlier migration.
export default class CreateSurveys extends BaseSchema {
  public async up() {
    return
  }

  public async down() {
    return
  }
}
