import { ArrowUpRight, Building2, ChevronDown, Clock3, FileText, MapPin, Plus, Search, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';

const reports = [
  { id: 'CF-1048', title: 'Leaking faucet in third-floor restroom', category: 'Plumbing', location: 'West Hall', date: 'Oct 18, 2024', priority: 'Medium', status: 'In progress' },
  { id: 'CF-1042', title: 'Projector not working in lecture room', category: 'Equipment', location: 'Science Building', date: 'Oct 14, 2024', priority: 'High', status: 'Pending' },
  { id: 'CF-1031', title: 'Broken light near library entrance', category: 'Electrical', location: 'Main Library', date: 'Oct 08, 2024', priority: 'Low', status: 'Resolved' },
];

const summary = [
  { label: 'Total reports', value: '12', note: '+2 this month', icon: FileText, tone: 'violet' },
  { label: 'Pending', value: '03', note: 'Needs review', icon: Clock3, tone: 'amber' },
  { label: 'In progress', value: '05', note: 'Being worked on', icon: Wrench, tone: 'blue' },
  { label: 'Resolved', value: '04', note: '+12% this month', icon: ArrowUpRight, tone: 'green' },
];

function SummaryCard({ label, value, note, icon: Icon, tone }) {
  return (
    <article className="summary-card">
      <div className={`summary-card__icon summary-card__icon--${tone}`}><Icon size={19} /></div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span className={`summary-card__note summary-card__note--${tone}`}>{note}</span>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state__icon"><FileText size={28} /></div>
      <h3>No reports yet</h3>
      <p>When you report an issue, you’ll be able to track its progress right here.</p>
      <Button icon={Plus}>Report an issue</Button>
    </div>
  );
}

export function StudentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasReports = reports.length > 0;

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="dashboard-content">
          <section className="welcome">
            <div>
              <p className="eyebrow">Tuesday, October 22, 2024</p>
              <h2>Good morning, Alex <span aria-hidden="true">✦</span></h2>
              <p className="welcome__copy">Keep your campus running smoothly. Report an issue and we’ll take it from there.</p>
            </div>
            <Button icon={Plus}>Report an issue</Button>
          </section>

          <section className="summary-grid" aria-label="Report summary">
            {summary.map((item) => <SummaryCard key={item.label} {...item} />)}
          </section>

          <section className="section-heading">
            <div>
              <h2>Recent issues</h2>
              <p>Track the latest updates on your submitted reports.</p>
            </div>
            <a className="text-link" href="#all-reports">View all reports <ArrowUpRight size={16} /></a>
          </section>

          {hasReports ? (
            <div className="table-card">
              <div className="table-toolbar">
                <div className="table-toolbar__search"><Search size={17} /><input placeholder="Filter reports..." aria-label="Filter reports" /></div>
                <button className="filter-button">All statuses <ChevronDown size={16} /></button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Issue</th><th>Category</th><th>Location</th><th>Submitted</th><th>Priority</th><th>Status</th></tr></thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td><div className="issue-cell"><span className="issue-cell__id">{report.id}</span><strong>{report.title}</strong></div></td>
                        <td>{report.category}</td>
                        <td><span className="location-cell"><MapPin size={15} />{report.location}</span></td>
                        <td>{report.date}</td>
                        <td><span className={`priority priority--${report.priority.toLowerCase()}`}><span />{report.priority}</span></td>
                        <td><StatusBadge>{report.status}</StatusBadge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : <EmptyState />}

          <section className="tip-card">
            <div className="tip-card__icon"><Building2 size={21} /></div>
            <div><strong>Help make campus better</strong><p>Clear details and photos help our facilities team resolve issues faster.</p></div>
            <a href="#report">Learn how to report <ArrowUpRight size={16} /></a>
          </section>
        </div>
      </main>
    </div>
  );
}
