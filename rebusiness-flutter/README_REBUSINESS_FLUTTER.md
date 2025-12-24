# 🚀 ReBusiness Flutter Mobile App

## Complete MLM Platform Mobile Application

**Status**: ✅ Production Ready | **Version**: 1.0.0

### 📋 Overview

ReBusiness is a comprehensive Flutter-based mobile application for the ReBusiness MLM platform. It mirrors the functionality of https://rebusiness.in/dashboard with:

- **Stories & Banners** (Festival, Birthday, Anniversary)
- **Rank Promotion System** (Silver, Gold, Platinum, Emerald, Topaz, Ruby Star, Sapphire)
- **Bonanza Trips** Management
- **Categories/Templates** Grid (12+ template types)
- **Messaging System**
- **User Profiles** with wallet & downloads
- **Admin Dashboard** (for superusers)

### 🎯 Features

✅ **Authentication**
- Email/Phone Login
- 4-Digit PIN Support
- Remember Me Functionality
- Forgot Password Recovery

✅ **Dashboard**
- Stories carousel (Festival, Birthday sections)
- Rank badges with promotion details
- Bonanza trips showcase
- Birthday section with templates
- Anniversary reminders
- Motivational quotes

✅ **Categories**
- 12+ template categories
- Search functionality
- Grid/List view toggle
- Quick access to trending templates

✅ **Messaging**
- Direct messaging between users
- Notification badges
- Message history
- Read receipts

✅ **Profile**
- User profile card with rank
- Admin dashboard access
- Wallet balance display
- My Downloads section
- Banner settings
- Change PIN
- Help & FAQ
- Contact Support (WhatsApp)

### 📁 Project Structure

```
rebusiness-flutter/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── config/
│   │   ├── theme.dart           # Theme configuration
│   │   └── constants.dart       # App constants
│   ├── models/
│   │   ├── user.dart
│   │   ├── story.dart
│   │   ├── rank.dart
│   │   └── trip.dart
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   ├── dashboard_provider.dart
│   │   └── profile_provider.dart
│   ├── screens/
│   │   ├── splash_screen.dart
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   ├── register_screen.dart
│   │   │   └── forgot_password_screen.dart
│   │   ├── dashboard/
│   │   │   ├── dashboard_screen.dart
│   │   │   ├── home_screen.dart
│   │   │   ├── stories_screen.dart
│   │   │   └── rank_screen.dart
│   │   ├── categories_screen.dart
│   │   ├── messages_screen.dart
│   │   ├── profile_screen.dart
│   │   └── admin/
│   │       └── admin_dashboard.dart
│   ├── widgets/
│   │   ├── bottom_nav_bar.dart
│   │   ├── story_card.dart
│   │   ├── rank_card.dart
│   │   ├── trip_card.dart
│   │   └── custom_button.dart
│   └── services/
│       ├── api_service.dart
│       └── auth_service.dart
├── pubspec.yaml
├── README.md
└── .gitignore
```

### 🛠 Tech Stack

- **Flutter 3.0+** - Cross-platform mobile framework
- **Dart 3.0+** - Programming language
- **Provider** - State management
- **HTTP** - API communication
- **Shared Preferences** - Local storage
- **Firebase** - Analytics & Push notifications
- **Firebase Cloud Messaging** - Push notifications

### 🚀 Getting Started

#### Prerequisites

- Flutter 3.0 or higher
- Dart 3.0 or higher
- Android Studio / Xcode
- Visual Studio Code (optional)

#### Installation

```bash
# Clone the repository
git clone https://github.com/rebusinessanil/mobile-app-blueprint.git
cd rebusiness-flutter

# Install dependencies
flutter pub get

# Run the app
flutter run
```

#### For Android Build

```bash
# Generate APK (release)
flutter build apk --release

# Output: build/app/outputs/flutter-apk/app-release.apk
```

#### For iOS Build

```bash
# Generate IPA (release)
flutter build ios --release

# Follow Xcode instructions for deployment
```

### 🎨 Design System

#### Colors

- **Primary Yellow**: `#FDD835` (Main CTA, highlights)
- **Dark Background**: `#0A0E27` (Scaffold bg)
- **Dark Card**: `#1A1F3A` (Cards, panels)
- **Text Primary**: `#FFFFFF` (Main text)
- **Text Secondary**: `#B0B3C1` (Secondary text)

#### Typography

- Font Family: Poppins
- Heading: Bold 28px
- Title: Bold 20px
- Body: Regular 16px
- Caption: Regular 12px

### 📡 API Endpoints

```
Base URL: https://api.rebusiness.in/v1

Authentication:
  POST /auth/login              - User login
  POST /auth/register           - User registration
  POST /auth/forgot-password    - Password reset

Dashboard:
  GET /stories                  - Fetch all stories
  GET /ranks                    - Fetch rank data
  GET /trips                    - Fetch bonanza trips

Categories:
  GET /categories               - Fetch all template categories
  GET /templates/:category      - Fetch templates by category

Messages:
  GET /messages                 - Fetch user messages
  POST /messages                - Send message
  PUT /messages/:id/read        - Mark as read

Profile:
  GET /profile                  - Get user profile
  PUT /profile                  - Update profile
  GET /wallet                   - Get wallet balance
  GET /downloads                - Get user downloads
```

### 🔐 Authentication Flow

```
1. User enters Email/Phone
2. App sends OTP to Email/SMS
3. User enters 4-digit PIN
4. JWT token received
5. Token stored in SharedPreferences
6. User redirected to Dashboard
```

### 📱 Screens Breakdown

#### 1. **Splash Screen** (2 seconds)
- ReBusiness logo
- Auto-navigate to Login/Dashboard

#### 2. **Login Screen**
- Email/Phone input
- 4-digit PIN field
- Remember Me checkbox
- Forgot Password link
- Sign Up link

#### 3. **Dashboard**
- Stories section (Festival, Birthday)
- Rank Promotion cards
- Bonanza Trips carousel
- Birthday reminders
- Anniversary section
- Motivational quotes

#### 4. **Categories**
- 12 template categories
- Search bar
- Filter options
- Grid layout

#### 5. **Messages**
- Message list with avatars
- Last message preview
- Unread badge
- Tap to open chat

#### 6. **Profile**
- User card with rank
- Admin Dashboard link
- My Profile edit
- My Wallet
- My Downloads
- Banner Settings
- Change PIN
- Help & FAQ
- Contact Support

### 🔄 State Management

```dart
// Using Provider pattern

// AuthProvider - Manages login state
Provider.of<AuthProvider>(context)
  .login(email, password, pin)

// DashboardProvider - Manages dashboard data
Provider.of<DashboardProvider>(context)
  .fetchStories();
  .fetchRanks();
  .fetchTrips();

// ProfileProvider - Manages user profile
Provider.of<ProfileProvider>(context)
  .fetchProfile();
  .updateProfile();
```

### 🧪 Testing

```bash
# Run tests
flutter test

# Generate coverage report
flutter test --coverage
```

### 📦 Distribution

#### Google Play Store

1. Generate keystore
2. Build App Bundle
3. Upload to Play Store Console
4. Review & publish

#### Apple App Store

1. Create Apple Developer account
2. Build Archive in Xcode
3. Upload via App Store Connect
4. Review & publish

### 🐛 Troubleshooting

**Error**: "Android toolchain not found"
```bash
flutter doctor -v
flutter doctor --android-licenses
```

**Error**: "Build failed"
```bash
flutter clean
flutter pub get
flutter run
```

### 📞 Support

For issues and support:
- GitHub Issues: https://github.com/rebusinessanil/mobile-app-blueprint/issues
- Email: contact@rebusiness.in
- WhatsApp: +91-XXXXXXXXXX

### 📄 License

MIT License - Feel free to use this project

### 👥 Contributors

- ReBusiness Team
- Flutter Community

### 🙏 Acknowledgments

- Flutter Framework
- Dart Language
- Provider Package
- All open-source contributors

---

**Built with ❤️ by ReBusiness Team**
