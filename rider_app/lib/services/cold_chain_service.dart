/// MediQ Cold-Chain IoT Telemetry & Sensor Guardian
/// Complies with Central Drugs Standard Control Organization (CDSCO)
/// & WHO guidelines for biological medicine distribution (2°C to 8°C).
library;

enum ColdChainStatus {
  optimalSafe,     // 2.0°C - 8.0°C
  warningLow,      // 0.5°C - 1.9°C
  warningHigh,     // 8.1°C - 10.0°C
  criticalViolation // < 0.5°C or > 10.0°C
}

class ColdChainReading {
  final double temperatureCelsius;
  final DateTime timestamp;
  final String orderId;
  final String medicineSalt;
  final ColdChainStatus status;

  const ColdChainReading({
    required this.temperatureCelsius,
    required this.timestamp,
    required this.orderId,
    required this.medicineSalt,
    required this.status,
  });

  bool get isSafe => status == ColdChainStatus.optimalSafe;

  String get statusBadgeLabel {
    switch (status) {
      case ColdChainStatus.optimalSafe:
        return '● 2–8°C OPTIMAL (SAFE)';
      case ColdChainStatus.warningLow:
        return '⚠️ LOW TEMP WARNING';
      case ColdChainStatus.warningHigh:
        return '⚠️ HIGH TEMP WARNING';
      case ColdChainStatus.criticalViolation:
        return '❌ TEMPERATURE COMPROMISED';
    }
  }

  static ColdChainStatus evaluateTemperature(double temp) {
    if (temp >= 2.0 && temp <= 8.0) {
      return ColdChainStatus.optimalSafe;
    } else if (temp >= 0.5 && temp < 2.0) {
      return ColdChainStatus.warningLow;
    } else if (temp > 8.0 && temp <= 10.0) {
      return ColdChainStatus.warningHigh;
    } else {
      return ColdChainStatus.criticalViolation;
    }
  }

  Map<String, dynamic> toFirestoreLog() {
    return {
      'orderId': orderId,
      'temperatureCelsius': temperatureCelsius,
      'timestamp': timestamp.toIso8601String(),
      'status': status.name,
      'isSafe': isSafe,
      'medicineSalt': medicineSalt,
    };
  }
}
