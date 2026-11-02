import { startBarcodeReader } from '../services/barcodeServices';
import { useEffect, useRef, useState } from 'react';

export default function IngredientCamera({ onDetected }) {
  const videoRef = useRef(null);
  const detectedRef = useRef(onDetected);
  useEffect(() => { detectedRef.current = onDetected; }, [onDetected]);
  const [status, setStatus] = useState('Requesting camera access…');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let stream;
    let controls;
    let detected = false;
    let stopped = false;
    function stop() {
      if (stopped) return;
      stopped = true;
      controls?.stop();
      stream?.getTracks().forEach(track => track.stop());
    }

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access requires a supported browser and HTTPS (or localhost).');
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (cancelled) { stop(); return; }
        setStatus('Camera is live. Starting automatic scanner…');
        controls = await startBarcodeReader(videoRef.current, barcode => {
          if (cancelled || detected) return;
          detected = true;
          stop();
          setStatus('Barcode read. Looking up your food…');
          detectedRef.current?.(barcode);
        }, () => {
          if (!cancelled && !detected) setStatus('Barcode spotted. Hold steady to confirm…');
        });
        if (cancelled || detected) controls.stop();
        else setStatus('Camera is live. Center the barcode in the green box. It scans automatically.');
      } catch (err) {
        stop();
        if (cancelled) return;
        setStatus('');
        const messages = {
          NotAllowedError: 'Camera access was denied. Allow camera access in your browser’s site settings, then try again.',
          NotFoundError: 'No camera was found. Connect a camera, then try again.',
          NotReadableError: 'Your camera could not be opened. Close other apps using it, then try again.',
        };
        setError(messages[err.name] || err.message || 'Could not start the camera. Please try again.');
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      stop();
    };
  }, [attempt]);

  return (
    <div className="ingredient-camera">
      <p>Fit the entire barcode inside the green box, with the bars upright. Hold still in good light—no photo button needed.</p>
      <div className="barcode-viewfinder">
        <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview" aria-describedby="barcode-camera-help" />
        {!error && <div className="barcode-guide" role="img" aria-label="Green barcode alignment box">
          <span className="barcode-guide-label">PLACE BARCODE HERE</span>
          <span className="barcode-guide-line" aria-hidden="true" />
        </div>}
      </div>
      <p id="barcode-camera-help" className="barcode-camera-help">Keep the barcode flat and avoid glare. If it stays blurry, move slightly farther away, then slowly closer.</p>
      {status && <p role="status">{status}</p>}
      {error && <>
        <p className="auth-error" role="alert">{error}</p>
        <button type="button" className="auth-submit" onClick={() => { setError(''); setStatus('Requesting camera access…'); setAttempt((value) => value + 1); }}>Try camera again</button>
      </>}
    </div>
  );
}
