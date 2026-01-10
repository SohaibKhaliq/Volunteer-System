import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class CourseSeeder extends BaseSeeder {
  public async run() {
    const RECORD_COUNT = 150 // Increased from 50

    const courseData = [
      {
        title: 'First Aid Certification',
        description: 'Learn essential first aid and CPR techniques',
        instructor: 'Dr. Sarah Mitchell',
        daysFromNow: 14,
        durationDays: 2
      },
      {
        title: 'Mental Health First Aid',
        description: 'Supporting people experiencing mental health crises',
        instructor: 'James Anderson',
        daysFromNow: 21,
        durationDays: 1
      },
      {
        title: 'Volunteer Leadership Training',
        description: 'Develop leadership skills for volunteer coordinators',
        instructor: 'Michelle Wong',
        daysFromNow: 30,
        durationDays: 3
      },
      {
        title: 'Food Safety and Handling',
        description: 'Safe food preparation and hygiene practices',
        instructor: 'Chef Marco Rossi',
        daysFromNow: 10,
        durationDays: 1
      },
      {
        title: 'Youth Mentoring Skills',
        description: 'Effective mentoring techniques for working with young people',
        instructor: 'Dr. Lisa Chen',
        daysFromNow: 25,
        durationDays: 2
      },
      {
        title: 'Wildlife Rescue Training',
        description: 'Learn to safely handle and transport injured wildlife',
        instructor: 'Dr. Robert Hughes',
        daysFromNow: 35,
        durationDays: 3
      },
      {
        title: 'Grant Writing Workshop',
        description: 'Write compelling grant proposals for funding',
        instructor: 'Amanda Thompson',
        daysFromNow: 18,
        durationDays: 2
      },
      {
        title: 'Community Engagement Strategies',
        description: 'Effective methods for engaging community members',
        instructor: 'David Patel',
        daysFromNow: 22,
        durationDays: 1
      },
      {
        title: 'Event Management Fundamentals',
        description: 'Plan and execute successful community events',
        instructor: 'Emily Clarke',
        daysFromNow: 28,
        durationDays: 2
      },
      {
        title: 'Social Media for Nonprofits',
        description: 'Leverage social media to promote your cause',
        instructor: 'Alex Turner',
        daysFromNow: 12,
        durationDays: 1
      },
      {
        title: 'Conflict Resolution Skills',
        description: 'Handle disputes and difficult situations effectively',
        instructor: 'Dr. Patricia Green',
        daysFromNow: 40,
        durationDays: 2
      },
      {
        title: 'Fundraising Strategies',
        description: 'Modern fundraising techniques for nonprofits',
        instructor: 'Michael Roberts',
        daysFromNow: 33,
        durationDays: 2
      },
      {
        title: 'Trauma-Informed Care',
        description: 'Understanding and responding to trauma in vulnerable populations',
        instructor: 'Dr. Helen Williams',
        daysFromNow: 45,
        durationDays: 3
      },
      {
        title: 'Environmental Conservation Basics',
        description: 'Introduction to conservation and sustainability',
        instructor: 'Dr. Tom Parker',
        daysFromNow: 15,
        durationDays: 2
      },
      {
        title: 'Disability Awareness Training',
        description: 'Creating inclusive environments for people with disabilities',
        instructor: 'Rebecca Foster',
        daysFromNow: 20,
        durationDays: 1
      },
      {
        title: 'Emergency Response Coordination',
        description: 'Coordinate emergency response efforts effectively',
        instructor: 'Captain John Davis',
        daysFromNow: 50,
        durationDays: 3
      },
      {
        title: 'Cultural Competency Workshop',
        description: 'Working effectively across diverse cultures',
        instructor: 'Dr. Maya Singh',
        daysFromNow: 27,
        durationDays: 1
      },
      {
        title: 'Child Protection Training',
        description: 'Safeguarding children in volunteer programs',
        instructor: 'Jennifer Martin',
        daysFromNow: 16,
        durationDays: 1
      },
      {
        title: 'Financial Literacy Education',
        description: 'Teaching financial skills to community members',
        instructor: 'Andrew Wilson',
        daysFromNow: 24,
        durationDays: 2
      },
      {
        title: 'Volunteer Management',
        description: 'Recruit, train, and retain volunteers effectively',
        instructor: 'Karen Brown',
        daysFromNow: 19,
        durationDays: 2
      },
      {
        title: 'Public Speaking Skills',
        description: 'Deliver confident and engaging presentations',
        instructor: 'Richard Scott',
        daysFromNow: 31,
        durationDays: 1
      },
      {
        title: 'Digital Literacy Teaching',
        description: 'Help others learn essential computer skills',
        instructor: 'Susan Taylor',
        daysFromNow: 23,
        durationDays: 2
      },
      {
        title: 'Community Needs Assessment',
        description: 'Identify and evaluate community needs',
        instructor: 'Dr. Paul Harris',
        daysFromNow: 38,
        durationDays: 2
      },
      {
        title: 'Advocacy and Lobbying Skills',
        description: 'Advocate effectively for policy change',
        instructor: 'Monica Lewis',
        daysFromNow: 42,
        durationDays: 2
      },
      {
        title: 'Volunteer Safety and Wellbeing',
        description: 'Protecting volunteer health and safety',
        instructor: 'Dr. Chris Allen',
        daysFromNow: 17,
        durationDays: 1
      },
      {
        title: 'Team Building Workshop',
        description: 'Build cohesive and effective volunteer teams',
        instructor: 'Jessica Moore',
        daysFromNow: 26,
        durationDays: 1
      },
      {
        title: 'Photography for Nonprofits',
        description: 'Capture compelling images for your organization',
        instructor: 'Mark Johnson',
        daysFromNow: 29,
        durationDays: 1
      },
      {
        title: 'Data Management for Volunteers',
        description: 'Track and analyze volunteer data effectively',
        instructor: 'Linda White',
        daysFromNow: 34,
        durationDays: 2
      },
      {
        title: 'Indigenous Cultural Awareness',
        description: 'Understanding and respecting Indigenous cultures',
        instructor: 'Elder William Thompson',
        daysFromNow: 48,
        durationDays: 2
      },
      {
        title: 'Animal Behavior and Handling',
        description: 'Safely interact with domestic and wild animals',
        instructor: 'Dr. Sophie Anderson',
        daysFromNow: 37,
        durationDays: 2
      },
      {
        title: 'Marine Conservation Workshop',
        description: 'Protecting ocean ecosystems and marine life',
        instructor: 'Dr. Nathan Cooper',
        daysFromNow: 44,
        durationDays: 3
      },
      {
        title: 'Legal Rights and Responsibilities',
        description: 'Understanding legal issues in volunteering',
        instructor: 'Attorney Sarah King',
        daysFromNow: 36,
        durationDays: 1
      },
      {
        title: 'Counselling Skills Basics',
        description: 'Basic counselling techniques for support workers',
        instructor: 'Dr. Emma Wright',
        daysFromNow: 47,
        durationDays: 3
      },
      {
        title: 'Project Management Essentials',
        description: 'Manage volunteer projects from start to finish',
        instructor: 'Peter Robinson',
        daysFromNow: 32,
        durationDays: 2
      },
      {
        title: 'Interviewing and Assessment',
        description: 'Conduct effective volunteer interviews',
        instructor: 'Christine Evans',
        daysFromNow: 21,
        durationDays: 1
      },
      {
        title: 'Sustainability in Operations',
        description: 'Make your organization more environmentally friendly',
        instructor: 'Dr. Rachel Green',
        daysFromNow: 39,
        durationDays: 2
      },
      {
        title: 'Communication Skills Workshop',
        description: 'Enhance verbal and written communication',
        instructor: 'Daniel Baker',
        daysFromNow: 13,
        durationDays: 1
      },
      {
        title: 'Crisis Management Training',
        description: 'Respond effectively to organizational crises',
        instructor: 'Captain Mary Collins',
        daysFromNow: 46,
        durationDays: 2
      },
      {
        title: 'Volunteer Recognition Programs',
        description: 'Create meaningful volunteer recognition initiatives',
        instructor: 'Angela Murphy',
        daysFromNow: 11,
        durationDays: 1
      },
      {
        title: 'Ethical Decision Making',
        description: 'Navigate ethical dilemmas in volunteer work',
        instructor: 'Dr. Simon Phillips',
        daysFromNow: 41,
        durationDays: 1
      },
      {
        title: 'Community Garden Management',
        description: 'Establish and maintain successful community gardens',
        instructor: 'Jane Stewart',
        daysFromNow: 9,
        durationDays: 2
      },
      {
        title: 'Youth Program Development',
        description: 'Design engaging programs for young people',
        instructor: 'Brad Turner',
        daysFromNow: 43,
        durationDays: 2
      },
      {
        title: 'Seniors Care and Support',
        description: 'Provide quality care for elderly community members',
        instructor: 'Dr. Margaret Powell',
        daysFromNow: 49,
        durationDays: 2
      },
      {
        title: 'Refugee Support Training',
        description: 'Support refugees in settlement and integration',
        instructor: 'Omar Hassan',
        daysFromNow: 8,
        durationDays: 2
      },
      {
        title: 'Homework Club Facilitation',
        description: 'Run effective after-school homework clubs',
        instructor: 'Kelly Barnes',
        daysFromNow: 7,
        durationDays: 1
      },
      {
        title: 'Sport Coaching Certification',
        description: 'Coach community sports programs safely',
        instructor: 'Coach Steve Miller',
        daysFromNow: 51,
        durationDays: 3
      },
      {
        title: 'Music Therapy Basics',
        description: 'Use music therapeutically in care settings',
        instructor: 'Dr. Nina Foster',
        daysFromNow: 6,
        durationDays: 2
      },
      {
        title: 'Art Therapy Workshop',
        description: 'Facilitate healing through creative arts',
        instructor: 'Maria Rodriguez',
        daysFromNow: 52,
        durationDays: 2
      },
      {
        title: 'Homelessness Understanding',
        description: 'Understanding causes and solutions to homelessness',
        instructor: 'Dr. Kevin Price',
        daysFromNow: 5,
        durationDays: 1
      },
      {
        title: 'Board Governance Training',
        description: 'Effective governance for nonprofit boards',
        instructor: 'Elizabeth Ward',
        daysFromNow: 53,
        durationDays: 2
      }
    ]

    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const rows = courseData.slice(0, RECORD_COUNT).map((course) => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + course.daysFromNow)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + course.durationDays)

      return {
        title: course.title,
        description: course.description,
        instructor: course.instructor,
        start_at: startDate.toISOString().slice(0, 19).replace('T', ' '),
        end_at: endDate.toISOString().slice(0, 19).replace('T', ' '),
        capacity: Math.floor(Math.random() * 20) + 15,
        status: 'Open',
        created_at: timestamp,
        updated_at: timestamp
      }
    })

    if (!rows.length) {
      console.log('CourseSeeder: no rows to insert')
      return
    }

    const placeholders = rows.map(() => '(?,?,?,?,?,?,?,?,?)').join(',')
    const sql =
      'INSERT INTO courses (title,description,instructor,start_at,end_at,capacity,status,created_at,updated_at) VALUES ' +
      placeholders +
      ' ON DUPLICATE KEY UPDATE description=VALUES(description),instructor=VALUES(instructor),start_at=VALUES(start_at),end_at=VALUES(end_at),capacity=VALUES(capacity),status=VALUES(status),updated_at=VALUES(updated_at)'

    const bindings = rows.flatMap((row) => [
      row.title,
      row.description,
      row.instructor,
      row.start_at,
      row.end_at,
      row.capacity,
      row.status,
      row.created_at,
      row.updated_at
    ])

    const trx = await Database.transaction()
    try {
      await trx.rawQuery(sql, bindings)
      await trx.commit()
      console.log(`CourseSeeder: upserted ${rows.length} courses`)
    } catch (error) {
      await trx.rollback()
      console.error('CourseSeeder failed', error)
      throw error
    }
  }
}
