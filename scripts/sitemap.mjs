import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const ORIGIN = 'https://www.okansakarya.dev'

function loadLocalEnv() {
  if (!existsSync('.env')) {
    return
  }
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const match = line.trim().match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2]
    }
  }
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const modified = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
  return `  <url>
    <loc>${loc}</loc>${modified}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

loadLocalEnv()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
let projects = []

if (supabaseUrl && supabaseKey) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/projects?select=slug,updated_at&is_published=eq.true&order=updated_at.desc`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
  )
  if (response.ok) {
    projects = await response.json()
  } else {
    console.warn(`sitemap: published projects skipped (${response.status})`)
  }
} else {
  console.warn('sitemap: Supabase env missing, writing the homepage only')
}

const today = new Date().toISOString().slice(0, 10)
const entries = [
  urlEntry({ loc: `${ORIGIN}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' }),
  ...projects
    .filter((project) => typeof project.slug === 'string' && project.slug.length > 0)
    .map((project) =>
      urlEntry({
        loc: `${ORIGIN}/projects/${project.slug}`,
        lastmod: typeof project.updated_at === 'string' ? project.updated_at.slice(0, 10) : undefined,
        changefreq: 'monthly',
        priority: '0.8',
      }),
    ),
]

writeFileSync(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`,
)
console.log(`sitemap: ${entries.length} URL`)
