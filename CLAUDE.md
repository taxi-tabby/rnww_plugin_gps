# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `rnww-plugin-camera`, an Expo native module that bridges camera functionality between React Native and WebView applications. It provides camera permissions, photo capture, real-time streaming, and debug/crash log management for Android (CameraX) and iOS (AVFoundation).

## Build Commands

```bash
npm run build      # Compile TypeScript (src/ → lib/)
npm run clean      # Remove lib/ directory
npm run prepare    # Build before publish (runs automatically)
```

## Architecture

### Three-Layer Structure

1. **Bridge Layer** (`src/bridge/`) - WebView communication handlers using dependency injection
   - `registerCameraHandlers(config)` accepts `IBridge` and `IPlatform` interfaces
   - Enables host app to provide its own bridge implementation

2. **Module Wrapper** (`src/modules/index.ts`) - Cross-platform TypeScript API
   - Lazy-loads native module via `requireNativeModule('CustomCamera')`
   - Gracefully handles unavailable platforms (returns fallback responses)

3. **Native Modules** (`src/modules/android/`, `src/modules/ios/`)
   - Android: Kotlin with CameraX (`expo.modules.customcamera.CameraModule`)
   - iOS: Swift with AVFoundation (`CameraModule`)
   - Both emit `onCameraFrame` events for real-time streaming

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

WebView → Bridge Handler → Module Wrapper → Native Module → (frames) → Bridge.sendToWeb → WebView

## Native Module Registration

The native module name is `CustomCamera` (defined in `expo-module.config.json`). The bridge handlers register these events:
- `checkCameraPermission`, `requestCameraPermission`
- `takePhoto`, `startCamera`, `stopCamera`, `getCameraStatus`
- `getCrashLogs`, `shareCrashLog`, `clearCrashLogs`
- `getDebugLog`, `shareDebugLog`, `clearDebugLog`

## TypeScript Configuration

- Only `src/bridge/` and `src/types/` are compiled (see `tsconfig.json` include/exclude)
- Native module code in `src/modules/` is excluded from TS compilation but included in npm package
- Output goes to `lib/` with declarations
