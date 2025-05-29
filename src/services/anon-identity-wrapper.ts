// Wrapper to handle anon-identity imports in React Native environment
// The actual anon-identity library is not compatible with React Native
// so we always use the mock implementation in production

let anonIdentityModule: any = null;

export async function getAnonIdentityModule() {
  if (!anonIdentityModule) {
    // Always use mock implementation in React Native
    // The real anon-identity library requires Node.js modules
    anonIdentityModule = require('../__mocks__/anon-identity');
  }
  return anonIdentityModule;
}

export type {
  VerifiableCredential,
  VerifiablePresentation,
  UserAttributes,
} from '../__mocks__/anon-identity';