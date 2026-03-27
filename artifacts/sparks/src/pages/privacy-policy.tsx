import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { LayoutWrapper } from '@/components/layout-wrapper';

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-white/10 flex-shrink-0">
          <button onClick={() => setLocation(-1 as any)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-black text-lg">Privacy Policy</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5 hide-scrollbar">
          <div className="max-w-sm mx-auto space-y-5 text-white/80 text-sm leading-relaxed pb-8">
            <p className="text-white/50 text-xs">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <div>
              <h2 className="text-white font-bold text-base mb-2">1. What We Collect</h2>
              <p>We collect the following information when you create an account:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
                <li>First and last name</li>
                <li>Email address</li>
                <li>Year of birth</li>
                <li>Username and avatar (chosen by you)</li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
              <h2 className="text-green-400 font-bold text-base mb-2">🔒 Game Room Privacy</h2>
              <p className="text-white/80">
                <strong className="text-white">We never store any information from game rooms.</strong> This includes your questions, answers, chat messages, emoji reactions, and any content shared during gameplay. All game room data exists only in memory and is permanently deleted when the room closes.
              </p>
            </div>

            <div>
              <h2 className="text-white font-bold text-base mb-2">2. How We Use Your Data</h2>
              <p>Your information is used solely to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
                <li>Create and manage your account</li>
                <li>Personalise your game experience (avatar, username)</li>
                <li>Verify age for appropriate content levels</li>
                <li>Enable future reward and subscription features</li>
              </ul>
            </div>

            <div>
              <h2 className="text-white font-bold text-base mb-2">3. Cookies</h2>
              <p>We use essential cookies to keep you signed in and maintain your session. We do not use advertising or tracking cookies.</p>
            </div>

            <div>
              <h2 className="text-white font-bold text-base mb-2">4. Data Sharing</h2>
              <p>We do not sell, rent, or share your personal data with third parties for marketing purposes. Your data is stored securely on Supabase infrastructure.</p>
            </div>

            <div>
              <h2 className="text-white font-bold text-base mb-2">5. Device Sessions</h2>
              <p>To enforce our one-room-per-device policy, we store an anonymous device identifier linked to your account. This identifier does not contain any personal information.</p>
            </div>

            <div>
              <h2 className="text-white font-bold text-base mb-2">6. Your Rights</h2>
              <p>You may request deletion of your account and all associated data at any time by contacting us. Upon deletion, all your profile information is permanently removed.</p>
            </div>

            <div>
              <h2 className="text-white font-bold text-base mb-2">7. Contact</h2>
              <p>If you have questions about this policy, please contact us through the app's support channel.</p>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
