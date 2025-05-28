// Mock implementation of anon-identity library for testing

export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  id?: string;
  issuer: string;
  issuanceDate: string;
  credentialSubject: Record<string, any>;
  proof?: any;
}

export interface VerifiablePresentation {
  '@context': string[];
  type: string[];
  verifiableCredential: VerifiableCredential[];
  holder?: string;
  proof?: any;
}

export interface UserAttributes {
  givenName?: string;
  familyName?: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  [key: string]: any;
}

export class UserWallet {
  private did: string = 'did:test:123';
  private credentials: VerifiableCredential[] = [];

  static async create(): Promise<UserWallet> {
    return new UserWallet();
  }

  static async restore(passphrase: string, identifier?: string): Promise<UserWallet> {
    return new UserWallet();
  }

  getDID(): string {
    return this.did;
  }

  async storeCredential(credential: VerifiableCredential): Promise<void> {
    this.credentials.push(credential);
  }

  async getAllCredentials(): Promise<VerifiableCredential[]> {
    return [...this.credentials];
  }

  async createVerifiablePresentation(credentialIds: string[]): Promise<VerifiablePresentation> {
    const filteredCredentials = this.credentials.filter(cred => 
      credentialIds.includes(cred.id || '')
    );

    return {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      verifiableCredential: filteredCredentials,
      holder: this.did,
    };
  }

  async createSelectiveDisclosurePresentation(
    disclosureRequests: Array<{
      credentialId: string;
      attributes: string[];
    }>
  ): Promise<VerifiablePresentation> {
    return {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      verifiableCredential: [],
      holder: this.did,
    };
  }
}

export class IdentityProvider {
  private did: string = 'did:test:provider';

  static async create(): Promise<IdentityProvider> {
    return new IdentityProvider();
  }

  getDID(): string {
    return this.did;
  }

  async issueVerifiableCredential(
    userDID: string,
    attributes: UserAttributes
  ): Promise<VerifiableCredential> {
    return {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      id: `credential-${Date.now()}`,
      issuer: this.did,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: userDID,
        ...attributes,
      },
    };
  }

  async revokeCredential(credentialId: string): Promise<void> {
    // Mock implementation
  }
}

export class ServiceProvider {
  private name: string;
  private trustedIssuers: string[];

  constructor(name: string, trustedIssuers: string[] = []) {
    this.name = name;
    this.trustedIssuers = trustedIssuers;
  }

  async verifyPresentation(presentation: VerifiablePresentation): Promise<{
    verified: boolean;
    errors?: string[];
  }> {
    return {
      verified: true,
    };
  }

  addTrustedIssuer(issuerDID: string): void {
    if (!this.trustedIssuers.includes(issuerDID)) {
      this.trustedIssuers.push(issuerDID);
    }
  }
}