import { BARBER_AVAILABILITY } from '../services/queueEngine.js';

const DEFAULT_SERVICES = [
  { name_en: 'Haircut', name_gu: 'હેરકટ', duration_minutes: 30, price_inr: 150 },
  { name_en: 'Beard Trim', name_gu: 'દાઢી ટ્રીમ', duration_minutes: 15, price_inr: 80 },
  { name_en: 'Hair Spa', name_gu: 'હેર સ્પા', duration_minutes: 45, price_inr: 400 },
  { name_en: 'Hair Colour', name_gu: 'હેર કલર', duration_minutes: 60, price_inr: 700 },
  { name_en: 'Hair Wash', name_gu: 'હેર વોશ', duration_minutes: 15, price_inr: 100 },
  { name_en: 'Facial', name_gu: 'ફેશિયલ', duration_minutes: 45, price_inr: 500 },
];

const DEFAULT_BARBERS = [
  { name: 'Isha', slug: 'isha', specialty: 'Classic & Modern Haircuts', avatar_color: '#D4A017' },
  { name: 'Amit', slug: 'amit', specialty: 'Beard Styling & Fades', avatar_color: '#38BDF8' },
  { name: 'Imran', slug: 'imran', specialty: 'Hair Spa & Colour Specialist', avatar_color: '#10B981' },
];

export async function seedDatabase(client) {
  // Ensure barber 'Ravi' is migrated to 'Isha' for existing databases
  await client.execute({
    sql: "UPDATE barbers SET name = 'Isha', slug = 'isha' WHERE slug = 'ravi' OR name = 'Ravi'",
    args: [],
  });
  await client.execute({
    sql: `INSERT OR IGNORE INTO salon_settings (id, salon_name_en, salon_name_gu, open_time, close_time, is_online_join_manually_closed)
          VALUES (1, 'Aura Salon', 'ઓરા સલૂન', '09:00', '21:00', 0)`,
    args: [],
  });

  const servicesCountRes = await client.execute('SELECT COUNT(*) AS count FROM services');
  const servicesCount = Number(servicesCountRes.rows[0]?.count || 0);

  if (servicesCount === 0) {
    for (const svc of DEFAULT_SERVICES) {
      await client.execute({
        sql: `INSERT INTO services (name_en, name_gu, duration_minutes, price_inr, is_active)
              VALUES (?, ?, ?, ?, 1)`,
        args: [svc.name_en, svc.name_gu, svc.duration_minutes, svc.price_inr],
      });
    }
  }

  const barbersCountRes = await client.execute('SELECT COUNT(*) AS count FROM barbers');
  const barbersCount = Number(barbersCountRes.rows[0]?.count || 0);

  if (barbersCount === 0) {
    for (const barber of DEFAULT_BARBERS) {
      await client.execute({
        sql: `INSERT INTO barbers (name, slug, specialty, avatar_color, availability, is_on_duty)
              VALUES (?, ?, ?, ?, ?, 1)`,
        args: [
          barber.name,
          barber.slug,
          barber.specialty,
          barber.avatar_color,
          BARBER_AVAILABILITY.AVAILABLE,
        ],
      });
    }
  }
}
