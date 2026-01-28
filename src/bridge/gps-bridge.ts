/**
 * GPS 브릿지 핸들러
 * 의존성 주입을 통해 동작하는 순수한 브릿지 로직
 */

import type { IBridge, IPlatform } from '../types';
import * as Gps from '../modules';
import type { LocationPermissionRequest, LocationOptions } from '../types/gps-module';

/**
 * GPS 브릿지 설정
 */
export interface GpsBridgeConfig {
  /**
   * 브릿지 구현체
   */
  bridge: IBridge;

  /**
   * 플랫폼 구현체
   */
  platform: IPlatform;

  /**
   * 로거 (선택적)
   */
  logger?: {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
}

/**
 * GPS 브릿지 핸들러를 등록합니다
 * @param config 브릿지 설정
 */
export const registerGpsHandlers = (config: GpsBridgeConfig) => {
  const { bridge, platform, logger = console } = config;

  // Android와 iOS만 지원
  if (platform.OS !== 'android' && platform.OS !== 'ios') {
    logger.log('[Bridge] GPS handlers skipped (Android/iOS only)');
    return;
  }

  // 위치 권한 확인
  bridge.registerHandler('checkLocationPermission', async (_payload: any, respond: any) => {
    try {
      const result = await Gps.checkLocationPermission();
      respond({ success: true, ...result });
    } catch (error) {
      respond({
        success: false,
        granted: false,
        status: 'error',
        accuracy: 'none',
        background: false,
        error: error instanceof Error ? error.message : 'Failed to check location permission',
      });
    }
  });

  // 위치 권한 요청
  bridge.registerHandler('requestLocationPermission', async (payload: any, respond: any) => {
    try {
      const options = payload as LocationPermissionRequest;
      const result = await Gps.requestLocationPermission(options);
      respond({ success: true, ...result });
    } catch (error) {
      respond({
        success: false,
        granted: false,
        status: 'error',
        accuracy: 'none',
        background: false,
        error: error instanceof Error ? error.message : 'Failed to request location permission',
      });
    }
  });

  // 현재 위치 조회
  bridge.registerHandler('getCurrentLocation', async (payload: any, respond: any) => {
    try {
      const options = payload as LocationOptions;
      const result = await Gps.getCurrentLocation(options);
      respond(result);
    } catch (error) {
      respond({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current location',
      });
    }
  });

  // 위치 서비스 상태 확인
  bridge.registerHandler('getLocationStatus', async (_payload: any, respond: any) => {
    try {
      const status = await Gps.getLocationStatus();
      respond({ success: true, ...status });
    } catch (error) {
      respond({
        success: false,
        isAvailable: false,
        isEnabled: false,
        error: error instanceof Error ? error.message : 'Failed to get location status',
      });
    }
  });

  logger.log('[Bridge] GPS handlers registered');
};
