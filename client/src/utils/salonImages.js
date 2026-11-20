/**
 * Curated high-resolution photography for Aura Salon
 * Fast-loading with automatic WebP compression, crop, and quality tuning via Unsplash CDN
 */

export const SALON_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=2000&q=80',
  heroInterior: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
  experience: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80',
  experienceDetail: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80',

  services: {
    // Haircut (30m — ₹150)
    1: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
    // Beard Trim (15m — ₹80)
    2: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
    // Hair Spa (45m — ₹400)
    3: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    // Hair Colour (60m — ₹700)
    4: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
    // Hair Wash (15m — ₹100)
    5: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
    // Facial (45m — ₹500)
    6: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
  },

  barbers: {
    ravi: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    amit: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    imran: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  },
};

export function getServiceImage(serviceId, fallbackIndex = 1) {
  return SALON_IMAGES.services[serviceId] || SALON_IMAGES.services[fallbackIndex] || SALON_IMAGES.services[1];
}

export function getBarberImage(slug) {
  const normalized = String(slug || '').toLowerCase();
  return SALON_IMAGES.barbers[normalized] || null;
}

