import Nav from '../components/Nav.jsx'

export default function Account() {
  return (
    <div style={styles.page}>
      <Nav />
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>Account Settings</h1>
          <p style={styles.subtitle}>Running in local mode — no authentication required.</p>
        </div>

        <div style={styles.card}>
          <div style={styles.row}>
            <span style={styles.label}>Mode</span>
            <span style={styles.value}>Local (single user)</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Database</span>
            <span style={styles.value}>SQLite (resume_tailor.db)</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Auth</span>
            <span style={styles.value}>None</span>
          </div>
        </div>
      </main>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc' },
  main: { maxWidth: '600px', margin: '0 auto', padding: '32px 24px' },
  header: { marginBottom: '24px' },
  title: { margin: '0 0 6px', fontSize: '28px', fontWeight: '700', color: '#0f172a' },
  subtitle: { margin: 0, fontSize: '15px', color: '#64748b' },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '14px',
  },
  label: { fontWeight: '600', color: '#475569' },
  value: { color: '#64748b' },
}
