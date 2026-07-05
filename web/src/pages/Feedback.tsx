import React, { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, AlertOctagon } from 'lucide-react';
import { apiClient } from '../api/client';
import { Card, TableSkeleton, Button } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const Feedback: React.FC = () => {
  const { showToast } = useToast();

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'ALL' | 'SUGGESTION' | 'CORRECTION' | 'AI_FEEDBACK'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const loadFeedback = () => {
    setLoading(true);
    apiClient.get(`/api/v1/admin/feedback?type=${type}&page=${page}&size=15`)
      .then((res) => {
        setFeedbacks(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load user feedback entries', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    setPage(0);
  }, [type]);

  useEffect(() => {
    loadFeedback();
  }, [type, page]);

  const tabStyle = (currentType: typeof type) =>
    `px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
      type === currentType
        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-sm dark:text-blue-400 dark:border-blue-900/50'
        : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
    }`;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Platform Feedback & Learning</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Audit AI corrections, rating reports, and platform suggestions submitted by users</p>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button onClick={() => setType('ALL')} className={tabStyle('ALL')}>All Feedback</button>
        <button onClick={() => setType('SUGGESTION')} className={tabStyle('SUGGESTION')}>Suggestions</button>
        <button onClick={() => setType('CORRECTION')} className={tabStyle('CORRECTION')}>Corrections</button>
        <button onClick={() => setType('AI_FEEDBACK')} className={tabStyle('AI_FEEDBACK')}>AI Ratings</button>
      </div>

      <Card className="p-4">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            {type === 'ALL' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-3">Type</th>
                    <th className="py-3.5 px-3">User</th>
                    <th className="py-3.5 px-3">Feedback / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {feedbacks.length > 0 ? (
                    feedbacks.map((f) => (
                      <tr key={f.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                        <td className="py-3.5 px-3 text-zinc-500">
                          {new Date(f.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase ${
                            f.type === 'SUGGESTION'
                              ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400'
                              : f.type === 'CORRECTION'
                              ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400'
                              : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}>
                            {f.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                          {f.full_name} <span className="font-normal text-zinc-400 dark:text-zinc-650">@{f.username}</span>
                        </td>
                        <td className="py-3.5 px-3 text-zinc-600 dark:text-zinc-400 font-medium break-all max-w-sm">{f.details}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-zinc-400">No feedback found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {type === 'SUGGESTION' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-3">User</th>
                    <th className="py-3.5 px-3">Suggestion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {feedbacks.length > 0 ? (
                    feedbacks.map((f) => (
                      <tr key={f.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                        <td className="py-3.5 px-3 text-zinc-500">{new Date(f.created_at).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">@{f.username} ({f.full_name})</td>
                        <td className="py-3.5 px-3 font-medium text-zinc-650 dark:text-zinc-350 break-words max-w-md">{f.feedback_content}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-10 text-zinc-400">No suggestions submitted yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {type === 'CORRECTION' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-3">User</th>
                    <th className="py-3.5 px-3">Original Merchant</th>
                    <th className="py-3.5 px-3">Corrected Merchant</th>
                    <th className="py-3.5 px-3">Original Category</th>
                    <th className="py-3.5 px-3">Corrected Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {feedbacks.length > 0 ? (
                    feedbacks.map((f) => (
                      <tr key={f.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                        <td className="py-3.5 px-3 text-zinc-500">{new Date(f.created_at).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">@{f.username}</td>
                        <td className="py-3.5 px-3 text-zinc-400 dark:text-zinc-600 line-through">{f.original_merchant || 'None'}</td>
                        <td className="py-3.5 px-3 font-bold text-zinc-800 dark:text-zinc-200">{f.corrected_merchant}</td>
                        <td className="py-3.5 px-3 text-zinc-400 dark:text-zinc-600 line-through">{f.original_category || 'N/A'}</td>
                        <td className="py-3.5 px-3 font-bold text-blue-600 dark:text-blue-400">{f.corrected_category}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-zinc-400">No merchant/category corrections recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {type === 'AI_FEEDBACK' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-3">User</th>
                    <th className="py-3.5 px-3 text-center">Rating</th>
                    <th className="py-3.5 px-3">Transaction Info</th>
                    <th className="py-3.5 px-3">Context / Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {feedbacks.length > 0 ? (
                    feedbacks.map((f) => (
                      <tr key={f.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                        <td className="py-3.5 px-3 text-zinc-500">{new Date(f.created_at).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">@{f.username}</td>
                        <td className="py-3.5 px-3">
                          <div className="flex justify-center">
                            {f.rating === 'HELPFUL' ? (
                              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 px-2 py-0.5 rounded text-xs font-bold">
                                <ThumbsUp className="h-3 w-3" />
                                <span>Helpful</span>
                              </span>
                            ) : f.rating === 'NOT_HELPFUL' ? (
                              <span className="flex items-center gap-1 text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 px-2 py-0.5 rounded text-xs font-bold">
                                <ThumbsDown className="h-3 w-3" />
                                <span>Not Helpful</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 px-2 py-0.5 rounded text-xs font-bold">
                                <AlertOctagon className="h-3 w-3" />
                                <span>Incorrect</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {f.merchant ? `Merchant: ${f.merchant} (₹${Number(f.amount).toLocaleString('en-IN')})` : 'N/A'}
                        </td>
                        <td className="py-3.5 px-3 text-zinc-650 dark:text-zinc-350 italic">{f.context || <span className="text-zinc-400 dark:text-zinc-650">No details provided</span>}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-zinc-400">No AI accuracy feedback records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500">
              Showing page {page + 1} of {totalPages} ({totalElements} total feedbacks)
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
