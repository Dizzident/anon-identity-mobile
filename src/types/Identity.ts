export interface Identity {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dateAdded: Date;
  qrData: string;
  isVerified: boolean;
  additionalData?: Record<string, any>;
}

export interface IdentityStorage {
  identities: Identity[];
  lastUpdated: Date;
}
