"use client";

import ImageTab from "@/components/image-tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        {/* Hero section */}
        <section className="container mx-auto px-4 py-16 sm:py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-foreground mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Track every job application in one place
            </h2>
            <p className="text-muted-foreground mb-8 sm:mb-10 text-base sm:text-lg md:text-xl px-2">
              Capture, organize, and manage your job search in one place.
            </p>
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-medium">
                  Start for free <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Free forever. No credit card required🙂
              </p>
            </div>
          </div>
        </section>

        {/* Hero Images Section */}
        <div>
          <ImageTab />
        </div>

        {/* Features Section */}
        <section className="border-t bg-card py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 sm:gap-10 md:gap-12 grid-cols-1 md:grid-cols-3">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-semibold text-foreground">
                  Organize Applications
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Create custom boards and columns to track your job
                  applications at every stage of the process.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-semibold text-foreground">
                  Track Progress
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Monitor your application status from applied to interview to
                  offer with visual Kanban boards.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-semibold text-foreground">
                  Stay Organized
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Never lose track of an application. Keep all your job search
                  information in one centralized place.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
