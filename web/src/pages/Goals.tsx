import React, { useEffect, useState } from 'react';
import { Target, Users } from 'lucide-react';
import { apiClient } from '../api/client';
import { Card, TableSkeleton, Button } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const Goals: React.FC = () => {
  const { showToast } = useToast();

  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const loadGoals = () => {
    setLoading(true);
    apiClient.get(`/api/v1/admin/goals?page=${page}&size=10`)
      .then((res) => {
        setGoals(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load goals list', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadGoals();
  }, [page]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Platform Savings Goals</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Monitor savings goals and contributions progress across all families</p>
      </div>

      <Card className="p-4">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-3">Goal Name</th>
                  <th className="py-3.5 px-3">Family Space</th>
                  <th className="py-3.5 px-3">Target Amount</th>
                  <th className="py-3.5 px-3">Current Savings</th>
                  <th className="py-3.5 px-3">Progress</th>
                  <th className="py-3.5 px-3 text-center">Contributors</th>
                  <th className="py-3.5 px-3">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {goals.length > 0 ? (
                  goals.map((g) => {
                    const progress = Math.min(100, Math.round((g.progress_amount / g.target_amount) * 100)) || 0;
                    return (
                      <tr key={g.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-rose-500" />
                            <span>{g.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-zinc-650 dark:text-zinc-400 font-medium">{g.family_name}</td>
                        <td className="py-3.5 px-3 font-semibold text-zinc-700 dark:text-zinc-300">₹{g.target_amount.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-3 font-bold text-blue-600 dark:text-blue-400">₹{g.progress_amount.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3 min-w-[150px]">
                            <div className="h-2 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{progress}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-950/20 text-zinc-600 dark:text-zinc-400 border border-zinc-150 dark:border-zinc-800">
                            <Users className="h-3.5 w-3.5" />
                            <span>{g.contributors_count || 0}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-zinc-500">
                          {new Date(g.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-zinc-400">
                      No savings goals recorded on the platform.
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
              Showing page {page + 1} of {totalPages} ({totalElements} total goals)
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
