import 'package:flutter_test/flutter_test.dart';
import 'package:doctor_app/main.dart';

void main() {
  testWidgets('DoctorApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const DoctorApp());
    expect(find.byType(DoctorApp), findsOneWidget);
  });
}
