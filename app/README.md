# FRAP Mobile App

Expo React Native app for the **Family Financial Activity Tracker** (Android-first, Phase 1).

Tracks financial activities — not bank balances. Connects to the Node.js backend in `../backend`.

## Stack

- Expo SDK 54
- React Native
- React Navigation (tabs + stack)
- AsyncStorage for session persistence
- Expo Document Picker for statement uploads

## Screens

- **Auth** — login and register (creates family on signup)
- **Activity** — family activity feed
- **Spend** — transactions list and manual entry
- **Goals** — savings goals and contributions
- **Family** — members, discovered accounts, statement uploads

## Setup

1. Install dependencies:

```bash
cd app
npm install
```

2. Start the backend (`../backend`) on port `8080`.

3. Configure API URL in `app.json`:

```json
"extra": {
  "apiUrl": "http://10.0.2.2:8080"
}
```

| Environment | API URL |
|-------------|---------|
| Android emulator | `http://10.0.2.2:8080` |
| Physical device | `http://<your-pc-lan-ip>:8080` |
| iOS simulator | `http://localhost:8080` |

4. Start the app:

```bash
npm start
# then press 'a' for Android
```

Or directly:

```bash
npm run android
```

## Project layout

```
app/
├── App.js
├── app.json
├── src/
│   ├── api/           # HTTP client
│   ├── components/    # Shared UI
│   ├── constants/     # Theme, categories
│   ├── context/       # Auth session
│   ├── navigation/    # App navigator
│   └── screens/       # Feature screens
└── package.json
```

## Notes

- Uses JWT from backend; token stored in AsyncStorage
- Statement uploads (PDF/CSV/Excel) are stored for future processing
- SMS parsing and AI features are planned for later phases
