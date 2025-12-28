/**
 * 카메라 브릿지 핸들러
 * 의존성 주입을 통해 동작하는 순수한 브릿지 로직
 */

import type {
  IBridge,
  IPlatform,
  ICameraModule,
} from '../types';

/**
 * 카메라 브릿지 설정
 */
export interface CameraBridgeConfig {
  /**
   * 브릿지 구현체
   */
  bridge: IBridge;

  /**
   * 플랫폼 구현체
   */
  platform: IPlatform;

  /**
   * 카메라 모듈 인스턴스
   * 이 패키지의 src/module/index.ts를 직접 전달
   */
  cameraModule: ICameraModule;

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
 * 카메라 브릿지 핸들러를 등록합니다
 * @param config 브릿지 설정
 */
export const registerCameraHandlers = (config: CameraBridgeConfig) => {
  const { bridge, platform, cameraModule: Camera, logger = console } = config;

  // Android와 iOS만 지원
  if (platform.OS !== 'android' && platform.OS !== 'ios') {
    logger.log('[Bridge] Camera handlers skipped (Android/iOS only)');
    return;
  }

  // 이벤트 리스너 구독 객체 저장 (메모리 누수 방지)
  let frameSubscription: any = null;

  // 카메라 권한 확인
  bridge.registerHandler('checkCameraPermission', async (_payload, respond) => {
    try {
      const result = await Camera.checkCameraPermission();
      respond({ success: true, ...result });
    } catch (error) {
      respond({ 
        success: false, 
        granted: false, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to check camera permission' 
      });
    }
  });

  // 카메라 권한 요청
  bridge.registerHandler('requestCameraPermission', async (_payload, respond) => {
    try {
      const result = await Camera.requestCameraPermission();
      respond({ success: true, ...result });
    } catch (error) {
      respond({ 
        success: false, 
        granted: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to request camera permission' 
      });
    }
  });

  // 사진 촬영
  bridge.registerHandler('takePhoto', async (payload, respond) => {
    try {
      const options = payload as { facing?: 'front' | 'back' };
      const facing = options?.facing || 'back';  // 기본값: 후면 카메라
      
      const result = await Camera.takePhoto(facing);
      respond(result);
    } catch (error) {
      respond({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to take photo' 
      });
    }
  });

  // 카메라 스트리밍 시작
  bridge.registerHandler('startCamera', async (payload, respond) => {
    try {
      // 기존 리스너 정리 (중복 방지)
      if (frameSubscription) {
        try {
          frameSubscription.remove();
        } catch (e) {
          logger.warn('[Bridge] Failed to remove existing listener:', e);
        }
      }
      
      // 새 리스너 등록
      try {
        frameSubscription = Camera.addListener('onCameraFrame', (data: any) => {
          bridge.sendToWeb('onCameraFrame', data);
        });
      } catch (e) {
        logger.error('[Bridge] Failed to register frame listener:', e);
      }
      
      // 파라미터 정규화 (호환성 유지)
      const options = payload as { 
        facing?: 'front' | 'back';
        fps?: number;
        quality?: number;
        maxWidth?: number;
        maxHeight?: number;
      };
      
      const result = await Camera.startCamera(options);
      respond(result);
    } catch (error) {
      logger.error('[Bridge] startCamera error:', error);
      respond({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to start camera' 
      });
    }
  });

  // 카메라 중지
  bridge.registerHandler('stopCamera', async (_payload, respond) => {
    try {
      const result = await Camera.stopCamera();
      
      // 이벤트 리스너 정리 (메모리 누수 방지)
      if (frameSubscription) {
        try {
          frameSubscription.remove();
          frameSubscription = null;
        } catch (e) {
          logger.warn('[Bridge] Failed to remove frame listener:', e);
        }
      }
      
      respond(result);
    } catch (error) {
      respond({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to stop camera' 
      });
    }
  });

  // 카메라 상태 확인
  bridge.registerHandler('getCameraStatus', async (_payload, respond) => {
    try {
      const status = await Camera.getCameraStatus();
      respond(status);
    } catch (error) {
      respond({ 
        isStreaming: false,
        facing: 'back',
        hasCamera: false,
        error: error instanceof Error ? error.message : 'Failed to get camera status'
      });
    }
  });

  // 크래시 로그 조회
  bridge.registerHandler('getCrashLogs', async (_payload, respond) => {
    try {
      const result = await Camera.getCrashLogs();
      respond(result);
    } catch (error) {
      respond({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get crash logs' 
      });
    }
  });

  // 크래시 로그 공유
  bridge.registerHandler('shareCrashLog', async (payload, respond) => {
    try {
      const { filePath } = payload as { filePath: string };
      if (!filePath) {
        respond({ success: false, error: 'filePath is required' });
        return;
      }
      
      const result = await Camera.shareCrashLog(filePath);
      respond(result);
    } catch (error) {
      respond({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to share crash log' 
      });
    }
  });

  // 크래시 로그 삭제
  bridge.registerHandler('clearCrashLogs', async (_payload, respond) => {
    try {
      const result = await Camera.clearCrashLogs();
      respond(result);
    } catch (error) {
      respond({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear crash logs' 
      });
    }
  });

  // 디버그 로그 가져오기
  bridge.registerHandler('getDebugLog', async (_payload, respond) => {
    try {
      const result = await Camera.getDebugLog();
      respond(result);
    } catch (error) {
      respond({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get debug log' 
      });
    }
  });

  // 디버그 로그 공유하기
  bridge.registerHandler('shareDebugLog', async (_payload, respond) => {
    try {
      const result = await Camera.shareDebugLog();
      respond(result);
    } catch (error) {
      respond({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to share debug log' 
      });
    }
  });

  // 디버그 로그 삭제
  bridge.registerHandler('clearDebugLog', async (_payload, respond) => {
    try {
      const result = await Camera.clearDebugLog();
      respond(result);
    } catch (error) {
      respond({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear debug log' 
      });
    }
  });

  logger.log('[Bridge] Camera handlers registered');
};
