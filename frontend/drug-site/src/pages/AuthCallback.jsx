import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase handles the session exchange automatically in the background
      // but we want to ensure the user is directed to the right place and show loading
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        toast.error("Authentication failed: " + error.message);
        navigate('/login');
        return;
      }

      if (session) {
        toast.success("Welcome back!");
        const role = session.user.user_metadata?.role;
        
        if (!role) {
          // New user (Google/Social) with no role selected yet
          navigate('/login');
        } else if (role === 'supplier') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      } else {
        // Fallback for unexpected states
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="bg-white p-12 rounded-[40px] shadow-xl flex flex-col items-center gap-6 border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="bg-blue-50 p-6 rounded-full">
          <Activity className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Authenticating</h1>
          <p className="text-slate-500 font-medium">Please wait while we secure your session...</p>
        </div>
      </div>
    </div>
  );
};
