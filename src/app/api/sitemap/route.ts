import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://acadly.in'
    
    // Get active listings for sitemap
    const listings = await prisma.listing.findMany({
      where: { isActive: true },
      select: {
        id: true,
        updatedAt: true
      },
      take: 1000, // Limit for performance
      orderBy: { updatedAt: 'desc' }
    })

    // Get categories
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        createdAt: true
      }
    })

    // Static pages
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/listings', priority: '0.9', changefreq: 'hourly' },
      { url: '/auth/login', priority: '0.7', changefreq: 'monthly' },
      { url: '/auth/signup', priority: '0.7', changefreq: 'monthly' },
      { url: '/dashboard', priority: '0.8', changefreq: 'daily' },
    ]

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
  ${listings.map(listing => `
  <url>
    <loc>${baseUrl}/listings/${listing.id}</loc>
    <lastmod>${listing.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${categories.map(category => `
  <url>
    <loc>${baseUrl}/listings?categoryId=${category.id}</loc>
    <lastmod>${category.createdAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}