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
import {useTheme} from '../context/ThemeContext';
import {Icon, IconNames} from '../components/Icon';

function QRScannerScreen() {
  const navigation = useNavigation();
  const {theme} = useTheme();
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
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.permissionContainer}>
          <Icon name={IconNames.camera} size={64} color={theme.colors.primary} style={{marginBottom: 16}} />
          <Text style={[styles.permissionTitle, {color: theme.colors.text}]}>Camera Permission Required</Text>
          <Text style={[styles.permissionText, {color: theme.colors.textSecondary}]}>
            This app needs camera access to scan QR codes containing identity information.
          </Text>
          <TouchableOpacity style={[styles.permissionButton, {backgroundColor: theme.colors.primary}]} onPress={requestPermissions}>
            <Icon name={IconNames.camera} size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.manualButton, {backgroundColor: theme.colors.card}]}
            onPress={() => setShowManualInput(true)}>
            <Icon name={IconNames.edit} size={20} color={theme.colors.primary} style={{marginRight: 8}} />
            <Text style={[styles.manualButtonText, {color: theme.colors.primary}]}>Enter QR Data Manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isScanning) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <QRCodeScanner
          onRead={handleQRCodeRead}
          showMarker={true}
          markerStyle={[styles.marker, {borderColor: theme.colors.primary}]}
          cameraStyle={styles.camera}
          topContent={
            <View style={styles.topContent}>
              <Text style={[styles.scanTitle, {color: theme.colors.text}]}>Scan QR Code</Text>
              <Text style={[styles.scanInstructions, {color: theme.colors.text}]}>
                Point your camera at a QR code to add an identity
              </Text>
              {isProcessing && (
                <View style={[styles.processingContainer, {backgroundColor: 'rgba(0,0,0,0.7)'}]}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={[styles.processingText, {color: theme.colors.text}]}>Processing...</Text>
                </View>
              )}
            </View>
          }
          bottomContent={
            <View style={styles.bottomContent}>
              <TouchableOpacity style={[styles.stopButton, {backgroundColor: theme.colors.error}]} onPress={stopScanning}>
                <Icon name={IconNames.close} size={20} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.stopButtonText}>Stop Scanning</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manualButton, {backgroundColor: theme.colors.card}]}
                onPress={() => {
                  stopScanning();
                  setShowManualInput(true);
                }}>
                <Icon name={IconNames.edit} size={20} color={theme.colors.primary} style={{marginRight: 8}} />
                <Text style={[styles.manualButtonText, {color: theme.colors.primary}]}>Enter Manually</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={styles.content}>
        <View style={[styles.scanArea, {backgroundColor: theme.colors.card, borderColor: theme.colors.primary}]}>
          <Icon name={IconNames.qrcode} size={48} color={theme.colors.primary} style={{marginBottom: 16}} />
          <Text style={[styles.placeholderText, {color: theme.colors.text}]}>Ready to Scan</Text>
          <Text style={[styles.instructionText, {color: theme.colors.textSecondary}]}>
            Tap the button below to start scanning QR codes
          </Text>
        </View>

        <View style={[styles.instructions, {backgroundColor: theme.colors.card}]}>
          <Text style={[styles.instructionTitle, {color: theme.colors.text}]}>How to scan:</Text>
          <Text style={[styles.instructionStep, {color: theme.colors.textSecondary}]}>
            1. Tap "Start Scanning" below
          </Text>
          <Text style={[styles.instructionStep, {color: theme.colors.textSecondary}]}>
            2. Point your camera at a QR code
          </Text>
          <Text style={[styles.instructionStep, {color: theme.colors.textSecondary}]}>
            3. The app will automatically detect and process the code
          </Text>
          <Text style={[styles.instructionStep, {color: theme.colors.textSecondary}]}>
            4. Your new identity will be added to the list
          </Text>
        </View>

        <TouchableOpacity style={[styles.scanButton, {backgroundColor: theme.colors.primary}]} onPress={handleStartScanning}>
          <Icon name={IconNames.camera} size={20} color="#fff" style={{marginRight: 8}} />
          <Text style={styles.scanButtonText}>Start Scanning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.manualButton, {backgroundColor: theme.colors.card}]}
          onPress={() => setShowManualInput(true)}>
          <Icon name={IconNames.edit} size={20} color={theme.colors.primary} style={{marginRight: 8}} />
          <Text style={[styles.manualButtonText, {color: theme.colors.primary}]}>Enter QR Data Manually</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, {backgroundColor: theme.colors.background}]}>
          <View style={[styles.modalHeader, {backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border}]}>
            <Text style={[styles.modalTitle, {color: theme.colors.text}]}>Enter QR Code Data</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowManualInput(false);
                setManualInput('');
              }}>
              <Icon name={IconNames.close} size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.inputLabel, {color: theme.colors.text}]}>
              Paste or type the QR code data:
            </Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              value={manualInput}
              onChangeText={setManualInput}
              placeholder="Enter QR code data here..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                {backgroundColor: theme.colors.primary},
                !manualInput.trim() && {backgroundColor: theme.colors.border},
              ]}
              onPress={handleManualSubmit}
              disabled={!manualInput.trim() || isProcessing}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name={IconNames.check} size={20} color="#fff" style={{marginRight: 8}} />
                  <Text style={styles.submitButtonText}>Process QR Data</Text>
                </>
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scanArea: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  instructions: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 8,
  },
  scanButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  manualButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 8,
  },
  scanInstructions: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  processingText: {
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
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  textInput: {
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 24,
    minHeight: 120,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default QRScannerScreen;
