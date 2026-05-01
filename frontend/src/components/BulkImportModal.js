import React, { useState, useCallback } from 'react';
import { adminAPI } from '../utils/api';
import { X, Sparkles, CheckCircle2, AlertCircle, Loader2, Upload } from 'lucide-react';

/**
 * Two-step bulk import:
 * Step 1: Paste URLs → Backend bulk-lookup → preview rows
 * Step 2: Admin reviews + checks rows → "Create N" → loops POST /api/admin/vendors
 */
export default function BulkImportModal({ token, onClose, onCreated }) {
  const [urlsText, setUrlsText] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'review' | 'creating' | 'done'
  const [fetching, setFetching] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState({}); // index -> bool
  const [createdCount, setCreatedCount] = useState(0);
  const [createErrors, setCreateErrors] = useState([]);
  const [error, setError] = useState('');

  const handleFetch = useCallback(async () => {
    const urls = urlsText.split('\n').map(s => s.trim()).filter(Boolean);
    if (urls.length === 0) {
      setError('Paste at least one Google Maps URL.');
      return;
    }
    if (urls.length > 25) {
      setError(`Max 25 URLs per batch (you pasted ${urls.length}). Split into smaller batches.`);
      return;
    }
    setError('');
    setFetching(true);
    try {
      const res = await adminAPI.bulkGoogleLookup(urls, token);
      setResults(res.data.results);
      // pre-select all successful ones
      const initSel = {};
      res.data.results.forEach((r, i) => { initSel[i] = !!r.ok; });
      setSelected(initSel);
      setStep('review');
    } catch (err) {
      setError(err.response?.data?.detail || 'Bulk lookup failed.');
    } finally {
      setFetching(false);
    }
  }, [urlsText, token]);

  const toggleRow = useCallback((i) => {
    setSelected(prev => ({ ...prev, [i]: !prev[i] }));
  }, []);

  const updateRowField = useCallback((i, field, value) => {
    setResults(prev => prev.map((r, idx) =>
      idx === i ? { ...r, data: { ...r.data, [field]: value } } : r
    ));
  }, []);

  const handleCreate = useCallback(async () => {
    setStep('creating');
    setCreatedCount(0);
    setCreateErrors([]);
    let created = 0;
    const errors = [];
    for (let i = 0; i < results.length; i++) {
      if (!selected[i] || !results[i].ok) continue;
      const d = results[i].data;
      // Skip rows missing required fields
      const required = ['business_name', 'category', 'city', 'address', 'phone', 'description'];
      const missing = required.filter(f => !d[f]);
      if (missing.length > 0) {
        errors.push({ url: results[i].url, error: `Missing required: ${missing.join(', ')}` });
        continue;
      }
      try {
        await adminAPI.createVendor({
          business_name: d.business_name,
          category: d.category,
          city: d.city,
          address: d.address,
          phone: d.phone,
          description: d.description || d.business_name,
          external_link: d.external_link || null,
          latitude: d.latitude,
          longitude: d.longitude,
        }, token);
        created += 1;
        setCreatedCount(created);
      } catch (err) {
        errors.push({ url: results[i].url, error: err.response?.data?.detail || 'Create failed' });
      }
    }
    setCreateErrors(errors);
    setStep('done');
    if (created > 0 && onCreated) onCreated();
  }, [results, selected, token, onCreated]);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const successCount = results.filter(r => r.ok).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="bulk-import-modal">
      <div className="bg-surface rounded-2xl border-2 border-border shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-surface border-b-2 border-border p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="w-7 h-7 text-primary" strokeWidth={2} />
            <h2 className="text-2xl font-bold text-primary">Bulk Import from Google Maps</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-error text-error-foreground rounded-full hover:bg-error/90"
            data-testid="bulk-close"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1">
          {step === 'input' && (
            <>
              <p className="text-base text-primary mb-2">
                Paste up to <strong>25 Google Maps URLs</strong>, one per line. Mix full URLs and shortened <code className="font-mono text-xs bg-secondary/30 px-1 rounded">maps.app.goo.gl</code> share links freely.
              </p>
              <p className="text-sm text-primary/70 mb-4">
                Each URL counts toward your daily quota (200/day).
              </p>
              <textarea
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                rows={12}
                placeholder={'https://maps.app.goo.gl/abc123\nhttps://www.google.com/maps/place/Some+Vendor\n...'}
                className="w-full border-2 border-border rounded-md px-4 py-3 text-base font-mono focus:border-primary focus:ring-2 focus:ring-secondary/50 outline-none bg-white text-primary resize-none"
                data-testid="bulk-urls-textarea"
                disabled={fetching}
              />
              {error && (
                <p className="mt-3 text-sm font-medium text-error" data-testid="bulk-error">{error}</p>
              )}
            </>
          )}

          {step === 'review' && (
            <>
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <p className="text-base text-primary">
                  <strong>{successCount}</strong> fetched successfully, <strong>{results.length - successCount}</strong> failed.
                  Review and uncheck any you don't want to import.
                </p>
                <p className="text-sm text-primary/70">
                  {selectedCount} selected
                </p>
              </div>
              <div className="space-y-3">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`border-2 rounded-lg p-4 ${r.ok ? 'border-border bg-white' : 'border-error/40 bg-error/5'}`}
                    data-testid={`bulk-row-${i}`}
                  >
                    {r.ok ? (
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={!!selected[i]}
                          onChange={() => toggleRow(i)}
                          className="mt-1.5 w-5 h-5 accent-secondary cursor-pointer"
                          data-testid={`bulk-check-${i}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" strokeWidth={2} />
                            <input
                              type="text"
                              value={r.data.business_name || ''}
                              onChange={(e) => updateRowField(i, 'business_name', e.target.value)}
                              className="flex-1 text-lg font-bold text-primary bg-transparent border-b-2 border-transparent focus:border-secondary outline-none"
                              data-testid={`bulk-name-${i}`}
                            />
                            <select
                              value={r.data.category || ''}
                              onChange={(e) => updateRowField(i, 'category', e.target.value)}
                              className="text-sm font-bold text-secondary bg-secondary/10 border border-border rounded px-2 py-1"
                              data-testid={`bulk-category-${i}`}
                            >
                              <option value="">— Pick category —</option>
                              {['Venue','Religious Venue','Catering','Decor','Photography','Makeup','Attire Rentals','Car Rentals','Accessories','Jewellery'].map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <p className="text-sm text-primary truncate"><strong>Address:</strong> {r.data.address || '—'}</p>
                          <p className="text-sm text-primary"><strong>Phone:</strong> {r.data.phone || <span className="text-error">missing</span>} &nbsp;·&nbsp; <strong>Lat/Lng:</strong> {r.data.latitude?.toFixed?.(4)}, {r.data.longitude?.toFixed?.(4)}</p>
                          {r.meta?.missing_fields?.length > 0 && (
                            <p className="text-xs text-error mt-1">⚠ Missing: {r.meta.missing_fields.join(', ')} — these rows may fail to save.</p>
                          )}
                          {r.meta?.category_via_llm && (
                            <p className="text-xs text-primary/70 mt-1">Category inferred by AI — verify above.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-primary truncate">{r.url}</p>
                          <p className="text-sm text-error">{r.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 'creating' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" strokeWidth={2} />
              <p className="text-lg font-bold text-primary">Creating vendor {createdCount + 1} of {selectedCount}…</p>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" strokeWidth={2} />
              <h3 className="text-2xl font-bold text-primary mb-2">
                Created {createdCount} vendor{createdCount !== 1 ? 's' : ''}
              </h3>
              {createErrors.length > 0 && (
                <div className="mt-6 text-left bg-error/10 border-2 border-error rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="font-bold text-error mb-2">{createErrors.length} failed:</p>
                  <ul className="text-sm text-primary space-y-1">
                    {createErrors.map((e, i) => (
                      <li key={i}><span className="font-mono text-xs">{e.url.slice(0, 60)}…</span>: {e.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-border p-5 flex justify-end gap-3 flex-wrap">
          {step === 'input' && (
            <>
              <button
                onClick={onClose}
                className="bg-background border-2 border-border text-primary hover:bg-primary/5 h-12 px-6 rounded-full font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleFetch}
                disabled={fetching || !urlsText.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-full font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="bulk-fetch-button"
              >
                {fetching ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} /> : <Sparkles className="w-5 h-5" strokeWidth={2} />}
                {fetching ? 'Fetching…' : 'Fetch Details'}
              </button>
            </>
          )}
          {step === 'review' && (
            <>
              <button
                onClick={() => setStep('input')}
                className="bg-background border-2 border-border text-primary hover:bg-primary/5 h-12 px-6 rounded-full font-bold"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={selectedCount === 0}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 px-8 rounded-full font-bold border-2 border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="bulk-create-button"
              >
                Create {selectedCount} vendor{selectedCount !== 1 ? 's' : ''}
              </button>
            </>
          )}
          {step === 'done' && (
            <button
              onClick={onClose}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-full font-bold"
              data-testid="bulk-done-button"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
