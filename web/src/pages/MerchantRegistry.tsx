import React, { useEffect, useState } from 'react';
import { Store, Edit3, Search } from 'lucide-react';
import { apiClient } from '../api/client';
import { Button, Card, TableSkeleton, Dialog, Select } from '../components/ui';
import { useToast } from '../context/ToastContext';

export const MerchantRegistry: React.FC = () => {
  const { showToast } = useToast();

  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Edit category modal state
  const [editModal, setEditModal] = useState<{ isOpen: boolean; merchant: any }>({ isOpen: false, merchant: null });
  const [selectedCatName, setSelectedCatName] = useState('');
  const [selectedCatType, setSelectedCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [actionLoading, setActionLoading] = useState(false);

  // Check roles
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

  const categories = [
    { label: 'Unassigned/None', value: 'NONE' },
    { label: 'Food', value: 'FOOD' },
    { label: 'Shopping', value: 'SHOPPING' },
    { label: 'Fuel', value: 'FUEL' },
    { label: 'Rent', value: 'RENT' },
    { label: 'Bills', value: 'BILLS' },
    { label: 'Medical', value: 'MEDICAL' },
    { label: 'Entertainment', value: 'ENTERTAINMENT' },
    { label: 'Education', value: 'EDUCATION' },
    { label: 'Travel', value: 'TRAVEL' },
    { label: 'Salary', value: 'SALARY' },
    { label: 'Refund', value: 'REFUND' },
    { label: 'Other', value: 'OTHER' }
  ];

  const loadMerchants = () => {
    setLoading(true);
    apiClient.get(`/api/v1/admin/merchants?search=${encodeURIComponent(search)}&page=${page}&size=15`)
      .then((res) => {
        setMerchants(res.data.content);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load merchant registry', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMerchants();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadMerchants();
  };

  const handleEditPress = (merch: any) => {
    setEditModal({ isOpen: true, merchant: merch });
    setSelectedCatName(merch.category_name || 'NONE');
    setSelectedCatType(merch.category_type || 'EXPENSE');
  };

  const handleSaveCategory = async () => {
    const { merchant } = editModal;
    if (!merchant) return;

    try {
      setActionLoading(true);
      
      const payload = {
        categoryName: selectedCatName === 'NONE' ? null : selectedCatName,
        categoryType: selectedCatName === 'NONE' ? null : selectedCatType
      };

      await apiClient.put(`/api/v1/admin/merchants/${merchant.id}`, payload);
      showToast('Merchant default category updated successfully', 'success');
      setEditModal({ isOpen: false, merchant: null });
      loadMerchants();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Update failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Merchant Registry</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Manage default spending categories and frequency counters for auto-extracted merchants</p>
      </div>

      <Card className="p-4">
        {/* Search header */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center mb-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search merchants by name..."
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
                  <th className="py-3.5 px-3">Merchant Name</th>
                  <th className="py-3.5 px-3">Normalized Key</th>
                  <th className="py-3.5 px-3">Default Category</th>
                  <th className="py-3.5 px-3">Category Type</th>
                  <th className="py-3.5 px-3 text-center">Auto-Match Frequency</th>
                  <th className="py-3.5 px-3 text-center">Total Platform Spends</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {merchants.length > 0 ? (
                  merchants.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-zinc-400" />
                          <span>{m.clean_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-550 dark:text-zinc-450 font-mono text-xs">{m.merchant_name}</td>
                      <td className="py-3.5 px-3">
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-650 dark:text-zinc-350 font-semibold border border-zinc-200/50 dark:border-zinc-700/50">
                          {m.category_name || <span className="text-zinc-400 dark:text-zinc-600 italic">Unassigned</span>}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {m.category_type ? (
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${
                            m.category_type === 'INCOME' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}>
                            {m.category_type}
                          </span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600 italic text-xs">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-zinc-700 dark:text-zinc-300">{m.frequency_count}</td>
                      <td className="py-3.5 px-3 text-center text-zinc-650 dark:text-zinc-450 font-semibold">{m.transactions_count}</td>
                      <td className="py-3.5 px-3 text-right">
                        {!isReadOnlyAdmin && (
                          <button
                            onClick={() => handleEditPress(m)}
                            className="p-1 text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400"
                            title="Edit Default Category"
                          >
                            <Edit3 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-zinc-400">
                      No merchant entries registered.
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
              Showing page {page + 1} of {totalPages} ({totalElements} total merchants)
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

      {/* Edit Default Category Modal */}
      <Dialog
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, merchant: null })}
        title={`Edit Default Category for "${editModal.merchant?.clean_name}"`}
        footer={
          <>
            <Button
              label="Cancel"
              variant="secondary"
              onClick={() => setEditModal({ isOpen: false, merchant: null })}
              disabled={actionLoading}
            />
            <Button
              label="Save Updates"
              onClick={handleSaveCategory}
              isLoading={actionLoading}
            />
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Default Category"
            value={selectedCatName}
            onChange={(e) => setSelectedCatName(e.target.value)}
            options={categories.map(c => ({ label: c.label, value: c.value }))}
          />
          {selectedCatName !== 'NONE' && (
            <Select
              label="Category Type Mapping"
              value={selectedCatType}
              onChange={(e) => setSelectedCatType(e.target.value as 'INCOME' | 'EXPENSE')}
              options={[
                { label: 'Expense Category', value: 'EXPENSE' },
                { label: 'Income Category', value: 'INCOME' }
              ]}
            />
          )}
          <p className="text-xs text-zinc-400 leading-relaxed">
            Changing this will update the default auto-categorization rules. Existing transactions will remain unaffected, but new manual logs or statement imports matching this merchant name will inherit this default category choice.
          </p>
        </div>
      </Dialog>
    </div>
  );
};
