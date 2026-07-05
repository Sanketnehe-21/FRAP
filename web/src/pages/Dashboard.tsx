import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  User,
  Receipt,
  FileText,
  Target,
  Mail,
  Activity,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiClient } from '../api/client';
import { Card, Skeleton } from '../components/ui';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/v1/admin/dashboard')
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  const cards = data?.cards || {
    totalFamilies: 0,
    totalUsers: 0,
    totalTransactions: 0,
    totalDocuments: 0,
    totalGoals: 0,
    pendingInvites: 0,
    activeUsersToday: 0,
    newUsersThisMonth: 0
  };

  const charts = data?.charts || {
    userGrowth: [],
    transactionGrowth: [],
    incomeVsExpense: [],
    topCategories: [],
    topMerchants: []
  };

  const activities = data?.recentActivity || {
    registrations: [],
    transactions: [],
    families: []
  };

  const cardMeta = [
    { title: 'Total Families', value: cards.totalFamilies, icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { title: 'Total Users', value: cards.totalUsers, icon: User, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { title: 'Total Transactions', value: cards.totalTransactions, icon: Receipt, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { title: 'Total Documents', value: cards.totalDocuments, icon: FileText, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20' },
    { title: 'Total Goals', value: cards.totalGoals, icon: Target, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
    { title: 'Pending Invites', value: cards.pendingInvites, icon: Mail, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
    { title: 'Active Today', value: cards.activeUsersToday, icon: Activity, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' },
    { title: 'New This Month', value: cards.newUsersThisMonth, icon: UserPlus, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Platform Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Real-time status overview of the FRAP platform</p>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cardMeta.map((c, idx) => {
          const Icon = c.icon;
          return (
            <Card key={idx} className="p-5 flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate">{c.title}</p>
                <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">{Number(c.value).toLocaleString('en-IN')}</p>
              </div>
              <div className={`p-3 rounded-lg ${c.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Line Chart */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4">Monthly User Growth</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                <XAxis dataKey="month" tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Transactions Growth Bar Chart */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4">Monthly Transaction Volume</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.transactionGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                <XAxis dataKey="month" tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Income vs Expense Grouped Bar Chart */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4">Income vs Expense Trends</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.incomeVsExpense} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                <XAxis dataKey="month" tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut & Pie split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top categories Pie */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4">Top Spending Categories</h2>
              <div className="h-44 flex items-center justify-center">
                {charts.topCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.topCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {charts.topCategories.map((_: any, idx: number) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-sm text-zinc-400">No categories recorded</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-4">
              {charts.topCategories.map((c: any, idx: number) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">{c.name}</span>
                  </div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{c.value.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Top merchants list */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4">Top Merchants</h2>
              <div className="h-44 flex items-center justify-center">
                {charts.topMerchants.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.topMerchants}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {charts.topMerchants.map((_: any, idx: number) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-sm text-zinc-400">No merchants spends</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-4">
              {charts.topMerchants.map((m: any, idx: number) => (
                <div key={m.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }} />
                    <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">{m.name}</span>
                  </div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{m.value.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Lists of activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Registrations */}
        <Card className="p-5 flex flex-col justify-between h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Recent Registrations</h3>
              <button onClick={() => navigate('/users')} className="text-blue-500 hover:text-blue-600 font-semibold text-xs flex items-center gap-1">
                <span>View Users</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {activities.registrations.length > 0 ? (
                activities.registrations.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{u.full_name}</p>
                      <p className="text-[10px] font-medium text-zinc-400 truncate">@{u.username} · {u.email}</p>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-zinc-400 py-10">No recent signups</div>
              )}
            </div>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="p-5 flex flex-col justify-between h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Recent Transactions</h3>
              <button onClick={() => navigate('/transactions')} className="text-blue-500 hover:text-blue-600 font-semibold text-xs flex items-center gap-1">
                <span>All Spends</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {activities.transactions.length > 0 ? (
                activities.transactions.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {t.merchant || 'Transfer/Other'}
                      </p>
                      <p className="text-[10px] font-medium text-zinc-400 truncate">by @{t.username}</p>
                    </div>
                    <span className={`text-xs font-bold ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-zinc-400 py-10">No recent transactions</div>
              )}
            </div>
          </div>
        </Card>

        {/* Recent Families */}
        <Card className="p-5 flex flex-col justify-between h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Recent Families</h3>
              <button onClick={() => navigate('/families')} className="text-blue-500 hover:text-blue-600 font-semibold text-xs flex items-center gap-1">
                <span>View Families</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {activities.families.length > 0 ? (
                activities.families.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{f.family_name}</p>
                      <p className="text-[10px] font-medium text-zinc-400 truncate">Admin: @{f.admin_username || 'None'}</p>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                      {new Date(f.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-zinc-400 py-10">No recent families</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
