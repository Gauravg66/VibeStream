import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSignUp } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, ShieldCheck, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const { registerUser, isAuthenticated } = useAuth();
  const { isLoaded, signUp, setActive } = useSignUp();

  // Route state passes verified details if user came from /login
  const stateClerkId = location.state?.clerkId || '';
  const stateEmail = location.state?.email || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(stateEmail);
  const [step, setStep] = useState(stateEmail ? 3 : 1); // 1 = Name/Email input, 2 = Verify OTP, 3 = Name input for pre-verified email
  const [clerkId, setClerkId] = useState(stateClerkId);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const otpRefs = useRef([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  // Handle direct sign up (Name + Email) - sends OTP
  const handleSignUpTrigger = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email || !isLoaded) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
      });
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code'
      });
      setStep(2);
      setInfoMessage('Verification OTP sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
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
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    if (otpRefs.current[focusIndex]) {
      otpRefs.current[focusIndex].focus();
    }
  };

  // Verify direct entry OTP and transition to creation
  const handleVerifyDirectSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: otpCode
      });
      
      if (result.status === 'complete') {
        // Activate Clerk session
        await setActive({ session: result.createdSessionId });
        
        // Sync user details to backend MongoDB database
        await handleSyncRegistration(result.createdUserId, email);
      } else {
        throw new Error(`Sign up status: ${result.status}`);
      }
    } catch (err) {
      setError(err.message || 'OTP validation failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle final registration sync to MongoDB Compass
  const handleSyncRegistration = async (targetClerkId, targetEmail) => {
    try {
      await registerUser(fullName.trim(), targetEmail, targetClerkId);
      setInfoMessage('Account created and synchronized successfully!');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    } catch (err) {
      setError(err.message || 'Failed to synchronize user account. Please contact support.');
    }
  };

  // Handle registration when user came pre-verified from /login
  const handlePreVerifiedSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full Name is required');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await handleSyncRegistration(clerkId, email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0C16] px-4 relative overflow-hidden">
      {/* Background Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl relative z-10 border border-slate-800">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-purple-500/10 text-purple-400 mb-3 border border-purple-500/20">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Register Profile</h2>
          <p className="text-sm text-slate-400 mt-2">
            {step === 1 && 'Create a new user account with details'}
            {step === 2 && 'Verify security code to finalize account setup'}
            {step === 3 && 'Finalize profile synchronization details'}
          </p>
        </div>


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

        {/* Direct Entry: Step 1 (Name & Email) */}
        {step === 1 && (
          <form onSubmit={handleSignUpTrigger} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-[#111424] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

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
              className="w-full py-3 px-4 mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Direct Entry: Step 2 (Verify OTP) */}
        {step === 2 && (
          <form onSubmit={handleVerifyDirectSubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">6-Digit Code</label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline focus:outline-none"
                >
                  Edit Details
                </button>
              </div>

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
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <span>Verify & Sync</span>
              )}
            </button>
          </form>
        )}

        {/* Redirected Entry: Step 3 (Verified Email, Input Name) */}
        {step === 3 && (
          <form onSubmit={handlePreVerifiedSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email ID (Verified)</label>
              <div className="relative opacity-60">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  disabled
                  className="w-full bg-[#111424] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm cursor-not-allowed"
                  value={email}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-[#111424] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="w-full py-3 px-4 mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <span>Complete Sign Up</span>
              )}
            </button>
          </form>
        )}

        {/* Redirect anchor */}
        <div className="mt-8 text-center pt-6 border-t border-slate-800/60">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
