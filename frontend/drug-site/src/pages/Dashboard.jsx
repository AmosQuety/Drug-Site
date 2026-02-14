import { Activity, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../components/context/AuthContext';
import { Plus, Trash2, Edit2, LogOut, Package, MapPin, Phone, MessageSquare, X, ShieldAlert, CheckCircle, Search, Store } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast, Toaster } from 'react-hot-toast';
import { API_URL } from '../config';

export const Dashboard = () => {
  const [myDrugs, setMyDrugs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { user, logout } = useAuth();
  const status = user?.user_metadata?.status || 'approved'; 
  const isPending = status === 'pending';
  const role = user?.user_metadata?.role;

  const [formData, setFormData] = useState({
    brand_name: '',
    generic_name: '',
    manufacturer: '',
    strength: '',
    dosage_form: '',
    category: '',
    availability: 'In stock',
    contact_method: '',
    batch_number: '',
    expiry_date: ''
  });

  const fetchMyDrugs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await axios.get(`${API_URL}/api/my-drugs`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setMyDrugs(res.data);
    } catch (err) {
      console.error("Failed to fetch drugs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyDrugs(); }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    
    try {
      if (editingDrug) {
        await axios.patch(`${API_URL}/api/drugs/${editingDrug.id}`, 
          formData,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
      } else {
        await axios.post(`${API_URL}/api/drugs`, 
          {
            ...formData,
            wholesaler_name: user?.user_metadata?.business_name || user?.user_metadata?.wholesaler_name || 'Your Business',
            city: user?.user_metadata?.city || 'Unknown'
          },
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
      }
      toast.success(editingDrug ? 'Medicine updated!' : 'Medicine added!');
      setShowAddModal(false);
      setEditingDrug(null);
      resetForm();
      fetchMyDrugs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    try {
      await axios.delete(`${API_URL}/api/drugs/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      toast.success('Listing deleted');
      fetchMyDrugs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    const newStatus = currentStatus === 'In stock' ? 'Out of stock' : 'In stock';
    const { data: { session } } = await supabase.auth.getSession();
    
    await axios.patch(`${API_URL}/api/drugs/${id}`, 
      { availability: newStatus },
      { headers: { Authorization: `Bearer ${session?.access_token}` } }
    );
    fetchMyDrugs();
  };

  const startEdit = (drug) => {
    setEditingDrug(drug);
    setFormData({
      brand_name: drug.brand_name,
      generic_name: drug.generic_name,
      manufacturer: drug.manufacturer || '',
      strength: drug.strength,
      dosage_form: drug.dosage_form,
      category: drug.category || '',
      availability: drug.availability,
      contact_method: drug.contact_method,
      batch_number: drug.batch_number || '',
      expiry_date: drug.expiry_date || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      brand_name: '',
      generic_name: '',
      manufacturer: '',
      strength: '',
      dosage_form: '',
      category: '',
      availability: 'In stock',
      contact_method: '',
      batch_number: '',
      expiry_date: ''
    });
    setEditingDrug(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Toaster position="top-center" />
      
      {/* Top Navbar */}
      <nav className="bg-white border-b px-4 md:px-8 py-4 flex flex-wrap justify-between items-center sticky top-0 z-10 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Package className="text-white w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">Supplier Portal</h1>
              {isPending ? (
                <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-100">
                  <Activity className="w-3 h-3" /> PENDING
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-green-50 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-100">
                  <CheckCircle className="w-3 h-3" /> VERIFIED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">{user?.user_metadata?.business_name || user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6 ml-auto">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition font-bold text-sm"
          >
            <Search className="w-4 h-4" /> <span className="hidden sm:inline">Search Medicines</span>
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition font-medium text-sm"
          >
            <LogOut className="w-5 h-5" /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Supplier Profile Context Area */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="bg-blue-50 p-6 rounded-[24px]">
              <Store className="w-12 h-12 text-blue-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{user?.user_metadata?.business_name || 'Business Account'}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 font-medium">
                <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <MapPin className="w-4 h-4 text-blue-500" /> {user?.user_metadata?.city || 'City N/A'}
                </span>
                <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                   License: {user?.user_metadata?.license_number || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Public Contact Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <Activity className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</p>
                  <p className="text-slate-900 font-bold">{user?.user_metadata?.contact_person || user?.user_metadata?.business_name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <Phone className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                  <p className="text-slate-900 font-bold">{user?.user_metadata?.phone_number || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isPending && (
          <div className="mb-10 bg-amber-50 border border-amber-200 p-6 rounded-[32px] flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="bg-amber-100 p-3 rounded-2xl">
              <ShieldAlert className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900">Account Under Review</h3>
              <p className="text-amber-700 text-sm font-medium">Your account is pending verification. You can list items once approved.</p>
            </div>
          </div>
        )}

        {/* Inventory Header & Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-6 pt-4 border-t border-slate-100">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Inventory Management</h2>
            <p className="text-slate-500 font-medium">Manage your active stock listings and expiry dates.</p>
          </div>
          <button 
            disabled={isPending}
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className={`px-6 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-100 transition w-full sm:w-auto justify-center font-bold text-sm ${
              isPending ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Plus className="w-5 h-5" /> Add Medicine
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : myDrugs.length > 0 ? (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Brand Name</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Batch / Stock</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generic & Details</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dosage Form</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiry Date</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {myDrugs.map((drug) => (
                    <tr key={drug.id} className="hover:bg-slate-50/30 transition group">
                      <td className="px-6 py-5">
                        <div className="font-extrabold text-slate-900">{drug.brand_name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{drug.manufacturer || 'General'}</div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="text-xs font-bold text-slate-600 mb-1.5">{drug.batch_number || 'N/A'}</div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter ${
                          drug.availability === 'In stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {drug.availability}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-semibold text-slate-700 line-clamp-1">{drug.generic_name}</div>
                        <div className="text-xs text-slate-400 font-medium">{drug.strength}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                          {drug.dosage_form}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`text-sm font-bold ${
                          new Date(drug.expiry_date) < new Date() ? 'text-red-500' : 'text-slate-700'
                        }`}>
                          {drug.expiry_date ? new Date(drug.expiry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button 
                            onClick={() => toggleAvailability(drug.id, drug.availability)}
                            title={drug.availability === 'In stock' ? 'Mark Out of Stock' : 'Mark In Stock'}
                            className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                          >
                            <ShieldAlert className={`w-4 h-4 ${drug.availability === 'In stock' ? 'text-slate-400' : 'text-green-600'}`} />
                          </button>
                          <button 
                            onClick={() => startEdit(drug)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition border border-slate-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(drug.id)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition border border-slate-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
             <div className="bg-slate-50 w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-4">
                <Package className="text-slate-200 w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-800">No Listings Found</h3>
             <p className="text-slate-500 max-w-xs mx-auto mt-2 font-medium">Your inventory is empty. Start adding items to reach more customers.</p>
          </div>
        )}
      </main>

      {/* Footer / Profile Action Section */}
      <footer className="mt-auto bg-white border-t border-slate-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400 font-medium text-xs">
            <ShieldAlert className="w-4 h-4" /> Secure Supplier Interface v1.2
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 bg-red-50 text-red-600 px-8 py-3.5 rounded-[20px] font-extrabold text-sm hover:bg-red-100 transition"
          >
            <LogOut className="w-5 h-5" /> Logout from Session
          </button>
        </div>
      </footer>
      
      {/* ADD/EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
           <div className="bg-white p-6 md:p-8 rounded-[40px] w-full max-w-lg shadow-2xl relative my-auto animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => { setShowAddModal(false); setEditingDrug(null); }}
                className="absolute right-6 top-6 p-2 rounded-2xl hover:bg-slate-100 text-slate-400 transition"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="bg-blue-100 w-12 h-12 md:w-16 md:h-16 rounded-3xl flex items-center justify-center mb-6">
                <Plus className="text-blue-600 w-6 h-6 md:w-8 md:h-8" />
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">{editingDrug ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <p className="text-slate-500 mb-6 md:mb-8 font-medium text-sm">Please fill in the details of the medicine listing.</p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Brand Name</label>
                    <input 
                      name="brand_name" value={formData.brand_name} onChange={handleInputChange}
                      type="text" placeholder="e.g. Panadol" required
                      className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Generic Name</label>
                    <input 
                      name="generic_name" value={formData.generic_name} onChange={handleInputChange}
                      type="text" placeholder="e.g. Paracetamol" required
                      className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Strength</label>
                    <input 
                      name="strength" value={formData.strength} onChange={handleInputChange}
                      type="text" placeholder="e.g. 500mg" required
                      className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Dosage Form</label>
                    <input 
                      name="dosage_form" value={formData.dosage_form} onChange={handleInputChange}
                      type="text" placeholder="e.g. Tablet" required
                      className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Manufacturer</label>
                  <input 
                    name="manufacturer" value={formData.manufacturer} onChange={handleInputChange}
                    type="text" placeholder="e.g. GSK, Pfizer"
                    className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Batch Number</label>
                    <input 
                      name="batch_number" value={formData.batch_number} onChange={handleInputChange}
                      type="text" placeholder="e.g. BT12345"
                      className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Expiry Date</label>
                    <input 
                      name="expiry_date" value={formData.expiry_date} onChange={handleInputChange}
                      type="date"
                      className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contact Method (Phone/WhatsApp)</label>
                  <input 
                    name="contact_method" value={formData.contact_method} onChange={handleInputChange}
                    type="text" placeholder="e.g. +250 7XX XXX XXX" required
                    className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                   <button 
                    type="button"
                    onClick={() => { setShowAddModal(false); setEditingDrug(null); }} 
                    className="flex-1 p-4 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] p-4 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-200 text-sm"
                  >
                    {editingDrug ? 'Save Changes' : 'Add Listing'}
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
