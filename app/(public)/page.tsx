"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, CheckCircle2, BarChart3, Bell, Play } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const productVideoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scrollToVideo = () => {
    productVideoRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'center'
    });
  };

  return (
    <div className={`transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-foreground mb-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Track your job applications in one place
          </h1>
          <p className="text-muted-foreground mb-8 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto">
            Stay organized, follow up on time, and know where you stand
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8 text-lg font-medium">
                Get started free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-12 px-8 text-lg font-medium"
              onClick={scrollToVideo}
            >
              <Play className="mr-2 h-5 w-5" />
              View demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required
          </p>
        </div>
      </section>

      {/* Product Preview */}
      <section ref={productVideoRef} className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              See Stride in action
            </h2>
            <p className="text-lg text-muted-foreground">
              Watch how easy it is to manage your job applications
            </p>
          </div>
          <div className="rounded-lg border bg-card p-2 shadow-2xl">
            <video 
              className="w-full aspect-video rounded-md"
              autoPlay
              muted
              loop
              playsInline
              controls
            >
              <source src="/productvideo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything you need to land your next job
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple tools that make a real difference in your job search
            </p>
          </div>
          
          <div className="grid gap-8 md:gap-12 grid-cols-1 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                Board view
              </h3>
              <p className="text-muted-foreground">
                See every application status at a glance
              </p>
            </div>
            
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                Reminders
              </h3>
              <p className="text-muted-foreground">
                Never miss a follow up
              </p>
            </div>
            
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                Analytics
              </h3>
              <p className="text-muted-foreground">
                Know what works and what doesn't
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-16">
              How it works
            </h2>
            
            <div className="grid gap-8 md:gap-12 grid-cols-1 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  1
                </div>
                <h3 className="mb-4 text-xl font-semibold text-foreground">
                  Add applications
                </h3>
                <p className="text-muted-foreground">
                  Quickly add job applications with company details and status
                </p>
              </div>
              
              <div className="text-center">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  2
                </div>
                <h3 className="mb-4 text-xl font-semibold text-foreground">
                  Track progress
                </h3>
                <p className="text-muted-foreground">
                  Move applications through your pipeline as they progress
                </p>
              </div>
              
              <div className="text-center">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  3
                </div>
                <h3 className="mb-4 text-xl font-semibold text-foreground">
                  Get hired
                </h3>
                <p className="text-muted-foreground">
                  Stay organized and never miss opportunities
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-8">
            Built for students and job seekers
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div>Early access users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">1,200+</div>
              <div>Applications tracked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">89%</div>
              <div>Success rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Ready to get organized?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of job seekers who trust Stride
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8 text-lg font-medium">
                Start free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}