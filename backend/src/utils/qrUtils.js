
import QRCode from 'qrcode';

const generateQRCode = async (data) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#1a1a2e',
        light: '#FFFFFF',
      },
      width: 300,
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

const generateQRCodeSVG = async (data) => {
  try {
    const svgString = await QRCode.toString(data, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 1,
    });
    return svgString;
  } catch (error) {
    console.error('QR SVG generation error:', error);
    throw new Error('Failed to generate QR code SVG');
  }
};

export { generateQRCode, generateQRCodeSVG };
