import React, { useEffect, useState } from 'react';
import { ShieldCheck, Edit3 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { apiClient } from '../api/client';
import { Button, Card, TableSkeleton, Dialog, Input, Select } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const AdminManagement: React.FC = () => {
  const { showToast } = useToast();

  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; admin: any }>({ isOpen: false, admin: null });
  const [actionLoading, setActionLoading] = useState(false);

  const { register: registerCreate, handleSubmit: handleCreateSubmit, reset: resetCreate, formState: { errors: createErrors } } = useForm();
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors } } = useForm();

  const loadAdmins = () => {
    setLoading(true);
    apiClient.get('/api/v1/admin/admins')
      .then((res) => {
        setAdmins(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load administrative users', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const onCreateAdmin = async (data: any) => {
    try {
      setActionLoading(true);
      await apiClient.post('/api/v1/admin/admins', {
        email: data.email.trim(),
        username: data.username.trim(),
        password: data.password,
        fullName: data.fullName.trim(),
        systemRole: data.systemRole
      });
      showToast('Admin user created successfully', 'success');
      setCreateModalOpen(false);
      resetCreate();
      loadAdmins();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to create admin user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const onEditAdmin = async (data: any) => {
    const { admin } = editModal;
    if (!admin) return;

    try {
      setActionLoading(true);
      const payload: any = {
        fullName: data.fullName.trim(),
        systemRole: data.systemRole,
        status: data.status
      };
      if (data.password && data.password.trim().length >= 8) {
        payload.password = data.password;
      }

      await apiClient.put(`/api/v1/admin/admins/${admin.id}`, payload);
      showToast('Admin user profile updated successfully', 'success');
      setEditModal({ isOpen: false, admin: null });
      resetEdit();
      loadAdmins();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to update admin user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPress = (admin: any) => {
    setEditModal({ isOpen: true, admin });
    // Seed edit form values
    setTimeout(() => {
      resetEdit({
        fullName: admin.full_name,
        systemRole: admin.system_role,
        status: admin.status,
        password: ''
      });
    }, 50);
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Admin Management</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Create, audit, and configure platform administrators and access roles</p>
        </div>
        <Button
          label="Add Administrator"
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2"
        />
      </div>

      <Card className="p-4">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-3">Name</th>
                  <th className="py-3.5 px-3">Username</th>
                  <th className="py-3.5 px-3">Email Address</th>
                  <th className="py-3.5 px-3">Role</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Last Login</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-zinc-850 dark:text-zinc-200">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4.5 w-4.5 text-blue-500" />
                        <span>{adm.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-zinc-500">@{adm.username}</td>
                    <td className="py-3.5 px-3 text-zinc-600 dark:text-zinc-400">{adm.email}</td>
                    <td className="py-3.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 uppercase">
                        {adm.system_role.replace('_ADMIN', '')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        adm.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                          : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                      }`}>
                        {adm.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-zinc-500">
                      {adm.last_login ? new Date(adm.last_login).toLocaleString('en-IN') : 'Never'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleEditPress(adm)}
                        className="p-1 text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400"
                        title="Edit Admin Settings"
                      >
                        <Edit3 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Admin Modal */}
      <Dialog
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); resetCreate(); }}
        title="Create Platform Administrator"
        footer={
          <>
            <Button
              label="Cancel"
              variant="secondary"
              onClick={() => { setCreateModalOpen(false); resetCreate(); }}
              disabled={actionLoading}
            />
            <Button
              label="Create User"
              onClick={handleCreateSubmit(onCreateAdmin)}
              isLoading={actionLoading}
            />
          </>
        }
      >
        <form className="flex flex-col gap-1">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            error={createErrors.fullName?.message as string}
            {...registerCreate('fullName', { required: 'Name is required' })}
          />
          <Input
            label="Username"
            placeholder="janedoe"
            error={createErrors.username?.message as string}
            {...registerCreate('username', {
              required: 'Username is required',
              pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Alphanumeric and underscores only' }
            })}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="jane@example.com"
            error={createErrors.email?.message as string}
            {...registerCreate('email', { required: 'Email is required' })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            error={createErrors.password?.message as string}
            {...registerCreate('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' }
            })}
          />
          <Select
            label="System Role"
            options={[
              { label: 'PLATFORM_ADMIN (Full Write/Read Access)', value: 'PLATFORM_ADMIN' },
              { label: 'SUPPORT_ADMIN (Status Toggles & Document Deletion)', value: 'SUPPORT_ADMIN' },
              { label: 'READ_ONLY_ADMIN (View Only Access)', value: 'READ_ONLY_ADMIN' }
            ]}
            {...registerCreate('systemRole', { required: 'Role is required' })}
          />
        </form>
      </Dialog>

      {/* Edit Admin Modal */}
      <Dialog
        isOpen={editModal.isOpen}
        onClose={() => { setEditModal({ isOpen: false, admin: null }); resetEdit(); }}
        title={`Edit Admin: @${editModal.admin?.username}`}
        footer={
          <>
            <Button
              label="Cancel"
              variant="secondary"
              onClick={() => { setEditModal({ isOpen: false, admin: null }); resetEdit(); }}
              disabled={actionLoading}
            />
            <Button
              label="Save Changes"
              onClick={handleEditSubmit(onEditAdmin)}
              isLoading={actionLoading}
            />
          </>
        }
      >
        <form className="flex flex-col gap-1">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            error={editErrors.fullName?.message as string}
            {...registerEdit('fullName', { required: 'Name is required' })}
          />
          <Select
            label="Account Status"
            options={[
              { label: 'ACTIVE (Allowed access)', value: 'ACTIVE' },
              { label: 'SUSPENDED (Temporary block)', value: 'SUSPENDED' },
              { label: 'DEACTIVATED (Permanent deactivate)', value: 'DEACTIVATED' }
            ]}
            {...registerEdit('status', { required: 'Status is required' })}
          />
          <Select
            label="System Role"
            options={[
              { label: 'PLATFORM_ADMIN', value: 'PLATFORM_ADMIN' },
              { label: 'SUPPORT_ADMIN', value: 'SUPPORT_ADMIN' },
              { label: 'READ_ONLY_ADMIN', value: 'READ_ONLY_ADMIN' }
            ]}
            {...registerEdit('systemRole', { required: 'Role is required' })}
          />
          <Input
            label="Reset Password (Optional)"
            type="password"
            placeholder="Leave blank to keep current password"
            error={editErrors.password?.message as string}
            {...registerEdit('password', {
              minLength: { value: 8, message: 'Password must be at least 8 characters' }
            })}
          />
        </form>
      </Dialog>
    </div>
  );
};
