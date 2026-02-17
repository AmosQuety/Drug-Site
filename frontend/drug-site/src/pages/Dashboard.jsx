import { Activity, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../components/context/AuthContext';
import { Plus, Trash2, Edit2, LogOut, Package, MapPin, Phone, MessageSquare, X, ShieldAlert, CheckCircle, Search, Store, Building2, User, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast, Toaster } from 'react-hot-toast';
import { API_URL } from '../config';

export const Dashboard = () => {
  const [myDrugs, setMyDrugs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile & Security Logic
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileData, setProfileData] = useState({ business_name: '', city: '', phone_number: '' });
  const [newPassword, setNewPassword] = useState('');
  
  const { user, logout } = useAuth();
  const status = user?.user_metadata?.status || 'approved'; 
  const isPending = status === 'pending';
  
  // Form data restricted to the 5 requested fields
  const [formData, setFormData] = useState({
    brand_name: '',
    generic_name: '',
    strength: '',
    dosage_form: '',
    expiry_date: '',
    price: '' // Added price field
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
  
  useEffect(() => {
    if (user?.user_metadata) {
      setProfileData({
        business_name: user.user_metadata.business_name || '',
        city: user.user_metadata.city || '',
        phone_number: user.user_metadata.phone_number || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Auto-fill required backend fields from user profile
    const submissionData = {
      ...formData,
      wholesaler_name: user?.user_metadata?.business_name || 'Your Business',
      city: user?.user_metadata?.city || 'Unknown',
      contact_method: user?.user_metadata?.phone_number || 'Contact Supplier', // Fallback if no phone
      manufacturer: 'N/A', // Auto-fill as it's removed from modal
      category: 'General',    // Auto-fill
      batch_number: 'N/A'     // Auto-fill
    };

    try {
      if (editingDrug) {
        await axios.patch(`${API_URL}/api/drugs/${editingDrug.id}`, 
          submissionData,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        );
      } else {
        await axios.post(`${API_URL}/api/drugs`, 
          submissionData,
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

  const startEdit = (drug) => {
    setEditingDrug(drug);
    setFormData({
      brand_name: drug.brand_name,
      generic_name: drug.generic_name,
      strength: drug.strength,
      dosage_form: drug.dosage_form,
      expiry_date: drug.expiry_date || '',
      price: drug.price || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      brand_name: '',
      generic_name: '',
      strength: '',
      dosage_form: '',
      expiry_date: '',
      price: ''
    });
    setEditingDrug(null);
    setEditingDrug(null);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      // 1. Update Supabase Auth Metadata
      const { error } = await supabase.auth.updateUser({
        data: profileData
      });
      if (error) throw error;

      // 2. Sync changes to all Drug listings
      const { data: { session } } = await supabase.auth.getSession();
      await axios.patch(`${API_URL}/api/wholesaler/sync`, {
        wholesaler_name: profileData.business_name,
        city: profileData.city,
        contact_method: profileData.phone_number
      }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      toast.success('Profile updated & inventory synced!');
      setShowProfileModal(false);
      window.location.reload(); // Reload to reflect changes in UI context
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Toaster position="top-center" />
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col relative z-20">
        <div className="p-8 border-b border-slate-100">
           <div className="flex items-center gap-2 mb-1">
             <div className="bg-blue-600 p-1.5 rounded-lg">
                <Store className="w-5 h-5 text-white" />
             </div>
             <span className="text-lg font-extrabold text-slate-900 tracking-tight">PharmaSearch</span>
           </div>
           <div className="flex items-center justify-between">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Supplier Portal</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           {/* Supplier Identity */}
           <div>
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Profile</h3>
                 <button onClick={() => setShowProfileModal(true)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition">
                    <Edit2 className="w-3.5 h-3.5" />
                 </button>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <div className="flex items-start gap-3 mb-3">
                    <Building2 className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                       <p className="font-bold text-slate-900 leading-tight">{user?.user_metadata?.business_name || 'Business Name'}</p>
                       <p className="text-xs text-slate-500 mt-1">Lic: {user?.user_metadata?.license_number || 'N/A'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white p-2 rounded-xl border border-slate-100">
                    <MapPin className="w-3.5 h-3.5" /> {user?.user_metadata?.city || 'City N/A'}
                 </div>
              </div>
           </div>

           {/* Contact Details */}
           <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Public Contact Info</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                       <User className="w-4 h-4" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</p>
                       <p className="text-sm font-bold text-slate-700">{user?.user_metadata?.contact_person || user?.user_metadata?.business_name || 'N/A'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                       <Phone className="w-4 h-4" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                       <p className="text-sm font-bold text-slate-700">{user?.user_metadata?.phone_number || 'N/A'}</p>
                    </div>
                 </div>
              </div>
           </div>
           
           {isPending && (
             <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
               <div className="flex items-center gap-2 mb-2">
                 <Activity className="w-4 h-4 text-amber-600" />
                 <span className="text-xs font-bold text-amber-700 uppercase">Status: Pending</span>
               </div>
               <p className="text-[11px] text-amber-600/80 leading-relaxed font-medium">
                 Your account is under review. You can manage inventory but it won't be public yet.
               </p>
             </div>
           )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-3">
           <button 
             onClick={() => setShowPasswordModal(true)}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition border border-transparent hover:border-slate-200"
           >
             <Lock className="w-4 h-4" /> Change Password
           </button>
           <button 
             onClick={logout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition border border-transparent"
           >
             <LogOut className="w-4 h-4" /> Log out
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative w-full">
         <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-8">
               <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Inventory Management</h1>
                  <p className="text-slate-500 font-medium">Manage your {myDrugs.length} active medicine listings.</p>
               </div>
               <button 
                 disabled={isPending}
                 onClick={() => { resetForm(); setShowAddModal(true); }}
                 className={`px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition font-bold text-sm ${
                   isPending ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-300 transform hover:-translate-y-0.5'
                 }`}
               >
                 <Plus className="w-5 h-5" /> Add New
               </button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : myDrugs.length > 0 ? (
               <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-100">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                           <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-1/4">Brand Name</th>
                           <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-1/4">Generic Name</th>
                           <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-1/6">Strength</th>
                           <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-1/6">Dosage Form</th>
                           <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-1/6">Price</th>
                           <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-1/6">Expiry Date</th>
                           <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {myDrugs.map((drug) => (
                           <tr key={drug.id} className="hover:bg-blue-50/30 transition group">
                              <td className="px-6 py-4">
                                 <div className="font-bold text-slate-900 text-sm">{drug.brand_name}</div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="font-medium text-slate-600 text-sm">{drug.generic_name}</div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                                    {drug.strength || '—'}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="font-medium text-slate-600 text-sm">{drug.dosage_form || '—'}</div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="font-bold text-slate-900 text-sm">
                                    {drug.price ? `UGX ${Number(drug.price).toLocaleString()}` : '—'}
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className={`text-sm font-bold ${
                                    drug.expiry_date && new Date(drug.expiry_date) < new Date() ? 'text-red-500' : 'text-slate-700'
                                 }`}>
                                    {drug.expiry_date ? new Date(drug.expiry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button 
                                       onClick={() => startEdit(drug)}
                                       className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition"
                                    >
                                       <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                       onClick={() => handleDelete(drug.id)}
                                       className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition"
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
            ) : (
               <div className="text-center py-24 bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Package className="text-slate-300 w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Your inventory is empty</h3>
                  <p className="text-slate-500 mt-2 font-medium">Add your first medicine listing to get started.</p>
               </div>
            )}
         </div>
      </main>

      {/* SIMPLIFIED MODAL (5 Fields) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white p-8 rounded-[32px] w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => { setShowAddModal(false); setEditingDrug(null); }}
                className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6">{editingDrug ? 'Edit Medicine' : 'Add New Listing'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Brand Name</label>
                    <input 
                       name="brand_name" value={formData.brand_name} onChange={handleInputChange}
                       type="text" placeholder="e.g. Panadol" required
                       className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold text-slate-800 placeholder:font-medium"
                    />
                 </div>
                 
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Generic Name</label>
                    <input 
                       name="generic_name" value={formData.generic_name} onChange={handleInputChange}
                       type="text" placeholder="e.g. Paracetamol" required
                       className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold text-slate-800 placeholder:font-medium"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Strength</label>
                       <input 
                          name="strength" value={formData.strength} onChange={handleInputChange}
                          type="text" placeholder="e.g. 500mg" required
                          className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold text-slate-800 placeholder:font-medium"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Dosage Form</label>
                       <input 
                          name="dosage_form" value={formData.dosage_form} onChange={handleInputChange}
                          type="text" placeholder="e.g. Tablet" required
                          className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold text-slate-800 placeholder:font-medium"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Price (UGX)</label>
                    <input 
                       name="price" value={formData.price} onChange={handleInputChange}
                       type="number" placeholder="e.g. 5000"
                       className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold text-slate-800 placeholder:font-medium"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Expiry Date</label>
                    <input 
                       name="expiry_date" value={formData.expiry_date} onChange={handleInputChange}
                       type="date" required
                       className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold text-slate-800"
                    />
                 </div>

                 <div className="pt-4">
                    <button 
                       type="submit"
                       className="w-full p-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-200/50 text-sm"
                    >
                       {editingDrug ? 'Save Changes' : 'Add listing to inventory'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white p-8 rounded-[32px] w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Edit Business Profile</h2>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Business Name</label>
                    <input 
                       value={profileData.business_name} 
                       onChange={(e) => setProfileData({...profileData, business_name: e.target.value})}
                       type="text" required
                       className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold text-slate-800"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">City / Location</label>
                    <input 
                       value={profileData.city} 
                       onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                       type="text" required
                       className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold text-slate-800"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                    <input 
                       value={profileData.phone_number} 
                       onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})}
                       type="text" required
                       className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold text-slate-800"
                    />
                 </div>
                 <div className="pt-4">
                    <button type="submit" className="w-full p-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-200/50 text-sm">
                       Save & Sync Inventory
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-white p-8 rounded-[32px] w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                    <ShieldAlert className="w-6 h-6" />
                 </div>
                 <h2 className="text-2xl font-extrabold text-slate-900">Security</h2>
              </div>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">New Password</label>
                    <input 
                       value={newPassword} 
                       onChange={(e) => setNewPassword(e.target.value)}
                       type="password" required minLength={6}
                       placeholder="Enter new password"
                       className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold text-slate-800"
                    />
                 </div>
                 <div className="pt-4">
                    <button type="submit" className="w-full p-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-lg text-sm">
                       Update Password
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
