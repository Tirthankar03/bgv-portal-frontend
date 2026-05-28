import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVerifiers, getBlockedVerifiers, toggleVerifier } from '@/features/admin/adminApi';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/date';
import { ToggleLeft, ToggleRight, Users, ShieldOff } from 'lucide-react';
import { clsx } from 'clsx';

export default function VerifiersPage() {
  const qc = useQueryClient();

  const { data: verifiers, isLoading: vLoading } = useQuery({
    queryKey: ['admin-verifiers'],
    queryFn: getVerifiers,
  });

  const { data: blocked, isLoading: bLoading } = useQuery({
    queryKey: ['blocked-verifiers'],
    queryFn: getBlockedVerifiers,
  });

  const { mutate: toggle, isPending: toggling } = useMutation({
    mutationFn: (id: number) => toggleVerifier(id),
    onSuccess: () => {
      toast.success('Verifier status updated');
      qc.invalidateQueries({ queryKey: ['admin-verifiers'] });
    },
    onError: () => toast.error('Failed to update verifier'),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verifiers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage registered BGV verifier accounts</p>
      </div>

      {/* Verifiers table */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-gray-900">All Verifiers ({verifiers?.length ?? '—'})</h2>
        </div>
        {vLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 skeleton m-4 rounded-lg" />)}
          </div>
        ) : !verifiers?.length ? (
          <p className="text-center py-10 text-gray-400 text-sm">No verifiers registered</p>
        ) : (
          <>
            {/* Desktop */}
            <table className="hidden w-full sm:table">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {verifiers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.companyName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.email}</td>
                    <td className="px-4 py-3">
                      {v.isBgvAgency
                        ? <span className="badge-info">BGV Agency</span>
                        : <span className="badge-gray">Direct</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(v.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      {v.isActive
                        ? <span className="badge-success">Active</span>
                        : <span className="badge-danger">Inactive</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggle(v.id)}
                        disabled={toggling}
                        className={clsx('btn-ghost p-1.5', v.isActive ? 'text-green-600' : 'text-gray-400')}
                        title={v.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {v.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {verifiers.map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{v.companyName}</p>
                    <p className="text-xs text-gray-500 truncate">{v.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.isActive ? <span className="badge-success">Active</span> : <span className="badge-danger">Inactive</span>}
                    <button onClick={() => toggle(v.id)} disabled={toggling} className={clsx('p-1', v.isActive ? 'text-green-600' : 'text-gray-400')}>
                      {v.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Blocked verifiers */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <ShieldOff className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-semibold text-gray-900">Blocked Verifiers</h2>
        </div>
        {bLoading ? (
          <div className="divide-y">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 skeleton m-4 rounded-lg" />)}
          </div>
        ) : !blocked?.length ? (
          <p className="text-center py-8 text-gray-400 text-sm">No blocked verifiers</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Verifier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Employee ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Attempts</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Blocked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {blocked.map((b) => (
                <tr key={`${b.verifierId}-${b.employeeId}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{b.companyName}</p>
                    <p className="text-xs text-gray-500">{b.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">{b.employeeId}</td>
                  <td className="px-4 py-3"><span className="badge-danger">{b.attemptCount} attempts</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(b.blockedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
