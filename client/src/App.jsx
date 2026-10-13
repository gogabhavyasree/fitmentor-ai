import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import DashboardPage from './pages/DashboardPage';
import AIWorkoutPage from './pages/AIWorkoutPage';
import FormCheckPage from './pages/FormCheckPage';
import FoodNutritionPage from './pages/FoodNutritionPage';
import BudgetDietPage from './pages/BudgetDietPage';
import MessAssistantPage from './pages/MessAssistantPage';
import ProgressPage from './pages/ProgressPage';
import FitnessProfilePage from './pages/FitnessProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import WeeklySchedulePage from './pages/WeeklySchedulePage';
import DailyCoachPage from './pages/DailyCoachPage';

const navigation = [
  { label: 'Dashboard', path: '/' },
  { label: 'Daily Coach', path: '/daily-coach' },
  { label: 'AI Workout', path: '/ai-workout' },
  { label: 'Weekly Calendar', path: '/schedule' },
  { label: 'Form Check', path: '/form-check' },
  { label: 'Food Nutrition', path: '/food-nutrition' },
  { label: 'Budget Diet', path: '/budget-diet' },
  { label: 'Mess Assistant', path: '/mess-assistant' },
  { label: 'Progress', path: '/progress' },
  { label: 'Fitness Profile', path: '/fitness-profile' },
];

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const adminNavigation = [
  { label: 'Overview', path: '/admin' },
  { label: 'Users', path: '/admin/users' },
];

const AdminShell = ({ user, onLogout, children }) => (
  <div className="app-shell">
    <aside className="sidebar admin-sidebar">
      <div className="brand-box">
        <span className="brand-mark">F</span>
        <div>
          <h2>FitMentor <span>AI</span></h2>
          <p>ADMIN CONSOLE</p>
        </div>
      </div>
      <p className="nav-caption">ADMINISTRATION</p>
      <nav className="nav-menu">
        {adminNavigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            end={item.path === '/admin'}
          >
            {item.label}
          </NavLink>
        ))}
        <NavLink to="/" className="nav-link">Return to app</NavLink>
      </nav>
      <div className="user-box">
        <span className="avatar">{(user?.name || 'A').slice(0, 1).toUpperCase()}</span>
        <div className="user-details">
          <strong>{user?.name || 'Admin'}</strong>
          <span>Administrator</span>
        </div>
        <button className="logout-button" onClick={onLogout} aria-label="Logout" title="Logout">↗</button>
      </div>
    </aside>
    <main className="main-panel">
      <header className="topbar">
        <div>
          <span className="topbar-kicker">FITMENTOR AI</span>
          <span className="topbar-subtitle">Administration and usage insights.</span>
        </div>
        <div className="topbar-date"><span className="status-dot" /> Restricted admin area</div>
      </header>
      <div className="page-content">{children}</div>
    </main>
  </div>
);

const localDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function InAppReminder() {
  const [schedule, setSchedule] = useState(null);
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadSchedule = async () => {
      try {
        const response = await fetch('/api/schedule', { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Could not check your workout reminder.');
        if (active) {
          setSchedule(data.schedule);
          setError('');
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      }
    };
    loadSchedule();
    const timer = window.setInterval(() => {
      setNow(new Date());
      loadSchedule();
    }, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!schedule || error) return error ? <p className="reminder-error" role="status">{error}</p> : null;
  const date = localDateKey(now);
  const isDue = schedule.weekdays.includes(now.getDay())
    && !schedule.completedDates.includes(date)
    && `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` >= schedule.reminderTime;
  if (!isDue || localStorage.getItem(`fitmentor-reminder-dismissed-${date}`) === schedule.id) return null;

  return (
    <div className="in-app-reminder" role="status">
      <span>It’s your scheduled workout time. Your reminder shows only while FitMentor is open.</span>
      <div>
        <Link to="/schedule">View today’s plan</Link>
        <button onClick={() => {
          localStorage.setItem(`fitmentor-reminder-dismissed-${date}`, schedule.id);
          setNow(new Date(now.getTime() + 1));
        }}>Dismiss</button>
      </div>
    </div>
  );
}

const AppShell = ({ user, onLogout, children }) => {
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    if (!profileMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileMenuOpen]);

  const handleProfileLogout = async () => {
    setLogoutError('');
    try {
      await onLogout();
      setProfileMenuOpen(false);
      navigate('/login', { replace: true });
    } catch (error) {
      setLogoutError(error.message || 'Unable to log out. Please try again.');
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-box">
          <span className="brand-mark">F</span>
          <div>
            <h2>FitMentor <span>AI</span></h2>
            <p>YOUR EVERYDAY FITNESS GUIDE</p>
          </div>
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="nav-menu">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              end={item.path === '/'}
            >
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Admin</NavLink>}
        </nav>
        <div className="user-box" ref={profileMenuRef}>
          <span className="avatar">{(user?.name || 'G').slice(0, 1).toUpperCase()}</span>
          <div className="user-details">
            <strong>{user?.name || 'Guest'}</strong>
            <span>{user?.goal || 'General Fitness'}</span>
          </div>
          <button
            className="logout-button"
            type="button"
            onClick={() => {
              setLogoutError('');
              setProfileMenuOpen((open) => !open);
            }}
            aria-label="Open profile menu"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            title="Profile menu"
          >
            ↗
          </button>
          {profileMenuOpen && (
            <div className="profile-menu" role="menu">
              <button className="profile-menu-logout" type="button" role="menuitem" onClick={handleProfileLogout}>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                  <path d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H8M12.5 6.5l4 3.5-4 3.5M7 10h9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Logout</span>
              </button>
              {logoutError && <p className="profile-menu-error" role="alert">{logoutError}</p>}
            </div>
          )}
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div>
            <span className="topbar-kicker">YOUR HEALTH, YOUR PACE</span>
            <span className="topbar-subtitle">A little better every day.</span>
          </div>
          <div className="topbar-date">
            <span className="status-dot" />
            Fitness workspace
          </div>
        </header>
        <InAppReminder />
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Could not fetch user', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Unable to log out. Please try again.');
    setUser(null);
  };

  if (loading) {
    return <div className="loading-state">Loading FitMentor AI...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage onRegister={setUser} />} />

        <Route path="/" element={
          <ProtectedRoute user={user}>
            <AppShell user={user} onLogout={handleLogout}>
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/ai-workout" element={
          <ProtectedRoute user={user}>
            <AppShell user={user} onLogout={handleLogout}>
              <AIWorkoutPage user={user} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/daily-coach" element={
          <ProtectedRoute user={user}>
            <AppShell user={user} onLogout={handleLogout}>
              <DailyCoachPage user={user} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/schedule" element={
          <ProtectedRoute user={user}>
            <AppShell user={user} onLogout={handleLogout}>
              <WeeklySchedulePage />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/form-check" element={
          <ProtectedRoute user={user}>
            <AppShell user={user} onLogout={handleLogout}>
              <FormCheckPage />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/food-nutrition" element={
          <ProtectedRoute user={user}>
            <AppShell user={user} onLogout={handleLogout}>
              <FoodNutritionPage user={user} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/budget-diet" element={
          <ProtectedRoute user={user}>
            <AppShell user={user} onLogout={handleLogout}>
              <BudgetDietPage user={user} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/mess-assistant" element={
          <ProtectedRoute user={user}>
            <AppShell user={user} onLogout={handleLogout}>
              <MessAssistantPage />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/progress" element={
          <ProtectedRoute user={user}>
            <AppShell user={user} onLogout={handleLogout}>
              <ProgressPage />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/fitness-profile" element={
          <ProtectedRoute user={user}>
            <AppShell user={user} onLogout={handleLogout}>
              <FitnessProfilePage user={user} setUser={setUser} />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <AdminRoute user={user}>
            <AdminShell user={user} onLogout={handleLogout}>
              <AdminDashboardPage />
            </AdminShell>
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute user={user}>
            <AdminShell user={user} onLogout={handleLogout}>
              <AdminUsersPage currentUser={user} />
            </AdminShell>
          </AdminRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
