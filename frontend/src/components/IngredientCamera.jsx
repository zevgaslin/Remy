import { useEffect, useRef, useState } from 'react';

export default function IngredientCamera() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Requesting camera access…');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let stream;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access requires a supported browser and HTTPS (or localhost).');
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (!cancelled) setStatus('Camera is live. Barcode scanning is coming soon.');
      } catch (err) {
        stream?.getTracks().forEach((track) => track.stop());
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
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [attempt]);

  return (
    <div className="ingredient-camera">
      <p>Allow camera access when your browser asks to see a live preview.</p>
      <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview" />
      {status && <p role="status">{status}</p>}
      {error && <>
        <p className="auth-error" role="alert">{error}</p>
        <button type="button" className="auth-submit" onClick={() => { setError(''); setStatus('Requesting camera access…'); setAttempt((value) => value + 1); }}>Try camera again</button>
      </>}
    </div>
  );
}
