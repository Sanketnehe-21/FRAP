import React, { useEffect, useState } from 'react';
import { Eye, XCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { Button, Card, TableSkeleton, Dialog } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const Transactions: React.FC = () => {
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters State
  const [merchant, setMerchant] = useState('');
  const [type, setType] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [userId, setUserId] = useState('');

  // Selected Transaction for Details View Modal
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const categories = [
    'SALARY', 'TRANSFER_RECEIVED', 'REFUND', 'INTEREST', 'OTHER_INCOME',
    'FOOD', 'SHOPPING', 'FUEL', 'RENT', 'BILLS', 'MEDICAL', 'ENTERTAINMENT',
    'EDUCATION', 'TRAVEL', 'OTHER'
  ];

  const loadTransactions = () => {
    setLoading(true);
    const queryParts = [
      `page=${page}`,
      'size=20',
      merchant ? `merchant=${encodeURIComponent(merchant)}` : '',
      type ? `type=${type}` : '',
      categoryName ? `categoryName=${categoryName}` : '',
      startDate ? `startDate=${startDate}` : '',
      endDate ? `endDate=${endDate}` : '',
      familyId ? `familyId=${familyId}` : '',
      userId ? `userId=${userId}` : ''
    ].filter(Boolean);

    apiClient.get(`/api/v1/admin/transactions?${queryParts.join('&')}`)
      .then((res) => {
        setTransactions(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load transactions list', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTransactions();
  }, [page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadTransactions();
  };

  const handleResetFilters = () => {
    setMerchant('');
    setType('');
    setCategoryName('');
    setStartDate('');
    setEndDate('');
    setFamilyId('');
    setUserId('');
    setPage(0);
    // Use setTimeout so states update before calling load
    setTimeout(() => {
      loadTransactions();
    }, 50);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast('No transaction data to export', 'error');
      return;
    }

    showToast('Preparing CSV export...', 'info');

    // We can fetch up to 200 items for the CSV export to make it a more complete export!
    const queryParts = [
      'page=0',
      'size=200',
      merchant ? `merchant=${encodeURIComponent(merchant)}` : '',
      type ? `type=${type}` : '',
      categoryName ? `categoryName=${categoryName}` : '',
      startDate ? `startDate=${startDate}` : '',
      endDate ? `endDate=${endDate}` : '',
      familyId ? `familyId=${familyId}` : '',
      userId ? `userId=${userId}` : ''
    ].filter(Boolean);

    apiClient.get(`/api/v1/admin/transactions?${queryParts.join('&')}`)
      .then((res) => {
        const rowsToExport = res.data.content;
        const headers = ['Transaction ID', 'Family Name', 'User Name', 'Merchant', 'Type', 'Category', 'Amount', 'Date', 'Source', 'Created At'];
        const csvContent = [
          headers.join(','),
          ...rowsToExport.map((t: any) => [
            t.id,
            `"${t.family_name.replace(/"/g, '""')}"`,
            `"${t.full_name.replace(/"/g, '""')}"`,
            `"${(t.merchant || 'Transfer/Other').replace(/"/g, '""')}"`,
            t.type,
            t.category_name || 'N/A',
            t.amount,
            t.transaction_date.slice(0, 10),
            t.source,
            t.created_at
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `frap_transactions_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('CSV export downloaded successfully', 'success');
      })
      .catch((err) => {
        console.error(err);
        showToast('CSV export failed', 'error');
      });
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Global Transactions Log</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Audit financial transactions across all family spaces on the platform</p>
        </div>
        <Button
          label="Export CSV"
          variant="secondary"
          onClick={handleExportCSV}
          className="flex items-center gap-2"
          disabled={loading}
        />
      </div>

      {/* Filters Form */}
      <Card className="p-5">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4">Filter Log Entries</h2>
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Merchant</label>
            <input
              type="text"
              placeholder="e.g. Amazon"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="px-3 py-1.5 w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-3 py-1.5 w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            >
              <option value="">All Types</option>
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Category</label>
            <select
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="px-3 py-1.5 w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Date Start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Date End</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Family ID</label>
            <input
              type="text"
              placeholder="UUID"
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              className="px-3 py-1.5 w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">User ID</label>
            <input
              type="text"
              placeholder="UUID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="px-3 py-1.5 w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" label="Filter" className="flex-1 py-1.5" />
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              title="Reset Filters"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </form>
      </Card>

      {/* Transactions Table */}
      <Card className="p-4">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Merchant</th>
                  <th className="py-3 px-3">Family Space</th>
                  <th className="py-3 px-3">User Account</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                      <td className="py-3 px-3 text-zinc-500">
                        {new Date(t.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">{t.merchant || 'Transfer/Other'}</td>
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 font-medium">{t.family_name}</td>
                      <td className="py-3 px-3 text-zinc-500">@{t.username}</td>
                      <td className="py-3 px-3">
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400 font-medium">
                          {t.category_name || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-500 text-xs font-semibold">{t.source}</td>
                      <td className={`py-3 px-3 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedTx(t)}
                          className="p-1 text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-zinc-400">
                      No financial transactions recorded matching filters.
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
              Showing page {page + 1} of {totalPages} ({totalElements} total transactions)
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

      {/* Transaction Details Modal */}
      <Dialog
        isOpen={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
        title="Transaction Details Audit"
        footer={
          <Button
            label="Close Audit View"
            variant="secondary"
            onClick={() => setSelectedTx(null)}
          />
        }
      >
        {selectedTx && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Transaction ID</span>
              <span className="font-mono text-xs">{selectedTx.id}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Family Space</span>
              <span className="font-medium">{selectedTx.family_name}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Recorded By</span>
              <span>{selectedTx.full_name} (@{selectedTx.username})</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Merchant Name</span>
              <span className="font-semibold">{selectedTx.merchant || 'Transfer/Other'}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Category Type</span>
              <span>{selectedTx.type}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Category Name</span>
              <span>{selectedTx.category_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Amount</span>
              <span className={`font-bold ${selectedTx.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                ₹{selectedTx.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Date of Transaction</span>
              <span>{new Date(selectedTx.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Detection Source</span>
              <span className="font-semibold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded border border-blue-100/50 dark:border-blue-900/50">
                {selectedTx.source}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Created At</span>
              <span>{new Date(selectedTx.created_at).toLocaleString('en-IN')}</span>
            </div>
            {selectedTx.description && (
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase text-xs">Notes / Description</span>
                <p className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded border border-zinc-150 dark:border-zinc-800 italic text-zinc-600 dark:text-zinc-300">
                  {selectedTx.description}
                </p>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};
