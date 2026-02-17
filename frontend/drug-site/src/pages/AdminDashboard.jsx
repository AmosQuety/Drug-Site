import { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../components/context/AuthContext';
import { CheckCircle, ShieldAlert, LogOut, Search, UserCheck, Clock, Mail, MapPin, Users, Package, TrendingUp, Download, Edit, Eye, X, XCircle, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { API_URL } from '../config';

export const AdminDashboard = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentView, setCurrentView] = useState('suppliers'); // 'suppliers' or 'buyers'
  const [buyers, setBuyers] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [searchQuery, statusFilter, suppliers]);

  const fetchAnalytics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`${API_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setAnalytics(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`${API_URL}/api/admin/suppliers`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setSuppliers(response.data || []);
    } catch (err) {
      toast.error("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`${API_URL}/api/admin/buyers`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setBuyers(response.data || []);
    } catch (err) {
      toast.error("Failed to fetch buyers");
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers;

    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.user_metadata?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.user_metadata?.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.user_metadata?.status === statusFilter);
    }

    setFilteredSuppliers(filtered);
  };

  const approveSupplier = async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.patch(`${API_URL}/api/admin/suppliers/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      toast.success("Supplier approved!");
      fetchSuppliers();
      fetchAnalytics();
    } catch (err) {
      toast.error("Approval failed");
    }
  };

  const rejectSupplier = async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.patch(`${API_URL}/api/admin/suppliers/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      toast.success("Supplier rejected");
      fetchSuppliers();
      fetchAnalytics();
    } catch (err) {
      toast.error("Rejection failed");
    }
  };

  const viewInventory = async (supplier) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`${API_URL}/api/admin/suppliers/${supplier.id}/inventory`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setInventory(response.data || []);
      setSelectedSupplier(supplier);
      setShowInventoryModal(true);
    } catch (err) {
      toast.error("Failed to load inventory");
    }
  };

  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setEditForm({
      business_name: supplier.user_metadata?.business_name || '',
      license_number: supplier.user_metadata?.license_number || '',
      city: supplier.user_metadata?.city || '',
      contact_method: supplier.user_metadata?.contact_method || ''
    });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.patch(`${API_URL}/api/admin/suppliers/${selectedSupplier.id}/update`, editForm, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      toast.success("Supplier updated!");
      setShowEditModal(false);
      fetchSuppliers();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const bulkApprove = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await Promise.all(selectedIds.map(id => 
        axios.patch(`${API_URL}/api/admin/suppliers/${id}/approve`, {}, {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        })
      ));
      toast.success(`Approved ${selectedIds.length} suppliers!`);
      setSelectedIds([]);
      fetchSuppliers();
      fetchAnalytics();
    } catch (err) {
      toast.error("Bulk approval failed");
    }
  };

  const bulkReject = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await Promise.all(selectedIds.map(id => 
        axios.patch(`${API_URL}/api/admin/suppliers/${id}/reject`, {}, {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        })
      ));
      toast.success(`Rejected ${selectedIds.length} suppliers!`);
      setSelectedIds([]);
      fetchSuppliers();
      fetchAnalytics();
    } catch (err) {
      toast.error("Bulk rejection failed");
    }
  };

  const exportCSV = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`${API_URL}/api/admin/export/suppliers`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'suppliers.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV downloaded!");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const switchView = (view) => {
    setCurrentView(view);
    if (view === 'buyers' && buyers.length === 0) {
      fetchBuyers();
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" />
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
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

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-slate-900">{analytics.totalSuppliers}</span>
              </div>
              <p className="text-slate-500 font-medium text-sm">Total Suppliers</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-amber-600" />
                <span className="text-2xl font-bold text-slate-900">{analytics.pendingSuppliers}</span>
              </div>
              <p className="text-slate-500 font-medium text-sm">Pending Approval</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-slate-900">{analytics.totalDrugs}</span>
              </div>
              <p className="text-slate-500 font-medium text-sm">Total Drugs</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-slate-900">{analytics.totalBuyers}</span>
              </div>
              <p className="text-slate-500 font-medium text-sm">Active Buyers</p>
            </div>
          </div>
        )}

        {/* View Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => switchView('suppliers')}
            className={`px-6 py-3 rounded-xl font-bold transition ${
              currentView === 'suppliers' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Suppliers
          </button>
          <button
            onClick={() => switchView('buyers')}
            className={`px-6 py-3 rounded-xl font-bold transition ${
              currentView === 'buyers' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Buyers
          </button>
        </div>

        {currentView === 'suppliers' ? (
          <>
            {/* Search & Actions Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <button
                  onClick={exportCSV}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>

              {/* Bulk Actions */}
              {selectedIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-600">{selectedIds.length} selected</span>
                  <button
                    onClick={bulkApprove}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition text-sm"
                  >
                    Approve All
                  </button>
                  <button
                    onClick={bulkReject}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition text-sm"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition text-sm"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Suppliers Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                          onChange={(e) => setSelectedIds(e.target.checked ? filteredSuppliers.map(s => s.id) : [])}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Business</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-400 uppercase tracking-wider">License</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(supplier.id)}
                            onChange={() => toggleSelection(supplier.id)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 mb-1">{supplier.user_metadata?.business_name || 'No Name'}</div>
                          <div className="flex flex-col gap-1 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5" /> {supplier.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5" /> {supplier.user_metadata?.city || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-sm">
                            {supplier.user_metadata?.license_number || 'MISSING'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {supplier.user_metadata?.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-xs font-bold uppercase">
                              <UserCheck className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : supplier.user_metadata?.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold uppercase">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-xs font-bold uppercase">
                              <Clock className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {supplier.user_metadata?.status !== 'approved' && (
                              <button
                                onClick={() => approveSupplier(supplier.id)}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {supplier.user_metadata?.status !== 'rejected' && (
                              <button
                                onClick={() => rejectSupplier(supplier.id)}
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => viewInventory(supplier)}
                              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                              title="View Inventory"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(supplier)}
                              className="p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
                              title="Edit Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(supplier.id)}
                        onChange={() => toggleSelection(supplier.id)}
                        className="w-4 h-4 mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{supplier.user_metadata?.business_name || 'No Name'}</div>
                        <div className="text-sm text-slate-500">{supplier.email}</div>
                        <div className="text-sm text-slate-500">{supplier.user_metadata?.city || 'N/A'}</div>
                        <div className="mt-2">
                          {supplier.user_metadata?.status === 'approved' ? (
                            <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full text-xs font-bold">Verified</span>
                          ) : supplier.user_metadata?.status === 'rejected' ? (
                            <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs font-bold">Rejected</span>
                          ) : (
                            <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-full text-xs font-bold">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {supplier.user_metadata?.status !== 'approved' && (
                        <button onClick={() => approveSupplier(supplier.id)} className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold text-sm">
                          Approve
                        </button>
                      )}
                      {supplier.user_metadata?.status !== 'rejected' && (
                        <button onClick={() => rejectSupplier(supplier.id)} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold text-sm">
                          Reject
                        </button>
                      )}
                      <button onClick={() => viewInventory(supplier)} className="flex-1 bg-purple-600 text-white py-2 rounded-xl font-bold text-sm">
                        Inventory
                      </button>
                      <button onClick={() => openEditModal(supplier)} className="flex-1 bg-slate-600 text-white py-2 rounded-xl font-bold text-sm">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSuppliers.length === 0 && (
                <div className="px-8 py-20 text-center text-slate-400 font-medium italic">
                  No suppliers found.
                </div>
              )}
            </div>
          </>
        ) : (
          /* Buyers View */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Buyer Analytics</h3>
              <div className="space-y-4">
                {buyers.map((buyer) => (
                  <div key={buyer.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <div className="font-bold text-slate-900">{buyer.email}</div>
                      <div className="text-sm text-slate-500">{buyer.user_metadata?.cadre || 'Healthcare Professional'}</div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-slate-900">{buyer.stats?.favorites || 0}</div>
                        <div className="text-slate-500">Favorites</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-slate-900">{buyer.stats?.following || 0}</div>
                        <div className="text-slate-500">Following</div>
                      </div>
                    </div>
                  </div>
                ))}
                {buyers.length === 0 && (
                  <div className="text-center py-12 text-slate-400">No buyers yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedSupplier?.user_metadata?.business_name} Inventory</h3>
                <p className="text-slate-500 text-sm">{inventory.length} products</p>
              </div>
              <button onClick={() => setShowInventoryModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {inventory.map((drug) => (
                  <div key={drug.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <div className="font-bold text-slate-900">{drug.brand_name}</div>
                      <div className="text-sm text-slate-500">{drug.generic_name} • {drug.strength}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{drug.price ? `UGX ${Number(drug.price).toLocaleString()}` : 'N/A'}</div>
                      <div className={`text-xs font-bold ${drug.availability === 'In stock' ? 'text-green-600' : 'text-red-600'}`}>
                        {drug.availability}
                      </div>
                    </div>
                  </div>
                ))}
                {inventory.length === 0 && (
                  <div className="text-center py-12 text-slate-400">No products listed yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Edit Supplier</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Business Name</label>
                <input
                  type="text"
                  value={editForm.business_name}
                  onChange={(e) => setEditForm({...editForm, business_name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">License Number</label>
                <input
                  type="text"
                  value={editForm.license_number}
                  onChange={(e) => setEditForm({...editForm, license_number: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Contact</label>
                <input
                  type="text"
                  value={editForm.contact_method}
                  onChange={(e) => setEditForm({...editForm, contact_method: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                onClick={saveEdit}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
