import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import {useQRScanner} from '../hooks/useQRScanner';
import {useNavigation} from '@react-navigation/native';
import {useScreenTracking, usePerformance} from '../hooks/usePerformance';

function QRScannerScreen() {
  const navigation = useNavigation();
  const {
    isScanning,
    hasPermission,
    error,
    startScanning,
    stopScanning,
    processQRCode,
    requestPermissions,
    clearError,
  } = useQRScanner();

  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Track screen views and performance
  useScreenTracking('QRScanner');
  const {trackEvent} = usePerformance();

  useEffect(() => {
    // Check permissions when component mounts
    const checkInitialPermissions = async () => {
      await requestPermissions();
    };
    checkInitialPermissions();
  }, [requestPermissions]);

  useEffect(() => {
    // Show error alerts
    if (error) {
      Alert.alert('Error', error, [
        {
          text: 'OK',
          onPress: clearError,
        },
      ]);
    }
  }, [error, clearError]);

  const handleQRCodeRead = async (e: any) => {
    if (isProcessing) {return;}

    setIsProcessing(true);
    trackEvent('qr_scan_attempted', {method: 'camera', data_length: e.data.length});

    try {
      await processQRCode(e.data);
      trackEvent('qr_scan_success', {method: 'camera'});
      // Navigate back to identity list after successful scan
      navigation.goBack();
    } catch (err) {
      console.error('QR processing error:', err);
      trackEvent('qr_scan_error', {method: 'camera', error: String(err)});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      Alert.alert('Error', 'Please enter QR code data');
      return;
    }

    setIsProcessing(true);
    trackEvent('qr_scan_attempted', {method: 'manual', data_length: manualInput.trim().length});

    try {
      await processQRCode(manualInput.trim());
      trackEvent('qr_scan_success', {method: 'manual'});
      setShowManualInput(false);
      setManualInput('');
      navigation.goBack();
    } catch (err) {
      console.error('Manual input processing error:', err);
      trackEvent('qr_scan_error', {method: 'manual', error: String(err)});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartScanning = async () => {
    await startScanning();
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            This app needs camera access to scan QR codes containing identity information.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setShowManualInput(true)}>
            <Text style={styles.manualButtonText}>Enter QR Data Manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isScanning) {
    return (
      <SafeAreaView style={styles.container}>
        <QRCodeScanner
          onRead={handleQRCodeRead}
          showMarker={true}
          markerStyle={styles.marker}
          cameraStyle={styles.camera}
          topContent={
            <View style={styles.topContent}>
              <Text style={styles.scanTitle}>Scan QR Code</Text>
              <Text style={styles.scanInstructions}>
                Point your camera at a QR code to add an identity
              </Text>
              {isProcessing && (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              )}
            </View>
          }
          bottomContent={
            <View style={styles.bottomContent}>
              <TouchableOpacity style={styles.stopButton} onPress={stopScanning}>
                <Text style={styles.stopButtonText}>Stop Scanning</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manualButton}
                onPress={() => {
                  stopScanning();
                  setShowManualInput(true);
                }}>
                <Text style={styles.manualButtonText}>Enter Manually</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.scanArea}>
          <Text style={styles.placeholderText}>Ready to Scan</Text>
          <Text style={styles.instructionText}>
            Tap the button below to start scanning QR codes
          </Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>How to scan:</Text>
          <Text style={styles.instructionStep}>
            1. Tap "Start Scanning" below
          </Text>
          <Text style={styles.instructionStep}>
            2. Point your camera at a QR code
          </Text>
          <Text style={styles.instructionStep}>
            3. The app will automatically detect and process the code
          </Text>
          <Text style={styles.instructionStep}>
            4. Your new identity will be added to the list
          </Text>
        </View>

        <TouchableOpacity style={styles.scanButton} onPress={handleStartScanning}>
          <Text style={styles.scanButtonText}>Start Scanning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowManualInput(true)}>
          <Text style={styles.manualButtonText}>Enter QR Data Manually</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enter QR Code Data</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowManualInput(false);
                setManualInput('');
              }}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>
              Paste or type the QR code data:
            </Text>
            <TextInput
              style={styles.textInput}
              value={manualInput}
              onChangeText={setManualInput}
              placeholder="Enter QR code data here..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                !manualInput.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleManualSubmit}
              disabled={!manualInput.trim() || isProcessing}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Process QR Data</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scanArea: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  instructions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 8,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  manualButton: {
    backgroundColor: '#6C757D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  // Scanner styles
  camera: {
    flex: 1,
  },
  marker: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  topContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  scanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  scanInstructions: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  processingText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  bottomContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 24,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default QRScannerScreen;
