
import {
  ArrowUpRight,
  Building2,
  Clock3,
  FileText,
  MapPin,
  Plus,
  Wrench,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
}

function statusLabel(status) {
  const labels = {
    reported: 'Pending',
    assigned: 'Assigned',
    in_progress: 'In progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labels[status] || status;
}

function SummaryCard({ label, value, note, icon: Icon, tone }) {
  return (
    <article className="summary-card">
      <div className={`summary-card__icon summary-card__icon--${tone}`}>
        <Icon size={19} />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span className={`summary-card__note summary-card__note--${tone}`}>
        {note}
      </span>
    </article>
  );
}

function EmptyState({ onReport }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon"><FileText size={28} /></div>
      <h3>No reports yet</h3>
      <p>When you report an issue, you’ll be able to track its progress here.</p>
      <Button icon={Plus} onClick={onReport}>Report an issue</Button>
    </div>
  );
}

function ReportForm({ onCancel, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await api.createIssue({ title, description, category, location });
      await onCreated();
    } catch (err) {
      setError(err.message || 'Could not submit the issue');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="table-card" style={{ padding: 24, marginBottom: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Report a campus issue</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <label>
          Issue title
          <input
            required
            minLength={4}
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Broken classroom light"
            style={formInput}
          />
        </label>

        <label>
          Category
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={formInput}
          >
            {['Electrical', 'Plumbing', 'Cleaning', 'Furniture', 'Network', 'Other']
              .map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>

        <label>
          Campus location
          <input
            required
            minLength={2}
            maxLength={180}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Block B, Room 204"
            style={formInput}
          />
        </label>

        <label>
          Description
          <textarea
            required
            minLength={10}
            maxLength={5000}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue and where it occurs."
            style={formInput}
          />
        </label>

        {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>Cancel</Button>
          <button type="submit" disabled={busy} style={submitButton}>
            {busy ? 'Submitting…' : 'Submit issue'}
          </button>
        </div>
      </form>
    </section>
  );
}

const formInput = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  marginTop: 6,
  padding: 11,
  border: '1px solid #d8d5e4',
  borderRadius: 8,
  font: 'inherit',
};

const submitButton = {
  border: 0,
  borderRadius: 999,
  padding: '11px 18px',
  background: '#7257dd',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
};

export function StudentDashboard({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.listIssues();
      setIssues(result.issues || []);
    } catch (err) {
      setError(err.message || 'Unable to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const counts = {
    total: issues.length,
    pending: issues.filter((i) => i.status === 'reported').length,
    progress: issues.filter((i) => i.status === 'in_progress' || i.status === 'assigned').length,
    resolved: issues.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
  };

  const hasReports = issues.length > 0;

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          onLogout={onLogout}
        />

        <div className="dashboard-content">
          <section className="welcome">
            <div>
              <p className="eyebrow">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <h2>
                Welcome, {user?.fullName || 'Student'}{' '}
                <span aria-hidden="true">✦</span>
              </h2>
              <p className="welcome__copy">
                Keep your campus running smoothly. Report an issue and we’ll take it from there.
              </p>
            </div>
            <button type="button" style={submitButton} onClick={() => setShowForm((v) => !v)}>
              <Plus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {showForm ? 'Close form' : 'Report an issue'}
            </button>
          </section>

          {showForm && (
            <ReportForm
              onCancel={() => setShowForm(false)}
              onCreated={async () => {
                setShowForm(false);
                await loadIssues();
              }}
            />
          )}

          <section className="summary-grid" aria-label="Report summary">
            <SummaryCard label="Total reports" value={counts.total} note="Your submitted issues" icon={FileText} tone="violet" />
            <SummaryCard label="Pending" value={counts.pending} note="Awaiting review" icon={Clock3} tone="amber" />
            <SummaryCard label="In progress" value={counts.progress} note="Being worked on" icon={Wrench} tone="blue" />
            <SummaryCard label="Resolved" value={counts.resolved} note="Completed issues" icon={ArrowUpRight} tone="green" />
          </section>

          <section className="section-heading">
            <div>
              <h2>Recent issues</h2>
              <p>Track the latest updates on your submitted reports.</p>
            </div>
            <button type="button" className="text-link" onClick={loadIssues}>
              Refresh <ArrowUpRight size={16} />
            </button>
          </section>

          {error && (
            <p role="alert" style={{ color: '#b91c1c', margin: '12px 0' }}>
              {error}
            </p>
          )}

          {loading ? (
            <p role="status">Loading your reports…</p>
          ) : hasReports ? (
            <div className="table-card">
              <div className="table-toolbar">
                <span>{issues.length} report{issues.length === 1 ? '' : 's'}</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Issue</th><th>Category</th><th>Location</th>
                      <th>Submitted</th><th>Priority</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue) => (
                      <tr key={issue.id}>
                        <td>
                          <div className="issue-cell">
                            <span className="issue-cell__id">CF-{issue.id}</span>
                            <strong>{issue.title}</strong>
                          </div>
                        </td>
                        <td>{issue.category}</td>
                        <td><span className="location-cell"><MapPin size={15} />{issue.location}</span></td>
                        <td>{formatDate(issue.created_at)}</td>
                        <td>
                          <span className={`priority priority--${String(issue.priority || 'medium').toLowerCase()}`}>
                            <span />{issue.priority || 'medium'}
                          </span>
                        </td>
                        <td><StatusBadge>{statusLabel(issue.status)}</StatusBadge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            !error && <EmptyState onReport={() => setShowForm(true)} />
          )}

          <section className="tip-card">
            <div className="tip-card__icon"><Building2 size={21} /></div>
            <div>
              <strong>Help make campus better</strong>
              <p>Clear details help our facilities team resolve issues faster.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
