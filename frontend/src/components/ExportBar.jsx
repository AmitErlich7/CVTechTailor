import { useState } from 'react'
import { downloadBlob, exportDocx, exportPdf } from '../services/api.js'

export default function ExportBar({ resumeId, status, compact = false }) {
  const [docxLoading, setDocxLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState(null)

  if (status !== 'approved' && status !== 'exported') return null

  const handleDocx = async () => {
    setDocxLoading(true); setError(null)
    try { const { blob, filename } = await exportDocx(resumeId); downloadBlob(blob, filename) }
    catch (err) { setError(err.message) }
    finally { setDocxLoading(false) }
  }

  const handlePdf = async () => {
    setPdfLoading(true); setError(null)
    try { const { blob, filename } = await exportPdf(resumeId); downloadBlob(blob, filename) }
    catch (err) { setError(err.message) }
    finally { setPdfLoading(false) }
  }

  /* ── Compact (inside the sticky aside) ── */
  if (compact) {
    return (
      <div style={e.compactCard}>
        <div style={e.compactHead}>
          <div style={e.tick}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div style={e.compactLabel}>Resume approved</div>
            <div style={e.compactHint}>Download your tailored resume</div>
          </div>
        </div>
        {error && <p style={e.error}>{error}</p>}
        <div style={e.compactBtns}>
          <button
            data-testid="download-docx"
            style={{ ...e.compactBtn, ...e.compactBtnAccent, opacity: docxLoading ? 0.6 : 1 }}
            onClick={handleDocx}
            disabled={docxLoading}
          >
            {docxLoading ? 'Generating…' : '↓ DOCX'}
          </button>
          <button
            data-testid="download-pdf"
            style={{ ...e.compactBtn, ...e.compactBtnDark, opacity: pdfLoading ? 0.6 : 1 }}
            onClick={handlePdf}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Generating…' : '↓ PDF'}
          </button>
        </div>
      </div>
    )
  }

  /* ── Default (full-width bar) ── */
  return (
    <div style={e.bar}>
      <div style={e.left}>
        <div style={e.tick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div style={e.approvedLabel}>Resume approved</div>
          <div style={e.approvedHint}>Download your ATS-compliant resume below.</div>
        </div>
      </div>
      <div style={e.right}>
        {error && <span style={e.error}>{error}</span>}
        <button
          data-testid="download-docx"
          style={{ ...e.btn, ...e.btnDocx, opacity: docxLoading ? 0.6 : 1 }}
          onClick={handleDocx}
          disabled={docxLoading}
        >
          {docxLoading ? 'Generating…' : 'Download DOCX'}
        </button>
        <button
          data-testid="download-pdf"
          style={{ ...e.btn, ...e.btnPdf, opacity: pdfLoading ? 0.6 : 1 }}
          onClick={handlePdf}
          disabled={pdfLoading}
        >
          {pdfLoading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>
    </div>
  )
}

const e = {
  /* Full-width bar */
  bar: {
    background: 'var(--color-success-bg)',
    border: '1px solid oklch(85% 0.07 145)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5) var(--space-6)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)',
  },
  left:  { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' },
  right: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' },
  tick: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: 'var(--color-success)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  approvedLabel: { fontWeight: 700, fontSize: '14px', color: 'var(--color-success)' },
  approvedHint:  { fontSize: '12px', color: 'oklch(55% 0.10 145)', marginTop: '2px' },
  error: { fontSize: '12.5px', color: 'var(--color-error)' },
  btn: {
    border: 'none', borderRadius: 'var(--radius-md)',
    padding: '9px var(--space-5)', fontSize: '13.5px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-ui)', letterSpacing: '-0.01em',
  },
  btnDocx: { background: 'var(--color-accent)', color: 'white' },
  btnPdf:  { background: 'var(--color-text)',   color: 'white' },

  /* Compact (aside) */
  compactCard: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
  },
  compactHead: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    marginBottom: 'var(--space-4)',
  },
  compactLabel: { fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '14px', color: 'var(--color-text)', letterSpacing: '-0.01em' },
  compactHint:  { fontSize: '11.5px', color: 'var(--color-text-3)', marginTop: '2px' },
  compactBtns:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' },
  compactBtn: {
    border: 'none', borderRadius: 'var(--radius-md)',
    padding: '9px var(--space-3)', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'center',
  },
  compactBtnAccent: { background: 'var(--color-accent)', color: 'white' },
  compactBtnDark:   { background: 'var(--color-text)',   color: 'white' },
}
