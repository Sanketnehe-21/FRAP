import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Activity, FileCheck, CheckCircle } from 'lucide-react';
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import { apiClient } from '../api/client';
import { Card, Skeleton } from '../components/ui';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/v1/admin/analytics')
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load analytics:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  const { dau = 0, mau = 0, familyGrowth = [], goalGrowth = [], invitations = {}, documents = [], categoryTrends = [], merchantTrends = [] } = data || {};

  // Compute invite success rate
  const totalInvites = Number(invitations.total || 0);
  const activeInvites = Number(invitations.active || 0);
  const successRate = totalInvites > 0 ? Math.round((activeInvites / totalInvites) * 100) : 0;

  const invitePieData = [
    { name: 'Activated', value: activeInvites },
    { name: 'Pending', value: Number(invitations.pending || 0) - Number(invitations.expired || 0) },
    { name: 'Expired', value: Number(invitations.expired || 0) }
  ].filter(item => item.value > 0);

  // Group document uploads by week
  const docChartMap: { [key: string]: any } = {};
  for (const doc of documents) {
    const week = new Date(doc.week_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    if (!docChartMap[week]) {
      docChartMap[week] = { name: week, PDF: 0, CSV: 0, EXCEL: 0 };
    }
    docChartMap[week][doc.document_type] = Number(doc.count);
  }
  const documentTrendsData = Object.values(docChartMap);

  // Format Category Trends (last 6 months)
  const catTrendMap: { [key: string]: any } = {};
  for (const t of categoryTrends) {
    if (!catTrendMap[t.month]) {
      catTrendMap[t.month] = { name: t.month };
    }
    catTrendMap[t.month][t.category_name] = Number(t.total);
  }
  const categoryTrendsData = Object.values(catTrendMap).sort((a: any, b: any) => a.name.localeCompare(b.name));

  // Format Merchant Trends (last 6 months)
  const merchTrendMap: { [key: string]: any } = {};
  for (const t of merchantTrends) {
    if (!merchTrendMap[t.month]) {
      merchTrendMap[t.month] = { name: t.month };
    }
    merchTrendMap[t.month][t.merchant] = Number(t.total);
  }
  const merchantTrendsData = Object.values(merchTrendMap).sort((a: any, b: any) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">System Analytics</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Platform active usage trends and workspace conversion analysis</p>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Daily Active Users (DAU)</span>
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2 block">{dau}</span>
            <span className="text-xs text-zinc-400 font-medium mt-1 block">Active on mobile within last 24h</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3.5 rounded-xl text-blue-600 dark:text-blue-400">
            <Activity className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Monthly Active Users (MAU)</span>
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2 block">{mau}</span>
            <span className="text-xs text-zinc-400 font-medium mt-1 block">Active on mobile within last 30d</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Users className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Invite Activation Success</span>
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2 block">{successRate}%</span>
            <span className="text-xs text-zinc-400 font-medium mt-1 block">
              {activeInvites} activated of {totalInvites} sent
            </span>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/20 p-3.5 rounded-xl text-rose-600 dark:text-rose-400">
            <CheckCircle className="h-6 w-6" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Family Growth Cumulative Area */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-1.5">
            <TrendingUp className="h-4.5 w-4.5 text-blue-500" />
            <span>Cumulative Family Workspace Growth</span>
          </h2>
          <div className="h-72">
            {familyGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={familyGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="famGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="month" tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#famGrowthGrad)" name="Total Families" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-zinc-400">No family growth trends recorded</div>
            )}
          </div>
        </Card>

        {/* Goal Growth Bar */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-1.5">
            <BarChart3 className="h-4.5 w-4.5 text-violet-500" />
            <span>Savings Goals Additions</span>
          </h2>
          <div className="h-72">
            {goalGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="month" tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Goals Created" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-zinc-400">No goals growth recorded</div>
            )}
          </div>
        </Card>

        {/* Document upload trends (by type, stacked bar) */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-1.5">
            <FileCheck className="h-4.5 w-4.5 text-blue-500" />
            <span>Document Uploads by Statement Format</span>
          </h2>
          <div className="h-72">
            {documentTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={documentTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="PDF" stackId="doc" fill="#EF4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="CSV" stackId="doc" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="EXCEL" stackId="doc" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-zinc-400">No statement uploads recorded</div>
            )}
          </div>
        </Card>

        {/* Invitations conversion pie */}
        <Card className="p-6">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-1.5">
            <Users className="h-4.5 w-4.5 text-emerald-500" />
            <span>Invitations Status Share</span>
          </h2>
          <div className="h-72 flex flex-col md:flex-row items-center justify-center gap-8">
            {invitePieData.length > 0 ? (
              <>
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={invitePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {invitePieData.map((_: any, idx: number) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2.5">
                  {invitePieData.map((item: any, idx: number) => (
                    <div key={item.name} className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-zinc-600 dark:text-zinc-400">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {item.value} ({totalInvites > 0 ? Math.round((item.value / totalInvites) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <span className="text-sm text-zinc-400">No invitations stats</span>
            )}
          </div>
        </Card>

        {/* Category Spend trends */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4">Spend Shares by Category Name</h2>
          <div className="h-72">
            {categoryTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={categoryTrendsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  {/* Dynamically extract unique categories dynamically keys */}
                  {Object.keys(categoryTrendsData[0] || {})
                    .filter(key => key !== 'name')
                    .map((catName, idx) => (
                      <Line
                        key={catName}
                        type="monotone"
                        dataKey={catName}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        name={catName}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-zinc-400">No category trends recorded</div>
            )}
          </div>
        </Card>

        {/* Merchant Spend trends */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4">Spend Shares by Merchant Clean Name</h2>
          <div className="h-72">
            {merchantTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={merchantTrendsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  {Object.keys(merchantTrendsData[0] || {})
                    .filter(key => key !== 'name')
                    .map((merchName, idx) => (
                      <Line
                        key={merchName}
                        type="monotone"
                        dataKey={merchName}
                        stroke={COLORS[(idx + 1) % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        name={merchName}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-zinc-400">No merchant trends recorded</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
