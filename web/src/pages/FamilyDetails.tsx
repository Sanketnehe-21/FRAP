import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Receipt, Target, FileText, Activity, Download, Trash2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { Card, Skeleton, Button, Dialog } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const FamilyDetails: React.FC = () => {
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'financials' | 'documents' | 'activities'>('members');

  // Deletion state
  const [deleteDocModal, setDeleteDocModal] = useState<{ isOpen: boolean; doc: any }>({ isOpen: false, doc: null });
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
  const isReadOnlyAdmin = adminRole === 'READ_ONLY_ADMIN';

  const loadDetails = () => {
    setLoading(true);
    apiClient.get(`/api/v1/admin/families/${familyId}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load family workspace details', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDetails();
  }, [familyId]);

  const handleDeleteDocument = async () => {
    const { doc } = deleteDocModal;
    if (!doc) return;

    try {
      setActionLoading(true);
      await apiClient.delete(`/api/v1/admin/documents/${doc.id}`);
      showToast('Document has been deleted from storage.', 'success');
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
    // Navigate or call window.open for downloading the document
    const url = `/api/v1/admin/documents/${doc.id}/download`;
    // We can download using an anchor tag with authorization headers, but since standard browser download doesn't support authorization headers easily:
    // We can fetch and create blob, or we can use a temporary token, or we can open a window if endpoint is configured to read token from query param (but we didn't do query param auth).
    // Let's download by fetching the file using apiClient as blob! This is 100% correct, secure and retains auth header!
    showToast('Starting file download...', 'info');
    apiClient.get(url, { responseType: 'blob' })
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
        <Skeleton className="h-40 w-full animate-pulse" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const { familyDetails, members, goals, transactions, documents, invites, activities } = data || {
    familyDetails: {},
    members: [],
    goals: [],
    transactions: [],
    documents: [],
    invites: [],
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
      {/* Back navigation */}
      <div>
        <button
          onClick={() => navigate('/families')}
          className="flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Families</span>
        </button>
      </div>

      {/* Header Info */}
      <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/50">
            Family ID: {familyDetails.id}
          </span>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-2">{familyDetails.family_name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Primary Administrator: <span className="font-semibold text-zinc-700 dark:text-zinc-300">@{familyDetails.admin_username || 'None'}</span> ({familyDetails.admin_name || 'N/A'})
          </p>
        </div>

        <div className="flex flex-col text-right gap-1 self-start md:self-center">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">Registered</span>
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {new Date(familyDetails.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </Card>

      {/* Tab Selectors */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button onClick={() => setActiveTab('members')} className={tabStyle('members')}>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Members & Invites</span>
          </span>
        </button>
        <button onClick={() => setActiveTab('financials')} className={tabStyle('financials')}>
          <span className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span>Financial Profile</span>
          </span>
        </button>
        <button onClick={() => setActiveTab('documents')} className={tabStyle('documents')}>
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Documents & Statements</span>
          </span>
        </button>
        <button onClick={() => setActiveTab('activities')} className={tabStyle('activities')}>
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Activity Feed</span>
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-2">
        {/* --- MEMBERS TAB --- */}
        {activeTab === 'members' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Members table */}
            <Card className="p-6">
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4">Family Members</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Name</th>
                      <th className="py-3 px-3">Username</th>
                      <th className="py-3 px-3">Email Address</th>
                      <th className="py-3 px-3">Family Nickname</th>
                      <th className="py-3 px-3">Workspace Role</th>
                      <th className="py-3 px-3">Joined Date</th>
                      <th className="py-3 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {members.length > 0 ? (
                      members.map((m: any) => (
                        <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                          <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{m.full_name}</td>
                          <td className="py-3 px-3 text-zinc-500">@{m.username}</td>
                          <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">{m.email}</td>
                          <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 font-medium">{m.nickname}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${
                              m.role === 'ADMIN' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50' : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700/50'
                            }`}>
                              {m.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-zinc-500">
                            {new Date(m.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              m.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-zinc-400">No active members found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pending Invitations list */}
            <Card className="p-6">
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4">Pending Member Invitations</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Recipient Name</th>
                      <th className="py-3 px-3">Username Reserved</th>
                      <th className="py-3 px-3">Email Sent To</th>
                      <th className="py-3 px-3">Invite Code</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Expiration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {invites.length > 0 ? (
                      invites.map((i: any) => (
                        <tr key={i.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                          <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{i.full_name}</td>
                          <td className="py-3 px-3 text-zinc-500">@{i.username}</td>
                          <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">{i.email}</td>
                          <td className="py-3 px-3"><span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold">{i.invite_code}</span></td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              i.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-zinc-150 text-zinc-600 dark:bg-zinc-850 dark:text-zinc-400'
                            }`}>
                              {i.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-zinc-500">
                            {new Date(i.expires_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-zinc-400">No invitations issued.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* --- FINANCIALS TAB --- */}
        {activeTab === 'financials' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Goals listing */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <Card className="p-6">
                <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-rose-500" />
                  <span>Family Goals</span>
                </h2>
                <div className="flex flex-col gap-4">
                  {goals.length > 0 ? (
                    goals.map((g: any) => {
                      const pct = Math.min(100, Math.round((g.progress_amount / g.target_amount) * 100)) || 0;
                      return (
                        <div key={g.id} className="border border-zinc-150 dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
                          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{g.name}</span>
                          <span className="text-xs text-zinc-400">
                            ₹{g.progress_amount.toLocaleString('en-IN')} of ₹{g.target_amount.toLocaleString('en-IN')}
                          </span>
                          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 self-end">{pct}% complete</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-xs text-zinc-400 py-10">No goals defined</div>
                  )}
                </div>
              </Card>
            </div>

            {/* Transactions listing (last 50) */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-500" />
                  <span>Recent Family Transactions</span>
                </h2>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 bg-white dark:bg-zinc-900 py-2">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Merchant</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Recorded By</th>
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
                            <td className="py-3 px-3 text-zinc-500">@{t.member_nickname}</td>
                            <td className={`py-3 px-3 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                              {t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-zinc-400">No transactions found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* --- DOCUMENTS TAB --- */}
        {activeTab === 'documents' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <Card className="p-6">
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-500" />
                <span>Uploaded Statements</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">File Name</th>
                      <th className="py-3 px-3">Statement Type</th>
                      <th className="py-3 px-3">File Size</th>
                      <th className="py-3 px-3">Upload Date</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {documents.length > 0 ? (
                      documents.map((d: any) => (
                        <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                          <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{d.file_name}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
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
                                title="Download Document"
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
                        <td colSpan={5} className="text-center py-6 text-zinc-400">No uploaded statement documents.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* --- ACTIVITIES TAB --- */}
        {activeTab === 'activities' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <Card className="p-6">
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                <span>Family Workspace Activity Feed</span>
              </h2>
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
                {activities.length > 0 ? (
                  activities.map((a: any) => (
                    <div key={a.id} className="flex flex-col gap-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 py-1 relative">
                      <div className="absolute h-2.5 w-2.5 rounded-full bg-blue-500 -left-[6px] top-2" />
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{a.message}</p>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                        {new Date(a.created_at).toLocaleString('en-IN')} · Type: <span className="font-semibold">{a.activity_type}</span>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-xs text-zinc-400 py-10">No workspace activity recorded</div>
                )}
              </div>
            </Card>
          </div>
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
