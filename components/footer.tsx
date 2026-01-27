"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold text-foreground">Stride</h3>
            <p className="text-sm text-muted-foreground">
              Track your job applications in one place
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link 
              href="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link 
              href="/contact" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
        
        <div className="mt-6 border-t pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Stride. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}