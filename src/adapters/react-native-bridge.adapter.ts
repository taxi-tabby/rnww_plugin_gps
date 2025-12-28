/**
 * React Native 환경을 위한 어댑터
 * 실제 프로젝트에서 사용할 때 이 어댑터를 사용하여 의존성을 주입합니다
 */

import type { IBridge, IPlatform } from '../types';

/**
 * React Native Platform 어댑터
 * react-native의 Platform을 IPlatform 인터페이스로 변환
 */
export class ReactNativePlatformAdapter implements IPlatform {
  private platformModule: any;

  constructor(platformModule: any) {
    this.platformModule = platformModule;
  }

  get OS(): 'ios' | 'android' | 'windows' | 'macos' | 'web' {
    return this.platformModule.OS;
  }
}

/**
 * React Native Bridge 어댑터
 * 기존 브릿지 구현을 IBridge 인터페이스로 변환
 */
export class ReactNativeBridgeAdapter implements IBridge {
  constructor(
    private registerHandlerFn: (eventName: string, handler: any) => void,
    private sendToWebFn: (eventName: string, data: any) => void
  ) {}

  registerHandler(eventName: string, handler: any): void {
    this.registerHandlerFn(eventName, handler);
  }

  sendToWeb(eventName: string, data: any): void {
    this.sendToWebFn(eventName, data);
  }
}
