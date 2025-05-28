# Anonymous Identity Mobile

A React Native mobile application for managing anonymous identities using verifiable credentials. This app allows users to scan QR codes, store identity information locally, and verify credentials using the anon-identity library.

## Features

- **QR Code Scanning**: Scan QR codes containing identity information with camera or manual input
- **Local Storage**: Securely store identity data locally using AsyncStorage
- **Identity Validation**: Advanced validation system with scoring and recommendations
- **Verifiable Credentials**: Integration with anon-identity library for credential verification
- **Performance Monitoring**: Built-in analytics and performance tracking
- **Cross-Platform**: Supports both Android and iOS

## Screenshots

The app includes three main screens:
- **Identity List**: View all stored identities with validation scores
- **QR Scanner**: Scan QR codes with camera or enter data manually
- **Identity Details**: View detailed information and validation status

## Technical Stack

- **Framework**: React Native with TypeScript
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **Storage**: AsyncStorage for local persistence
- **QR Scanning**: react-native-qrcode-scanner with react-native-vision-camera
- **Identity Library**: anon-identity for verifiable credentials
- **Testing**: Jest + React Native Testing Library
- **CI/CD**: GitHub Actions for automated testing and builds

## Architecture

### Services (Singleton Pattern)
- **IdentityStorageService**: CRUD operations for local identity storage
- **QRScannerService**: QR code validation and parsing
- **AnonIdentityService**: Integration with anon-identity library
- **IdentityValidationService**: Identity validation with scoring system
- **IdentityFetchService**: Remote identity fetching and credential population
- **PerformanceService**: Analytics and performance monitoring

### Components
- **React Context**: IdentityContext for state management
- **Custom Hooks**: useQRScanner, usePerformance, useScreenTracking
- **Type-Safe Navigation**: TypeScript navigation types

## Getting Started

### Prerequisites

- Node.js (>= 14)
- React Native development environment set up
- For iOS: Xcode and CocoaPods
- For Android: Android Studio and SDK

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd anon-identity-mobile
```

2. Install dependencies:
```bash
npm install
```

3. For iOS, install CocoaPods dependencies:
```bash
cd ios && pod install && cd ..
```

### Running the App

#### Android
```bash
npm run android
```

#### iOS
```bash
npm run ios
```

#### Development Server
```bash
npm start
```

## Testing

Run the complete test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Test Coverage
- **Storage Service**: 16/16 tests passing
- **QR Scanner Service**: 19/19 tests passing
- **Validation Service**: Comprehensive validation rules testing
- **Integration Tests**: End-to-end workflow testing

## Development

### Code Quality
```bash
npm run lint          # ESLint checking
npm run lint:fix      # Auto-fix linting issues
npm run typecheck     # TypeScript type checking
```

### Project Structure
```
src/
├── components/       # Reusable UI components
├── context/         # React Context providers
├── hooks/           # Custom React hooks
├── navigation/      # Navigation configuration
├── screens/         # Screen components
├── services/        # Business logic services
├── types/           # TypeScript type definitions
└── __tests__/       # Test files
```

### Key Features Implementation

#### QR Code Scanning
The app supports multiple QR code formats:
- JSON objects with identity data
- Email addresses
- Identity strings
- Verifiable credentials

#### Identity Validation
8-rule validation system with scoring:
- Name validation
- Email format checking
- Phone number validation
- QR data integrity
- Date consistency
- Verification status
- Additional data validation
- Credential verification

#### Performance Monitoring
- Screen view tracking
- Event analytics
- Memory usage monitoring
- Operation timing
- Storage optimization

## CI/CD Pipeline

GitHub Actions workflow includes:
- **Dependency Installation**: Cache and install npm packages
- **Linting**: ESLint code quality checks
- **Type Checking**: TypeScript compilation
- **Testing**: Complete test suite execution
- **Build**: Android and iOS build verification

## Deployment

### Android
1. Generate signed APK:
```bash
cd android && ./gradlew assembleRelease
```

2. The APK will be available at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### iOS
1. Open iOS project in Xcode:
```bash
open ios/AnonIdentityMobile.xcworkspace
```

2. Configure signing and build for release

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Run linting and tests: `npm run lint && npm test`
5. Commit changes: `git commit -m "Add feature"`
6. Push to branch: `git push origin feature-name`
7. Create a Pull Request

## Troubleshooting

### Common Issues

#### Metro bundler issues:
```bash
npx react-native start --reset-cache
```

#### Android build issues:
```bash
cd android && ./gradlew clean && cd ..
```

#### iOS build issues:
```bash
cd ios && pod install && cd ..
```

#### Permission issues (Android):
Ensure camera permissions are declared in `android/app/src/main/AndroidManifest.xml`

#### Test failures:
Clear Jest cache:
```bash
npx jest --clearCache
```

### Getting Help

For development questions and troubleshooting:
1. Check the [React Native docs](https://reactnative.dev/docs/getting-started)
2. Review the project's GitHub issues
3. Check CLAUDE.md for detailed development information

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- anon-identity library for verifiable credentials
- React Native community for excellent tooling
- Various open-source libraries that make this project possible