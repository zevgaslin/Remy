import { afterEach, expect, it, vi } from 'vitest';
import { expandUPCE, isFoodBarcode, lookupBarcode } from './barcodeServices';
afterEach(() => vi.unstubAllGlobals());
it('validates product barcode lengths without dropping leading zeroes', () => {
  expect(isFoodBarcode('012345678905')).toBe(true);
  expect(isFoodBarcode('123')).toBe(false);
  expect(isFoodBarcode('https://example.com')).toBe(false);
  expect(expandUPCE('01234565')).toBe('012345000065');
});
it('preserves the barcode and request cancellation when calling the backend', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ name: 'Food' }) });
  vi.stubGlobal('fetch', fetch);
  const signal = new AbortController().signal;
  await lookupBarcode('abc', '012345678905', signal);
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/products/barcode/012345678905'), { headers: { Authorization: 'Bearer abc' }, signal });
});
it('rejects invalid codes before networking and exposes lookup errors', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Unknown barcode' }) });
  vi.stubGlobal('fetch', fetch);
  await expect(lookupBarcode('abc', '123')).rejects.toThrow('8, 12, 13, or 14');
  expect(fetch).not.toHaveBeenCalled();
  await expect(lookupBarcode('abc', '012345678905')).rejects.toThrow('Unknown barcode');
});
