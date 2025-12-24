# ReBusiness Mobile App Blueprint

> A comprehensive blueprint for building a feature-rich mobile app for DSR (Direct Sales Representatives) with banner creation, analytics, and team management.

## 📋 Project Overview

**ReBusiness** is a mobile application designed for direct sales professionals to create, manage, and share promotional banners for various business events. The app integrates with Supabase for real-time data synchronization and includes advanced features like banner templates, sticker management, and admin controls.

### Key Features

- 🎨 **7 Banner Types**: Bonanza, Birthday, Anniversary, Meeting, Festival, Motivational, Story
- 📸 **Photo Management**: Upload, crop, and manage profile photos
- 🎯 **Template System**: 16 customizable banner templates
- ✨ **Sticker Library**: Admin-managed sticker system for banner customization
- 📊 **Real-time Sync**: Supabase integration for instant updates
- 👥 **Team Management**: Track uplines and team members
- 🔐 **Role-based Access**: User and Admin permission levels
- 💾 **Download & Share**: Export banners as images

---

## 📁 Project Structure

```
mobile-app-blueprint/
├── src/
│   ├── assets/                    # Static assets (images, icons)
│   │   └── images/
│   ├── components/                # Reusable components
│   │   ├── BannerCard.tsx
│   │   ├── BannerPreview.tsx
│   │   ├── UplineCarousel.tsx
│   │   ├── StickerControl.tsx
│   │   └── ...
│   ├── pages/                     # Page components
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── AuthCallback.tsx
│   │   ├── banners/
│   │   │   ├── BannerPreview.tsx
│   │   │   ├── BannerCreate_Bonanza.tsx
│   │   │   ├── BannerCreate_Birthday.tsx
│   │   │   ├── BannerCreate_Anniversary.tsx
│   │   │   ├── BannerCreate_Meeting.tsx
│   │   │   ├── BannerCreate_Festival.tsx
│   │   │   ├── BannerCreate_Motivational.tsx
│   │   │   └── BannerCreate_Story.tsx
│   │   ├── HomePage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   └── admin/
│   │       ├── AdminRanks.tsx
│   │       └── AdminStickers.tsx
│   ├── hooks/                     # Custom React hooks
│   │   ├── useProfile.ts
│   │   ├── useProfilePhotos.ts
│   │   ├── useBannerSettings.ts
│   │   ├── useTemplates.ts
│   │   ├── useStickers.ts
│   │   ├── useBackgroundRemoval.ts
│   │   └── useWalletDeduction.ts
│   ├── data/                      # Data models and types
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── mockData.ts
│   ├── integrations/              # External integrations
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── banners.ts
│   │   │   ├── templates.ts
│   │   │   ├── stickers.ts
│   │   │   ├── profiles.ts
│   │   │   └── ranks.ts
│   │   └── storage.ts
│   ├── lib/                       # Utility functions
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── helpers.ts
│   ├── workers/                   # Web workers for heavy tasks
│   │   ├── imageProcessor.ts
│   │   └── bannerRenderer.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── public/                        # Public assets
├── supabase/                      # Supabase configuration
│   ├── migrations/
│   ├── seed.sql
│   └── config.ts
├── docs/                          # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rebusinessanil/mobile-app-blueprint.git
   cd mobile-app-blueprint
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Setup Supabase**
   ```bash
   # Initialize Supabase locally (optional)
   supabase init
   
   # Run migrations
   supabase migration up
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:5173` in your browser.

---

## 📱 Core Pages & Workflows

### Authentication Flow
- **Login**: Email/password or OAuth (Google, Apple)
- **Register**: Create account with profile information
- **AuthCallback**: Handle OAuth redirects

### Banner Creation Workflow

1. **Select Banner Type** → Choose from 7 categories
2. **Fill Form** → Enter name, team, city, custom messages
3. **Upload Photo** → Select/crop profile photo
4. **Select Template** → Choose from 16 designs
5. **Customize** → Add stickers and adjust layout
6. **Preview** → See final banner design
7. **Download** → Export as PNG image

### Admin Panel
- **AdminRanks**: Manage DSR ranks (Diamond, Gold, Silver, etc.)
- **AdminStickers**: Upload and organize decorative stickers
- **Analytics**: View banner creation stats

---

## 🔑 Key Components

### Pages

#### BannerPreview.tsx
Core preview component with:
- 16 template slot selector
- Real-time sticker management
- Profile picture positioning
- Download functionality
- Admin controls

#### BannerCreate_[Type].tsx
Banner creation forms with:
- Form validation
- Photo upload with cropping
- Template selection
- Upline carousel

#### AdminRanks.tsx & AdminStickers.tsx
Admin management interfaces with:
- CRUD operations
- Bulk uploads
- Real-time synchronization

---

## 🗄️ Database Schema

### Core Tables

- `users` - User profiles and authentication
- `profiles` - Extended user information
- `banners` - Created banner records
- `banner_templates` - Template designs
- `stickers` - Decorative stickers
- `ranks` - DSR rank definitions
- `user_credits` - Wallet balance for downloads

See [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for detailed schema.

---

## 🔌 API Integration

### Supabase Services Used

- **Auth**: User authentication and session management
- **Database**: PostgreSQL via Supabase
- **Storage**: Image storage for photos and banners
- **Realtime**: Live updates for admin changes
- **Edge Functions**: Download tracking and credit deduction

### API Endpoints

See [API.md](docs/API.md) for comprehensive API documentation.

---

## 🎯 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript |
| **Styling** | Tailwind CSS + Shadcn UI |
| **State Management** | React Query (TanStack Query) |
| **Backend** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **File Upload** | Supabase Storage |
| **Image Processing** | html-to-image, sharp |
| **Build Tool** | Vite |
| **Package Manager** | npm/yarn |

---

## 📦 Dependencies

### Core
- `react` - UI framework
- `react-router-dom` - Client routing
- `@tanstack/react-query` - Data fetching & caching
- `@supabase/supabase-js` - Supabase client

### UI & Styling
- `tailwindcss` - Utility-first CSS
- `@radix-ui/*` - Accessible component primitives
- `shadcn-ui` - Pre-built components
- `lucide-react` - Icon library

### Image Processing
- `html-to-image` - DOM to image conversion
- `react-easy-crop` - Image cropping
- `sharp` - Image optimization

### Utilities
- `zod` - Schema validation
- `date-fns` - Date formatting
- `lodash-es` - Utility functions

---

## 🔐 Security Features

- ✅ Row-Level Security (RLS) on Supabase
- ✅ OAuth integration with trusted providers
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ Secure password hashing
- ✅ Session management

---

## 📊 Performance Optimization

- Code splitting with React lazy loading
- Image optimization and lazy loading
- Database query optimization
- Caching strategies with React Query
- Web Worker for heavy computations
- CDN for static assets

---

## 🚢 Deployment

### Platforms Supported
- **Web**: Vercel, Netlify, AWS Amplify
- **Mobile**: React Native (future)
- **Desktop**: Electron (future)

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment guide.

---

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Architecture](docs/ARCHITECTURE.md) - System design and patterns
- [Database Schema](docs/DATABASE_SCHEMA.md) - Complete schema documentation
- [API Reference](docs/API.md) - API endpoints and examples
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm run dev
npm run test
npm run lint

# Commit and push
git commit -m 'Add your feature'
git push origin feature/your-feature
```

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💼 Contact & Support

- **GitHub**: [@rebusinessanil](https://github.com/rebusinessanil)
- **Issues**: [GitHub Issues](https://github.com/rebusinessanil/mobile-app-blueprint/issues)
- **Email**: support@rebusiness.com

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native/Flutter)
- [ ] Video banner support
- [ ] Advanced analytics dashboard
- [ ] Batch banner creation
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Push notifications
- [ ] Social media integration

---

**Last Updated**: December 2024
**Version**: 1.0.0
