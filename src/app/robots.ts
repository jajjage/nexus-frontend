import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/", "/account/", "/_next/"],
      },
    ],
    sitemap: "https://nexusdatasub.com/sitemap.xml",
  };
}
