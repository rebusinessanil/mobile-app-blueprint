# Setup Guide

## Complete Setup Instructions for ReBusiness Mobile App

### Prerequisites

- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **npm 9+** or **yarn** - Comes with Node.js
- **Git** - [Download Git](https://git-scm.com/)
- **Supabase Account** - [Create Free Account](https://supabase.com)
- **Text Editor** - VS Code, WebStorm, or similar

### Step 1: Clone Repository

```bash
git clone https://github.com/rebusinessanil/mobile-app-blueprint.git
cd mobile-app-blueprint
```

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### Step 3: Setup Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Note your project URL and API keys
4. Copy `.env.example` to `.env.local`

### Step 4: Configure Environment Variables

Create `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3000
```

### Step 5: Initialize Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your_project_ref

# Run migrations
supabase migration up
```

### Step 6: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Supabase Database Setup

### Create Tables

Run the following SQL in Supabase SQL Editor:

```sql
-- Users table (handled by Supabase Auth)
-- Create additional tables as needed

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  rank TEXT,
  mobile TEXT,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  template_id INT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE banner_templates (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE,
  design_data JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE stickers (
  id SERIAL PRIMARY KEY,
  name TEXT,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

### Enable Row Level Security

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own banners"
  ON banners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create banners"
  ON banners FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

---

## Build for Production

```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## Troubleshooting

### Port Already in Use

```bash
# Use different port
npm run dev -- --port 5174
```

### Supabase Connection Issues

1. Check `.env.local` credentials
2. Verify Supabase project is active
3. Check CORS settings in Supabase
4. Check network connectivity

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## VS Code Extensions (Recommended)

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin
- Prettier - Code formatter
- ESLint

---

## Next Steps

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
2. Check [API.md](API.md) for API documentation
3. Review [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for data models
4. Start developing features!

---

**Last Updated**: December 2024
