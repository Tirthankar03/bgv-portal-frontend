import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAppeals } from '@/features/appeals/appealsApi';
import { formatDateTime } from '@/utils/date';
import { clsx } from 'clsx';
import { ChevronRight, ChevronLeft, Search } from 'lucide-react';

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;
type StatusFilter = typeof STATUS_TABS[number];

function StatusBadge({ status }: { status: string }) {
  if (status === 'PENDING') return <span className="badge-warning">Pending</span>;
  if (status === 'APPROVED') return <span className="badge-success">Approved</span>;
  if (status === 'REJECTED') return <span className="badge-danger">Rejected</span>;
  return <span className="badge-gray">{status}</span>;
}

export default function AppealsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['appeals', status, page],
    queryFn: () => getAppeals({ status: status === 'ALL' ? undefined : status, page, size: 20 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appeals</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and respond to verifier queries</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(0); }}
            className={clsx(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
              status === s
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 skeleton m-4 rounded-lg" />
            ))}
          </div>
        ) : !data?.content.length ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Search className="h-10 w-10 mb-3" />
            <p className="font-medium">No appeals found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full sm:table">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Appeal ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Verifier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.content.map((appeal) => (
                  <tr
                    key={appeal.id}
                    onClick={() => navigate(`/admin/appeals/${appeal.appealId}`)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{appeal.appealId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <p>{appeal.employee?.name}</p>
                      <p className="text-xs text-gray-400">{appeal.employeeId}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{appeal.verifier?.companyName}</td>
                    <td className="px-4 py-3"><StatusBadge status={appeal.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(appeal.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {data.content.map((appeal) => (
                <button
                  key={appeal.id}
                  onClick={() => navigate(`/admin/appeals/${appeal.appealId}`)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-gray-900">{appeal.appealId}</span>
                      <StatusBadge status={appeal.status} />
                    </div>
                    <p className="text-sm text-gray-700 truncate">{appeal.employee?.name}</p>
                    <p className="text-xs text-gray-400">{appeal.verifier?.companyName} · {formatDateTime(appeal.createdAt)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                </button>
              ))}
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
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
              disabled={page >= data.totalPages - 1}
              className="btn-ghost p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
