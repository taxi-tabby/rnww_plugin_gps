/**
 * GPS 브릿지 메인 엔트리 포인트
 *
 * NPM 패키지로 사용 시 이 파일을 import하세요.
 */

// 메인 export (의존성 주입 방식)
export { registerGpsHandlers } from './gps-bridge';
export type { GpsBridgeConfig } from './gps-bridge';

// 타입 정의
export * from '../types';
