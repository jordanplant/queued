# QD — Queued

> Your theme park day, sorted.

A personal React Native app for planning and tracking theme park trips. Built for Walt Disney World, Disneyland, and Universal parks worldwide.

---

## Changelog

### v0.2
- Trip detail screen with name, resort, park chips, and dates
- Date picker — native iOS spinner with Done button
- Dates stored as ISO strings, displayed as YYYY-MM-DD
- Edit trip modal — slides up pre-filled from detail screen or swipe action
- Delete trip with swipe gesture and confirmation dialog
- Today tab countdown — next upcoming trip with days to go
- Correct back navigation across all screens
- GestureHandlerRootView added for swipe support

### v0.1
- App scaffold with five tabs (Today, Wait Times, Snacks, Itinerary, Profile)
- Auth — register, login, logout, session persistence
- Trip creation and listing
- Parks data for all Disney and Universal parks worldwide with per-park accent colours
- Appwrite connected for auth and database
- NativeWind configured for styling

---

## Features

- [x] Auth — register, login, logout, session persistence
- [x] Trip creation and listing
- [x] Parks data for all Disney and Universal parks worldwide
- [x] Trip detail screen
- [x] Date picker
- [x] Edit and delete trips
- [x] Countdown on dashboard
- [ ] Snack list with Disney menu data
- [ ] Live wait times
- [ ] Itinerary day planner
- [ ] Weather widget
- [ ] Park-reactive accent colours
- [ ] Push notifications for ride wait times
- [ ] Queue games
- [ ] Safari / animal checklist
- [ ] Trip stats and history

---

## Tech Stack

| | |
|---|---|
| Framework | [Expo](https://expo.dev) + [Expo Router](https://expo.github.io/router) |
| Language | TypeScript |
| Styling | [NativeWind](https://nativewind.dev) (Tailwind CSS for React Native) |
| Backend | [Appwrite](https://appwrite.io) |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) |
| Gestures | [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) |

---

## Project Structure

```
app/
├── (auth)/           # Login & register screens
├── (tabs)/           # Main tab navigation
│   ├── index.tsx     # Today / dashboard
│   ├── waittimes.tsx # Live wait times
│   ├── snacks.tsx    # Snack tracker
│   ├── itinerary.tsx # Day planner
│   └── profile.tsx   # Trips & account
└── trip/
    ├── new.tsx       # Create a trip
    └── [id].tsx      # Trip detail

lib/
├── appwrite.ts       # Appwrite client
└── auth.ts           # Auth functions

services/
└── trips.ts          # Trip CRUD

context/
└── AuthContext.tsx   # Global auth state

constants/
├── parks.ts          # All parks data + colours
└── Colors.ts         # Theme colours
```

---

## Notes

This is a personal project built for fun. Not affiliated with Disney or Universal.