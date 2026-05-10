import { useState } from 'react'
import { confirmGitHubProject, importGitHubRepo } from '../services/api.js'

export default function GitHubImport({ onClose, onImported }) {
  const [step, setStep] = useState('input')
  const [repoUrl, setRepoUrl] = useState('')
  const [card, setCard] = useState(null)
  const [error, setError] = useState(null)

  const handleImport = async () => {
    if (!repoUrl.trim()) return
    setError(null)
    setStep('loading')
    try {
      const result = await importGitHubRepo(repoUrl.trim())
      setCard({ ...result.project_card, repo_url: result.repo_url })
      setStep('review')
    } catch (err) {
      setError(err.message)
      setStep('input')
    }
  }

  const handleConfirm = async () => {
    setStep('confirming')
    setError(null)
    try {
      const result = await confirmGitHubProject(card)
      onImported(result.project)
      setStep('done')
      setTimeout(onClose, 1200)
    } catch (err) {
      setError(err.message)
      setStep('review')
    }
  }

  const updateCard = (key, value) => setCard((prev) => ({ ...prev, [key]: value }))

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalHead}>
          <h2 style={s.modalTitle}>Import from GitHub</h2>
          <button style={s.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {(step === 'input' || step === 'loading') && (
          <div>
            <p style={s.hint}>
              Paste a public GitHub repo URL. The AI will analyze the README and
              dependencies to extract project details.
            </p>
            <div style={s.field}>
              <label style={s.label}>Repository URL</label>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                placeholder="https://github.com/owner/repo"
                style={s.input}
                disabled={step === 'loading'}
              />
            </div>
            {error && <p style={s.error}>{error}</p>}
            <div style={s.btnRow}>
              <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
              <button
                style={{ ...s.primaryBtn, opacity: step === 'loading' ? 0.6 : 1 }}
                onClick={handleImport}
                disabled={step === 'loading'}
              >
                {step === 'loading' ? 'Analyzing…' : 'Analyze repository'}
              </button>
            </div>
          </div>
        )}

        {(step === 'review' || step === 'confirming') && card && (
          <div>
            <p style={s.hint}>
              Review the AI-extracted project details. Edit anything before saving.
            </p>
            <div style={s.field}>
              <label style={s.label}>Project name</label>
              <input value={card.name || ''} onChange={(e) => updateCard('name', e.target.value)} style={s.input} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Purpose</label>
              <textarea
                value={card.purpose || ''}
                onChange={(e) => updateCard('purpose', e.target.value)}
                style={{ ...s.input, resize: 'vertical' }}
                rows={2}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Tech stack (comma-separated)</label>
              <input
                value={(card.tech_stack || []).join(', ')}
                onChange={(e) => updateCard('tech_stack', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
                style={s.input}
              />
            </div>
            <div style={s.row2}>
              <div style={s.field}>
                <label style={s.label}>Your role</label>
                <select value={card.your_role || 'solo_builder'} onChange={(e) => updateCard('your_role', e.target.value)} style={s.select}>
                  <option value="solo_builder">Solo Builder</option>
                  <option value="contributor">Contributor</option>
                  <option value="maintainer">Maintainer</option>
                  <option value="team_lead">Team Lead</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Scale</label>
                <select value={card.scale || 'personal'} onChange={(e) => updateCard('scale', e.target.value)} style={s.select}>
                  <option value="personal">Personal</option>
                  <option value="team">Team</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Key features (one per line)</label>
              <textarea
                value={(card.key_features || []).join('\n')}
                onChange={(e) => updateCard('key_features', e.target.value.split('\n').filter(Boolean))}
                style={{ ...s.input, resize: 'vertical' }}
                rows={4}
              />
            </div>
            {error && <p style={s.error}>{error}</p>}
            <div style={s.btnRow}>
              <button style={s.cancelBtn} onClick={() => setStep('input')}>← Back</button>
              <button
                style={{ ...s.primaryBtn, opacity: step === 'confirming' ? 0.6 : 1 }}
                onClick={handleConfirm}
                disabled={step === 'confirming'}
              >
                {step === 'confirming' ? 'Saving…' : 'Save to profile'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={s.done}>
            <div style={s.doneIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={s.doneText}>Project saved to your profile.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'oklch(16% 0.018 75 / 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--space-6)',
  },
  modal: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-8)',
    width: '100%',
    maxWidth: '540px',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-md)',
  },
  modalHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-5)',
  },
  modalTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--color-text)',
    letterSpacing: '-0.01em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-sm)',
  },
  hint: { fontSize: '13.5px', color: 'var(--color-text-3)', marginBottom: 'var(--space-5)', lineHeight: '1.6' },
  field: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-4)' },
  label: {
    fontSize: '11.5px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--color-text-3)',
  },
  input: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '9px var(--space-3)',
    fontSize: '14px',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-ui)',
    background: 'var(--color-bg)',
    outline: 'none',
    width: '100%',
  },
  select: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '9px var(--space-3)',
    fontSize: '14px',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-ui)',
    width: '100%',
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' },
  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)' },
  cancelBtn: {
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '8px var(--space-5)',
    fontSize: '13.5px',
    color: 'var(--color-text-2)',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
  },
  primaryBtn: {
    background: 'var(--color-accent)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '8px var(--space-5)',
    fontSize: '13.5px',
    fontWeight: 600,
    color: 'var(--color-surface)',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
  },
  error: { color: 'var(--color-error)', fontSize: '12.5px', marginTop: 'var(--space-2)' },
  done: { textAlign: 'center', padding: 'var(--space-10) 0' },
  doneIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto var(--space-4)',
  },
  doneText: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' },
}
