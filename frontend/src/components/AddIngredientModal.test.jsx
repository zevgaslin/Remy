// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AddIngredientModal from './AddIngredientModal';

let getUserMedia;
let stop;
beforeEach(() => {
  stop = vi.fn();
  getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] });
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function open() {
  return render(<AddIngredientModal token="test" onClose={vi.fn()} onAdded={vi.fn()} />);
}
it('requests camera only on Scan, preserves manual inputs, and stops on return', async () => {
  open();
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Milk' } });
  expect(getUserMedia).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('tab', { name: 'Scan Barcode' }));
  await screen.findByText(/Camera is live/);
  expect(getUserMedia).toHaveBeenCalledWith({ video: true, audio: false });
  expect(screen.getByLabelText('Live camera preview').srcObject).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: 'Manual Entry' }));
  expect(stop).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Name')).toHaveValue('Milk');
});
it('stops the stream when the modal unmounts', async () => {
  const view = open();
  fireEvent.click(screen.getByRole('tab', { name: 'Scan Barcode' }));
  await screen.findByText(/Camera is live/);
  view.unmount();
  expect(stop).toHaveBeenCalledTimes(1);
});
it('stops a stream granted after leaving Scan', async () => {
  let resolve;
  getUserMedia.mockReturnValue(new Promise((done) => { resolve = done; }));
  open();
  fireEvent.click(screen.getByRole('tab', { name: 'Scan Barcode' }));
  fireEvent.click(screen.getByRole('tab', { name: 'Manual Entry' }));
  await act(async () => resolve({ getTracks: () => [{ stop }] }));
  expect(stop).toHaveBeenCalledTimes(1);
});
it('explains denied permission and allows retry', async () => {
  getUserMedia.mockRejectedValueOnce(Object.assign(new Error(), { name: 'NotAllowedError' }));
  open();
  fireEvent.click(screen.getByRole('tab', { name: 'Scan Barcode' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Camera access was denied');
  fireEvent.click(screen.getByRole('button', { name: 'Try camera again' }));
  await screen.findByText(/Camera is live/);
  expect(getUserMedia).toHaveBeenCalledTimes(2);
});
