import {QRScannerService} from '../QRScannerService';

describe('QRScannerService', () => {
  let scannerService: QRScannerService;

  beforeEach(() => {
    scannerService = QRScannerService.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = QRScannerService.getInstance();
      const instance2 = QRScannerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('checkPermissions', () => {
    it('should return camera permission status', async () => {
      const permissions = await scannerService.checkPermissions();
      expect(permissions).toHaveProperty('camera');
      expect(typeof permissions.camera).toBe('boolean');
    });
  });

  describe('requestPermissions', () => {
    it('should request camera permissions', async () => {
      const permissions = await scannerService.requestPermissions();
      expect(permissions).toHaveProperty('camera');
      expect(typeof permissions.camera).toBe('boolean');
    });
  });

  describe('validateQRData', () => {
    it('should validate empty data', () => {
      const result = scannerService.validateQRData('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should validate short data', () => {
      const result = scannerService.validateQRData('short');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too short');
    });

    it('should validate valid email format', () => {
      const result = scannerService.validateQRData('john.doe@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate valid identity format', () => {
      const result = scannerService.validateQRData('identity:john.doe@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should validate valid JSON format', () => {
      const jsonData = JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
      });
      const result = scannerService.validateQRData(jsonData);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid data', () => {
      const result = scannerService.validateQRData('random text without valid format');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid identity data');
    });
  });

  describe('parseQRData', () => {
    it('should parse JSON format', () => {
      const jsonData = JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        id: 'user123',
        organization: 'Acme Corp',
      });

      const result = scannerService.parseQRData(jsonData);

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.phone).toBe('+1234567890');
      expect(result.identifier).toBe('user123');
      expect(result.additionalData).toEqual({organization: 'Acme Corp'});
    });

    it('should parse identity format', () => {
      const result = scannerService.parseQRData('identity:john.doe@example.com');
      expect(result.email).toBe('john.doe@example.com');
    });

    it('should parse user format with name and email', () => {
      const result = scannerService.parseQRData('user:John Doe <john.doe@example.com>');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
    });

    it('should parse simple email format', () => {
      const result = scannerService.parseQRData('john.doe@example.com');
      expect(result.email).toBe('john.doe@example.com');
    });

    it('should parse name and email format', () => {
      const result = scannerService.parseQRData('John Doe <john.doe@example.com>');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
    });

    it('should handle alternative JSON field names', () => {
      const jsonData = JSON.stringify({
        displayName: 'Jane Smith',
        emailAddress: 'jane@example.com',
        phoneNumber: '+0987654321',
        userId: 'jane123',
      });

      const result = scannerService.parseQRData(jsonData);

      expect(result.name).toBe('Jane Smith');
      expect(result.email).toBe('jane@example.com');
      expect(result.phone).toBe('+0987654321');
      expect(result.identifier).toBe('jane123');
    });

    it('should return identifier for unrecognized format', () => {
      const result = scannerService.parseQRData('some-random-identifier');
      expect(result.identifier).toBe('some-random-identifier');
    });

    it('should handle invalid JSON gracefully', () => {
      const result = scannerService.parseQRData('invalid json {');
      expect(result.identifier).toBe('invalid json {');
    });
  });

  describe('private method behavior through parseQRData', () => {
    it('should extract additional data correctly', () => {
      const jsonData = JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        department: 'Engineering',
        role: 'Senior Developer',
        startDate: '2020-01-15',
        clearanceLevel: 'Level 3',
      });

      const result = scannerService.parseQRData(jsonData);

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.additionalData).toEqual({
        department: 'Engineering',
        role: 'Senior Developer',
        startDate: '2020-01-15',
        clearanceLevel: 'Level 3',
      });
    });

    it('should not include additional data when all fields are known', () => {
      const jsonData = JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      });

      const result = scannerService.parseQRData(jsonData);

      expect(result.additionalData).toBeUndefined();
    });
  });
});
