export default function JDInput({ value, onChange, onSubmit, loading }) {
  const { jdText, jobTitle, company } = value
  const valid = jdText.trim().length > 50 && jobTitle.trim() && company.trim()

  return (
    <div>
      <header style={s.header}>
        <h1 style={s.h1}>Tailor your resume</h1>
        <p style={s.hint}>
          Paste the full job description below. The AI will tailor your profile
          to highlight the most relevant experience — using only what you've provided.
        </p>
      </header>

      <div style={s.card}>
        <div style={s.row2}>
          <div style={s.field}>
            <label style={s.label}>Job title</label>
            <input
              value={jobTitle}
              onChange={(e) => onChange({ ...value, jobTitle: e.target.value })}
              placeholder="Senior Software Engineer"
              style={s.input}
              disabled={loading}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Company</label>
            <input
              value={company}
              onChange={(e) => onChange({ ...value, company: e.target.value })}
              placeholder="Acme Corp"
              style={s.input}
              disabled={loading}
            />
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>Job description</label>
          <textarea
            value={jdText}
            onChange={(e) => onChange({ ...value, jdText: e.target.value })}
            placeholder="Paste the full job description here…"
            style={s.textarea}
            rows={16}
            disabled={loading}
          />
          <span style={s.charCount}>{jdText.length} characters</span>
        </div>

        <div style={s.footer}>
          {!valid && (
            <span style={s.validHint}>
              Fill in job title, company, and at least 50 characters of JD to continue.
            </span>
          )}
          <button
            data-testid="tailor-submit"
            style={{ ...s.btn, opacity: valid && !loading ? 1 : 0.45 }}
            disabled={!valid || loading}
            onClick={onSubmit}
          >
            {loading ? 'Tailoring…' : 'Tailor my resume →'}
          </button>
        </div>
      </div>
    </div>
  )
}

const s = {
  header: { marginBottom: 'var(--space-6)' },
  h1: {
    fontFamily: 'var(--font-heading)',
    fontSize: '26px',
    fontWeight: 700,
    color: 'var(--color-text)',
    letterSpacing: '-0.02em',
    marginBottom: 'var(--space-2)',
  },
  hint: { fontSize: '14px', color: 'var(--color-text-3)', lineHeight: '1.6', maxWidth: '600px' },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-8)',
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' },
  field: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-5)' },
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
    transition: 'border-color 0.12s',
    width: '100%',
  },
  textarea: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3)',
    fontSize: '13.5px',
    color: 'var(--color-text)',
    resize: 'vertical',
    fontFamily: 'var(--font-ui)',
    lineHeight: '1.65',
    background: 'var(--color-bg)',
    outline: 'none',
    width: '100%',
  },
  charCount: { fontSize: '11px', color: 'var(--color-text-3)', textAlign: 'right', marginTop: 'var(--space-1)' },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-4)' },
  validHint: { fontSize: '12.5px', color: 'var(--color-text-3)' },
  btn: {
    background: 'var(--color-accent)',
    color: 'var(--color-surface)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '10px var(--space-6)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    letterSpacing: '-0.01em',
    transition: 'background 0.12s',
  },
}
