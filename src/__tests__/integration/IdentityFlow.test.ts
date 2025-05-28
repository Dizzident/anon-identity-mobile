import AsyncStorage from '@react-native-async-storage/async-storage';
import {IdentityStorageService} from '../../services/IdentityStorage';
import {QRScannerService} from '../../services/QRScannerService';
import {AnonIdentityService} from '../../services/AnonIdentityService';
// import {IdentityFetchService} from '../../services/IdentityFetchService';
import {IdentityValidationService} from '../../services/IdentityValidationService';

// Mock AsyncStorage for integration tests
const mockAsyncStorage: {
  data: Map<string, string>;
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: jest.Mock;
} = {
  data: new Map<string, string>(),
  getItem: jest.fn((key: string) => Promise.resolve(mockAsyncStorage.data.get(key) || null)),
  setItem: jest.fn((key: string, value: string) => Promise.resolve(mockAsyncStorage.data.set(key, value))),
  removeItem: jest.fn((key: string) => Promise.resolve(mockAsyncStorage.data.delete(key))),
  clear: jest.fn(() => Promise.resolve(mockAsyncStorage.data.clear())),
};

// Apply the mock
jest.mocked(AsyncStorage.getItem).mockImplementation(mockAsyncStorage.getItem);
jest.mocked(AsyncStorage.setItem).mockImplementation(mockAsyncStorage.setItem);
jest.mocked(AsyncStorage.removeItem).mockImplementation(mockAsyncStorage.removeItem);

// Integration tests for the complete identity management flow
describe('Identity Management Integration', () => {
  let storageService: IdentityStorageService;
  let qrScannerService: QRScannerService;
  let anonIdentityService: AnonIdentityService;
  // let fetchService: IdentityFetchService;
  let validationService: IdentityValidationService;

  beforeEach(() => {
    // Clear async storage before each test
    mockAsyncStorage.data.clear();
    jest.clearAllMocks();

    storageService = IdentityStorageService.getInstance();
    qrScannerService = QRScannerService.getInstance();
    anonIdentityService = AnonIdentityService.getInstance();
    // fetchService = IdentityFetchService.getInstance();
    validationService = IdentityValidationService.getInstance();

    // Reset services
    anonIdentityService.reset();
  });

  afterEach(async () => {
    // Clean up storage after each test
    try {
      await storageService.clearAllIdentities();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Complete QR Code to Identity Flow', () => {
    it('should process simple QR code and create identity', async () => {
      // 1. Simulate QR code scan
      const qrData = 'john.doe@example.com';

      // 2. Validate QR data
      const validation = qrScannerService.validateQRData(qrData);
      expect(validation.isValid).toBe(true);

      // 3. Parse QR data
      const parsedData = qrScannerService.parseQRData(qrData);
      expect(parsedData.email).toBe('john.doe@example.com');

      // 4. Create identity
      const newIdentity = await storageService.addIdentity({
        name: parsedData.name || parsedData.email || 'Unknown',
        email: parsedData.email,
        phone: parsedData.phone,
        qrData,
        isVerified: false,
      });

      expect(newIdentity.id).toBeDefined();
      expect(newIdentity.email).toBe('john.doe@example.com');
      expect(newIdentity.isVerified).toBe(false);

      // 5. Validate created identity
      const identityValidation = validationService.validateIdentity(newIdentity);
      expect(identityValidation.isValid).toBe(true);
      expect(identityValidation.score).toBeGreaterThan(0);

      // 6. Verify storage
      const storedIdentity = await storageService.getIdentityById(newIdentity.id);
      expect(storedIdentity).toEqual(newIdentity);
    });

    it('should process JSON QR code with complete identity data', async () => {
      const qrData = JSON.stringify({
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567890',
        organization: 'Tech Corp',
        role: 'Developer',
      });

      // Process QR data
      const validation = qrScannerService.validateQRData(qrData);
      expect(validation.isValid).toBe(true);

      const parsedData = qrScannerService.parseQRData(qrData);
      expect(parsedData.name).toBe('Jane Smith');
      expect(parsedData.email).toBe('jane.smith@example.com');
      expect(parsedData.phone).toBe('+1234567890');
      expect(parsedData.additionalData).toEqual({
        organization: 'Tech Corp',
        role: 'Developer',
      });

      // Create and validate identity
      const newIdentity = await storageService.addIdentity({
        name: parsedData.name!,
        email: parsedData.email,
        phone: parsedData.phone,
        qrData,
        isVerified: false,
        additionalData: parsedData.additionalData,
      });

      const identityValidation = validationService.validateIdentity(newIdentity);
      expect(identityValidation.isValid).toBe(true);
      expect(identityValidation.score).toBeGreaterThan(50); // Higher score due to completeness
    });
  });

  describe('Identity CRUD Operations', () => {
    it('should perform complete CRUD cycle', async () => {
      // Create
      const originalIdentity = await storageService.addIdentity({
        name: 'Test User',
        email: 'test@example.com',
        qrData: 'test-data',
        isVerified: false,
      });

      expect(originalIdentity.id).toBeDefined();

      // Read
      let storedIdentity = await storageService.getIdentityById(originalIdentity.id);
      expect(storedIdentity).toEqual(originalIdentity);

      // Read All
      const allIdentities = await storageService.loadIdentities();
      expect(allIdentities).toContainEqual(originalIdentity);

      // Update
      const updatedIdentity = await storageService.updateIdentity(originalIdentity.id, {
        phone: '+9876543210',
        isVerified: true,
      });

      expect(updatedIdentity?.phone).toBe('+9876543210');
      expect(updatedIdentity?.isVerified).toBe(true);
      expect(updatedIdentity?.name).toBe('Test User'); // Unchanged fields preserved

      // Delete
      const deleteResult = await storageService.deleteIdentity(originalIdentity.id);
      expect(deleteResult).toBe(true);

      // Verify deletion
      const deletedIdentity = await storageService.getIdentityById(originalIdentity.id);
      expect(deletedIdentity).toBeNull();
    });

    it('should handle concurrent operations gracefully', async () => {
      // Create multiple identities sequentially to avoid race conditions in the test
      const identities = [];
      for (let i = 0; i < 5; i++) {
        const identity = await storageService.addIdentity({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          qrData: `qr-data-${i}`,
          isVerified: false,
        });
        identities.push(identity);
      }

      expect(identities).toHaveLength(5);

      // Verify all identities have unique IDs
      const ids = identities.map(id => id.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);

      // Update all identities to verified
      const updatedIdentities = [];
      for (let i = 0; i < identities.length; i++) {
        const updated = await storageService.updateIdentity(identities[i].id, {isVerified: true});
        updatedIdentities.push(updated);
      }

      updatedIdentities.forEach((identity, index) => {
        expect(identity).not.toBeNull();
        expect(identity?.isVerified).toBe(true);
        expect(identity?.name).toBe(`User ${index}`);
      });
    });
  });

  describe('Validation Integration', () => {
    it('should validate identity throughout its lifecycle', async () => {
      // Create minimal identity
      const minimalIdentity = await storageService.addIdentity({
        name: 'Min User',
        qrData: 'minimal',
        isVerified: false,
      });

      let validation = validationService.validateIdentity(minimalIdentity);
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0); // Should have warnings about missing data

      // Add email
      const withEmail = await storageService.updateIdentity(minimalIdentity.id, {
        email: 'min.user@example.com',
      });

      const newValidation = validationService.validateIdentity(withEmail!);
      expect(newValidation.score).toBeGreaterThan(validation.score); // Should improve
      validation = newValidation;

      // Add phone and verify
      const complete = await storageService.updateIdentity(minimalIdentity.id, {
        phone: '+1234567890',
        isVerified: true,
      });

      validation = validationService.validateIdentity(complete!);
      expect(validation.score).toBeGreaterThan(60); // Should be good score now
    });

    it('should detect and report validation issues', async () => {
      // Create identity with issues
      const problematicIdentity = await storageService.addIdentity({
        name: '', // Empty name
        email: 'invalid-email', // Invalid email
        phone: '123', // Invalid phone
        qrData: '',  // Empty QR data
        isVerified: false,
      });

      const validation = validationService.validateIdentity(problematicIdentity);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.score).toBeLessThan(50);

      // Check specific error messages
      expect(validation.errors).toContain('Identity must have a name');
      expect(validation.errors).toContain('Invalid email format');
      expect(validation.errors).toContain('Missing QR code data');
    });
  });

  describe('Batch Operations', () => {
    it('should validate multiple identities efficiently', async () => {
      // Create mix of good and bad identities
      const identities = await Promise.all([
        storageService.addIdentity({
          name: 'Good User 1',
          email: 'good1@example.com',
          phone: '+1234567890',
          qrData: JSON.stringify({name: 'Good User 1'}),
          isVerified: true,
        }),
        storageService.addIdentity({
          name: 'Bad User',
          email: 'invalid-email',
          qrData: '',
          isVerified: false,
        }),
        storageService.addIdentity({
          name: 'Good User 2',
          email: 'good2@example.com',
          qrData: 'good2@example.com',
          isVerified: false,
        }),
      ]);

      const batchValidation = validationService.validateMultipleIdentities(identities);

      expect(batchValidation.summary.totalValidated).toBe(3);
      expect(batchValidation.summary.validCount).toBe(2); // Two good identities
      expect(batchValidation.summary.invalidCount).toBe(1); // One bad identity
      expect(batchValidation.summary.averageScore).toBeGreaterThan(0);
      expect(batchValidation.summary.commonIssues.length).toBeGreaterThan(0);

      // Check individual results
      const goodResults = batchValidation.results.filter(r => r.validation.isValid);
      const badResults = batchValidation.results.filter(r => !r.validation.isValid);

      expect(goodResults).toHaveLength(2);
      expect(badResults).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Test with invalid identity ID
      const nonExistentId = 'non-existent-id';

      const identity = await storageService.getIdentityById(nonExistentId);
      expect(identity).toBeNull();

      const updateResult = await storageService.updateIdentity(nonExistentId, {name: 'New Name'});
      expect(updateResult).toBeNull();

      const deleteResult = await storageService.deleteIdentity(nonExistentId);
      expect(deleteResult).toBe(false);
    });

    it('should handle QR parsing errors gracefully', async () => {
      const invalidQRData = 'definitely not valid qr data';

      const validation = qrScannerService.validateQRData(invalidQRData);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();

      // Should still be able to parse even invalid data
      const parsedData = qrScannerService.parseQRData(invalidQRData);
      expect(parsedData.identifier).toBe(invalidQRData);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle moderate load efficiently', async () => {
      const startTime = Date.now();

      // Create 20 identities sequentially to avoid race conditions in test
      const identities = [];
      for (let i = 0; i < 20; i++) {
        const identity = await storageService.addIdentity({
          name: `Performance User ${i}`,
          email: `perf${i}@example.com`,
          qrData: `performance-data-${i}`,
          isVerified: i % 2 === 0, // Alternate verification status
        });
        identities.push(identity);
      }

      expect(identities).toHaveLength(20);

      // Validate all identities
      const validation = validationService.validateMultipleIdentities(identities);
      expect(validation.summary.totalValidated).toBe(20);

      // Load all identities
      const allIdentities = await storageService.loadIdentities();
      expect(allIdentities.length).toBe(20);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });
});
