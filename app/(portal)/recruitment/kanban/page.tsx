"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Candidate = {
  id: string;
  name: string;
  email: string;
  stage: string;
  appliedAt: string;
  rating?: number;
  job: { title: string };
};

const STAGES = [
  { key: "applied",   label: "Applied",   color: "bg-blue-50 dark:bg-blue-900/20" },
  { key: "screening", label: "Screening", color: "bg-purple-50 dark:bg-purple-900/20" },
  { key: "interview", label: "Interview", color: "bg-indigo-50 dark:bg-indigo-900/20" },
  { key: "offer",     label: "Offer",     color: "bg-amber-50 dark:bg-amber-900/20" },
  { key: "hired",     label: "Hired",     color: "bg-emerald-50 dark:bg-emerald-900/20" },
  { key: "rejected",  label: "Rejected",  color: "bg-rose-50 dark:bg-rose-900/20" },
];

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: candidate.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-card rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(candidate.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{candidate.name}</p>
          <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground truncate">{candidate.job.title}</p>
      <p className="text-xs text-muted-foreground mt-1">{formatDate(candidate.appliedAt)}</p>
      {candidate.rating && (
        <p className="text-xs mt-1">{"⭐".repeat(candidate.rating)}</p>
      )}
    </div>
  );
}

export default function KanbanPage() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data } = useQuery({
    queryKey: ["candidates-kanban"],
    queryFn: () => axios.get("/api/recruitment/candidates").then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      axios.patch(`/api/recruitment/candidates/${id}`, { stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates-kanban"] }),
    onError: () => toast.error("Failed to update stage"),
  });

  const candidates: Candidate[] = data?.candidates ?? [];
  const grouped = STAGES.reduce<Record<string, Candidate[]>>((acc, s) => {
    acc[s.key] = candidates.filter((c) => c.stage === s.key);
    return acc;
  }, {});

  const activeCandidate = activeId ? candidates.find((c) => c.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const overStage = STAGES.find(s => s.key === over.id || grouped[s.key]?.find(c => c.id === over.id));
    if (!overStage) return;

    const candidate = candidates.find(c => c.id === active.id);
    if (candidate && candidate.stage !== overStage.key) {
      updateMutation.mutate({ id: String(active.id), stage: overStage.key });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Recruitment Pipeline"
        description="Drag candidates between stages"
        action={
          <Link href="/recruitment">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Job List
            </Button>
          </Link>
        }
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage.key} id={stage.key} className="flex-shrink-0 w-64">
              <div className={`rounded-xl p-3 ${stage.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {grouped[stage.key]?.length ?? 0}
                  </Badge>
                </div>
                <SortableContext
                  items={grouped[stage.key]?.map((c) => c.id) ?? []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[100px]">
                    {grouped[stage.key]?.map((c) => (
                      <CandidateCard key={c.id} candidate={c} />
                    ))}
                  </div>
                </SortableContext>
              </div>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeCandidate && (
            <div className="bg-card rounded-lg border p-3 shadow-xl opacity-95 w-64">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(activeCandidate.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{activeCandidate.name}</p>
                  <p className="text-xs text-muted-foreground">{activeCandidate.job.title}</p>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
