import 'dart:math' as math;

/// Represents a geographic coordinate pair with elevation/metadata.
class GeoCoordinate {
  final double latitude;
  final double longitude;
  final String? label;

  const GeoCoordinate({
    required this.latitude,
    required this.longitude,
    this.label,
  });

  @override
  String toString() => 'GeoCoordinate($latitude, $longitude, label: $label)';
}

/// Route summary with distance, travel time, and navigation bearing.
class RouteEstimate {
  final double distanceKm;
  final int etaMinutes;
  final double bearingDegrees;
  final String compassHeading;
  final bool isWithinGeofence;

  const RouteEstimate({
    required this.distanceKm,
    required this.etaMinutes,
    required this.bearingDegrees,
    required this.compassHeading,
    required this.isWithinGeofence,
  });
}

/// Real-time Geolocation, Haversine Distance & Urban Traffic ETA Engine
/// Built specifically for MediQ 15-Minute Express Pharmacy Delivery Network.
class GeoRoutingService {
  static const double earthRadiusKm = 6371.0;
  static const double defaultUrbanSpeedKmh = 26.0; // Ahmedabad average two-wheeler speed
  static const double defaultTrafficMultiplier = 1.20; // Peak traffic congestion multiplier
  static const double defaultGeofenceThresholdMeters = 50.0; // Doorstep proximity trigger

  /// Calculates geodesic distance between two points using the Haversine formula.
  static double calculateHaversineDistanceKm(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    final dLat = _degreesToRadians(lat2 - lat1);
    final dLon = _degreesToRadians(lon2 - lon1);

    final rLat1 = _degreesToRadians(lat1);
    final rLat2 = _degreesToRadians(lat2);

    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.sin(dLon / 2) *
            math.sin(dLon / 2) *
            math.cos(rLat1) *
            math.cos(rLat2);

    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    final distance = earthRadiusKm * c;

    return double.parse(distance.toStringAsFixed(2));
  }

  /// Calculates initial compass bearing in degrees (0° - 360°) from origin to destination.
  static double calculateBearing(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    final lat1Rad = _degreesToRadians(lat1);
    final lat2Rad = _degreesToRadians(lat2);
    final dLonRad = _degreesToRadians(lon2 - lon1);

    final y = math.sin(dLonRad) * math.cos(lat2Rad);
    final x = math.cos(lat1Rad) * math.sin(lat2Rad) -
        math.sin(lat1Rad) * math.cos(lat2Rad) * math.cos(dLonRad);

    final initialBearingRad = math.atan2(y, x);
    final initialBearingDeg = _radiansToDegrees(initialBearingRad);

    // Normalize to 0-360
    return (initialBearingDeg + 360.0) % 360.0;
  }

  /// Converts bearing degrees into 8-point compass cardinal direction.
  static String getCompassHeading(double bearingDegrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    final index = ((bearingDegrees + 22.5) / 45).floor() % 8;
    return directions[index];
  }

  /// Estimates delivery arrival time (ETA in minutes) with Indian urban traffic buffers.
  static int estimateEtaMinutes(
    double distanceKm, {
    double averageSpeedKmh = defaultUrbanSpeedKmh,
    double trafficMultiplier = defaultTrafficMultiplier,
    int fixedPickupBufferMinutes = 2,
  }) {
    if (distanceKm <= 0.05) return 1;

    // Actual travel time in hours
    final travelHours = (distanceKm / averageSpeedKmh) * trafficMultiplier;
    final travelMinutes = (travelHours * 60).ceil();

    return travelMinutes + fixedPickupBufferMinutes;
  }

  /// Checks if a delivery rider has entered within target geofence radius (meters).
  static bool isWithinGeofence(
    double riderLat,
    double riderLon,
    double targetLat,
    double targetLon, {
    double radiusMeters = defaultGeofenceThresholdMeters,
  }) {
    final distanceKm = calculateHaversineDistanceKm(
      riderLat,
      riderLon,
      targetLat,
      targetLon,
    );
    final distanceMeters = distanceKm * 1000.0;
    return distanceMeters <= radiusMeters;
  }

  /// Generates synthetic intermediate GPS coordinates for smooth map route animation.
  static List<GeoCoordinate> generateInterpolatedWaypoints(
    double lat1,
    double lon1,
    double lat2,
    double lon2, {
    int waypointsCount = 5,
  }) {
    final points = <GeoCoordinate>[];
    points.add(GeoCoordinate(latitude: lat1, longitude: lon1, label: 'Start'));

    for (int i = 1; i <= waypointsCount; i++) {
      final fraction = i / (waypointsCount + 1);
      final interpolatedLat = lat1 + (lat2 - lat1) * fraction;
      final interpolatedLon = lon1 + (lon2 - lon1) * fraction;

      points.add(
        GeoCoordinate(
          latitude: double.parse(interpolatedLat.toStringAsFixed(6)),
          longitude: double.parse(interpolatedLon.toStringAsFixed(6)),
          label: 'Waypoint $i',
        ),
      );
    }

    points.add(GeoCoordinate(latitude: lat2, longitude: lon2, label: 'Destination'));
    return points;
  }

  /// Provides a full route snapshot estimate between rider and destination.
  static RouteEstimate computeRouteEstimate({
    required double riderLat,
    required double riderLon,
    required double destLat,
    required double destLon,
    double trafficMultiplier = defaultTrafficMultiplier,
  }) {
    final distanceKm = calculateHaversineDistanceKm(riderLat, riderLon, destLat, destLon);
    final etaMinutes = estimateEtaMinutes(
      distanceKm,
      trafficMultiplier: trafficMultiplier,
    );
    final bearing = calculateBearing(riderLat, riderLon, destLat, destLon);
    final heading = getCompassHeading(bearing);
    final withinGeofence = isWithinGeofence(riderLat, riderLon, destLat, destLon);

    return RouteEstimate(
      distanceKm: distanceKm,
      etaMinutes: etaMinutes,
      bearingDegrees: double.parse(bearing.toStringAsFixed(1)),
      compassHeading: heading,
      isWithinGeofence: withinGeofence,
    );
  }

  static double _degreesToRadians(double degrees) => degrees * (math.pi / 180.0);
  static double _radiansToDegrees(double radians) => radians * (180.0 / math.pi);
}
