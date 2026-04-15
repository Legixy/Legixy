/**
 * /src/features/contracts/components/ContractHistoryTimeline.tsx
 *
 * Display immutable contract version history with restore capability
 * Trust layer: every AI fix creates a version, user can see all history
 */

'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { History, RotateCcw, ChevronDown, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

export interface ContractVersionWithUser {
  id: string;
  version: number;
  content: string;
  changeNote: string | null;
  changedBy: string; // userId
  createdAt: string;
  changedByUser?: {
    name: string;
    email: string;
    role: string;
  };
}

interface ContractHistoryTimelineProps {
  versions: ContractVersionWithUser[];
  currentVersion: number;
  onRestore: (versionId: string, versionNumber: number) => Promise<void>;
  isLoading?: boolean;
}

function getActionIcon(changeNote: string | null) {
  if (!changeNote) return <AlertCircle className="w-4 h-4 text-slate-400" />;
  if (changeNote.includes('AI')) return <Zap className="w-4 h-4 text-indigo-600" />;
  if (changeNote.includes('User')) return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  return <History className="w-4 h-4 text-slate-600" />;
}

function getActionLabel(changeNote: string | null, changedByUser?: any): string {
  if (!changeNote) return 'Contract Modified';
  if (changeNote.includes('AI fixed')) return `AI Fixed: ${changeNote.replace('AI fixed: ', '')}`;
  if (changeNote.includes('User')) return changeNote;
  return changeNote;
}

export function ContractHistoryTimeline({
  versions,
  currentVersion,
  onRestore,
  isLoading = false,
}: ContractHistoryTimelineProps) {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState<{
    versionId: string;
    version: number;
  } | null>(null);

  const handleRestore = async () => {
    if (!showRestoreModal) return;

    setRestoring(showRestoreModal.versionId);
    try {
      await onRestore(showRestoreModal.versionId, showRestoreModal.version);
      toast.success(`Restored to version ${showRestoreModal.version}`);
      setShowRestoreModal(null);
    } catch (error) {
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  // Sort versions in descending order (newest first)
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-slate-900">Contract History</h3>
        <span className="ml-auto text-xs font-medium text-slate-500">
          {versions.length} versions
        </span>
      </div>

      {/* Timeline */}
      <div className="relative space-y-3">
        {/* Vertical line */}
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200" />

        {sortedVersions.map((version, index) => {
          const isCurrent = version.version === currentVersion;
          const isPrevious = index === sortedVersions.length - 1;

          return (
            <div key={version.id} className="relative pl-14 pb-4">
              {/* Timeline dot */}
              <div
                className={`absolute left-0 top-2 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'bg-white border-slate-300 hover:border-indigo-600'
                }`}
              >
                {isCurrent ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  getActionIcon(version.changeNote)
                )}
              </div>

              {/* Card */}
              <div
                className={`rounded-lg border p-4 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
                onClick={() =>
                  setExpandedVersion(
                    expandedVersion === version.version ? null : version.version
                  )
                }
              >
                {/* Version Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Version {version.version}
                      </p>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      {formatDistanceToNow(new Date(version.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedVersion === version.version ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Action Label */}
                <p className="text-sm text-slate-700 mb-3">
                  {getActionLabel(version.changeNote, version.changedByUser)}
                </p>

                {/* Expandable Section */}
                {expandedVersion === version.version && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    {/* Change Note */}
                    {version.changeNote && (
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-1">
                          Change Summary
                        </p>
                        <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                          {version.changeNote}
                        </p>
                      </div>
                    )}

                    {/* User Info */}
                    {version.changedByUser && (
                      <div className="text-xs text-slate-600">
                        Changed by: <strong>{version.changedByUser.name}</strong> (
                        {version.changedByUser.email})
                      </div>
                    )}

                    {/* Preview Button */}
                    <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 mt-3">
                      [View Full Content]
                    </button>

                    {/* Restore Button */}
                    {!isCurrent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRestoreModal({
                            versionId: version.id,
                            version: version.version,
                          });
                        }}
                        disabled={restoring === version.id}
                        className="w-full mt-3 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {restoring === version.id ? 'Restoring...' : 'Restore This Version'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRestoreModal(null)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Restore Version {showRestoreModal.version}?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              This will replace the current contract version with version{' '}
              {showRestoreModal.version}. You can always undo this action.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRestoreModal(null)}
                disabled={restoring !== null}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={restoring !== null}
                className="flex-1 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {restoring ? 'Restoring...' : 'Restore Version'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
