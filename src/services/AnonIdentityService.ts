import {getAnonIdentityModule, VerifiableCredential, VerifiablePresentation} from './anon-identity-wrapper';

export interface AnonIdentityConfig {
  storageType: 'memory' | 'file';
  walletPassphrase?: string;
}

export interface IdentityData {
  did: string;
  credentials: VerifiableCredential[];
  presentations: VerifiablePresentation[];
}

export class AnonIdentityService {
  private static instance: AnonIdentityService;
  private wallet: any | null = null;
  private initialized = false;
  private UserWallet: any = null;

  private constructor() {}

  static getInstance(): AnonIdentityService {
    if (!AnonIdentityService.instance) {
      AnonIdentityService.instance = new AnonIdentityService();
    }
    return AnonIdentityService.instance;
  }

  async initialize(config: AnonIdentityConfig = {storageType: 'memory'}): Promise<void> {
    try {
      if (this.initialized && this.wallet) {
        return;
      }

      // Get the anon-identity module dynamically
      const anonIdentity = await getAnonIdentityModule();
      this.UserWallet = anonIdentity.UserWallet;

      // Create or restore wallet
      if (config.walletPassphrase) {
        this.wallet = await this.UserWallet.restore(config.walletPassphrase);
      } else {
        this.wallet = await this.UserWallet.create();
      }

      this.initialized = true;
      console.log('AnonIdentityService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AnonIdentityService:', error);
      throw new Error('Failed to initialize identity service');
    }
  }

  async getWalletDID(): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }
    return this.wallet.getDID();
  }

  async storeCredential(credential: VerifiableCredential): Promise<void> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }

    try {
      await this.wallet.storeCredential(credential);
      console.log('Credential stored successfully:', credential.id);
    } catch (error) {
      console.error('Failed to store credential:', error);
      throw new Error('Failed to store credential');
    }
  }

  async getAllCredentials(): Promise<VerifiableCredential[]> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }

    try {
      return await this.wallet.getAllCredentials();
    } catch (error) {
      console.error('Failed to get credentials:', error);
      throw new Error('Failed to retrieve credentials');
    }
  }

  async createPresentation(credentialIds: string[]): Promise<VerifiablePresentation> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }

    try {
      return await this.wallet.createVerifiablePresentation(credentialIds);
    } catch (error) {
      console.error('Failed to create presentation:', error);
      throw new Error('Failed to create presentation');
    }
  }

  async createSelectiveDisclosurePresentation(
    disclosureRequests: Array<{
      credentialId: string;
      attributes: string[];
    }>
  ): Promise<VerifiablePresentation> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }

    try {
      return await this.wallet.createSelectiveDisclosurePresentation(disclosureRequests as any);
    } catch (error) {
      console.error('Failed to create selective disclosure presentation:', error);
      throw new Error('Failed to create selective disclosure presentation');
    }
  }

  async parseCredentialFromQR(qrData: string): Promise<VerifiableCredential | null> {
    try {
      // Try to parse QR data as JSON first
      const parsed = JSON.parse(qrData);

      // Check if it's a verifiable credential
      if (this.isVerifiableCredential(parsed)) {
        return parsed as VerifiableCredential;
      }

      // If not a complete credential, try to extract credential data
      if (parsed.credential && this.isVerifiableCredential(parsed.credential)) {
        return parsed.credential as VerifiableCredential;
      }

      return null;
    } catch (error) {
      console.error('Failed to parse credential from QR:', error);
      return null;
    }
  }

  private isVerifiableCredential(obj: any): boolean {
    return (
      obj &&
      typeof obj === 'object' &&
      obj['@context'] &&
      obj.type &&
      Array.isArray(obj.type) &&
      obj.type.includes('VerifiableCredential') &&
      obj.credentialSubject &&
      obj.issuer &&
      obj.issuanceDate
    );
  }

  async extractIdentityFromCredential(credential: VerifiableCredential): Promise<{
    name?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    additionalData?: Record<string, any>;
  }> {
    try {
      const subject = credential.credentialSubject;

      return {
        name: subject.givenName || subject.name || subject.fullName,
        email: subject.email || subject.emailAddress,
        phone: subject.phone || subject.phoneNumber || subject.mobile,
        dateOfBirth: subject.dateOfBirth || subject.dob,
        address: subject.address || subject.streetAddress,
        additionalData: this.extractAdditionalAttributes(subject),
      };
    } catch (error) {
      console.error('Failed to extract identity from credential:', error);
      return {};
    }
  }

  private extractAdditionalAttributes(subject: any): Record<string, any> | undefined {
    const knownFields = [
      'id', 'givenName', 'name', 'fullName', 'email', 'emailAddress',
      'phone', 'phoneNumber', 'mobile', 'dateOfBirth', 'dob',
      'address', 'streetAddress',
    ];

    const additionalData: Record<string, any> = {};

    Object.keys(subject).forEach(key => {
      if (!knownFields.includes(key)) {
        additionalData[key] = subject[key];
      }
    });

    return Object.keys(additionalData).length > 0 ? additionalData : undefined;
  }

  async getIdentityData(): Promise<IdentityData> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }

    try {
      const did = await this.getWalletDID();
      const credentials = await this.getAllCredentials();

      // For now, return empty presentations array
      // In a real implementation, you might want to store presentations separately
      const presentations: VerifiablePresentation[] = [];

      return {
        did,
        credentials,
        presentations,
      };
    } catch (error) {
      console.error('Failed to get identity data:', error);
      throw new Error('Failed to retrieve identity data');
    }
  }

  isInitialized(): boolean {
    return this.initialized && this.wallet !== null;
  }

  reset(): void {
    this.wallet = null;
    this.initialized = false;
  }
}
