import '../lib/services/geo_routing_service.dart';

void main() {
  print('Running GeoRoutingService unit tests...');

  // Ahmedabad coordinates: Sola Bridge to Shivalik Residency (~1.8 km)
  final solaLat = 23.0768;
  final solaLon = 72.5250;
  final shivalikLat = 23.0820;
  final shivalikLon = 72.5350;

  // 1. Haversine distance test
  final dist = GeoRoutingService.calculateHaversineDistanceKm(
    solaLat, solaLon, shivalikLat, shivalikLon,
  );
  print('Calculated Distance: $dist km');
  assert(dist > 1.0 && dist < 2.0, 'Distance should be between 1.0 and 2.0 km');

  // 2. Bearing test
  final bearing = GeoRoutingService.calculateBearing(
    solaLat, solaLon, shivalikLat, shivalikLon,
  );
  final heading = GeoRoutingService.getCompassHeading(bearing);
  print('Calculated Bearing: $bearing deg, Heading: $heading');
  assert(bearing >= 0 && bearing <= 360, 'Bearing must be in range [0, 360]');
  assert(heading == 'NE' || heading == 'E', 'Heading should be North-East direction');

  // 3. ETA estimation test
  final eta = GeoRoutingService.estimateEtaMinutes(dist);
  print('Calculated ETA: $eta mins');
  assert(eta >= 3 && eta <= 10, 'ETA should be reasonable for ~1.5km delivery');

  // 4. Geofencing test
  final isNear = GeoRoutingService.isWithinGeofence(
    solaLat, solaLon, solaLat + 0.0001, solaLon + 0.0001,
    radiusMeters: 50.0,
  );
  final isFar = GeoRoutingService.isWithinGeofence(
    solaLat, solaLon, shivalikLat, shivalikLon,
    radiusMeters: 50.0,
  );
  print('Geofence Near: $isNear, Far: $isFar');
  assert(isNear == true, 'Close coordinate should be inside geofence');
  assert(isFar == false, 'Far coordinate should be outside geofence');

  // 5. Waypoints interpolation
  final waypoints = GeoRoutingService.generateInterpolatedWaypoints(
    solaLat, solaLon, shivalikLat, shivalikLon,
    waypointsCount: 3,
  );
  print('Waypoints generated: ${waypoints.length}');
  assert(waypoints.length == 5, 'Should produce 5 coordinates (start + 3 waypoints + dest)');

  // 6. Full route estimate snapshot
  final route = GeoRoutingService.computeRouteEstimate(
    riderLat: solaLat,
    riderLon: solaLon,
    destLat: shivalikLat,
    destLon: shivalikLon,
  );
  print('Route Snapshot: dist=${route.distanceKm}km, eta=${route.etaMinutes}m, heading=${route.compassHeading}');
  assert(route.distanceKm == dist);

  print('ALL GeoRoutingService TESTS PASSED SUCCESSFULLY! [OK]');
}
