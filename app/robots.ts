import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://investview.vercel.app"
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/portfolio", "/perfil"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
