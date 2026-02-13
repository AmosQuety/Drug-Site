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
const authorizeWholesaler = (req, res, next) => {
  if (req.user?.user_metadata?.role !== 'wholesaler') {
    return res.status(403).json({ error: 'Access denied: Wholesalers only' });
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

// --- PRIVATE ROUTES (Wholesalers Only) ---

// 2. Get My Listings
app.get('/api/my-drugs', authenticateUser, authorizeWholesaler, async (req, res) => {
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
app.post('/api/drugs', authenticateUser, authorizeWholesaler, async (req, res) => {
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
app.patch('/api/drugs/:id', authenticateUser, authorizeWholesaler, async (req, res) => {
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

// 5. Delete Drug Listing
// --- ADMIN ROUTES ---

// 6. Get All Wholesalers
app.get('/api/admin/wholesalers', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    
    const wholesalers = users.filter(u => u.user_metadata?.role === 'wholesaler');
    res.json(wholesalers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Approve Wholesaler
app.patch('/api/admin/wholesalers/:id/approve', authenticateUser, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { user_metadata: { status: 'approved' } }
    );
    if (error) throw error;
    res.json({ message: 'Wholesaler approved successfully', user: data.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/drugs/:id', authenticateUser, authorizeWholesaler, async (req, res) => {
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

app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));