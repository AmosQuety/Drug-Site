import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Pill, Activity, Search } from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import { toast } from 'react-hot-toast';

export const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('buyer');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [cadre, setCadre] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role === 'supplier') {
      navigate('/dashboard');
    }
  }, [user, role, navigate]);

  if (user && role !== 'supplier' && !isSignUp) {
    const hasRole = !!role;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md border border-slate-100 text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
             <Activity className="text-blue-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {hasRole ? 'Welcome Back!' : 'Account Setup'}
          </h2>
          <p className="text-slate-500 mb-8 font-medium">
            {hasRole 
              ? <>You are logged in as <span className="text-blue-600 underline">{user.email}</span></>
              : "To continue, please select if you are a Buyer or a Supplier."}
          </p>
          <div className="space-y-4">
            {!hasRole && (
              <button 
                onClick={() => {
                  supabase.auth.updateUser({ data: { role: 'buyer', status: 'approved' } }).then(() => {
                    toast.success('Account set as Buyer');
                    window.location.href = '/';
                  });
                }}
                className="w-full bg-slate-800 text-white p-4 rounded-2xl font-bold hover:bg-slate-900 transition"
              >
                I am a Buyer
              </button>
            )}
            <button 
              onClick={() => {
                setSelectedRole('supplier');
                setIsSignUp(true);
              }}
              className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition"
            >
              {hasRole ? 'Register as Supplier' : 'I am a Supplier'}
            </button>
            <button 
              onClick={() => { supabase.auth.signOut(); window.location.reload(); }}
              className="w-full bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold hover:bg-slate-200 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const metadata = {
          role: selectedRole,
          ...(selectedRole === 'supplier' ? {
            business_name: businessName,
            city: city,
            license_number: licenseNumber,
            phone_number: phoneNumber,
            status: 'pending'
          } : {
            professional_reg_no: regNumber,
            cadre: cadre,
            status: 'approved' // Buyers don't need manual approval for now
          })
        };

        if (user) {
          const { error } = await supabase.auth.updateUser({ data: metadata });
          if (error) throw error;
          toast.success('Profile updated successfully!');
          if (selectedRole === 'supplier') {
            setIsSignUp(false);
          } else {
            navigate('/');
          }
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata }
          });
          if (error) throw error;
          toast.success('Signup successful! Please check your email.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          data: {
            role: selectedRole // Pass the selected role during social signup
          }
        }
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-600 p-3 rounded-2xl mb-4">
            <Pill className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isSignUp 
              ? (user ? `Complete ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Profile` : `Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account`)
              : `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Login`}
          </h2>
          <p className="text-slate-500 text-sm mt-2 text-center">
            {isSignUp 
              ? (selectedRole === 'supplier' ? 'Join our network to list your medicine inventory' : 'Set up your buyer account to access stock and more')
              : `Sign in as a ${selectedRole} to manage your account`}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!user && (
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-2">
              <button
                type="button"
                onClick={() => setSelectedRole('buyer')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition ${
                  selectedRole === 'buyer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Buyer
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('supplier')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition ${
                  selectedRole === 'supplier' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Supplier
              </button>
            </div>
          )}

          {isSignUp && selectedRole === 'supplier' && (
            <>
              <input 
                type="text" placeholder="Business Name" required
                className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition"
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" placeholder="City" required
                  className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition"
                  onChange={(e) => setCity(e.target.value)}
                />
                <input 
                  type="text" placeholder="License #" required
                  className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition"
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </div>
              <input 
                type="text" placeholder="Contact Phone Number" required
                className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition"
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </>
          )}

          {isSignUp && selectedRole === 'buyer' && (
            <>
              <input 
                type="text" placeholder="Professional Registration Number" required
                className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition"
                onChange={(e) => setRegNumber(e.target.value)}
              />
              <select 
                required
                className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition"
                onChange={(e) => setCadre(e.target.value)}
              >
                <option value="">Select Cadre</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Pharmacy Technician">Pharmacy Technician</option>
                <option value="Nurse">Nurse</option>
                <option value="Medical Doctor">Medical Doctor</option>
                <option value="Other">Other</option>
              </select>
            </>
          )}
          
          <input 
            type="email" placeholder="Email Address" required
            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition"
            onChange={(e) => setEmail(e.target.value)}
          />
          {!isSignUp && (
            <input 
              type="text" 
              placeholder={selectedRole === 'buyer' ? "Professional Registration No" : "Business License Number"}
              className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition"
            />
          )}
          <input 
            type="password" placeholder="Password" required
            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition"
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Activity className="w-5 h-5 animate-spin" />}
            {isSignUp ? 'Register Business' : 'Sign In'}
          </button>

          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-4 text-slate-400 text-xs font-bold uppercase tracking-widest absolute">Or</span>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-slate-200 text-slate-700 p-4 rounded-2xl font-bold hover:bg-slate-50 transition flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <div>
            <p className="text-slate-600 text-sm">
              {isSignUp ? 'Already have an account?' : 'Want to join as a supplier?'}
            </p>
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 font-bold mt-1 hover:underline"
            >
              {isSignUp ? 'Back to Login' : 'Create an Account'}
            </button>
          </div>
          
          <div className="pt-2">
            <button 
              onClick={() => navigate('/')}
              className="text-slate-400 text-sm hover:text-slate-600 transition flex items-center justify-center gap-1 mx-auto"
            >
              <Search className="w-4 h-4" /> Back to Medicine Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};