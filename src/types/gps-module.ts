/**
 * GPS 모듈 타입 정의
 */

// ============================================================================
// Permission Types
// ============================================================================

/**
 * 위치 권한 상태
 */
export interface LocationPermissionStatus {
  /** 권한 허용 여부 */
  granted: boolean;
  /** 상세 권한 상태 */
  status: 'granted' | 'denied' | 'undetermined' | 'restricted' | 'unavailable';
  /** 허용된 정확도 수준 */
  accuracy: 'fine' | 'coarse' | 'none';
  /** 백그라운드 위치 권한 여부 */
  background: boolean;
  /** iOS: 앱 사용 중 권한 */
  whenInUse?: boolean;
  /** iOS: 항상 허용 권한 */
  always?: boolean;
}

/**
 * 위치 권한 요청 옵션
 */
export interface LocationPermissionRequest {
  /** 요청할 정확도 수준 (기본: 'fine') */
  accuracy?: 'fine' | 'coarse';
  /** 백그라운드 위치 권한 요청 여부 (기본: false) */
  background?: boolean;
}

// ============================================================================
// Location Types
// ============================================================================

/**
 * 위치 조회 옵션
 */
export interface LocationOptions {
  /** 정확도 수준 (기본: 'balanced') */
  accuracy?: 'high' | 'balanced' | 'low';
  /** 타임아웃 (밀리초, 기본: 10000) */
  timeout?: number;
  /** 캐시된 위치 사용 여부 (기본: true) */
  useCachedLocation?: boolean;
  /** 반환할 추가 필드 */
  fields?: Array<'altitude' | 'speed' | 'heading' | 'accuracy' | 'timestamp'>;
}

/**
 * 위치 조회 결과
 */
export interface LocationResult {
  /** 성공 여부 */
  success: boolean;

  // 기본 위치 정보 (항상 포함)
  /** 위도 */
  latitude?: number;
  /** 경도 */
  longitude?: number;

  // 선택적 필드 (fields 옵션에 따라 포함)
  /** 고도 (미터) */
  altitude?: number;
  /** 속도 (m/s) */
  speed?: number;
  /** 방향 (0-360도) */
  heading?: number;
  /** 정확도 (미터) */
  accuracy?: number;
  /** Unix timestamp */
  timestamp?: number;

  // 상태 정보
  /** 캐시된 위치 여부 */
  isCached?: boolean;
  /** 에러 메시지 */
  error?: string;
}

// ============================================================================
// Status Types
// ============================================================================

/**
 * 위치 서비스 상태
 */
export interface LocationStatus {
  /** GPS 하드웨어 사용 가능 여부 */
  isAvailable: boolean;
  /** 위치 서비스 활성화 여부 */
  isEnabled: boolean;
  /** Android: 위치 제공자 */
  provider?: 'gps' | 'network' | 'fused';
}

/**
 * 위치 에러 타입
 */
export type LocationError =
  | 'PERMISSION_DENIED'
  | 'LOCATION_DISABLED'
  | 'TIMEOUT'
  | 'UNAVAILABLE'
  | 'UNKNOWN';
