/**
 * 카메라 브릿지 메인 엔트리 포인트
 * 
 * NPM 패키지로 사용 시 이 파일을 import하세요.
 * 레거시 프로젝트용 래퍼는 ./legacy.ts를 사용하세요.
 */

// 메인 export (의존성 주입 방식)
export { registerCameraHandlers } from './camera-bridge';
export type { CameraBridgeConfig } from './camera-bridge';

// 타입 정의
export * from '../types';

// 어댑터
export { ReactNativeBridgeAdapter, ReactNativePlatformAdapter } from '../adapters/react-native-bridge.adapter';

// 카메라 모듈
export * as CameraModule from '../module';
