import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ResourceSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 50

    const resources = [
      { name: 'Toyota Hiace Van (White)', category: 'Transport', qty: 1, location: 'Sydney Depot', serial: 'VAN-001' },
      { name: 'Community Bus (12 Seats)', category: 'Transport', qty: 1, location: 'Melbourne HQ', serial: 'BUS-001' },
      { name: 'Delivery Van', category: 'Transport', qty: 2, location: 'Brisbane Centre', serial: 'VAN-002' },
      { name: 'Event Tent (6x6m)', category: 'Equipment', qty: 5, location: 'Perth Warehouse', serial: null },
      { name: 'Folding Tables', category: 'Equipment', qty: 30, location: 'Adelaide Storage', serial: null },
      { name: 'Folding Chairs', category: 'Equipment', qty: 150, location: 'Adelaide Storage', serial: null },
      { name: 'PA System with Microphones', category: 'Technology', qty: 2, location: 'Hobart Office', serial: 'AUDIO-001' },
      { name: 'Portable Generator', category: 'Equipment', qty: 3, location: 'Darwin Depot', serial: 'GEN-001' },
      { name: 'First Aid Kit (Large)', category: 'Medical', qty: 20, location: 'All Locations', serial: null },
      { name: 'Tool Kit', category: 'Equipment', qty: 10, location: 'Workshop', serial: null },
      { name: 'Laptop (Dell)', category: 'Technology', qty: 15, location: 'Office', serial: 'LAP-001' },
      { name: 'Projector with Screen', category: 'Technology', qty: 5, location: 'Training Room', serial: 'PROJ-001' },
      { name: 'Cooler Boxes', category: 'Equipment', qty: 20, location: 'Kitchen Storage', serial: null },
      { name: 'BBQ Equipment', category: 'Equipment', qty: 4, location: 'Outdoor Area', serial: 'BBQ-001' },
      { name: 'Portable Toilet Units', category: 'Facilities', qty: 6, location: 'Event Services', serial: 'TOILET-001' },
      { name: 'Hand Sanitizer Stations', category: 'Medical', qty: 15, location: 'Warehouse', serial: null },
      { name: 'Safety Vests (Hi-Vis)', category: 'Safety', qty: 100, location: 'Safety Store', serial: null },
      { name: 'Hard Hats', category: 'Safety', qty: 50, location: 'Safety Store', serial: null },
      { name: 'Traffic Cones', category: 'Safety', qty: 40, location: 'Transport Depot', serial: null },
      { name: 'Marquee Gazebos', category: 'Equipment', qty: 8, location: 'Event Storage', serial: null },
      { name: 'Banner Stands', category: 'Marketing', qty: 12, location: 'Marketing Office', serial: null },
      { name: 'Digital Camera (Canon)', category: 'Technology', qty: 6, location: 'Media Room', serial: 'CAM-001' },
      { name: 'Walkie Talkies Set', category: 'Technology', qty: 10, location: 'Communications', serial: 'RADIO-001' },
      { name: 'Extension Cords (20m)', category: 'Equipment', qty: 25, location: 'Electrical Store', serial: null },
      { name: 'Outdoor Lighting', category: 'Equipment', qty: 12, location: 'Event Equipment', serial: 'LIGHT-001' },
      { name: 'Whiteboard Easels', category: 'Office', qty: 8, location: 'Training Rooms', serial: null },
      { name: 'Sports Equipment Box', category: 'Recreation', qty: 10, location: 'Youth Centre', serial: null },
      { name: 'Garden Tools Set', category: 'Maintenance', qty: 15, location: 'Garden Shed', serial: null },
      { name: 'Wheelbarrows', category: 'Maintenance', qty: 8, location: 'Garden Shed', serial: null },
      { name: 'Cleaning Supplies Cart', category: 'Maintenance', qty: 12, location: 'Janitorial', serial: null },
      { name: 'Water Tanks (1000L)', category: 'Facilities', qty: 4, location: 'Outdoor Storage', serial: 'TANK-001' },
      { name: 'Portable Stage Sections', category: 'Equipment', qty: 20, location: 'Event Warehouse', serial: null },
      { name: 'Sound System Speakers', category: 'Technology', qty: 8, location: 'AV Department', serial: 'SPEAK-001' },
      { name: 'Tablecloths (Various)', category: 'Supplies', qty: 60, location: 'Linen Store', serial: null },
      { name: 'Food Service Equipment', category: 'Kitchen', qty: 1, location: 'Commercial Kitchen', serial: 'KITCHEN-001' },
      { name: 'Mobile Phone Chargers', category: 'Technology', qty: 30, location: 'Equipment Room', serial: null },
      { name: 'Binoculars', category: 'Equipment', qty: 6, location: 'Wildlife Centre', serial: 'BIN-001' },
      { name: 'Medical Stretcher', category: 'Medical', qty: 4, location: 'First Aid Station', serial: 'STRETCH-001' },
      { name: 'Fire Extinguishers', category: 'Safety', qty: 25, location: 'All Buildings', serial: 'FIRE-001' },
      { name: 'Signage Boards', category: 'Marketing', qty: 30, location: 'Storage Room', serial: null },
      { name: 'Portable Barriers', category: 'Safety', qty: 50, location: 'Event Store', serial: null },
      { name: 'Canopy Weights', category: 'Equipment', qty: 40, location: 'Event Equipment', serial: null },
      { name: 'Registration Tablets', category: 'Technology', qty: 10, location: 'Admin Office', serial: 'TAB-001' },
      { name: 'Name Badge Printers', category: 'Technology', qty: 4, location: 'Reception', serial: 'BADGE-001' },
      { name: 'Recycling Bins', category: 'Facilities', qty: 50, location: 'All Locations', serial: null },
      { name: 'Compost Bins', category: 'Facilities', qty: 10, location: 'Garden Areas', serial: null },
      { name: 'Ladders (Various)', category: 'Maintenance', qty: 12, location: 'Maintenance Store', serial: null },
      { name: 'Wheelchair (Standard)', category: 'Accessibility', qty: 6, location: 'Accessibility Office', serial: 'CHAIR-001' },
      { name: 'Hearing Loop System', category: 'Accessibility', qty: 3, location: 'AV Room', serial: 'LOOP-001' },
      { name: 'Defibrillator (AED)', category: 'Medical', qty: 8, location: 'Emergency Stations', serial: 'AED-001' }
    ]

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const orgsResult = await Database.rawQuery('SELECT id FROM organizations ORDER BY id ASC LIMIT 50')
    const orgIds = orgsResult[0].map((row: any) => row.id)

    if (orgIds.length === 0) {
      console.log('ResourceSeeder: no organizations found, skipping')
      return
    }

    const statuses = ['available', 'in_use', 'maintenance', 'reserved']

    const rows = resources.slice(0, RECORD_COUNT).map((res, index) => {
      const maintenanceDue = ['Transport', 'Technology', 'Medical'].includes(res.category)
        ? new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
        : null

      return {
        organization_id: orgIds[index % orgIds.length],
        name: res.name,
        category: res.category,
        description: `${res.category} resource for organizational use`,
        quantity_total: res.qty,
        quantity_available: Math.floor(res.qty * (0.6 + Math.random() * 0.4)),
        location: res.location,
        serial_number: res.serial,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        maintenance_due: maintenanceDue,
        created_at: timestamp,
        updated_at: timestamp
      }
    })

    if (!rows.length) {
      console.log('ResourceSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO resources (organization_id,name,category,description,quantity_total,quantity_available,location,serial_number,status,maintenance_due,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE description=VALUES(description),quantity_total=VALUES(quantity_total),quantity_available=VALUES(quantity_available),status=VALUES(status),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.organization_id,
      row.name,
      row.category,
      row.description,
      row.quantity_total,
      row.quantity_available,
      row.location,
      row.serial_number,
      row.status,
      row.maintenance_due,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`ResourceSeeder: upserted ${rows.length} resources`)
    } catch (error) {
      await trx.rollback()
      console.error('ResourceSeeder failed', error)
      throw error
    }
  }
}
