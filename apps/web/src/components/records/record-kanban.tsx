"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  MeasuringStrategy,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import type { AttributeType } from "@openclaw-crm/shared";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { extractPersonalName } from "@/lib/display-name";

// ─── Types ───────────────────────────────────────────────────────────

interface StatusDef {
  id: string;
  title: string;
  color: string;
  isActive: boolean;
}

interface AttributeDef {
  id: string;
  slug: string;
  title: string;
  type: AttributeType;
  isMultiselect: boolean;
  options?: { id: string; title: string; color: string }[];
  statuses?: StatusDef[];
}

interface RecordRow {
  id: string;
  values: Record<string, unknown>;
}

interface InsertInfo {
  columnId: string;
  index: number;
}

interface RecordKanbanProps {
  attributes: AttributeDef[];
  records: RecordRow[];
  statusAttributeSlug: string;
  onMoveRecord: (recordId: string, newStatusId: string) => void;
  onReorder: (columnRecordIds: string[]) => void;
  onClickRecord: (recordId: string) => void;
  objectSlug: string;
}

// ─── Kanban Board ────────────────────────────────────────────────────

export function RecordKanban({
  attributes,
  records,
  statusAttributeSlug,
  onMoveRecord,
  onReorder,
  onClickRecord,
  objectSlug,
}: RecordKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [insertInfo, setInsertInfo] = useState<InsertInfo | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const statusAttr = attributes.find((a) => a.slug === statusAttributeSlug);
  const statuses = statusAttr?.statuses || [];

  // Find the "name" attribute for card display
  const nameAttr = attributes.find((a) => a.slug === "name");
  // Find a currency attribute for column totals
  const currencyAttr = attributes.find((a) => a.type === "currency");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Custom collision detection using fresh DOM rects
  const collisionDetection: CollisionDetection = useCallback(
    ({ droppableContainers, pointerCoordinates }) => {
      if (!pointerCoordinates) return [];

      for (const container of droppableContainers) {
        const node = container.node.current;
        if (!node || container.disabled) continue;

        const rect = node.getBoundingClientRect();
        if (
          pointerCoordinates.x >= rect.left &&
          pointerCoordinates.x <= rect.right &&
          pointerCoordinates.y >= rect.top &&
          pointerCoordinates.y <= rect.bottom
        ) {
          return [{ id: container.id, data: { droppableContainer: container, value: 0 } }];
        }
      }

      // Fallback: closest column center
      let closestId: string | null = null;
      let closestDist = Infinity;
      let closestContainer = null;
      for (const container of droppableContainers) {
        const node = container.node.current;
        if (!node || container.disabled) continue;

        const rect = node.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(pointerCoordinates.x - cx, pointerCoordinates.y - cy);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = container.id as string;
          closestContainer = container;
        }
      }

      if (closestId && closestContainer) {
        return [{ id: closestId, data: { droppableContainer: closestContainer, value: closestDist } }];
      }

      return [];
    },
    []
  );

  const measuring = useMemo(
    () => ({
      droppable: { strategy: MeasuringStrategy.Always },
    }),
    []
  );

  // Group records by status
  const columnMap = useMemo(() => {
    const map = new Map<string, RecordRow[]>();
    map.set("_unset", []);
    for (const s of statuses) {
      map.set(s.id, []);
    }
    for (const rec of records) {
      const statusVal = rec.values[statusAttributeSlug] as string | undefined;
      const key = statusVal && map.has(statusVal) ? statusVal : "_unset";
      map.get(key)!.push(rec);
    }
    return map;
  }, [records, statuses, statusAttributeSlug]);

  const activeRecord = activeId
    ? records.find((r) => r.id === activeId) ?? null
    : null;

  // Calculate insertion index from pointer Y within a column
  function getInsertIndex(columnId: string, pointerY: number): number {
    const board = boardRef.current;
    if (!board) return 0;

    const colEl = board.querySelector(`[data-column-id="${columnId}"]`);
    if (!colEl) return 0;

    const cardEls = colEl.querySelectorAll("[data-record-id]");
    if (cardEls.length === 0) return 0;

    for (let i = 0; i < cardEls.length; i++) {
      const rect = cardEls[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (pointerY < midY) return i;
    }

    return cardEls.length;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragMove(event: DragMoveEvent) {
    const { over, activatorEvent } = event;
    if (!over || !activeId) {
      setInsertInfo(null);
      return;
    }

    const columnId = over.id as string;
    // Get the current pointer position from the native event
    const nativeEvent = activatorEvent as PointerEvent;
    // Use delta + initial position to get current position
    const pointerY = nativeEvent.clientY + event.delta.y;

    const index = getInsertIndex(columnId, pointerY);
    setInsertInfo({ columnId, index });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const currentInsertInfo = insertInfo;
    setActiveId(null);
    setInsertInfo(null);
    if (!over) return;

    const recordId = active.id as string;
    const targetColumnId = over.id as string;

    if (targetColumnId === "_unset") return;
    if (!statuses.find((s) => s.id === targetColumnId)) return;

    const rec = records.find((r) => r.id === recordId);
    const currentStatus = rec?.values[statusAttributeSlug] as string | undefined;
    const isCrossColumn = currentStatus !== targetColumnId;

    // Get the target column's current records (excluding the dragged card)
    const targetRecords = (columnMap.get(targetColumnId) || []).filter(
      (r) => r.id !== recordId
    );
    const insertIdx = currentInsertInfo?.columnId === targetColumnId
      ? Math.min(currentInsertInfo.index, targetRecords.length)
      : targetRecords.length;

    // Build new ordered list for the target column
    const newOrder = [...targetRecords.map((r) => r.id)];
    newOrder.splice(insertIdx, 0, recordId);

    if (isCrossColumn) {
      // Move to new column + set order
      onMoveRecord(recordId, targetColumnId);
    }

    // Always update order (even for within-column moves)
    onReorder(newOrder);

    // If it was a within-column move and position didn't change, skip
    if (!isCrossColumn) {
      const sourceRecords = columnMap.get(targetColumnId) || [];
      const oldOrder = sourceRecords.map((r) => r.id);
      if (JSON.stringify(oldOrder) === JSON.stringify(newOrder)) return;
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      measuring={measuring}
      autoScroll={false}
    >
      <div ref={boardRef} className="flex h-full gap-3 overflow-x-auto p-4">
        {/* Unset column (only if there are records without status) */}
        {(columnMap.get("_unset")?.length ?? 0) > 0 && (
          <KanbanColumn
            id="_unset"
            title="No Status"
            color="#666"
            records={columnMap.get("_unset") || []}
            nameAttr={nameAttr}
            currencyAttr={currencyAttr}
            attributes={attributes}
            onClickRecord={onClickRecord}
            insertInfo={insertInfo}
            activeId={activeId}
          />
        )}

        {statuses.map((status) => (
          <KanbanColumn
            key={status.id}
            id={status.id}
            title={status.title}
            color={status.color}
            records={columnMap.get(status.id) || []}
            nameAttr={nameAttr}
            currencyAttr={currencyAttr}
            attributes={attributes}
            onClickRecord={onClickRecord}
            insertInfo={insertInfo}
            activeId={activeId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeRecord && (
          <KanbanCardOverlay
            record={activeRecord}
            nameAttr={nameAttr}
            currencyAttr={currencyAttr}
            attributes={attributes}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Column ──────────────────────────────────────────────────────────

function KanbanColumn({
  id,
  title,
  color,
  records,
  nameAttr,
  currencyAttr,
  attributes,
  onClickRecord,
  insertInfo,
  activeId,
}: {
  id: string;
  title: string;
  color: string;
  records: RecordRow[];
  nameAttr?: AttributeDef;
  currencyAttr?: AttributeDef;
  attributes: AttributeDef[];
  onClickRecord: (recordId: string) => void;
  insertInfo: InsertInfo | null;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const count = records.length;
  let currencySum: number | null = null;
  if (currencyAttr) {
    currencySum = records.reduce((sum, rec) => {
      const val = rec.values[currencyAttr.slug] as { amount?: number } | undefined;
      return sum + (val?.amount ?? 0);
    }, 0);
  }

  const showInsert = insertInfo?.columnId === id && activeId;
  // Filter out the actively dragged card from display
  const visibleRecords = records.filter((r) => r.id !== activeId);
  const insertIdx = showInsert
    ? Math.min(insertInfo!.index, visibleRecords.length)
    : -1;

  return (
    <div
      ref={setNodeRef}
      data-column-id={id}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border border-border/50 bg-card/50 transition-colors",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium truncate">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{count}</span>
      </div>

      {/* Currency total */}
      {currencySum !== null && currencySum > 0 && (
        <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border/30">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(currencySum)}
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {visibleRecords.map((record, i) => (
          <div key={record.id}>
            {insertIdx === i && <InsertIndicator />}
            <KanbanCard
              record={record}
              nameAttr={nameAttr}
              currencyAttr={currencyAttr}
              attributes={attributes}
              onClick={() => onClickRecord(record.id)}
            />
          </div>
        ))}
        {insertIdx === visibleRecords.length && <InsertIndicator />}

        {visibleRecords.length === 0 && !showInsert && (
          <div className="py-8 text-center text-xs text-muted-foreground/50">
            Drop here
          </div>
        )}
        {visibleRecords.length === 0 && showInsert && <InsertIndicator />}
      </div>
    </div>
  );
}

// ─── Insert Indicator ────────────────────────────────────────────────

function InsertIndicator() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
      <div className="h-0.5 flex-1 rounded-full bg-primary" />
      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────────

function KanbanCard({
  record,
  nameAttr,
  currencyAttr,
  attributes,
  onClick,
}: {
  record: RecordRow;
  nameAttr?: AttributeDef;
  currencyAttr?: AttributeDef;
  attributes: AttributeDef[];
  onClick: () => void;
}) {
  const {
    attributes: dragAttrs,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({ id: record.id });

  const displayName = getDisplayName(record, nameAttr);
  const currencyVal = currencyAttr
    ? (record.values[currencyAttr.slug] as { amount?: number; currencyCode?: string } | undefined)
    : undefined;

  const extraFields = attributes
    .filter(
      (a) =>
        a.slug !== "name" &&
        a.type !== "status" &&
        a.type !== "currency" &&
        record.values[a.slug] != null
    )
    .slice(0, 2);

  return (
    <div
      ref={setNodeRef}
      data-record-id={record.id}
      className={cn(
        "group rounded-md border border-border/60 bg-background p-2.5 shadow-sm cursor-pointer hover:border-border transition-colors",
        isDragging && "opacity-30"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-1.5">
        <button
          {...dragAttrs}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab opacity-0 group-hover:opacity-60 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{displayName}</p>

          {currencyVal?.amount != null && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currencyVal.currencyCode || "USD",
              }).format(currencyVal.amount)}
            </p>
          )}

          {extraFields.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {extraFields.map((attr) => {
                const val = record.values[attr.slug];
                return (
                  <p key={attr.slug} className="text-xs text-muted-foreground truncate">
                    <span className="text-muted-foreground/60">{attr.title}: </span>
                    {formatCardValue(val, attr.type)}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanCardOverlay({
  record,
  nameAttr,
  currencyAttr,
  attributes,
}: {
  record: RecordRow;
  nameAttr?: AttributeDef;
  currencyAttr?: AttributeDef;
  attributes: AttributeDef[];
}) {
  const displayName = getDisplayName(record, nameAttr);
  const currencyVal = currencyAttr
    ? (record.values[currencyAttr.slug] as { amount?: number; currencyCode?: string } | undefined)
    : undefined;

  return (
    <div className="w-68 rounded-md border border-primary/50 bg-background p-2.5 shadow-lg">
      <p className="text-sm font-medium truncate">{displayName}</p>
      {currencyVal?.amount != null && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currencyVal.currencyCode || "USD",
          }).format(currencyVal.amount)}
        </p>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getDisplayName(record: RecordRow, nameAttr?: AttributeDef): string {
  if (!nameAttr) return "Unnamed";
  const val = record.values[nameAttr.slug];
  if (!val) return "Unnamed";
  if (nameAttr.type === "personal_name") {
    return extractPersonalName(val) || "Unnamed";
  }
  return String(val);
}

function formatCardValue(val: unknown, type: AttributeType): string {
  if (val == null) return "—";
  if (type === "personal_name") {
    return extractPersonalName(val) || "—";
  }
  if (type === "date") {
    return new Date(val as string).toLocaleDateString();
  }
  if (Array.isArray(val)) {
    return val.filter(Boolean).join(", ");
  }
  return String(val);
}
