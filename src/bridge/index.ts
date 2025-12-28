/**
 * 카메라 관련 핸들러 (레거시 호환성 래퍼)
 * 
 * 이 파일은 기존 프로젝트와의 호환성을 위한 래퍼입니다.
 * 실제 로직은 camera-bridge.ts에 있으며, 의존성 주입 패턴을 사용합니다.
 * 
 * @deprecated 새로운 프로젝트에서는 camera-bridge.ts를 직접 사용하고 의존성을 주입하세요.
 */

import { registerHandler, sendToWeb } from '@/lib/bridge';
import { Platform } from 'react-native';
import { registerCameraHandlers as registerCameraHandlersCore } from './camera-bridge';
import { ReactNativeBridgeAdapter, ReactNativePlatformAdapter } from '../adapters/react-native-bridge.adapter';
import * as CameraModule from '../module';

/**
 * 기존 프로젝트를 위한 호환성 함수
 * 기존 의존성을 사용하여 카메라 핸들러를 등록합니다
 */
export const registerCameraHandlers = () => {
  // 어댑터를 사용하여 기존 의존성을 추상화된 인터페이스로 변환
  const bridgeAdapter = new ReactNativeBridgeAdapter(registerHandler, sendToWeb);
  const platformAdapter = new ReactNativePlatformAdapter(Platform);

  // 의존성 주입을 통한 핸들러 등록
  registerCameraHandlersCore({
    bridge: bridgeAdapter,
    platform: platformAdapter,
    cameraModule: CameraModule,
    logger: console,
  });
};

/**
 * 새로운 방식의 export (명시적 의존성 주입용)
 * NPM 패키지로 사용할 때는 이 함수를 사용하세요
 */
export { registerCameraHandlers as registerCameraHandlersWithDI } from './camera-bridge';
export type { CameraBridgeConfig } from './camera-bridge';
