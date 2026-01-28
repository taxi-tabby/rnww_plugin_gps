/**
 * GPS Module (Cross-Platform)
 * 위치 권한 및 조회 기능 제공
 * Supports: Android, iOS
 */

import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import type {
  LocationPermissionStatus,
  LocationPermissionRequest,
  LocationOptions,
  LocationResult,
  LocationStatus,
} from '../types/gps-module';

// Lazy 모듈 로드 (크래시 방지)
let GpsModule: any = null;

function getGpsModule() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return null;
  }

  if (GpsModule === null) {
    try {
      GpsModule = requireNativeModule('CustomGPS');
    } catch (error) {
      console.error('[CustomGPS] Failed to load native module:', error);
      GpsModule = undefined; // 재시도 방지
      return null;
    }
  }

  return GpsModule === undefined ? null : GpsModule;
}

/**
 * 위치 권한 확인
 * @returns 위치 권한 상태
 */
export async function checkLocationPermission(): Promise<LocationPermissionStatus> {
  const module = getGpsModule();
  if (!module) {
    return {
      granted: false,
      status: 'unavailable' as const,
      accuracy: 'none',
      background: false,
    };
  }
  return await module.checkLocationPermission();
}

/**
 * 위치 권한 요청
 * @param request 권한 요청 옵션
 * @returns 권한 요청 결과
 */
export async function requestLocationPermission(
  request?: LocationPermissionRequest
): Promise<LocationPermissionStatus> {
  const module = getGpsModule();
  if (!module) {
    return {
      granted: false,
      status: 'unavailable' as const,
      accuracy: 'none',
      background: false,
    };
  }

  const params = {
    accuracy: request?.accuracy || 'fine',
    background: request?.background || false,
  };

  return await module.requestLocationPermission(params);
}

/**
 * 현재 위치 조회
 * @param options 위치 조회 옵션
 * @returns 위치 조회 결과
 */
export async function getCurrentLocation(
  options?: LocationOptions
): Promise<LocationResult> {
  const module = getGpsModule();
  if (!module) {
    return { success: false, error: 'GPS module not available' };
  }

  const params = {
    accuracy: options?.accuracy || 'balanced',
    timeout: options?.timeout || 10000,
    useCachedLocation: options?.useCachedLocation ?? true,
    fields: options?.fields || [],
  };

  return await module.getCurrentLocation(params);
}

/**
 * 위치 서비스 상태 확인
 * @returns 위치 서비스 상태
 */
export async function getLocationStatus(): Promise<LocationStatus> {
  const module = getGpsModule();
  if (!module) {
    return {
      isAvailable: false,
      isEnabled: false,
    };
  }
  return await module.getLocationStatus();
}
