import { afterEach, expect, it, vi } from 'vitest';
import { BarcodeFormat } from '@zxing/library';
import { startBarcodeReader } from './barcodeServices';
const mock = vi.hoisted(() => ({ callback: null, stop: vi.fn() }));
vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    async decodeFromVideoElement(video, callback) { mock.callback = callback; return { stop: mock.stop }; }
  },
}));
afterEach(() => vi.restoreAllMocks());
function read(text) { mock.callback({ getText: () => text, getBarcodeFormat: () => BarcodeFormat.EAN_13 }); }
it('automatically confirms two matching reads and emits only one lookup', async () => {
  const detected = vi.fn(); const candidate = vi.fn();
  await startBarcodeReader({}, detected, candidate);
  read('3017620422003');
  expect(candidate).toHaveBeenCalledOnce();
  expect(detected).not.toHaveBeenCalled();
  read('3017620422003');
  read('3017620422003');
  expect(detected).toHaveBeenCalledExactlyOnceWith('3017620422003');
});
it('ignores unreadable frames and does not confirm changing or stale reads', async () => {
  const detected = vi.fn();
  let now = 1000; vi.spyOn(Date, 'now').mockImplementation(() => now);
  await startBarcodeReader({}, detected);
  mock.callback(null);
  read('123');
  read('3017620422003');
  read('012345678905');
  now += 2000;
  read('012345678905');
  expect(detected).not.toHaveBeenCalled();
  now += 150;
  read('012345678905');
  expect(detected).toHaveBeenCalledExactlyOnceWith('012345678905');
});
