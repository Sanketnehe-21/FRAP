import React, { useEffect, useState } from 'react';
import { Globe, Shield } from 'lucide-react';
import { apiClient } from '../api/client';
import { Card, TableSkeleton, Button } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const AuditLogs: React.FC = () => {
  const { showToast } = useToast();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const loadLogs = () => {
    setLoading(true);
    apiClient.get(`/api/v1/admin/audit-logs?page=${page}&size=20`)
      .then((res) => {
        setLogs(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load audit logs', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Platform Audit Logs</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Historical audit logs of platform administrator interactions and security updates</p>
      </div>

      <Card className="p-4">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-3">Timestamp</th>
                  <th className="py-3.5 px-3">Administrator</th>
                  <th className="py-3.5 px-3">Action Event</th>
                  <th className="py-3.5 px-3">Target Scope</th>
                  <th className="py-3.5 px-3">IP Address</th>
                  <th className="py-3.5 px-3">Details / Narrative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {logs.length > 0 ? (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                      <td className="py-3.5 px-3 text-zinc-500 text-xs whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-zinc-850 dark:text-zinc-200">
                        <div className="flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-blue-500" />
                          <span className="truncate max-w-[120px]" title={l.adminFullName}>@{l.adminUsername}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-[10px] font-extrabold font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {l.targetType ? (
                          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                            {l.targetType} ({l.targetId?.slice(0, 8)})
                          </span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-650 italic text-xs">System</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-500 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{l.ipAddress}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-600 dark:text-zinc-400 font-medium text-xs max-w-sm break-words">{l.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-zinc-400">
                      No security audit log entries recorded.
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
              Showing page {page + 1} of {totalPages} ({totalElements} total log entries)
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
    </div>
  );
};
