import {renderHook, act} from '@testing-library/react-native';
import {useQRScanner} from '../useQRScanner';
import {QRScannerService} from '../../services/QRScannerService';
import {AnonIdentityService} from '../../services/AnonIdentityService';
import {useIdentities} from '../../context/IdentityContext';

// Mock the services and context
jest.mock('../../services/QRScannerService');
jest.mock('../../services/AnonIdentityService');
jest.mock('../../context/IdentityContext');

const mockQRScannerService = {
  checkPermissions: jest.fn(),
  requestPermissions: jest.fn(),
  validateQRData: jest.fn(),
  parseQRData: jest.fn(),
};

const mockAnonIdentityService = {
  isInitialized: jest.fn(),
  initialize: jest.fn(),
  parseCredentialFromQR: jest.fn(),
  storeCredential: jest.fn(),
  extractIdentityFromCredential: jest.fn(),
  getWalletDID: jest.fn(),
};

const mockIdentityContext = {
  addIdentity: jest.fn(),
};

(QRScannerService.getInstance as jest.Mock).mockReturnValue(mockQRScannerService);
(AnonIdentityService.getInstance as jest.Mock).mockReturnValue(mockAnonIdentityService);
(useIdentities as jest.Mock).mockReturnValue(mockIdentityContext);

describe('useQRScanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQRScannerService.checkPermissions.mockResolvedValue({camera: true});
    mockQRScannerService.requestPermissions.mockResolvedValue({camera: true});
    mockAnonIdentityService.isInitialized.mockReturnValue(false);
    mockAnonIdentityService.initialize.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const {result} = renderHook(() => useQRScanner());

      expect(result.current.isScanning).toBe(false);
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('requestPermissions', () => {
    it('should request permissions successfully', async () => {
      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        const granted = await result.current.requestPermissions();
        expect(granted).toBe(true);
      });

      expect(mockQRScannerService.requestPermissions).toHaveBeenCalled();
      expect(result.current.hasPermission).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle permission denial', async () => {
      mockQRScannerService.requestPermissions.mockResolvedValue({camera: false});
      
      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        const granted = await result.current.requestPermissions();
        expect(granted).toBe(false);
      });

      expect(result.current.hasPermission).toBe(false);
      expect(result.current.error).toContain('Camera permission is required');
    });

    it('should handle permission errors', async () => {
      mockQRScannerService.requestPermissions.mockRejectedValue(new Error('Permission error'));
      
      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        const granted = await result.current.requestPermissions();
        expect(granted).toBe(false);
      });

      expect(result.current.error).toContain('Failed to request camera permissions');
    });
  });

  describe('startScanning', () => {
    it('should start scanning when permissions are granted', async () => {
      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        await result.current.startScanning();
      });

      expect(mockQRScannerService.checkPermissions).toHaveBeenCalled();
      expect(result.current.isScanning).toBe(true);
      expect(result.current.hasPermission).toBe(true);
    });

    it('should request permissions if not granted', async () => {
      mockQRScannerService.checkPermissions.mockResolvedValue({camera: false});
      
      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        await result.current.startScanning();
      });

      expect(mockQRScannerService.requestPermissions).toHaveBeenCalled();
      expect(result.current.isScanning).toBe(true);
    });

    it('should not start scanning if permissions denied', async () => {
      mockQRScannerService.checkPermissions.mockResolvedValue({camera: false});
      mockQRScannerService.requestPermissions.mockResolvedValue({camera: false});
      
      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        await result.current.startScanning();
      });

      expect(result.current.isScanning).toBe(false);
    });

    it('should handle scanning errors', async () => {
      mockQRScannerService.checkPermissions.mockRejectedValue(new Error('Check error'));
      
      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        await result.current.startScanning();
      });

      expect(result.current.error).toContain('Failed to start scanning');
      expect(result.current.isScanning).toBe(false);
    });
  });

  describe('stopScanning', () => {
    it('should stop scanning', async () => {
      const {result} = renderHook(() => useQRScanner());

      // Start scanning first
      await act(async () => {
        await result.current.startScanning();
      });

      expect(result.current.isScanning).toBe(true);

      // Stop scanning
      act(() => {
        result.current.stopScanning();
      });

      expect(result.current.isScanning).toBe(false);
    });
  });

  describe('processQRCode', () => {
    const validQRData = 'john.doe@example.com';

    beforeEach(() => {
      mockQRScannerService.validateQRData.mockReturnValue({isValid: true});
      mockQRScannerService.parseQRData.mockReturnValue({
        name: 'John Doe',
        email: 'john.doe@example.com',
      });
      mockAnonIdentityService.parseCredentialFromQR.mockResolvedValue(null);
      mockIdentityContext.addIdentity.mockResolvedValue({id: 'new-id'});
    });

    it('should process QR code successfully without credential', async () => {
      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        await result.current.processQRCode(validQRData);
      });

      expect(mockQRScannerService.validateQRData).toHaveBeenCalledWith(validQRData);
      expect(mockAnonIdentityService.initialize).toHaveBeenCalled();
      expect(mockAnonIdentityService.parseCredentialFromQR).toHaveBeenCalledWith(validQRData);
      expect(mockQRScannerService.parseQRData).toHaveBeenCalledWith(validQRData);
      expect(mockIdentityContext.addIdentity).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: undefined,
        qrData: validQRData,
        isVerified: false,
        additionalData: {},
      });
      expect(result.current.isScanning).toBe(false);
    });

    it('should process verifiable credential', async () => {
      const mockCredential = {
        id: 'cred-123',
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2024-01-15T00:00:00Z',
        credentialSubject: {
          id: 'did:example:subject',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      mockAnonIdentityService.parseCredentialFromQR.mockResolvedValue(mockCredential);
      mockAnonIdentityService.extractIdentityFromCredential.mockResolvedValue({
        name: 'John Doe',
        email: 'john@example.com',
      });
      mockAnonIdentityService.getWalletDID.mockResolvedValue('did:example:wallet');

      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        await result.current.processQRCode(validQRData);
      });

      expect(mockAnonIdentityService.storeCredential).toHaveBeenCalledWith(mockCredential);
      expect(mockAnonIdentityService.extractIdentityFromCredential).toHaveBeenCalledWith(mockCredential);
      expect(mockIdentityContext.addIdentity).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: undefined,
        qrData: validQRData,
        isVerified: true,
        additionalData: {
          credentialId: 'cred-123',
          issuer: 'did:example:issuer',
          issuanceDate: '2024-01-15T00:00:00Z',
          did: 'did:example:wallet',
        },
      });
    });

    it('should handle invalid QR data', async () => {
      mockQRScannerService.validateQRData.mockReturnValue({
        isValid: false,
        error: 'Invalid QR code',
      });

      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        await result.current.processQRCode('invalid-data');
      });

      expect(result.current.error).toBe('Invalid QR code');
      expect(mockIdentityContext.addIdentity).not.toHaveBeenCalled();
    });

    it('should initialize anon-identity service if not initialized', async () => {
      mockAnonIdentityService.isInitialized.mockReturnValue(false);

      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        await result.current.processQRCode(validQRData);
      });

      expect(mockAnonIdentityService.initialize).toHaveBeenCalled();
    });

    it('should not initialize anon-identity service if already initialized', async () => {
      mockAnonIdentityService.isInitialized.mockReturnValue(true);

      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        await result.current.processQRCode(validQRData);
      });

      expect(mockAnonIdentityService.initialize).not.toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      mockIdentityContext.addIdentity.mockRejectedValue(new Error('Add error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        await result.current.processQRCode(validQRData);
      });

      expect(result.current.error).toContain('Failed to process QR code');
      expect(consoleSpy).toHaveBeenCalledWith('Error processing QR code:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle missing identity data gracefully', async () => {
      mockQRScannerService.parseQRData.mockReturnValue({});

      const {result} = renderHook(() => useQRScanner());

      await act(async () => {
        await result.current.processQRCode(validQRData);
      });

      expect(mockIdentityContext.addIdentity).toHaveBeenCalledWith({
        name: 'Unknown',
        email: undefined,
        phone: undefined,
        qrData: validQRData,
        isVerified: false,
        additionalData: {},
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockQRScannerService.validateQRData.mockReturnValue({
        isValid: false,
        error: 'Test error',
      });

      const {result} = renderHook(() => useQRScanner());

      // Set an error
      await act(async () => {
        await result.current.processQRCode('invalid');
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});