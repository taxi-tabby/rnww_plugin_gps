package expo.modules.customgps

import android.Manifest
import android.content.pm.PackageManager
import android.location.LocationManager
import android.os.Build
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import com.google.android.gms.location.*
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GpsModule : Module() {
    private var fusedLocationClient: FusedLocationProviderClient? = null

    companion object {
        private const val TAG = "GpsModule"
        private const val LOCATION_PERMISSION_REQUEST_CODE = 2001
    }

    override fun definition() = ModuleDefinition {
        Name("CustomGPS")

        OnCreate {
            Log.d(TAG, "GPS module created")
            val context = appContext.reactContext
            if (context != null) {
                fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
            }
        }

        OnDestroy {
            Log.d(TAG, "GPS module destroyed")
            fusedLocationClient = null
        }

        // 권한 확인
        AsyncFunction("checkLocationPermission") { promise: Promise ->
            try {
                val context = appContext.reactContext
                if (context == null) {
                    promise.resolve(createPermissionResponse(false, "unavailable", "none", false))
                    return@AsyncFunction
                }

                val fineGranted = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                val coarseGranted = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                val backgroundGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContextCompat.checkSelfPermission(
                        context, Manifest.permission.ACCESS_BACKGROUND_LOCATION
                    ) == PackageManager.PERMISSION_GRANTED
                } else {
                    fineGranted || coarseGranted
                }

                val granted = fineGranted || coarseGranted
                val accuracy = when {
                    fineGranted -> "fine"
                    coarseGranted -> "coarse"
                    else -> "none"
                }
                val status = if (granted) "granted" else "denied"

                promise.resolve(createPermissionResponse(granted, status, accuracy, backgroundGranted))
            } catch (e: Exception) {
                Log.e(TAG, "checkLocationPermission error", e)
                promise.resolve(createPermissionResponse(false, "error", "none", false))
            }
        }

        // 권한 요청
        AsyncFunction("requestLocationPermission") { params: Map<String, Any?>, promise: Promise ->
            try {
                val activity = appContext.currentActivity
                if (activity == null) {
                    promise.resolve(createPermissionResponse(false, "unavailable", "none", false))
                    return@AsyncFunction
                }

                val context = appContext.reactContext
                if (context == null) {
                    promise.resolve(createPermissionResponse(false, "unavailable", "none", false))
                    return@AsyncFunction
                }

                val requestAccuracy = params["accuracy"] as? String ?: "fine"
                val requestBackground = params["background"] as? Boolean ?: false

                // 이미 권한이 있는지 확인
                val fineGranted = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                val coarseGranted = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                val hasBasicPermission = if (requestAccuracy == "fine") fineGranted else coarseGranted

                if (hasBasicPermission && !requestBackground) {
                    val accuracy = if (fineGranted) "fine" else "coarse"
                    promise.resolve(createPermissionResponse(true, "granted", accuracy, false))
                    return@AsyncFunction
                }

                // 권한 요청 구성
                val permissions = mutableListOf<String>()
                if (requestAccuracy == "fine") {
                    permissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
                }
                permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION)

                if (requestBackground && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    permissions.add(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
                }

                activity.requestPermissions(permissions.toTypedArray(), LOCATION_PERMISSION_REQUEST_CODE)

                // 결과는 즉시 반환 (실제 권한 상태는 다시 checkLocationPermission으로 확인해야 함)
                promise.resolve(createPermissionResponse(false, "requesting", "none", false))
            } catch (e: Exception) {
                Log.e(TAG, "requestLocationPermission error", e)
                promise.resolve(createPermissionResponse(false, "error", "none", false))
            }
        }

        // 현재 위치 조회
        AsyncFunction("getCurrentLocation") { params: Map<String, Any?>, promise: Promise ->
            try {
                val context = appContext.reactContext
                if (context == null) {
                    promise.resolve(mapOf("success" to false, "error" to "UNAVAILABLE"))
                    return@AsyncFunction
                }

                // 권한 확인
                val fineGranted = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                val coarseGranted = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                if (!fineGranted && !coarseGranted) {
                    promise.resolve(mapOf("success" to false, "error" to "PERMISSION_DENIED"))
                    return@AsyncFunction
                }

                // 위치 서비스 확인
                val locationManager = context.getSystemService(android.content.Context.LOCATION_SERVICE) as? LocationManager
                if (locationManager == null || !locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) &&
                    !locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    promise.resolve(mapOf("success" to false, "error" to "LOCATION_DISABLED"))
                    return@AsyncFunction
                }

                val client = fusedLocationClient
                if (client == null) {
                    promise.resolve(mapOf("success" to false, "error" to "UNAVAILABLE"))
                    return@AsyncFunction
                }

                // 파라미터 파싱
                val accuracy = params["accuracy"] as? String ?: "balanced"
                val timeout = (params["timeout"] as? Number)?.toLong() ?: 10000L
                val useCachedLocation = params["useCachedLocation"] as? Boolean ?: true
                @Suppress("UNCHECKED_CAST")
                val fields = (params["fields"] as? List<String>) ?: emptyList()

                val priority = when (accuracy) {
                    "high" -> Priority.PRIORITY_HIGH_ACCURACY
                    "low" -> Priority.PRIORITY_LOW_POWER
                    else -> Priority.PRIORITY_BALANCED_POWER_ACCURACY
                }

                // 캐시된 위치 먼저 시도
                if (useCachedLocation) {
                    try {
                        client.lastLocation.addOnSuccessListener { location ->
                            if (location != null) {
                                promise.resolve(createLocationResult(location, fields, true))
                            } else {
                                // 캐시 없으면 새 위치 요청
                                requestNewLocation(client, priority, timeout, fields, promise)
                            }
                        }.addOnFailureListener {
                            requestNewLocation(client, priority, timeout, fields, promise)
                        }
                    } catch (e: SecurityException) {
                        promise.resolve(mapOf("success" to false, "error" to "PERMISSION_DENIED"))
                    }
                } else {
                    requestNewLocation(client, priority, timeout, fields, promise)
                }
            } catch (e: Exception) {
                Log.e(TAG, "getCurrentLocation error", e)
                promise.resolve(mapOf("success" to false, "error" to "UNKNOWN"))
            }
        }

        // 위치 서비스 상태 확인
        AsyncFunction("getLocationStatus") { promise: Promise ->
            try {
                val context = appContext.reactContext
                if (context == null) {
                    promise.resolve(mapOf(
                        "isAvailable" to false,
                        "isEnabled" to false
                    ))
                    return@AsyncFunction
                }

                val locationManager = context.getSystemService(android.content.Context.LOCATION_SERVICE) as? LocationManager

                val gpsEnabled = locationManager?.isProviderEnabled(LocationManager.GPS_PROVIDER) ?: false
                val networkEnabled = locationManager?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) ?: false
                val isEnabled = gpsEnabled || networkEnabled

                val provider = when {
                    fusedLocationClient != null -> "fused"
                    gpsEnabled -> "gps"
                    networkEnabled -> "network"
                    else -> null
                }

                promise.resolve(mapOf(
                    "isAvailable" to (fusedLocationClient != null),
                    "isEnabled" to isEnabled,
                    "provider" to provider
                ))
            } catch (e: Exception) {
                Log.e(TAG, "getLocationStatus error", e)
                promise.resolve(mapOf(
                    "isAvailable" to false,
                    "isEnabled" to false
                ))
            }
        }
    }

    private fun createPermissionResponse(
        granted: Boolean,
        status: String,
        accuracy: String,
        background: Boolean
    ): Map<String, Any?> {
        return mapOf(
            "granted" to granted,
            "status" to status,
            "accuracy" to accuracy,
            "background" to background
        )
    }

    private fun createLocationResult(
        location: android.location.Location,
        fields: List<String>,
        isCached: Boolean
    ): Map<String, Any?> {
        val result = mutableMapOf<String, Any?>(
            "success" to true,
            "latitude" to location.latitude,
            "longitude" to location.longitude,
            "isCached" to isCached
        )

        // 요청된 필드만 포함
        if (fields.contains("altitude") && location.hasAltitude()) {
            result["altitude"] = location.altitude
        }
        if (fields.contains("speed") && location.hasSpeed()) {
            result["speed"] = location.speed.toDouble()
        }
        if (fields.contains("heading") && location.hasBearing()) {
            result["heading"] = location.bearing.toDouble()
        }
        if (fields.contains("accuracy") && location.hasAccuracy()) {
            result["accuracy"] = location.accuracy.toDouble()
        }
        if (fields.contains("timestamp")) {
            result["timestamp"] = location.time
        }

        return result
    }

    private fun requestNewLocation(
        client: FusedLocationProviderClient,
        priority: Int,
        timeout: Long,
        fields: List<String>,
        promise: Promise
    ) {
        try {
            val locationRequest = LocationRequest.Builder(priority, timeout)
                .setWaitForAccurateLocation(false)
                .setMinUpdateIntervalMillis(timeout / 2)
                .setMaxUpdates(1)
                .build()

            val locationCallback = object : LocationCallback() {
                override fun onLocationResult(result: LocationResult) {
                    client.removeLocationUpdates(this)
                    val location = result.lastLocation
                    if (location != null) {
                        promise.resolve(createLocationResult(location, fields, false))
                    } else {
                        promise.resolve(mapOf("success" to false, "error" to "TIMEOUT"))
                    }
                }
            }

            client.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
        } catch (e: SecurityException) {
            promise.resolve(mapOf("success" to false, "error" to "PERMISSION_DENIED"))
        } catch (e: Exception) {
            Log.e(TAG, "requestNewLocation error", e)
            promise.resolve(mapOf("success" to false, "error" to "UNKNOWN"))
        }
    }
}
