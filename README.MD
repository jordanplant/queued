# QD — Queued

> Your theme park day, sorted.

A personal React Native app for planning and tracking theme park trips. Built for Walt Disney World, Disneyland, and Universal parks worldwide.

---

## Changelog

### v0.5

- Profile redesigned with initials avatar, stats grid (trips, snacks saved, snacks eaten, favourites)
- Cog dropdown on profile — settings and logout in one place
- Settings screen with placeholder toggles for clock format, temperature, and date format
- Achievements section on profile — grid of locked achievements with tap-to-open modal
- `constants/achievements.ts` + `components/AchievementGrid.tsx` extracted as standalone files
- Trip cards sorted with upcoming first, past trips below a divider
- Trip status derived from dates rather than stored Appwrite field
- Trip detail screen has placeholder stats row (snacks, favourites, most ridden, distance)
- `formatDateRange` helper in `lib/utils.ts` for consistent date display across the app
- `AuthContext` now exposes `currentTrip` / `setCurrentTrip` with `pickCurrentTrip` logic
- Today tab has inline dropdown trip switcher with skeleton loading during switches
- Wait Times and Snacks consume `currentTrip` from context, removing independent `getTrips` calls
- `getAllFavourites` added to `services/favourites.ts` for user-level favourite counts

### v0.4

- Snack tracker — search Disney menu data, add snacks to your list, filter by park
- Mark snacks as complete, rate them, edit details
- Snacks stored globally per user in Appwrite
- Itinerary day planner — timeline view per trip day
- Park blocks — full day, AM, PM, or custom time ranges with per-park colours
- Events — specific reservations (dining, shows) pinned to a time
- Events rendered on top of park blocks with park accent colour indicator
- Day selector — horizontal scroll of trip dates, auto-scrolls to first item
- Expand earlier/later — extend the timeline in 2-hour increments
- Overlap detection — diagonal stripe pattern shown on conflicting blocks
- Conflict resolution — auto-adjust or remove conflicting block when overlap exceeds 50%
- Edit blocks and events — tap to edit, long press to delete
- Park picker filtered to trip parks only, highlights parks already on schedule
- Time picker — native OS wheel, defaults to 9am for new items
- Splash screen — logo, app name, tagline with fade transition

### v0.3

- Live wait times screen with attractions, shows, and character meets tabs
- Park hours bar showing open, close, early entry, and special events
- Park selector pulled from your next upcoming trip
- Browse any park via the "More" modal without needing a trip
- Browsing mode — if no trips planned, random parks load so the screen is always useful
- Favourites — swipe or long press any attraction, show, or character meet to favourite it
- Favourites float to the top of each tab with a heart indicator
- Favourites stored per-park in Appwrite
- Haptic feedback on long press
- Showtime filtering — past times removed automatically, shows with no times hidden entirely
- Full dark/light colour token system wired across the app

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
- [x] Live wait times with shows, characters, and park hours
- [x] Favourites — swipe or long press, stored in Appwrite
- [x] Browsing mode — browse any park without a trip
- [x] Park colours — UI elements themed to the selected park
- [x] Snack tracker — search, add, edit, complete, rate
- [x] Itinerary day planner — timeline with park blocks and events
- [x] Shared trip context — all tabs read from a single current trip
- [x] Trip switcher — switch active trip from the Today tab
- [x] Profile — avatar, stats, achievements, settings
- [x] Settings screen — clock format, temperature, date format
- [ ] Weather widget
- [ ] Snack filter by trip parks (pending menu data resortId fix)
- [ ] Achievements wired to real unlock conditions
- [ ] Trip stats wired to real data
- [ ] Push notifications for ride wait times
- [ ] Queue games
- [ ] Safari / animal checklist
- [ ] Trip stats and history

---

## Tech Stack

|            |                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------- |
| Framework  | [Expo](https://expo.dev) + [Expo Router](https://expo.github.io/router)                  |
| Language   | TypeScript                                                                               |
| Styling    | [NativeWind](https://nativewind.dev) (Tailwind CSS for React Native)                     |
| Backend    | [Appwrite](https://appwrite.io)                                                          |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)           |
| Gestures   | [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) |

---

## Project Structure

```
app/
├── (auth)/ # Login & register screens
├── (tabs)/ # Main tab navigation
│ ├── index.tsx # Today / dashboard
│ ├── waittimes.tsx # Live wait times
│ ├── snacks.tsx # Snack tracker
│ ├── itinerary.tsx # Day planner
│ └── profile.tsx # Trips, stats & account
├── trip/
│ ├── new.tsx # Create a trip
│ └── [id].tsx # Trip detail
└── settings.tsx # App settings

lib/
├── appwrite.ts # Appwrite client
├── auth.ts # Auth functions
├── haptics.ts # Haptic feedback wrapper
└── utils.ts # Shared helpers (toDateOnly, formatTripDate, formatDateRange)

services/
├── trips.ts # Trip CRUD
├── waitTimes.ts # Live wait times, shows, character meets
├── favourites.ts # Favourites CRUD
├── snacks.ts # Snack CRUD
├── itinerary.ts # Itinerary CRUD
└── weather.ts # Weather fetch

hooks/
├── useFavourites.ts # Favourite toggle with optimistic updates
├── useSnacks.ts # Snack state and actions
└── useItinerary.ts # Itinerary state, conflict detection, batched updates

components/
├── SwipeableRow.tsx # Reusable swipe action component
├── AchievementGrid.tsx # Achievements grid and modal
└── today/ # Today tab subcomponents

context/
└── AuthContext.tsx # Global auth + current trip state

constants/
├── parks.ts # All parks data + colours
├── Colors.ts # Theme colour tokens
└── achievements.ts # Achievements data
```

---

## Notes

This is a personal project built for fun. Not affiliated with Disney or Universal.
