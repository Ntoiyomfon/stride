import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, HelpCircle, Bug } from "lucide-react";
import { BackToHomeButton } from "@/components/back-to-home-button";

export const metadata: Metadata = {
  title: "Contact Us - Stride",
  description: "Get in touch with the Stride team for support, feedback, or questions about job application tracking.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="mb-8">
        <BackToHomeButton />
      </div>
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Have a question, suggestion, or need help? We'd love to hear from you. 
          Choose the best way to get in touch with our team.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {/* Support Card */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Support</CardTitle>
            <CardDescription>
              Need help using Stride or have technical questions?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is here to help you get the most out of Stride.
            </p>
            <a 
              href="mailto:support@stride-app.com"
              className="text-primary hover:underline font-medium"
            >
              support@stride-app.com
            </a>
          </CardContent>
        </Card>

        {/* Feedback Card */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Feedback</CardTitle>
            <CardDescription>
              Share your ideas and suggestions for improving Stride
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              We value your input and use it to make Stride better for everyone.
            </p>
            <a 
              href="mailto:feedback@stride-app.com"
              className="text-primary hover:underline font-medium"
            >
              feedback@stride-app.com
            </a>
          </CardContent>
        </Card>

        {/* Bug Reports Card */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Bug className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Bug Reports</CardTitle>
            <CardDescription>
              Found a bug or something not working as expected?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Help us fix issues quickly by reporting bugs with details.
            </p>
            <a 
              href="mailto:bugs@stride-app.com"
              className="text-primary hover:underline font-medium"
            >
              bugs@stride-app.com
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Your full name" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="What's this about?" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us more about your question, feedback, or issue..."
                  rows={6}
                  required 
                />
              </div>
              
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a demo contact form. In a production environment, 
                this would be connected to a backend service to actually send emails. For now, 
                please use the direct email addresses above to contact us.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Other Ways to Reach Us</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
          <div>
            <h3 className="font-medium text-foreground mb-2">General Inquiries</h3>
            <a 
              href="mailto:hello@stride-app.com"
              className="text-primary hover:underline"
            >
              hello@stride-app.com
            </a>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-2">Privacy Questions</h3>
            <a 
              href="mailto:privacy@stride-app.com"
              className="text-primary hover:underline"
            >
              privacy@stride-app.com
            </a>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-2">Legal Matters</h3>
            <a 
              href="mailto:legal@stride-app.com"
              className="text-primary hover:underline"
            >
              legal@stride-app.com
            </a>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground mb-2">Partnerships</h3>
            <a 
              href="mailto:partnerships@stride-app.com"
              className="text-primary hover:underline"
            >
              partnerships@stride-app.com
            </a>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-primary/5 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-semibold text-foreground mb-2">Response Time</h3>
          <p className="text-muted-foreground">
            We typically respond to all inquiries within 24-48 hours during business days. 
            For urgent technical issues, please mark your email as "URGENT" in the subject line.
          </p>
        </div>
      </div>
    </div>
  );
}