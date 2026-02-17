import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../components/context/AuthContext';
import { CheckCircle, ShieldAlert, LogOut, Search, UserCheck, Clock, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { API_URL } from '../config';

export const AdminDashboard = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`${API_URL}/api/admin/suppliers`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setSuppliers(response.data || []);
    } catch (err) {
      toast.error("Failed to fetch suppliers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveSupplier = async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.patch(`${API_URL}/api/admin/suppliers/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      toast.success("Supplier approved!");
      fetchSuppliers(); // Refresh list
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
      <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-900 p-2 rounded-xl">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Admin Command Center</h1>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <button 
              onClick={() => navigate('/')} 
              className="text-slate-500 hover:text-slate-800 font-bold transition flex items-center gap-2 text-sm"
            >
              <Search className="w-4 h-4" /> Exit
            </button>
            <button 
              onClick={() => { supabase.auth.signOut(); navigate('/'); }}
              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Supplier Verification</h2>
          <p className="text-slate-500 font-medium">Manage and approve business accounts for the MedicineSearch.app network.</p>
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
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-8 py-6">
                      <div className="font-bold text-slate-900 text-lg mb-1">{supplier.user_metadata?.business_name || 'No Name'}</div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Mail className="w-3.5 h-3.5" /> {supplier.email}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <MapPin className="w-3.5 h-3.5" /> {supplier.user_metadata?.city || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-sm">
                        License: {supplier.user_metadata?.license_number || 'MISSING'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {supplier.user_metadata?.status === 'approved' ? (
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
                      {supplier.user_metadata?.status !== 'approved' ? (
                        <button 
                          onClick={() => approveSupplier(supplier.id)}
                          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
                        >
                          Approve
                        </button>
                      ) : (
                        <span className="text-slate-400 text-sm font-medium flex items-center justify-end gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" /> Approved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View - Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900 text-lg">{supplier.user_metadata?.business_name || 'No Name'}</div>
                      <div className="text-slate-500 text-sm">{supplier.email}</div>
                    </div>
                    {supplier.user_metadata?.status === 'approved' ? (
                      <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Verified</span>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Pending</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                    <MapPin className="w-4 h-4" /> {supplier.user_metadata?.city || 'N/A'}
                  </div>

                  <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-2xl font-bold text-sm">
                    License: {supplier.user_metadata?.license_number || 'MISSING'}
                  </div>

                  {supplier.user_metadata?.status !== 'approved' && (
                    <button 
                      onClick={() => approveSupplier(supplier.id)}
                      className="w-full bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition"
                    >
                      Approve Business
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {suppliers.length === 0 && (
            <div className="px-8 py-20 text-center text-slate-400 font-medium italic">
              No suppliers registered yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
