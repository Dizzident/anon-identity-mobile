// Polyfills for React Native
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Make Buffer globally available
global.Buffer = Buffer;