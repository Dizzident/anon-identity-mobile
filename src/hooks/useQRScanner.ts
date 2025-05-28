import {useState, useCallback} from 'react';
import {QRScannerService} from '../services/QRScannerService';
import {AnonIdentityService} from '../services/AnonIdentityService';
import {useIdentities} from '../context/IdentityContext';

export interface UseQRScannerResult {
  isScanning: boolean;
  hasPermission: boolean;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  processQRCode: (data: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  clearError: () => void;
}

export function useQRScanner(): UseQRScannerResult {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {addIdentity} = useIdentities();
  const scannerService = QRScannerService.getInstance();
  const anonIdentityService = AnonIdentityService.getInstance();

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const permissions = await scannerService.requestPermissions();
      setHasPermission(permissions.camera);

      if (!permissions.camera) {
        setError('Camera permission is required to scan QR codes');
      }

      return permissions.camera;
    } catch (err) {
      setError('Failed to request camera permissions');
      return false;
    }
  }, [scannerService]);

  const startScanning = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      // Check permissions first
      const permissions = await scannerService.checkPermissions();
      if (!permissions.camera) {
        const granted = await requestPermissions();
        if (!granted) {
          return;
        }
      }

      setHasPermission(true);
      setIsScanning(true);
    } catch (err) {
      setError('Failed to start scanning');
      setIsScanning(false);
    }
  }, [scannerService, requestPermissions]);

  const stopScanning = useCallback((): void => {
    setIsScanning(false);
  }, []);

  const processQRCode = useCallback(async (data: string): Promise<void> => {
    try {
      setError(null);

      // Validate QR data
      const validation = scannerService.validateQRData(data);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid QR code');
        return;
      }

      // Initialize anon-identity service if not already done
      if (!anonIdentityService.isInitialized()) {
        await anonIdentityService.initialize();
      }

      // Try to parse as verifiable credential first
      const credential = await anonIdentityService.parseCredentialFromQR(data);

      let identityData: any;
      let isVerified = false;

      if (credential) {
        // Store the credential in the anon-identity wallet
        await anonIdentityService.storeCredential(credential);

        // Extract identity data from credential
        identityData = await anonIdentityService.extractIdentityFromCredential(credential);
        isVerified = true; // Verifiable credentials are considered verified

        console.log('Processed verifiable credential:', credential.id);
      } else {
        // Fall back to basic QR parsing
        identityData = scannerService.parseQRData(data);
        isVerified = false;
      }

      // Create identity object for local storage
      const newIdentity = {
        name: identityData.name || identityData.email || identityData.identifier || 'Unknown',
        email: identityData.email,
        phone: identityData.phone,
        qrData: data,
        isVerified,
        additionalData: {
          ...identityData.additionalData,
          ...(credential && {
            credentialId: credential.id,
            issuer: credential.issuer,
            issuanceDate: credential.issuanceDate,
            did: await anonIdentityService.getWalletDID(),
          }),
        },
      };

      // Add to local storage
      await addIdentity(newIdentity);

      // Stop scanning after successful addition
      stopScanning();
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError('Failed to process QR code. Please try again.');
    }
  }, [scannerService, anonIdentityService, addIdentity, stopScanning]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    isScanning,
    hasPermission,
    error,
    startScanning,
    stopScanning,
    processQRCode,
    requestPermissions,
    clearError,
  };
}
