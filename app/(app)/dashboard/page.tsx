import KanbanBoard from "@/components/kanban-board";
import { getSession } from "@/lib/auth/auth";
import connectDB from "@/lib/db";
import { Board } from "@/lib/models";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUser } from "@/lib/actions/user";
import { AccentColorSync } from "@/components/accent-color-sync";
import { PageLoader } from "@/components/loading-spinner";

async function getBoard(userId: string) {
  "use cache";

  await connectDB();

  const boardDoc = await Board.findOne({
    userId: userId,
    name: "Job Hunt",
  }).populate({
    path: "columns",
    populate: {
      path: "jobApplications",
    },
  });

  if (!boardDoc) return null;

  const board = JSON.parse(JSON.stringify(boardDoc));

  return board;
}

// Client component for animations
function DashboardContent({ board, userId, user }: { board: any; userId: string; user: any }) {
  return (
    <div className="min-h-screen bg-background">
      <AccentColorSync user={user} />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Job Hunt</h1>
          <p className="text-muted-foreground">Track your job applications</p>
        </div>
        <KanbanBoard board={board} userId={userId} />
      </div>
    </div>
  );
}

async function DashboardPage() {
  // CRITICAL: Check authentication FIRST before any data fetching
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Verify user still exists in database (in case account was deleted)
  const user = await getUser();
  if (!user) {
    // User was deleted, redirect to sign-in
    redirect("/sign-in");
  }

  // Only fetch board data after confirming user is authenticated and exists
  const board = await getBoard(session.user.id);

  return <DashboardContent board={board} userId={session.user.id} user={user} />;
}

export default async function Dashboard() {
  return (
    <Suspense fallback={<PageLoader text="Loading your dashboard..." />}>
      <DashboardPage />
    </Suspense>
  );
}