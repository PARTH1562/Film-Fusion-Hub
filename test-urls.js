import fs from 'fs';

const data = JSON.parse(fs.readFileSync('movies-data.json', 'utf8'));

async function testUrls() {
  for (const movie of data.movies) {
    if (movie.imageUrl) {
      try {
        const res = await fetch(movie.imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        console.log(`[${res.status}] ${movie.title}: ${movie.imageUrl.substring(0, 50)}...`);
      } catch (e) {
        console.log(`[ERROR] ${movie.title}: ${e.message}`);
      }
    }
  }
}

testUrls();
