import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ShieldAlert, CheckCircle, Search, AlertTriangle } from 'lucide-react';
import { apiClient } from '../api/client';
import { Button, Card, TableSkeleton, Dialog } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const Users: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Status toggle modal state
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; user: any; targetStatus: string }>({
    isOpen: false,
    user: null,
    targetStatus: '',
  });

  const [actionLoading, setActionLoading] = useState(false);

  // Check admin permissions
  const sessionStr = localStorage.getItem('admin-session');
  let adminRole = 'READ_ONLY_ADMIN';
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      adminRole = session.systemRole;
    } catch (e) {
      console.error(e);
    }
  }

  const isReadOnlyAdmin = adminRole === 'READ_ONLY_ADMIN';

  const loadUsers = () => {
    setLoading(true);
    apiClient.get(`/api/v1/admin/users?search=${encodeURIComponent(search)}&page=${page}&size=10`)
      .then((res) => {
        setUsers(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load users list', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadUsers();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadUsers();
  };

  const handleStatusToggle = async () => {
    const { user, targetStatus } = statusModal;
    if (!user) return;

    try {
      setActionLoading(true);
      await apiClient.put(`/api/v1/admin/users/${user.id}/status`, { status: targetStatus });
      showToast(`User account has been successfully ${targetStatus === 'ACTIVE' ? 'activated' : 'suspended'}.`, 'success');
      setStatusModal({ isOpen: false, user: null, targetStatus: '' });
      loadUsers();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Users Database</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Manage and audit user accounts registered on the platform</p>
      </div>

      <Card className="p-4">
        {/* Search header */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center mb-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, username, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
            />
          </div>
          <Button type="submit" label="Filter" variant="secondary" />
        </form>

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
                  <th className="py-3.5 px-3">Family Space</th>
                  <th className="py-3.5 px-3">Family Role</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Last Login</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{u.full_name}</td>
                      <td className="py-3.5 px-3 text-zinc-500">@{u.username}</td>
                      <td className="py-3.5 px-3 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                      <td className="py-3.5 px-3 text-zinc-700 dark:text-zinc-300 font-medium">
                        {u.family_name || <span className="text-zinc-400 dark:text-zinc-600 italic">None</span>}
                      </td>
                      <td className="py-3.5 px-3">
                        {u.family_role ? (
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${
                            u.family_role === 'ADMIN' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50' : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700/50'
                          }`}>
                            {u.family_role}
                          </span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600 italic text-xs">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                            : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-500">
                        {u.last_login ? new Date(u.last_login).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/users/${u.id}`)}
                            className="p-1 text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400"
                            title="View User Details"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>

                          {!isReadOnlyAdmin && (
                            <>
                              {u.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => setStatusModal({ isOpen: true, user: u, targetStatus: 'SUSPENDED' })}
                                  className="p-1 text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400"
                                  title="Suspend User Account"
                                >
                                  <ShieldAlert className="h-4.5 w-4.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setStatusModal({ isOpen: true, user: u, targetStatus: 'ACTIVE' })}
                                  className="p-1 text-zinc-500 hover:text-emerald-500 dark:hover:text-emerald-400"
                                  title="Activate User Account"
                                >
                                  <CheckCircle className="h-4.5 w-4.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-zinc-400">
                      No user accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500">
              Showing page {page + 1} of {totalPages} ({totalElements} total users)
            </span>
            <div className="flex gap-2">
              <Button
                label="Previous"
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="h-8 text-xs px-3"
              />
              <Button
                label="Next"
                variant="secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="h-8 text-xs px-3"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Status Toggle Modal */}
      <Dialog
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ isOpen: false, user: null, targetStatus: '' })}
        title={statusModal.targetStatus === 'SUSPENDED' ? 'Suspend User Account?' : 'Activate User Account?'}
        footer={
          <>
            <Button
              label="Cancel"
              variant="secondary"
              onClick={() => setStatusModal({ isOpen: false, user: null, targetStatus: '' })}
              disabled={actionLoading}
            />
            <Button
              label={statusModal.targetStatus === 'SUSPENDED' ? 'Yes, Suspend' : 'Yes, Activate'}
              variant={statusModal.targetStatus === 'SUSPENDED' ? 'danger' : 'primary'}
              onClick={handleStatusToggle}
              isLoading={actionLoading}
            />
          </>
        }
      >
        <p className="leading-relaxed">
          Are you sure you want to {statusModal.targetStatus.toLowerCase()} the user account <strong>"{statusModal.user?.full_name}"</strong> (@{statusModal.user?.username})?
        </p>
        {statusModal.targetStatus === 'SUSPENDED' && (
          <p className="mt-2 text-rose-500 font-semibold flex items-center gap-1.5 text-xs">
            <AlertTriangle className="h-4.5 w-4.5" />
            <span>This will block the user from accessing the mobile application.</span>
          </p>
        )}
      </Dialog>
    </div>
  );
};
