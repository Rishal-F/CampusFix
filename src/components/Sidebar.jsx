import { ClipboardList, FilePlus2, LayoutDashboard, LifeBuoy, LogOut, X } from 'lucide-react';

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'My Reports', icon: ClipboardList },
  { label: 'Report an Issue', icon: FilePlus2 },
];

export function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__top">
          <a className="brand" href="/" aria-label="CampusFix home">
            <span className="brand__mark">C</span>
            <span>Campus<span className="brand__accent">Fix</span></span>
          </a>
          <button className="icon-button sidebar__close" aria-label="Close navigation" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="sidebar__label">Workspace</p>
        <nav className="sidebar__nav" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon, active }) => (
            <a className={`sidebar__link ${active ? 'sidebar__link--active' : ''}`} href={`#${label.toLowerCase().replaceAll(' ', '-')}`} key={label}>
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
              {label === 'My Reports' && <span className="sidebar__count">3</span>}
            </a>
          ))}
        </nav>

        <div className="sidebar__help">
          <div className="sidebar__help-icon"><LifeBuoy size={18} /></div>
          <strong>Need a hand?</strong>
          <p>Our campus support team is here for you.</p>
          <a href="#support">Visit help center <span aria-hidden="true">→</span></a>
        </div>
        <button className="sidebar__logout"><LogOut size={18} /> Sign out</button>
      </aside>
    </>
  );
}
