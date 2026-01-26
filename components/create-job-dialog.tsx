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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Add Job Application</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">Track a new job application</DialogDescription>
        </DialogHeader>
        <form className="space-y-3 md:space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="company" className="text-xs md:text-sm">Company *</Label>
                <Input
                  id="company"
                  required
                  className="text-xs md:text-sm h-8 md:h-10"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="position" className="text-xs md:text-sm">Position *</Label>
                <Input
                  id="position"
                  required
                  className="text-xs md:text-sm h-8 md:h-10"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="location" className="text-xs md:text-sm">Location</Label>
                <Input
                  id="location"
                  className="text-xs md:text-sm h-8 md:h-10"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="salary" className="text-xs md:text-sm">Salary</Label>
                <Input
                  id="salary"
                  className="text-xs md:text-sm h-8 md:h-10"
                  placeholder="e.g., $100k - $150k"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="jobUrl" className="text-xs md:text-sm">Job URL</Label>
              <Input
                id="jobUrl"
                type="url"
                className="text-xs md:text-sm h-8 md:h-10"
                placeholder="https://..."
                value={formData.jobUrl}
                onChange={(e) =>
                  setFormData({ ...formData, jobUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="tags" className="text-xs md:text-sm">Tags (comma-separated)</Label>
              <Input
                id="tags"
                className="text-xs md:text-sm h-8 md:h-10"
                placeholder="React, Tailwind, High Pay"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
              />
            </div>
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="description" className="text-xs md:text-sm">Description</Label>
              <Textarea
                id="description"
                rows={2}
                className="text-xs md:text-sm"
                placeholder="Brief description of the role..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="notes" className="text-xs md:text-sm">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                className="text-xs md:text-sm"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Application</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}