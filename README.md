# RNWW Plugin GPS

React Native와 WebView 간 GPS/위치 기능을 연결하는 Expo 네이티브 모듈 플러그인입니다.

- 일회성 위치 조회 (one-shot, 실시간 추적 아님)
- 정확도 수준 선택 (high / balanced / low)
- 반환 데이터 필드 선택 (altitude, speed, heading, accuracy, timestamp)
- 설정 가능한 타임아웃 (1~60초, 기본 10초)
- 캐시 위치 fallback (5분 이내 유효)
- 세분화된 권한 관리 (fine/coarse, background)
- Android (FusedLocationProviderClient) + iOS (CLLocationManager)

## 설치

```bash
npm install rnww-plugin-gps
```

### Peer Dependencies

```bash
npm install expo expo-modules-core
```

## 사용법

### 브릿지 핸들러 등록

```typescript
import { registerGpsHandlers } from 'rnww-plugin-gps';

registerGpsHandlers({
  bridge: yourBridgeImplementation,
  platform: { OS: Platform.OS },
});
```

### 브릿지 핸들러

다음 이벤트 핸들러가 등록됩니다:

- `checkLocationPermission` - 위치 권한 확인
- `requestLocationPermission` - 위치 권한 요청
- `getCurrentLocation` - 현재 위치 조회
- `getLocationStatus` - 위치 서비스 상태 확인

## API

### checkLocationPermission

현재 위치 권한 상태를 확인합니다.

**응답:**
```typescript
{
  granted: boolean;
  status: 'granted' | 'denied' | 'undetermined' | 'restricted' | 'unavailable';
  accuracy: 'fine' | 'coarse' | 'none';
  background: boolean;
  whenInUse?: boolean;  // iOS only
  always?: boolean;     // iOS only
}
```

### requestLocationPermission

위치 권한을 요청합니다.

**요청:**
```typescript
{
  accuracy?: 'fine' | 'coarse';  // 기본: 'fine'
  background?: boolean;          // 기본: false
}
```

> **참고:** Android에서는 권한 요청이 비동기적으로 처리되어 즉시 반환됩니다.
> 실제 권한 상태는 `checkLocationPermission`으로 다시 확인해야 합니다.
> iOS에서는 사용자 응답을 기다린 후 결과를 반환합니다.

### getCurrentLocation

현재 위치를 조회합니다.

**요청:**
```typescript
{
  accuracy?: 'high' | 'balanced' | 'low';  // 기본: 'balanced'
  timeout?: number;                         // 밀리초, 1000~60000 (기본: 10000)
  useCachedLocation?: boolean;              // 기본: true
  fields?: Array<'altitude' | 'speed' | 'heading' | 'accuracy' | 'timestamp'>;
}
```

**응답:**
```typescript
{
  success: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;    // fields에 'altitude' 포함 시
  speed?: number;       // fields에 'speed' 포함 시 (m/s)
  heading?: number;     // fields에 'heading' 포함 시 (0-360도)
  accuracy?: number;    // fields에 'accuracy' 포함 시 (미터)
  timestamp?: number;   // fields에 'timestamp' 포함 시 (Unix timestamp ms)
  isCached?: boolean;   // 캐시된 위치 여부
  error?: string;       // 에러 코드 (실패 시)
}
```

**에러 코드:**

| Error | Description |
|-------|-------------|
| `PERMISSION_DENIED` | 위치 권한 없음 |
| `LOCATION_DISABLED` | 위치 서비스 비활성화 |
| `TIMEOUT` | 타임아웃 초과 |
| `UNAVAILABLE` | 위치 정보 사용 불가 |
| `UNKNOWN` | 알 수 없는 오류 |

### getLocationStatus

위치 서비스 상태를 확인합니다.

**응답:**
```typescript
{
  isAvailable: boolean;  // GPS 하드웨어 사용 가능 여부
  isEnabled: boolean;    // 위치 서비스 활성화 여부
  provider?: string;     // Android only: 'gps' | 'network' | 'fused'
}
```

## 동작 상세

### 캐시 위치

- `useCachedLocation: true` (기본값)일 때, 네이티브 API의 마지막 알려진 위치를 먼저 확인
- **5분(300초) 이내**의 캐시만 유효하며, 오래된 캐시는 무시하고 새 위치를 요청
- 캐시 위치 반환 시 `isCached: true`로 표시

### 타임아웃

- 양 플랫폼 모두 명시적 타임아웃 메커니즘 적용
  - Android: `Handler.postDelayed` + `LocationRequest.setDurationMillis`
  - iOS: `Timer.scheduledTimer`
- 타임아웃 발생 시 `{ success: false, error: 'TIMEOUT' }` 반환
- `timeout` 값은 1000~60000ms 범위로 자동 제한

### 입력 검증

- `accuracy`는 화이트리스트 검증, 잘못된 값은 `'balanced'`로 대체
- `timeout`은 숫자가 아닌 값은 10000으로 대체
- `fields`는 유효한 필드명만 필터링하여 네이티브로 전달

### 플랫폼 차이

| Aspect | Android | iOS |
|--------|---------|-----|
| Location API | FusedLocationProviderClient | CLLocationManager |
| 권한 요청 | 즉시 반환 (재확인 필요) | delegate 통해 결과 대기 |
| Accuracy 구분 | fine / coarse | 항상 fine (iOS 특성) |

## 권한 설정

### Android

`AndroidManifest.xml`에 다음 권한이 자동으로 추가됩니다:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

### iOS

호스트 앱의 `Info.plist`에 다음 키를 추가하세요:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>위치 기반 서비스에 사용됩니다</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>백그라운드에서도 위치를 사용합니다</string>
```

## 아키텍처

```
WebView → Bridge Handler → Module Wrapper → Native Module → Bridge.sendToWeb → WebView
```

```
src/
├── bridge/          # WebView 브릿지 핸들러 (의존성 주입)
├── modules/
│   ├── index.ts     # 크로스플랫폼 TypeScript API (입력 검증)
│   ├── android/     # Kotlin (FusedLocationProviderClient)
│   └── ios/         # Swift (CLLocationManager)
└── types/           # TypeScript 타입 정의
```

## 빌드

```bash
npm run build      # TypeScript 컴파일 (src/ → lib/)
npm run clean      # lib/ 삭제
```

## 라이선스

MIT
