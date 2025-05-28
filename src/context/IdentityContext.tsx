import React, {createContext, useContext, useEffect, useState, useCallback, ReactNode} from 'react';
import {Identity} from '../types/Identity';
import {IdentityStorageService} from '../services/IdentityStorage';

interface IdentityContextType {
  identities: Identity[];
  loading: boolean;
  error: string | null;
  addIdentity: (identity: Omit<Identity, 'id' | 'dateAdded'>) => Promise<Identity>;
  updateIdentity: (id: string, updates: Partial<Identity>) => Promise<Identity | null>;
  deleteIdentity: (id: string) => Promise<boolean>;
  getIdentityById: (id: string) => Identity | undefined;
  refreshIdentities: () => Promise<void>;
  clearError: () => void;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

interface IdentityProviderProps {
  children: ReactNode;
}

export function IdentityProvider({children}: IdentityProviderProps) {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageService = IdentityStorageService.getInstance();

  const loadIdentities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedIdentities = await storageService.loadIdentities();
      setIdentities(loadedIdentities);
    } catch (err) {
      setError('Failed to load identities');
      console.error('Error loading identities:', err);
    } finally {
      setLoading(false);
    }
  }, [storageService]);

  const addIdentity = async (identity: Omit<Identity, 'id' | 'dateAdded'>): Promise<Identity> => {
    try {
      setError(null);
      const newIdentity = await storageService.addIdentity(identity);
      setIdentities(prev => [...prev, newIdentity]);
      return newIdentity;
    } catch (err) {
      const errorMessage = 'Failed to add identity';
      setError(errorMessage);
      console.error('Error adding identity:', err);
      throw new Error(errorMessage);
    }
  };

  const updateIdentity = async (id: string, updates: Partial<Identity>): Promise<Identity | null> => {
    try {
      setError(null);
      const updatedIdentity = await storageService.updateIdentity(id, updates);
      if (updatedIdentity) {
        setIdentities(prev =>
          prev.map(identity => (identity.id === id ? updatedIdentity : identity))
        );
      }
      return updatedIdentity;
    } catch (err) {
      const errorMessage = 'Failed to update identity';
      setError(errorMessage);
      console.error('Error updating identity:', err);
      throw new Error(errorMessage);
    }
  };

  const deleteIdentity = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await storageService.deleteIdentity(id);
      if (success) {
        setIdentities(prev => prev.filter(identity => identity.id !== id));
      }
      return success;
    } catch (err) {
      const errorMessage = 'Failed to delete identity';
      setError(errorMessage);
      console.error('Error deleting identity:', err);
      throw new Error(errorMessage);
    }
  };

  const getIdentityById = (id: string): Identity | undefined => {
    return identities.find(identity => identity.id === id);
  };

  const refreshIdentities = async (): Promise<void> => {
    await loadIdentities();
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    loadIdentities();
  }, [loadIdentities]);

  const value: IdentityContextType = {
    identities,
    loading,
    error,
    addIdentity,
    updateIdentity,
    deleteIdentity,
    getIdentityById,
    refreshIdentities,
    clearError,
  };

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentities(): IdentityContextType {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentities must be used within an IdentityProvider');
  }
  return context;
}
