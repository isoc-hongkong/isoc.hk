import { sanityClient } from 'sanity:client';
import { defineQuery } from 'groq';
import { createImageUrlBuilder } from '@sanity/image-url';

const builder = createImageUrlBuilder(sanityClient);
export const urlFor = (source: any) => builder.image(source);

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0] {
    siteTitle,
    siteDescription,
    "navLinks": navLinks[]{ _key, label, url, isExternal },
    stripePublishableKey
  }
`);

export const RECENT_POSTS_QUERY = defineQuery(`
  *[_type == "post"] | order(publishedAt desc) [0...5] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    "categories": categories[]->{ title, "slug": slug.current },
    featuredImage { asset->{ _id }, alt },
    body
  }
`);

export const ALL_POSTS_QUERY = defineQuery(`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "categories": categories[]->{ title, "slug": slug.current },
    featuredImage { asset->{ _id }, alt }
  }
`);

export const ALL_POSTS_WITH_BODY_QUERY = defineQuery(`
  *[_type == "post"] {
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    modifiedAt,
    excerpt,
    description,
    wpId,
    "categories": categories[]->{ title, "slug": slug.current },
    "tags": tags[]->{ title, "slug": slug.current },
    featuredImage { asset->{ _id }, alt },
    body
  }
`);

export const ALL_CATEGORIES_QUERY = defineQuery(`
  *[_type == "category"] {
    _id,
    title,
    "slug": slug.current,
    "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      excerpt,
      featuredImage { asset->{ _id }, alt }
    }
  }
`);

export const ALL_PAGES_QUERY = defineQuery(`
  *[_type == "page"] {
    _id,
    title,
    "slug": slug.current,
    description,
    body,
    stripePlan,
    "parent": parent->{ title, "slug": slug.current }
  }
`);
