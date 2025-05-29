import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Camera, useCameraDevice, useCodeScanner} from 'react-native-vision-camera';
import {useTheme} from '../context/ThemeContext';
import {Icon, IconNames} from './Icon';

interface VisionCameraQRScannerProps {
  onRead: (data: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export const VisionCameraQRScanner: React.FC<VisionCameraQRScannerProps> = ({
  onRead,
  onClose,
  isActive,
}) => {
  const {theme} = useTheme();
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && codes[0].value) {
        onRead(codes[0].value);
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <Text style={[styles.message, {color: theme.colors.text}]}>
          Camera permission is required
        </Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <Text style={[styles.message, {color: theme.colors.text}]}>
          No camera device found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFillObject}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
      />
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name={IconNames.close} size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.instruction}>
          Align QR code within the frame
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 50,
  },
  closeButton: {
    padding: 10,
  },
  scanArea: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instruction: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 100,
    paddingHorizontal: 20,
  },
});