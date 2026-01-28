# GPS Module Implementation Plan

## Overview

Convert `rnww-plugin-camera` to `rnww-plugin-gps` - a React Native WebView GPS plugin.

**Design Document:** `docs/plans/2026-01-28-gps-module-design.md`

## Pre-Implementation Checklist

- [x] Design document created and approved
- [ ] Verify expo-modules-core compatibility with location APIs
- [ ] Confirm FusedLocationProviderClient availability for Android
- [ ] Confirm CLLocationManager availability for iOS

## Implementation Steps

### Step 1: Create GPS Type Definitions

**File:** `src/types/gps-module.ts` (new)

Create TypeScript interfaces for:
- `LocationPermissionStatus` - Permission state with fine/coarse/background
- `LocationPermissionRequest` - Permission request options
- `LocationOptions` - Accuracy, timeout, cached location, fields
- `LocationResult` - Position data with optional fields
- `LocationStatus` - GPS availability and provider info
- `LocationError` - Error type union

**Verification:** TypeScript compiles without errors

---

### Step 2: Update Types Index

**File:** `src/types/index.ts`

- Remove `camera-module` export
- Add `gps-module` export

**Verification:** No import errors in dependent files

---

### Step 3: Delete Camera Type Definitions

**File:** `src/types/camera-module.ts` (delete)

**Verification:** File removed

---

### Step 4: Create GPS Module Wrapper

**File:** `src/modules/index.ts` (replace)

Implement cross-platform TypeScript API:
- `checkLocationPermission()` - Returns `LocationPermissionStatus`
- `requestLocationPermission(request?)` - Returns `LocationPermissionStatus`
- `getCurrentLocation(options?)` - Returns `LocationResult`
- `getLocationStatus()` - Returns `LocationStatus`

Use lazy loading with `requireNativeModule('CustomGPS')`.

**Verification:** TypeScript compiles, module exports correctly

---

### Step 5: Create GPS Bridge Handler

**File:** `src/bridge/gps-bridge.ts` (new)

Create `registerGpsHandlers(config)` with:
- `checkLocationPermission` handler
- `requestLocationPermission` handler
- `getCurrentLocation` handler
- `getLocationStatus` handler

Follow existing camera-bridge pattern with error handling.

**Verification:** TypeScript compiles without errors

---

### Step 6: Update Bridge Index

**File:** `src/bridge/index.ts` (replace)

- Export `registerGpsHandlers` instead of `registerCameraHandlers`
- Export `GpsBridgeConfig` type
- Re-export types

**Verification:** Package entry point works

---

### Step 7: Delete Camera Bridge

**File:** `src/bridge/camera-bridge.ts` (delete)

**Verification:** File removed

---

### Step 8: Update Expo Module Config

**File:** `src/modules/expo-module.config.json` (modify)

Change module references:
- Android: `expo.modules.customgps.GpsModule`
- iOS: `GpsModule`

**Verification:** JSON valid

---

### Step 9: Create Android Native Module

**Directory:** `src/modules/android/`

#### 9.1 Update package structure
- Create `src/modules/android/src/main/java/expo/modules/customgps/`
- Delete `src/modules/android/src/main/java/expo/modules/customcamera/`

#### 9.2 Create `GpsModule.kt`

Implement Kotlin module with FusedLocationProviderClient:
- `checkLocationPermission()` - Check fine/coarse/background permissions
- `requestLocationPermission(accuracy, background)` - Request permissions
- `getCurrentLocation(accuracy, timeout, useCachedLocation, fields)` - Get position
- `getLocationStatus()` - Check GPS availability

Key implementation details:
- Use `FusedLocationProviderClient` for location
- Map accuracy: high → `PRIORITY_HIGH_ACCURACY`, balanced → `PRIORITY_BALANCED_POWER_ACCURACY`, low → `PRIORITY_LOW_POWER`
- Use `getLastLocation()` for cached location
- Implement timeout with cached fallback

#### 9.3 Update `AndroidManifest.xml`

Add location permissions:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

Remove camera permissions.

#### 9.4 Update `build.gradle`

Add Google Play Services location dependency:
```groovy
implementation 'com.google.android.gms:play-services-location:21.0.1'
```

Remove CameraX dependencies.

**Verification:** Gradle sync succeeds, no compilation errors

---

### Step 10: Create iOS Native Module

**Directory:** `src/modules/ios/`

#### 10.1 Create `GpsModule.swift` (replace CameraModule.swift)

Implement Swift module with CLLocationManager:
- `checkLocationPermission()` - Check authorization status
- `requestLocationPermission(accuracy, background)` - Request authorization
- `getCurrentLocation(accuracy, timeout, useCachedLocation, fields)` - Get location
- `getLocationStatus()` - Check location services status

Key implementation details:
- Use `CLLocationManager` delegate pattern
- Map accuracy: high → `kCLLocationAccuracyBest`, balanced → `kCLLocationAccuracyHundredMeters`, low → `kCLLocationAccuracyKilometer`
- Use `location` property for cached location
- Implement timeout with delegate callbacks

#### 10.2 Delete CameraModule.swift

**Verification:** Swift compiles without errors

---

### Step 11: Update Package Configuration

**File:** `package.json`

- Change name: `rnww-plugin-camera` → `rnww-plugin-gps`
- Update description
- Update keywords: remove camera, add gps/location
- Update files list if needed

**Verification:** `npm pack` succeeds

---

### Step 12: Update Documentation

#### 12.1 Update CLAUDE.md

- Change project overview to GPS plugin
- Update architecture description
- Update event handlers list
- Update native module registration info

#### 12.2 Update README.md

- Installation instructions
- API documentation
- Usage examples
- Permission setup guide (Android/iOS)

**Verification:** Documentation is accurate and complete

---

### Step 13: Cleanup

- Delete `src/modules/android/src/main/res/xml/file_provider_paths.xml` (camera-specific)
- Remove any remaining camera references
- Run `npm run clean && npm run build`

**Verification:** Clean build, no camera references remain

---

## File Changes Summary

| Action | File |
|--------|------|
| Create | `src/types/gps-module.ts` |
| Modify | `src/types/index.ts` |
| Delete | `src/types/camera-module.ts` |
| Replace | `src/modules/index.ts` |
| Create | `src/bridge/gps-bridge.ts` |
| Replace | `src/bridge/index.ts` |
| Delete | `src/bridge/camera-bridge.ts` |
| Modify | `src/modules/expo-module.config.json` |
| Create | `src/modules/android/src/main/java/expo/modules/customgps/GpsModule.kt` |
| Delete | `src/modules/android/src/main/java/expo/modules/customcamera/CameraModule.kt` |
| Modify | `src/modules/android/src/main/AndroidManifest.xml` |
| Modify | `src/modules/android/build.gradle` |
| Replace | `src/modules/ios/CameraModule.swift` → `GpsModule.swift` |
| Delete | `src/modules/android/src/main/res/xml/file_provider_paths.xml` |
| Modify | `package.json` |
| Modify | `CLAUDE.md` |
| Modify | `README.md` |

## Testing Strategy

1. **TypeScript Compilation:** `npm run build` succeeds
2. **Package Validity:** `npm pack` creates valid tarball
3. **Integration Test:** Install in test React Native app
4. **Permission Flow:** Test permission request/check on both platforms
5. **Location Retrieval:** Test getCurrentLocation with various options
6. **Error Handling:** Test timeout, permission denied, GPS disabled scenarios

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| FusedLocationProviderClient not available | Fall back to LocationManager |
| Background location complexity | Document Android 10+ requirements |
| iOS authorization state changes | Use delegate pattern properly |
| Timeout race conditions | Use proper cancellation tokens |

## Dependencies

**Android:**
- `com.google.android.gms:play-services-location:21.0.1`
- `expo-modules-core` (existing)

**iOS:**
- `CoreLocation.framework` (system)
- `ExpoModulesCore` (existing)

## Notes

- No streaming/real-time tracking - one-shot location only
- No debug/crash log features (removed per design decision)
- Fields selection allows minimal data transfer when full location not needed
- Cached location fallback prevents timeouts in poor GPS conditions
