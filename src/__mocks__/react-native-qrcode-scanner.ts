import React from 'react';

// Mock QRCodeScanner component
const QRCodeScanner = React.forwardRef((props: any, _ref: any) => {
  return React.createElement('QRCodeScanner', {
    ...props,
    testID: 'qr-code-scanner',
  });
});

QRCodeScanner.displayName = 'QRCodeScanner';

export default QRCodeScanner;
