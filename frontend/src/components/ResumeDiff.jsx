function getTransformation(text, sourceMap, flaggedClaims) {
  if (!text) return 'unchanged'
  const trimmed = text.trim()
  if (flaggedClaims.some((f) => f.trim() === trimmed)) return 'flagged'
  const entry = sourceMap.find((e) => e.output_text?.trim() === trimmed)
  if (entry) return entry.transformation || 'unchanged'
  return 'unchanged'
}

function TextSpan({ text, transformation }) {
  const highlight = {
    reworded:  { background: 'oklch(97% 0.08 85)',  borderRadius: '3px', padding: '0 2px' },
    reordered: { background: 'var(--color-info-bg)', borderRadius: '3px', padding: '0 2px' },
    flagged:   { background: 'var(--color-error-bg)', borderRadius: '3px', padding: '0 2px', outline: '1px solid oklch(88% 0.08 22)' },
  }
  return (
    <span style={highlight[transformation] || {}}>
      {transformation === 'flagged' && <span title="Flagged: not traceable to original profile" aria-label="Flagged claim">⚠ </span>}
      {text}
    </span>
  )
}

function SectionHeading({ children }) {
  return <h3 style={sd.sectionHeading}>{children}</h3>
}

function BulletItem({ text, transformation }) {
  const bulletStyles = {
    reworded: { background: 'oklch(97% 0.08 85)', borderRadius: '3px' },
    flagged:  { background: 'var(--color-error-bg)', borderRadius: '3px' },
  }
  return (
    <li style={{ ...sd.bullet, ...(bulletStyles[transformation] || {}) }}>
      <TextSpan text={text} transformation={transformation} />
    </li>
  )
}

function OriginalPanel({ profile }) {
  const contact = profile.contact || {}
  return (
    <div style={sd.panel}>
      <div style={sd.panelHeader}>
        <span style={sd.panelLabel}>Original profile</span>
      </div>
      <div style={sd.panelBody} data-scroll>
        {contact.name && <div style={sd.name}>{contact.name}</div>}

        {profile.summary && (
          <>
            <SectionHeading>Summary</SectionHeading>
            <p style={sd.para}>{profile.summary}</p>
          </>
        )}

        {(profile.skills?.length > 0) && (
          <>
            <SectionHeading>Skills</SectionHeading>
            <p style={sd.para}>{profile.skills.join(', ')}</p>
          </>
        )}

        {(profile.experiences?.length > 0) && (
          <>
            <SectionHeading>Experience</SectionHeading>
            {profile.experiences.map((exp, i) => (
              <div key={exp.id || i} style={sd.expBlock}>
                <div style={sd.expTitle}>{exp.title} — {exp.company}</div>
                <div style={sd.expMeta}>{exp.start_date} – {exp.end_date}{exp.location ? ` · ${exp.location}` : ''}</div>
                <ul style={sd.bulletList}>
                  {exp.bullets.map((b, j) => <li key={j} style={sd.bullet}>{b}</li>)}
                </ul>
              </div>
            ))}
          </>
        )}

        {(profile.projects?.length > 0) && (
          <>
            <SectionHeading>Projects</SectionHeading>
            {profile.projects.map((proj, i) => (
              <div key={proj.id || i} style={sd.expBlock}>
                <div style={sd.expTitle}>{proj.name}</div>
                <p style={sd.para}>{proj.purpose}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function TailoredPanel({ tailored, sourceMap, flaggedClaims }) {
  const sm = sourceMap || []
  const fc = flaggedClaims || []
  const summaryT = getTransformation(tailored.summary, sm, fc)

  return (
    <div style={sd.panel}>
      <div style={{ ...sd.panelHeader, background: 'var(--color-accent-subtle)' }}>
        <span style={{ ...sd.panelLabel, color: 'var(--color-accent-text)' }}>Tailored resume</span>
        {fc.length > 0 && (
          <span style={sd.flagBadge}>⚠ {fc.length} flagged claim{fc.length > 1 ? 's' : ''}</span>
        )}
      </div>
      <div style={sd.panelBody} data-scroll>
        {tailored.summary && (
          <>
            <SectionHeading>Summary</SectionHeading>
            <p style={{
              ...sd.para,
              ...(summaryT === 'reworded' ? { background: 'oklch(97% 0.08 85)', borderRadius: '4px', padding: '4px' } : {}),
              ...(summaryT === 'flagged'  ? { background: 'var(--color-error-bg)', borderRadius: '4px', padding: '4px', outline: '1px solid oklch(88% 0.08 22)' } : {}),
            }}>
              {summaryT === 'flagged' && <span>⚠ </span>}
              {tailored.summary}
            </p>
          </>
        )}

        {(tailored.skills?.length > 0) && (
          <>
            <SectionHeading>Skills</SectionHeading>
            <p style={sd.para}>{tailored.skills.join(', ')}</p>
          </>
        )}

        {(tailored.experiences?.length > 0) && (
          <>
            <SectionHeading>Experience</SectionHeading>
            {tailored.experiences.map((exp, i) => (
              <div key={exp.id || i} style={sd.expBlock}>
                <div style={sd.expTitle}>{exp.title} — {exp.company}</div>
                <div style={sd.expMeta}>{exp.start_date} – {exp.end_date}{exp.location ? ` · ${exp.location}` : ''}</div>
                <ul style={sd.bulletList}>
                  {exp.bullets.map((b, j) => {
                    const t = getTransformation(b, sm, fc)
                    return <BulletItem key={j} text={b} transformation={t} />
                  })}
                </ul>
              </div>
            ))}
          </>
        )}

        {(tailored.projects?.length > 0) && (
          <>
            <SectionHeading>Projects</SectionHeading>
            {tailored.projects.map((proj, i) => {
              const t = getTransformation(proj.purpose, sm, fc)
              return (
                <div key={proj.id || i} style={sd.expBlock}>
                  <div style={sd.expTitle}>{proj.name}</div>
                  <p style={sd.para}><TextSpan text={proj.purpose} transformation={t} /></p>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

function Legend() {
  const items = [
    { sample: { background: 'none' }, label: 'Unchanged' },
    { sample: { background: 'oklch(97% 0.08 85)' }, label: 'Reworded' },
    { sample: { background: 'var(--color-info-bg)' }, label: 'Reordered' },
    { sample: { background: 'var(--color-error-bg)', outline: '1px solid oklch(88% 0.08 22)' }, label: 'Flagged' },
  ]
  return (
    <div style={sd.legend}>
      {items.map(({ sample, label }) => (
        <span key={label} style={sd.legendItem}>
          <span style={{ ...sd.legendSwatch, ...sample }}>{label === 'Flagged' ? '⚠' : ''}</span>
          <span>{label}</span>
        </span>
      ))}
    </div>
  )
}

export default function ResumeDiff({ resume, originalProfile }) {
  if (!resume) return null
  return (
    <div>
      <Legend />
      <div style={sd.splitView}>
        <OriginalPanel profile={originalProfile || {}} />
        <TailoredPanel
          tailored={resume.tailored_profile || {}}
          sourceMap={resume.source_map || []}
          flaggedClaims={resume.flagged_claims || []}
        />
      </div>
    </div>
  )
}

const sd = {
  splitView: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-4)',
    marginTop: 'var(--space-4)',
  },
  panel: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'var(--color-surface)',
  },
  panelHeader: {
    background: 'var(--color-surface-raised)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelLabel: {
    fontWeight: 700,
    fontSize: '11px',
    color: 'var(--color-text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  flagBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-error)',
    background: 'var(--color-error-bg)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
  },
  panelBody: {
    padding: 'var(--space-5)',
    fontSize: '13px',
    lineHeight: '1.65',
    color: 'var(--color-text)',
    maxHeight: '70vh',
    overflowY: 'auto',
  },
  name: { fontSize: '17px', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--color-text)' },
  sectionHeading: {
    fontSize: '10.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-text-3)',
    margin: 'var(--space-4) 0 var(--space-2)',
    borderBottom: '1px solid var(--color-border-subtle)',
    paddingBottom: 'var(--space-1)',
  },
  para: { margin: '0 0 var(--space-2)', fontSize: '13px', lineHeight: '1.65' },
  expBlock: { marginBottom: 'var(--space-4)' },
  expTitle: { fontWeight: 600, fontSize: '13px', color: 'var(--color-text)', marginBottom: '2px' },
  expMeta: { fontSize: '12px', color: 'var(--color-text-3)', marginBottom: 'var(--space-1)' },
  bulletList: { paddingLeft: 'var(--space-5)', margin: 'var(--space-1) 0' },
  bullet: { marginBottom: 'var(--space-1)', fontSize: '13px' },
  legend: {
    display: 'flex',
    gap: 'var(--space-5)',
    alignItems: 'center',
    padding: 'var(--space-2) 0',
    marginBottom: 'var(--space-2)',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: '12px',
    color: 'var(--color-text-3)',
  },
  legendSwatch: {
    display: 'inline-block',
    padding: '1px 7px',
    borderRadius: '3px',
    fontSize: '11px',
    border: '1px solid var(--color-border-subtle)',
  },
}
