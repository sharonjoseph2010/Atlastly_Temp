import React, { useState, useCallback, useEffect } from 'react';
import { Clipboard, CheckCircle2 } from 'lucide-react';

/**
 * Paste "lat, lng" (Google Maps right-click → copy coords format) and
 * propagate into the form's lat/lng fields + map marker.
 *
 * Props:
 *  - latitude, longitude (numbers)       — current values, used to seed the field
 *  - onChange({latitude, longitude})     — called with parsed floats when valid
 */
export default function CoordinatePaste({ latitude, longitude, onChange }) {
  const [text, setText] = useState(() => `${latitude}, ${longitude}`);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  // keep in sync when parent values change (e.g. marker drag, Google auto-fill)
  useEffect(() => {
    setText(`${latitude}, ${longitude}`);
    setOk(false);
    setError('');
  }, [latitude, longitude]);

  const parseAndApply = useCallback((raw) => {
    // Accept: "lat, lng" | "lat,lng" | "lat lng" | surrounding whitespace/parens
    const cleaned = raw.replace(/[()]/g, '').trim();
    const m = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/);
    if (!m) {
      setOk(false);
      setError(raw.trim() ? 'Expected "lat, lng" — e.g. 11.1341, 76.3756' : '');
      return;
    }
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setOk(false);
      setError('Out of range. Lat must be -90..90, Lng -180..180.');
      return;
    }
    setOk(true);
    setError('');
    onChange({ latitude: lat, longitude: lng });
  }, [onChange]);

  const handleChange = (e) => {
    const v = e.target.value;
    setText(v);
    parseAndApply(v);
  };

  const handlePaste = (e) => {
    // let default paste happen, then parse
    setTimeout(() => parseAndApply(e.target.value), 0);
  };

  return (
    <div data-testid="coord-paste">
      <div className="relative">
        <Clipboard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" strokeWidth={2} />
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder="Paste coords here: 11.1341, 76.3756"
          className={`w-full h-12 border-2 rounded-md pl-11 pr-10 text-base outline-none bg-white text-primary font-mono
            ${error ? 'border-error focus:ring-2 focus:ring-error/40' : 'border-border focus:border-primary focus:ring-2 focus:ring-secondary/50'}`}
          data-testid="coord-paste-input"
          spellCheck={false}
        />
        {ok && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" strokeWidth={2} />
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-error">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-primary/60">
          Tip: right-click on Google Maps → <em>the first item</em> copies the coordinates in this exact format.
        </p>
      )}
    </div>
  );
}
