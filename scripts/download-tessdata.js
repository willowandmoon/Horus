const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const TESSDATA_DIR = process.env.TESSDATA_DIR || path.join(PROJECT_ROOT, 'tessdata');

const PRIMARY_BASE = 'https://tessdata.projectnaptha.com/4.0.0';
const FALLBACK_BASE = 'https://raw.githubusercontent.com/tesseract-ocr/tessdata/main';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`Failed to download ${url} (status ${res.statusCode})`));
      }

      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    }).on('error', (err) => {
      try { fs.unlinkSync(dest); } catch (e) {}
      reject(err);
    });
  });
}

async function fetchTrainedData(lang) {
  const gzName = `${lang}.traineddata.gz`;
  const rawName = `${lang}.traineddata`;

  const gzPath = path.join(TESSDATA_DIR, gzName);
  const rawPath = path.join(TESSDATA_DIR, rawName);

  if (fs.existsSync(gzPath) || fs.existsSync(rawPath)) {
    console.log(`${lang} already present, skipping`);
    return;
  }

  // Try primary gz endpoint first
  const primaryUrl = `${PRIMARY_BASE}/${gzName}`;
  try {
    console.log(`Downloading ${primaryUrl} -> ${gzPath}`);
    await download(primaryUrl, gzPath);
    console.log(`Saved ${gzPath}`);
    return;
  } catch (e) {
    console.warn(`Primary download failed for ${lang}:`, e.message || e);
  }

  // Fallback to raw traineddata (uncompressed)
  const fallbackUrl = `${FALLBACK_BASE}/${rawName}`;
  try {
    console.log(`Attempting fallback ${fallbackUrl} -> ${rawPath}`);
    await download(fallbackUrl, rawPath);
    console.log(`Saved ${rawPath}`);
    return;
  } catch (e) {
    console.error(`Fallback download failed for ${lang}:`, e.message || e);
    throw e;
  }
}

async function main() {
  const langs = process.argv.slice(2);
  if (langs.length === 0) {
    console.log('No languages provided, defaulting to eng spa');
    langs.push('eng', 'spa');
  }

  if (!fs.existsSync(TESSDATA_DIR)) fs.mkdirSync(TESSDATA_DIR, { recursive: true });

  for (const l of langs) {
    await fetchTrainedData(l).catch((e) => {
      console.error(`Failed to fetch traineddata for ${l}:`, e.message || e);
    });
  }

  console.log('Done. Ensure the tessdata folder is included in deployments.');
}

main().catch((e) => {
  console.error('download-tessdata error:', e);
  process.exit(1);
});
