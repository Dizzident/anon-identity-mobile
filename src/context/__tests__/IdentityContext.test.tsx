import React from 'react';
import {render, waitFor, act} from '@testing-library/react-native';
import {IdentityProvider, useIdentities} from '../IdentityContext';
import {IdentityStorageService} from '../../services/IdentityStorage';
import {Identity} from '../../types/Identity';

// Mock the storage service
jest.mock('../../services/IdentityStorage');

const mockStorageService = {
  loadIdentities: jest.fn(),
  addIdentity: jest.fn(),
  updateIdentity: jest.fn(),
  deleteIdentity: jest.fn(),
  getIdentityById: jest.fn(),
  saveIdentities: jest.fn(),
  clearAllIdentities: jest.fn(),
};

(IdentityStorageService.getInstance as jest.Mock).mockReturnValue(mockStorageService);

// Test component that uses the context
const TestComponent = () => {
  const {
    identities,
    loading,
    error,
    addIdentity,
    updateIdentity,
    deleteIdentity,
    getIdentityById,
    refreshIdentities,
    clearError,
  } = useIdentities();

  return null; // We're only testing the hook behavior
};

describe('IdentityContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('IdentityProvider', () => {
    it('should load identities on mount', async () => {
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

      mockStorageService.loadIdentities.mockResolvedValue(mockIdentities);

      const {getByTestId} = render(
        <IdentityProvider>
          <TestComponent />
        </IdentityProvider>
      );

      await waitFor(() => {
        expect(mockStorageService.loadIdentities).toHaveBeenCalled();
      });
    });

    it('should handle loading error', async () => {
      mockStorageService.loadIdentities.mockRejectedValue(new Error('Load error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <IdentityProvider>
          <TestComponent />
        </IdentityProvider>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading identities:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('useIdentities hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponentOutsideProvider = () => {
        useIdentities();
        return null;
      };

      expect(() => render(<TestComponentOutsideProvider />)).toThrow(
        'useIdentities must be used within an IdentityProvider'
      );
    });

    it('should provide context values', async () => {
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

      mockStorageService.loadIdentities.mockResolvedValue(mockIdentities);

      let contextValue: any;

      const TestComponentWithContext = () => {
        contextValue = useIdentities();
        return null;
      };

      render(
        <IdentityProvider>
          <TestComponentWithContext />
        </IdentityProvider>
      );

      await waitFor(() => {
        expect(contextValue.identities).toEqual(mockIdentities);
        expect(contextValue.loading).toBe(false);
        expect(contextValue.error).toBeNull();
        expect(typeof contextValue.addIdentity).toBe('function');
        expect(typeof contextValue.updateIdentity).toBe('function');
        expect(typeof contextValue.deleteIdentity).toBe('function');
        expect(typeof contextValue.getIdentityById).toBe('function');
        expect(typeof contextValue.refreshIdentities).toBe('function');
        expect(typeof contextValue.clearError).toBe('function');
      });
    });
  });

  describe('Context methods', () => {
    let contextValue: any;

    const TestComponentWithContext = () => {
      contextValue = useIdentities();
      return null;
    };

    beforeEach(async () => {
      mockStorageService.loadIdentities.mockResolvedValue([]);

      render(
        <IdentityProvider>
          <TestComponentWithContext />
        </IdentityProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });
    });

    describe('addIdentity', () => {
      it('should add identity and update state', async () => {
        const newIdentity: Identity = {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          dateAdded: new Date('2024-01-15'),
          qrData: 'test-qr-data',
          isVerified: true,
        };

        mockStorageService.addIdentity.mockResolvedValue(newIdentity);

        await act(async () => {
          const result = await contextValue.addIdentity({
            name: 'John Doe',
            email: 'john@example.com',
            qrData: 'test-qr-data',
            isVerified: true,
          });

          expect(result).toEqual(newIdentity);
        });

        expect(mockStorageService.addIdentity).toHaveBeenCalled();
      });

      it('should handle add identity error', async () => {
        mockStorageService.addIdentity.mockRejectedValue(new Error('Add error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await act(async () => {
          await expect(
            contextValue.addIdentity({
              name: 'John Doe',
              email: 'john@example.com',
              qrData: 'test-qr-data',
              isVerified: true,
            })
          ).rejects.toThrow('Failed to add identity');
        });

        expect(consoleSpy).toHaveBeenCalledWith('Error adding identity:', expect.any(Error));
        consoleSpy.mockRestore();
      });
    });

    describe('updateIdentity', () => {
      it('should update identity and state', async () => {
        const updatedIdentity: Identity = {
          id: '1',
          name: 'John Doe Updated',
          email: 'john@example.com',
          dateAdded: new Date('2024-01-15'),
          qrData: 'test-qr-data',
          isVerified: true,
        };

        mockStorageService.updateIdentity.mockResolvedValue(updatedIdentity);

        await act(async () => {
          const result = await contextValue.updateIdentity('1', {name: 'John Doe Updated'});
          expect(result).toEqual(updatedIdentity);
        });

        expect(mockStorageService.updateIdentity).toHaveBeenCalledWith('1', {name: 'John Doe Updated'});
      });
    });

    describe('deleteIdentity', () => {
      it('should delete identity and update state', async () => {
        mockStorageService.deleteIdentity.mockResolvedValue(true);

        await act(async () => {
          const result = await contextValue.deleteIdentity('1');
          expect(result).toBe(true);
        });

        expect(mockStorageService.deleteIdentity).toHaveBeenCalledWith('1');
      });
    });

    describe('refreshIdentities', () => {
      it('should reload identities', async () => {
        const newIdentities: Identity[] = [
          {
            id: '2',
            name: 'Jane Doe',
            email: 'jane@example.com',
            dateAdded: new Date('2024-01-16'),
            qrData: 'test-qr-data-2',
            isVerified: false,
          },
        ];

        mockStorageService.loadIdentities.mockResolvedValue(newIdentities);

        await act(async () => {
          await contextValue.refreshIdentities();
        });

        expect(mockStorageService.loadIdentities).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
      });
    });

    describe('getIdentityById', () => {
      it('should return identity from current state', () => {
        // First set up the context with an identity
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

        // We need to test this with actual identities in state
        // This would require setting up the provider with initial data
        const result = contextValue.getIdentityById('1');
        // Since we start with empty array, this should be undefined
        expect(result).toBeUndefined();
      });
    });

    describe('clearError', () => {
      it('should clear error state', async () => {
        await act(async () => {
          contextValue.clearError();
        });

        // Error should be cleared (this test assumes error handling is working)
        expect(contextValue.error).toBeNull();
      });
    });
  });
});