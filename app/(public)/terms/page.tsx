import type { Metadata } from "next";
import { BackToHomeButton } from "@/components/back-to-home-button";

export const metadata: Metadata = {
  title: "Terms of Service - Stride",
  description: "Read the terms and conditions for using Stride job application tracking service.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="mb-8">
        <BackToHomeButton />
      </div>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        
        <p className="text-muted-foreground mb-8">
          Last updated: January 27, 2025
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Stride, you accept and agree to be bound by the terms and provision 
              of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Stride is a web-based job application tracking service that helps users organize, manage, 
              and track their job search activities. The service includes features such as application 
              status tracking, kanban boards, reminders, and analytics to help users stay organized 
              during their job search process.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">User Accounts</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Account Creation</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 13 years old to use Stride</li>
              <li>One person may not maintain more than one account</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3 mt-6">Account Responsibilities</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>You must not share your account credentials with others</li>
              <li>You must keep your contact information up to date</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Acceptable Use</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Permitted Uses</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Track and manage your own job applications</li>
              <li>Organize job search activities and notes</li>
              <li>Use analytics features to improve your job search strategy</li>
              <li>Access the service for personal, non-commercial purposes</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3 mt-6">Prohibited Uses</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to other users' accounts</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Scrape, crawl, or automatically collect data from the service</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the service to spam or harass others</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Data and Privacy</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You retain ownership of all data you input into Stride</li>
              <li>You grant us permission to store and process your data to provide the service</li>
              <li>We will protect your data according to our Privacy Policy</li>
              <li>You are responsible for backing up important data</li>
              <li>You can delete your account and data at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              While we strive to provide reliable service, we cannot guarantee:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>100% uptime or uninterrupted access to the service</li>
              <li>That the service will be error-free or bug-free</li>
              <li>That all features will work perfectly at all times</li>
              <li>Compatibility with all devices or browsers</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We reserve the right to modify, suspend, or discontinue the service at any time 
              with reasonable notice to users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Stride service, including its design, code, features, and content, is owned by us 
              and protected by intellectual property laws. You may not:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Copy, modify, or distribute our code or design</li>
              <li>Use our trademarks or branding without permission</li>
              <li>Create derivative works based on our service</li>
              <li>Remove or alter any copyright notices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Stride is provided "as is" without warranties of any kind. We are not liable for any 
              damages arising from your use of the service, including but not limited to data loss, 
              missed job opportunities, or service interruptions. Your use of Stride is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibred text-foreground mb-4">Account Termination</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">By You</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may delete your account at any time through the settings page. Upon deletion, 
              all your data will be permanently removed from our systems.
            </p>

            <h3 className="text-xl font-medium text-foreground mb-3">By Us</h3>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate your account if you violate these terms, engage in 
              prohibited activities, or if required by law. We will provide reasonable notice 
              when possible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms of Service from time to time. We will notify users of 
              significant changes by email or through the service. Continued use of Stride after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by and construed in accordance with applicable laws. 
              Any disputes will be resolved through binding arbitration or in the appropriate 
              courts of jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@stride-app.com" className="text-primary hover:underline">
                legal@stride-app.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}