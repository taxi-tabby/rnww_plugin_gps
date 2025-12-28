/**
 * 브릿지 통신 추상화 인터페이스
 */

/**
 * 핸들러 응답 함수 타입
 */
export type RespondFunction = (response: any) => void;

/**
 * 브릿지 핸들러 함수 타입
 */
export type BridgeHandler = (payload: any, respond: RespondFunction) => void | Promise<void>;

/**
 * 브릿지 통신 인터페이스
 */
export interface IBridge {
  /**
   * 네이티브에서 호출할 수 있는 핸들러를 등록합니다
   * @param eventName 이벤트 이름
   * @param handler 핸들러 함수
   */
  registerHandler(eventName: string, handler: BridgeHandler): void;

  /**
   * 웹으로 메시지를 전송합니다
   * @param eventName 이벤트 이름
   * @param data 전송할 데이터
   */
  sendToWeb(eventName: string, data: any): void;
}
