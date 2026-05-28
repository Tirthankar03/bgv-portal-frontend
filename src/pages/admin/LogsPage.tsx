import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAccessLogs } from '@/features/admin/adminApi';
import { formatDateTime } from '@/utils/date';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { clsx } from 'clsx';

export default function LogsPage() {
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['access-logs', status, role, page],
    queryFn: () => getAccessLogs({
      status: status || undefined,
      role: role || undefined,
      page,
      size: 25,
    }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Access Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Audit trail of all authentication events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="field-select w-auto min-w-[140px]"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
        </select>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(0); }}
          className="field-select w-auto min-w-[140px]"
        >
          <option value="">All Roles</option>
          <option value="verifier">Verifier</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 skeleton m-4 rounded-lg" />)}
          </div>
        ) : !data?.content.length ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <ScrollText className="h-10 w-10 mb-3" />
            <p className="font-medium">No logs found</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">IP</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.content.map((log) => (
                    <tr key={log.id} className={clsx('hover:bg-gray-50', log.status === 'FAILURE' && 'bg-red-50/30')}>
                      <td className="px-4 py-2.5 text-sm text-gray-900">{log.email}</td>
                      <td className="px-4 py-2.5 text-sm font-mono text-gray-700">{log.action}</td>
                      <td className="px-4 py-2.5 text-sm capitalize text-gray-600">{log.role}</td>
                      <td className="px-4 py-2.5">
                        {log.status === 'SUCCESS'
                          ? <span className="badge-success">Success</span>
                          : <span className="badge-danger">Failed</span>}
                        {log.failureReason && (
                          <p className="text-xs text-gray-400 mt-0.5">{log.failureReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono text-gray-500">{log.ipAddress}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {data.number + 1} of {data.totalPages} ({data.totalElements} total)
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="btn-ghost p-2">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))} disabled={page >= data.totalPages - 1} className="btn-ghost p-2">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
