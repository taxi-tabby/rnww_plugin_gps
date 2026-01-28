# RNWW Plugin GPS

React Native와 WebView 간 GPS/위치 기능을 연결하는 플러그인입니다.

## 설치

```bash
npm install rnww-plugin-gps
# or
yarn add rnww-plugin-gps
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

### getCurrentLocation

현재 위치를 조회합니다.

**요청:**
```typescript
{
  accuracy?: 'high' | 'balanced' | 'low';  // 기본: 'balanced'
  timeout?: number;                         // 밀리초, 기본: 10000
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
  timestamp?: number;   // fields에 'timestamp' 포함 시 (Unix timestamp)
  isCached?: boolean;   // 캐시된 위치 여부
  error?: string;       // 에러 시: 'PERMISSION_DENIED' | 'LOCATION_DISABLED' | 'TIMEOUT' | 'UNAVAILABLE' | 'UNKNOWN'
}
```

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

## 라이선스

MIT
