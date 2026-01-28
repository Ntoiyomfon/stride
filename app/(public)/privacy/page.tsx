import type { Metadata } from "next";
import { BackToHomeButton } from "@/components/back-to-home-button";

export const metadata: Metadata = {
  title: "Privacy Policy - Stride",
  description: "Learn how Stride protects and handles your personal information and job application data.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="mb-8">
        <BackToHomeButton />
      </div>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <p className="text-muted-foreground mb-8">
          Last updated: January 27, 2025
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Stride, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
              and protect your information when you use our job application tracking service. By using Stride, 
              you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-foreground mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Name and email address when you create an account</li>
              <li>Profile picture (optional)</li>
              <li>Authentication information (encrypted passwords, OAuth tokens)</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3 mt-6">Job Application Data</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Company names and job titles</li>
              <li>Application status and dates</li>
              <li>Notes and comments you add</li>
              <li>Custom board and column configurations</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mb-3 mt-6">Usage Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Device information and browser type</li>
              <li>IP address and location data</li>
              <li>Usage patterns and feature interactions</li>
              <li>Session information and login history</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and maintain the Stride service</li>
              <li>Authenticate your account and ensure security</li>
              <li>Store and organize your job application data</li>
              <li>Send important service notifications</li>
              <li>Improve our service and develop new features</li>
              <li>Provide customer support when needed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Encrypted data transmission using HTTPS</li>
              <li>Secure password hashing and storage</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication systems</li>
              <li>Secure cloud infrastructure with MongoDB</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Stride integrates with third-party services for authentication and functionality:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Google OAuth:</strong> For Google sign-in (subject to Google's Privacy Policy)</li>
              <li><strong>GitHub OAuth:</strong> For GitHub sign-in (subject to GitHub's Privacy Policy)</li>
              <li><strong>MongoDB:</strong> For secure data storage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active. When you delete your account, 
              we permanently remove all your personal information and job application data from our systems 
              within 30 days. Some anonymized usage data may be retained for service improvement purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access and download your data</li>
              <li>Update or correct your information</li>
              <li>Delete your account and all associated data</li>
              <li>Opt out of non-essential communications</li>
              <li>Request information about how your data is used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              Stride uses essential cookies for authentication and session management. We also use 
              local storage for user preferences like theme settings. We do not use tracking cookies 
              or share data with advertising networks.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date. 
              Continued use of Stride after changes constitutes acceptance of the new policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or how we handle your data, 
              please contact us at{" "}
              <a href="mailto:privacy@stride-app.com" className="text-primary hover:underline">
                privacy@stride-app.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}