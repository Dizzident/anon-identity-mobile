# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Anon-Identity Mobile** is a React Native application that manages anonymous identity information using the `anon-identity` npm library. The app enables users to scan QR codes containing identity data and store them locally with verification capabilities.

## Technology Stack

- **Framework**: React Native 0.79.2 with TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Storage**: AsyncStorage for local persistence
- **Identity Management**: anon-identity library for verifiable credentials
- **QR Scanning**: react-native-qrcode-scanner + react-native-vision-camera
- **Testing**: Jest + React Native Testing Library
- **CI/CD**: GitHub Actions

## Common Development Commands

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS  
npm run ios

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run linting
npm run lint

# Build Android release
cd android && ./gradlew assembleRelease

# Build iOS release (requires Xcode)
cd ios && xcodebuild -workspace AnonIdentityMobile.xcworkspace -scheme AnonIdentityMobile archive
```

## Project Architecture

### Core Services
- **IdentityStorageService**: Local storage using AsyncStorage (singleton)
- **QRScannerService**: QR code validation and parsing
- **AnonIdentityService**: Integration with anon-identity library
- **IdentityFetchService**: Remote identity fetching and credential management
- **IdentityValidationService**: Identity data validation with scoring
- **PerformanceService**: Analytics and performance monitoring

### React Context
- **IdentityContext**: Global state management for identities with CRUD operations

### Key Screens
- **IdentityListScreen**: Main screen displaying all stored identities
- **IdentityDetailScreen**: Detailed view with validation scores and recommendations
- **QRScannerScreen**: Camera-based QR scanning with manual input fallback

### Data Flow
1. QR code scanned → QRScannerService validates/parses
2. If verifiable credential → AnonIdentityService processes
3. Identity created → IdentityStorageService persists
4. UI updates → IdentityContext notifies components
5. Validation → IdentityValidationService scores quality

## Key Features

### Identity Management
- Create, read, update, delete identities
- Support for verifiable credentials and basic QR data
- Local storage with AsyncStorage
- Real-time validation scoring (0-100)
- Identity health recommendations

### QR Code Processing
- Camera-based scanning with react-native-qrcode-scanner
- Manual input fallback for accessibility
- Multiple format support: JSON, email, identity strings
- Automatic credential detection and verification

### Validation System
- 8 validation rules (name, email, phone, QR data, verification, completeness, credentials, freshness)
- Scoring system with quality levels (excellent/good/fair/poor)
- Batch validation for multiple identities
- Custom validation rules support

### Performance & Analytics
- Automatic screen view tracking
- QR scan success/failure metrics
- Performance timing for operations
- Memory usage monitoring
- Event tracking for user actions

## Testing Strategy

### Unit Tests
- All services have comprehensive test coverage
- Mocked dependencies (anon-identity, AsyncStorage, React Navigation)
- Located in `src/**/__tests__/` and `src/**/*.test.ts`

### Integration Tests
- Complete identity lifecycle testing
- QR code to identity flow validation
- Multi-service interaction testing
- Located in `src/__tests__/integration/`

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test IdentityStorage.test.ts

# Run tests with coverage
npm test -- --coverage --watchAll=false

# Run integration tests
npm test -- --testPathPattern=integration
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):
1. **Lint and Test**: ESLint + Jest with coverage
2. **Build Android**: Gradle assembly
3. **Build iOS**: Xcode build (macOS runner)
4. **Coverage**: Codecov integration

## Development Guidelines

### Code Organization
- Services in `src/services/` (business logic)
- Screens in `src/screens/` (UI components)
- Hooks in `src/hooks/` (reusable React logic)
- Types in `src/types/` (TypeScript interfaces)
- Context in `src/context/` (React Context providers)

### Performance Considerations
- Use `useScreenTracking` hook for analytics
- Singleton services for efficiency
- Memory optimization in PerformanceService
- AsyncStorage operations are async and batched

### Error Handling
- All services have try/catch with logging
- User-friendly error messages in UI
- Graceful fallbacks (manual input, offline mode)
- Validation provides actionable feedback

### Security
- No sensitive data logged or committed
- Local storage only (no network by default)
- Verifiable credentials use cryptographic proofs
- QR data validation prevents malicious input

## Common Patterns

### Adding a New Screen
1. Create screen component in `src/screens/`
2. Add route to `AppNavigator.tsx`
3. Add screen tracking with `useScreenTracking`
4. Update navigation types in `RootStackParamList`

### Adding a New Service
1. Create service in `src/services/` with singleton pattern
2. Add comprehensive unit tests
3. Export from service for use in components/hooks
4. Consider performance tracking with `@trackPerformance` decorator

### Working with Identities
```typescript
// Use the context hook
const {identities, addIdentity, updateIdentity, deleteIdentity} = useIdentities();

// Access validation
const validationService = IdentityValidationService.getInstance();
const validation = validationService.validateIdentity(identity);
```

## Troubleshooting

### Common Issues
- **Metro bundler issues**: Clear cache with `npm start -- --reset-cache`
- **Android build fails**: Check Java/Gradle versions, clean with `cd android && ./gradlew clean`
- **iOS build fails**: Check Xcode version, clean derived data
- **Test failures**: Ensure mocks are properly configured in `jest.setup.js`

### Performance Issues
- Use PerformanceService to identify bottlenecks
- Monitor memory usage with `getMemoryUsage()`
- Optimize with `optimizeStorage()` for large datasets

### QR Scanning Issues
- Verify camera permissions are granted
- Check device compatibility with react-native-vision-camera
- Use manual input as fallback for problematic QR codes