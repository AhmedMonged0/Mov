import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Genres
  const genres = ['Action', 'Thriller', 'Sci-Fi', 'Mystery', 'Drama', 'Comedy'];
  for (const name of genres) {
    await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase() }
    });
  }

  // Create Movies
  const movie1 = await prisma.movie.upsert({
    where: { slug: 'the-last-horizon' },
    update: {},
    create: {
      title: "The Last Horizon",
      slug: "the-last-horizon",
      year: 2026,
      rating: 8.7,
      quality: "1080p",
      poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
      backdrop: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80",
      description: "A cinematic adventure across a dangerous new world.",
      genres: { connect: [{ name: 'Action' }] }
    }
  });

  const movie2 = await prisma.movie.upsert({
    where: { slug: 'beyond-the-stars' },
    update: {},
    create: {
      title: "Beyond The Stars",
      slug: "beyond-the-stars",
      year: 2026,
      rating: 9.0,
      quality: "4K",
      poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80",
      backdrop: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1600&q=80",
      description: "Humanity searches for a new home beyond the stars.",
      genres: { connect: [{ name: 'Sci-Fi' }] }
    }
  });

  // Create Series
  const series1 = await prisma.series.upsert({
    where: { slug: 'dark-signal' },
    update: {},
    create: {
      title: "Dark Signal",
      slug: "dark-signal",
      year: 2025,
      rating: 8.5,
      poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80",
      backdrop: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80",
      description: "A strange signal changes everything.",
      genres: { connect: [{ name: 'Mystery' }] }
    }
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
