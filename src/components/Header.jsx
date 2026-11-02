import { Bell, Menu, Search } from 'lucide-react';

export function Header({ onMenuClick }) {
  return (
    <header className="topbar">
      <button className="icon-button topbar__menu" aria-label="Open navigation" onClick={onMenuClick}>
        <Menu size={22} />
      </button>
      <div className="topbar__heading">
        <p className="eyebrow">Student portal</p>
        <h1>Dashboard</h1>
      </div>
      <div className="topbar__actions">
        <label className="search">
          <Search size={18} />
          <input type="search" placeholder="Search reports..." aria-label="Search reports" />
          <kbd>⌘ K</kbd>
        </label>
        <button className="icon-button notification-button" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-button__dot" />
        </button>
        <div className="profile">
          <div className="avatar">AR</div>
          <div className="profile__details">
            <strong>Alex Rivera</strong>
            <span>Computer Science</span>
          </div>
          <span className="profile__chevron">⌄</span>
        </div>
      </div>
    </header>
  );
}
