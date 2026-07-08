import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1 = Email input, 2 = OTP input
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [receivedOtp, setReceivedOtp] = useState(''); // Dev helper to display OTP

  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  // Auto-focus first OTP input when step changes to 2
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await sendOtp(email);
      setStep(2);
      setInfoMessage('Verification code sent to your email.');
      if (res.devOtp) {
        setReceivedOtp(res.devOtp); // Capture OTP for easy local demonstration
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return; // Allow numbers only
    const newOtp = [...otp];
    // Take only the last character if user typed a digit
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input field
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: clear current field and move focus backwards
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && otpRefs.current[index - 1]) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return; // Only numeric pastes

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus last character input or next empty
    const focusIndex = Math.min(pastedData.length, 5);
    if (otpRefs.current[focusIndex]) {
      otpRefs.current[focusIndex].focus();
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await verifyOtp(email, otpCode);
      setInfoMessage('Authentication successful!');
      
      // Clerk-like Redirection Flow
      setTimeout(() => {
        if (result.userExists) {
          // Hard redirection to Home Page
          window.location.href = '/';
        } else {
          // Redirection to complete user details sync registration
          navigate('/register', { state: { email: result.email, clerkId: result.clerkId } });
        }
      }, 800);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setOtp(['', '', '', '', '', '']);
    setError('');
    setInfoMessage('');
    setReceivedOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0C16] px-4 relative overflow-hidden">
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl relative z-10 border border-slate-800">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">VibeStream Auth</h2>
          <p className="text-sm text-slate-400 mt-2">
            {step === 1 ? 'Enter your email to receive a secure login code' : 'Verify the security code sent to your inbox'}
          </p>
        </div>

        {/* Development Helper Toast */}
        {receivedOtp && (
          <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-center">
            <p className="text-xs text-indigo-300 font-medium">DEMO VERIFICATION CODE</p>
            <p className="text-2xl font-bold text-white tracking-widest mt-1">{receivedOtp}</p>
            <p className="text-[10px] text-indigo-400/80 mt-1">Copy and paste this code to proceed</p>
          </div>
        )}

        {/* Status Alerts */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-start gap-2.5 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && !error && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm text-center">
            {infoMessage}
          </div>
        )}

        {/* Form Body */}
        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email ID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full bg-[#111424] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">6-Digit Code</label>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline focus:outline-none"
                >
                  Change Email
                </button>
              </div>

              {/* 6-Digit input grid block */}
              <div className="grid grid-cols-6 gap-2.5" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    required
                    ref={(el) => (otpRefs.current[idx] = el)}
                    className="w-full aspect-square bg-[#111424] border border-slate-800 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        )}

        {/* Redirect anchor */}
        <div className="mt-8 text-center pt-6 border-t border-slate-800/60">
          <p className="text-sm text-slate-500">
            Need an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
