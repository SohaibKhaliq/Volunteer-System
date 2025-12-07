import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Type from '../../app/Models/Type'
import { RequestTypes } from '../../contracts/requests'

export default class extends BaseSeeder {
  public async run() {
    this.logger.info('Type seeder disabled — using 000_all_australia_seeder instead')
    return
  }
}
