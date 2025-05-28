import {AnonIdentityService} from '../AnonIdentityService';

// The anon-identity library is already mocked via moduleNameMapper in jest.config.js
// We just need to import the types from our mock
import {UserWallet, VerifiableCredential} from 'anon-identity';

const mockWallet = {
  getDID: jest.fn(),
  storeCredential: jest.fn(),
  getAllCredentials: jest.fn(),
  createVerifiablePresentation: jest.fn(),
  createSelectiveDisclosurePresentation: jest.fn(),
};

// Mock the UserWallet static methods
jest.spyOn(UserWallet, 'create').mockResolvedValue(mockWallet as any);
jest.spyOn(UserWallet, 'restore').mockResolvedValue(mockWallet as any);

describe('AnonIdentityService', () => {
  let service: AnonIdentityService;

  beforeEach(() => {
    service = AnonIdentityService.getInstance();
    service.reset(); // Reset state between tests
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = AnonIdentityService.getInstance();
      const instance2 = AnonIdentityService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize with default config', async () => {
      await service.initialize();

      expect(UserWallet.create).toHaveBeenCalled();
      expect(service.isInitialized()).toBe(true);
    });

    it('should initialize with custom passphrase', async () => {
      const config = {
        storageType: 'file' as const,
        walletPassphrase: 'test-passphrase',
      };

      await service.initialize(config);

      expect(UserWallet.restore).toHaveBeenCalledWith('test-passphrase');
      expect(service.isInitialized()).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      await service.initialize();
      await service.initialize();

      expect(UserWallet.create).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      (UserWallet.create as jest.Mock).mockRejectedValueOnce(new Error('Init error'));

      await expect(service.initialize()).rejects.toThrow('Failed to initialize identity service');
      expect(service.isInitialized()).toBe(false);
    });
  });

  describe('wallet operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    describe('getWalletDID', () => {
      it('should return DID when wallet is initialized', async () => {
        mockWallet.getDID.mockReturnValue('did:example:123');

        const did = await service.getWalletDID();
        expect(did).toBe('did:example:123');
      });

      it('should throw error when wallet not initialized', async () => {
        service.reset();
        await expect(service.getWalletDID()).rejects.toThrow('Wallet not initialized');
      });
    });

    describe('storeCredential', () => {
      it('should store credential successfully', async () => {
        const mockCredential = {
          id: 'cred-123',
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiableCredential'],
          issuer: 'did:example:issuer',
          issuanceDate: '2024-01-15T00:00:00Z',
          credentialSubject: {
            id: 'did:example:subject',
            name: 'John Doe',
          },
        } as VerifiableCredential;

        await service.storeCredential(mockCredential);

        expect(mockWallet.storeCredential).toHaveBeenCalledWith(mockCredential);
      });

      it('should handle store errors', async () => {
        const mockCredential = {} as VerifiableCredential;
        mockWallet.storeCredential.mockRejectedValue(new Error('Store error'));

        await expect(service.storeCredential(mockCredential)).rejects.toThrow('Failed to store credential');
      });
    });

    describe('getAllCredentials', () => {
      it('should return all credentials', async () => {
        const mockCredentials = [
          {
            id: 'cred-1',
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            issuanceDate: '2024-01-15T00:00:00Z',
            credentialSubject: {id: 'did:example:john', name: 'John'},
          },
          {
            id: 'cred-2',
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            issuanceDate: '2024-01-15T00:00:00Z',
            credentialSubject: {id: 'did:example:jane', name: 'Jane'},
          },
        ] as VerifiableCredential[];

        mockWallet.getAllCredentials.mockResolvedValue(mockCredentials);

        const credentials = await service.getAllCredentials();
        expect(credentials).toEqual(mockCredentials);
      });

      it('should handle retrieval errors', async () => {
        mockWallet.getAllCredentials.mockRejectedValue(new Error('Retrieval error'));

        await expect(service.getAllCredentials()).rejects.toThrow('Failed to retrieve credentials');
      });
    });

    describe('createPresentation', () => {
      it('should create verifiable presentation', async () => {
        const mockPresentation = {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiablePresentation'],
          verifiableCredential: [],
        };

        mockWallet.createVerifiablePresentation.mockResolvedValue(mockPresentation);

        const presentation = await service.createPresentation(['cred-1', 'cred-2']);

        expect(mockWallet.createVerifiablePresentation).toHaveBeenCalledWith(['cred-1', 'cred-2']);
        expect(presentation).toEqual(mockPresentation);
      });
    });

    describe('createSelectiveDisclosurePresentation', () => {
      it('should create selective disclosure presentation', async () => {
        const disclosureRequests = [
          {credentialId: 'cred-1', attributes: ['name', 'email']},
        ];
        const mockPresentation = {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiablePresentation'],
          verifiableCredential: [],
        };

        mockWallet.createSelectiveDisclosurePresentation.mockResolvedValue(mockPresentation);

        const presentation = await service.createSelectiveDisclosurePresentation(disclosureRequests);

        expect(mockWallet.createSelectiveDisclosurePresentation).toHaveBeenCalledWith(disclosureRequests);
        expect(presentation).toEqual(mockPresentation);
      });
    });
  });

  describe('parseCredentialFromQR', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should parse valid verifiable credential', async () => {
      const validCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2024-01-15T00:00:00Z',
        credentialSubject: {
          id: 'did:example:subject',
          name: 'John Doe',
        },
      };

      const qrData = JSON.stringify(validCredential);
      const result = await service.parseCredentialFromQR(qrData);

      expect(result).toEqual(validCredential);
    });

    it('should parse credential from wrapper object', async () => {
      const validCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2024-01-15T00:00:00Z',
        credentialSubject: {
          id: 'did:example:subject',
          name: 'John Doe',
        },
      };

      const wrappedData = {
        credential: validCredential,
        metadata: {source: 'qr'},
      };

      const qrData = JSON.stringify(wrappedData);
      const result = await service.parseCredentialFromQR(qrData);

      expect(result).toEqual(validCredential);
    });

    it('should return null for invalid credential', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const qrData = JSON.stringify(invalidData);
      const result = await service.parseCredentialFromQR(qrData);

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      const qrData = 'invalid json {';
      const result = await service.parseCredentialFromQR(qrData);

      expect(result).toBeNull();
    });
  });

  describe('extractIdentityFromCredential', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should extract identity data from credential', async () => {
      const credential = {
        id: 'cred-123',
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2024-01-15T00:00:00Z',
        credentialSubject: {
          id: 'did:example:subject',
          givenName: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          dateOfBirth: '1990-01-15',
          address: '123 Main St',
          organization: 'Acme Corp',
        },
      } as VerifiableCredential;

      const result = await service.extractIdentityFromCredential(credential);

      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        dateOfBirth: '1990-01-15',
        address: '123 Main St',
        additionalData: {
          organization: 'Acme Corp',
        },
      });
    });

    it('should handle alternative field names', async () => {
      const credential = {
        id: 'cred-456',
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2024-01-15T00:00:00Z',
        credentialSubject: {
          id: 'did:example:subject',
          name: 'Jane Smith',
          emailAddress: 'jane@example.com',
          phoneNumber: '+0987654321',
          dob: '1985-05-20',
          streetAddress: '456 Oak Ave',
        },
      } as VerifiableCredential;

      const result = await service.extractIdentityFromCredential(credential);

      expect(result).toEqual({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+0987654321',
        dateOfBirth: '1985-05-20',
        address: '456 Oak Ave',
        additionalData: undefined,
      });
    });

    it('should handle extraction errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const invalidCredential = null as any;

      const result = await service.extractIdentityFromCredential(invalidCredential);

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith('Failed to extract identity from credential:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getIdentityData', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return complete identity data', async () => {
      const mockDID = 'did:example:123';
      const mockCredentials = [
        {
          id: 'cred-1',
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiableCredential'],
          issuer: 'did:example:issuer',
          issuanceDate: '2024-01-15T00:00:00Z',
          credentialSubject: {id: 'did:example:john', name: 'John'},
        },
      ] as VerifiableCredential[];

      mockWallet.getDID.mockReturnValue(mockDID);
      mockWallet.getAllCredentials.mockResolvedValue(mockCredentials);

      const result = await service.getIdentityData();

      expect(result).toEqual({
        did: mockDID,
        credentials: mockCredentials,
        presentations: [],
      });
    });

    it('should handle errors', async () => {
      mockWallet.getDID.mockImplementation(() => {
        throw new Error('DID error');
      });

      await expect(service.getIdentityData()).rejects.toThrow('Failed to retrieve identity data');
    });
  });

  describe('isInitialized', () => {
    it('should return false when not initialized', () => {
      expect(service.isInitialized()).toBe(false);
    });

    it('should return true when initialized', async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset service state', async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);

      service.reset();
      expect(service.isInitialized()).toBe(false);
    });
  });
});
