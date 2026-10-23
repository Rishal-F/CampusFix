
import { Bell, Menu, Search, LogOut } from 'lucide-react';

export function Header({ onMenuClick, user, onLogout }) {
  const name = user?.fullName || 'Student';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <header className="topbar">
      <button
        className="icon-button topbar__menu"
        aria-label="Open navigation"
        onClick={onMenuClick}
      >
        <Menu size={22} />
      </button>

      <div className="topbar__heading">
        <p className="eyebrow">Student portal</p>
        <h1>Dashboard</h1>
      </div>

      <div className="topbar__actions">
        <label className="search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search reports..."
            aria-label="Search reports"
          />
        </label>

        <button
          className="icon-button notification-button"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="profile">
          <div className="avatar">{initials || 'S'}</div>
          <div className="profile__details">
            <strong>{name}</strong>
            <span>{user?.email || 'Student account'}</span>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Sign out"
            title="Sign out"
            onClick={onLogout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
