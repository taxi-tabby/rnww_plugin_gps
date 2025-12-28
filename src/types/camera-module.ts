/**
 * 카메라 모듈 인터페이스
 */

/**
 * 카메라 권한 상태
 */
export interface CameraPermissionResult {
  granted: boolean;
  status: 'granted' | 'denied' | 'restricted' | 'unavailable' | 'error';
}

/**
 * 카메라 방향
 */
export type CameraFacing = 'front' | 'back';

/**
 * 사진 촬영 결과
 */
export interface PhotoResult {
  success: boolean;
  uri?: string;
  error?: string;
}

/**
 * 카메라 시작 옵션
 */
export interface CameraStartOptions {
  facing?: CameraFacing;
  fps?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * 카메라 상태
 */
export interface CameraStatus {
  isStreaming: boolean;
  facing: CameraFacing;
  hasCamera: boolean;
  error?: string;
}

/**
 * 크래시 로그 결과
 */
export interface CrashLogsResult {
  success: boolean;
  logs?: string[];
  error?: string;
}

/**
 * 이벤트 구독 객체
 */
export interface EventSubscription {
  remove(): void;
}

/**
 * 카메라 프레임 데이터
 */
export interface CameraFrameData {
  timestamp: number;
  data: string; // base64 encoded image
  width: number;
  height: number;
}

/**
 * 카메라 모듈 인터페이스
 */
export interface ICameraModule {
  /**
   * 카메라 권한 확인
   */
  checkCameraPermission(): Promise<CameraPermissionResult>;

  /**
   * 카메라 권한 요청
   */
  requestCameraPermission(): Promise<CameraPermissionResult>;

  /**
   * 사진 촬영
   * @param facing 카메라 방향
   */
  takePhoto(facing: CameraFacing): Promise<PhotoResult>;

  /**
   * 카메라 스트리밍 시작
   * @param options 카메라 옵션
   */
  startCamera(options?: CameraStartOptions): Promise<{ success: boolean; error?: string }>;

  /**
   * 카메라 스트리밍 중지
   */
  stopCamera(): Promise<{ success: boolean; error?: string }>;

  /**
   * 카메라 상태 조회
   */
  getCameraStatus(): Promise<CameraStatus>;

  /**
   * 이벤트 리스너 등록
   * @param eventName 이벤트 이름
   * @param listener 리스너 함수
   */
  addListener(eventName: string, listener: (data: any) => void): EventSubscription;

  /**
   * 크래시 로그 조회
   */
  getCrashLogs(): Promise<CrashLogsResult>;

  /**
   * 크래시 로그 공유
   * @param filePath 파일 경로
   */
  shareCrashLog(filePath: string): Promise<{ success: boolean; error?: string }>;

  /**
   * 크래시 로그 삭제
   */
  clearCrashLogs(): Promise<{ success: boolean; error?: string }>;

  /**
   * 디버그 로그 가져오기
   */
  getDebugLog(): Promise<{ success: boolean; log?: string; error?: string }>;

  /**
   * 디버그 로그 공유하기
   */
  shareDebugLog(): Promise<{ success: boolean; error?: string }>;

  /**
   * 디버그 로그 삭제
   */
  clearDebugLog(): Promise<{ success: boolean; error?: string }>;
}
