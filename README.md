# RNWW Plugin Camera

React Native와 WebView 간 카메라 기능을 연결하는 플러그인입니다.

## 설치

```bash
npm install rnww-plugin-camera
# or
yarn add rnww-plugin-camera
```



### 브릿지 핸들러

다음 이벤트 핸들러가 등록됩니다:

- `checkCameraPermission` - 카메라 권한 확인
- `requestCameraPermission` - 카메라 권한 요청
- `takePhoto` - 사진 촬영
- `startCamera` - 카메라 스트리밍 시작
- `stopCamera` - 카메라 중지
- `getCameraStatus` - 카메라 상태 조회
- `getCrashLogs` - 크래시 로그 조회
- `shareCrashLog` - 크래시 로그 공유
- `clearCrashLogs` - 크래시 로그 삭제
- `getDebugLog` - 디버그 로그 가져오기
- `shareDebugLog` - 디버그 로그 공유
- `clearDebugLog` - 디버그 로그 삭제

## 라이선스

MIT
