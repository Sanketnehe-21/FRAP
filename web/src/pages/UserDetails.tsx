import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Receipt, Target, FileText, Activity, Download, Trash2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { Card, Skeleton, Dialog, Button } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const UserDetails: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'goals' | 'documents' | 'activities'>('transactions');

  // Deletion modal
  const [deleteDocModal, setDeleteDocModal] = useState<{ isOpen: boolean; doc: any }>({ isOpen: false, doc: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Check role
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

  const loadDetails = () => {
    setLoading(true);
    apiClient.get(`/api/v1/admin/users/${userId}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load user account profile', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDetails();
  }, [userId]);

  const handleDeleteDocument = async () => {
    const { doc } = deleteDocModal;
    if (!doc) return;

    try {
      setActionLoading(true);
      await apiClient.delete(`/api/v1/admin/documents/${doc.id}`);
      showToast('Document has been permanently deleted.', 'success');
      setDeleteDocModal({ isOpen: false, doc: null });
      loadDetails();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Deletion failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (doc: any) => {
    showToast('Starting file download...', 'info');
    apiClient.get(`/api/v1/admin/documents/${doc.id}/download`, { responseType: 'blob' })
      .then((response) => {
        const blob = new Blob([response.data], { type: response.headers['content-type']?.toString() });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', doc.file_name);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        showToast('Download complete.', 'success');
      })
      .catch((err) => {
        console.error(err);
        showToast('File download failed', 'error');
      });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const { userDetails, familyMembership, transactions, goals, documents, activities } = data || {
    userDetails: {},
    familyMembership: null,
    transactions: [],
    goals: [],
    documents: [],
    activities: []
  };

  const tabStyle = (tab: typeof activeTab) =>
    `px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
      activeTab === tab
        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
        : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
    }`;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <button
          onClick={() => navigate('/users')}
          className="flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Users</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-zinc-100 dark:bg-zinc-850 p-4 rounded-xl text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
            <User className="h-10 w-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">{userDetails.full_name}</h1>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                userDetails.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
              }`}>
                {userDetails.status}
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              @{userDetails.username} · {userDetails.email}
            </p>
            {familyMembership ? (
              <p className="text-xs text-zinc-500 mt-2">
                Member of <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => navigate(`/families/${familyMembership.family_id}`)}>
                  {familyMembership.family_name}
                </span> as <span className="font-bold">{familyMembership.family_role}</span> (Nickname: <span className="italic">{familyMembership.nickname}</span>)
              </p>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2 italic">Not linked to any family workspace.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col text-left md:text-right gap-1 self-start md:self-center text-sm font-semibold">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold">Last Login</span>
          <span className="text-zinc-800 dark:text-zinc-200">
            {userDetails.last_login ? new Date(userDetails.last_login).toLocaleString('en-IN') : 'Never'}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mt-2">Created</span>
          <span className="text-zinc-800 dark:text-zinc-200">
            {new Date(userDetails.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button onClick={() => setActiveTab('transactions')} className={tabStyle('transactions')}>
          <span className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span>Transactions</span>
          </span>
        </button>
        <button onClick={() => setActiveTab('goals')} className={tabStyle('goals')}>
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Savings Goals</span>
          </span>
        </button>
        <button onClick={() => setActiveTab('documents')} className={tabStyle('documents')}>
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </span>
        </button>
        <button onClick={() => setActiveTab('activities')} className={tabStyle('activities')}>
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Activity Feed</span>
          </span>
        </button>
      </div>

      {/* Panels */}
      <div className="mt-2">
        {/* --- TRANSACTIONS PANEL --- */}
        {activeTab === 'transactions' && (
          <Card className="p-6 animate-in fade-in duration-200">
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              <span>User Transactions Log (Last 50)</span>
            </h2>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 bg-white dark:bg-zinc-900 py-2">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Merchant</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {transactions.length > 0 ? (
                    transactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                        <td className="py-3 px-3 text-zinc-500">
                          {new Date(t.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{t.merchant || 'Transfer/Other'}</td>
                        <td className="py-3 px-3">
                          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400 font-medium">
                            {t.type === 'INCOME' ? t.incomeCategory || 'INCOME' : t.expenseCategory || 'EXPENSE'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-500 text-xs font-semibold">{t.source}</td>
                        <td className={`py-3 px-3 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-zinc-400">No transactions recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* --- GOALS PANEL --- */}
        {activeTab === 'goals' && (
          <Card className="p-6 animate-in fade-in duration-200">
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-rose-500" />
              <span>Contributed Savings Goals</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.length > 0 ? (
                goals.map((g: any) => {
                  const pct = Math.min(100, Math.round((g.progress_amount / g.target_amount) * 100)) || 0;
                  return (
                    <div key={g.id} className="border border-zinc-150 dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-2 bg-zinc-50/30 dark:bg-zinc-950/10">
                      <span className="font-bold text-sm text-zinc-850 dark:text-zinc-100">{g.name}</span>
                      <span className="text-xs text-zinc-400">
                        ₹{g.progress_amount.toLocaleString('en-IN')} of ₹{g.target_amount.toLocaleString('en-IN')}
                      </span>
                      <div className="h-2 w-full bg-zinc-150 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 self-end">{pct}% complete</span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center text-xs text-zinc-400 py-10">No goals contributions.</div>
              )}
            </div>
          </Card>
        )}

        {/* --- DOCUMENTS PANEL --- */}
        {activeTab === 'documents' && (
          <Card className="p-6 animate-in fade-in duration-200">
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-500" />
              <span>Uploaded Document Files</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">File Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">Uploaded Date</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {documents.length > 0 ? (
                    documents.map((d: any) => (
                      <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                        <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{d.file_name}</td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase border border-zinc-200/50 dark:border-zinc-700/50">
                            {d.document_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-500">
                          {d.file_size_bytes >= 1024 * 1024
                            ? `${(d.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`
                            : `${(d.file_size_bytes / 1024).toFixed(1)} KB`}
                        </td>
                        <td className="py-3 px-3 text-zinc-500">
                          {new Date(d.uploaded_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleDownload(d)}
                              className="p-1 text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400"
                              title="Download Statement"
                            >
                              <Download className="h-4.5 w-4.5" />
                            </button>
                            
                            {!isReadOnlyAdmin && (
                              <button
                                onClick={() => setDeleteDocModal({ isOpen: true, doc: d })}
                                className="p-1 text-zinc-500 hover:text-red-500 dark:hover:text-red-400"
                                title="Delete Document"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-zinc-400">No documents uploaded by this user.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* --- ACTIVITIES PANEL --- */}
        {activeTab === 'activities' && (
          <Card className="p-6 animate-in fade-in duration-200">
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              <span>User Activity Logs (Last 50)</span>
            </h2>
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
              {activities.length > 0 ? (
                activities.map((a: any) => (
                  <div key={a.id} className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 py-1 relative">
                    <div className="absolute h-2.5 w-2.5 rounded-full bg-indigo-500 -left-[6px] top-2" />
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{a.message}</p>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                      {new Date(a.created_at).toLocaleString('en-IN')} · Type: <span className="font-semibold">{a.activity_type}</span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-zinc-400 py-10">No activities logged for this user.</div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Delete Document Modal */}
      <Dialog
        isOpen={deleteDocModal.isOpen}
        onClose={() => setDeleteDocModal({ isOpen: false, doc: null })}
        title="Delete Document File?"
        footer={
          <>
            <Button
              label="Cancel"
              variant="secondary"
              onClick={() => setDeleteDocModal({ isOpen: false, doc: null })}
              disabled={actionLoading}
            />
            <Button
              label="Yes, Delete"
              variant="danger"
              onClick={handleDeleteDocument}
              isLoading={actionLoading}
            />
          </>
        }
      >
        <p className="leading-relaxed">
          Are you sure you want to permanently delete the statement document <strong>"{deleteDocModal.doc?.file_name}"</strong>?
        </p>
        <p className="mt-2 text-rose-500 font-semibold text-xs">
          This will physically delete the file from the platform storage and delete its metadata record. This cannot be undone.
        </p>
      </Dialog>
    </div>
  );
};
