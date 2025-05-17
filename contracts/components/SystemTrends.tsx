// components/SystemTrends.tsx
'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSystemTrends } from '@/hooks/useSystemTrends';

export default function SystemTrends() {
  const { trendsData, loading } = useSystemTrends();

  return (
    <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 shadow space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold text-blue-700 dark:text-blue-400">📈 System Activity Trends</h2>
      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Loading trends...</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="deployments" stroke="#3B82F6" name="Deployments" />
            <Line type="monotone" dataKey="audits" stroke="#10B981" name="Audits" />
            <Line type="monotone" dataKey="registrations" stroke="#F59E0B" name="Registrations" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
