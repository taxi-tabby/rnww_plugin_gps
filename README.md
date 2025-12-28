# RNWW Plugin Camera

React Native와 WebView 간 카메라 기능을 연결하는 플러그인입니다.

## 설치

```bash
npm install rnww-plugin-camera
# or
yarn add rnww-plugin-camera
```

## 사용법

### 방법 1: 기존 프로젝트 (레거시)

기존 프로젝트의 `@/lib/bridge`와 `react-native`에 의존하는 방식:

```typescript
import { registerCameraHandlers } from 'rnww-plugin-camera';

// 앱 초기화 시
registerCameraHandlers();
```

### 방법 2: 의존성 주입 (권장)

독립적인 프로젝트에서 사용하거나 더 유연한 구성이 필요한 경우:

```typescript
import { registerCameraHandlersWithDI } from 'rnww-plugin-camera';
import { ReactNativeBridgeAdapter, ReactNativePlatformAdapter } from 'rnww-plugin-camera/adapters';
import { Platform } from 'react-native';

// 브릿지 구현 (예시)
const myBridge = {
  registerHandler: (eventName, handler) => {
    // 브릿지 핸들러 등록 로직
  },
  sendToWeb: (eventName, data) => {
    // 웹으로 메시지 전송 로직
  },
};

// 카메라 모듈 import (이 패키지에 포함되어 있음)
import * as CameraModule from 'rnww-plugin-camera/module';

// 의존성 주입
registerCameraHandlersWithDI({
  bridge: new ReactNativeBridgeAdapter(
    myBridge.registerHandler,
    myBridge.sendToWeb
  ),
  platform: new ReactNativePlatformAdapter(Platform),
  cameraModule: CameraModule,
  logger: console, // 선택적
});
```

### 방법 3: 커스텀 구현

완전히 커스텀한 구현을 주입할 수도 있습니다:

```typescript
import { registerCameraHandlersWithDI } from 'rnww-plugin-camera';
import type { IBridge, IPlatform, ICameraModule } from 'rnww-plugin-camera/types';

// 커스텀 브릿지 구현
const customBridge: IBridge = {
  registerHandler: (eventName, handler) => {
    // 커스텀 로직
  },
  sendToWeb: (eventName, data) => {
    // 커스텀 로직
  },
};

// 커스텀 플랫폼 구현
const customPlatform: IPlatform = {
  OS: 'android', // or dynamically determine
};

// 카메라 모듈 import
import * as CameraModule from 'rnww-plugin-camera/module';

registerCameraHandlersWithDI({
  bridge: customBridge,
  platform: customPlatform,
  cameraModule: CameraModule,
  logger: {
    log: console.log,
    warn: console.warn,
    error: console.error,
  },
});
```

## API

### 타입 정의

#### IBridge

```typescript
interface IBridge {
  registerHandler(eventName: string, handler: BridgeHandler): void;
  sendToWeb(eventName: string, data: any): void;
}
```

#### IPlatform

```typescript
interface IPlatform {
  OS: 'ios' | 'android' | 'windows' | 'macos' | 'web';
}
```

#### ICameraModule

카메라 모듈이 구현해야 하는 인터페이스:

```typescript
interface ICameraModule {
  checkCameraPermission(): Promise<CameraPermissionResult>;
  requestCameraPermission(): Promise<CameraPermissionResult>;
  takePhoto(facing: CameraFacing): Promise<PhotoResult>;
  startCamera(options?: CameraStartOptions): Promise<{ success: boolean; error?: string }>;
  stopCamera(): Promise<{ success: boolean; error?: string }>;
  getCameraStatus(): Promise<CameraStatus>;
  addListener(eventName: string, listener: (data: any) => void): EventSubscription;
  // ... 기타 메서드
}
```

### 브릿지 핸들러

다음 이벤트 핸들러가 등록됩니다:

- `checkCameraPermission` - 카메라 권한 확인
- `requestCameraPermission` - 카메라 권한 요청
- `takePhoto` - 사진 촬영
- `startCamera` - 카메라 스트리밍 시작
- `stopCamera` - 카메라 중지
- `getCameraStatus` - 카메라 상태 조회
- `getCrashLogs` - 크래시 로그 조회
- `shareCrashLog` - 크래시 로그 공유
- `clearCrashLogs` - 크래시 로그 삭제
- `getDebugLog` - 디버그 로그 가져오기
- `shareDebugLog` - 디버그 로그 공유
- `clearDebugLog` - 디버그 로그 삭제

## 구조

```
src/
├── types/              # 타입 정의
│   ├── bridge.ts       # 브릿지 인터페이스
│   ├── platform.ts     # 플랫폼 인터페이스
│   └── camera-module.ts # 카메라 모듈 인터페이스
├── bridge/
│   ├── camera-bridge.ts # 핵심 브릿지 로직 (의존성 주입)
│   └── index.ts        # 레거시 래퍼
├── adapters/           # 어댑터 패턴 구현
│   └── react-native-bridge.adapter.ts
└── module/             # 네이티브 모듈
```

## 마이그레이션 가이드

기존 프로젝트를 의존성 주입 방식으로 마이그레이션하려면:

1. 현재 사용 중인 `registerCameraHandlers()`는 그대로 동작합니다
2. 점진적으로 `registerCameraHandlersWithDI()`로 전환
3. 커스텀 구현이 필요한 경우 타입 정의를 참고하여 구현

## 라이선스

MIT
