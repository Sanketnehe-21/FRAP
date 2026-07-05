import React, { useEffect, useState } from 'react';
import { FileText, Download, Trash2, Info } from 'lucide-react';
import { apiClient } from '../api/client';
import { Button, Card, TableSkeleton, Dialog } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const Documents: React.FC = () => {
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal states
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; doc: any }>({ isOpen: false, doc: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Check admin roles
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

  const loadDocuments = () => {
    setLoading(true);
    apiClient.get(`/api/v1/admin/documents?page=${page}&size=15`)
      .then((res) => {
        setDocuments(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load statement documents list', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDocuments();
  }, [page]);

  const handleDelete = async () => {
    const { doc } = deleteModal;
    if (!doc) return;

    try {
      setActionLoading(true);
      await apiClient.delete(`/api/v1/admin/documents/${doc.id}`);
      showToast('Document has been permanently deleted from storage.', 'success');
      setDeleteModal({ isOpen: false, doc: null });
      loadDocuments();
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

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Statement Documents Registry</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Audit and manage uploaded PDF, CSV, and Excel statement documents</p>
      </div>

      <Card className="p-4">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-3">File Name</th>
                  <th className="py-3.5 px-3">Family Space</th>
                  <th className="py-3.5 px-3">Uploaded By</th>
                  <th className="py-3.5 px-3">Format</th>
                  <th className="py-3.5 px-3 text-right">File Size</th>
                  <th className="py-3.5 px-3">Upload Date</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {documents.length > 0 ? (
                  documents.map((d) => (
                    <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4.5 w-4.5 text-zinc-400" />
                          <span className="truncate max-w-[200px]" title={d.file_name}>{d.file_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-700 dark:text-zinc-300 font-medium">{d.family_name}</td>
                      <td className="py-3.5 px-3 text-zinc-500">@{d.uploaded_by_username}</td>
                      <td className="py-3.5 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
                          {d.document_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right text-zinc-650 dark:text-zinc-455">
                        {d.file_size_bytes >= 1024 * 1024
                          ? `${(d.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`
                          : `${(d.file_size_bytes / 1024).toFixed(1)} KB`}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-500">
                        {new Date(d.uploaded_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDoc(d)}
                            className="p-1 text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400"
                            title="View Metadata"
                          >
                            <Info className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDownload(d)}
                            className="p-1 text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400"
                            title="Download Statement File"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </button>
                          
                          {!isReadOnlyAdmin && (
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, doc: d })}
                              className="p-1 text-zinc-500 hover:text-red-500 dark:hover:text-red-400"
                              title="Delete Statement File"
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
                    <td colSpan={7} className="text-center py-10 text-zinc-400">
                      No statement documents registered on the platform.
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
              Showing page {page + 1} of {totalPages} ({totalElements} total documents)
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

      {/* View Metadata Modal */}
      <Dialog
        isOpen={selectedDoc !== null}
        onClose={() => setSelectedDoc(null)}
        title="Document Metadata Details"
        footer={
          <Button
            label="Close"
            variant="secondary"
            onClick={() => setSelectedDoc(null)}
          />
        }
      >
        {selectedDoc && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Document ID</span>
              <span className="font-mono text-xs">{selectedDoc.id}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">File Name</span>
              <span className="font-semibold break-all text-right max-w-[200px]">{selectedDoc.file_name}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Family Space</span>
              <span>{selectedDoc.family_name}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Uploaded By</span>
              <span>@{selectedDoc.uploaded_by_username} (User ID: {selectedDoc.uploaded_by})</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Document Type</span>
              <span className="font-bold">{selectedDoc.document_type}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">File Size (Bytes)</span>
              <span>{selectedDoc.file_size_bytes.toLocaleString()} bytes</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Storage Location</span>
              <span className="font-mono text-[10px] break-all text-right max-w-[200px]">{selectedDoc.storage_path}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Upload Date</span>
              <span>{new Date(selectedDoc.uploaded_at).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, doc: null })}
        title="Delete Statement File?"
        footer={
          <>
            <Button
              label="Cancel"
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, doc: null })}
              disabled={actionLoading}
            />
            <Button
              label="Yes, Delete"
              variant="danger"
              onClick={handleDelete}
              isLoading={actionLoading}
            />
          </>
        }
      >
        <p className="leading-relaxed">
          Are you sure you want to permanently delete the statement document <strong>"{deleteModal.doc?.file_name}"</strong>?
        </p>
        <p className="mt-2 text-rose-500 font-semibold text-xs">
          This will physically delete the file from the platform storage and delete its metadata record. This cannot be undone.
        </p>
      </Dialog>
    </div>
  );
};
