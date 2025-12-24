import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/dashboard_provider.dart';
import 'screens/splash_screen.dart';

void main() {
  runApp(const ReBusinessApp());
}

class ReBusinessApp extends StatelessWidget {
  const ReBusinessApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DashboardProvider()),
      ],
      child: MaterialApp(
        title: 'ReBusiness',
        debugShowCheckedModeBanner: false,
        theme: ThemeConfig.darkTheme,
        home: const SplashScreen(),
      ),
    );
  }
}
