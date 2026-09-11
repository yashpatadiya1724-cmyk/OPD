import 'package:flutter_test/flutter_test.dart';
import 'package:patient_app/main.dart';

void main() {
  testWidgets('PatientApp initial smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const PatientApp());
    expect(find.byType(PatientApp), findsOneWidget);
  });
}
