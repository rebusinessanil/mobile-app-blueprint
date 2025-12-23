import { ChevronLeft, Shield, Lock, Mail, Smartphone, Camera, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Privacy Policy & Terms</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Privacy Policy Section */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Privacy Policy</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            <strong>Last Updated:</strong> 23 December 2025
          </p>
          <p className="text-muted-foreground mb-6">
            <strong>ReBusiness</strong> respects user privacy and is committed to protecting personal information. 
            This Privacy Policy explains how we collect, use, store, and protect user data in compliance with 
            <strong> Google Play Developer Policies</strong>.
          </p>

          {/* Section 1 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">1. Information We Collect</h3>
            <p className="text-muted-foreground mb-3">We may collect the following information when you use the app:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Full name</li>
              <li>Mobile number</li>
              <li>Profile photo</li>
              <li>Logo and rank details</li>
              <li>App usage data (non-personal)</li>
            </ul>
            <div className="mt-4 p-3 bg-secondary/50 rounded-md border-l-4 border-primary">
              <p className="text-sm text-foreground">
                ⚠️ We do <strong>NOT</strong> collect sensitive personal data such as Aadhaar, PAN, bank details, or passwords.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">2. How We Use Collected Information</h3>
            <p className="text-muted-foreground mb-3">Collected information is used strictly for:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Account creation and authentication</li>
              <li>Profile completion verification</li>
              <li>Displaying banner previews using user profile data</li>
              <li>Crediting promotional wallet bonuses</li>
              <li>Improving app performance and user experience</li>
              <li>Customer support and communication</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">3. Wallet & Promotional Credits</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>New users may receive <strong className="text-primary">₹199 promotional in-app credits</strong> after profile completion.</li>
              <li>These credits are <strong>non-transferable</strong> and <strong>not real money</strong>.</li>
              <li>Credits are for <strong>in-app usage only</strong> and have no guaranteed monetary value.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">4. Data Sharing & Third Parties</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>We <strong>do not sell, trade, or rent</strong> user data to third parties.</li>
              <li>Data may be processed using trusted third-party services (analytics, hosting) strictly for app functionality.</li>
              <li>All third parties comply with applicable data protection standards.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">5. Data Security</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>User data is stored securely using industry-standard security practices.</li>
              <li>Access to data is limited and protected against unauthorized use.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">6. User Control & Rights</h3>
            <p className="text-muted-foreground mb-3">Users can:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>View and update profile information</li>
              <li>Request account deletion</li>
              <li>Contact support for data-related queries</li>
            </ul>
            <div className="mt-4 flex items-center gap-2 text-primary">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Contact: rebusiness@gmail.com</span>
            </div>
          </div>

          {/* Section 7 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">7. Permissions Usage</h3>
            <p className="text-muted-foreground mb-3">The app may request permissions for:</p>
            <div className="space-y-2 ml-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Camera className="w-4 h-4 text-primary" />
                <span>Camera (profile photo upload)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <HardDrive className="w-4 h-4 text-primary" />
                <span>Storage (banner download)</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              These permissions are used <strong>only for app features</strong> and never for background misuse.
            </p>
          </div>

          {/* Section 8 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">8. Children's Privacy</h3>
            <p className="text-muted-foreground">
              This app is <strong>not intended for users under 18 years of age</strong>. 
              We do not knowingly collect data from minors.
            </p>
          </div>

          {/* Section 9 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">9. Policy Updates</h3>
            <p className="text-muted-foreground">
              This Privacy Policy may be updated periodically. Continued use of the app indicates acceptance of changes.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Terms & Conditions Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Terms & Conditions</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            <strong>Last Updated:</strong> 23 December 2025
          </p>
          <p className="text-muted-foreground mb-6">
            By using <strong>ReBusiness</strong>, you agree to the following Terms & Conditions.
          </p>

          {/* T&C Section 1 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">1. App Usage</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>Users must provide accurate information during registration.</li>
              <li>Profile completion is mandatory to unlock dashboard and banner features.</li>
              <li>Until profile completion, app features remain restricted.</li>
            </ul>
          </div>

          {/* T&C Section 2 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">2. Account Responsibility</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>Users are responsible for maintaining account security.</li>
              <li>Any misuse or false information may result in account suspension.</li>
            </ul>
          </div>

          {/* T&C Section 3 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">3. Promotional Bonuses</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>Promotional credits are optional and subject to change or removal.</li>
              <li>Credits do not represent real currency unless clearly stated.</li>
            </ul>
          </div>

          {/* T&C Section 4 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">4. Content & Banners</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>Banner previews use user profile details.</li>
              <li>Users are responsible for correctness of displayed information.</li>
              <li>Generated banners are for personal or promotional use only.</li>
            </ul>
          </div>

          {/* T&C Section 5 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">5. Prohibited Activities</h3>
            <p className="text-muted-foreground mb-3">Users must not:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Engage in fraudulent activities</li>
              <li>Attempt unauthorized access</li>
              <li>Misuse app features or data</li>
            </ul>
          </div>

          {/* T&C Section 6 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">6. Termination</h3>
            <p className="text-muted-foreground">
              The app reserves the right to suspend or terminate accounts violating these terms.
            </p>
          </div>

          {/* T&C Section 7 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">7. Limitation of Liability</h3>
            <p className="text-muted-foreground">
              The app is provided "as is" without warranties. We are not liable for indirect or incidental damages.
            </p>
          </div>

          {/* T&C Section 8 */}
          <div className="bg-card rounded-lg p-4 mb-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3">8. Governing Law</h3>
            <p className="text-muted-foreground">
              These terms are governed by applicable local laws.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-primary/10 rounded-lg p-4 mt-6 border border-primary/30">
            <h3 className="text-lg font-semibold text-foreground mb-3">10. Contact Information</h3>
            <div className="flex items-center gap-2 text-primary">
              <Mail className="w-5 h-5" />
              <a href="mailto:rebusiness@gmail.com" className="hover:underline">
                rebusiness@gmail.com
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
