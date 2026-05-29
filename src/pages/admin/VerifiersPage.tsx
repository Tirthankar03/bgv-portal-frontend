import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVerifiers, getBlockedVerifiers, toggleVerifier, unblockAttempt } from '@/features/admin/adminApi';
import type { BlockedVerifier } from '@/features/admin/adminApi';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/date';
import { ToggleLeft, ToggleRight, Users, ShieldOff, ShieldCheck, Search, X } from 'lucide-react';
import { clsx } from 'clsx';

function UnblockModal({ item, onClose, onConfirm, loading }: {
  item: BlockedVerifier;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Unblock Verifier</h2>
            <p className="text-xs text-gray-500">Reset attempt count to zero</p>
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm space-y-1">
          <p><span className="text-gray-500">Verifier:</span> <span className="font-medium">{item.verifierCompanyName}</span></p>
          <p><span className="text-gray-500">Email:</span> {item.verifierEmail}</p>
          <p><span className="text-gray-500">Employee ID:</span> <span className="font-mono">{item.employeeId}</span></p>
          <p><span className="text-gray-500">Attempts:</span> <span className="text-red-600 font-medium">{item.attemptCount}</span></p>
        </div>
        <p className="text-sm text-gray-600">
          This will reset the attempt count and allow the verifier to retry this employee lookup.
        </p>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="btn-primary flex-1 bg-amber-600 hover:bg-amber-700">
            {loading ? <span className="spinner" /> : 'Confirm Unblock'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifiersPage() {
  const qc = useQueryClient();
  const [verifierSearch, setVerifierSearch] = useState('');
  const [blockedSearch, setBlockedSearch] = useState('');
  const [unblockTarget, setUnblockTarget] = useState<BlockedVerifier | null>(null);

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

  const { mutate: doUnblock, isPending: unblocking } = useMutation({
    mutationFn: (attemptId: number) => unblockAttempt(attemptId),
    onSuccess: () => {
      toast.success('Verifier unblocked successfully');
      setUnblockTarget(null);
      qc.invalidateQueries({ queryKey: ['blocked-verifiers'] });
    },
    onError: () => toast.error('Failed to unblock verifier'),
  });

  const filteredVerifiers = useMemo(() => {
    if (!verifiers || !verifierSearch.trim()) return verifiers ?? [];
    const q = verifierSearch.trim().toLowerCase();
    return verifiers.filter((v) =>
      v.companyName.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q)
    );
  }, [verifiers, verifierSearch]);

  const filteredBlocked = useMemo(() => {
    if (!blocked || !blockedSearch.trim()) return blocked ?? [];
    const q = blockedSearch.trim().toLowerCase();
    return blocked.filter((b) =>
      b.verifierCompanyName.toLowerCase().includes(q) ||
      b.verifierEmail.toLowerCase().includes(q) ||
      b.employeeId.toLowerCase().includes(q) ||
      b.employeeName.toLowerCase().includes(q)
    );
  }, [blocked, blockedSearch]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verifiers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage registered BGV verifier accounts</p>
      </div>

      {/* All Verifiers */}
      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-gray-900">
              All Verifiers ({verifiers?.length ?? '—'})
            </h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={verifierSearch}
              onChange={(e) => setVerifierSearch(e.target.value)}
              className="field-input pl-8 py-1.5 text-sm"
            />
            {verifierSearch && (
              <button onClick={() => setVerifierSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {vLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 skeleton m-4 rounded-lg" />)}
          </div>
        ) : !filteredVerifiers.length ? (
          <p className="text-center py-10 text-gray-400 text-sm">
            {verifierSearch ? 'No verifiers match your search' : 'No verifiers registered'}
          </p>
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
                {filteredVerifiers.map((v) => (
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
              {filteredVerifiers.map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{v.companyName}</p>
                    <p className="text-xs text-gray-500 truncate">{v.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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

      {/* Blocked Verifiers */}
      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-gray-900">
              Blocked Verifiers ({blocked?.length ?? '—'})
            </h2>
          </div>
          {(blocked?.length ?? 0) > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search blocked verifiers…"
                value={blockedSearch}
                onChange={(e) => setBlockedSearch(e.target.value)}
                className="field-input pl-8 py-1.5 text-sm"
              />
              {blockedSearch && (
                <button onClick={() => setBlockedSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {bLoading ? (
          <div className="divide-y">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 skeleton m-4 rounded-lg" />)}
          </div>
        ) : !filteredBlocked.length ? (
          <p className="text-center py-8 text-gray-400 text-sm">
            {blockedSearch ? 'No results match your search' : 'No blocked verifiers'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Verifier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Employee ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Employee Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Attempts</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Blocked At</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBlocked.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{b.verifierCompanyName}</p>
                      <p className="text-xs text-gray-500">{b.verifierEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{b.employeeId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.employeeName}</td>
                    <td className="px-4 py-3"><span className="badge-danger">{b.attemptCount} attempts</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDateTime(b.blockedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setUnblockTarget(b)}
                        className="btn-ghost text-xs text-amber-700 border border-amber-300 hover:bg-amber-50 px-2.5 py-1.5"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unblock confirmation modal */}
      {unblockTarget && (
        <UnblockModal
          item={unblockTarget}
          onClose={() => setUnblockTarget(null)}
          onConfirm={() => doUnblock(unblockTarget.id)}
          loading={unblocking}
        />
      )}
    </div>
  );
}
