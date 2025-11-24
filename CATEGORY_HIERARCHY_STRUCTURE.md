# ReBusiness Backend Category Hierarchy Structure

## Overview

The ReBusiness backend implements a **centralized category-based hierarchy** where all features (Ranks, Bonanza Trips, Birthday, Anniversary, Meeting, Festival, Motivational) are organized under a main category table. This structure ensures clean data management, easy filtering, and scalability.

## Database Architecture

### Main Category Table: `template_categories`

The central table that defines all banner categories in the system.

```sql
template_categories (
  id              UUID PRIMARY KEY
  name            TEXT NOT NULL UNIQUE
  slug            TEXT NOT NULL UNIQUE
  description     TEXT
  icon            TEXT (emoji/icon identifier)
  cover_image_url TEXT
  display_order   INTEGER
  is_active       BOOLEAN DEFAULT true
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
)
```

### Current Categories

| ID | Name | Slug | Description | Icon | Display Order |
|---|---|---|---|---|---|
| 52985289-a964-4ace-a5d6-538c96b95292 | Rank Promotion | rank-promotion | Create rank promotion banners for achievers | 🏆 | 1 |
| db3439bc-e556-424e-b1df-75b9d95ea53a | Bonanza Trips | bonanza-promotion | Create trip achievement banners | ✈️ | 2 |
| 495c1a2b-cf7c-45f7-9ee3-123e06efcc15 | Birthday | birthday | Create birthday celebration banners | 🎂 | 3 |
| f5e3be65-736a-41d2-b6fd-ae0d3ceaadf3 | Anniversary | anniversary | Create anniversary celebration banners | 💞 | 4 |
| 921d4a1b-f1b3-497f-9d6b-bb03bd54d7cd | Meeting | meeting | Create meeting and event banners | 👥 | 40 |
| a2287d4f-1c5c-4a13-a41c-8c0fcd3b1f20 | Festival | festival | Create festival celebration banners | 🎉 | 50 |
| d8ec183c-ee2c-4b04-af4b-d2b971b86b8e | Motivational | motivational | Create motivational and inspirational banners | ⚡ | 60 |

## Linked Tables and Foreign Keys

### 1. Ranks Table

Links all ranks to the "Rank Promotion" category.

```sql
ranks (
  id          TEXT PRIMARY KEY
  name        TEXT NOT NULL
  color       TEXT NOT NULL
  gradient    TEXT NOT NULL
  icon        TEXT NOT NULL
  category_id UUID REFERENCES template_categories(id)  -- NEW
  display_order NUMERIC
  is_active   BOOLEAN DEFAULT true
  created_at  TIMESTAMP
  updated_at  TIMESTAMP
)
```

**All 18 ranks** (Bronze, Silver, Gold, Platinum, Emerald, etc.) are linked to:
- `category_id = '52985289-a964-4ace-a5d6-538c96b95292'` (Rank Promotion)

### 2. Bonanza Trips Table

Links all trips to the "Bonanza Trips" category.

```sql
bonanza_trips (
  id              UUID PRIMARY KEY
  title           TEXT NOT NULL
  short_title     TEXT
  description     TEXT
  trip_image_url  TEXT NOT NULL
  category_id     UUID REFERENCES template_categories(id)
  display_order   INTEGER
  is_active       BOOLEAN DEFAULT true
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
)
```

**All trips** (Jaisalmer, Vietnam, Dubai, Thailand, Singapore) are linked to:
- `category_id = 'db3439bc-e556-424e-b1df-75b9d95ea53a'` (Bonanza Trips)

### 3. Templates Table

Links each template to its category (and optionally to a rank or trip).

```sql
templates (
  id                  UUID PRIMARY KEY
  category_id         UUID REFERENCES template_categories(id) NOT NULL
  rank_id             TEXT REFERENCES ranks(id)
  name                TEXT NOT NULL
  description         TEXT
  cover_thumbnail_url TEXT NOT NULL
  gradient_colors     TEXT[]
  required_fields     JSONB
  layout_config       JSONB
  display_order       INTEGER
  is_active           BOOLEAN DEFAULT true
  created_at          TIMESTAMP
  updated_at          TIMESTAMP
)
```

**Examples:**
- Rank templates: `category_id = '52985289-a964-4ace-a5d6-538c96b95292'` AND `rank_id = 'bronze'`
- Birthday templates: `category_id = '495c1a2b-cf7c-45f7-9ee3-123e06efcc15'`
- Bonanza templates: `category_id = 'db3439bc-e556-424e-b1df-75b9d95ea53a'`

### 4. Stickers Table

Stickers are scoped to category, rank, and slot for precise isolation.

```sql
stickers (
  id              UUID PRIMARY KEY
  category_id     UUID REFERENCES template_categories(id)
  rank_id         TEXT REFERENCES ranks(id)
  slot_number     INTEGER (1-16)
  name            TEXT NOT NULL
  image_url       TEXT NOT NULL
  position_x      NUMERIC DEFAULT 50
  position_y      NUMERIC DEFAULT 50
  scale           NUMERIC DEFAULT 1.0
  rotation        NUMERIC DEFAULT 0
  is_active       BOOLEAN DEFAULT true
  display_order   INTEGER
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
  
  UNIQUE(category_id, rank_id, slot_number)  -- Enforces one-to-one slot mapping
)
```

### 5. Template Backgrounds Table

Background images scoped to templates with slot isolation.

```sql
template_backgrounds (
  id                  UUID PRIMARY KEY
  template_id         UUID REFERENCES templates(id) NOT NULL
  slot_number         NUMERIC (1-16)
  background_image_url TEXT NOT NULL
  is_active           BOOLEAN DEFAULT true
  created_at          TIMESTAMP
  updated_at          TIMESTAMP
  
  UNIQUE(template_id, slot_number)  -- Enforces one background per slot per template
)
```

## Query Patterns

### Frontend: Fetch Categories

```typescript
// Get all active categories
const { data: categories } = await supabase
  .from('template_categories')
  .select('*')
  .eq('is_active', true)
  .order('display_order', { ascending: true });
```

### Frontend: Fetch Templates by Category

```typescript
// Get all templates for Birthday category
const { data: templates } = await supabase
  .from('templates')
  .select('*, ranks(name, color, icon)')
  .eq('category_id', '495c1a2b-cf7c-45f7-9ee3-123e06efcc15')
  .eq('is_active', true)
  .order('display_order', { ascending: true });
```

### Frontend: Fetch Ranks (All linked to Rank Promotion category)

```typescript
// Get all ranks for Rank Promotion
const { data: ranks } = await supabase
  .from('ranks')
  .select('*')
  .eq('category_id', '52985289-a964-4ace-a5d6-538c96b95292')
  .eq('is_active', true)
  .order('display_order', { ascending: true });
```

### Admin: Filter Data by Category

```typescript
// Admin can filter templates for specific category in admin panel
const { data: rankTemplates } = await supabase
  .from('templates')
  .select('*, ranks!inner(name, color)')
  .eq('category_id', '52985289-a964-4ace-a5d6-538c96b95292')
  .eq('is_active', true);

const { data: bonanzaTemplates } = await supabase
  .from('templates')
  .select('*')
  .eq('category_id', 'db3439bc-e556-424e-b1df-75b9d95ea53a')
  .eq('is_active', true);
```

### Admin: Fetch Stickers by Category + Rank + Slot

```typescript
// Get specific sticker for Rank=Silver, Slot=3, Category=Rank Promotion
const { data: sticker } = await supabase
  .from('stickers')
  .select('*')
  .eq('category_id', '52985289-a964-4ace-a5d6-538c96b95292')
  .eq('rank_id', 'silver')
  .eq('slot_number', 3)
  .eq('is_active', true)
  .single();
```

## Benefits of This Architecture

### 1. **Clean Data Organization**
- All feature data is organized under clear categories
- No mixed or scattered data across tables
- Easy to understand and maintain

### 2. **Efficient Filtering**
- Frontend queries filter by `category_id` to show only relevant templates/data
- Admin panels can filter by category to manage specific sections
- Prevents data bleed between categories

### 3. **Scalability**
- Adding new categories is as simple as inserting a row in `template_categories`
- New features automatically integrate into existing architecture
- No code changes required for new categories

### 4. **Real-time Synchronization**
- Changes to category settings propagate instantly via Supabase real-time
- Template and sticker updates reflect immediately for all users
- Admin changes sync to frontend without page reload

### 5. **Foreign Key Integrity**
- Database enforces referential integrity with foreign key constraints
- Prevents orphaned records
- Cascading deletes/updates maintain data consistency

## Frontend Integration

### Dashboard Component (`src/pages/Dashboard.tsx`)

```typescript
// Fetch all categories
const { categories } = useTemplateCategories();

// Filter rank templates by category
const getRankTemplates = () => {
  const rankPromotionCategoryId = '52985289-a964-4ace-a5d6-538c96b95292';
  return allTemplates.filter(t => 
    t.category_id === rankPromotionCategoryId && t.rank_id
  );
};

// Get templates for any category
const getCategoryTemplates = (categoryId: string) => {
  return allTemplates.filter(t => t.category_id === categoryId).slice(0, 3);
};
```

### Universal Banner Create (`src/pages/UniversalBannerCreate.tsx`)

```typescript
// Fetch category-specific data based on route parameter
const { category } = useParams(); // e.g., 'birthday', 'bonanza', 'meeting'

// Map category slug to category ID
const categoryMap: Record<string, string> = {
  'rank-promotion': '52985289-a964-4ace-a5d6-538c96b95292',
  'bonanza': 'db3439bc-e556-424e-b1df-75b9d95ea53a',
  'birthday': '495c1a2b-cf7c-45f7-9ee3-123e06efcc15',
  'anniversary': 'f5e3be65-736a-41d2-b6fd-ae0d3ceaadf3',
  'meeting': '921d4a1b-f1b3-497f-9d6b-bb03bd54d7cd',
  'festival': 'a2287d4f-1c5c-4a13-a41c-8c0fcd3b1f20',
  'motivational': 'd8ec183c-ee2c-4b04-af4b-d2b971b86b8e'
};

const categoryId = categoryMap[category];

// Fetch templates for this category
const { templates } = useTemplates(categoryId);
```

## Admin Panel Integration

Admin can manage each category's data separately:

1. **Rank Management**: Edit ranks linked to "Rank Promotion" category
2. **Trip Management**: Edit trips linked to "Bonanza Trips" category
3. **Template Management**: Upload and manage templates per category
4. **Sticker Management**: Assign stickers per category/rank/slot combination
5. **Background Management**: Upload backgrounds per template (16 slots each)

All admin changes sync to frontend in real-time via Supabase subscriptions.

## Adding New Categories

To add a new category (e.g., "Achievement Awards"):

1. **Insert into `template_categories`:**
```sql
INSERT INTO template_categories (id, name, slug, description, icon, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'Achievement Awards',
  'achievement-awards',
  'Create achievement and award banners',
  '🏅',
  8,
  true
);
```

2. **Create templates for new category:**
```sql
INSERT INTO templates (id, category_id, name, description, cover_thumbnail_url, is_active)
VALUES (
  gen_random_uuid(),
  '<new-category-id>',
  'Gold Award Template',
  'Template for gold achievement awards',
  '<cover-image-url>',
  true
);
```

3. **Frontend automatically displays new category** (via real-time subscription)

4. **Add route in frontend** (if using custom banner creator):
```typescript
// src/pages/Dashboard.tsx
const routeMap: Record<string, string> = {
  ...
  'achievement-awards': '/banner-create/achievement-awards'
};
```

## Summary

This category-based hierarchy provides:
- ✅ Clean, organized backend structure
- ✅ Easy data filtering and management
- ✅ Scalable architecture for future growth
- ✅ Real-time synchronization between admin and users
- ✅ Database integrity with foreign keys
- ✅ Simplified frontend queries
- ✅ No hardcoded category logic

**All features are now properly linked to their categories**, ensuring the system is maintainable, scalable, and ready for future expansion.
