import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(helmet());
app.use(cors());
app.use(express.json());

// --- MIDDLEWARE: Verify Supabase User ---
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // The modern way to verify a user in Supabase V2
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user; // Add user info to the request object
  next();
};

// --- MIDDLEWARE: Authorize Role ---
const authorizeSupplier = (req, res, next) => {
  if (req.user?.user_metadata?.role !== 'supplier') {
    return res.status(403).json({ error: 'Access denied: Suppliers only' });
  }
  next();
};

const authorizeAdmin = (req, res, next) => {
  if (req.user?.user_metadata?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admins only' });
  }
  next();
};

// --- PUBLIC ROUTES ---

// 1. Search Drugs (Pharmacist View)
app.get('/api/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Search query required' });

  try {
    const { data, error } = await supabase
      .from('Drugs')
      .select('*')
      .textSearch('fts_search_vector', query, {
        type: 'websearch',
        config: 'english'
      });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PRIVATE ROUTES (Suppliers Only) ---

// 2. Get My Listings
app.get('/api/my-drugs', authenticateUser, authorizeSupplier, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Drugs')
      .select('*')
      .eq('user_id', req.user.id); // Only get drugs belonging to this user

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Add New Drug
app.post('/api/drugs', authenticateUser, authorizeSupplier, async (req, res) => {
  const drugData = { ...req.body, user_id: req.user.id };

  try {
    const { data, error } = await supabase
      .from('Drugs')
      .insert([drugData])
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update Drug Availability or Details
app.patch('/api/drugs/:id', authenticateUser, authorizeSupplier, async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('Drugs')
      .update(req.body)
      .eq('id', id)
      .eq('user_id', req.user.id) // Ensure they own the record
      .select();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

// 5. Sync Wholesaler Profile (Update all listings)
app.patch('/api/wholesaler/sync', authenticateUser, authorizeSupplier, async (req, res) => {
  const { wholesaler_name, city, contact_method } = req.body;

  try {
    const { data, error } = await supabase
      .from('Drugs')
      .update({ 
        wholesaler_name, 
        city, 
        contact_method 
      })
      .eq('user_id', req.user.id) // Update ALL records for this user
      .select();

    if (error) throw error;
    res.json({ message: 'Profile synced to inventory', updatedCount: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete Drug Listing
app.delete('/api/drugs/:id', authenticateUser, authorizeSupplier, async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('Drugs')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN ROUTES ---

// 6. Get All Suppliers
app.get('/api/admin/suppliers', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    
    const suppliers = users.filter(u => u.user_metadata?.role === 'supplier');
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Approve Supplier
app.patch('/api/admin/suppliers/:id/approve', authenticateUser, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { user_metadata: { status: 'approved' } }
    );
    if (error) throw error;
    res.json({ message: 'Supplier approved successfully', user: data.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics Dashboard
app.get('/api/admin/analytics', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    const suppliers = users.filter(u => u.user_metadata?.role === 'supplier');
    const buyers = users.filter(u => u.user_metadata?.role === 'buyer');
    
    const approvedSuppliers = suppliers.filter(s => s.user_metadata?.status === 'approved').length;
    const pendingSuppliers = suppliers.filter(s => s.user_metadata?.status === 'pending').length;
    const rejectedSuppliers = suppliers.filter(s => s.user_metadata?.status === 'rejected').length;

    const { count: drugsCount, error: drugsError } = await supabase
      .from('Drugs')
      .select('*', { count: 'exact', head: true });
    if (drugsError) throw drugsError;

    res.json({
      totalSuppliers: suppliers.length,
      approvedSuppliers,
      pendingSuppliers,
      rejectedSuppliers,
      totalBuyers: buyers.length,
      totalDrugs: drugsCount || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject/Suspend supplier
app.patch('/api/admin/suppliers/:id/reject', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { status: 'rejected' }
    });
    if (error) throw error;
    res.json({ message: 'Supplier rejected', user: data.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit supplier details
app.patch('/api/admin/suppliers/:id/update', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { business_name, license_number, city, contact_method } = req.body;
    
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(id);
    if (error) throw error;

    const updatedMetadata = {
      ...user.user_metadata,
      business_name: business_name || user.user_metadata?.business_name,
      license_number: license_number || user.user_metadata?.license_number,
      city: city || user.user_metadata?.city,
      contact_method: contact_method || user.user_metadata?.contact_method
    };

    const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: updatedMetadata
    });
    if (updateError) throw updateError;
    
    res.json({ message: 'Supplier updated', user: updated.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get supplier's inventory
app.get('/api/admin/suppliers/:id/inventory', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('Drugs')
      .select('*')
      .eq('user_id', id);
    
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all buyers with stats
app.get('/api/admin/buyers', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    const buyers = users.filter(u => u.user_metadata?.role === 'buyer');
    
    const buyersWithStats = await Promise.all(buyers.map(async (buyer) => {
      const { count: favCount } = await supabase
        .from('Favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', buyer.id);
      
      const { count: followCount } = await supabase
        .from('SupplierFollows')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', buyer.id);
      
      return {
        ...buyer,
        stats: {
          favorites: favCount || 0,
          following: followCount || 0
        }
      };
    }));

    res.json(buyersWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export suppliers as CSV
app.get('/api/admin/export/suppliers', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    
    const suppliers = users.filter(u => u.user_metadata?.role === 'supplier');
    
    const headers = 'Business Name,Email,License,City,Contact,Status,Created At\n';
    const rows = suppliers.map(s => {
      const meta = s.user_metadata || {};
      return `"${meta.business_name || 'N/A'}","${s.email}","${meta.license_number || 'N/A'}","${meta.city || 'N/A'}","${meta.contact_method || 'N/A'}","${meta.status || 'pending'}","${s.created_at}"`;
    }).join('\n');
    
    const csv = headers + rows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=suppliers.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BUYER ROUTES ---

// 6. Favorites
app.get('/api/favorites', authenticateUser, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data, error } = await userSupabase
      .from('Favorites')
      .select('drug_id, Drugs(*)')
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json(data.map(f => f.Drugs)); // Return flattened drug objects
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/favorites', authenticateUser, async (req, res) => {
  const { drug_id } = req.body;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { error } = await userSupabase
      .from('Favorites')
      .insert({ user_id: req.user.id, drug_id });
    if (error) throw error;
    res.status(201).json({ message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/favorites/:drug_id', authenticateUser, async (req, res) => {
  const { drug_id } = req.params;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { error } = await userSupabase
      .from('Favorites')
      .delete()
      .eq('user_id', req.user.id)
      .eq('drug_id', drug_id);
    if (error) throw error;
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Following Suppliers
app.get('/api/following', authenticateUser, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: follows, error } = await userSupabase
      .from('SupplierFollows')
      .select('supplier_id')
      .eq('buyer_id', req.user.id);
      
    if (error) throw error;

    const supplierIds = follows.map(f => f.supplier_id);
    if (supplierIds.length === 0) return res.json([]);

    // Get unique wholesaler info from Drugs table for these IDs
    const { data: suppliers, error: supError } = await supabase
      .from('Drugs')
      .select('wholesaler_name, city, contact_method, user_id')
      .in('user_id', supplierIds);
      
    if (supError) throw supError;

    // Deduplicate by user_id
    const uniqueSuppliers = Array.from(new Map(suppliers.map(item => [item.user_id, item])).values());
    res.json(uniqueSuppliers);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/follow', authenticateUser, async (req, res) => {
  const { supplier_id } = req.body;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { error } = await userSupabase
      .from('SupplierFollows')
      .insert({ buyer_id: req.user.id, supplier_id });
    if (error) throw error;
    res.status(201).json({ message: 'Following supplier' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/follow/:supplier_id', authenticateUser, async (req, res) => {
  const { supplier_id } = req.params;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { error } = await userSupabase
      .from('SupplierFollows')
      .delete()
      .eq('buyer_id', req.user.id)
      .eq('supplier_id', supplier_id);
    if (error) throw error;
    res.json({ message: 'Unfollowed supplier' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// For debugging

app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));