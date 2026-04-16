import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, ImageIcon, Loader2, Download, Trash2,
  ChevronDown, ChevronRight, Key, Eye, EyeOff,
  AlertCircle, CheckCircle2, RefreshCw, Utensils
} from 'lucide-react';

/* ── base64 helper ── */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/* ── Excel export ── */
const exportToExcel = async (sections, fileName = 'menu.xlsx') => {
  const XLSX = (await import('xlsx')).default;
  const rows = [['القسم', 'اسم الصنف', 'السعر', 'الوصف']];
  for (const sec of sections) {
    for (const item of sec.items) {
      rows.push([sec.section, item.name, item.price ?? '—', item.description ?? '']);
    }
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 32 }, { wch: 14 }, { wch: 44 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Menu');
  XLSX.writeFile(wb, fileName);
};

/* ── Gemini API call ── */
const GEMINI_MODEL = 'gemini-1.5-flash-latest';

const extractMenu = async (base64Data, mimeType, apiKey) => {
  const prompt = `You are a professional menu extraction assistant.
Analyze this menu image and extract ALL sections with their items and prices.

Return ONLY a valid JSON array — no markdown, no explanation, no extra text:
[
  {
    "section": "section name in the original language",
    "items": [
      { "name": "item name", "price": "price as string e.g. 5000 or 5.99", "description": "short description if visible, else empty string" }
    ]
  }
]

Rules:
- Preserve the original language (Arabic / English / mixed).
- If no clear sections exist, use a single section named "General".
- If a price is not visible write "—".
- Extract every visible item.`;

  const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Data } },
          { text: prompt }
        ]
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Gemini API error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  // Strip accidental markdown fences
  const clean = text.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
  return JSON.parse(clean);
};

/* ══════════════════════════════════════════
   Main Component
══════════════════════════════════════════ */
const MenuExtractor = () => {
  /* API key */
  const [apiKey, setApiKey]       = useState(() => localStorage.getItem('mp_gemini_key') || '');
  const [keyInput, setKeyInput]   = useState('');
  const [showKey, setShowKey]     = useState(false);
  const isKeySet                  = !!apiKey;

  /* Image */
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging]   = useState(false);
  const fileInputRef                  = useRef(null);

  /* Processing */
  const [isProcessing, setIsProcessing] = useState(false);
  const [sections, setSections]         = useState(null);
  const [error, setError]               = useState(null);
  const [collapsed, setCollapsed]       = useState({});

  /* ── key management ── */
  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) { setError('أدخل المفتاح أولاً'); return; }
    localStorage.setItem('mp_gemini_key', k);
    setApiKey(k);
    setKeyInput('');
    setError(null);
  };
  const clearKey = () => {
    localStorage.removeItem('mp_gemini_key');
    setApiKey('');
  };

  /* ── image handling ── */
  const handleFile = useCallback((file) => {
    if (!file?.type.startsWith('image/')) {
      setError('الرجاء رفع صورة (JPG, PNG, WEBP, HEIC)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('حجم الصورة يجب أن لا يتجاوز 20MB');
      return;
    }
    setError(null);
    setSections(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  /* ── extract ── */
  const handleExtract = async () => {
    if (!imageFile || !apiKey) return;
    setIsProcessing(true);
    setError(null);
    setSections(null);
    try {
      const b64  = await fileToBase64(imageFile);
      const result = await extractMenu(b64, imageFile.type, apiKey);
      if (!Array.isArray(result) || result.length === 0)
        throw new Error('لم يُعثر على بيانات في الصورة — جرّب صورة أوضح');
      setSections(result);
      setCollapsed({});
    } catch (err) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImageFile(null);
    setImagePreview(null);
    setSections(null);
    setError(null);
  };

  const totalItems = sections?.reduce((s, sec) => s + sec.items.length, 0) ?? 0;

  /* ── render ── */
  return (
    <div className="me-page">
      <style>{`
        .me-page {
          max-width: 1100px; margin: 0 auto; padding: 1rem 0;
          animation: fadeIn 0.35s ease;
        }

        /* ── Header ── */
        .me-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 1.75rem; flex-wrap: wrap; gap: 12px;
        }
        .me-title {
          font-size: 1.5rem; font-weight: 900; color: var(--text-primary);
          display: flex; align-items: center; gap: 10px;
        }
        .me-subtitle { font-size: 0.82rem; color: var(--text-dim); margin-top: 5px; }

        /* ── API key card ── */
        .me-key-card {
          background: var(--card-bg); border: 1px solid var(--border-color);
          border-radius: 14px; padding: 1.125rem; margin-bottom: 1.5rem;
        }
        .me-key-section-label {
          font-size: 0.67rem; font-weight: 800; color: var(--text-dim);
          text-transform: uppercase; letter-spacing: 0.07em;
          display: flex; align-items: center; gap: 6px; margin-bottom: 0.875rem;
        }
        .me-key-set-row {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .me-key-status {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.875rem; font-weight: 700; color: #16a34a;
        }
        .me-key-change-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-dim); font-size: 0.78rem; font-weight: 700;
          padding: 4px 8px; border-radius: 6px; transition: 0.15s;
        }
        .me-key-change-btn:hover { background: var(--surface-hover); color: var(--text-secondary); }
        .me-key-input-row { display: flex; gap: 8px; }
        .me-key-input {
          flex: 1; padding: 9px 12px; border: 1.5px solid var(--border-color);
          border-radius: 10px; font-size: 0.875rem; background: var(--background-color);
          color: var(--text-primary); outline: none; font-family: monospace;
          min-width: 0;
        }
        .me-key-input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
        .me-icon-btn {
          padding: 0 11px; background: var(--surface-hover);
          border: 1px solid var(--border-color); border-radius: 10px;
          cursor: pointer; color: var(--text-dim); display: flex; align-items: center;
          transition: 0.15s;
        }
        .me-icon-btn:hover { color: var(--text-secondary); }
        .me-save-btn {
          padding: 9px 18px; background: var(--primary-color); color: white;
          border: none; border-radius: 10px; font-weight: 700; font-size: 0.82rem;
          cursor: pointer; white-space: nowrap; transition: 0.15s;
        }
        .me-save-btn:hover { opacity: 0.88; }
        .me-key-hint {
          font-size: 0.72rem; color: var(--text-dim); margin-top: 7px; line-height: 1.5;
        }
        .me-key-hint a { color: var(--primary-color); text-decoration: none; font-weight: 700; }

        /* ── Main grid ── */
        .me-grid {
          display: grid; grid-template-columns: 420px 1fr;
          gap: 1.5rem; align-items: start;
        }
        @media (max-width: 960px) { .me-grid { grid-template-columns: 1fr; } }

        /* ── Upload panel ── */
        .me-panel {
          background: var(--card-bg); border: 1px solid var(--border-color);
          border-radius: 14px; padding: 1.25rem;
        }
        .me-panel-label {
          font-size: 0.67rem; font-weight: 800; color: var(--text-dim);
          text-transform: uppercase; letter-spacing: 0.07em;
          display: flex; align-items: center; gap: 6px; margin-bottom: 1rem;
        }
        .me-drop-zone {
          border: 2px dashed var(--border-color); border-radius: 12px;
          padding: 2.75rem 1.5rem; text-align: center; cursor: pointer;
          transition: all 0.2s; display: flex; flex-direction: column;
          align-items: center; gap: 10px; color: var(--text-dim);
        }
        .me-drop-zone:hover, .me-drop-zone.drag {
          border-color: var(--primary-color);
          background: rgba(79,70,229,0.04); color: var(--primary-color);
        }
        .me-drop-title { font-size: 0.9rem; font-weight: 700; }
        .me-drop-hint  { font-size: 0.75rem; }
        .me-choose-btn {
          padding: 7px 18px; background: rgba(79,70,229,0.1);
          color: var(--primary-color); border: none; border-radius: 8px;
          font-weight: 700; font-size: 0.8rem; cursor: pointer; margin-top: 4px;
        }
        .me-preview-wrap {
          position: relative; border-radius: 12px; overflow: hidden;
          border: 1px solid var(--border-color); margin-bottom: 1rem;
        }
        .me-preview-img {
          width: 100%; max-height: 340px; object-fit: contain;
          background: var(--surface-hover); display: block;
        }
        .me-preview-clear {
          position: absolute; top: 8px; right: 8px;
          width: 30px; height: 30px; background: rgba(0,0,0,0.5);
          color: white; border: none; border-radius: 7px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .me-extract-btn {
          width: 100%; padding: 12px; background: var(--primary-color);
          color: white; border: none; border-radius: 11px;
          font-weight: 800; font-size: 0.9rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          gap: 8px; transition: 0.15s;
        }
        .me-extract-btn:hover:not(:disabled) { opacity: 0.88; }
        .me-extract-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .me-no-key-hint {
          text-align: center; font-size: 0.75rem; color: var(--text-dim);
          margin-top: 8px;
        }
        .me-error-box {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 14px; background: #fef2f2;
          border: 1px solid #fecaca; border-radius: 10px;
          color: #b91c1c; font-size: 0.82rem; font-weight: 600;
          margin-top: 10px; line-height: 1.5;
        }

        /* ── Results panel ── */
        .me-results-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.125rem; flex-wrap: wrap; gap: 8px;
        }
        .me-chips { display: flex; gap: 7px; }
        .me-chip {
          font-size: 0.7rem; font-weight: 700; padding: 3px 10px;
          border-radius: 6px;
        }
        .me-chip.s { background: rgba(79,70,229,0.1); color: var(--primary-color); }
        .me-chip.i { background: rgba(16,185,129,0.1); color: #059669; }
        .me-export-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: #d1fae5; color: #065f46;
          border: none; border-radius: 9px; font-weight: 700;
          font-size: 0.78rem; cursor: pointer; transition: 0.15s;
        }
        .me-export-btn:hover { background: #a7f3d0; }

        /* ── Section card ── */
        .me-sec-card {
          border: 1px solid var(--border-color); border-radius: 12px;
          margin-bottom: 10px; overflow: hidden;
        }
        .me-sec-head {
          display: flex; align-items: center; gap: 8px; padding: 10px 14px;
          background: var(--surface-hover); cursor: pointer; user-select: none;
          transition: background 0.15s;
        }
        .me-sec-head:hover { background: var(--border-color); }
        .me-sec-name { font-weight: 800; font-size: 0.875rem; color: var(--text-primary); flex: 1; }
        .me-sec-count {
          font-size: 0.68rem; color: var(--text-dim); font-weight: 600;
          background: var(--card-bg); padding: 2px 8px; border-radius: 5px;
        }
        .me-table { width: 100%; border-collapse: collapse; }
        .me-table th {
          font-size: 0.61rem; text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--text-dim); font-weight: 800; padding: 8px 14px;
          text-align: left; border-bottom: 1px solid var(--border-color);
          background: var(--background-color);
        }
        .me-table td {
          padding: 9px 14px; font-size: 0.835rem;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary); vertical-align: top;
        }
        .me-table tr:last-child td { border-bottom: none; }
        .me-table tr:hover td { background: var(--surface-hover); }
        .me-item-name  { font-weight: 600; }
        .me-item-desc  { font-size: 0.73rem; color: var(--text-dim); margin-top: 2px; }
        .me-price      { font-weight: 800; color: #16a34a; white-space: nowrap; }

        /* ── Empty / loading ── */
        .me-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 4rem 1rem;
          color: var(--text-dim); gap: 10px; text-align: center;
        }
        .me-empty p { font-size: 0.875rem; font-weight: 600; max-width: 260px; line-height: 1.6; }
        .me-loading {
          display: flex; flex-direction: column; align-items: center;
          gap: 14px; padding: 3.5rem 1rem; color: var(--text-dim);
        }
        .me-loading-title { font-size: 0.9rem; font-weight: 700; color: var(--text-secondary); }
        .me-loading-sub   { font-size: 0.75rem; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Page header ── */}
      <div className="me-header">
        <div>
          <div className="me-title"><Utensils size={24} /> استخراج المنيو</div>
          <div className="me-subtitle">ارفع صورة منيو وسيتم استخراج الأقسام والأصناف والأسعار بواسطة Gemini AI</div>
        </div>
        {sections && (
          <button className="me-export-btn" onClick={() => exportToExcel(sections)}>
            <Download size={15} /> تصدير Excel
          </button>
        )}
      </div>

      {/* ── API key card ── */}
      <div className="me-key-card">
        <div className="me-key-section-label"><Key size={13} /> Google Gemini API Key</div>
        {isKeySet ? (
          <div className="me-key-set-row">
            <div className="me-key-status">
              <CheckCircle2 size={16} />
              المفتاح محفوظ — {apiKey.slice(0, 8)}••••••••
            </div>
            <button className="me-key-change-btn" onClick={clearKey}>تغيير المفتاح</button>
          </div>
        ) : (
          <>
            <div className="me-key-input-row">
              <input
                className="me-key-input"
                type={showKey ? 'text' : 'password'}
                placeholder="AIza..."
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveKey()}
              />
              <button className="me-icon-btn" onClick={() => setShowKey(v => !v)}>
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button className="me-save-btn" onClick={saveKey}>حفظ</button>
            </div>
            <div className="me-key-hint">
              احصل على مفتاحك المجاني من{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                aistudio.google.com
              </a>
              {' '}· مجاني 1500 طلب/يوم · يُحفظ في المتصفح فقط ولا يُرسل لأي خادم
            </div>
          </>
        )}
      </div>

      {/* ── Main grid ── */}
      <div className="me-grid">

        {/* Upload panel */}
        <div className="me-panel">
          <div className="me-panel-label"><ImageIcon size={13} /> الصورة</div>

          {!imagePreview ? (
            <>
              <div
                className={`me-drop-zone ${isDragging ? 'drag' : ''}`}
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={38} strokeWidth={1.4} />
                <div className="me-drop-title">اسحب الصورة أو اضغط للرفع</div>
                <div className="me-drop-hint">PNG · JPG · WEBP · حتى 20MB</div>
                <button className="me-choose-btn" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  اختر ملف
                </button>
              </div>
              <input
                ref={fileInputRef} type="file" accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />
            </>
          ) : (
            <>
              <div className="me-preview-wrap">
                <img src={imagePreview} alt="menu preview" className="me-preview-img" />
                <button className="me-preview-clear" onClick={reset}><Trash2 size={14} /></button>
              </div>
              <button className="me-extract-btn" onClick={handleExtract} disabled={isProcessing || !isKeySet}>
                {isProcessing
                  ? <><Loader2 size={17} style={{ animation: 'spin 0.9s linear infinite' }} /> جاري التحليل...</>
                  : <><RefreshCw size={16} /> استخراج المنيو</>
                }
              </button>
              {!isKeySet && <div className="me-no-key-hint">أضف مفتاح API أولاً</div>}
            </>
          )}

          {error && (
            <div className="me-error-box">
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}
        </div>

        {/* Results panel */}
        <div className="me-panel">
          <div className="me-results-header">
            <div className="me-panel-label" style={{ margin: 0 }}><Utensils size={13} /> النتائج</div>
            {sections && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="me-chips">
                  <span className="me-chip s">{sections.length} قسم</span>
                  <span className="me-chip i">{totalItems} صنف</span>
                </div>
                <button className="me-export-btn" onClick={() => exportToExcel(sections)}>
                  <Download size={13} /> Excel
                </button>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="me-loading">
              <Loader2 size={40} strokeWidth={1.4} style={{ animation: 'spin 0.9s linear infinite', color: 'var(--primary-color)' }} />
              <div className="me-loading-title">Gemini يحلل الصورة...</div>
              <div className="me-loading-sub">قد يستغرق 10–20 ثانية</div>
            </div>
          )}

          {!isProcessing && !sections && (
            <div className="me-empty">
              <Utensils size={46} strokeWidth={1} />
              <p>ارفع صورة منيو واضغط "استخراج المنيو" لبدء التحليل</p>
            </div>
          )}

          {!isProcessing && sections && sections.map((sec, idx) => (
            <div key={idx} className="me-sec-card">
              <div className="me-sec-head" onClick={() => setCollapsed(p => ({ ...p, [idx]: !p[idx] }))}>
                {collapsed[idx] ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                <span className="me-sec-name">{sec.section}</span>
                <span className="me-sec-count">{sec.items.length} صنف</span>
              </div>
              {!collapsed[idx] && (
                <table className="me-table">
                  <thead>
                    <tr><th>الصنف</th><th>السعر</th></tr>
                  </thead>
                  <tbody>
                    {sec.items.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <div className="me-item-name">{item.name}</div>
                          {item.description && <div className="me-item-desc">{item.description}</div>}
                        </td>
                        <td className="me-price">{item.price || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MenuExtractor;
