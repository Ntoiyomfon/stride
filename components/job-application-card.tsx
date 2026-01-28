"use client";

import { JobApplication } from "@/lib/types/job-application";
import { Column } from "@/lib/types/column";
import { Card, CardContent } from "./ui/card";
import { Edit2, ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  deleteJobApplication,
  updateJobApplication,
} from "@/lib/actions/job-applications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import React, { useState } from "react";
interface JobApplicationCardProps {
  job: JobApplication;
  columns: Column[];
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}

export default function JobApplicationCard({
  job,
  columns,
  dragHandleProps,
}: JobApplicationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    company: job.company,
    position: job.position,
    location: job.location || "",
    notes: job.notes || "",
    salary: job.salary || "",
    jobUrl: job.job_url || "",
    columnId: job.column_id || "",
    tags: job.tags?.join(", ") || "",
    description: job.description || "",
  });

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await updateJobApplication(job.id, {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      });

      if (!result.error) {
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to move job application: ", err);
    }
  }

  async function handleDelete() {
    try {
      const result = await deleteJobApplication(job.id);

      if (result.error) {
        console.error("Failed to delete job application:", result.error);
      }
    } catch (err) {
      console.error("Failed to move job application: ", err);
    }
  }

  async function handleMove(newColumnId: string) {
    try {
      await updateJobApplication(job.id, {
        columnId: newColumnId,
      });
    } catch (err) {
      console.error("Failed to move job application: ", err);
    }
  }
  return (
    <>
      <Card
        className="cursor-pointer transition-shadow hover:shadow-lg bg-card group shadow-sm"
        {...dragHandleProps}
      >
        <CardContent className="p-2.5">
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xs md:text-sm mb-0.5 text-foreground">{job.position}</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-1.5">
                {job.company}
              </p>
              {job.description && (
                <p className="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-1.5 line-clamp-2">
                  {job.description}
                </p>
              )}
              {job.tags && job.tags.length > 0 && (
                <div className="flex flex-wrap gap-0.5 md:gap-1 mb-1 md:mb-1.5">
                  {job.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-1.5 py-0.5 text-[10px] md:text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {job.job_url && (
                <a
                  href={job.job_url}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[10px] md:text-xs text-primary hover:underline mt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-2.5 w-2.5 md:h-3 md:w-3" />
                </a>
              )}
            </div>
            <div className="flex items-start gap-0.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 md:h-6 md:w-6">
                    <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  {columns.length > 1 && (
                    <>
                      {columns
                        .filter((c) => c.id !== job.column_id)
                        .map((column, key) => (
                          <DropdownMenuItem
                            key={key}
                            onClick={() => handleMove(column.id)}
                          >
                            Move to {column.name}
                          </DropdownMenuItem>
                        ))}
                    </>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-[85vw] sm:max-w-md max-h-[75vh] overflow-y-auto p-2 sm:p-4">
          <DialogHeader className="space-y-0 pb-1">
            <DialogTitle className="text-sm sm:text-base">Edit Job</DialogTitle>
            <DialogDescription className="text-xs hidden sm:block">Update your job application details</DialogDescription>
          </DialogHeader>
          <form className="space-y-1.5" onSubmit={handleUpdate}>
            <div className="space-y-1.5">
              {/* Minimal essential fields */}
              <div className="space-y-0.5">
                <Label htmlFor="company" className="text-xs">Company *</Label>
                <Input
                  id="company"
                  required
                  className="text-xs h-6 sm:h-8"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="position" className="text-xs">Position *</Label>
                <Input
                  id="position"
                  required
                  className="text-xs h-6 sm:h-8"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <Label htmlFor="location" className="text-xs">Location</Label>
                  <Input
                    id="location"
                    className="text-xs h-6 sm:h-8"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="salary" className="text-xs">Salary</Label>
                  <Input
                    id="salary"
                    className="text-xs h-6 sm:h-8"
                    placeholder="$100k"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="jobUrl" className="text-xs">URL</Label>
                <Input
                  id="jobUrl"
                  type="url"
                  className="text-xs h-6 sm:h-8"
                  placeholder="https://..."
                  value={formData.jobUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, jobUrl: e.target.value })
                  }
                />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="tags" className="text-xs">Tags</Label>
                <Input
                  id="tags"
                  className="text-xs h-6 sm:h-8"
                  placeholder="React, Node.js"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="description" className="text-xs">Description</Label>
                <Textarea
                  id="description"
                  rows={1}
                  className="text-xs resize-none min-h-[32px] sm:min-h-[40px]"
                  placeholder="Brief description..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="notes" className="text-xs">Notes</Label>
                <Textarea
                  id="notes"
                  rows={1}
                  className="text-xs resize-none min-h-[32px] sm:min-h-[40px]"
                  placeholder="Notes..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-1.5 pt-1.5 flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                size="sm"
                className="w-full sm:w-auto order-2 sm:order-1 h-7 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="w-full sm:w-auto order-1 sm:order-2 h-7 text-xs">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}