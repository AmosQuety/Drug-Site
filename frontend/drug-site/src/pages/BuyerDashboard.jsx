import { Activity, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../components/context/AuthContext';
import { LogOut, Heart, User, Store, MapPin, Pill, ShieldCheck, Phone, MessageSquare, X } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { API_URL } from '../config';
import { supabase } from '../lib/supabase';

export const BuyerDashboard = () => {
  const [favorites, setFavorites] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { Authorization: `Bearer ${session?.access_token}` };

        const [favRes, followRes] = await Promise.all([
          axios.get(`${API_URL}/api/favorites`, { headers }),
          axios.get(`${API_URL}/api/following`, { headers })
        ]);

        setFavorites(favRes.data);
        setFollowing(followRes.data);
      } catch (err) {
        console.error("Failed to fetch buyer data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const removeFavorite = async (drugId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.delete(`${API_URL}/api/favorites/${drugId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setFavorites(favorites.filter(fav => fav.id !== drugId));
      toast.success('Removed from favorites');
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  const unfollowSupplier = async (supplierId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.delete(`${API_URL}/api/follow/${supplierId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setFollowing(following.filter(s => s.user_id !== supplierId));
      toast.success('Unfollowed supplier');
    } catch (err) {
      toast.error('Failed to unfollow');
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
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Buyer Portal</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           {/* Buyer Identity */}
           <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">My Profile</h3>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <div className="flex items-start gap-3 mb-3">
                    <User className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                       <p className="font-bold text-slate-900 leading-tight">{user?.email}</p>
                       <p className="text-xs text-slate-500 mt-1">{user?.user_metadata?.cadre || 'Healthcare Professional'}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
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
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">My Essentials</h1>
                  <p className="text-slate-500 font-medium">Track your favorite medicines and suppliers.</p>
               </div>
               <button 
                 onClick={() => window.location.href = '/'}
                 className="px-6 py-3 rounded-xl flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transition font-bold text-sm"
               >
                 <Pill className="w-5 h-5" /> Browse Medicines
               </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-12">
                
                {/* FAVORITES SECTION */}
                <section>
                   <div className="flex items-center gap-2 mb-6">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      <h2 className="text-xl font-bold text-slate-900">Saved Medicines</h2>
                   </div>
                   
                   {favorites.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {favorites.map((drug) => (
                         <div key={drug.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-200 flex flex-col gap-3 relative group">
                           <button 
                             onClick={() => removeFavorite(drug.id)}
                             className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                           >
                             <X className="w-4 h-4" />
                           </button>
                           
                           <div>
                             <h3 className="text-lg font-bold text-slate-900">{drug.brand_name}</h3>
                             <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{drug.generic_name}</p>
                           </div>
                           
                           <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{drug.strength}</span>
                              <span className="text-slate-300">•</span>
                              <span>{drug.price ? `UGX ${Number(drug.price).toLocaleString()}` : 'Price on request'}</span>
                           </div>

                           <div className="pt-3 mt-auto border-t border-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                 <Store className="w-3.5 h-3.5" /> {drug.wholesaler_name}
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${drug.availability === 'In stock' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {drug.availability}
                              </span>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-12 bg-white rounded-[24px] border border-dashed border-slate-200">
                       <p className="text-slate-400 font-medium">No saved medicines yet.</p>
                     </div>
                   )}
                </section>

                {/* FOLLOWED SUPPLIERS SECTION */}
                <section>
                   <div className="flex items-center gap-2 mb-6">
                      <Store className="w-5 h-5 text-blue-600" />
                      <h2 className="text-xl font-bold text-slate-900">My Suppliers</h2>
                   </div>

                   {following.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {following.map((supplier) => (
                         <div key={supplier.user_id} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-200 flex flex-col gap-4">
                           <div className="flex items-start justify-between">
                              <div>
                                 <h3 className="text-lg font-bold text-slate-900">{supplier.wholesaler_name}</h3>
                                 <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
                                   <MapPin className="w-3.5 h-3.5" /> {supplier.city}
                                 </p>
                              </div>
                              <button 
                                onClick={() => unfollowSupplier(supplier.user_id)}
                                className="text-xs font-bold text-slate-400 hover:text-red-500 transition"
                              >
                                Unfollow
                              </button>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-3 mt-auto">
                              <a 
                                href={`tel:${supplier.contact_method}`}
                                className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call
                              </a>
                              <a 
                                href={`https://wa.me/${supplier.contact_method?.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2.5 rounded-xl text-xs font-bold hover:bg-green-100 transition"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                              </a>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center py-12 bg-white rounded-[24px] border border-dashed border-slate-200">
                       <p className="text-slate-400 font-medium">You haven't followed any suppliers yet.</p>
                     </div>
                   )}
                </section>

              </div>
            )}
         </div>
      </main>
    </div>
  );
};
