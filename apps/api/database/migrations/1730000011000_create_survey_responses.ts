import BaseSchema from '@ioc:Adonis/Lucid/Schema'

// No-op migration: survey_responses table already exists in earlier migration.
export default class CreateSurveyResponses extends BaseSchema {
  public async up() {
    return
  }

  public async down() {
    return
  }
}
