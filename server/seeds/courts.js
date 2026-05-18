require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { v4: uuidv4 } = require('uuid');
const db = require('../src/db');

const COURTS = [
  {
    name: 'Rucker Park',
    lat: 40.8282, lng: -73.9326,
    city: 'New York', country: 'USA',
    address: '155th St & 8th Ave, Harlem, NY 10039',
    description: 'The most famous outdoor basketball court on Earth. Where legends like Wilt Chamberlain and Kareem once played.',
  },
  {
    name: 'Venice Beach Basketball Courts',
    lat: 33.9850, lng: -118.4712,
    city: 'Los Angeles', country: 'USA',
    address: '1800 Ocean Front Walk, Venice, CA 90291',
    description: 'Sun, sand, and serious runs. These iconic beachside courts draw ballers from around the world.',
  },
  {
    name: 'The Cage (West 4th Street Courts)',
    lat: 40.7322, lng: -74.0030,
    city: 'New York', country: 'USA',
    address: '6th Ave & W 4th St, Greenwich Village, NY 10014',
    description: 'NYC\'s legendary fenced courts in Greenwich Village. Summer league here is must-see basketball.',
  },
  {
    name: 'Trocadéro Basketball Courts',
    lat: 48.8616, lng: 2.2892,
    city: 'Paris', country: 'France',
    address: 'Place du Trocadéro, 75116 Paris',
    description: 'Play in the shadow of the Eiffel Tower. Paris streetball culture on full display.',
  },
  {
    name: 'Bercy Courts',
    lat: 48.8397, lng: 2.3787,
    city: 'Paris', country: 'France',
    address: 'Boulevard de Bercy, 75012 Paris',
    description: 'Outdoor courts near the Bercy Arena. High-level streetball year round.',
  },
  {
    name: 'Ibirapuera Park Courts',
    lat: -23.5874, lng: -46.6576,
    city: 'São Paulo', country: 'Brazil',
    address: 'Av. Pedro Álvares Cabral, São Paulo, SP',
    description: 'São Paulo\'s premier outdoor sporting park. Fast-paced runs all day every day.',
  },
  {
    name: 'Manila Rizal Park Courts',
    lat: 14.5831, lng: 120.9794,
    city: 'Manila', country: 'Philippines',
    address: 'Roxas Blvd, Ermita, Manila',
    description: 'The Philippines breathes basketball. Rizal Park courts are always packed.',
  },
  {
    name: 'Yoyogi Park Courts',
    lat: 35.6714, lng: 139.6944,
    city: 'Tokyo', country: 'Japan',
    address: 'Yoyogi Park, Shibuya, Tokyo',
    description: 'Tokyo\'s rising streetball scene in the heart of the city\'s iconic park.',
  },
  {
    name: 'Eko Atlantic Courts',
    lat: 6.4281, lng: 3.4219,
    city: 'Lagos', country: 'Nigeria',
    address: 'Eko Atlantic City, Lagos Island, Lagos',
    description: 'West Africa\'s fastest-growing basketball scene. Competitive runs on the coast.',
  },
  {
    name: 'Sandton Sports Courts',
    lat: -26.1076, lng: 28.0567,
    city: 'Johannesburg', country: 'South Africa',
    address: 'Sandton, Johannesburg, Gauteng',
    description: 'Joburg\'s top outdoor courts. South African ballers bringing real energy.',
  },
];

async function seed() {
  console.log('Seeding 10 sample courts...\n');
  for (const c of COURTS) {
    const id = uuidv4();
    try {
      await db.query(
        `INSERT INTO courts (id, name, latitude, longitude, city, country, address, description, court_type, photo_urls)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'outdoor', '{}')
         ON CONFLICT DO NOTHING`,
        [id, c.name, c.lat, c.lng, c.city, c.country, c.address, c.description]
      );
      console.log(`  ✓  ${c.name} — ${c.city}, ${c.country}`);
    } catch (err) {
      console.error(`  ✗  ${c.name}: ${err.message}`);
    }
  }
  console.log('\nSeed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
