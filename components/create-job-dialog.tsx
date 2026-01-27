"use client";

import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import React, { useState } from "react";
import { createJobApplication } from "@/lib/actions/job-applications";

interface CreateJobApplicationDialogProps {
  columnId: string;
  boardId: string;
}

const INITIAL_FORM_DATA = {
  company: "",
  position: "",
  location: "",
  notes: "",
  salary: "",
  jobUrl: "",
  tags: "",
  description: "",
};

export default function CreateJobApplicationDialog({
  columnId,
  boardId,
}: CreateJobApplicationDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const result = await createJobApplication({
        ...formData,
        columnId,
        boardId,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      });

      if (!result.error) {
        setFormData(INITIAL_FORM_DATA);
        setOpen(false);
      } else {
        console.error("Failed to create job: ", result.error);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          variant="outline"
          className="w-full mb-2 md:mb-4 justify-start text-muted-foreground border-dashed border-2 hover:border-solid hover:bg-muted/50 text-xs md:text-sm"
        >
          <Plus className="mr-2 h-3 md:h-4 w-3 md:w-4" />
          Add Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[85vw] sm:max-w-md max-h-[75vh] overflow-y-auto p-2 sm:p-4">
        <DialogHeader className="space-y-0 pb-1">
          <DialogTitle className="text-sm sm:text-base">Add Job</DialogTitle>
          <DialogDescription className="text-xs hidden sm:block">Track a new job application</DialogDescription>
        </DialogHeader>
        <form className="space-y-1.5" onSubmit={handleSubmit}>
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
              onClick={() => setOpen(false)}
              size="sm"
              className="w-full sm:w-auto order-2 sm:order-1 h-7 text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="w-full sm:w-auto order-1 sm:order-2 h-7 text-xs">
              Add Job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}