import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { API_URL } from './config';
import { useState, useEffect } from 'react';
import { Search, Pill, Store, LogIn, Phone, MessageSquare, Activity, CheckCircle, MapPin, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthCallback } from './pages/AuthCallback';
import { Autocomplete } from './components/Autocomplete';
import { AuthProvider, useAuth } from './components/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Activity className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  if (!user || role !== 'supplier') {
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
            <span className="text-xl font-bold text-slate-800 tracking-tight">MedicineSearch.app</span>
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
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">MedicineSearch.app</h1>
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
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const { user } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get('q');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/search?query=${query}`);
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
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
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
          <div className="text-center py-20 text-slate-500">Searching inventory...</div>
        ) : results.length > 0 ? (
          <div className="grid gap-4">
            {results.map((drug) => (
              <div key={drug.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-5 transition hover:shadow-md">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{drug.brand_name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${drug.availability === 'In stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {drug.availability}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                    Generic: <span className="text-slate-800 font-medium">{drug.generic_name}</span> • 
                    Strength: <span className="text-slate-800 font-medium">{drug.strength}</span> • 
                    Form: <span className="text-slate-800 font-medium">{drug.dosage_form}</span><br/>
                    Batch: <span className="text-slate-800 font-medium">{drug.batch_number || 'N/A'}</span> • 
                    Expires: <span className="text-red-600 font-bold">{drug.expiry_date || 'N/A'}</span>
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Store className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">{drug.wholesaler_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500 font-medium">{drug.city}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-auto">
                    <a 
                      href={`tel:${drug.contact_method}`}
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200"
                    >
                      <Phone className="w-4 h-4" /> Call
                    </a>
                    <a 
                      href={`https://wa.me/${drug.contact_method?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100"
                    >
                      <MessageSquare className="w-4 h-4" /> WhatsApp
                    </a>
                  </div>
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
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
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