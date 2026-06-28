import { useState, useEffect, useCallback } from 'react';
import {
  getUsers,
  addUser,
  deleteUser,
  updateUserPassword,
  updateUserRole,
  getUserPermissions,
  getAllUserPermissions,
  updateUserPermissions,
} from '../../lib/database.js';
import { hashPassword } from '../../lib/auth.js';
import { useAuth } from '../../hooks/useAuth.jsx';

const ROLE_LABELS = { developer: 'مطور', admin: 'مدير', accountant: 'محاسب', user: 'مستخدم' };
const ROLE_COLORS = { developer: 'purple', admin: 'blue', accountant: 'green', user: 'gray' };

const ALL_TABS = [
  { key: 'purchases', label: 'مشتريات' },
  { key: 'ready', label: 'جاهز' },
  { key: 'orders', label: 'الطلبيات' },
  { key: 'withdraw', label: 'سحب' },
  { key: 'damaged', label: 'تالف' },
  { key: 'storage', label: 'مخزن' },
  { key: 'report', label: 'تقرير' },
];

function RoleBadge({ role }) {
  const badgeStyle = {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#fff',
    background:
      role === 'developer'
        ? '#7c3aed'
        : role === 'admin'
          ? '#2563eb'
          : role === 'accountant'
            ? '#10b981'
            : '#6b7280',
  };
  return <span style={badgeStyle}>{ROLE_LABELS[role] || role}</span>;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const isDev = currentUser?.role === 'developer';
  const isAdmin = currentUser?.role === 'admin';

  // ── Users state ──────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Add-user form ────────────────────────────────────────────
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  // ── Inline password edit ─────────────────────────────────────
  const [editingUserId, setEditingUserId] = useState(null);
  const [editPassword, setEditPassword] = useState('');

  // ── Authorities panel (developer only) ───────────────────────
  const [allPerms, setAllPerms] = useState({}); // { [userId]: string[] }
  const [selectedPermUserId, setSelectedPermUserId] = useState(null);
  const [permTabs, setPermTabs] = useState([]);
  const [permSaving, setPermSaving] = useState(false);
  const [permMsg, setPermMsg] = useState({ text: '', type: '' }); // type: 'success' | 'error'

  // ── Fetch helpers ────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchErr } = await getUsers();
    if (fetchErr) {
      setError(fetchErr);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, []);

  const fetchAllPermissions = useCallback(async () => {
    const { data, error: permErr } = await getAllUserPermissions();
    if (!permErr && data) {
      const map = {};
      data.forEach((row) => {
        map[row.user_id] = row.allowed_tabs || [];
      });
      setAllPerms(map);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    if (isDev) fetchAllPermissions();
  }, [fetchUsers, fetchAllPermissions, isDev]);

  // ── Handlers ─────────────────────────────────────────────────

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;

    const hash = await hashPassword(newPassword);
    const { error: addError } = await addUser(newUsername.trim(), hash, newRole);

    if (addError) {
      alert('خطأ في إضافة المستخدم: ' + addError);
    } else {
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      await fetchUsers();
      if (isDev) fetchAllPermissions();
    }
  };

  const handleUpdatePassword = async (userId) => {
    if (!editPassword) return;
    const hash = await hashPassword(editPassword);
    const { error: updateErr } = await updateUserPassword(userId, hash);
    if (updateErr) {
      alert('خطأ في تحديث كلمة المرور: ' + updateErr);
    } else {
      alert('تم تحديث كلمة المرور بنجاح');
      setEditingUserId(null);
      setEditPassword('');
    }
  };

  const handleDeleteUser = async (u) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف المستخدم "${u.username}"؟ لا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirmed) return;
    const { error: delErr } = await deleteUser(u.id);
    if (delErr) {
      alert('خطأ في حذف المستخدم: ' + delErr);
    } else {
      fetchUsers();
    }
  };

  const handleRoleChange = async (userId, nextRole) => {
    const { error: roleErr } = await updateUserRole(userId, nextRole);
    if (roleErr) {
      alert('خطأ في تحديث الدور: ' + roleErr);
    } else {
      fetchUsers();
    }
  };

  // ── Authorities helpers ──────────────────────────────────────

  const handleSelectPermUser = async (userId) => {
    setSelectedPermUserId(userId);
    setPermMsg({ text: '', type: '' });

    // Load from cache first, then fetch fresh
    const cached = allPerms[userId];
    if (cached) {
      setPermTabs([...cached]);
    } else {
      setPermTabs([]);
    }

    const { data, error: permErr } = await getUserPermissions(userId);
    if (!permErr) {
      setPermTabs(data || []);
      setAllPerms((prev) => ({ ...prev, [userId]: data || [] }));
    }
  };

  const toggleTab = (tabKey) => {
    setPermTabs((prev) =>
      prev.includes(tabKey)
        ? prev.filter((t) => t !== tabKey)
        : [...prev, tabKey]
    );
  };

  const selectAllTabs = () => setPermTabs(ALL_TABS.map((t) => t.key));
  const deselectAllTabs = () => setPermTabs([]);

  const handleSavePermissions = async () => {
    if (selectedPermUserId == null) return;
    setPermSaving(true);
    setPermMsg({ text: '', type: '' });

    const { error: saveErr } = await updateUserPermissions(
      selectedPermUserId,
      permTabs
    );

    if (saveErr) {
      setPermMsg({ text: 'خطأ في حفظ الصلاحيات: ' + saveErr, type: 'error' });
    } else {
      setPermMsg({ text: 'تم حفظ الصلاحيات بنجاح ✓', type: 'success' });
      setAllPerms((prev) => ({
        ...prev,
        [selectedPermUserId]: [...permTabs],
      }));
    }
    setPermSaving(false);
  };

  // ── Permission helpers ───────────────────────────────────────

  const canChangePassword = (targetUser) => {
    if (targetUser.id === currentUser?.id) return false; // own row
    if (isDev) return true;
    if (isAdmin && targetUser.role === 'user') return true;
    return false;
  };

  const canDeleteUser = (targetUser) => {
    if (targetUser.id === currentUser?.id) return false;
    if (isDev) return true;
    if (isAdmin && targetUser.role === 'user') return true;
    return false;
  };

  const canChangeRole = (targetUser) => {
    if (targetUser.id === currentUser?.id) return false;
    if (isDev && targetUser.role !== 'developer') return true;
    // Developers CAN change other developers' roles too — but the spec says
    // "developer accounts: can't be changed by admins, only by developers"
    if (isDev) return true;
    return false;
  };

  // ── Format date ──────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY with standard numbers
  };

  // ── Render ───────────────────────────────────────────────────

  if (loading) return <p>جاري تحميل المستخدمين...</p>;
  if (error)
    return <p className="error-text">فشل في تحميل المستخدمين: {error}</p>;

  return (
    <div className="user-management">
      <h3>إدارة المستخدمين</h3>

      {/* ── Users Table ──────────────────────────────────────── */}
      <div className="users-list">
        <table>
          <thead>
            <tr>
              <th>اسم المستخدم</th>
              <th>الدور</th>
              <th>تاريخ الإنشاء</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              const showRoleDropdown = canChangeRole(u);

              return (
                <tr key={u.id}>
                  {/* Username */}
                  <td>{u.username}</td>

                  {/* Role */}
                  <td>
                    {isSelf || !showRoleDropdown ? (
                      <RoleBadge role={u.role} />
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{
                          background: 'var(--bg-input)',
                          color: 'var(--txt-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="user">مستخدم</option>
                        <option value="accountant">محاسب</option>
                        <option value="admin">مدير</option>
                        <option value="developer">مطور</option>
                      </select>
                    )}
                  </td>

                  {/* Created At */}
                  <td style={{ color: 'var(--txt-muted)', fontSize: '0.85rem' }}>
                    {formatDate(u.created_at)}
                  </td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Password change */}
                      {canChangePassword(u) && (
                        <>
                          {editingUserId === u.id ? (
                            <div className="edit-password-form">
                              <input
                                type="password"
                                placeholder="كلمة المرور الجديدة"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                              />
                              <button
                                onClick={() => handleUpdatePassword(u.id)}
                                className="btn btn-small"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUserId(null);
                                  setEditPassword('');
                                }}
                                className="btn btn-small btn-outline"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingUserId(u.id);
                                setEditPassword('');
                              }}
                              className="btn btn-small btn-outline"
                            >
                              تغيير كلمة المرور
                            </button>
                          )}
                        </>
                      )}

                      {/* Delete */}
                      {canDeleteUser(u) && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="btn btn-small btn-danger"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add User Form ────────────────────────────────────── */}
      <div className="add-user-card">
        <h4>إضافة مستخدم جديد</h4>
        <form onSubmit={handleAddUser} className="add-user-form">
          <input
            type="text"
            placeholder="اسم المستخدم"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            required
          >
            <option value="user">مستخدم</option>
            <option value="accountant">محاسب</option>
            {isDev && <option value="admin">مدير</option>}
            {isDev && <option value="developer">مطور</option>}
          </select>
          <button type="submit" className="btn btn-primary">
            إضافة مستخدم
          </button>
        </form>
      </div>

      {/* ── Authorities Panel (Developer Only) ───────────────── */}
      {isDev && (
        <div className="authorities-panel">
          <h4>🔑 صلاحيات الوصول للتبويبات</h4>
          <p style={{ color: 'var(--txt-secondary)', marginBottom: '12px', fontSize: '0.9rem' }}>
            بصفتك مطوراً، يمكنك تحديد التبويبات التي يراها كل مستخدم في النظام.
          </p>

          {/* User selector */}
          <div className="authorities-user-selector">
            {users
              .filter((u) => u.role !== 'developer')
              .map((u) => (
                <div
                  key={u.id}
                  className={`user-selector-item${selectedPermUserId === u.id ? ' active' : ''}`}
                  onClick={() => handleSelectPermUser(u.id)}
                >
                  <span>{u.username}</span>
                  <RoleBadge role={u.role} />
                </div>
              ))}
            {users.filter((u) => u.role !== 'developer').length === 0 && (
              <p style={{ color: 'var(--txt-muted)', padding: '8px' }}>
                لا يوجد مستخدمون غير مطورين.
              </p>
            )}
          </div>

          {/* Permissions grid */}
          {selectedPermUserId != null && (
            <>
              <div className="authorities-grid">
                <table>
                  <thead>
                    <tr>
                      <th>التبويب</th>
                      <th>مسموح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_TABS.map((tab) => (
                      <tr key={tab.key}>
                        <td>{tab.label}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={permTabs.includes(tab.key)}
                            onChange={() => toggleTab(tab.key)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="authorities-actions">
                <button
                  onClick={selectAllTabs}
                  className="btn btn-small btn-outline"
                >
                  تحديد الكل
                </button>
                <button
                  onClick={deselectAllTabs}
                  className="btn btn-small btn-outline"
                >
                  إلغاء تحديد الكل
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="btn btn-primary btn-small"
                  disabled={permSaving}
                >
                  {permSaving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
                </button>
              </div>

              {permMsg.text && (
                <p
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    background:
                      permMsg.type === 'success'
                        ? 'rgba(34,197,94,0.12)'
                        : 'rgba(239,68,68,0.12)',
                    color:
                      permMsg.type === 'success' ? '#16a34a' : '#dc2626',
                  }}
                >
                  {permMsg.text}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
