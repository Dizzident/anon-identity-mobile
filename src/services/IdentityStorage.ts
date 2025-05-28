import AsyncStorage from '@react-native-async-storage/async-storage';
import {Identity, IdentityStorage} from '../types/Identity';

const STORAGE_KEY = 'anon_identities';

export class IdentityStorageService {
  private static instance: IdentityStorageService;

  private constructor() {}

  static getInstance(): IdentityStorageService {
    if (!IdentityStorageService.instance) {
      IdentityStorageService.instance = new IdentityStorageService();
    }
    return IdentityStorageService.instance;
  }

  async loadIdentities(): Promise<Identity[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }

      const storage: IdentityStorage = JSON.parse(data);
      return storage.identities.map(identity => ({
        ...identity,
        dateAdded: new Date(identity.dateAdded),
      }));
    } catch (error) {
      console.error('Error loading identities:', error);
      return [];
    }
  }

  async saveIdentities(identities: Identity[]): Promise<void> {
    try {
      const storage: IdentityStorage = {
        identities,
        lastUpdated: new Date(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('Error saving identities:', error);
      throw new Error('Failed to save identities');
    }
  }

  async addIdentity(identity: Omit<Identity, 'id' | 'dateAdded'>): Promise<Identity> {
    try {
      const identities = await this.loadIdentities();
      const newIdentity: Identity = {
        ...identity,
        id: this.generateId(),
        dateAdded: new Date(),
      };

      identities.push(newIdentity);
      await this.saveIdentities(identities);
      return newIdentity;
    } catch (error) {
      console.error('Error adding identity:', error);
      throw new Error('Failed to add identity');
    }
  }

  async updateIdentity(id: string, updates: Partial<Identity>): Promise<Identity | null> {
    try {
      const identities = await this.loadIdentities();
      const index = identities.findIndex(identity => identity.id === id);

      if (index === -1) {
        return null;
      }

      identities[index] = {...identities[index], ...updates};
      await this.saveIdentities(identities);
      return identities[index];
    } catch (error) {
      console.error('Error updating identity:', error);
      throw new Error('Failed to update identity');
    }
  }

  async deleteIdentity(id: string): Promise<boolean> {
    try {
      const identities = await this.loadIdentities();
      const filteredIdentities = identities.filter(identity => identity.id !== id);

      if (filteredIdentities.length === identities.length) {
        return false; // Identity not found
      }

      await this.saveIdentities(filteredIdentities);
      return true;
    } catch (error) {
      console.error('Error deleting identity:', error);
      throw new Error('Failed to delete identity');
    }
  }

  async getIdentityById(id: string): Promise<Identity | null> {
    try {
      const identities = await this.loadIdentities();
      return identities.find(identity => identity.id === id) || null;
    } catch (error) {
      console.error('Error getting identity by ID:', error);
      return null;
    }
  }

  async clearAllIdentities(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing identities:', error);
      throw new Error('Failed to clear identities');
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
