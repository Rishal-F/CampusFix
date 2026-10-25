
import { useEffect, useState } from 'react';
import { api } from './api/client';
import { AuthPanel } from './auth/AuthPanel';
import { StudentDashboard } from './student/StudentDashboard';

export function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    api.me()
      .then((result) => {
        if (active) setUser(result.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }

  if (checking) {
    return <main style={{ padding: 32 }}>Checking your session…</main>;
  }

  if (!user) {
    return <AuthPanel onLogin={setUser} />;
  }

  if (user.role !== 'student') {
    return (
      <main style={{ padding: 32 }}>
        This account is not a student account. Please use the appropriate portal.
        <button onClick={handleLogout}>Sign out</button>
      </main>
    );
  }

  return <StudentDashboard user={user} onLogout={handleLogout} />;
}
