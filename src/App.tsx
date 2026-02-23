/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Activity, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  AlertCircle, 
  User, 
  Stethoscope, 
  Hospital,
  ChevronRight,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Info,
  Eye,
  EyeOff,
  Lock,
  Mail,
  LogOut,
  Phone,
  Home,
  Save,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type View = 'landing' | 'patient' | 'doctor' | 'admin' | 'ai-assistant' | 'emergency' | 'profile';
type Role = 'patient' | 'doctor' | 'admin';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
}

interface UserSession {
  email: string;
  role: Role;
  profile: UserProfile;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed';
}

// --- Mock Data ---
const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '1', doctor: 'Dr. Sarah Smith', specialty: 'Cardiologist', date: '2024-05-24', time: '10:00 AM', status: 'confirmed' },
  { id: '2', doctor: 'Dr. James Wilson', specialty: 'Neurologist', date: '2024-05-26', time: '02:30 PM', status: 'pending' },
];

const MOCK_HOSPITALS = [
  { name: 'City General Hospital', distance: '1.2 km', beds: 14, status: 'High Availability' },
  { name: 'St. Mary\'s Medical Center', distance: '3.5 km', beds: 2, status: 'Critical' },
  { name: 'Northside Clinic', distance: '0.8 km', beds: 5, status: 'Moderate' },
];

const MOCK_HEALTH_HISTORY = {
  diagnoses: [
    { condition: 'Hypertension', date: '2022-10-15', doctor: 'Dr. Sarah Smith' },
    { condition: 'Type 2 Diabetes', date: '2023-03-20', doctor: 'Dr. James Wilson' },
  ],
  medications: [
    { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
    { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily with meals' },
  ],
  allergies: [
    { allergen: 'Penicillin', severity: 'High' },
    { allergen: 'Peanuts', severity: 'Moderate' },
  ],
};

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [view, setView] = useState<View>('landing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, userMessage].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: "You are a helpful AI Symptom Assistant for the Smart Healthcare Access System. Provide preliminary health guidance, suggest potential causes for symptoms, and emphasize that you are NOT a doctor. Always recommend seeing a professional for serious issues. Keep responses concise and structured.",
        }
      });

      const modelText = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Error: Unable to connect to AI service. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const triggerSOS = () => {
    setSosActive(true);
    // Simulate emergency protocol
    setTimeout(() => {
      setSosActive(false);
      alert("Emergency Alert Sent! Nearest hospital (City General) has been notified of your location.");
    }, 3000);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSession(null);
      setView('landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setSession({
            ...data.user,
            profile: {
              name: data.user.username,
              email: data.user.email,
              phone: '+1 (555) 000-0000',
              address: '123 Health St, Medical City',
              dob: '1990-01-01'
            }
          });
          // Redirect based on role if needed
          if (data.user.role === 'patient') setView('patient');
          else if (data.user.role === 'doctor') setView('doctor');
          else if (data.user.role === 'admin') setView('admin');
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };
    checkSession();
  }, []);

  // --- Components ---

  const LoginView = () => {
    const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [role, setRole] = useState<Role>('patient');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string; general?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validate = () => {
      const newErrors: { email?: string; password?: string; username?: string } = {};
      if (authMode === 'register' && !username) {
        newErrors.username = 'Username is required';
      }
      if (authMode !== 'reset' && !email) {
        newErrors.email = 'Email is required';
      } else if (authMode !== 'reset' && !/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Email is invalid';
      }
      if ((authMode === 'login' || authMode === 'register' || authMode === 'reset') && !password) {
        newErrors.password = 'Password is required';
      } else if ((authMode === 'login' || authMode === 'register' || authMode === 'reset') && password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setIsLoading(true);
      setErrors({});

      let endpoint = '';
      let body = {};

      if (authMode === 'login') {
        endpoint = '/api/auth/login';
        body = { email, password };
      } else if (authMode === 'register') {
        endpoint = '/api/auth/register';
        body = { username, email, password, role };
      } else if (authMode === 'forgot') {
        endpoint = '/api/auth/forgot-password';
        body = { email };
      } else if (authMode === 'reset') {
        endpoint = '/api/auth/reset-password';
        body = { token: resetToken, newPassword: password };
      }

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
          setErrors({ general: data.error || 'Authentication failed' });
          setIsLoading(false);
          return;
        }

        if (authMode === 'register') {
          alert('Registration successful! Please log in.');
          setAuthMode('login');
        } else if (authMode === 'forgot') {
          alert('If an account exists with this email, a reset link has been sent.');
          // For demo purposes, we'll show the token if it's returned (it is in our mock backend)
          if (data.token) {
            console.log("DEMO ONLY: Token is", data.token);
            setResetToken(data.token);
            setAuthMode('reset');
          } else {
            setAuthMode('login');
          }
        } else if (authMode === 'reset') {
          alert('Password reset successful! Please log in with your new password.');
          setAuthMode('login');
        } else {
          setSession({
            ...data.user,
            profile: {
              name: data.user.username,
              email: data.user.email,
              phone: '+1 (555) 000-0000',
              address: '123 Health St, Medical City',
              dob: '1990-01-01'
            }
          });
          if (data.user.role === 'patient') setView('patient');
          else if (data.user.role === 'doctor') setView('doctor');
          else if (data.user.role === 'admin') setView('admin');
        }
      } catch (error) {
        setErrors({ general: 'Connection error. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-emerald-500/5 border border-slate-100 overflow-hidden"
        >
          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center mb-10">
              <div className="bg-emerald-500 p-4 rounded-3xl shadow-lg shadow-emerald-500/20 mb-4">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {authMode === 'login' && 'Welcome Back'}
                {authMode === 'register' && 'Create Account'}
                {authMode === 'forgot' && 'Reset Password'}
                {authMode === 'reset' && 'New Password'}
              </h1>
              <p className="text-slate-500 mt-2 text-center">
                {authMode === 'login' && 'Access your Smart Healthcare account'}
                {authMode === 'register' && 'Join the Smart Healthcare network'}
                {authMode === 'forgot' && 'Enter your email to receive a reset link'}
                {authMode === 'reset' && 'Set a secure new password for your account'}
              </p>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                <AlertCircle className="w-5 h-5" />
                {errors.general}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              {(authMode === 'login' || authMode === 'register') && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Select Your Role</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['patient', 'doctor', 'admin'] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={cn(
                          "py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border-2",
                          role === r 
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Username</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="johndoe"
                      className={cn(
                        "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none transition-all focus:bg-white focus:border-emerald-500",
                        errors.username && "border-red-500 bg-red-50"
                      )}
                    />
                  </div>
                  {errors.username && <p className="text-xs font-bold text-red-500 ml-1">{errors.username}</p>}
                </div>
              )}

              {authMode !== 'reset' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={cn(
                        "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none transition-all focus:bg-white focus:border-emerald-500",
                        errors.email && "border-red-500 bg-red-50"
                      )}
                    />
                  </div>
                  {errors.email && <p className="text-xs font-bold text-red-500 ml-1">{errors.email}</p>}
                </div>
              )}

              {authMode === 'reset' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Reset Token</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Enter token from email"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none transition-all focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {(authMode === 'login' || authMode === 'register' || authMode === 'reset') && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-bold text-slate-700">
                      {authMode === 'reset' ? 'New Password' : 'Password'}
                    </label>
                    {authMode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => setAuthMode('forgot')}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={cn(
                        "w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none transition-all focus:bg-white focus:border-emerald-500",
                        errors.password && "border-red-500 bg-red-50"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs font-bold text-red-500 ml-1">{errors.password}</p>}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {authMode === 'login' && 'Sign In'}
                    {authMode === 'register' && 'Create Account'}
                    {authMode === 'forgot' && 'Send Reset Link'}
                    {authMode === 'reset' && 'Reset Password'}
                  </span>
                )}
              </button>

              {authMode === 'forgot' && (
                <button 
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Back to Login
                </button>
              )}
            </form>

            {(authMode === 'login' || authMode === 'register') && (
              <div className="mt-10 text-center">
                <p className="text-slate-500 text-sm">
                  {authMode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button 
                    onClick={() => {
                      setAuthMode(authMode === 'register' ? 'login' : 'register');
                      setErrors({});
                    }}
                    className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    {authMode === 'register' ? 'Sign In' : 'Create Account'}
                  </button>
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Healthcare Access Node</p>
          </div>
        </motion.div>
      </div>
    );
  };

  const ProfileView = () => {
    const [profile, setProfile] = useState<UserProfile>(session?.profile || {
      name: '',
      email: '',
      phone: '',
      address: '',
      dob: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
      setIsSaving(true);
      // Simulate API call
      setTimeout(() => {
        if (session) {
          setSession({ ...session, profile });
        }
        setIsSaving(false);
        setIsEditing(false);
        alert("Profile updated successfully!");
      }, 1000);
    };

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">My Profile</h2>
            <p className="text-slate-500">Manage your personal information and contact details</p>
          </div>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}
        </header>

        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-8">
            <div className="flex flex-col items-center pb-8 border-b border-slate-100">
              <div className="w-24 h-24 bg-emerald-100 rounded-[32px] flex items-center justify-center mb-4 border-4 border-white shadow-xl">
                <User className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-widest mt-1">{session?.role}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    disabled={!isEditing}
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none transition-all focus:bg-white focus:border-emerald-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email"
                    disabled={!isEditing}
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none transition-all focus:bg-white focus:border-emerald-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="tel"
                    disabled={!isEditing}
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none transition-all focus:bg-white focus:border-emerald-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Date of Birth</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="date"
                    disabled={!isEditing}
                    value={profile.dob}
                    onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none transition-all focus:bg-white focus:border-emerald-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Residential Address</label>
                <div className="relative group">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    disabled={!isEditing}
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none transition-all focus:bg-white focus:border-emerald-500 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Sidebar = () => (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 border-bottom border-slate-800">
        <div className="bg-emerald-500 p-2 rounded-lg">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">SmartHealth</span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        <button 
          onClick={() => setView('landing')}
          className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", view === 'landing' ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-800 text-slate-400")}
        >
          <Info className="w-5 h-5" />
          <span>Project Info</span>
        </button>
        
        {session?.role === 'patient' && (
          <>
            <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</div>
            <button 
              onClick={() => setView('patient')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", view === 'patient' ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-800 text-slate-400")}
            >
              <User className="w-5 h-5" />
              <span>My Portal</span>
            </button>
            <button 
              onClick={() => setView('profile')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", view === 'profile' ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-800 text-slate-400")}
            >
              <User className="w-5 h-5" />
              <span>My Profile</span>
            </button>
          </>
        )}

        {session?.role === 'doctor' && (
          <>
            <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctor</div>
            <button 
              onClick={() => setView('doctor')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", view === 'doctor' ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-800 text-slate-400")}
            >
              <Stethoscope className="w-5 h-5" />
              <span>Physician Dashboard</span>
            </button>
          </>
        )}

        {session?.role === 'admin' && (
          <>
            <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</div>
            <button 
              onClick={() => setView('admin')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", view === 'admin' ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-800 text-slate-400")}
            >
              <Hospital className="w-5 h-5" />
              <span>Hospital Control</span>
            </button>
          </>
        )}
        
        <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Tools</div>
        <button 
          onClick={() => setView('ai-assistant')}
          className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", view === 'ai-assistant' ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-800 text-slate-400")}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Symptom Assistant</span>
        </button>

        <div className="pt-auto mt-10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-red-500/10 text-slate-400 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="p-4">
        <button 
          onClick={triggerSOS}
          disabled={sosActive}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-lg",
            sosActive ? "bg-red-900 text-red-200 animate-pulse" : "bg-red-600 hover:bg-red-700 text-white"
          )}
        >
          <AlertCircle className="w-6 h-6" />
          <span>{sosActive ? "SENDING..." : "EMERGENCY SOS"}</span>
        </button>
      </div>
    </div>
  );

  const LandingView = () => (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">Smart Healthcare Access System</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          A unified digital ecosystem bridging the gap between patients, doctors, and hospitals for faster, smarter care.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div className="bg-amber-100 w-12 h-12 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">The Problem</h3>
          <p className="text-slate-600 leading-relaxed">
            Healthcare is often fragmented. Patients struggle to find available doctors, hospitals face resource management issues, and emergency responses are delayed due to lack of real-time data.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Our Solution</h3>
          <p className="text-slate-600 leading-relaxed">
            We provide a centralized platform with AI-driven symptom analysis, one-tap emergency SOS, and real-time appointment booking to optimize the entire healthcare journey.
          </p>
        </div>
      </div>

      <section className="bg-slate-900 text-white p-10 rounded-[40px] space-y-8">
        <h2 className="text-3xl font-bold text-center">Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: User, title: "Patient Module", desc: "Manage health records and book appointments." },
            { icon: Stethoscope, title: "Doctor Module", desc: "Manage schedules and view patient history." },
            { icon: Hospital, title: "Hospital Admin", desc: "Track bed availability and emergency alerts." },
            { icon: AlertCircle, title: "Emergency SOS", desc: "Instant location broadcast to nearest hospitals." },
            { icon: MessageSquare, title: "AI Assistant", desc: "Gemini-powered symptom analysis 24/7." },
            { icon: Activity, title: "Health Analytics", desc: "Data-driven insights for better outcomes." },
          ].map((feature, i) => (
            <div key={i} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-emerald-500/50 transition-colors">
              <feature.icon className="w-8 h-8 text-emerald-400 mb-4" />
              <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
              <p className="text-slate-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const PatientView = () => (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Welcome back, John</h2>
          <p className="text-slate-500">Your health overview for today</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Download Records</button>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">New Appointment</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              Upcoming Appointments
            </h3>
            <div className="space-y-4">
              {MOCK_APPOINTMENTS.map(apt => (
                <div key={apt.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{apt.doctor}</p>
                      <p className="text-sm text-slate-500">{apt.specialty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{apt.date}</p>
                    <p className="text-sm text-slate-500">{apt.time}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    apt.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {apt.status}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Health Vitals (Last 24h)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Heart Rate', value: '72 bpm', status: 'Normal', color: 'text-emerald-500' },
                { label: 'Blood Pressure', value: '120/80', status: 'Normal', color: 'text-emerald-500' },
                { label: 'Blood Oxygen', value: '98%', status: 'Normal', color: 'text-emerald-500' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                  <p className={cn("text-xs font-medium mt-1", stat.color)}>{stat.status}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-500" />
              Health History
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Diagnoses</h4>
                {MOCK_HEALTH_HISTORY.diagnoses.map((d, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-900 text-sm">{d.condition}</p>
                    <p className="text-xs text-slate-500">{d.date} • {d.doctor}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Medications</h4>
                {MOCK_HEALTH_HISTORY.medications.map((m, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.dosage} • {m.frequency}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Allergies</h4>
                {MOCK_HEALTH_HISTORY.allergies.map((a, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{a.allergen}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                      a.severity === 'High' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {a.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Nearby Hospitals
            </h3>
            <div className="space-y-4">
              {MOCK_HOSPITALS.map((h, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-sm">{h.name}</p>
                    <span className="text-xs text-slate-400">{h.distance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">{h.beds} beds available</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                      h.status === 'High Availability' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>{h.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-sm transition-colors">View Map</button>
          </section>
        </div>
      </div>
    </div>
  );

  const AIAssistantView = () => (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">AI Symptom Assistant</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Powered by Gemini AI
            </p>
          </div>
        </div>
        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          NOT A MEDICAL DIAGNOSIS
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mb-2">
              <Stethoscope className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">How can I help you today?</h4>
            <p className="text-slate-500 text-sm">
              Describe your symptoms or ask health-related questions. I can provide preliminary guidance and suggest next steps.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {["I have a persistent headache", "What are early signs of flu?", "How to treat a minor burn?"].map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => { setInput(q); }}
                  className="text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] p-4 rounded-3xl text-sm",
              m.role === 'user' 
                ? "bg-emerald-600 text-white rounded-tr-none" 
                : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
            )}>
              <div className="prose prose-sm max-w-none prose-slate">
                <ReactMarkdown>
                  {m.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-3xl rounded-tl-none border border-slate-200">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-6 bg-slate-50/50 border-t border-slate-100">
        <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:border-emerald-500 transition-colors">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Describe your symptoms..."
            className="flex-1 bg-transparent px-4 py-2 outline-none text-sm"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const DoctorView = () => (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Physician Dashboard</h2>
        <p className="text-slate-500">Dr. Sarah Smith | Cardiology Department</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Patients', value: '1,284', icon: User, color: 'bg-blue-500' },
          { label: 'Today\'s Appointments', value: '12', icon: Calendar, color: 'bg-emerald-500' },
          { label: 'Pending Reports', value: '5', icon: Clock, color: 'bg-amber-500' },
          { label: 'Emergency Alerts', value: '0', icon: AlertCircle, color: 'bg-red-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.color)}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Patient Queue</h3>
          <button className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Patient Name</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {[
              { name: 'John Doe', time: '10:00 AM', reason: 'Routine Checkup', status: 'Waiting' },
              { name: 'Alice Johnson', time: '10:30 AM', reason: 'Chest Pain', status: 'In Progress' },
              { name: 'Robert Brown', time: '11:00 AM', reason: 'Follow-up', status: 'Checked In' },
            ].map((p, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                <td className="px-6 py-4 text-slate-500">{p.time}</td>
                <td className="px-6 py-4 text-slate-500">{p.reason}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    p.status === 'In Progress' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                  )}>{p.status}</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-emerald-600 font-bold hover:underline">Open File</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const AdminView = () => {
    const resourceData = [
      { name: 'ICU Beds', current: 12, total: 15, available: 3, color: '#10b981' },
      { name: 'ER Ward', current: 45, total: 50, available: 5, color: '#f59e0b' },
      { name: 'Gen Ward', current: 180, total: 200, available: 20, color: '#10b981' },
      { name: 'Ventilators', current: 8, total: 10, available: 2, color: '#10b981' },
    ];

    const occupancyData = [
      { name: 'Occupied', value: resourceData.reduce((acc, curr) => acc + curr.current, 0), fill: '#10b981' },
      { name: 'Available', value: resourceData.reduce((acc, curr) => acc + curr.available, 0), fill: '#e2e8f0' },
    ];

    return (
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Hospital Administration</h2>
            <p className="text-slate-500">City General Hospital | Central Command</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-slate-700">System Live</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold">Real-time Resource Allocation</h3>
                <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm" /> Occupied
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-slate-100 rounded-sm" /> Available
                  </div>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="current" stackId="a" radius={[0, 0, 0, 0]}>
                      {resourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Bar dataKey="available" stackId="a" fill="#f1f5f9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {resourceData.map((res, i) => (
                  <div key={i} className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{res.name}</p>
                    <p className="text-lg font-bold text-slate-900">{Math.round((res.current / res.total) * 100)}%</p>
                    <p className="text-[10px] text-slate-400 font-medium">Occupied</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold mb-6">Weekly Admission Trends</h3>
              <div className="h-[200px] w-full flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm font-medium">Chart data loading...</p>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-6 text-center">Overall Occupancy</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occupancyData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">88%</p>
                <p className="text-sm text-slate-500 font-medium">Capacity Reached</p>
              </div>
            </section>

            <section className="bg-red-50 p-6 rounded-[40px] border border-red-100">
              <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Active Emergency Alerts
              </h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-3xl border border-red-200 shadow-sm animate-pulse">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical SOS</span>
                    <span className="text-[10px] text-slate-400">2 mins ago</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">Location: 42nd Street, Block B</p>
                  <p className="text-xs text-slate-500 mt-1">User: John Doe | ID: #9921</p>
                  <button className="w-full mt-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Dispatch Ambulance</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {!session ? (
        <LoginView />
      ) : (
        <>
          <Sidebar />
          <main className="ml-64 p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {view === 'landing' && <LandingView />}
                {view === 'patient' && <PatientView />}
                {view === 'doctor' && <DoctorView />}
                {view === 'admin' && <AdminView />}
                {view === 'ai-assistant' && <AIAssistantView />}
                {view === 'profile' && <ProfileView />}
              </motion.div>
            </AnimatePresence>
          </main>
        </>
      )}
    </div>
  );
}
