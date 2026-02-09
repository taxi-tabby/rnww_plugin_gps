import ExpoModulesCore
import CoreLocation

public class GpsModule: Module {
    private var locationManager: CLLocationManager?
    private var locationDelegate: NSObject?

    public func definition() -> ModuleDefinition {
        Name("CustomGPS")

        OnCreate {
            self.locationManager = CLLocationManager()
        }

        OnDestroy {
            self.locationManager?.stopUpdatingLocation()
            self.locationManager = nil
            self.locationDelegate = nil
        }

        // 권한 확인
        AsyncFunction("checkLocationPermission") { (promise: Promise) in
            guard let manager = self.locationManager else {
                promise.resolve(self.createUnavailableResponse())
                return
            }
            let status = manager.authorizationStatus
            let result = self.createPermissionResponse(status: status)
            promise.resolve(result)
        }

        // 권한 요청
        AsyncFunction("requestLocationPermission") { (params: [String: Any], promise: Promise) in
            guard let manager = self.locationManager else {
                promise.resolve(self.createUnavailableResponse())
                return
            }

            let requestAccuracy = params["accuracy"] as? String ?? "fine"
            let requestBackground = params["background"] as? Bool ?? false

            // 이미 권한이 있는지 확인
            let currentStatus = manager.authorizationStatus
            if currentStatus == .authorizedAlways || currentStatus == .authorizedWhenInUse {
                let result = self.createPermissionResponse(status: currentStatus)
                promise.resolve(result)
                return
            }

            // 이전 delegate 정리
            self.cancelPendingDelegate(manager: manager)

            // 권한 요청을 위한 델리게이트 설정
            let delegate = PermissionDelegate { status in
                let result = self.createPermissionResponse(status: status)
                promise.resolve(result)
            }
            self.locationDelegate = delegate
            manager.delegate = delegate

            if requestBackground {
                manager.requestAlwaysAuthorization()
            } else {
                manager.requestWhenInUseAuthorization()
            }
        }

        // 현재 위치 조회
        AsyncFunction("getCurrentLocation") { (params: [String: Any], promise: Promise) in
            guard let manager = self.locationManager else {
                promise.resolve(["success": false, "error": "UNAVAILABLE"])
                return
            }

            // 권한 확인
            let status = manager.authorizationStatus
            guard status == .authorizedAlways || status == .authorizedWhenInUse else {
                promise.resolve(["success": false, "error": "PERMISSION_DENIED"])
                return
            }

            // 위치 서비스 확인
            guard CLLocationManager.locationServicesEnabled() else {
                promise.resolve(["success": false, "error": "LOCATION_DISABLED"])
                return
            }

            // 파라미터 파싱
            let accuracy = params["accuracy"] as? String ?? "balanced"
            let timeout = (params["timeout"] as? Double ?? 10000) / 1000.0 // ms to seconds
            let useCachedLocation = params["useCachedLocation"] as? Bool ?? true
            let fields = params["fields"] as? [String] ?? []

            // 정확도 설정
            switch accuracy {
            case "high":
                manager.desiredAccuracy = kCLLocationAccuracyBest
            case "low":
                manager.desiredAccuracy = kCLLocationAccuracyKilometer
            default:
                manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
            }

            // 캐시된 위치 먼저 시도 (5분 이내인 경우만)
            if useCachedLocation, let cachedLocation = manager.location {
                let ageSeconds = -cachedLocation.timestamp.timeIntervalSinceNow
                if ageSeconds <= 5 * 60 {
                    let result = self.createLocationResult(location: cachedLocation, fields: fields, isCached: true)
                    promise.resolve(result)
                    return
                }
            }

            // 이전 delegate 정리
            self.cancelPendingDelegate(manager: manager)

            // 새 위치 요청
            let delegate = LocationRequestDelegate(timeout: timeout, fields: fields, createResult: self.createLocationResult) { result in
                promise.resolve(result)
            }
            self.locationDelegate = delegate
            manager.delegate = delegate
            manager.requestLocation()
        }

        // 위치 서비스 상태 확인
        AsyncFunction("getLocationStatus") { (promise: Promise) in
            let isEnabled = CLLocationManager.locationServicesEnabled()
            let isAvailable = self.locationManager != nil

            promise.resolve([
                "isAvailable": isAvailable,
                "isEnabled": isEnabled
            ])
        }
    }

    // MARK: - Private Methods

    private func cancelPendingDelegate(manager: CLLocationManager) {
        if let prevDelegate = self.locationDelegate as? LocationRequestDelegate {
            prevDelegate.cancel()
        }
        manager.delegate = nil
        self.locationDelegate = nil
    }

    private func createPermissionResponse(status: CLAuthorizationStatus) -> [String: Any] {
        let granted: Bool
        let statusString: String
        let accuracy: String
        let background: Bool
        let whenInUse: Bool
        let always: Bool

        switch status {
        case .authorizedAlways:
            granted = true
            statusString = "granted"
            accuracy = "fine"
            background = true
            whenInUse = true
            always = true
        case .authorizedWhenInUse:
            granted = true
            statusString = "granted"
            accuracy = "fine"
            background = false
            whenInUse = true
            always = false
        case .denied:
            granted = false
            statusString = "denied"
            accuracy = "none"
            background = false
            whenInUse = false
            always = false
        case .restricted:
            granted = false
            statusString = "restricted"
            accuracy = "none"
            background = false
            whenInUse = false
            always = false
        case .notDetermined:
            granted = false
            statusString = "undetermined"
            accuracy = "none"
            background = false
            whenInUse = false
            always = false
        @unknown default:
            granted = false
            statusString = "unknown"
            accuracy = "none"
            background = false
            whenInUse = false
            always = false
        }

        return [
            "granted": granted,
            "status": statusString,
            "accuracy": accuracy,
            "background": background,
            "whenInUse": whenInUse,
            "always": always
        ]
    }

    private func createUnavailableResponse() -> [String: Any] {
        return [
            "granted": false,
            "status": "unavailable",
            "accuracy": "none",
            "background": false
        ]
    }

    private func createLocationResult(location: CLLocation, fields: [String], isCached: Bool) -> [String: Any] {
        var result: [String: Any] = [
            "success": true,
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "isCached": isCached
        ]

        // 요청된 필드만 포함
        if fields.contains("altitude") {
            result["altitude"] = location.altitude
        }
        if fields.contains("speed") && location.speed >= 0 {
            result["speed"] = location.speed
        }
        if fields.contains("heading") && location.course >= 0 {
            result["heading"] = location.course
        }
        if fields.contains("accuracy") && location.horizontalAccuracy >= 0 {
            result["accuracy"] = location.horizontalAccuracy
        }
        if fields.contains("timestamp") {
            result["timestamp"] = Int64(location.timestamp.timeIntervalSince1970 * 1000)
        }

        return result
    }
}

// MARK: - Permission Delegate

private class PermissionDelegate: NSObject, CLLocationManagerDelegate {
    private let completion: (CLAuthorizationStatus) -> Void
    private var hasResponded = false

    init(completion: @escaping (CLAuthorizationStatus) -> Void) {
        self.completion = completion
        super.init()
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        if status != .notDetermined && !hasResponded {
            hasResponded = true
            completion(status)
        }
    }

    // iOS 13 이하 지원
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        if status != .notDetermined && !hasResponded {
            hasResponded = true
            completion(status)
        }
    }
}

// MARK: - Location Request Delegate

private class LocationRequestDelegate: NSObject, CLLocationManagerDelegate {
    private let completion: ([String: Any]) -> Void
    private let fields: [String]
    private let createResult: (CLLocation, [String], Bool) -> [String: Any]
    private var timeoutTimer: Timer?
    private var hasResponded = false

    init(timeout: TimeInterval, fields: [String], createResult: @escaping (CLLocation, [String], Bool) -> [String: Any], completion: @escaping ([String: Any]) -> Void) {
        self.completion = completion
        self.fields = fields
        self.createResult = createResult
        super.init()

        // 타임아웃 설정
        DispatchQueue.main.async {
            self.timeoutTimer = Timer.scheduledTimer(withTimeInterval: timeout, repeats: false) { [weak self] _ in
                self?.handleTimeout()
            }
        }
    }

    func cancel() {
        guard !hasResponded else { return }
        hasResponded = true
        timeoutTimer?.invalidate()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard !hasResponded, let location = locations.last else { return }
        hasResponded = true
        timeoutTimer?.invalidate()
        manager.delegate = nil

        let result = createResult(location, fields, false)
        completion(result)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        guard !hasResponded else { return }
        hasResponded = true
        timeoutTimer?.invalidate()
        manager.delegate = nil

        let errorCode: String
        if let clError = error as? CLError {
            switch clError.code {
            case .denied:
                errorCode = "PERMISSION_DENIED"
            case .locationUnknown:
                errorCode = "UNAVAILABLE"
            default:
                errorCode = "UNKNOWN"
            }
        } else {
            errorCode = "UNKNOWN"
        }

        completion(["success": false, "error": errorCode])
    }

    private func handleTimeout() {
        guard !hasResponded else { return }
        hasResponded = true
        completion(["success": false, "error": "TIMEOUT"])
    }
}
