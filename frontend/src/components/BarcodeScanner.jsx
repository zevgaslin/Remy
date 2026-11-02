import { useEffect, useRef, useState } from 'react';
import IngredientCamera from './IngredientCamera';
import { isFoodBarcode, lookupBarcode } from '../services/barcodeServices';

export default function BarcodeScanner({ token, onProduct }) {
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef(null);
  const busy = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);

  async function lookup(value) {
    if (busy.current) return;
    const code = value.trim();
    setBarcode(code);
    if (!isFoodBarcode(code)) { setError('Enter an 8, 12, 13, or 14 digit barcode.'); return; }
    busy.current = true;
    setScanning(false);
    setLoading(true);
    setError('');
    const request = new AbortController();
    controller.current = request;
    try {
      const product = await lookupBarcode(token, code, request.signal);
      if (!request.signal.aborted) onProduct(product);
    } catch (err) {
      if (!request.signal.aborted) setError(err.message || 'Product lookup failed. Try again or enter the food manually.');
    } finally {
      busy.current = false;
      if (!request.signal.aborted) setLoading(false);
    }
  }
  return <div className="barcode-scanner">
    {scanning && <IngredientCamera onDetected={lookup} />}
    {!scanning && !loading && <button type="button" onClick={() => { setScanning(true); setError(''); }}>Scan another barcode</button>}
    <form className="auth-form" onSubmit={event => { event.preventDefault(); void lookup(barcode); }}>
      <label>Barcode number
        <input type="text" inputMode="numeric" autoComplete="off" maxLength={14} value={barcode}
          placeholder="Numbers printed below the barcode" disabled={loading} onChange={event => setBarcode(event.target.value)} />
      </label>
      <button type="submit" className="auth-submit" disabled={loading}>{loading ? 'Looking up food…' : 'Look up barcode'}</button>
    </form>
    {loading && <p role="status">Looking up {barcode} in Open Food Facts…</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    <p className="barcode-source">Product data from <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a> (ODbL).
      Only the barcode is sent for lookup; camera images stay on your device. You can also use Manual Entry.</p>
  </div>;
}
