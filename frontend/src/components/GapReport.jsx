export default function GapReport({ gapReport, matchScore }) {
  if (!gapReport || gapReport.length === 0) return null

  const gaps = gapReport.filter((g) => !g.found_in_profile)
  const matches = gapReport.filter((g) => g.found_in_profile)

  return (
    <div style={g.container}>
      <div style={g.header}>
        <div>
          <h3 style={g.title}>Skill gap report</h3>
          <p style={g.subtitle}>
            {gaps.length === 0
              ? 'Your profile covers all keywords in this job description.'
              : `${gaps.length} keyword${gaps.length > 1 ? 's' : ''} in the JD ${gaps.length > 1 ? 'are' : 'is'} not in your profile.`}
          </p>
        </div>
        <div style={g.scoreWrap}>
          <div style={{ ...g.scoreBubble, background: scoreColor(matchScore).bg, color: scoreColor(matchScore).text }}>
            {matchScore}%
          </div>
          <div style={g.scoreLabel}>match</div>
        </div>
      </div>

      <div style={g.disclaimer}>
        <strong>Only add skills you genuinely have.</strong> Adding skills you lack is dishonest and backfires in interviews.
      </div>

      {gaps.length > 0 && (
        <div style={g.section}>
          <div style={g.sectionLabel}>Missing from your profile</div>
          {gaps.map((item, i) => (
            <div key={i} style={g.row}>
              <div style={g.rowLeft}>
                <span style={g.missingDot} />
                <span style={g.keyword}>{item.keyword}</span>
              </div>
              <div style={g.suggestion}>{item.suggestion}</div>
            </div>
          ))}
        </div>
      )}

      {matches.length > 0 && (
        <div style={g.section}>
          <div style={g.sectionLabel}>Found in your profile</div>
          <div style={g.matchRow}>
            {matches.map((item, i) => (
              <span key={i} style={g.matchBadge}>{item.keyword}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function scoreColor(score) {
  if (score >= 75) return { bg: 'var(--color-success-bg)', text: 'var(--color-success)' }
  if (score >= 50) return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' }
  return { bg: 'var(--color-error-bg)', text: 'var(--color-error)' }
}

const g = {
  container: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    marginTop: 'var(--space-6)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-4)',
    gap: 'var(--space-4)',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-text)',
    letterSpacing: '-0.01em',
    marginBottom: 'var(--space-1)',
  },
  subtitle: { fontSize: '13.5px', color: 'var(--color-text-3)' },
  scoreWrap: { textAlign: 'center', flexShrink: 0 },
  scoreBubble: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: 700,
    margin: '0 auto var(--space-1)',
    fontVariantNumeric: 'tabular-nums',
  },
  scoreLabel: {
    fontSize: '11px',
    color: 'var(--color-text-3)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  disclaimer: {
    background: 'var(--color-warning-bg)',
    border: '1px solid oklch(85% 0.08 70)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: '13px',
    color: 'oklch(38% 0.12 68)',
    marginBottom: 'var(--space-5)',
    lineHeight: '1.55',
  },
  section: { marginBottom: 'var(--space-5)' },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--color-text-3)',
    marginBottom: 'var(--space-3)',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) 0',
    borderBottom: '1px solid var(--color-border-subtle)',
  },
  rowLeft: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: '160px', flexShrink: 0 },
  missingDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--color-error)',
    flexShrink: 0,
  },
  keyword: { fontWeight: 600, fontSize: '13.5px', color: 'var(--color-text)' },
  suggestion: { fontSize: '13px', color: 'var(--color-text-3)', lineHeight: '1.5', flex: 1 },
  matchRow: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' },
  matchBadge: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    borderRadius: 'var(--radius-full)',
    padding: '3px 10px',
    fontSize: '12px',
    fontWeight: 600,
  },
}
