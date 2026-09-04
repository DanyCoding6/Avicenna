// Demo dataset: a believable cohort so every screen renders before Supabase is connected.
// All dates are relative to "now" so the demo never goes stale.
const now = new Date();
const at = (days, hour = 10, minute = 0) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(hour, minute, 0, 0); return d.toISOString(); };
const thisMonth = (day, hour = 10) => { const d = new Date(now.getFullYear(), now.getMonth(), day, hour, 0, 0, 0); return d.toISOString(); };
const daysAgo = (n, hour = 12) => at(-n, hour);

export const ME_ID = 's-aisha';

export const scholars = [
  { id: ME_ID, full_name: 'Aisha Rahman', email: 'aisha@example.org', university: 'University of Manchester', subject: 'Medicine', year_of_study: 2, cohort: '2024', role: 'scholar', coach_id: 'c-yusuf', mentor_id: 'm-samira', currently: '2nd year Medicine · summer research placement at NHS England', bio: 'Interested in health inequalities and community medicine. Manchester-born, Cheetham Hill raised.', linkedin_url: 'https://linkedin.com/in/', phone: '07700 900123', phone_visible: true, interests: ['Health policy', 'Community', 'Writing'] },
  { id: 's-ibrahim', full_name: 'Ibrahim Chowdhury', university: 'University College London', subject: 'Law', year_of_study: 2, cohort: '2024', role: 'scholar', currently: 'Vacation scheme applications · mooting captain', interests: ['Human rights', 'Debating'] },
  { id: 's-maryam', full_name: 'Maryam Siddiqui', university: 'University of Oxford', subject: 'PPE', year_of_study: 2, cohort: '2024', role: 'scholar', currently: 'Editing the college magazine · reading Ibn Khaldun', interests: ['Political theory', 'Journalism'] },
  { id: 's-yahya', full_name: 'Yahya Begum', university: 'Imperial College London', subject: 'Computing', year_of_study: 2, cohort: '2024', role: 'scholar', currently: 'Building a Quran memorisation app · hackathon season', interests: ['AI', 'Product'] },
  { id: 's-hafsa', full_name: 'Hafsa Mahmood', university: 'University of Leeds', subject: 'Architecture', year_of_study: 2, cohort: '2024', role: 'scholar', currently: 'Studio project on mosque acoustics', interests: ['Design', 'Islamic art'] },
  { id: 's-bilal', full_name: 'Bilal Ahmed', university: 'University of Birmingham', subject: 'Economics', year_of_study: 2, cohort: '2024', role: 'scholar', currently: 'Spring week at the Bank of England', interests: ['Finance', 'Football'] },
  { id: 's-zainab', full_name: 'Zainab Hussain', university: 'King\'s College London', subject: 'International Relations', year_of_study: 3, cohort: '2023', role: 'scholar', currently: 'Dissertation on Gulf diplomacy · UN Youth Delegate applicant', interests: ['Diplomacy', 'Arabic'] },
  { id: 's-omar', full_name: 'Omar Farooq', university: 'University of Cambridge', subject: 'Natural Sciences', year_of_study: 3, cohort: '2023', role: 'scholar', currently: 'Part II Chemistry · lab placement at AstraZeneca', interests: ['Research', 'Climbing'] },
  { id: 's-sumaya', full_name: 'Sumaya Ali', university: 'London School of Economics', subject: 'Social Policy', year_of_study: 3, cohort: '2023', role: 'scholar', currently: 'Interning at the Runnymede Trust', interests: ['Policy', 'Race equality'] },
  { id: 's-hamza', full_name: 'Hamza Patel', university: 'University of Warwick', subject: 'Engineering', year_of_study: 3, cohort: '2023', role: 'scholar', currently: 'Formula Student team lead', interests: ['Motorsport', 'Robotics'] },
  { id: 's-khadija', full_name: 'Khadija Osman', university: 'University of Bristol', subject: 'Dentistry', year_of_study: 3, cohort: '2023', role: 'scholar', currently: 'Clinical years · volunteering at a Somali community clinic', interests: ['Public health'] },
  { id: 's-adam', full_name: 'Adam Malik', university: 'University of Edinburgh', subject: 'History', year_of_study: 1, cohort: '2025', role: 'scholar', currently: 'Just arrived · joining the Islamic Society committee', interests: ['Ottoman history', 'Photography'] },
  { id: 's-nusaybah', full_name: 'Nusaybah Khan', university: 'University of Nottingham', subject: 'Pharmacy', year_of_study: 1, cohort: '2025', role: 'scholar', currently: 'Freshers\' week survivor', interests: ['Pharmacology'] },
  { id: 's-tariq', full_name: 'Tariq Rahman', university: 'Queen Mary University of London', subject: 'Medicine', year_of_study: 1, cohort: '2025', role: 'scholar', currently: 'First anatomy lab next week', interests: ['Surgery', 'Cricket'] },
  { id: 's-layla', full_name: 'Layla Ahmadi', university: 'University of Sheffield', subject: 'Journalism', year_of_study: 1, cohort: '2025', role: 'scholar', currently: 'Writing for Forge Press', interests: ['Documentary', 'Podcasting'] },
  { id: 's-musa', full_name: 'Musa Ibrahim', university: 'University of Oxford', subject: 'Mathematics', year_of_study: 1, cohort: '2025', role: 'scholar', currently: 'Drowning in problem sheets, happily', interests: ['Number theory', 'Chess'] },
  { id: 'a-fatima', full_name: 'Fatima Noor', university: 'University College London', subject: 'Economics', year_of_study: null, cohort: '2022', role: 'alumni', currently: 'Analyst at HM Treasury', interests: ['Fiscal policy'] },
  { id: 'a-saeed', full_name: 'Saeed Anwar', university: 'University of Manchester', subject: 'Computer Science', year_of_study: null, cohort: '2022', role: 'alumni', currently: 'Software engineer at Monzo', interests: ['Fintech'] },
  { id: 'c-yusuf', full_name: 'Yusuf Ali', role: 'coach', currently: 'Leadership coach · former headteacher', bio: 'Executive coach working with the 2024 cohort.', cohort: null, university: null, subject: 'Coaching' },
  { id: 'm-samira', full_name: 'Dr Samira Khan', role: 'mentor', currently: 'Director of Public Health, Greater Manchester', bio: 'Public health physician. Mentors scholars heading into medicine and health policy.', cohort: null, university: null, subject: 'Public health' },
  { id: 'ch-bilal', full_name: 'Imam Bilal Hussain', role: 'chaplain', currently: 'Foundation chaplain · confidential support', bio: 'Available to every scholar for confidential pastoral and religious conversations.', cohort: null, university: null, subject: 'Chaplaincy' },
  { id: 'st-hamza', full_name: 'Hamza Hussain', role: 'staff', currently: 'Programme Coordinator, Avicenna Foundation', cohort: null, university: null, subject: 'Programme' },
];

export const events = [
  { id: 'e-winter', title: 'Winter Retreat', kind: 'retreat', venue: 'external', scope: 'foundation', location: 'Plas y Brenin, Snowdonia', starts_at: at(41, 15), ends_at: at(43, 14), capacity: 60, description: 'Three days in Eryri for the whole scholar community. Critical thinking seminars, character work, hill walking, and long evenings by the fire. Travel from London Euston and Manchester Piccadilly is arranged by the foundation.',
    itinerary: [
      { day: 'Friday', rows: [['15:00', 'Arrive, rooms, tea'], ['17:30', 'Maghrib and opening circle'], ['19:00', 'Dinner'], ['20:30', 'Seminar: What is a good life? (Ibn Sina on happiness)']] },
      { day: 'Saturday', rows: [['07:30', 'Fajr walk'], ['09:00', 'Workshop: leading without a title'], ['13:00', 'Lunch'], ['14:30', 'Hill walk to Llyn Idwal'], ['20:00', 'Cohort project showcases']] },
      { day: 'Sunday', rows: [['09:00', 'Reflection and commitments'], ['11:30', 'Group photo'], ['12:30', 'Lunch and depart']] },
    ] },
  { id: 'e-reception', title: 'Parliamentary Reception', kind: 'reception', venue: 'external', scope: 'foundation', location: 'Palace of Westminster', starts_at: at(76, 18, 30), ends_at: at(76, 21), capacity: 120, description: 'The foundation\'s annual reception welcoming the new cohort, hosted in the House of Lords. Dress code: smart. Bring photo ID for security.' },
  { id: 'e-dinner', title: 'Cohort 2024 dinner', kind: 'social', venue: 'adam_hub', scope: 'cohort', cohort: '2024', location: 'Adam Hub, Westminster', starts_at: at(9, 18, 30), ends_at: at(9, 21, 30), capacity: 24, description: 'Just us. Food from Tayyabs, no agenda, catch up on everyone\'s year so far.' },
  { id: 'e-speaking', title: 'Public speaking masterclass', kind: 'workshop', venue: 'online', scope: 'foundation', location: 'Online', join_link: 'https://teams.microsoft.com/', starts_at: at(3, 19), ends_at: at(3, 20, 30), description: 'Practical session with a former BBC presenter. Come with a two-minute talk prepared on anything you care about.' },
  { id: 'e-policy', title: 'Careers in policy: guest talk', kind: 'workshop', venue: 'adam_hub', scope: 'foundation', location: 'Adam Hub, Westminster', starts_at: at(16, 18), ends_at: at(16, 19, 30), capacity: 30, description: 'A civil servant, a think-tank researcher and a special adviser on how they got in and what the work is actually like. Q&A and tea after.' },
  { id: 'e-iftar', title: 'Community iftar', kind: 'social', venue: 'adam_hub', scope: 'foundation', location: 'Adam Hub, Westminster', starts_at: at(23, 17, 30), ends_at: at(23, 20), capacity: 40, description: 'Open to scholars, alumni and mentors.' },
  { id: 'e-presentations', title: 'Final project presentations', kind: 'presentation', venue: 'adam_hub', scope: 'cohort', cohort: '2024', location: 'Adam Hub, Westminster', starts_at: at(118, 13), ends_at: at(118, 17), description: 'Each project team presents for twelve minutes to a panel of trustees and mentors, followed by questions.' },
  { id: 'e-summer', title: 'Summer Retreat', kind: 'retreat', venue: 'external', scope: 'foundation', location: 'Cumberland Lodge, Windsor', starts_at: daysAgo(72, 15), ends_at: daysAgo(70, 14), description: 'Three days in Windsor Great Park.' },
  { id: 'e-welcome', title: 'Cohort 2025 welcome day', kind: 'event', venue: 'adam_hub', scope: 'foundation', location: 'Adam Hub, Westminster', starts_at: daysAgo(30, 10), ends_at: daysAgo(30, 16), description: 'Welcome to the newest scholars.' },
  { id: 'e-cv', title: 'CV clinic', kind: 'workshop', venue: 'online', scope: 'cohort', cohort: '2024', location: 'Online', starts_at: daysAgo(12, 18), ends_at: daysAgo(12, 19), description: 'One-to-one CV reviews.' },
];

export const rsvps = [
  { event_id: 'e-winter', scholar_id: ME_ID, status: 'going' },
  { event_id: 'e-dinner', scholar_id: ME_ID, status: 'going' },
  ...['s-ibrahim', 's-maryam', 's-yahya', 's-hafsa', 's-bilal', 's-zainab', 's-omar', 's-sumaya', 's-hamza', 's-khadija', 's-adam'].map((id) => ({ event_id: 'e-winter', scholar_id: id, status: 'going' })),
  ...['s-ibrahim', 's-maryam', 's-yahya', 's-hafsa'].map((id) => ({ event_id: 'e-dinner', scholar_id: id, status: 'going' })),
  ...['s-zainab', 's-sumaya', 's-adam', 's-layla'].map((id) => ({ event_id: 'e-speaking', scholar_id: id, status: 'going' })),
  ...['s-sumaya', 's-maryam', 's-zainab'].map((id) => ({ event_id: 'e-policy', scholar_id: id, status: 'going' })),
];

const monthDay = now.getDate();
export const coaching_sessions = [
  { id: 'cs-1', coach_id: 'c-yusuf', scholar_id: ME_ID, starts_at: thisMonth(Math.max(1, monthDay - 9), 17), ends_at: thisMonth(Math.max(1, monthDay - 9), 18), status: 'completed', meeting_link: 'https://teams.microsoft.com/' },
  { id: 'cs-2', coach_id: 'c-yusuf', scholar_id: null, starts_at: at(2, 17), ends_at: at(2, 18), status: 'open', meeting_link: 'https://teams.microsoft.com/' },
  { id: 'cs-3', coach_id: 'c-yusuf', scholar_id: null, starts_at: at(4, 12), ends_at: at(4, 13), status: 'open', meeting_link: 'https://teams.microsoft.com/' },
  { id: 'cs-4', coach_id: 'c-yusuf', scholar_id: null, starts_at: at(6, 18), ends_at: at(6, 19), status: 'open', meeting_link: 'https://teams.microsoft.com/' },
  { id: 'cs-5', coach_id: 'c-yusuf', scholar_id: null, starts_at: at(11, 17), ends_at: at(11, 18), status: 'open', meeting_link: 'https://teams.microsoft.com/' },
  { id: 'cs-6', coach_id: 'c-yusuf', scholar_id: 's-ibrahim', starts_at: at(5, 17), ends_at: at(5, 18), status: 'booked' },
  { id: 'cs-7', coach_id: 'c-yusuf', scholar_id: ME_ID, starts_at: daysAgo(35, 17), ends_at: daysAgo(35, 18), status: 'completed' },
  { id: 'cs-8', coach_id: 'c-yusuf', scholar_id: ME_ID, starts_at: daysAgo(49, 17), ends_at: daysAgo(49, 18), status: 'completed' },
];

export const messages = [
  { id: 'msg-1', scholar_id: ME_ID, counterpart_id: 'c-yusuf', sender_id: 'c-yusuf', body: 'Good session today. For next time: notice one moment this week where you held back from speaking, and write down what you were afraid would happen.', created_at: daysAgo(9, 18) },
  { id: 'msg-2', scholar_id: ME_ID, counterpart_id: 'c-yusuf', sender_id: ME_ID, body: 'Will do. Already have one from the ward round this morning.', created_at: daysAgo(9, 19) },
  { id: 'msg-3', scholar_id: ME_ID, counterpart_id: 'c-yusuf', sender_id: 'c-yusuf', body: 'Book your second session for this month when you can, the Tuesday slots go fast.', created_at: daysAgo(1, 9) },
  { id: 'msg-4', scholar_id: ME_ID, counterpart_id: 'm-samira', sender_id: 'm-samira', body: 'Aisha, the GM public health team is hosting a data day on the 14th. Want me to put you on the list?', created_at: daysAgo(3, 14) },
  { id: 'msg-5', scholar_id: ME_ID, counterpart_id: 'm-samira', sender_id: ME_ID, body: 'Yes please, that would be brilliant.', created_at: daysAgo(3, 15) },
];

export const mentor_meetings = [
  { id: 'mm-1', scholar_id: ME_ID, mentor_id: 'm-samira', met_at: daysAgo(40, 13), summary: 'Talked through the summer placement and what to ask for. Samira suggested shadowing the health inequalities team.' },
  { id: 'mm-2', scholar_id: ME_ID, mentor_id: 'm-samira', met_at: daysAgo(12, 13), summary: 'Reviewed my reflective piece. Next: draft a one-page proposal for the community health literacy project.' },
  { id: 'mm-3', scholar_id: ME_ID, mentor_id: 'm-samira', met_at: at(12, 13), summary: null },
];

export const curriculum_modules = [
  { id: 'mod-1', position: 1, title: 'Niyyah: why we lead', theme: 'Intention', summary: 'Purpose before position. What the Prophetic tradition says about seeking authority.', taught_at: daysAgo(120) },
  { id: 'mod-2', position: 2, title: 'The Golden Age and its scholars', theme: 'Heritage', summary: 'Ibn Sina, al-Ghazali, Ibn Khaldun: knowledge as an act of worship.', taught_at: daysAgo(105) },
  { id: 'mod-3', position: 3, title: 'Adab of disagreement', theme: 'Character', summary: 'How the early jurists argued, and what it teaches about disagreement today.', taught_at: daysAgo(90) },
  { id: 'mod-4', position: 4, title: 'Amanah: trust and stewardship', theme: 'Ethics', summary: 'Public office and public money as a trust.', taught_at: daysAgo(60) },
  { id: 'mod-5', position: 5, title: 'Leading without a title', theme: 'Leadership', summary: 'Influence when you have no authority. Case studies from the Sirah and from modern Britain.', taught_at: daysAgo(10) },
  { id: 'mod-6', position: 6, title: 'Ihsan at work', theme: 'Excellence', summary: 'Excellence as a religious obligation, and what it means in a hospital, a firm, a lab.', taught_at: at(18) },
  { id: 'mod-7', position: 7, title: 'Money, wealth and zakat', theme: 'Economics', summary: null, taught_at: at(40) },
  { id: 'mod-8', position: 8, title: 'British Muslim history', theme: 'Heritage', summary: null, taught_at: at(60) },
  { id: 'mod-9', position: 9, title: 'Speaking in public life', theme: 'Communication', summary: null, taught_at: at(80) },
  { id: 'mod-10', position: 10, title: 'Institutions and how they change', theme: 'Politics', summary: null, taught_at: at(100) },
  { id: 'mod-11', position: 11, title: 'Family, community, ummah', theme: 'Belonging', summary: null, taught_at: at(120) },
  { id: 'mod-12', position: 12, title: 'Legacy', theme: 'Intention', summary: null, taught_at: at(140) },
];
export const module_progress = ['mod-1', 'mod-2', 'mod-3', 'mod-4'].map((module_id, i) => ({ scholar_id: ME_ID, module_id, completed_at: daysAgo(110 - i * 25) }));

export const resources = [
  { id: 'r-1', module_id: 'mod-5', title: 'Leading without a title: session recording', kind: 'recording', url: '#', duration: '58 min', published_at: daysAgo(9) },
  { id: 'r-2', module_id: 'mod-5', title: 'Reading: The Prophet as a leader (extract)', kind: 'pdf', url: '#', pages: 14, published_at: daysAgo(10) },
  { id: 'r-3', module_id: 'mod-5', title: 'Worksheet: influence map', kind: 'pdf', url: '#', pages: 2, published_at: daysAgo(10) },
  { id: 'r-4', module_id: 'mod-4', title: 'Amanah: session recording', kind: 'recording', url: '#', duration: '61 min', published_at: daysAgo(59) },
  { id: 'r-5', module_id: 'mod-4', title: 'Reading: Ghazali on public trust', kind: 'pdf', url: '#', pages: 22, published_at: daysAgo(60) },
  { id: 'r-6', module_id: 'mod-2', title: 'Ibn Sina: The Canon and the Cure (lecture)', kind: 'recording', url: '#', duration: '48 min', published_at: daysAgo(104) },
  { id: 'r-7', module_id: 'mod-2', title: 'Map of the Golden Age', kind: 'link', url: 'https://muslimheritage.com/', published_at: daysAgo(105) },
  { id: 'r-8', module_id: 'mod-1', title: 'Niyyah: session recording', kind: 'recording', url: '#', duration: '55 min', published_at: daysAgo(119) },
  { id: 'r-9', module_id: 'mod-3', title: 'Reading: the adab of ikhtilaf', kind: 'pdf', url: '#', pages: 9, published_at: daysAgo(90) },
];

export const projects = [
  { id: 'p-1', academic_year: '2025/26', title: 'Health literacy in Cheetham Hill', summary: 'A community programme with the Cheetham Hill mosque and two GP practices to translate and simplify diabetes information for Urdu- and Somali-speaking families.', status: 'in_progress', presentation_event_id: 'e-presentations', deliverable_path: null,
    members: [ME_ID, 's-khadija', 's-yahya'],
    milestones: [
      { title: 'Proposal submitted', due_on: daysAgo(20), done_at: daysAgo(22) },
      { title: 'Mid-point review with mentor', due_on: at(19), done_at: null },
      { title: 'Draft report and materials', due_on: at(62), done_at: null },
      { title: 'Rehearsal at Adam Hub', due_on: at(110), done_at: null },
      { title: 'Final presentation', due_on: at(118), done_at: null, final: true },
    ] },
];

export const chaplaincy_requests = [];

export const announcements = [
  { id: 'an-1', title: 'Winter Retreat: travel confirmed', body: 'Coaches leave Euston at 10:15 and Piccadilly at 11:40 on the Friday. Confirm your seat by RSVPing to the retreat by the end of next week.', pinned: true, published_at: daysAgo(1, 9), author_id: 'st-hamza' },
  { id: 'an-2', title: 'Parliamentary Reception date set', body: 'The reception will be in the House of Lords this year. Dress code smart, photo ID required. RSVP opens next month.', pinned: false, published_at: daysAgo(4, 11), author_id: 'st-hamza' },
  { id: 'an-3', title: 'Adam Hub open late on Thursdays', body: 'From this week the Hub stays open until 21:00 on Thursdays for study and project work. Book through the app.', pinned: false, published_at: daysAgo(7, 16), author_id: 'st-hamza' },
  { id: 'an-4', title: 'COP31 youth delegation: apply', body: 'The foundation can nominate two scholars for the UK youth delegation. Deadline in the Opportunities tab.', pinned: false, published_at: daysAgo(10, 10), author_id: 'st-hamza' },
];

export const opportunities = [
  { id: 'op-1', title: 'COP31 UK youth delegation', organisation: 'UK Youth Climate Coalition', kind: 'delegation', location: 'Antalya, Türkiye', deadline: at(12), link: 'https://ukycc.org/', description: 'Two Avicenna nominations for the UK youth delegation to COP31. Travel and accommodation covered. You will need a 300-word statement on what you would bring back to your community.', published_at: daysAgo(10) },
  { id: 'op-2', title: 'Davos: Global Shapers observer', organisation: 'World Economic Forum', kind: 'delegation', location: 'Davos, Switzerland', deadline: at(40), link: 'https://www.globalshapers.org/', description: 'One observer place at the Annual Meeting through the London Global Shapers hub. Third-year scholars preferred.', published_at: daysAgo(5) },
  { id: 'op-3', title: 'Civil Service Fast Stream insight day', organisation: 'Cabinet Office', kind: 'other', location: 'Whitehall, London', deadline: at(5), link: 'https://www.faststream.gov.uk/', description: 'A day inside three departments with current Fast Streamers, arranged for Avicenna scholars.', published_at: daysAgo(12) },
  { id: 'op-4', title: 'Summer internship: policy research', organisation: 'Aziz Foundation', kind: 'internship', location: 'London (hybrid)', deadline: at(25), link: 'https://www.azizfoundation.org.uk/', description: 'Eight weeks, paid, researching Muslim access to postgraduate education.', published_at: daysAgo(3) },
  { id: 'op-5', title: 'Oxford Muslim Leadership Summer School', organisation: 'Oxford Centre for Islamic Studies', kind: 'fellowship', location: 'Oxford', deadline: daysAgo(20), link: '#', description: 'Closed.', published_at: daysAgo(60) },
];
export const opportunity_interest = [
  { opportunity_id: 'op-3', scholar_id: ME_ID, statement: 'I want to understand how health policy is actually made before I decide between clinical and policy paths.', status: 'shortlisted', created_at: daysAgo(6) },
];

export const space_requests = [
  { id: 'sr-1', scholar_id: ME_ID, date: at(8), starts_at: at(8, 14), ends_at: at(8, 17), purpose: 'Project team meeting: health literacy materials', headcount: 3, status: 'pending', created_at: daysAgo(1) },
  { id: 'sr-2', scholar_id: ME_ID, date: daysAgo(6), starts_at: daysAgo(6, 10), ends_at: daysAgo(6, 13), purpose: 'Quiet study', headcount: 1, status: 'approved', created_at: daysAgo(9) },
  { id: 'sr-3', scholar_id: 's-ibrahim', date: at(1), starts_at: at(1, 9), ends_at: at(1, 12), purpose: 'Moot prep', headcount: 4, status: 'approved', created_at: daysAgo(2) },
  { id: 'sr-4', scholar_id: 's-sumaya', date: at(2), starts_at: at(2, 13), ends_at: at(2, 18), purpose: 'Dissertation', headcount: 1, status: 'approved', created_at: daysAgo(2) },
  { id: 'sr-5', scholar_id: 's-hamza', date: at(4), starts_at: at(4, 10), ends_at: at(4, 16), purpose: 'Team design review', headcount: 6, status: 'approved', created_at: daysAgo(3) },
];

export const journal_entries = [
  { id: 'j-1', title: 'Three days in Windsor', academic_year: '2025/26', occurred_on: daysAgo(70), body: 'The Summer Retreat at Cumberland Lodge brought all three cohorts together for the first time. Mornings began with a walk through the Great Park; afternoons were given to the seminar series on the ethics of knowledge, and evenings to the project showcases, where the 2023 cohort presented a year of work on youth mental health in Tower Hamlets, refugee tutoring in Sheffield, and a legal advice clinic in Bradford.\n\nOn the final night the trustees hosted a dinner and each scholar wrote a letter to themselves to be opened at graduation.', gallery: 4, tagged_scholars: [ME_ID, 's-zainab', 's-omar', 's-hafsa'], author_id: 'st-hamza' },
  { id: 'j-2', title: 'Welcoming the 2025 cohort', academic_year: '2025/26', occurred_on: daysAgo(30), body: 'Fourteen new scholars from twelve universities joined us at the Adam Hub for welcome day. After introductions and the programme briefing, alumni Fatima Noor and Saeed Anwar spoke about what the scholarship had made possible for them, and the new cohort met their coaches for the first time.', gallery: 3, tagged_scholars: ['s-adam', 's-nusaybah', 's-tariq', 's-layla', 's-musa'], author_id: 'st-hamza' },
  { id: 'j-3', title: 'A reception at the Palace of Westminster', academic_year: '2024/25', occurred_on: daysAgo(230), body: 'Our third annual Parliamentary Reception, held with the kind permission of Lord Macdonald KC. The Deputy Speaker spoke to scholars about the responsibilities of public life; the Permanent Secretary for Education stayed long past her diary allowed.', gallery: 6, tagged_scholars: ['s-ibrahim', 's-maryam', 's-sumaya'], author_id: 'st-hamza' },
  { id: 'j-4', title: 'Bradford legal clinic opens', academic_year: '2024/25', occurred_on: daysAgo(300), body: 'The 2023 cohort\'s project went live: a fortnightly legal advice clinic at the Bradford Central Mosque, run with a local firm.', gallery: 2, tagged_scholars: ['s-zainab', 's-hamza'], author_id: 'st-hamza' },
];

export const hub_posts = [
  { id: 'hp-1', author_id: 's-ibrahim', kind: 'ask', body: 'Anyone done a vacation scheme at a City firm? I have two interviews next month and would love 20 minutes with someone who has been through it.', created_at: daysAgo(0, 9), pinned: false, image_path: null },
  { id: 'hp-2', author_id: 's-omar', kind: 'win', body: 'Paper accepted. First author. Two years of Saturdays in the lab and it finally went through. Alhamdulillah.', created_at: daysAgo(1, 20), pinned: true, image_path: null },
  { id: 'hp-3', author_id: 's-layla', kind: 'general', body: 'Sheffield scholars: there is a Palestinian film night at the Showroom on Thursday, a few of us are going. Come.', created_at: daysAgo(2, 12), pinned: false, image_path: null },
  { id: 'hp-4', author_id: 's-maryam', kind: 'general', body: 'Reading Ibn Khaldun\'s Muqaddimah for a tutorial and keep thinking about module 2. His theory of asabiyyah explains half of student politics.', created_at: daysAgo(3, 22), pinned: false, image_path: null },
  { id: 'hp-5', author_id: 's-hafsa', kind: 'ask', body: 'Does anyone have a contact at a mosque in Leeds that would let an architecture student measure their prayer hall? For my acoustics studio.', created_at: daysAgo(5, 15), pinned: false, image_path: null },
  { id: 'hp-6', author_id: 'a-fatima', kind: 'general', body: 'Treasury is hiring summer interns and the deadline is in three weeks. Happy to look over applications from any scholar, message me.', created_at: daysAgo(6, 11), pinned: false, image_path: null },
];
export const hub_likes = [
  ...['s-maryam', 's-yahya', 's-hafsa', 's-zainab', 's-sumaya', 's-adam', ME_ID, 's-khadija', 's-bilal'].map((s) => ({ post_id: 'hp-2', scholar_id: s })),
  ...['s-maryam', 's-zainab'].map((s) => ({ post_id: 'hp-1', scholar_id: s })),
  ...['s-tariq', 's-musa', 's-adam'].map((s) => ({ post_id: 'hp-3', scholar_id: s })),
  ...['s-ibrahim', ME_ID].map((s) => ({ post_id: 'hp-4', scholar_id: s })),
  ...['s-yahya', 's-omar', 's-sumaya', 's-zainab'].map((s) => ({ post_id: 'hp-6', scholar_id: s })),
];
export const hub_comments = [
  { id: 'hc-1', post_id: 'hp-1', author_id: 's-zainab', body: 'Sumaya did Freshfields last spring, she is your person.', created_at: daysAgo(0, 10) },
  { id: 'hc-2', post_id: 'hp-1', author_id: 's-sumaya', body: 'Free Thursday evening, DM me.', created_at: daysAgo(0, 11) },
  { id: 'hc-3', post_id: 'hp-2', author_id: 's-maryam', body: 'Mashallah Omar! Link?', created_at: daysAgo(1, 21) },
  { id: 'hc-4', post_id: 'hp-2', author_id: ME_ID, body: 'Huge. Congratulations.', created_at: daysAgo(1, 21) },
  { id: 'hc-5', post_id: 'hp-5', author_id: 's-adam', body: 'My uncle is on the committee at Leeds Grand Mosque, will ask.', created_at: daysAgo(4, 9) },
];
