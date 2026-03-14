import fs from 'node:fs/promises';
import path from 'node:path';
import manifest from '../src/data/product-image-manifest.json' with { type: 'json' };

const outputDir = path.resolve('public', 'paints');

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function sceneMarkup(scene, accent, accentSoft) {
  switch (scene) {
    case 'exterior':
      return `
        <path d="M880 438 980 360l100 78v145h-70v-78h-60v78h-70z" fill="${accentSoft}" opacity="0.95"/>
        <path d="M930 540h48v43h-48z" fill="${accent}" opacity="0.9"/>
        <path d="M893 438h175" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
      `;
    case 'eco':
      return `
        <path d="M962 362c73 24 108 88 98 160-88 12-160-25-198-100 14-27 45-52 100-60Z" fill="${accentSoft}"/>
        <path d="M888 530c32-73 80-117 148-145" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
      `;
    case 'wood':
      return `
        <rect x="850" y="372" width="244" height="178" rx="24" fill="${accentSoft}"/>
        <path d="M878 400c50 18 85 18 134 0s84-18 134 0M878 456c50 18 85 18 134 0s84-18 134 0M878 512c50 18 85 18 134 0s84-18 134 0" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity="0.65"/>
      `;
    case 'cabinet':
      return `
        <rect x="856" y="372" width="232" height="184" rx="20" fill="${accentSoft}"/>
        <rect x="878" y="394" width="90" height="140" rx="12" fill="#ffffff" opacity="0.85"/>
        <rect x="978" y="394" width="90" height="140" rx="12" fill="#ffffff" opacity="0.85"/>
        <circle cx="954" cy="466" r="7" fill="${accent}"/>
        <circle cx="992" cy="466" r="7" fill="${accent}"/>
      `;
    case 'shield':
      return `
        <path d="M972 358c42 38 82 55 126 64 4 117-57 185-126 216-69-31-130-99-126-216 44-9 84-26 126-64Z" fill="${accentSoft}"/>
        <path d="M972 424v164" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
        <path d="M904 502h136" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
      `;
    case 'primer':
      return `
        <rect x="856" y="398" width="236" height="126" rx="26" fill="${accentSoft}"/>
        <rect x="900" y="440" width="148" height="42" rx="18" fill="#ffffff" opacity="0.82"/>
        <path d="M818 470h74" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
        <path d="M786 470c18-34 44-50 80-50" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
      `;
    case 'bath':
      return `
        <path d="M972 362c48 63 75 105 75 143 0 47-33 84-75 84s-75-37-75-84c0-38 27-80 75-143Z" fill="${accentSoft}"/>
        <path d="M930 536c22 14 64 14 86 0" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
        <circle cx="1018" cy="406" r="18" fill="#ffffff" opacity="0.75"/>
      `;
    case 'designer':
      return `
        <path d="M850 474c48-56 95-56 143 0s95 56 143 0 95-56 143 0" stroke="${accent}" stroke-width="22" stroke-linecap="round" fill="none"/>
        <path d="M850 534c48-56 95-56 143 0s95 56 143 0 95-56 143 0" stroke="${accentSoft}" stroke-width="22" stroke-linecap="round" fill="none"/>
      `;
    case 'roof':
      return `
        <path d="M874 470 972 390l98 80v92H874z" fill="${accentSoft}"/>
        <path d="M862 470h220" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
        <circle cx="1082" cy="384" r="34" fill="#FBBF24"/>
      `;
    case 'child':
      return `
        <circle cx="902" cy="460" r="28" fill="${accentSoft}"/>
        <circle cx="980" cy="414" r="22" fill="#FDE68A"/>
        <circle cx="1058" cy="470" r="28" fill="#BFDBFE"/>
        <path d="M930 548c38-30 76-30 114 0" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
      `;
    case 'interior':
      return `
        <rect x="858" y="366" width="232" height="188" rx="24" fill="${accentSoft}"/>
        <rect x="880" y="390" width="188" height="100" rx="18" fill="#ffffff" opacity="0.78"/>
        <path d="M924 522h88" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
      `;
    default:
      return `
        <circle cx="972" cy="460" r="98" fill="${accentSoft}"/>
        <path d="M920 460h104" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
      `;
  }
}

function buildSvg(item) {
  const title = escapeXml(item.title);
  const tagline = escapeXml(item.tagline);
  const feature = escapeXml(item.feature);
  const accent = item.accent;
  const accentSoft = item.accentSoft;
  const surface = item.surface;
  const scene = sceneMarkup(item.scene, accent, accentSoft);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="800" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">Paint shop product artwork for ${title}</desc>
  <defs>
    <linearGradient id="bg" x1="180" y1="90" x2="1060" y2="710" gradientUnits="userSpaceOnUse">
      <stop stop-color="${surface}"/>
      <stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
    <linearGradient id="can" x1="280" y1="240" x2="420" y2="658" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#E5E7EB"/>
    </linearGradient>
    <linearGradient id="paint" x1="336" y1="292" x2="336" y2="410" gradientUnits="userSpaceOnUse">
      <stop stop-color="${accentSoft}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <circle cx="1046" cy="178" r="128" fill="${accentSoft}" opacity="0.5"/>
  <circle cx="180" cy="690" r="160" fill="${accentSoft}" opacity="0.35"/>
  <rect x="88" y="100" width="1024" height="600" rx="42" fill="#FFFFFF" opacity="0.94"/>
  <rect x="138" y="168" width="548" height="464" rx="28" fill="${surface}"/>
  <path d="M262 668c108-40 222-40 330 0" stroke="${accentSoft}" stroke-width="20" stroke-linecap="round" opacity="0.85"/>
  <rect x="248" y="230" width="176" height="320" rx="26" fill="url(#can)" stroke="#CBD5E1" stroke-width="8"/>
  <rect x="262" y="204" width="148" height="48" rx="20" fill="#E2E8F0"/>
  <path d="M278 240c18-62 100-84 116 0" stroke="#94A3B8" stroke-width="10" stroke-linecap="round"/>
  <rect x="268" y="286" width="136" height="118" rx="18" fill="url(#paint)"/>
  <rect x="268" y="416" width="136" height="88" rx="18" fill="#FFFFFF"/>
  <rect x="290" y="446" width="92" height="12" rx="6" fill="${accent}" opacity="0.95"/>
  <rect x="290" y="468" width="72" height="10" rx="5" fill="#94A3B8" opacity="0.85"/>
  <circle cx="495" cy="312" r="72" fill="${accentSoft}" opacity="0.9"/>
  <path d="M478 334c10-44 34-72 72-86" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
  <path d="M430 382h88" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
  <path d="M414 382c12-26 30-39 56-39" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
  <rect x="738" y="168" width="312" height="464" rx="28" fill="${surface}"/>
  ${scene}
  <rect x="738" y="560" width="312" height="72" rx="22" fill="#FFFFFF"/>
  <text x="786" y="605" fill="#0F172A" font-size="30" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${feature}</text>
  <text x="160" y="540" fill="#0F172A" font-size="72" font-family="Segoe UI, Arial, sans-serif" font-weight="800">${title}</text>
  <text x="160" y="594" fill="#475569" font-size="30" font-family="Segoe UI, Arial, sans-serif" font-weight="600">${tagline}</text>
  <rect x="160" y="130" width="168" height="48" rx="24" fill="${accentSoft}"/>
  <text x="192" y="162" fill="${accent}" font-size="24" font-family="Segoe UI, Arial, sans-serif" font-weight="700">PAINT SHOP</text>
</svg>`;
}

async function writeAsset(item) {
  const filePath = path.join(outputDir, `${item.slug}.svg`);
  await fs.writeFile(filePath, buildSvg(item), 'utf8');
}

await fs.mkdir(outputDir, { recursive: true });

for (const item of manifest.products) {
  await writeAsset(item);
}

await writeAsset(manifest.placeholder);

console.log(`Generated ${manifest.products.length + 1} paint product assets in ${outputDir}`);