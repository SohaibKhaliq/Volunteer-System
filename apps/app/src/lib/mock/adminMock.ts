// Shared mock data for admin pages
export const dashboardStats = {
  volunteers: 1247,
  events: 42,
  pendingTasks: 156,
  compliance: 94
};

export const activityFeed = [
  { time: '2 min ago', desc: 'New volunteer John Doe registered' },
  { time: '15 min ago', desc: 'Event Community Clean‑up created' },
  { time: '1 h ago', desc: 'Task Distribute flyers marked completed' },
  { time: '3 h ago', desc: 'Compliance document WWCC expired for Jane' },
  { time: '1 day ago', desc: 'Volunteer Alice logged 8 hours' }
];

export const topVolunteers = [
  { name: 'Alice', hours: 120 },
  { name: 'Bob', hours: 98 },
  { name: 'Carol', hours: 85 }
];

export const chartData = [
  { month: 'Jun', volunteers: 980, hours: 400 },
  { month: 'Jul', volunteers: 1020, hours: 600 },
  { month: 'Aug', volunteers: 1080, hours: 720 },
  { month: 'Sep', volunteers: 1125, hours: 830 },
  { month: 'Oct', volunteers: 1180, hours: 940 },
  { month: 'Nov', volunteers: 1247, hours: 1150 }
];

export const eventDistribution = [
  { name: 'Open Events', value: 18 },
  { name: 'Recurring', value: 12 },
  { name: 'One-off', value: 12 }
];

export const chartColors = ['#4f46e5', '#10b981', '#f97316'];

export const commTemplates = Array.from({ length: 15 }).map((_, i) => ({
  id: i + 1,
  name: `Template ${i + 1}`,
  type: ['Welcome', 'Reminder', 'Thank you', 'Follow-up'][i % 4]
}));

export const commScheduled = [
  { id: 1, subject: 'Weekly Update', sendAt: '2025-11-20 09:00' },
  { id: 2, subject: 'Event Reminder', sendAt: '2025-11-22 14:30' },
  { id: 3, subject: 'Survey Invitation', sendAt: '2025-11-25 10:00' },
  { id: 4, subject: 'Certification Expiry', sendAt: '2025-11-28 08:00' },
  { id: 5, subject: 'Night Shift Reminder', sendAt: '2025-12-01 18:00' }
];

export const commHistory = [
  { id: 1, subject: 'Welcome Email', sentAt: '2025-11-10 08:12', status: 'Sent' },
  { id: 2, subject: 'Policy Change', sentAt: '2025-11-12 15:45', status: 'Sent' },
  { id: 3, subject: 'Survey Invitation', sentAt: '2025-11-15 11:20', status: 'Failed' }
];

export const hourEntries = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  volunteer: ['Alice', 'Bob', 'Carol', 'Dave'][i % 4],
  event: ['Food Drive', 'Park Cleanup', 'Community Outreach'][i % 3],
  date: `2025-11-${(i % 28) + 1}`.padStart(10, '0'),
  hours: (i % 6) + 1,
  status: ['Approved', 'Pending', 'Rejected'][i % 3]
}));

export const courses = [
  { id: 1, name: 'First Aid', participants: 45, completed: 30 },
  { id: 2, name: 'Child Safeguarding', participants: 60, completed: 55 },
  { id: 3, name: 'Volunteer Management', participants: 40, completed: 20 },
  { id: 4, name: 'Food Safety', participants: 35, completed: 28 }
];

export const certs = [
  { id: 1, volunteer: 'Alice', type: 'WWCC', expires: '2025-12-01', status: 'Valid' },
  { id: 2, volunteer: 'Bob', type: 'Police Check', expires: '2025-10-15', status: 'Expiring' },
  { id: 3, volunteer: 'Carol', type: 'First Aid', expires: '2024-08-20', status: 'Expired' }
];

export const resources = [
  { id: 1, name: 'First Aid Kits', quantity: 12, status: 'Available' },
  { id: 2, name: 'Water Bottles', quantity: 30, status: 'Low Stock' },
  { id: 3, name: 'Tents', quantity: 5, status: 'Out of Stock' }
];

export const shifts = [
  { id: 1, date: '2025-11-20', time: '09:00 - 13:00', role: 'Food Distribution', volunteers: 5 },
  { id: 2, date: '2025-11-22', time: '14:00 - 18:00', role: 'Community Cleanup', volunteers: 8 },
  { id: 3, date: '2025-11-25', time: '10:00 - 12:00', role: 'Medical Aid', volunteers: 3 }
];

export const surveys = [
  { id: 1, title: 'Volunteer Satisfaction', responses: 120, status: 'Closed' },
  { id: 2, title: 'Event Feedback', responses: 45, status: 'Open' },
  { id: 3, title: 'Training Needs', responses: 30, status: 'Closed' }
];

export const auditLogs = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  action: ['User Created', 'Event Updated', 'Volunteer Deleted'][i % 3],
  user: ['admin', 'alice', 'bob'][i % 3],
  date: `2025-11-${(i % 28) + 1} 0${i % 12}:00`
}));

export const volunteerProfile = {
  name: 'Alice Johnson',
  role: 'Community Volunteer',
  avatar: 'https://i.pravatar.cc/150?img=5',
  hours: 124,
  certifications: ['First Aid', 'Food Safety', 'Volunteer Management'],
  activity: [
    { id: 1, date: '2025-11-20', description: 'Completed shift – Food Distribution' },
    { id: 2, date: '2025-11-18', description: 'Attended training – First Aid' },
    { id: 3, date: '2025-11-15', description: 'Logged 8 volunteer hours' }
  ]
};

export const orgSettings = {
  name: 'Eghata Volunteer Network',
  timezone: 'UTC-5',
  integrations: ['Google Calendar', 'Slack']
};

export default {
  dashboardStats,
  activityFeed,
  topVolunteers,
  chartData,
  eventDistribution,
  chartColors,
  commTemplates,
  commScheduled,
  commHistory,
  hourEntries,
  courses,
  certs,
  resources,
  shifts,
  surveys,
  auditLogs,
  volunteerProfile,
  orgSettings
};
