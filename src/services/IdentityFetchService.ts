import {AnonIdentityService} from './AnonIdentityService';
import {IdentityStorageService} from './IdentityStorage';
import {Identity} from '../types/Identity';

export interface IdentityFetchResult {
  success: boolean;
  identity?: Identity;
  error?: string;
  warnings?: string[];
}

export interface RemoteIdentitySource {
  url: string;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST';
  body?: any;
}

export class IdentityFetchService {
  private static instance: IdentityFetchService;
  private anonIdentityService: AnonIdentityService;
  private storageService: IdentityStorageService;

  private constructor() {
    this.anonIdentityService = AnonIdentityService.getInstance();
    this.storageService = IdentityStorageService.getInstance();
  }

  static getInstance(): IdentityFetchService {
    if (!IdentityFetchService.instance) {
      IdentityFetchService.instance = new IdentityFetchService();
    }
    return IdentityFetchService.instance;
  }

  async fetchAndPopulateIdentity(identityId: string): Promise<IdentityFetchResult> {
    try {
      // Get the existing identity from storage
      const existingIdentity = await this.storageService.getIdentityById(identityId);
      if (!existingIdentity) {
        return {
          success: false,
          error: 'Identity not found in local storage',
        };
      }

      // Initialize anon-identity service if needed
      if (!this.anonIdentityService.isInitialized()) {
        await this.anonIdentityService.initialize();
      }

      // Get all credentials from the anon-identity wallet
      const credentials = await this.anonIdentityService.getAllCredentials();

      // Find credentials related to this identity
      const relatedCredentials = credentials.filter(cred => {
        const subject = cred.credentialSubject;
        return (
          subject.id === existingIdentity.additionalData?.did ||
          subject.email === existingIdentity.email ||
          subject.name === existingIdentity.name ||
          subject.givenName === existingIdentity.name
        );
      });

      if (relatedCredentials.length === 0) {
        return {
          success: true,
          identity: existingIdentity,
          warnings: ['No verifiable credentials found for this identity'],
        };
      }

      // Extract and merge data from all related credentials
      const populatedData = await this.mergeCredentialData(relatedCredentials);

      // Update the identity with populated data
      const updatedIdentity: Identity = {
        ...existingIdentity,
        name: populatedData.name || existingIdentity.name,
        email: populatedData.email || existingIdentity.email,
        phone: populatedData.phone || existingIdentity.phone,
        isVerified: true, // Mark as verified since we have credentials
        additionalData: {
          ...existingIdentity.additionalData,
          ...populatedData.additionalData,
          credentialCount: relatedCredentials.length,
          lastFetched: new Date().toISOString(),
          credentials: relatedCredentials.map(cred => ({
            id: cred.id,
            issuer: cred.issuer,
            issuanceDate: cred.issuanceDate,
            type: cred.type,
          })),
        },
      };

      // Save the updated identity
      await this.storageService.updateIdentity(identityId, updatedIdentity);

      return {
        success: true,
        identity: updatedIdentity,
      };
    } catch (error) {
      console.error('Error fetching and populating identity:', error);
      return {
        success: false,
        error: 'Failed to fetch and populate identity data',
      };
    }
  }

  async fetchFromRemoteSource(source: RemoteIdentitySource): Promise<IdentityFetchResult> {
    try {
      const response = await fetch(source.url, {
        method: source.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...source.headers,
        },
        body: source.body ? JSON.stringify(source.body) : undefined,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      // Try to parse as verifiable credential
      const credential = await this.anonIdentityService.parseCredentialFromQR(
        JSON.stringify(data)
      );

      if (credential) {
        // Store the credential
        await this.anonIdentityService.storeCredential(credential);

        // Extract identity data
        const identityData = await this.anonIdentityService.extractIdentityFromCredential(credential);

        // Create new identity
        const newIdentity: Omit<Identity, 'id' | 'dateAdded'> = {
          name: identityData.name || 'Remote Identity',
          email: identityData.email,
          phone: identityData.phone,
          qrData: JSON.stringify(data),
          isVerified: true,
          additionalData: {
            ...identityData.additionalData,
            source: 'remote',
            sourceUrl: source.url,
            credentialId: credential.id,
            issuer: credential.issuer,
            issuanceDate: credential.issuanceDate,
          },
        };

        // Add to storage
        const savedIdentity = await this.storageService.addIdentity(newIdentity);

        return {
          success: true,
          identity: savedIdentity,
        };
      } else {
        // Try to create identity from plain data
        const newIdentity: Omit<Identity, 'id' | 'dateAdded'> = {
          name: data.name || data.displayName || 'Remote Identity',
          email: data.email || data.emailAddress,
          phone: data.phone || data.phoneNumber,
          qrData: JSON.stringify(data),
          isVerified: false,
          additionalData: {
            source: 'remote',
            sourceUrl: source.url,
            ...this.extractAdditionalData(data),
          },
        };

        const savedIdentity = await this.storageService.addIdentity(newIdentity);

        return {
          success: true,
          identity: savedIdentity,
          warnings: ['Data fetched but no verifiable credential found'],
        };
      }
    } catch (error) {
      console.error('Error fetching from remote source:', error);
      return {
        success: false,
        error: 'Failed to fetch from remote source',
      };
    }
  }

  async refreshAllCredentials(): Promise<{
    updated: number;
    errors: Array<{identityId: string; error: string}>;
  }> {
    const identities = await this.storageService.loadIdentities();
    const results = {
      updated: 0,
      errors: [] as Array<{identityId: string; error: string}>,
    };

    for (const identity of identities) {
      try {
        const result = await this.fetchAndPopulateIdentity(identity.id);
        if (result.success) {
          results.updated++;
        } else {
          results.errors.push({
            identityId: identity.id,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        results.errors.push({
          identityId: identity.id,
          error: 'Failed to refresh identity',
        });
      }
    }

    return results;
  }

  private async mergeCredentialData(credentials: any[]): Promise<{
    name?: string;
    email?: string;
    phone?: string;
    additionalData?: Record<string, any>;
  }> {
    const merged: any = {
      additionalData: {},
    };

    for (const credential of credentials) {
      const extracted = await this.anonIdentityService.extractIdentityFromCredential(credential);

      // Take the first non-empty value for each field
      if (extracted.name && !merged.name) {merged.name = extracted.name;}
      if (extracted.email && !merged.email) {merged.email = extracted.email;}
      if (extracted.phone && !merged.phone) {merged.phone = extracted.phone;}

      // Merge additional data
      if (extracted.additionalData) {
        Object.assign(merged.additionalData, extracted.additionalData);
      }
    }

    return merged;
  }

  private extractAdditionalData(data: any): Record<string, any> {
    const knownFields = ['name', 'displayName', 'email', 'emailAddress', 'phone', 'phoneNumber'];
    const additionalData: Record<string, any> = {};

    Object.keys(data).forEach(key => {
      if (!knownFields.includes(key)) {
        additionalData[key] = data[key];
      }
    });

    return additionalData;
  }

  async createVerifiablePresentation(identityId: string, requestedAttributes?: string[]): Promise<{
    success: boolean;
    presentation?: any;
    error?: string;
  }> {
    try {
      const identity = await this.storageService.getIdentityById(identityId);
      if (!identity) {
        return {
          success: false,
          error: 'Identity not found',
        };
      }

      if (!this.anonIdentityService.isInitialized()) {
        await this.anonIdentityService.initialize();
      }

      // Get all credentials
      const credentials = await this.anonIdentityService.getAllCredentials();

      // Find credentials for this identity
      const identityCredentials = credentials.filter(cred => {
        const subject = cred.credentialSubject;
        return (
          subject.id === identity.additionalData?.did ||
          subject.email === identity.email ||
          subject.name === identity.name
        );
      });

      if (identityCredentials.length === 0) {
        return {
          success: false,
          error: 'No verifiable credentials found for this identity',
        };
      }

      let presentation;

      if (requestedAttributes && requestedAttributes.length > 0) {
        // Create selective disclosure presentation
        const disclosureRequests = identityCredentials.map(cred => ({
          credentialId: cred.id || '',
          attributes: requestedAttributes,
        }));

        presentation = await this.anonIdentityService.createSelectiveDisclosurePresentation(
          disclosureRequests
        );
      } else {
        // Create full presentation
        const credentialIds = identityCredentials.map(cred => cred.id || '');
        presentation = await this.anonIdentityService.createPresentation(credentialIds);
      }

      return {
        success: true,
        presentation,
      };
    } catch (error) {
      console.error('Error creating verifiable presentation:', error);
      return {
        success: false,
        error: 'Failed to create verifiable presentation',
      };
    }
  }
}
