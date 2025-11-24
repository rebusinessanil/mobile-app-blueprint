/**
 * Category ID Constants
 * 
 * Central reference for all banner category IDs.
 * These IDs link to the template_categories table in the database.
 * 
 * @see CATEGORY_HIERARCHY_STRUCTURE.md for full documentation
 */

export const CATEGORY_IDS = {
  RANK_PROMOTION: '52985289-a964-4ace-a5d6-538c96b95292',
  BONANZA_TRIPS: 'db3439bc-e556-424e-b1df-75b9d95ea53a',
  BIRTHDAY: '495c1a2b-cf7c-45f7-9ee3-123e06efcc15',
  ANNIVERSARY: 'f5e3be65-736a-41d2-b6fd-ae0d3ceaadf3',
  MEETING: '921d4a1b-f1b3-497f-9d6b-bb03bd54d7cd',
  FESTIVAL: 'a2287d4f-1c5c-4a13-a41c-8c0fcd3b1f20',
  MOTIVATIONAL: 'd8ec183c-ee2c-4b04-af4b-d2b971b86b8e',
} as const;

export const CATEGORY_SLUGS = {
  RANK_PROMOTION: 'rank-promotion',
  BONANZA_TRIPS: 'bonanza-promotion',
  BIRTHDAY: 'birthday',
  ANNIVERSARY: 'anniversary',
  MEETING: 'meeting',
  FESTIVAL: 'festival',
  MOTIVATIONAL: 'motivational',
} as const;

/**
 * Map category slugs to their IDs
 */
export const CATEGORY_SLUG_TO_ID: Record<string, string> = {
  [CATEGORY_SLUGS.RANK_PROMOTION]: CATEGORY_IDS.RANK_PROMOTION,
  [CATEGORY_SLUGS.BONANZA_TRIPS]: CATEGORY_IDS.BONANZA_TRIPS,
  [CATEGORY_SLUGS.BIRTHDAY]: CATEGORY_IDS.BIRTHDAY,
  [CATEGORY_SLUGS.ANNIVERSARY]: CATEGORY_IDS.ANNIVERSARY,
  [CATEGORY_SLUGS.MEETING]: CATEGORY_IDS.MEETING,
  [CATEGORY_SLUGS.FESTIVAL]: CATEGORY_IDS.FESTIVAL,
  [CATEGORY_SLUGS.MOTIVATIONAL]: CATEGORY_IDS.MOTIVATIONAL,
};

/**
 * Helper function to get category ID from slug
 */
export const getCategoryIdFromSlug = (slug: string): string | undefined => {
  return CATEGORY_SLUG_TO_ID[slug];
};

/**
 * Helper function to check if a category slug is valid
 */
export const isValidCategorySlug = (slug: string): boolean => {
  return slug in CATEGORY_SLUG_TO_ID;
};
