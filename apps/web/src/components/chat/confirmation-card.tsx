"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";

const TOOL_LABELS: Record<string, string> = {
  create_record: "Create Record",
  update_record: "Update Record",
  delete_record: "Delete Record",
  create_task: "Create Task",
  create_note: "Create Note",
};

interface ConfirmationCardProps {
  toolName: string;
  toolArgs: Record<string, unknown>;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
  resolved?: "approved" | "rejected";
}

export function ConfirmationCard({
  toolName,
  toolArgs,
  onApprove,
  onReject,
  loading,
  resolved,
}: ConfirmationCardProps) {
  const label = TOOL_LABELS[toolName] || toolName;

  return (
    <Card className="max-w-sm border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {label}
          </Badge>
          {resolved === "approved" && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Approved
            </Badge>
          )}
          {resolved === "rejected" && (
            <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              Rejected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <pre className="text-xs bg-muted rounded-md p-2 overflow-x-auto max-h-40 whitespace-pre-wrap">
          {JSON.stringify(toolArgs, null, 2)}
        </pre>
      </CardContent>
      {!resolved && (
        <CardFooter className="px-4 pb-3 gap-2">
          <Button
            size="sm"
            onClick={onApprove}
            disabled={loading}
            className="gap-1"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            disabled={loading}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            Reject
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
