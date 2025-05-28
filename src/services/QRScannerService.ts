export interface QRScanResult {
  data: string;
  type: string;
}

export interface QRScannerPermissions {
  camera: boolean;
}

export class QRScannerService {
  private static instance: QRScannerService;

  private constructor() {}

  static getInstance(): QRScannerService {
    if (!QRScannerService.instance) {
      QRScannerService.instance = new QRScannerService();
    }
    return QRScannerService.instance;
  }

  async checkPermissions(): Promise<QRScannerPermissions> {
    // For now, we'll assume permissions are granted
    // In a real implementation, this would check actual camera permissions
    return {
      camera: true,
    };
  }

  async requestPermissions(): Promise<QRScannerPermissions> {
    // For now, we'll simulate permission request
    // In a real implementation, this would request actual camera permissions
    return {
      camera: true,
    };
  }

  validateQRData(data: string): {isValid: boolean; error?: string} {
    if (!data || data.trim().length === 0) {
      return {
        isValid: false,
        error: 'QR code data is empty',
      };
    }

    if (data.length < 10) {
      return {
        isValid: false,
        error: 'QR code data appears to be too short',
      };
    }

    // Add more validation rules as needed
    // For example, check if it matches expected format for anon-identity
    if (!this.isValidAnonIdentityQR(data)) {
      return {
        isValid: false,
        error: 'QR code does not contain valid identity data',
      };
    }

    return {isValid: true};
  }

  private isValidAnonIdentityQR(data: string): boolean {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(data);

      // Check if it has required fields for an identity
      if (typeof parsed === 'object' && parsed !== null) {
        // Must have at least a name or identifier
        return !!(parsed.name || parsed.id || parsed.identifier);
      }

      // If not JSON, check if it's a simple string format
      // For example: "identity:john.doe@example.com" or similar
      if (typeof data === 'string') {
        return data.includes('@') || data.includes('identity:') || data.includes('user:');
      }

      return false;
    } catch {
      // If JSON parsing fails, check for other formats
      if (typeof data === 'string') {
        return data.includes('@') || data.includes('identity:') || data.includes('user:');
      }
      return false;
    }
  }

  parseQRData(data: string): {
    name?: string;
    email?: string;
    phone?: string;
    identifier?: string;
    additionalData?: Record<string, any>;
  } {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(data);

      if (typeof parsed === 'object' && parsed !== null) {
        return {
          name: parsed.name || parsed.displayName || parsed.fullName,
          email: parsed.email || parsed.emailAddress,
          phone: parsed.phone || parsed.phoneNumber || parsed.mobile,
          identifier: parsed.id || parsed.identifier || parsed.userId,
          additionalData: this.extractAdditionalData(parsed),
        };
      }
    } catch {
      // If JSON parsing fails, try to extract from string format
      return this.parseStringFormat(data);
    }

    return {};
  }

  private extractAdditionalData(parsed: any): Record<string, any> | undefined {
    const knownFields = ['name', 'displayName', 'fullName', 'email', 'emailAddress', 'phone', 'phoneNumber', 'mobile', 'id', 'identifier', 'userId'];
    const additionalData: Record<string, any> = {};

    Object.keys(parsed).forEach(key => {
      if (!knownFields.includes(key)) {
        additionalData[key] = parsed[key];
      }
    });

    return Object.keys(additionalData).length > 0 ? additionalData : undefined;
  }

  private parseStringFormat(data: string): {
    name?: string;
    email?: string;
    phone?: string;
    identifier?: string;
  } {
    // Handle formats like:
    // "identity:john.doe@example.com"
    // "user:John Doe <john.doe@example.com>"
    // "john.doe@example.com"

    if (data.includes('identity:')) {
      const identityData = data.replace('identity:', '');
      return this.parseEmailFormat(identityData);
    }

    if (data.includes('user:')) {
      const userData = data.replace('user:', '');
      return this.parseUserFormat(userData);
    }

    // Simple email format
    if (data.includes('@')) {
      return this.parseEmailFormat(data);
    }

    return {
      identifier: data,
    };
  }

  private parseEmailFormat(data: string): {name?: string; email?: string} {
    if (data.includes('<') && data.includes('>')) {
      // Format: "John Doe <john.doe@example.com>"
      const nameMatch = data.match(/^([^<]+)</);
      const emailMatch = data.match(/<([^>]+)>/);

      return {
        name: nameMatch ? nameMatch[1].trim() : undefined,
        email: emailMatch ? emailMatch[1].trim() : undefined,
      };
    }

    // Simple email
    return {
      email: data.trim(),
    };
  }

  private parseUserFormat(data: string): {name?: string; email?: string} {
    return this.parseEmailFormat(data);
  }
}
