import { useEffect, useState } from 'react';

function AdminUsersPage({ currentUser }) {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load registered users.');
        if (active) {
          setMembers(data.members || []);
          setTotal(data.total || 0);
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    const timer = window.setTimeout(loadUsers, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const updateRole = async (member) => {
    const role = member.role === 'admin' ? 'user' : 'admin';
    const action = role === 'admin' ? 'grant admin access to' : 'remove admin access from';
    if (!window.confirm(`Are you sure you want to ${action} ${member.name}?`)) return;
    setBusyId(member.id);
    setNotice('');
    setError('');
    try {
      const response = await fetch(`/api/admin/users/${member.id}/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not update this user role.');
      setMembers((current) => current.map((item) => item.id === member.id ? data.member : item));
      setNotice(`${member.name} now has the ${role} role.`);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users Management</h1>
          <p className="page-intro">Review registered accounts and manage administrator roles.</p>
        </div>
        <span className="badge">{total} registered users</span>
      </div>

      <section className="form-card admin-user-search">
        <div className="form-group">
          <label htmlFor="admin-user-query">Search users</label>
          <input
            id="admin-user-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, or fitness goal"
          />
        </div>
      </section>

      {notice && <p className="form-message" role="status">{notice}</p>}
      {error && <p className="camera-error" role="alert">{error}</p>}
      <section className="page-card admin-users-card">
        {loading ? <div className="empty-state">Loading registered users...</div>
          : members.length ? (
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Registered</th><th>Fitness goal</th><th>Role</th><th>Manage role</th></tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{new Date(member.registeredAt).toLocaleDateString()}</td>
                      <td>{member.goal}</td>
                      <td><span className="badge">{member.role}</span></td>
                      <td>
                        {member.id === currentUser?._id
                          ? <span className="muted">Signed-in account</span>
                          : <button className="secondary-button" disabled={busyId === member.id} onClick={() => updateRole(member)}>
                            {busyId === member.id ? 'Updating...' : member.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                          </button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {total > members.length && <p className="estimate-note">Showing the latest {members.length} matching users. Refine the search to find others.</p>}
            </div>
          ) : <div className="empty-state">No users match this search.</div>}
      </section>
      <p className="estimate-note">Role changes are persisted in MongoDB and cannot demote the last administrator.</p>
    </div>
  );
}

export default AdminUsersPage;
