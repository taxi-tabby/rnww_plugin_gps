# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `rnww-plugin-gps`, an Expo native module that bridges GPS/location functionality between React Native and WebView applications. It provides location permissions, one-shot position retrieval with configurable accuracy, and cached location fallback for Android (FusedLocationProviderClient) and iOS (CLLocationManager).

## Build Commands

```bash
npm run build      # Compile TypeScript (src/ → lib/)
npm run clean      # Remove lib/ directory
npm run prepare    # Build before publish (runs automatically)
```

## Architecture

### Three-Layer Structure

1. **Bridge Layer** (`src/bridge/`) - WebView communication handlers using dependency injection
   - `registerGpsHandlers(config)` accepts `IBridge` and `IPlatform` interfaces
   - Enables host app to provide its own bridge implementation

2. **Module Wrapper** (`src/modules/index.ts`) - Cross-platform TypeScript API
   - Lazy-loads native module via `requireNativeModule('CustomGPS')`
   - Gracefully handles unavailable platforms (returns fallback responses)

3. **Native Modules** (`src/modules/android/`, `src/modules/ios/`)
   - Android: Kotlin with FusedLocationProviderClient (`expo.modules.customgps.GpsModule`)
   - iOS: Swift with CLLocationManager (`GpsModule`)

### Key Interfaces

```typescript
// Host app must implement these
interface IBridge {
  registerHandler(eventName: string, handler: any): void;
  sendToWeb(eventName: string, data: any): void;
}

interface IPlatform {
  OS: 'ios' | 'android' | 'windows' | 'macos' | 'web';
}
```

### Event Flow

WebView → Bridge Handler → Module Wrapper → Native Module → Bridge.sendToWeb → WebView

## Native Module Registration

The native module name is `CustomGPS` (defined in `expo-module.config.json`). The bridge handlers register these events:
- `checkLocationPermission` - Check current permission status
- `requestLocationPermission` - Request location permission (fine/coarse, background)
- `getCurrentLocation` - Get one-shot location with configurable accuracy
- `getLocationStatus` - Check GPS availability and settings

## TypeScript Configuration

- Only `src/bridge/` and `src/types/` are compiled (see `tsconfig.json` include/exclude)
- Native module code in `src/modules/` is excluded from TS compilation but included in npm package
- Output goes to `lib/` with declarations

## Key Types

```typescript
interface LocationPermissionStatus {
  granted: boolean;
  status: 'granted' | 'denied' | 'undetermined' | 'restricted' | 'unavailable';
  accuracy: 'fine' | 'coarse' | 'none';
  background: boolean;
}

interface LocationOptions {
  accuracy?: 'high' | 'balanced' | 'low';   // whitelist validated, default: 'balanced'
  timeout?: number;                          // clamped to 1000~60000ms, default: 10000
  useCachedLocation?: boolean;               // default: true, only uses cache ≤5min old
  fields?: Array<'altitude' | 'speed' | 'heading' | 'accuracy' | 'timestamp'>; // filtered
}

interface LocationResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp?: number;
  isCached?: boolean;
  error?: string;  // 'PERMISSION_DENIED' | 'LOCATION_DISABLED' | 'TIMEOUT' | 'UNAVAILABLE' | 'UNKNOWN'
}
```

## Behavior Notes

- **Cached location staleness**: Both platforms reject cached locations older than 5 minutes, falling back to a fresh request
- **Timeout**: Android uses `Handler.postDelayed` + `setDurationMillis`; iOS uses `Timer.scheduledTimer`. Both guarantee promise resolution
- **Input validation**: Module wrapper validates accuracy (whitelist), timeout (type+range), fields (whitelist filter) before passing to native
- **Concurrent requests (iOS)**: New `getCurrentLocation` calls cancel the previous delegate's timer via `cancel()` before replacing it
- **Double-resolve guard**: Android uses `AtomicBoolean`; iOS uses `hasResponded` flag — prevents promise from resolving more than once
- **Android requestLocationPermission**: Returns immediately with `status: "requesting"` — must call `checkLocationPermission` again for actual result
