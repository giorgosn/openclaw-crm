"use client";

import Link from "next/link";
import { Users, Building2, Handshake, Box, ArrowUpRight } from "lucide-react";

interface RelatedRecord {
  recordId: string;
  objectSlug: string;
  objectName: string;
  displayName: string;
  attributeTitle?: string;
  createdAt?: string;
}

interface RelatedRecordsProps {
  related: RelatedRecord[];
  forward: RelatedRecord[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  people: Users,
  companies: Building2,
  deals: Handshake,
};

export function RelatedRecords({ related, forward }: RelatedRecordsProps) {
  if (related.length === 0 && forward.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-muted-foreground">
        No related records.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Forward references (records this record points to) */}
      {forward.length > 0 && (
        <div>
          <h4 className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            References
          </h4>
          <div className="space-y-0.5">
            {forward.map((ref) => (
              <RecordLink key={ref.recordId + ref.attributeTitle} record={ref} subtitle={ref.attributeTitle} />
            ))}
          </div>
        </div>
      )}

      {/* Reverse references (records that point to this record) */}
      {related.length > 0 && (
        <div>
          <h4 className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Referenced By
          </h4>
          <div className="space-y-0.5">
            {related.map((ref) => (
              <RecordLink key={ref.recordId} record={ref} subtitle={ref.objectName} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecordLink({ record, subtitle }: { record: RelatedRecord; subtitle?: string }) {
  const Icon = iconMap[record.objectSlug] || Box;

  return (
    <Link
      href={`/objects/${record.objectSlug}/${record.recordId}`}
      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors group"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <span className="truncate">{record.displayName}</span>
        {subtitle && (
          <span className="ml-2 text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
      <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground" />
    </Link>
  );
}
