import 'package:flutter/material.dart';

import 'ui/workspace_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const WaspMedApp());
}

/// Palette shared across the app (matches the web landing).
abstract class AppColors {
  static const ground = Color(0xFF0B0F17);
  static const panel = Color(0xFF111827);
  static const panelAlt = Color(0xFF0D1320);
  static const border = Color(0xFF1E293B);
  static const text = Color(0xFFE5E7EB);
  static const muted = Color(0xFF94A3B8);
  static const cyan = Color(0xFF00D2FF);
  static const blue = Color(0xFF0066FF);
  static const green = Color(0xFF34D399);
  static const amber = Color(0xFFFBBF24);
  static const red = Color(0xFFF87171);
}

class WaspMedApp extends StatelessWidget {
  const WaspMedApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'WaspMed Draft',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.ground,
        fontFamily: 'SF Pro Text',
        colorScheme: const ColorScheme.dark(
          primary: AppColors.cyan,
          secondary: AppColors.blue,
          surface: AppColors.panel,
        ),
        sliderTheme: SliderThemeData(
          activeTrackColor: AppColors.cyan,
          inactiveTrackColor: AppColors.border,
          thumbColor: AppColors.cyan,
          overlayColor: AppColors.cyan.withValues(alpha: 0.15),
          trackHeight: 3,
        ),
        textSelectionTheme: TextSelectionThemeData(
          cursorColor: AppColors.cyan,
          selectionColor: AppColors.cyan.withValues(alpha: 0.3),
        ),
      ),
      home: const WorkspaceScreen(),
    );
  }
}
