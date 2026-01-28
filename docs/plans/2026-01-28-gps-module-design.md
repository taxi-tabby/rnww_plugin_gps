# GPS Module Design

## Overview

`rnww-plugin-camera` 저장소를 `rnww-plugin-gps`로 전환하여 React Native와 WebView 간 GPS 기능을 연결하는 플러그인을 만든다.

## Requirements

- 일회성 위치 조회 (실시간 추적 아님)
- 정확도 수준 선택 가능 (high, balanced, low)
- 반환 데이터 필드 선택 가능
- 설정 가능한 타임아웃 + 캐시 위치 폴백
- 세분화된 권한 관리 (fine/coarse, background)
- 디버그/크래시 로그 기능 제외

## Architecture

기존 카메라 플러그인과 동일한 3계층 구조:

```
src/
├── bridge/
│   ├── index.ts              # 메인 export
│   └── gps-bridge.ts         # 브릿지 핸들러
├── modules/
│   ├── index.ts              # 크로스플랫폼 TypeScript API
│   ├── expo-module.config.json
│   ├── android/              # Kotlin (FusedLocationProvider)
│   └── ios/                  # Swift (CLLocationManager)
└── types/
    ├── index.ts
    ├── bridge.ts             # IBridge, IPlatform (기존 유지)
    ├── platform.ts
    └── gps-module.ts         # GPS 관련 타입 정의
```

**패키지 정보:**
- 이름: `rnww-plugin-gps`
- 네이티브 모듈명: `CustomGPS`

## Bridge Handlers

| Handler | Description |
|---------|-------------|
| `checkLocationPermission` | 현재 권한 상태 확인 |
| `requestLocationPermission` | 권한 요청 (정확도 수준 선택 가능) |
| `getCurrentLocation` | 일회성 위치 조회 |
| `getLocationStatus` | GPS 사용 가능 여부 및 설정 상태 |

## Type Definitions

### Permission Types

```typescript
interface LocationPermissionStatus {
  // 기본 상태
  granted: boolean;
  status: 'granted' | 'denied' | 'undetermined' | 'restricted';

  // 세분화된 권한
  accuracy: 'fine' | 'coarse' | 'none';
  background: boolean;

  // iOS 전용
  whenInUse?: boolean;
  always?: boolean;
}

interface LocationPermissionRequest {
  accuracy?: 'fine' | 'coarse';   // 기본: fine
  background?: boolean;            // 기본: false
}
```

### Location Types

```typescript
interface LocationOptions {
  accuracy?: 'high' | 'balanced' | 'low';  // 기본: 'balanced'
  timeout?: number;                         // 밀리초, 기본: 10000
  useCachedLocation?: boolean;              // 기본: true
  fields?: Array<'altitude' | 'speed' | 'heading' | 'accuracy' | 'timestamp'>;
}

interface LocationResult {
  success: boolean;

  // 기본 위치 정보 (항상 포함)
  latitude?: number;
  longitude?: number;

  // 선택적 필드
  altitude?: number;          // 고도 (미터)
  speed?: number;             // 속도 (m/s)
  heading?: number;           // 방향 (0-360도)
  accuracy?: number;          // 정확도 (미터)
  timestamp?: number;         // Unix timestamp

  // 상태 정보
  isCached?: boolean;
  error?: string;
}
```

### Status Types

```typescript
interface LocationStatus {
  isAvailable: boolean;       // GPS 하드웨어 사용 가능 여부
  isEnabled: boolean;         // 위치 서비스 활성화 여부
  provider?: string;          // Android: 'gps' | 'network' | 'fused'
}

type LocationError =
  | 'PERMISSION_DENIED'
  | 'LOCATION_DISABLED'
  | 'TIMEOUT'
  | 'UNAVAILABLE'
  | 'UNKNOWN';
```

## Native Implementation

### Platform Mapping

| Feature | Android | iOS |
|---------|---------|-----|
| Location API | FusedLocationProviderClient | CLLocationManager |
| Accuracy: high | PRIORITY_HIGH_ACCURACY | kCLLocationAccuracyBest |
| Accuracy: balanced | PRIORITY_BALANCED_POWER_ACCURACY | kCLLocationAccuracyHundredMeters |
| Accuracy: low | PRIORITY_LOW_POWER | kCLLocationAccuracyKilometer |
| Cached location | getLastLocation() | location property |

### Permissions

**Android (`AndroidManifest.xml`):**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

Note: `ACCESS_BACKGROUND_LOCATION`은 Android 10(Q)+ 에서 필요하며, fine/coarse 승인 후 별도 요청해야 함.

**iOS (`Info.plist` - 호스트 앱에서 설정):**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>위치 기반 서비스에 사용됩니다</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>백그라운드에서도 위치를 사용합니다</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>백그라운드에서도 위치를 사용합니다</string>
```

## Flow: getCurrentLocation

```
1. 권한 확인 → 없으면 PERMISSION_DENIED 반환
2. 위치 서비스 확인 → 꺼져있으면 LOCATION_DISABLED 반환
3. 위치 요청 시작 (accuracy 설정 적용)
4. 타임아웃 내 성공 → 위치 데이터 반환
5. 타임아웃 발생:
   └─ useCachedLocation=true → 캐시 위치 반환 (isCached: true)
   └─ 캐시 없음 → TIMEOUT 에러 반환
```

## Migration Steps

1. 카메라 관련 코드 모두 제거
2. package.json 이름 변경: `rnww-plugin-camera` → `rnww-plugin-gps`
3. 네이티브 모듈명 변경: `CustomCamera` → `CustomGPS`
4. GPS 타입 정의 및 브릿지 구현
5. Android 네이티브 모듈 구현 (Kotlin)
6. iOS 네이티브 모듈 구현 (Swift)
7. README.md 업데이트
8. CLAUDE.md 업데이트
