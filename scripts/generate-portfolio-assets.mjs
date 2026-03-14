import fs from 'node:fs/promises';
import path from 'node:path';
import manifest from '../src/data/portfolio-image-manifest.json' with { type: 'json' };

const outputDir = path.resolve('public', 'portfolio');

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function buildSvg(item) {
  const label = escapeXml(item.label);
  const category = escapeXml(item.category);
  const year = escapeXml(item.year);
  const accent = item.accent;
  const accentSoft = item.accentSoft;
  const surface = item.surface;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="800" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">${label} portfolio image</title>
  <desc id="desc">Portfolio showcase artwork for ${label}</desc>
  <defs>
    <linearGradient id="bg" x1="140" y1="90" x2="1060" y2="720" gradientUnits="userSpaceOnUse">
      <stop stop-color="${surface}"/>
      <stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
    <linearGradient id="panel" x1="168" y1="168" x2="1032" y2="640" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#F8FAFC"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="800" fill="url(#bg)"/>
  <circle cx="1020" cy="140" r="130" fill="${accentSoft}" opacity="0.55"/>
  <circle cx="190" cy="700" r="170" fill="${accentSoft}" opacity="0.38"/>

  <rect x="104" y="96" width="992" height="608" rx="44" fill="url(#panel)" stroke="#E2E8F0" stroke-width="4"/>

  <rect x="160" y="156" width="540" height="488" rx="30" fill="${surface}"/>
  <rect x="190" y="188" width="480" height="260" rx="22" fill="#FFFFFF"/>
  <rect x="220" y="220" width="220" height="170" rx="14" fill="${accentSoft}"/>
  <rect x="458" y="220" width="180" height="76" rx="12" fill="#F1F5F9"/>
  <rect x="458" y="314" width="180" height="76" rx="12" fill="#E2E8F0"/>
  <path d="M226 430c82-40 176-40 258 0" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>

  <rect x="742" y="156" width="298" height="488" rx="30" fill="${surface}"/>
  <rect x="778" y="198" width="224" height="140" rx="22" fill="${accentSoft}"/>
  <path d="M806 248h168" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
  <path d="M806 284h132" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity="0.82"/>

  <rect x="778" y="370" width="224" height="110" rx="16" fill="#FFFFFF"/>
  <rect x="778" y="500" width="224" height="110" rx="16" fill="#FFFFFF"/>

  <rect x="160" y="112" width="182" height="46" rx="23" fill="${accentSoft}"/>
  <text x="194" y="143" fill="${accent}" font-size="24" font-family="Segoe UI, Arial, sans-serif" font-weight="700">PORTFOLIO</text>

  <text x="190" y="510" fill="#0F172A" font-size="58" font-family="Segoe UI, Arial, sans-serif" font-weight="800">${label}</text>
  <text x="190" y="560" fill="#475569" font-size="30" font-family="Segoe UI, Arial, sans-serif" font-weight="600">${category} Project</text>
  <text x="190" y="604" fill="#64748B" font-size="24" font-family="Segoe UI, Arial, sans-serif" font-weight="600">Completed ${year}</text>
</svg>`;
}

async function writeAsset(item) {
  const filePath = path.join(outputDir, `${item.slug}.svg`);
  await fs.writeFile(filePath, buildSvg(item), 'utf8');
}

await fs.mkdir(outputDir, { recursive: true });

for (const item of manifest.projects) {
  await writeAsset(item);
}

await writeAsset(manifest.placeholder);

console.log(`Generated ${manifest.projects.length + 1} portfolio assets in ${outputDir}`);
