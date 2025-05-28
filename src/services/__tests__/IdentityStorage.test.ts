import AsyncStorage from '@react-native-async-storage/async-storage';
import {IdentityStorageService} from '../IdentityStorage';
import {Identity} from '../../types/Identity';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('IdentityStorageService', () => {
  let storageService: IdentityStorageService;

  beforeEach(() => {
    storageService = IdentityStorageService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = IdentityStorageService.getInstance();
      const instance2 = IdentityStorageService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('loadIdentities', () => {
    it('should return empty array when no data exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await storageService.loadIdentities();

      expect(result).toEqual([]);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('anon_identities');
    });

    it('should return parsed identities with correct date conversion', async () => {
      const mockData = {
        identities: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            dateAdded: '2024-01-15T00:00:00.000Z',
            qrData: 'test-qr-data',
            isVerified: true,
          },
        ],
        lastUpdated: '2024-01-15T00:00:00.000Z',
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockData));

      const result = await storageService.loadIdentities();

      expect(result).toHaveLength(1);
      expect(result[0].dateAdded).toBeInstanceOf(Date);
      expect(result[0].name).toBe('John Doe');
    });

    it('should return empty array on error', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await storageService.loadIdentities();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading identities:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('saveIdentities', () => {
    it('should save identities to AsyncStorage', async () => {
      const mockIdentities: Identity[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          dateAdded: new Date('2024-01-15'),
          qrData: 'test-qr-data',
          isVerified: true,
        },
      ];

      await storageService.saveIdentities(mockIdentities);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'anon_identities',
        expect.stringContaining('"name":"John Doe"')
      );
    });

    it('should throw error on save failure', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Save error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(storageService.saveIdentities([])).rejects.toThrow('Failed to save identities');
      
      expect(consoleSpy).toHaveBeenCalledWith('Error saving identities:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('addIdentity', () => {
    it('should add new identity with generated ID and date', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const newIdentity = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        qrData: 'test-qr-data',
        isVerified: false,
      };

      const result = await storageService.addIdentity(newIdentity);

      expect(result.id).toBeDefined();
      expect(result.dateAdded).toBeInstanceOf(Date);
      expect(result.name).toBe('Jane Doe');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should add identity to existing list', async () => {
      const existingData = {
        identities: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            dateAdded: '2024-01-15T00:00:00.000Z',
            qrData: 'test-qr-data-1',
            isVerified: true,
          },
        ],
        lastUpdated: '2024-01-15T00:00:00.000Z',
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingData));
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const newIdentity = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        qrData: 'test-qr-data-2',
        isVerified: false,
      };

      const result = await storageService.addIdentity(newIdentity);

      expect(result.name).toBe('Jane Doe');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'anon_identities',
        expect.stringContaining('"name":"Jane Doe"')
      );
    });
  });

  describe('updateIdentity', () => {
    it('should update existing identity', async () => {
      const existingData = {
        identities: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            dateAdded: '2024-01-15T00:00:00.000Z',
            qrData: 'test-qr-data',
            isVerified: false,
          },
        ],
        lastUpdated: '2024-01-15T00:00:00.000Z',
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingData));
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await storageService.updateIdentity('1', {isVerified: true});

      expect(result?.isVerified).toBe(true);
      expect(result?.name).toBe('John Doe');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return null for non-existent identity', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await storageService.updateIdentity('999', {isVerified: true});

      expect(result).toBeNull();
    });
  });

  describe('deleteIdentity', () => {
    it('should delete existing identity', async () => {
      const existingData = {
        identities: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            dateAdded: '2024-01-15T00:00:00.000Z',
            qrData: 'test-qr-data',
            isVerified: true,
          },
          {
            id: '2',
            name: 'Jane Doe',
            email: 'jane@example.com',
            dateAdded: '2024-01-16T00:00:00.000Z',
            qrData: 'test-qr-data-2',
            isVerified: false,
          },
        ],
        lastUpdated: '2024-01-15T00:00:00.000Z',
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingData));
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await storageService.deleteIdentity('1');

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'anon_identities',
        expect.not.stringContaining('"name":"John Doe"')
      );
    });

    it('should return false for non-existent identity', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await storageService.deleteIdentity('999');

      expect(result).toBe(false);
    });
  });

  describe('getIdentityById', () => {
    it('should return identity by ID', async () => {
      const existingData = {
        identities: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            dateAdded: '2024-01-15T00:00:00.000Z',
            qrData: 'test-qr-data',
            isVerified: true,
          },
        ],
        lastUpdated: '2024-01-15T00:00:00.000Z',
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingData));

      const result = await storageService.getIdentityById('1');

      expect(result?.name).toBe('John Doe');
      expect(result?.dateAdded).toBeInstanceOf(Date);
    });

    it('should return null for non-existent identity', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await storageService.getIdentityById('999');

      expect(result).toBeNull();
    });
  });

  describe('clearAllIdentities', () => {
    it('should remove all identities from storage', async () => {
      await storageService.clearAllIdentities();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('anon_identities');
    });

    it('should throw error on clear failure', async () => {
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Clear error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(storageService.clearAllIdentities()).rejects.toThrow('Failed to clear identities');
      
      expect(consoleSpy).toHaveBeenCalledWith('Error clearing identities:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});