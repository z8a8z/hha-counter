import { useState, useEffect } from 'react';
import { getUsers, addUser, updateUserPassword, updateUserRole } from '../../lib/database.js';
import { hashPassword } from '../../lib/auth.js';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  
  const [editingUserId, setEditingUserId] = useState(null);
  const [editPassword, setEditPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await getUsers();
    if (error) {
      setError(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    const hash = await hashPassword(newPassword);
    const { error: addError } = await addUser(newUsername, hash, newRole);
    
    if (addError) {
      alert('خطأ في إضافة المستخدم: ' + addError);
    } else {
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      fetchUsers();
    }
  };

  const handleUpdatePassword = async (userId) => {
    if (!editPassword) return;

    const hash = await hashPassword(editPassword);
    const { error: updateError } = await updateUserPassword(userId, hash);
    
    if (updateError) {
      alert('خطأ في تحديث كلمة المرور: ' + updateError);
    } else {
      alert('تم تحديث كلمة المرور بنجاح');
      setEditingUserId(null);
      setEditPassword('');
    }
  };

  if (loading) return <p>جاري تحميل المستخدمين...</p>;
  if (error) return <p className="error-text">فشل في تحميل المستخدمين: {error}</p>;

  return (
    <div className="user-management">
      <h3>إدارة المستخدمين</h3>
      
      <div className="users-list">
        <table>
          <thead>
            <tr>
              <th>اسم المستخدم</th>
              <th>الدور</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>
                  {u.username === currentUser?.username ? (
                    <span className={`badge ${u.role}`}>
                      {u.role === 'developer' ? 'مطور' : u.role === 'admin' ? 'مدير' : u.role === 'accountant' ? 'محاسب' : 'مستخدم'}
                    </span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={async (e) => {
                        const nextRole = e.target.value;
                        if (nextRole === 'developer' && currentUser?.role !== 'developer') {
                          alert('غير مسموح بتعيين دور مطور');
                          return;
                        }
                        const { error } = await updateUserRole(u.id, nextRole);
                        if (error) {
                          alert('خطأ في تحديث الدور: ' + error);
                        } else {
                          fetchUsers();
                        }
                      }}
                      style={{
                        background: 'var(--bg-input)',
                        color: 'var(--txt-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="user">مستخدم</option>
                      <option value="accountant">محاسب</option>
                      <option value="admin">مدير</option>
                      {(u.role === 'developer' || currentUser?.role === 'developer') && (
                        <option value="developer">مطور</option>
                      )}
                    </select>
                  )}
                </td>
                <td>
                  {editingUserId === u.id ? (
                    <div className="edit-password-form">
                      <input 
                        type="password" 
                        placeholder="كلمة المرور الجديدة" 
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                      />
                      <button onClick={() => handleUpdatePassword(u.id)} className="btn btn-small">حفظ</button>
                      <button onClick={() => setEditingUserId(null)} className="btn btn-small btn-outline">إلغاء</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingUserId(u.id)} className="btn btn-small btn-outline">
                      تغيير كلمة المرور
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} required>
            <option value="user">مستخدم (User)</option>
            <option value="accountant">محاسب (Accountant)</option>
            <option value="admin">مدير (Admin)</option>
            {currentUser?.role === 'developer' && (
              <option value="developer">مطور (Developer)</option>
            )}
          </select>
          <button type="submit" className="btn btn-primary">إضافة مستخدم</button>
        </form>
      </div>
    </div>
  );
}
