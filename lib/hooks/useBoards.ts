"use client";

import { useEffect, useState } from "react";
import { Board } from "../types/board";
import { ColumnWithApplications } from "../types/column";
import { JobApplication } from "../types/job-application";
import { updateJobApplication } from "../actions/job-applications";

export function useBoard(initialBoard?: Board | null) {
  const [board, setBoard] = useState<Board | null>(initialBoard || null);
  const [columns, setColumns] = useState<ColumnWithApplications[]>((initialBoard as any)?.columns || []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialBoard) {
      setBoard(initialBoard);
      setColumns((initialBoard as any)?.columns || []);
    }
  }, [initialBoard]);

  async function moveJob(
    jobApplicationId: string,
    newColumnId: string,
    newOrder: number
  ) {
    setColumns((prev) => {
      const newColumns = prev.map((col) => ({
        ...col,
        job_applications: [...col.job_applications],
      }));

      // Find and remove job from the old column
      let jobToMove: JobApplication | null = null;
      let oldColumnId: string | null = null;

      for (const col of newColumns) {
        const jobIndex = col.job_applications.findIndex(
          (j) => j.id === jobApplicationId
        );
        if (jobIndex !== -1 && jobIndex !== undefined) {
          jobToMove = col.job_applications[jobIndex];
          oldColumnId = col.id;
          col.job_applications = col.job_applications.filter(
            (job) => job.id !== jobApplicationId
          );
          break;
        }
      }

      if (jobToMove && oldColumnId) {
        const targetColumnIndex = newColumns.findIndex(
          (col) => col.id === newColumnId
        );
        if (targetColumnIndex !== -1) {
          const targetColumn = newColumns[targetColumnIndex];
          const currentJobs = targetColumn.job_applications || [];

          const updatedJobs = [...currentJobs];
          updatedJobs.splice(newOrder, 0, {
            ...jobToMove,
            column_id: newColumnId,
            order_index: newOrder * 100,
          });

          const jobsWithUpdatedOrders = updatedJobs.map((job, idx) => ({
            ...job,
            order_index: idx * 100,
          }));

          newColumns[targetColumnIndex] = {
            ...targetColumn,
            job_applications: jobsWithUpdatedOrders,
          };
        }
      }

      return newColumns;
    });

    try {
      await updateJobApplication(jobApplicationId, {
        columnId: newColumnId,
        order: newOrder,
      });
    } catch (err) {
      console.error("Error", err);
    }
  }

  return { board, columns, error, moveJob };
}