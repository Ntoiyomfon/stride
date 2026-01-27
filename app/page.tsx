"use client";

import ImageTab from "@/components/image-tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageTabRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create a timeline for the crazy reveal
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // Split the title into WORDS for animation (not characters to preserve wrapping)
      if (titleRef.current) {
        const text = titleRef.current.textContent || "";
        const words = text.split(" ").filter(word => word.length > 0);

        titleRef.current.innerHTML = words
          .map((word) => `<span class="inline-block opacity-0">${word}</span>`)
          .join('<span class="inline-block">&nbsp;</span>');

        const wordSpans = titleRef.current.querySelectorAll("span");

        // Words fly in from random directions with rotation
        tl.fromTo(
          wordSpans,
          {
            opacity: 0,
            scale: 0,
            rotation: () => gsap.utils.random(-180, 180),
            y: () => gsap.utils.random(-100, 100),
          },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            y: 0,
            duration: 0.8,
            stagger: {
              each: 0.08,
              from: "random",
            },
          },
          0
        );
      }

      // Subtitle slides in from bottom with elastic bounce
      tl.fromTo(
        subtitleRef.current,
        {
          opacity: 0,
          y: 50,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "elastic.out(1, 0.6)",
        },
        0.5
      );

      // CTA explodes in with scale and rotation
      tl.fromTo(
        ctaRef.current,
        {
          opacity: 0,
          scale: 0,
          rotation: 180,
        },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: "back.out(1.5)",
        },
        0.8
      );

      // Image tab flips in
      tl.fromTo(
        imageTabRef.current,
        {
          opacity: 0,
          rotationX: -45,
          transformPerspective: 1000,
          y: 50,
        },
        {
          opacity: 1,
          rotationX: 0,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        1
      );

      // Features cards slide in from sides with stagger
      if (featuresRef.current) {
        const featureCards = featuresRef.current.querySelectorAll(".feature-card");
        tl.fromTo(
          featureCards,
          {
            opacity: 0,
            y: 60,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.15,
            ease: "power3.out",
          },
          1.2
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background overflow-x-hidden">
      <main className="flex-1 overflow-x-hidden">
        {/* Hero section */}
        <section ref={heroRef} className="container mx-auto px-4 py-16 sm:py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h2
              ref={titleRef}
              className="text-foreground mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
            >
              Track every job applications in one places. 
            </h2>
            <p
              ref={subtitleRef}
              className="text-muted-foreground mb-8 sm:mb-10 text-base sm:text-lg md:text-xl px-2"
            >
              Capture organize, and manage your job search in one place.
            </p>
            <div ref={ctaRef} className="flex flex-col items-center gap-3 sm:gap-4">
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
        <div ref={imageTabRef} className="overflow-hidden">
          <ImageTab />
        </div>

        {/* Features Section */}
        <section ref={featuresRef} className="border-t bg-card py-16 sm:py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 sm:gap-10 md:gap-12 grid-cols-1 md:grid-cols-3">
              <div className="feature-card flex flex-col items-center md:items-start text-center md:text-left">
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
              <div className="feature-card flex flex-col items-center md:items-start text-center md:text-left">
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
              <div className="feature-card flex flex-col items-center md:items-start text-center md:text-left">
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
