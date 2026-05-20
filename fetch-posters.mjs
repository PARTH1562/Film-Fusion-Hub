import fs from 'fs/promises';

const data = JSON.parse(await fs.readFile('movies-data.json', 'utf8'));

async function getOmdbPosterUrl(title, year) {
  try {
    let url = `http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=8b0b451`;
    if (year) url += `&y=${year}`;
    
    const res = await fetch(url);
    const json = await res.json();
    if (json.Poster && json.Poster !== 'N/A') {
      return json.Poster;
    }
    // Try without year if it fails
    if (year) {
       const res2 = await fetch(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=8b0b451`);
       const json2 = await res2.json();
       if (json2.Poster && json2.Poster !== 'N/A') {
         return json2.Poster;
       }
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function run() {
  let updated = 0;
  for (let i = 0; i < data.movies.length; i++) {
    const movie = data.movies[i];
    // If it's a wikipedia URL or blank or not working
    if (movie.imageUrl && (movie.imageUrl.includes('wikimedia.org') || movie.imageUrl.includes('wsrv.nl') || movie.title === 'Saalar ' || movie.title === 'Toxic ')) {
      console.log(`Fetching new poster for: ${movie.title}`);
      
      let searchTitle = movie.title.trim();
      if (searchTitle === "Nolan's Tenet") searchTitle = "Tenet";
      if (searchTitle.includes("Durandhar")) searchTitle = "The Revenge"; // Fallback
      if (searchTitle === "Toxic ") searchTitle = "Toxic";
      if (searchTitle === "Saalar ") searchTitle = "Salaar";
      
      const newUrl = await getOmdbPosterUrl(searchTitle, movie.releaseYear);
      if (newUrl) {
        data.movies[i].imageUrl = newUrl;
        console.log(`[SUCCESS] ${movie.title}: ${newUrl}`);
        updated++;
      } else {
        console.log(`[FAILED] Could not find poster for ${movie.title}`);
        // As a fallback, proxy the wikipedia URL
        if (movie.imageUrl.includes('wikimedia.org')) {
           data.movies[i].imageUrl = `https://wsrv.nl/?url=${encodeURIComponent(movie.imageUrl.replace('https://', ''))}&w=500`;
        }
      }
    }
  }
  await fs.writeFile('movies-data.json', JSON.stringify(data, null, 2));
  console.log(`movies-data.json updated successfully! (${updated} updated)`);
}

run();
