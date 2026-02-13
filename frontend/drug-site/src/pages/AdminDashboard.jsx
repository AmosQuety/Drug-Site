import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../components/context/AuthContext';
import { CheckCircle, ShieldAlert, LogOut, Search, UserCheck, Clock, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { API_URL } from '../config';

export const AdminDashboard = () => {
  const [wholesalers, setWholesalers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWholesalers();
  }, []);

  const fetchWholesalers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`${API_URL}/api/admin/wholesalers`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setWholesalers(response.data);
    } catch (err) {
      toast.error("Failed to fetch wholesalers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveWholesaler = async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.patch(`${API_URL}/api/admin/wholesalers/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      toast.success("Wholesaler approved!");
      fetchWholesalers(); // Refresh list
    } catch (err) {
      toast.error("Approval failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Command Center</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="text-slate-500 hover:text-slate-800 font-bold transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Exit Admin
            </button>
            <button 
              onClick={() => { supabase.auth.signOut(); navigate('/'); }}
              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Wholesaler Verification</h2>
          <p className="text-slate-500 font-medium">Manage and approve business accounts for the PharmaSearch network.</p>
        </div>

        <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
          {/* Desktop View - Table */}
          <div className="hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-sm font-bold text-slate-400 uppercase tracking-wider">Business Details</th>
                  <th className="px-8 py-5 text-sm font-bold text-slate-400 uppercase tracking-wider">Verification</th>
                  <th className="px-8 py-5 text-sm font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-5 text-sm font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {wholesalers.map((wholesaler) => (
                  <tr key={wholesaler.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-900 text-lg mb-1">{wholesaler.user_metadata?.wholesaler_name || 'No Name'}</div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Mail className="w-3.5 h-3.5" /> {wholesaler.email}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <MapPin className="w-3.5 h-3.5" /> {wholesaler.user_metadata?.city || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-sm">
                        License: {wholesaler.user_metadata?.license_number || 'MISSING'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {wholesaler.user_metadata?.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                          <UserCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {wholesaler.user_metadata?.status !== 'approved' && (
                        <button 
                          onClick={() => approveWholesaler(wholesaler.id)}
                          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View - Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {wholesalers.map((wholesaler) => (
              <div key={wholesaler.id} className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900 text-lg">{wholesaler.user_metadata?.wholesaler_name || 'No Name'}</div>
                      <div className="text-slate-500 text-sm">{wholesaler.email}</div>
                    </div>
                    {wholesaler.user_metadata?.status === 'approved' ? (
                      <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Verified</span>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Pending</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                    <MapPin className="w-4 h-4" /> {wholesaler.user_metadata?.city || 'N/A'}
                  </div>

                  <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-2xl font-bold text-sm">
                    License: {wholesaler.user_metadata?.license_number || 'MISSING'}
                  </div>

                  {wholesaler.user_metadata?.status !== 'approved' && (
                    <button 
                      onClick={() => approveWholesaler(wholesaler.id)}
                      className="w-full bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition"
                    >
                      Approve Business
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {wholesalers.length === 0 && (
            <div className="px-8 py-20 text-center text-slate-400 font-medium italic">
              No wholesalers registered yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
