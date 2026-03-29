import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeviceIdentity } from '@/hooks/use-device-identity';
import { supabase } from '@/lib/supabase';
import { Shield } from 'lucide-react';

interface PrivacyPopupProps {
  onAccepted: () => void;
}

export function PrivacyPopup({ onAccepted }: PrivacyPopupProps) {
  const { deviceId, refreshProfile } = useDeviceIdentity();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    await supabase.from('profiles').update({
      privacy_accepted: true,
      privacy_accepted_at: new Date().toISOString(),
    }).eq('device_id', deviceId);
    await refreshProfile();
    setLoading(false);
    onAccepted();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-end justify-center p-4 pb-8"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-sm rounded-3xl overflow-hidden"
          style={{ background: 'rgba(20,12,40,0.97)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-white font-black text-lg">Privacy & Cookies</h2>
            </div>

            <p className="text-white/70 text-sm leading-relaxed">
              We use a local device ID to keep your profile and make the app work smoothly.
            </p>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-white/80 text-sm leading-relaxed">
                <span className="text-green-400 font-semibold">Your privacy matters.</span> We store only your profile info. <span className="font-semibold text-white">We never store, log, or share anything that happens inside game rooms</span> — your questions, answers, and chat are never saved to our servers.
              </p>
            </div>

            <p className="text-white/50 text-xs leading-relaxed">
              By continuing you agree to our{' '}
              <a
                href={`${import.meta.env.BASE_URL}privacy-policy`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 underline hover:text-pink-300 transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>

            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full h-13 py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', boxShadow: '0 4px 20px rgba(236,72,153,0.4)' }}
            >
              {loading ? 'Saving...' : 'Accept and Continue'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
