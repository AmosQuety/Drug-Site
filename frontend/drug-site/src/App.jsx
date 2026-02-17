import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { API_URL } from './config';
import { useState, useEffect } from 'react';
import { Search, Pill, Store, LogIn, Phone, MessageSquare, Activity, CheckCircle, MapPin, ShieldCheck, ShieldAlert, X, Heart, UserPlus } from 'lucide-react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BuyerDashboard } from './pages/BuyerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthCallback } from './pages/AuthCallback';
import { Autocomplete } from './components/Autocomplete';
import { About } from './pages/About';
import { AuthProvider, useAuth } from './components/context/AuthContext';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './lib/supabase';

console.log('Supabase initialized in App.jsx:', !!supabase);

// Role Based Dashboard Wrapper
const RoleBasedDashboard = () => {
  const { role } = useAuth();
  if (role === 'buyer') return <BuyerDashboard />;
  if (role === 'supplier') return <Dashboard />;
  return <Navigate to="/" replace />;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Activity className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Activity className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  if (!user || role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// 1. Home / Search Page
const HomePage = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const handleSearch = (query) => {
    if (query?.trim()) navigate(`/search?q=${query}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header / Navbar */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-4 mb-auto">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Pill className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-800 tracking-tight">PharmaSearch</span>
          </div>
          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Admin
              </button>
            )}
            {!user ? (
              <>
                <button 
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition"
                >
                  <LogIn className="w-4 h-4 text-blue-600" /> Login
                </button>
                <button 
                  onClick={() => { window.location.href = '/login?signup=true'; }}
                  className="hidden sm:flex items-center gap-2 bg-blue-600 px-5 py-2.5 rounded-xl shadow-md border border-blue-500 text-white text-sm font-bold hover:bg-blue-700 transition"
                >
                  Join Us
                </button>
              </>
            ) : role === 'supplier' ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition"
              >
                <Activity className="w-4 h-4 text-blue-600" /> Dashboard
              </button>
            ) : role === 'buyer' ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition"
              >
                <Heart className="w-4 h-4 text-red-500" /> My Essentials
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mb-auto">
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-200">
            <Pill className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">PharmaSearch</h1>
        </div>
        
        <div className="w-full max-w-2xl">
          <Autocomplete onSelect={handleSearch} />
        </div>
        
        <p className="mt-8 text-slate-500 font-medium text-center mb-8">Find medicines and suppliers across Uganda instantly</p>

        {/* Quick Links Row */}
        <div className="flex items-center justify-center gap-8 border-t border-slate-200/60 pt-8 w-full max-w-md">
          <a href="/about" className="text-slate-500 hover:text-blue-600 transition font-semibold text-sm hover:underline decoration-2 underline-offset-4">About</a>
          <a 
            href="mailto:support@pharmasearch.gmail.com" 
            className="text-slate-500 hover:text-blue-600 transition font-semibold text-sm hover:underline decoration-2 underline-offset-4"
            onClick={() => toast('Contacting support...', { icon: '📧' })}
          >
            Need Help?
          </a>
          <button 
            onClick={() => navigate('/login?signup=true')}
            className="text-slate-500 hover:text-blue-600 transition font-semibold text-sm hover:underline decoration-2 underline-offset-4"
          >
            Create Account
          </button>
        </div>
      </main>

      {/* Footer / Info */}
      <footer className="w-full p-8 text-center text-slate-400 text-xs font-medium">
        © 2026 PharmaSearch MVP • Connecting Healthcare
      </footer>
    </div>
  );
};




// 2. Search Results Page
const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const { user, role } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get('q');
  
  // State for favorites and following (to toggle UI immediately)
  const [favorites, setFavorites] = useState(new Set());
  const [following, setFollowing] = useState(new Set());

  // Fetch user's existing favorites/follows to highlight buttons
  useEffect(() => {
    if (user && role === 'buyer') {
      const fetchUserData = async () => {
         try {
           const { data: { session } } = await supabase.auth.getSession();
           const headers = { Authorization: `Bearer ${session?.access_token}` };
           const [favRes, followRes] = await Promise.all([
             axios.get(`${API_URL}/api/favorites`, { headers }),
             axios.get(`${API_URL}/api/following`, { headers })
           ]);
           setFavorites(new Set(favRes.data.map(d => d.id)));
           setFollowing(new Set(followRes.data.map(s => s.user_id)));
         } catch (err) {
           console.error(err);
         }
      };
      fetchUserData();
    }
  }, [user, role]);

  const toggleFavorite = async (drug) => {
    if (!user) { setShowGuestPrompt(true); return; }
    if (role !== 'buyer') return; // Suppliers/Admins don't have favorites

    const isFav = favorites.has(drug.id);
    const newFavs = new Set(favorites);
    
    // Optimistic Update
    if (isFav) newFavs.delete(drug.id);
    else newFavs.add(drug.id);
    setFavorites(newFavs);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { Authorization: `Bearer ${session?.access_token}` };
      
      if (isFav) {
        await axios.delete(`${API_URL}/api/favorites/${drug.id}`, { headers });
        toast.success('Removed from favorites');
      } else {
        await axios.post(`${API_URL}/api/favorites`, { drug_id: drug.id }, { headers });
        toast.success('Saved to dashboard');
      }
    } catch (err) {
      toast.error('Action failed');
      // Revert on error
      if (isFav) newFavs.add(drug.id);
      else newFavs.delete(drug.id);
      setFavorites(newFavs);
    }
  };

  const toggleFollow = async (supplierId) => {
    if (!user) { setShowGuestPrompt(true); return; }
    if (role !== 'buyer') return;

    const isFollowing = following.has(supplierId);
    const newFollowing = new Set(following);
    
    if (isFollowing) newFollowing.delete(supplierId);
    else newFollowing.add(supplierId);
    setFollowing(newFollowing);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { Authorization: `Bearer ${session?.access_token}` };
      
      if (isFollowing) {
        await axios.delete(`${API_URL}/api/follow/${supplierId}`, { headers });
        toast.success('Unfollowed supplier');
      } else {
        await axios.post(`${API_URL}/api/follow`, { supplier_id: supplierId }, { headers });
        toast.success('Following supplier');
      }
    } catch (err) {
      toast.error('Action failed');
       if (isFollowing) newFollowing.add(supplierId);
       else newFollowing.delete(supplierId);
       setFollowing(newFollowing);
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        // Added timeout to prevent infinite loading if backend is sleeping
        const response = await axios.get(`${API_URL}/api/search?query=${query}`, { timeout: 15000 });
        setResults(response.data);
        
        // Trigger non-intrusive prompt for guests after first search
        if (!user && !localStorage.getItem('guestPromptShown')) {
          setTimeout(() => {
            setShowGuestPrompt(true);
            localStorage.setItem('guestPromptShown', 'true');
          }, 1500);
        }
      } catch (err) {
        console.error("Search failed", err);
        setError("Unable to connect to the server. Please check your connection or try again later.");
      } finally {
        setLoading(false);
      }
    };
    if (query) fetchResults();
    else setLoading(false);
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Guest Prompt Modal */}
      {showGuestPrompt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-slate-100 relative">
            <button 
              onClick={() => setShowGuestPrompt(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 transition"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
              <Activity className="text-white w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Enhance your experience</h3>
            <p className="text-slate-500 font-medium mb-8">Create a free account to save your favorite medicines and track supplier updates.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.href = '/login?signup=true'}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
              >
                Create Account
              </button>
              <button 
                onClick={() => setShowGuestPrompt(false)}
                className="w-full bg-slate-50 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-100 transition"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => window.history.back()} className="text-blue-600 font-medium">← Back</button>
          <h2 className="text-xl font-bold text-slate-800">Results for "{query}"</h2>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
             <div className="inline-block animate-spin mb-4">
                <Activity className="w-8 h-8 text-blue-600" />
             </div>
             <p className="text-slate-500 font-medium">Searching verified inventory...</p>
          </div>
        ) : error ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-red-100 shadow-sm">
              <div className="inline-flex bg-red-50 p-3 rounded-2xl mb-4">
                 <ShieldAlert className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Search Error</h3>
              <p className="text-slate-500 max-w-sm mx-auto">{error}</p>
           </div>
        ) : results.length > 0 ? (
          <div className="grid gap-4">
            {results.map((drug) => (
              <div key={drug.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 transition hover:shadow-md flex flex-col gap-4">
                {/* Header: Brand, Generic, Status */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">{drug.brand_name}</h3>
                    <p className="text-lg font-extrabold text-blue-600 mb-1">
                      {drug.price ? `UGX ${Number(drug.price).toLocaleString()}` : 'Price on request'}
                    </p>
                    <p className="text-slate-500 font-semibold text-sm flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs uppercase tracking-wider font-bold">Generic</span> 
                      {drug.generic_name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${drug.availability === 'In stock' ? 'bg-green-50 text-green-700 ring-1 ring-green-100' : 'bg-red-50 text-red-700 ring-1 ring-red-100'}`}>
                      {drug.availability}
                    </span>
                    {/* Favorite Button */}
                    <button 
                      onClick={() => toggleFavorite(drug)}
                      className={`p-2 rounded-full transition ${favorites.has(drug.id) ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      <Heart className={`w-5 h-5 ${favorites.has(drug.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Grid for Key Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-y border-slate-50 my-2">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                         <Activity className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Strength</p>
                         <p className="font-bold text-slate-800">{drug.strength}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                         <Pill className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dosage Form</p>
                         <p className="font-bold text-slate-800">{drug.dosage_form}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${new Date(drug.expiry_date) < new Date() ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                         <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Expiry Date</p>
                         <p className={`font-bold ${new Date(drug.expiry_date) < new Date() ? 'text-red-600' : 'text-slate-800'}`}>
                            {drug.expiry_date || 'N/A'}
                         </p>
                      </div>
                   </div>
                </div>
                
                {/* Supplier & Location - More Prominent */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <Store className="w-5 h-5 text-blue-600" />
                          <span className="text-lg font-bold text-slate-900">{drug.wholesaler_name}</span>
                          {/* Follow Button */}
                          <button 
                             onClick={() => toggleFollow(drug.user_id)}
                             className={`text-[10px] font-bold px-2 py-1 rounded-md transition ${following.has(drug.user_id) ? 'bg-slate-200 text-slate-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                          >
                             {following.has(drug.user_id) ? 'Following' : '+ Follow'}
                          </button>
                       </div>
                       <div className="flex items-center gap-2 text-sm font-medium text-slate-500 ml-0.5">
                          <MapPin className="w-4 h-4" /> {drug.city}
                       </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-2">
                  <a 
                    href={`tel:${drug.contact_method}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200 active:scale-95"
                  >
                    <Phone className="w-4 h-4" /> Call Supplier
                  </a>
                  <a 
                    href={`https://wa.me/${drug.contact_method?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3.5 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <p className="text-slate-500">No supplier has this medicine in stock right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <Routes>
          {/* Pharmacists can browse without login */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<ResultsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          

          {/* Separate Logic within ProtectedRoute to handle role-based redirection if needed, 
              but for now ProtectedRoute just checks if user matches role prop or if we pass nothing it renders children.
              Actually, the current ProtectedRoute enforces 'supplier'. We need to fix that.
          */}
           <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                 {/* This is a bit tricky with the current router setup. 
                     Ideally we should have a wrapper describing which dashboard to load based on role 
                 */}
                 <RoleBasedDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;