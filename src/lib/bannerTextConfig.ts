/**
 * GLOBAL BANNER TEXT CONFIGURATION
 * ===============================
 * Backend-enforced rules for banner text rendering.
 * This is the SINGLE SOURCE OF TRUTH for all text/emoji rendering decisions.
 * 
 * RULE: All auto-generated text and emojis are DISABLED by default.
 * Only user-provided custom content is allowed.
 * 
 * This configuration is:
 * - Backend-driven (not toggleable from frontend)
 * - Future-proof (AI/automation safe)
 * - Route-agnostic (applies globally)
 */

// ==========================================
// HARD FLAGS - DO NOT MODIFY WITHOUT REVIEW
// ==========================================

export const BANNER_TEXT_FLAGS = {
  // Master kill switch - overrides all other settings
  DISABLE_ALL_AUTO_TEXT: true,
  
  // Emoji controls
  DISABLE_ALL_EMOJIS: true,
  DISABLE_CATEGORY_EMOJIS: true,
  
  // Title controls
  DISABLE_AUTO_TITLES: true,
  DISABLE_CATEGORY_TITLES: true,
  DISABLE_GREETING_TEXT: true,
  
  // Category-specific overrides (all disabled)
  DISABLE_BIRTHDAY_TEXT: true,
  DISABLE_ANNIVERSARY_TEXT: true,
  DISABLE_BONANZA_TEXT: true,
  DISABLE_FESTIVAL_TEXT: true,
  DISABLE_MEETING_TEXT: true,
  DISABLE_MOTIVATIONAL_TEXT: true,
  DISABLE_RANK_TEXT: true,
  DISABLE_STORY_TEXT: true,
} as const;

// ==========================================
// EMOJI BLOCKLIST - Comprehensive list
// ==========================================

const BLOCKED_EMOJIS = [
  // Celebration
  '🎂', '🎉', '🎊', '🥳', '🎈', '🎁', '🪅', '🎆', '🎇',
  // Hearts/Love
  '💞', '❤️', '💕', '💖', '💗', '💓', '💝', '💘', '💟', '♥️',
  // Calendar/Events
  '📅', '📆', '🗓️',
  // Decorative
  '✨', '⭐', '🌟', '💫', '🔥', '⚡', '🏆', '🥇', '🎖️', '🏅',
  // Gestures
  '👏', '🙌', '🤝', '👋', '✋', '🖐️',
  // Other common decoratives
  '🌺', '🌸', '💐', '🌹', '🌷', '🌼', '🌻',
  // Sparkles variants
  '💎', '💠', '🔷', '🔶',
] as const;

// ==========================================
// AUTO-GENERATED TEXT BLOCKLIST
// ==========================================

const BLOCKED_TEXT_PATTERNS = [
  // Birthday
  'HAPPY BIRTHDAY',
  'Happy Birthday',
  'BIRTHDAY WISHES',
  'Birthday Wishes',
  
  // Anniversary
  'HAPPY ANNIVERSARY',
  'Happy Anniversary',
  'ANNIVERSARY WISHES',
  'Anniversary Wishes',
  
  // Festival
  'FESTIVAL GREETINGS',
  'Festival Greetings',
  'HAPPY DIWALI',
  'HAPPY HOLI',
  'HAPPY EID',
  'MERRY CHRISTMAS',
  'HAPPY NEW YEAR',
  
  // Meeting/Event
  'TEAM MEETING',
  'Team Meeting',
  'EVENT INVITATION',
  
  // Motivational
  'MOTIVATIONAL',
  'INSPIRATION',
  
  // Bonanza/Trip
  'BONANZA',
  'TRIP WINNER',
  'ACHIEVER',
  
  // General greetings
  'CONGRATULATIONS',
  'Congratulations',
  'CONGRATS',
  'BEST WISHES',
  'Best Wishes',
] as const;

// ==========================================
// TEXT SANITIZATION FUNCTIONS
// ==========================================

/**
 * Removes all emojis from a string
 */
export function sanitizeEmojis(text: string): string {
  if (!text || !BANNER_TEXT_FLAGS.DISABLE_ALL_EMOJIS) return text;
  
  // Remove emojis using regex (comprehensive emoji pattern)
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols Extended-A
    .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch/Hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Media control symbols
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // More media symbols
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
    .replace(/[\u{25B6}]/gu, '')            // Play button
    .replace(/[\u{25C0}]/gu, '')            // Reverse button
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // More squares
    .replace(/[\u{2614}-\u{2615}]/gu, '')   // Umbrella/Hot beverage
    .replace(/[\u{2648}-\u{2653}]/gu, '')   // Zodiac
    .replace(/[\u{267F}]/gu, '')            // Wheelchair
    .replace(/[\u{2693}]/gu, '')            // Anchor
    .replace(/[\u{26A1}]/gu, '')            // High voltage
    .replace(/[\u{26AA}-\u{26AB}]/gu, '')   // Circles
    .replace(/[\u{26BD}-\u{26BE}]/gu, '')   // Soccer/Baseball
    .replace(/[\u{26C4}-\u{26C5}]/gu, '')   // Snowman/Sun
    .replace(/[\u{26CE}]/gu, '')            // Ophiuchus
    .replace(/[\u{26D4}]/gu, '')            // No entry
    .replace(/[\u{26EA}]/gu, '')            // Church
    .replace(/[\u{26F2}-\u{26F3}]/gu, '')   // Fountain/Golf
    .replace(/[\u{26F5}]/gu, '')            // Sailboat
    .replace(/[\u{26FA}]/gu, '')            // Tent
    .replace(/[\u{26FD}]/gu, '')            // Fuel pump
    .replace(/[\u{2702}]/gu, '')            // Scissors
    .replace(/[\u{2705}]/gu, '')            // Check mark
    .replace(/[\u{2708}-\u{270D}]/gu, '')   // Airplane to Writing hand
    .replace(/[\u{270F}]/gu, '')            // Pencil
    .replace(/[\u{2712}]/gu, '')            // Black nib
    .replace(/[\u{2714}]/gu, '')            // Check mark
    .replace(/[\u{2716}]/gu, '')            // X mark
    .replace(/[\u{271D}]/gu, '')            // Latin cross
    .replace(/[\u{2721}]/gu, '')            // Star of David
    .replace(/[\u{2728}]/gu, '')            // Sparkles
    .replace(/[\u{2733}-\u{2734}]/gu, '')   // Eight spoked asterisk
    .replace(/[\u{2744}]/gu, '')            // Snowflake
    .replace(/[\u{2747}]/gu, '')            // Sparkle
    .replace(/[\u{274C}]/gu, '')            // Cross mark
    .replace(/[\u{274E}]/gu, '')            // Cross mark with box
    .replace(/[\u{2753}-\u{2755}]/gu, '')   // Question marks
    .replace(/[\u{2757}]/gu, '')            // Exclamation mark
    .replace(/[\u{2763}-\u{2764}]/gu, '')   // Heart exclamation/Red heart
    .replace(/[\u{2795}-\u{2797}]/gu, '')   // Plus/Minus/Division
    .replace(/[\u{27A1}]/gu, '')            // Right arrow
    .replace(/[\u{27B0}]/gu, '')            // Curly loop
    .replace(/[\u{27BF}]/gu, '')            // Double curly loop
    .replace(/[\u{2934}-\u{2935}]/gu, '')   // Arrows
    .replace(/[\u{2B05}-\u{2B07}]/gu, '')   // Arrows
    .replace(/[\u{2B1B}-\u{2B1C}]/gu, '')   // Squares
    .replace(/[\u{2B50}]/gu, '')            // Star
    .replace(/[\u{2B55}]/gu, '')            // Circle
    .replace(/[\u{3030}]/gu, '')            // Wavy dash
    .replace(/[\u{303D}]/gu, '')            // Part alternation mark
    .replace(/[\u{3297}]/gu, '')            // Circled Ideograph Congratulation
    .replace(/[\u{3299}]/gu, '')            // Circled Ideograph Secret
    .trim();
}

/**
 * Checks if text contains blocked auto-generated patterns
 */
export function containsBlockedText(text: string): boolean {
  if (!text) return false;
  const upperText = text.toUpperCase();
  return BLOCKED_TEXT_PATTERNS.some(pattern => 
    upperText.includes(pattern.toUpperCase())
  );
}

/**
 * Removes blocked text patterns from a string
 */
export function sanitizeBlockedText(text: string): string {
  if (!text || !BANNER_TEXT_FLAGS.DISABLE_AUTO_TITLES) return text;
  
  let sanitized = text;
  BLOCKED_TEXT_PATTERNS.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized.trim();
}

/**
 * Full text sanitization - removes emojis and blocked patterns
 */
export function sanitizeBannerText(text: string): string {
  if (!text) return '';
  if (!BANNER_TEXT_FLAGS.DISABLE_ALL_AUTO_TEXT) return text;
  
  let sanitized = text;
  sanitized = sanitizeEmojis(sanitized);
  sanitized = sanitizeBlockedText(sanitized);
  
  return sanitized.trim();
}

// ==========================================
// CATEGORY-SPECIFIC RENDER CHECKS
// ==========================================

export type BannerCategory = 
  | 'rank' 
  | 'bonanza' 
  | 'birthday' 
  | 'anniversary' 
  | 'meeting' 
  | 'festival' 
  | 'motivational' 
  | 'story';

/**
 * Checks if auto-text should be rendered for a category
 * Returns FALSE if text should be blocked (disabled)
 */
export function shouldRenderAutoText(category: BannerCategory): boolean {
  // Master kill switch
  if (BANNER_TEXT_FLAGS.DISABLE_ALL_AUTO_TEXT) return false;
  if (BANNER_TEXT_FLAGS.DISABLE_AUTO_TITLES) return false;
  
  // Category-specific checks
  switch (category) {
    case 'birthday':
      return !BANNER_TEXT_FLAGS.DISABLE_BIRTHDAY_TEXT;
    case 'anniversary':
      return !BANNER_TEXT_FLAGS.DISABLE_ANNIVERSARY_TEXT;
    case 'bonanza':
      return !BANNER_TEXT_FLAGS.DISABLE_BONANZA_TEXT;
    case 'festival':
      return !BANNER_TEXT_FLAGS.DISABLE_FESTIVAL_TEXT;
    case 'meeting':
      return !BANNER_TEXT_FLAGS.DISABLE_MEETING_TEXT;
    case 'motivational':
      return !BANNER_TEXT_FLAGS.DISABLE_MOTIVATIONAL_TEXT;
    case 'rank':
      return !BANNER_TEXT_FLAGS.DISABLE_RANK_TEXT;
    case 'story':
      return !BANNER_TEXT_FLAGS.DISABLE_STORY_TEXT;
    default:
      return false;
  }
}

/**
 * Checks if emojis should be rendered for a category
 * Returns FALSE if emojis should be blocked
 */
export function shouldRenderEmoji(category: BannerCategory): boolean {
  // Master kill switches
  if (BANNER_TEXT_FLAGS.DISABLE_ALL_AUTO_TEXT) return false;
  if (BANNER_TEXT_FLAGS.DISABLE_ALL_EMOJIS) return false;
  if (BANNER_TEXT_FLAGS.DISABLE_CATEGORY_EMOJIS) return false;
  
  return true;
}

/**
 * Checks if greeting text should be rendered (e.g., "HAPPY BIRTHDAY")
 * Returns FALSE if greeting should be blocked
 */
export function shouldRenderGreeting(category: BannerCategory): boolean {
  // Master kill switches
  if (BANNER_TEXT_FLAGS.DISABLE_ALL_AUTO_TEXT) return false;
  if (BANNER_TEXT_FLAGS.DISABLE_GREETING_TEXT) return false;
  if (BANNER_TEXT_FLAGS.DISABLE_CATEGORY_TITLES) return false;
  
  return shouldRenderAutoText(category);
}

// ==========================================
// RESPONSE CLEANUP FOR API/BACKEND
// ==========================================

/**
 * Cleans banner data before rendering/response
 * Use this on any data coming from backend or before sending to frontend
 */
export function cleanBannerResponse<T extends Record<string, unknown>>(data: T): T {
  if (!data || !BANNER_TEXT_FLAGS.DISABLE_ALL_AUTO_TEXT) return data;
  
  const cleaned = { ...data };
  
  // Clean string fields that might contain auto-generated content
  const textFields = ['title', 'greeting', 'subtitle', 'autoText', 'categoryTitle'];
  
  textFields.forEach(field => {
    if (typeof cleaned[field] === 'string') {
      (cleaned as Record<string, unknown>)[field] = sanitizeBannerText(cleaned[field] as string);
    }
  });
  
  return cleaned;
}

/**
 * Validates banner data against text rules
 * Returns validation result with any warnings
 */
export function validateBannerData(data: Record<string, unknown>): {
  valid: boolean;
  warnings: string[];
  sanitized: Record<string, unknown>;
} {
  const warnings: string[] = [];
  const sanitized = { ...data };
  
  // Check for emojis in user content
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const originalLength = value.length;
      const sanitizedValue = sanitizeEmojis(value);
      if (sanitizedValue.length !== originalLength) {
        warnings.push(`Emojis removed from field: ${key}`);
        (sanitized as Record<string, unknown>)[key] = sanitizedValue;
      }
    }
  });
  
  return {
    valid: warnings.length === 0,
    warnings,
    sanitized
  };
}

// ==========================================
// EXPORT BLOCKLISTS FOR EXTERNAL USE
// ==========================================

export { BLOCKED_EMOJIS, BLOCKED_TEXT_PATTERNS };
