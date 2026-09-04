-- Demo seed: a small cohort so the app has something to show. Safe to run on an empty project.
-- Emails are example.org; replace with real scholar emails before inviting anyone.
-- Dates are relative to now() so the seed never goes stale.

with people as (
  insert into scholars (email, full_name, university, subject, year_of_study, cohort, role, currently, bio, interests, phone, phone_visible) values
    ('staff@example.org',   'Hamza Hussain',      null, 'Programme', null, null, 'staff',    'Programme Coordinator, Avicenna Foundation', null, '{}', null, false),
    ('coach@example.org',   'Yusuf Ali',          null, 'Coaching', null, null, 'coach',    'Leadership coach · former headteacher', 'Executive coach working with the 2024 cohort.', '{}', null, false),
    ('mentor@example.org',  'Dr Samira Khan',     null, 'Public health', null, null, 'mentor', 'Director of Public Health, Greater Manchester', 'Public health physician. Mentors scholars heading into medicine and health policy.', '{}', null, false),
    ('chaplain@example.org','Imam Bilal Hussain', null, 'Chaplaincy', null, null, 'chaplain', 'Foundation chaplain · confidential support', 'Available to every scholar for confidential pastoral and religious conversations.', '{}', null, false),
    ('aisha@example.org',   'Aisha Rahman',       'University of Manchester', 'Medicine', 2, '2024', 'scholar', '2nd year Medicine · summer research placement at NHS England', 'Interested in health inequalities and community medicine.', '{Health policy,Community,Writing}', '07700 900123', true),
    ('ibrahim@example.org', 'Ibrahim Chowdhury',  'University College London', 'Law', 2, '2024', 'scholar', 'Vacation scheme applications · mooting captain', null, '{Human rights,Debating}', null, false),
    ('maryam@example.org',  'Maryam Siddiqui',    'University of Oxford', 'PPE', 2, '2024', 'scholar', 'Editing the college magazine', null, '{Political theory,Journalism}', null, false),
    ('yahya@example.org',   'Yahya Begum',        'Imperial College London', 'Computing', 2, '2024', 'scholar', 'Building a Quran memorisation app', null, '{AI,Product}', null, false),
    ('zainab@example.org',  'Zainab Hussain',     'King''s College London', 'International Relations', 3, '2023', 'scholar', 'Dissertation on Gulf diplomacy', null, '{Diplomacy,Arabic}', null, false),
    ('omar@example.org',    'Omar Farooq',        'University of Cambridge', 'Natural Sciences', 3, '2023', 'scholar', 'Part II Chemistry · lab placement at AstraZeneca', null, '{Research,Climbing}', null, false),
    ('khadija@example.org', 'Khadija Osman',      'University of Bristol', 'Dentistry', 3, '2023', 'scholar', 'Clinical years', null, '{Public health}', null, false),
    ('adam@example.org',    'Adam Malik',         'University of Edinburgh', 'History', 1, '2025', 'scholar', 'Just arrived · joining the Islamic Society committee', null, '{Ottoman history,Photography}', null, false),
    ('fatima@example.org',  'Fatima Noor',        'University College London', 'Economics', null, '2022', 'alumni', 'Analyst at HM Treasury', null, '{Fiscal policy}', null, false)
  returning id, email, role
)
update scholars s set coach_id = (select id from people where email = 'coach@example.org'), mentor_id = (select id from people where email = 'mentor@example.org')
 where s.role = 'scholar';

-- Events
insert into events (title, description, kind, venue, location, scope, cohort, starts_at, ends_at, capacity, itinerary, join_link) values
  ('Winter Retreat', 'Three days in Eryri for the whole scholar community. Critical thinking seminars, character work, hill walking, and long evenings by the fire.', 'retreat', 'external', 'Plas y Brenin, Snowdonia', 'foundation', null, now() + interval '41 days', now() + interval '43 days', 60,
   '[{"day":"Friday","rows":[["15:00","Arrive, rooms, tea"],["17:30","Maghrib and opening circle"],["19:00","Dinner"],["20:30","Seminar: What is a good life?"]]},{"day":"Saturday","rows":[["07:30","Fajr walk"],["09:00","Workshop: leading without a title"],["14:30","Hill walk to Llyn Idwal"],["20:00","Cohort project showcases"]]},{"day":"Sunday","rows":[["09:00","Reflection and commitments"],["12:30","Lunch and depart"]]}]', null),
  ('Parliamentary Reception', 'The foundation''s annual reception welcoming the new cohort, hosted in the House of Lords. Dress code: smart. Bring photo ID.', 'reception', 'external', 'Palace of Westminster', 'foundation', null, now() + interval '76 days', now() + interval '76 days 3 hours', 120, null, null),
  ('Cohort 2024 dinner', 'Just us. No agenda.', 'social', 'adam_hub', 'Adam Hub, Westminster', 'cohort', '2024', now() + interval '9 days', now() + interval '9 days 3 hours', 24, null, null),
  ('Public speaking masterclass', 'Practical session with a former BBC presenter. Come with a two-minute talk prepared.', 'workshop', 'online', 'Online', 'foundation', null, now() + interval '3 days', now() + interval '3 days 90 minutes', null, null, 'https://teams.microsoft.com/'),
  ('Careers in policy: guest talk', 'A civil servant, a think-tank researcher and a special adviser on how they got in.', 'workshop', 'adam_hub', 'Adam Hub, Westminster', 'foundation', null, now() + interval '16 days', now() + interval '16 days 90 minutes', 30, null, null),
  ('Final project presentations', 'Each project team presents for twelve minutes to a panel of trustees and mentors.', 'presentation', 'adam_hub', 'Adam Hub, Westminster', 'cohort', '2024', now() + interval '118 days', now() + interval '118 days 4 hours', null, null, null),
  ('Summer Retreat', 'Three days in Windsor Great Park.', 'retreat', 'external', 'Cumberland Lodge, Windsor', 'foundation', null, now() - interval '72 days', now() - interval '70 days', null, null, null),
  ('Cohort 2025 welcome day', 'Welcome to the newest scholars.', 'event', 'adam_hub', 'Adam Hub, Westminster', 'foundation', null, now() - interval '30 days', now() - interval '30 days' + interval '6 hours', null, null, null);

-- Coaching slots for the coach (open) and one completed session for Aisha this month
insert into coaching_sessions (coach_id, scholar_id, starts_at, ends_at, status, meeting_link)
select c.id, null, d, d + interval '1 hour', 'open', 'https://teams.microsoft.com/'
  from scholars c, unnest(array[now() + interval '2 days', now() + interval '4 days', now() + interval '6 days', now() + interval '11 days']) as d
 where c.email = 'coach@example.org';
insert into coaching_sessions (coach_id, scholar_id, starts_at, ends_at, status)
select c.id, a.id, date_trunc('month', now()) + interval '2 days 17 hours', date_trunc('month', now()) + interval '2 days 18 hours', 'completed'
  from scholars c, scholars a where c.email = 'coach@example.org' and a.email = 'aisha@example.org';

-- Messages
insert into messages (scholar_id, counterpart_id, sender_id, body, created_at)
select a.id, c.id, c.id, 'Good session today. For next time: notice one moment this week where you held back from speaking.', now() - interval '9 days'
  from scholars a, scholars c where a.email = 'aisha@example.org' and c.email = 'coach@example.org';
insert into messages (scholar_id, counterpart_id, sender_id, body, created_at)
select a.id, m.id, m.id, 'Aisha, the GM public health team is hosting a data day on the 14th. Want me to put you on the list?', now() - interval '3 days'
  from scholars a, scholars m where a.email = 'aisha@example.org' and m.email = 'mentor@example.org';

-- Curriculum
insert into curriculum_modules (position, title, theme, summary, taught_at) values
  (1, 'Niyyah: why we lead', 'Intention', 'Purpose before position.', now() - interval '120 days'),
  (2, 'The Golden Age and its scholars', 'Heritage', 'Ibn Sina, al-Ghazali, Ibn Khaldun: knowledge as an act of worship.', now() - interval '105 days'),
  (3, 'Adab of disagreement', 'Character', 'How the early jurists argued.', now() - interval '90 days'),
  (4, 'Amanah: trust and stewardship', 'Ethics', 'Public office and public money as a trust.', now() - interval '60 days'),
  (5, 'Leading without a title', 'Leadership', 'Influence when you have no authority.', now() - interval '10 days'),
  (6, 'Ihsan at work', 'Excellence', null, now() + interval '18 days'),
  (7, 'Money, wealth and zakat', 'Economics', null, now() + interval '40 days'),
  (8, 'British Muslim history', 'Heritage', null, now() + interval '60 days'),
  (9, 'Speaking in public life', 'Communication', null, now() + interval '80 days'),
  (10, 'Institutions and how they change', 'Politics', null, now() + interval '100 days'),
  (11, 'Family, community, ummah', 'Belonging', null, now() + interval '120 days'),
  (12, 'Legacy', 'Intention', null, now() + interval '140 days');
insert into module_progress (scholar_id, module_id)
select a.id, m.id from scholars a, curriculum_modules m where a.email = 'aisha@example.org' and m.position <= 4;
insert into resources (module_id, title, kind, url, duration, pages)
select id, 'Leading without a title: session recording', 'recording', 'https://example.org/recording', '58 min', null from curriculum_modules where position = 5;
insert into resources (module_id, title, kind, pages)
select id, 'Reading: The Prophet as a leader (extract)', 'pdf', 14 from curriculum_modules where position = 5;

-- Project + template
insert into project_milestone_templates (academic_year, position, title, due_on, final) values
  ('2025/26', 1, 'Proposal submitted', current_date - 20, false),
  ('2025/26', 2, 'Mid-point review with mentor', current_date + 19, false),
  ('2025/26', 3, 'Draft report and materials', current_date + 62, false),
  ('2025/26', 4, 'Rehearsal at Adam Hub', current_date + 110, false),
  ('2025/26', 5, 'Final presentation', current_date + 118, true);
insert into projects (academic_year, title, summary, status, presentation_event_id, milestones)
select '2025/26', 'Health literacy in Cheetham Hill', 'A community programme with the Cheetham Hill mosque and two GP practices to translate diabetes information for Urdu- and Somali-speaking families.', 'in_progress',
       (select id from events where title = 'Final project presentations'),
       (select jsonb_agg(jsonb_build_object('title', title, 'due_on', due_on, 'done_at', case when position = 1 then now() - interval '22 days' end, 'final', final) order by position) from project_milestone_templates where academic_year = '2025/26');
insert into project_members (project_id, scholar_id)
select p.id, s.id from projects p, scholars s where s.email in ('aisha@example.org', 'khadija@example.org', 'yahya@example.org');

-- Announcements, opportunities, journal, posts
insert into announcements (title, body, pinned, published_at, author_id) values
  ('Winter Retreat: travel confirmed', 'Coaches leave Euston at 10:15 and Piccadilly at 11:40 on the Friday. Confirm your seat by RSVPing to the retreat.', true, now() - interval '1 day', (select id from scholars where role = 'staff' limit 1)),
  ('Adam Hub open late on Thursdays', 'From this week the Hub stays open until 21:00 on Thursdays. Book through the app.', false, now() - interval '7 days', (select id from scholars where role = 'staff' limit 1));
insert into opportunities (title, organisation, description, kind, location, deadline, link) values
  ('COP31 UK youth delegation', 'UK Youth Climate Coalition', 'Two Avicenna nominations for the UK youth delegation to COP31.', 'delegation', 'Antalya, Türkiye', now() + interval '12 days', 'https://ukycc.org/'),
  ('Davos: Global Shapers observer', 'World Economic Forum', 'One observer place at the Annual Meeting.', 'delegation', 'Davos, Switzerland', now() + interval '40 days', 'https://www.globalshapers.org/'),
  ('Civil Service Fast Stream insight day', 'Cabinet Office', 'A day inside three departments with current Fast Streamers.', 'other', 'Whitehall, London', now() + interval '5 days', 'https://www.faststream.gov.uk/');
insert into journal_entries (title, body, occurred_on, academic_year, author_id) values
  ('Three days in Windsor', 'The Summer Retreat at Cumberland Lodge brought all three cohorts together for the first time.', current_date - 70, '2025/26', (select id from scholars where role = 'staff' limit 1)),
  ('Welcoming the 2025 cohort', 'Fourteen new scholars from twelve universities joined us at the Adam Hub.', current_date - 30, '2025/26', (select id from scholars where role = 'staff' limit 1));
insert into hub_posts (author_id, kind, body, pinned, created_at)
select id, 'win', 'Paper accepted. First author. Two years of Saturdays in the lab and it finally went through. Alhamdulillah.', true, now() - interval '1 day' from scholars where email = 'omar@example.org';
insert into hub_posts (author_id, kind, body, created_at)
select id, 'ask', 'Anyone done a vacation scheme at a City firm? I have two interviews next month.', now() - interval '3 hours' from scholars where email = 'ibrahim@example.org';
insert into space_requests (scholar_id, starts_at, ends_at, purpose, headcount, status)
select id, now() + interval '1 day 9 hours', now() + interval '1 day 12 hours', 'Moot prep', 4, 'approved' from scholars where email = 'ibrahim@example.org';
