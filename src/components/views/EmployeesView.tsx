import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Shield, User as UserIcon } from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import type { Employee } from '../../types';

interface EmployeeFormValues {
  name: string;
  email: string;
  department: string;
  role: 'superadmin' | 'employee';
}

const emptyForm: EmployeeFormValues = { name: '', email: '', department: '', role: 'employee' };

function EmployeeModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: EmployeeFormValues;
  onSave: (v: EmployeeFormValues) => Promise<{ error: string | null }>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EmployeeFormValues>(initial ?? emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error } = await onSave(form);
    if (error) { setError(error); setSaving(false); }
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#16213e', border: '1px solid rgba(0,212,255,0.2)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-primary">{initial ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: 'Full Name', key: 'name' as const, type: 'text', placeholder: 'Jane Smith' },
            { label: 'Work Email', key: 'email' as const, type: 'email', placeholder: 'jane@company.com' },
            { label: 'Department', key: 'department' as const, type: 'text', placeholder: 'Sales, Support, etc.' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="text-sm text-secondary block mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                required={key !== 'department'}
                className="w-full px-3 py-2 rounded-lg text-sm text-primary outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
          ))}

          <div>
            <label className="text-sm text-secondary block mb-1.5">Role</label>
            <div className="flex gap-3">
              {(['employee', 'superadmin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all"
                  style={{
                    border: `1px solid ${form.role === r ? '#00d4ff' : 'rgba(255,255,255,0.1)'}`,
                    background: form.role === r ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                    color: form.role === r ? '#00d4ff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {r === 'superadmin' ? <Shield size={14} /> : <UserIcon size={14} />}
                  {r === 'superadmin' ? 'SupaAdmin' : 'Employee'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm text-secondary" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #7b2ff7, #00d4ff)' }}>
              {saving ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesView() {
  const { employees, loading, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary">Employees</h2>
          <p className="text-sm text-secondary mt-0.5">Manage your team — employees added here can register and log in.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #7b2ff7, #00d4ff)' }}
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 rounded-lg text-sm text-primary outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Name', 'Email', 'Department', 'Role', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-secondary text-sm">Loading employees…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-secondary text-sm">
                  {employees.length === 0 ? 'No employees yet. Add your first employee above.' : 'No results for your search.'}
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr
                  key={emp.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-primary">{emp.name}</td>
                  <td className="px-4 py-3 text-secondary">{emp.email}</td>
                  <td className="px-4 py-3 text-secondary">{emp.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={
                        emp.role === 'superadmin'
                          ? { background: 'rgba(123,47,247,0.2)', color: '#a78bfa' }
                          : { background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }
                      }
                    >
                      {emp.role === 'superadmin' ? <Shield size={11} /> : <UserIcon size={11} />}
                      {emp.role === 'superadmin' ? 'SupaAdmin' : 'Employee'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                      style={
                        emp.user_id
                          ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e' }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                      }
                    >
                      {emp.user_id ? <><Check size={10} /> Registered</> : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setEditing(emp); setShowModal(true); }}
                        className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-white/5 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(emp.id)}
                        className="p-1.5 rounded-lg text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-secondary mt-3">
        {employees.length} employee{employees.length !== 1 ? 's' : ''} total
      </p>

      {/* Add/Edit modal */}
      {showModal && (
        <EmployeeModal
          initial={editing ? { name: editing.name, email: editing.email, department: editing.department, role: editing.role } : undefined}
          onSave={async (values) => {
            if (editing) return updateEmployee(editing.id, values);
            return createEmployee(values);
          }}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: '#16213e', border: '1px solid rgba(239,68,68,0.3)' }}>
            <Trash2 size={32} className="mx-auto mb-3 text-red-400" />
            <h3 className="text-base font-semibold text-primary mb-1">Remove employee?</h3>
            <p className="text-sm text-secondary mb-5">This will remove their record. Their tickets will remain.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-lg text-sm text-secondary" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
              <button
                onClick={async () => { await deleteEmployee(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: 'rgba(239,68,68,0.8)' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
