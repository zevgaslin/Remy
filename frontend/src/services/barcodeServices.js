import { API_BASE } from './apiBase';

export function isFoodBarcode(value) { return /^(?:[0-9]{8}|[0-9]{12,14})$/.test(value); }

export async function lookupBarcode(token, barcode, signal) {
  if (!isFoodBarcode(barcode)) throw new Error('Enter an 8, 12, 13, or 14 digit barcode.');
  const response = await fetch(`${API_BASE}/products/barcode/${barcode}`, {
    headers: { Authorization: `Bearer ${token}` }, signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not look up this barcode. Try again or enter the food manually.');
  return data;
}

export async function startBarcodeReader(video, onDetected, onCandidate) {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'), import('@zxing/library'),
  ]);
  const hints = new Map([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.ITF]],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150, delayBetweenScanSuccess: 150 });
  let candidate;
  let lastRead = 0;
  let confirmed = false;
  return reader.decodeFromVideoElement(video, result => {
    if (!result || confirmed) return;
    const text = result.getBarcodeFormat() === BarcodeFormat.UPC_E
      ? expandUPCE(result.getText()) : result.getText();
    if (!isFoodBarcode(text)) return;
    const now = Date.now();
    // Two matching reads within 1.5 seconds avoid acting on a single noisy frame.
    if (candidate === text && now - lastRead < 1500) {
      confirmed = true;
      onDetected(text);
    } else {
      candidate = text;
      lastRead = now;
      onCandidate?.();
    }
  });
}

// Expand the compressed UPC-E payload before doing the product lookup.
export function expandUPCE(code) {
  if (!/^[01][0-9]{7}$/.test(code)) return code;
  const [system, a, b, c, d, e, f, check] = code;
  switch (f) {
    case '0': case '1': case '2': return `${system}${a}${b}${f}0000${c}${d}${e}${check}`;
    case '3': return `${system}${a}${b}${c}00000${d}${e}${check}`;
    case '4': return `${system}${a}${b}${c}${d}00000${e}${check}`;
    default: return `${system}${a}${b}${c}${d}${e}0000${f}${check}`;
  }
}
