import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { mockReports, Report, ReportPriority, ReportStatus } from './mockData';

type IconName = 'arrow' | 'bell' | 'calendar' | 'camera' | 'check' | 'chevron' | 'clock' | 'file' | 'location' | 'menu' | 'plus' | 'search' | 'upload' | 'wrench' | 'x';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<IconName, JSX.Element> = {
    arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    camera: <><path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3l-1.5-2Z" /><circle cx="12" cy="12" r="3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    upload: <><path d="M12 16V4M8 8l4-4 4 4" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
    wrench: <><path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a5 5 0 0 0 6.4-6.4l-3 3-3-3 3-3Z" /></>,
    x: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return <svg {...common} aria-hidden="true">{paths[name]}</svg>;
}

function routeTo(path: string) {
  window.location.hash = path;
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const tone = status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700';
  return <span className={`campus-status inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{status}</span>;
}

function Priority({ priority }: { priority: ReportPriority }) {
  const tone = priority === 'Urgent' || priority === 'High' ? 'bg-red-500' : priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';
  return <span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><span className={`h-1.5 w-1.5 rounded-full ${tone}`} />{priority}</span>;
}

type ProductNavLink = {
  label: string;
  path: string;
  active?: boolean;
  onClick?: () => void;
};

const studentNavigation: ProductNavLink[] = [
  { label: 'Report an issue', path: '#/report' },
  { label: 'My reports', path: '#/reports' },
  { label: 'How it works', path: '#/how-it-works' },
  { label: 'About us', path: '#/about' },
];

function ProductNavbar({
  open,
  onToggle,
  onClose,
  links = studentNavigation,
  showContact = true,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  links?: ProductNavLink[];
  showContact?: boolean;
}) {
  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, link: ProductNavLink) => {
    if (link.onClick) {
      event.preventDefault();
      link.onClick();
    }
    onClose();
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-black/10 bg-[#f4f4f1]/90 px-5 py-4 backdrop-blur-sm sm:px-8 sm:py-5 md:pr-32">
        <a className="flex items-center gap-3 text-[21px] tracking-tight text-black sm:text-[26px]" style={{ fontFamily: 'var(--font-heading)' }} href="/">CampusFix® <span className="select-none text-[25px] tracking-[-0.02em] sm:text-[30px]">✳︎</span></a>
        <nav className="hidden items-center justify-center gap-5 text-[16px] text-black md:flex lg:gap-7 lg:text-[20px]">
          {links.map((link) => (
            <a
              className={`whitespace-nowrap transition-opacity hover:opacity-60 ${link.active ? 'font-semibold underline underline-offset-4' : ''}`}
              href={link.path}
              key={link.label}
              onClick={(event) => handleLinkClick(event, link)}
              aria-current={link.active ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        {showContact && <a className="hidden justify-self-end text-sm text-black underline underline-offset-2 transition-opacity hover:opacity-60 md:block lg:text-[20px]" href="#/contact">Get in touch</a>}
        <button className="col-start-3 justify-self-end md:hidden" onClick={onToggle} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}>
          <span className={`block h-[2px] w-6 bg-black transition-transform duration-300 ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`mt-[5px] block h-[2px] w-6 bg-black transition-opacity duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`mt-[5px] block h-[2px] w-6 bg-black transition-transform duration-300 ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>
      </header>
      <div className={`fixed inset-0 z-20 flex flex-col justify-center gap-8 bg-white/95 px-8 backdrop-blur-sm transition-opacity duration-300 md:hidden ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!open}>
        {links.map((link) => (
          <a
            className={`text-[30px] leading-none ${link.active ? 'underline underline-offset-4' : ''}`}
            href={link.path}
            onClick={(event) => handleLinkClick(event, link)}
            key={link.label}
            aria-current={link.active ? 'page' : undefined}
          >
            {link.label}
          </a>
        ))}
        {showContact && <a className="text-[30px] leading-none underline underline-offset-4" href="#/contact" onClick={onClose}>Get in touch</a>}
      </div>
    </>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  navigation,
  showContact,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  navigation?: ProductNavLink[];
  showContact?: boolean;
}) {
const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="campus-product-shell min-h-screen bg-[#f4f4f1] text-black">
      <ProductNavbar
        open={mobileOpen}
        onToggle={() => setMobileOpen((value) => !value)}
        onClose={() => setMobileOpen(false)}
        links={navigation}
        showContact={showContact}
      />
      <main className="mx-auto min-h-screen max-w-6xl overflow-x-hidden px-5 pb-16 pt-32 sm:px-8 md:pt-36">
        <div className="mb-9 max-w-2xl">
          <p className="mb-4 text-xs uppercase tracking-[0.16em] text-black/50">CampusFix</p>
          <h1 className="text-[clamp(34px,5vw,60px)] leading-[1.02] tracking-[-0.045em]" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h1>
          {subtitle && <p className="mt-5 max-w-xl text-base leading-7 text-black/65 sm:text-lg">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}

function ActionButton({ children, onClick, secondary = false }: { children: React.ReactNode; onClick?: () => void; secondary?: boolean }) {
  return <button onClick={onClick} className={`campus-pill-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-colors ${secondary ? 'campus-pill-button--secondary border border-slate-200 bg-white text-slate-600 hover:bg-slate-50' : 'bg-[#7257dd] text-white shadow-sm shadow-[#7257dd]/20 hover:bg-[#5d45cc]'}`}>{children}</button>;
}

export function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage('');

    api.listIssues()
      .then((result: { issues: ApiIssue[] }) => {
        if (active) setReports(result.issues.map(mapIssueToReport));
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage(error instanceof Error && error.message.includes('401')
          ? 'Your session may have expired. Please sign in again to view your dashboard.'
          : error instanceof Error
            ? error.message
            : 'Unable to load your dashboard. Please try again.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryToken]);

  const summary = [
    { label: 'Total reports', value: reports.length, note: 'All submitted issues', icon: 'file' as IconName },
    { label: 'Pending', value: reports.filter((report) => report.status === 'Pending').length, note: 'Needs review', icon: 'clock' as IconName },
    { label: 'In progress', value: reports.filter((report) => report.status === 'In progress').length, note: 'Being worked on', icon: 'wrench' as IconName },
    { label: 'Resolved', value: reports.filter((report) => report.status === 'Resolved').length, note: 'Completed issues', icon: 'check' as IconName },
  ];
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return <AppShell title="Dashboard" subtitle="Keep your campus running smoothly. Track your submitted issues and stay up to date."><section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{today}</p><h2 className="text-2xl font-bold tracking-tight sm:text-[27px]" style={{ fontFamily: 'var(--font-heading)' }}>Your campus overview <span className="text-[#7257dd]">✦</span></h2></div><ActionButton onClick={() => routeTo('/report')}><Icon name="plus" size={17} />Report an Issue</ActionButton></section>{isLoading ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Loading your dashboard...</div> : errorMessage ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"><p>{errorMessage}</p><div className="mt-4 flex flex-wrap gap-3"><ActionButton secondary onClick={() => setRetryToken((value) => value + 1)}>Try again</ActionButton>{errorMessage.includes('session') && <ActionButton onClick={() => routeTo('/report')}>Sign in again</ActionButton>}</div></div> : <><section className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">{summary.map((item) => <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" key={item.label}><div className="mb-4 grid h-9 w-9 place-items-center rounded-lg bg-[#eeeaff] text-[#7257dd]"><Icon name={item.icon} size={18} /></div><p className="mb-1.5 text-xs text-slate-500">{item.label}</p><strong className="block text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{item.value}</strong><span className="text-[10px] font-semibold text-emerald-600">{item.note}</span></div>)}</section><section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Recent issues</h2><p className="mt-1 text-xs text-slate-500">Track the latest updates on your submitted reports.</p></div><a className="hidden items-center gap-1 text-xs font-bold text-[#5d45cc] sm:flex" href="#/reports">View all reports <Icon name="arrow" size={15} /></a></div>{reports.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm"><h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>No reports yet</h2><p className="mt-2 text-sm text-slate-500">Submit an issue and it will appear on your dashboard once saved.</p><div className="mt-5"><ActionButton onClick={() => routeTo('/report')}><Icon name="plus" size={16} />Report an Issue</ActionButton></div></div> : <ReportTable reports={reports.slice(0, 3)} />}</section></>}</AppShell>;
}

function ReportTable({ reports, admin = false }: { reports: Report[]; admin?: boolean }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const filtered = reports.filter((report) => {
    const matchesQuery = `${report.id} ${report.title} ${report.category} ${report.location}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === 'All' || report.status === status);
  });
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex items-center gap-2 text-slate-400"><Icon name="search" size={16} /><span className="sr-only">Search reports</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="text-xs outline-none placeholder:text-slate-400" placeholder="Filter reports..." /></label>
      <label className="flex items-center gap-2 text-[11px] text-slate-500"><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5"><option>All</option><option>Pending</option><option>In progress</option><option>Resolved</option></select></label>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="text-[10px] uppercase tracking-wide text-slate-400"><th className="px-4 py-3">Issue</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th>{admin && <th className="px-4 py-3">Action</th>}</tr></thead><tbody>{filtered.map((report) => <tr className="border-t border-slate-100 text-[11px] text-slate-600" key={report.id}><td className="px-4 py-4"><span className="mb-1 block text-[10px] font-bold text-[#7257dd]">{report.id}</span><button className="block max-w-[220px] truncate text-left text-xs font-semibold text-slate-800 hover:text-[#5d45cc]" onClick={() => routeTo(`/reports/${report.id}`)}>{report.title}</button></td><td className="px-4 py-4">{report.category}</td><td className="px-4 py-4"><span className="flex items-center gap-1"><Icon name="location" size={14} />{report.location}</span></td><td className="px-4 py-4">{report.submitted}</td><td className="px-4 py-4"><Priority priority={report.priority} /></td><td className="px-4 py-4"><StatusBadge status={report.status} /></td>{admin && <td className="px-4 py-4"><button className="font-semibold text-[#5d45cc] hover:underline" onClick={() => routeTo(`/admin/${report.id}`)}>Manage</button></td>}</tr>)}</tbody></table></div>
    {filtered.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No reports match these filters.</p>}
  </div>;
}

type ApiIssue = {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  priority: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

function formatIssueDate(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapIssueToReport(issue: ApiIssue): Report {
  const status: ReportStatus = issue.status === 'reported'
    ? 'Pending'
    : issue.status === 'assigned' || issue.status === 'in_progress'
      ? 'In progress'
      : issue.status === 'resolved' || issue.status === 'closed'
        ? 'Resolved'
        : 'Unknown';
  const normalizedPriority = issue.priority
    ? issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)
    : '';
  const priority: ReportPriority = normalizedPriority === 'Low' || normalizedPriority === 'Medium' || normalizedPriority === 'High' || normalizedPriority === 'Urgent'
    ? normalizedPriority
    : 'Not available';

  return {
    id: String(issue.id),
    title: issue.title,
    category: issue.category,
    location: issue.location,
    submitted: formatIssueDate(issue.created_at),
    priority,
    status,
    description: issue.description,
  };
}

export function MyReportsPage() {
  const reportId = window.location.hash.split('/')[2];
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage('');

    api.listIssues()
      .then((result: { issues: ApiIssue[] }) => {
        if (active) setReports(result.issues.map(mapIssueToReport));
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage(error instanceof Error && error.message.includes('401')
          ? 'Your session has expired. Please sign in again to view your reports.'
          : error instanceof Error
            ? error.message
            : 'Unable to load your reports. Please try again.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selected = reports.find((report) => report.id === reportId);
  if (selected) return <ReportDetailPage report={selected} />;

  return <AppShell title="My Reports" subtitle="A complete history of the issues you have reported on campus."><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Report history</h2><p className="mt-1 text-xs text-slate-500">Reports saved to your CampusFix account.</p></div><ActionButton onClick={() => routeTo('/report')}><Icon name="plus" size={16} />Report an Issue</ActionButton></div>{isLoading ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Loading your reports...</div> : errorMessage ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{errorMessage}</div> : reports.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm"><h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>No reports yet</h2><p className="mt-2 text-sm text-slate-500">Submit an issue and it will appear here once saved.</p><div className="mt-5"><ActionButton onClick={() => routeTo('/report')}><Icon name="plus" size={16} />Report an Issue</ActionButton></div></div> : <ReportTable reports={reports} />}</AppShell>;
}

export function ReportIssuePage({ onAuthRequired }: { onAuthRequired?: () => void }) {
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const categories = ['Electrical', 'Plumbing', 'Cleaning', 'Furniture', 'Network', 'Other'] as const;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = location.trim();

    if (trimmedTitle.length < 4 || trimmedTitle.length > 160) {
      setErrorMessage('Title must be between 4 and 160 characters.');
      return;
    }
    if (trimmedDescription.length < 10 || trimmedDescription.length > 5000) {
      setErrorMessage('Description must be between 10 and 5,000 characters.');
      return;
    }
    if (!categories.includes(category as typeof categories[number])) {
      setErrorMessage('Choose one of the available issue categories.');
      return;
    }
    if (trimmedLocation.length < 2 || trimmedLocation.length > 180) {
      setErrorMessage('Location must be between 2 and 180 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createIssue({
        title: trimmedTitle,
        description: trimmedDescription,
        category,
        location: trimmedLocation,
      });
      setSuccessMessage('Report submitted successfully. The issue has been saved.');
      setTitle('');
      setDescription('');
      setCategory('');
      setLocation('');
      setFileName('');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('401')) {
        onAuthRequired?.();
      }
      setErrorMessage(message.includes('401')
        ? 'You must be signed in as a student to submit a report.'
        : error instanceof TypeError
          ? 'Network error: unable to reach CampusFix. Check your connection and try again.'
        : message || 'Unable to submit the report. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <AppShell title="Report an Issue" subtitle="Give us a few details and the right campus team can take a look."><div className="mx-auto max-w-3xl"><div className="mb-5"><h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>What needs fixing?</h2><p className="mt-2 text-sm text-slate-500">Share the details below so the right campus team can take a look.</p></div>{successMessage && <div role="status" className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700"><Icon name="check" size={16} />{successMessage}</div>}{errorMessage && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{errorMessage}</div>}<form noValidate className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" onSubmit={handleSubmit}><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-xs font-semibold text-slate-700">Category<select required value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-normal outline-none focus:border-[#7257dd]"><option value="">Choose a category</option>{categories.map((option) => <option key={option}>{option}</option>)}</select></label><label className="grid gap-2 text-xs font-semibold text-slate-700">Campus location<input required minLength={2} maxLength={180} value={location} onChange={(event) => setLocation(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-3 text-sm font-normal outline-none placeholder:text-slate-400 focus:border-[#7257dd]" placeholder="e.g. West Hall, Room 302" /></label></div><label className="mt-5 grid gap-2 text-xs font-semibold text-slate-700">Issue title<input required minLength={4} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-3 text-sm font-normal outline-none placeholder:text-slate-400 focus:border-[#7257dd]" placeholder="Briefly describe the issue" /></label><label className="mt-5 grid gap-2 text-xs font-semibold text-slate-700">Description<textarea required minLength={10} maxLength={5000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} className="resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm font-normal outline-none placeholder:text-slate-400 focus:border-[#7257dd]" placeholder="Add helpful details, such as when it started or who it affects." /></label><div className="mt-5"><span className="mb-2 block text-xs font-semibold text-slate-700">Photo <span className="font-normal text-slate-400">(optional)</span></span><input ref={fileRef} className="hidden" type="file" accept="image/*" onChange={(event) => setFileName(event.target.files?.[0]?.name || '')} /><button type="button" className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center text-xs text-slate-500 hover:border-[#7257dd] hover:bg-[#fbfaff]" onClick={() => fileRef.current?.click()}><span className="grid h-9 w-9 place-items-center rounded-full bg-[#eeeaff] text-[#7257dd]"><Icon name={fileName ? 'check' : 'upload'} size={17} /></span><strong className="text-slate-700">{fileName || 'Upload a photo'}</strong><span>Photo selection is not uploaded yet. PNG, JPG or WEBP up to 10MB</span></button></div><div className="mt-7 flex justify-end gap-3"><ActionButton secondary onClick={() => routeTo('/dashboard')}>Cancel</ActionButton><button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="campus-pill-button inline-flex items-center justify-center gap-2 rounded-full bg-[#7257dd] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#7257dd]/20 transition-colors hover:bg-[#5d45cc] disabled:cursor-not-allowed disabled:opacity-60"><Icon name="arrow" size={16} />{isSubmitting ? 'Submitting...' : 'Submit report'}</button></div></form></div></AppShell>;
}

function ReportDetailPage({ report }: { report: Report }) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  return <AppShell title={report.id} subtitle="Report details and the latest available status."><div className="mx-auto max-w-3xl"><button className="mb-5 text-xs font-semibold text-[#5d45cc] hover:underline" onClick={() => routeTo('/reports')}>← Back to My Reports</button><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row"><div><StatusBadge status={status} /><h2 className="mt-3 text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{report.title}</h2><p className="mt-2 text-xs text-slate-500">Submitted {report.submitted} · {report.location}</p></div><Priority priority={report.priority} /></div><dl className="grid gap-5 py-6 sm:grid-cols-2"><div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Category</dt><dd className="mt-1 text-sm text-slate-700">{report.category}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Location</dt><dd className="mt-1 flex items-center gap-1 text-sm text-slate-700"><Icon name="location" size={15} />{report.location}</dd></div><div className="sm:col-span-2"><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Description</dt><dd className="mt-1 text-sm leading-6 text-slate-600">{report.description}</dd></div></dl><div className="rounded-lg bg-[#f8f7ff] p-4 text-xs text-slate-600"><strong className="text-slate-800">Mock status timeline</strong><p className="mt-1">Status changes shown here are frontend-only and are not persisted.</p></div><div className="mt-5 flex items-center gap-3"><label className="text-xs font-semibold text-slate-700">Preview status<select value={status} onChange={(event) => setStatus(event.target.value as ReportStatus)} className="ml-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"><option>Pending</option><option>In progress</option><option>Resolved</option></select></label></div></div></div></AppShell>;
}

export function AdminDashboardPage() {
  const adminId = window.location.hash.split('/')[2];
  const selected = mockReports.find((report) => report.id === adminId);
  if (selected) return <AdminIssueDetail report={selected} />;
  const counts = [
    { label: 'Open reports', value: mockReports.filter((report) => report.status !== 'Resolved').length, icon: 'file' as IconName },
    { label: 'Needs review', value: mockReports.filter((report) => report.status === 'Pending').length, icon: 'clock' as IconName },
    { label: 'In progress', value: mockReports.filter((report) => report.status === 'In progress').length, icon: 'wrench' as IconName },
    { label: 'Resolved', value: mockReports.filter((report) => report.status === 'Resolved').length, icon: 'check' as IconName },
  ];
  return <AppShell title="Admin overview" subtitle="Operations workspace for reviewing campus issue reports."><div className="mb-6 flex items-end justify-between"><div><h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Issue operations</h2><p className="mt-1 text-xs text-slate-500">Mock operational data for the frontend template.</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">Preview mode</span></div><section className="mb-9 grid grid-cols-2 gap-3 lg:grid-cols-4">{counts.map((item) => <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={item.label}><div className="mb-3 grid h-8 w-8 place-items-center rounded-lg bg-[#eeeaff] text-[#7257dd]"><Icon name={item.icon} size={17} /></div><p className="text-xs text-slate-500">{item.label}</p><strong className="mt-1 block text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{item.value}</strong></div>)}</section><div className="mb-4"><h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>All issue reports</h2><p className="mt-1 text-xs text-slate-500">Use filters to review and manage incoming issues.</p></div><ReportTable reports={mockReports} admin /></AppShell>;
}

function AdminIssueDetail({ report }: { report: Report }) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  return <AppShell title={`Manage ${report.id}`} subtitle="Review the report and preview an operational status update."><div className="mx-auto max-w-3xl"><button className="mb-5 text-xs font-semibold text-[#5d45cc] hover:underline" onClick={() => routeTo('/admin')}>← Back to admin overview</button><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row"><div><span className="text-[10px] font-bold text-[#7257dd]">{report.id}</span><h2 className="mt-2 text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{report.title}</h2><p className="mt-2 text-xs text-slate-500">{report.category} · {report.location} · submitted {report.submitted}</p></div><Priority priority={report.priority} /></div><p className="py-6 text-sm leading-7 text-slate-600">{report.description}</p><div className="rounded-lg border border-slate-200 p-4"><label className="text-xs font-semibold text-slate-700">Update status <select value={status} onChange={(event) => setStatus(event.target.value as ReportStatus)} className="ml-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"><option>Pending</option><option>In progress</option><option>Resolved</option></select></label><p className="mt-2 text-[11px] text-slate-400">This preview does not persist changes or call an API.</p></div></div></div></AppShell>;
}

export function HowItWorksPage() {
  const steps = [['01', 'Spot something', 'Notice a repair, safety, cleanliness, or equipment issue around campus.'], ['02', 'Tell us about it', 'Share the location and a few useful details. A photo can help the right team understand faster.'], ['03', 'Track progress', 'Follow your report from review to resolution in one simple workspace.']];
  return <AppShell title="How It Works" subtitle="A clearer way to help improve the places you learn, live, and connect."><div className="grid gap-4 md:grid-cols-3">{steps.map(([number, title, copy]) => <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" key={number}><span className="text-sm font-bold text-[#7257dd]">{number}</span><h2 className="mt-12 text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p></article>)}</div><div className="mt-6 rounded-xl border border-[#e9e5ff] bg-[#f8f7ff] p-6"><h2 className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Ready to make a difference?</h2><p className="mt-2 text-sm text-slate-600">Start with a clear, specific report. CampusFix is designed to keep the feedback loop visible.</p><div className="mt-4"><ActionButton onClick={() => routeTo('/report')}><Icon name="plus" size={16} />Report an Issue</ActionButton></div></div></AppShell>;
}

export function AboutPage() {
  return <AppShell title="About CampusFix" subtitle="Small fixes add up to a better campus experience."><div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9"><p className="text-2xl font-medium leading-tight tracking-tight sm:text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>CampusFix gives students and campus teams a shared place to turn observations into action.</p><p className="mt-6 text-sm leading-7 text-slate-600">This frontend template demonstrates the public and operational experiences. Reports, status changes, uploads, and accounts are intentionally represented with mock data until the Node.js/Express API is connected.</p><div className="mt-8 flex flex-wrap gap-3"><ActionButton onClick={() => routeTo('/report')}><Icon name="plus" size={16} />Report an Issue</ActionButton><a className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50" href="#/contact">Contact the team <Icon name="arrow" size={15} /></a></div></div></AppShell>;
}

export function ContactPage() {
  return <AppShell title="Contact CampusFix" subtitle="Questions, ideas, or feedback about your campus experience?"><div className="grid max-w-4xl gap-5 md:grid-cols-[1.2fr_0.8fr]"><div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-medium tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Start a conversation.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">This contact surface is ready for a future API connection. For now, email the CampusFix team directly.</p><a className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-bold text-white hover:bg-slate-800" href="mailto:hello@campusfix.co">hello@campusfix.co <Icon name="arrow" size={15} /></a></div><div className="rounded-xl border border-slate-200 bg-[#ecece8] p-6 sm:p-8"><span className="text-xs font-bold uppercase tracking-widest text-slate-500">Good to know</span><p className="mt-8 text-lg leading-7 text-slate-700" style={{ fontFamily: 'var(--font-heading)' }}>Clear details make it easier for campus teams to help.</p><a className="mt-6 inline-flex items-center gap-2 text-xs font-bold underline underline-offset-4" href="#/how-it-works">How it works <Icon name="arrow" size={15} /></a></div></div></AppShell>;
}
