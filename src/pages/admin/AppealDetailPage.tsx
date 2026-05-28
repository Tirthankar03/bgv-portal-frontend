import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, XCircle, Building2, User, FileText } from 'lucide-react';
import { getAppeal, respondToAppeal } from '@/features/appeals/appealsApi';
import { formatDateTime } from '@/utils/date';

const schema = z.object({
  hrComments: z.string().min(2, 'Response must be at least 2 characters').max(2000),
});
type FormData = z.infer<typeof schema>;

function StatusBadge({ status }: { status: string }) {
  if (status === 'PENDING') return <span className="badge-warning">Pending Review</span>;
  if (status === 'APPROVED') return <span className="badge-success">Approved</span>;
  if (status === 'REJECTED') return <span className="badge-danger">Rejected</span>;
  return <span className="badge-gray">{status}</span>;
}

export default function AppealDetailPage() {
  const { appealId } = useParams<{ appealId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: appeal, isLoading } = useQuery({
    queryKey: ['appeal', appealId],
    queryFn: () => getAppeal(appealId!),
    enabled: !!appealId,
  });

  const { mutate: respond, isPending } = useMutation({
    mutationFn: ({ comments }: { comments: string }) => respondToAppeal(appealId!, comments),
    onSuccess: () => {
      toast.success('Response submitted successfully');
      qc.invalidateQueries({ queryKey: ['appeal', appealId] });
      qc.invalidateQueries({ queryKey: ['appeals'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to submit response';
      toast.error(msg);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => respond({ comments: data.hrComments });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 skeleton rounded" />
        <div className="card p-6 h-64 skeleton" />
      </div>
    );
  }

  if (!appeal) {
    return (
      <div className="text-center py-16 text-gray-400">
        <FileText className="h-12 w-12 mx-auto mb-3" />
        <p className="font-medium">Appeal not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/admin/appeals')} className="btn-ghost mb-2 -ml-2 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
            Back to Appeals
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{appeal.appealId}</h1>
            <StatusBadge status={appeal.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Submitted {formatDateTime(appeal.createdAt)}</p>
        </div>
      </div>

      {/* Info panels */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <User className="h-4 w-4 text-primary" />
            Employee
          </div>
          <p className="font-medium text-gray-900">{appeal.employee?.name}</p>
          <p className="text-sm text-gray-500">ID: {appeal.employeeId}</p>
          <p className="text-sm text-gray-500">{appeal.employee?.designation}</p>
          <p className="text-sm text-gray-500">{appeal.employee?.department}</p>
        </div>
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Building2 className="h-4 w-4 text-secondary" />
            Verifier
          </div>
          <p className="font-medium text-gray-900">{appeal.verifier?.companyName}</p>
          <p className="text-sm text-gray-500">{appeal.verifier?.email}</p>
          <p className="text-sm text-gray-500 mt-1">
            Verification: <span className="font-mono">{appeal.verification?.verificationId}</span>
          </p>
          <p className="text-sm text-gray-500">
            Match score: <span className="font-medium">{appeal.verification?.matchScore}%</span>
          </p>
        </div>
      </div>

      {/* Mismatched fields */}
      {appeal.mismatchedFields?.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Disputed Fields</h2>
          <div className="space-y-2">
            {appeal.mismatchedFields.map((f) => (
              <div key={f.fieldName} className="grid grid-cols-[1fr_1fr_1fr] gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Field</p>
                  <p className="font-medium capitalize text-gray-800">{f.fieldName.replace(/([A-Z])/g, ' $1')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><XCircle className="h-3 w-3 text-red-400" />Submitted</p>
                  <p className="text-gray-900">{f.verifierValue || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-400" />Official</p>
                  <p className="text-gray-900">{f.companyValue || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verifier's comments */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Verifier's Explanation</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{appeal.appealReason}</p>
      </div>

      {/* HR Response */}
      {appeal.status !== 'PENDING' ? (
        <div className="card p-5 border-l-4 border-primary">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-900">HR Response</h2>
            <div className="text-xs text-gray-500">
              by {appeal.reviewedBy} · {formatDateTime(appeal.reviewedAt)}
            </div>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{appeal.hrComments || appeal.hrResponse}</p>
        </div>
      ) : (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Submit HR Response</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="field-label">Response / Comments <span className="text-red-500">*</span></label>
              <textarea
                {...register('hrComments')}
                rows={5}
                placeholder="Provide your official HR response to this query..."
                className="field-input resize-none"
              />
              {errors.hrComments && <p className="field-error">{errors.hrComments.message}</p>}
            </div>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? <span className="spinner" /> : 'Submit Response'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
