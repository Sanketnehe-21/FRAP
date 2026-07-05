import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ShieldAlert, CheckCircle, Trash2, Search, AlertTriangle } from 'lucide-react';
import { apiClient } from '../api/client';
import { Button, Card, TableSkeleton, Dialog } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const Families: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal states
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; family: any; targetStatus: string }>({
    isOpen: false,
    family: null,
    targetStatus: '',
  });

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; family: any }>({
    isOpen: false,
    family: null,
  });

  const [actionLoading, setActionLoading] = useState(false);

  // Read admin role from session
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

  const isPlatformAdmin = adminRole === 'PLATFORM_ADMIN';
  const isReadOnlyAdmin = adminRole === 'READ_ONLY_ADMIN';

  const loadFamilies = () => {
    setLoading(true);
    apiClient.get(`/api/v1/admin/families?search=${encodeURIComponent(search)}&page=${page}&size=10`)
      .then((res) => {
        setFamilies(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load families list', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFamilies();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadFamilies();
  };

  const handleStatusToggle = async () => {
    const { family, targetStatus } = statusModal;
    if (!family) return;

    try {
      setActionLoading(true);
      await apiClient.put(`/api/v1/admin/families/${family.id}/status`, { status: targetStatus });
      showToast(`Family workspace has been successfully ${targetStatus === 'ACTIVE' ? 'activated' : 'suspended'}.`, 'success');
      setStatusModal({ isOpen: false, family: null, targetStatus: '' });
      loadFamilies();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFamily = async () => {
    const { family } = deleteModal;
    if (!family) return;

    try {
      setActionLoading(true);
      await apiClient.delete(`/api/v1/admin/families/${family.id}`);
      showToast('Family workspace and all linked user accounts have been permanently deleted.', 'success');
      setDeleteModal({ isOpen: false, family: null });
      loadFamilies();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Deletion failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Families Workspace</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Manage and audit family spaces registered on the platform</p>
        </div>
      </div>

      <Card className="p-4">
        {/* Search Header */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center mb-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by family name..."
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
                  <th className="py-3.5 px-3">Family Name</th>
                  <th className="py-3.5 px-3">Primary Admin</th>
                  <th className="py-3.5 px-3 text-center">Members</th>
                  <th className="py-3.5 px-3 text-center">Transactions</th>
                  <th className="py-3.5 px-3 text-center">Goals</th>
                  <th className="py-3.5 px-3">Created Date</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {families.length > 0 ? (
                  families.map((fam) => (
                    <tr key={fam.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{fam.family_name}</td>
                      <td className="py-3.5 px-3 text-zinc-600 dark:text-zinc-400">{fam.admin_name || <span className="text-zinc-400 dark:text-zinc-600 italic">None</span>}</td>
                      <td className="py-3.5 px-3 text-center font-semibold text-zinc-700 dark:text-zinc-300">{fam.members_count}</td>
                      <td className="py-3.5 px-3 text-center text-zinc-600 dark:text-zinc-400">{fam.transactions_count}</td>
                      <td className="py-3.5 px-3 text-center text-zinc-600 dark:text-zinc-400">{fam.goals_count}</td>
                      <td className="py-3.5 px-3 text-zinc-500">
                        {new Date(fam.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          fam.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                            : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                        }`}>
                          {fam.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/families/${fam.id}`)}
                            className="p-1 text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400"
                            title="View Workspace Details"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                          
                          {!isReadOnlyAdmin && (
                            <>
                              {fam.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => setStatusModal({ isOpen: true, family: fam, targetStatus: 'SUSPENDED' })}
                                  className="p-1 text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400"
                                  title="Suspend Family"
                                >
                                  <ShieldAlert className="h-4.5 w-4.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setStatusModal({ isOpen: true, family: fam, targetStatus: 'ACTIVE' })}
                                  className="p-1 text-zinc-500 hover:text-emerald-500 dark:hover:text-emerald-400"
                                  title="Activate Family"
                                >
                                  <CheckCircle className="h-4.5 w-4.5" />
                                </button>
                              )}

                              {isPlatformAdmin && (
                                <button
                                  onClick={() => setDeleteModal({ isOpen: true, family: fam })}
                                  className="p-1 text-zinc-500 hover:text-red-500 dark:hover:text-red-400"
                                  title="Delete Family"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
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
                      No family workspaces found.
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
              Showing page {page + 1} of {totalPages} ({totalElements} total families)
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
        onClose={() => setStatusModal({ isOpen: false, family: null, targetStatus: '' })}
        title={statusModal.targetStatus === 'SUSPENDED' ? 'Suspend Family Workspace?' : 'Activate Family Workspace?'}
        footer={
          <>
            <Button
              label="Cancel"
              variant="secondary"
              onClick={() => setStatusModal({ isOpen: false, family: null, targetStatus: '' })}
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
          Are you sure you want to {statusModal.targetStatus.toLowerCase()} the family workspace <strong>"{statusModal.family?.family_name}"</strong>?
        </p>
        {statusModal.targetStatus === 'SUSPENDED' && (
          <p className="mt-2 text-rose-500 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            <span>This will automatically suspend the primary administrator user account and restrict their platform access.</span>
          </p>
        )}
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, family: null })}
        title="Delete Family Workspace Permanently?"
        footer={
          <>
            <Button
              label="Cancel"
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, family: null })}
              disabled={actionLoading}
            />
            <Button
              label="Yes, Delete Permanently"
              variant="danger"
              onClick={handleDeleteFamily}
              isLoading={actionLoading}
            />
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="leading-relaxed">
            Are you sure you want to delete the workspace <strong>"{deleteModal.family?.family_name}"</strong>?
          </p>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg text-red-600 dark:text-red-400 text-xs font-medium space-y-1.5">
            <p className="font-bold flex items-center gap-1">
              <AlertTriangle className="h-4.5 w-4.5" />
              <span>CRITICAL WARNING:</span>
            </p>
            <p>1. This will permanently destroy all transactions, goals, bank accounts, and statements linked to this family.</p>
            <p>2. All family member user accounts belonging to this family will be permanently deleted from the system.</p>
            <p>This action is absolute and cannot be reversed.</p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
