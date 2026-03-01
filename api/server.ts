import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'df-solutions-secret-key';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Database Setup
const getConnectionString = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  
  const host = process.env.DB_HOST || 'db.dutefcgxtmxmcvfptzly.supabase.co';
  const port = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'postgres';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD;
  
  if (password) {
    return `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
  }
  
  return null;
};

const connectionString = getConnectionString();

if (!connectionString && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: DATABASE_URL or DB_PASSWORD is not set in environment variables.');
}

const pool = new Pool({
  connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/postgres',
  ssl: (connectionString && !connectionString.includes('localhost')) ? { rejectUnauthorized: false } : false
});

// Initialize Schema (Handled by Supabase SQL script, but we can keep basic checks)
const initDb = async () => {
  try {
    // Basic check to see if tables exist, if not, we assume the user ran the script
    const res = await pool.query("SELECT FROM information_schema.tables WHERE table_name = 'users'");
    if (res.rowCount === 0) {
      console.log('Database tables not found. Please run the supabase_schema.sql script in your Supabase SQL Editor.');
    }

    // Ensure suppliers table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        corporate_name TEXT NOT NULL,
        trade_name TEXT,
        tax_id TEXT NOT NULL,
        registration TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        rep_name TEXT,
        description TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Ensure shopping_lists has supplier_id
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shopping_lists' AND column_name='supplier_id') THEN
          ALTER TABLE shopping_lists ADD COLUMN supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  } catch (err) {
    console.error('Database connection error:', err);
  }
};

initDb();

// Seed Initial Data (Asynchronous)
const seed = async () => {
  const companyId = 'c1';
  const adminId = 'u1';
  const superAdminId = 'su1';
  
  try {
    const companyRes = await pool.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (companyRes.rowCount === 0) {
      await pool.query('INSERT INTO companies (id, name) VALUES ($1, $2)', [companyId, 'DF Solutions']);
      console.log('Seed: Created company DF Solutions');
    }
    
    const passwordHash = bcrypt.hashSync('123456', 10);
    const superAdminPasswordHash = bcrypt.hashSync('Soluc@o02', 10);
    
    const adminRes = await pool.query('SELECT * FROM users WHERE id = $1', [adminId]);
    if (adminRes.rowCount === 0) {
      await pool.query(`
        INSERT INTO users (id, company_id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [adminId, companyId, 'Admin', 'admin@dfsolutions.com', passwordHash, 'admin']);
      console.log('Seed: Created admin user');
    }

    const superAdminRes = await pool.query('SELECT * FROM users WHERE id = $1', [superAdminId]);
    if (superAdminRes.rowCount === 0) {
      await pool.query(`
        INSERT INTO users (id, company_id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [superAdminId, companyId, 'Super Admin', 'super@dfsolutions.com', superAdminPasswordHash, 'superadmin']);
      console.log('Seed: Created superadmin user');
    } else {
      // Ensure superadmin has the correct password if it already exists
      await pool.query('UPDATE users SET password_hash = $1, role = $2 WHERE id = $3', [superAdminPasswordHash, 'superadmin', superAdminId]);
      console.log('Seed: Updated superadmin password');
    }

    // Add some initial products if none exist
    const productCountRes = await pool.query('SELECT COUNT(*) as count FROM products');
    if (parseInt(productCountRes.rows[0].count) === 0) {
      const products = [
        ['Arroz 5kg', 'Grãos', 'un', 'Arroz agulhinha tipo 1'],
        ['Feijão Preto 1kg', 'Grãos', 'un', 'Feijão preto selecionado'],
        ['Açúcar 1kg', 'Mercearia', 'un', 'Açúcar refinado'],
        ['Café 500g', 'Mercearia', 'un', 'Café torrado e moído'],
        ['Leite Integral 1L', 'Laticínios', 'un', 'Leite UHT integral']
      ];

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        await pool.query(`
          INSERT INTO products (id, company_id, name, category, unit, description)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [`p${i}`, companyId, p[0], p[1], p[2], p[3]]);
      }
      console.log('Seed: Created initial products');
    }
  } catch (err) {
    console.error('Seed error:', err);
  }
};

seed();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware: Auth & Multi-tenant
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

const isSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Super Admin access required' });
  next();
};

app.get('/api/health', async (req, res) => {
  if (!connectionString) {
    return res.status(500).json({ 
      status: 'error', 
      db: 'disconnected', 
      error: 'DATABASE_URL ou DB_PASSWORD não configurado nas variáveis de ambiente (Secrets).' 
    });
  }
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db: 'connected', time: result.rows[0].now });
  } catch (err: any) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database(), current_user, version()');
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND active = TRUE', [email]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, company_id: user.company_id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role, company_id: user.company_id } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Company Routes
app.get('/api/companies', authenticateToken, isSuperAdmin, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

app.post('/api/companies', authenticateToken, isSuperAdmin, async (req: any, res) => {
  const { name } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  try {
    await pool.query('INSERT INTO companies (id, name) VALUES ($1, $2)', [id, name]);
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create company' });
  }
});

app.put('/api/companies/:id', authenticateToken, isSuperAdmin, async (req: any, res) => {
  const { name, active } = req.body;
  try {
    await pool.query('UPDATE companies SET name = $1, active = $2 WHERE id = $3', [name, active === undefined ? true : active, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update company' });
  }
});

app.delete('/api/companies/:id', authenticateToken, isSuperAdmin, async (req: any, res) => {
  try {
    await pool.query('UPDATE companies SET active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

app.get('/api/company/me', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies WHERE id = $1', [req.user.company_id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Brand Routes
app.get('/api/brands', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT * FROM brands WHERE company_id = $1 AND active = TRUE', [req.user.company_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

app.post('/api/brands', authenticateToken, isAdmin, async (req: any, res) => {
  const { name } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  try {
    await pool.query(`
      INSERT INTO brands (id, company_id, name)
      VALUES ($1, $2, $3)
    `, [id, req.user.company_id, name]);
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

app.put('/api/brands/:id', authenticateToken, isAdmin, async (req: any, res) => {
  const { name, active } = req.body;
  try {
    await pool.query(`
      UPDATE brands 
      SET name = $1, active = $2
      WHERE id = $3 AND company_id = $4
    `, [name, active === undefined ? true : active, req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

app.delete('/api/brands/:id', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    await pool.query('UPDATE brands SET active = FALSE WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

// Category Routes
app.get('/api/categories', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE company_id = $1 AND active = TRUE', [req.user.company_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', authenticateToken, isAdmin, async (req: any, res) => {
  const { name } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  try {
    await pool.query(`
      INSERT INTO categories (id, company_id, name)
      VALUES ($1, $2, $3)
    `, [id, req.user.company_id, name]);
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', authenticateToken, isAdmin, async (req: any, res) => {
  const { name, active } = req.body;
  try {
    await pool.query(`
      UPDATE categories 
      SET name = $1, active = $2
      WHERE id = $3 AND company_id = $4
    `, [name, active === undefined ? true : active, req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    await pool.query('UPDATE categories SET active = FALSE WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Product Routes
app.get('/api/products', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, b.name as brand_name, c.name as category_name 
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.company_id = $1 AND p.active = TRUE
    `, [req.user.company_id]);
    const productsWithImages = result.rows.map((p: any) => ({
      ...p,
      images: p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : []
    }));
    res.json(productsWithImages);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    const { name, unit, description, images, brand_id, category_id, price } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    
    const bId = brand_id === '' ? null : brand_id;
    const cId = category_id === '' ? null : category_id;

    await pool.query(`
      INSERT INTO products (id, company_id, name, unit, description, images, brand_id, category_id, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [id, req.user.company_id, name, unit, description, JSON.stringify(images || []), bId, cId, price || 0]);
    res.status(201).json({ id, name, unit, description, images, brand_id: bId, category_id: cId, price: price || 0 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(400).json({ error: error.message || 'Failed to create product' });
  }
});

app.put('/api/products/:id', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    const { name, unit, description, active, images, brand_id, category_id, price } = req.body;
    
    const bId = brand_id === '' ? null : brand_id;
    const cId = category_id === '' ? null : category_id;
    
    const activeVal = active === undefined ? true : active;

    const result = await pool.query(`
      UPDATE products 
      SET name = $1, unit = $2, description = $3, active = $4, images = $5, brand_id = $6, category_id = $7, price = $8
      WHERE id = $9 AND company_id = $10
    `, [name, unit, description, activeVal, JSON.stringify(images || []), bId, cId, price || 0, req.params.id, req.user.company_id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(400).json({ error: error.message || 'Failed to update product' });
  }
});

app.delete('/api/products/:id', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    await pool.query('UPDATE products SET active = FALSE WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(400).json({ error: 'Failed to delete product' });
  }
});

app.get('/api/products/:id/price-history', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(`
      SELECT ph.* 
      FROM product_price_history ph
      JOIN products p ON ph.product_id = p.id
      WHERE ph.product_id = $1 AND p.company_id = $2
      ORDER BY ph.created_at DESC
    `, [req.params.id, req.user.company_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// User Routes
app.get('/api/users', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    let result;
    if (req.user.role === 'superadmin') {
      result = await pool.query(`
        SELECT u.id, u.name, u.email, u.role, u.active, u.company_id, c.name as company_name 
        FROM users u
        JOIN companies c ON u.company_id = c.id
      `);
    } else {
      result = await pool.query(`
        SELECT u.id, u.name, u.email, u.role, u.active, u.company_id, c.name as company_name 
        FROM users u
        JOIN companies c ON u.company_id = c.id
        WHERE u.company_id = $1
      `, [req.user.company_id]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', authenticateToken, isAdmin, async (req: any, res) => {
  const { name, email, password, role, company_id } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  const passwordHash = bcrypt.hashSync(password, 10);
  
  const targetCompanyId = req.user.role === 'superadmin' ? (company_id || req.user.company_id) : req.user.company_id;

  try {
    await pool.query(`
      INSERT INTO users (id, company_id, name, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, targetCompanyId, name, email, passwordHash, role]);
    res.status(201).json({ id, name, email, role, company_id: targetCompanyId });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.put('/api/users/:id', authenticateToken, isAdmin, async (req: any, res) => {
  const { name, role, active, company_id } = req.body;
  
  const targetCompanyId = req.user.role === 'superadmin' ? (company_id || req.user.company_id) : req.user.company_id;

  try {
    await pool.query(`
      UPDATE users 
      SET name = $1, role = $2, active = $3, company_id = $4
      WHERE id = $5 ${req.user.role === 'superadmin' ? '' : 'AND company_id = $6'}
    `, [
      name, 
      role, 
      active === undefined ? true : active, 
      targetCompanyId,
      req.params.id, 
      ...(req.user.role === 'superadmin' ? [] : [req.user.company_id])
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', authenticateToken, isAdmin, async (req: any, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    await pool.query('UPDATE users SET active = FALSE WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Shopping List Routes
app.post('/api/lists', authenticateToken, async (req: any, res) => {
  const { items, supplier_id } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Lista vazia' });
  }

  if (!req.user || !req.user.id || !req.user.company_id) {
    return res.status(401).json({ error: 'Usuário não autenticado corretamente ou sem empresa vinculada' });
  }

  const listId = Math.random().toString(36).substr(2, 9);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(`
      INSERT INTO shopping_lists (id, company_id, user_id, supplier_id)
      VALUES ($1, $2, $3, $4)
    `, [listId, req.user.company_id, req.user.id, supplier_id || null]);

    for (const item of items) {
      if (!item.product_id || item.quantity === undefined) {
        throw new Error('Item inválido na lista');
      }
      
      // Fetch current product price
      const productResult = await client.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
      const currentPrice = productResult.rows[0]?.price || 0;

      await client.query(`
        INSERT INTO shopping_list_items (id, list_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4, $5)
      `, [Math.random().toString(36).substr(2, 9), listId, item.product_id, item.quantity, currentPrice]);
    }

    await client.query('COMMIT');
    res.status(201).json({ id: listId });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error creating shopping list:', err);
    res.status(500).json({ error: err.message || 'Erro ao salvar lista no banco de dados' });
  } finally {
    client.release();
  }
});

app.get('/api/lists', authenticateToken, async (req: any, res) => {
  try {
    let query = `
      SELECT sl.*, u.name as user_name, s.trade_name as supplier_name, s.corporate_name as supplier_corporate_name
      FROM shopping_lists sl
      JOIN users u ON sl.user_id = u.id
      LEFT JOIN suppliers s ON sl.supplier_id = s.id
      WHERE sl.company_id = $1
    `;
    const params = [req.user.company_id];

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      query += ` AND sl.user_id = $2`;
      params.push(req.user.id);
    }

    query += ` ORDER BY sl.created_at DESC`;

    const result = await pool.query(query, params);
    const rows = result.rows.map(row => ({
      ...row,
      supplier_name: row.supplier_name || row.supplier_corporate_name
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

app.get('/api/lists/:id', authenticateToken, async (req: any, res) => {
  try {
    let query = `
      SELECT sl.*, u.name as user_name, c.name as company_name, s.trade_name as supplier_name, s.corporate_name as supplier_corporate_name
      FROM shopping_lists sl
      JOIN users u ON sl.user_id = u.id
      JOIN companies c ON sl.company_id = c.id
      LEFT JOIN suppliers s ON sl.supplier_id = s.id
      WHERE sl.id = $1 AND sl.company_id = $2
    `;
    const params = [req.params.id, req.user.company_id];

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      query += ` AND sl.user_id = $3`;
      params.push(req.user.id);
    }

    const listResult = await pool.query(query, params);

    const list = listResult.rows[0];
    if (!list) return res.status(404).json({ error: 'List not found' });

    const formattedList = {
      ...list,
      supplier_name: list.supplier_name || list.supplier_corporate_name
    };

    const itemsResult = await pool.query(`
      SELECT sli.*, p.name as product_name, p.unit
      FROM shopping_list_items sli
      JOIN products p ON sli.product_id = p.id
      WHERE sli.list_id = $1
    `, [req.params.id]);

    res.json({ ...formattedList, items: itemsResult.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch list details' });
  }
});

// Supplier Routes
app.get('/api/suppliers', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE company_id = $1 AND active = TRUE ORDER BY corporate_name ASC', [req.user.company_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

app.post('/api/suppliers', authenticateToken, isAdmin, async (req: any, res) => {
  const { corporate_name, trade_name, tax_id, registration, address, phone, email, rep_name, description } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  try {
    await pool.query(`
      INSERT INTO suppliers (id, company_id, corporate_name, trade_name, tax_id, registration, address, phone, email, rep_name, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [id, req.user.company_id, corporate_name, trade_name, tax_id, registration, address, phone, email, rep_name, description]);
    res.status(201).json({ id, corporate_name, trade_name, tax_id, registration, address, phone, email, rep_name, description });
  } catch (err) {
    console.error('Error creating supplier:', err);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

app.put('/api/suppliers/:id', authenticateToken, isAdmin, async (req: any, res) => {
  const { corporate_name, trade_name, tax_id, registration, address, phone, email, rep_name, description, active } = req.body;
  try {
    await pool.query(`
      UPDATE suppliers 
      SET corporate_name = $1, trade_name = $2, tax_id = $3, registration = $4, address = $5, phone = $6, email = $7, rep_name = $8, description = $9, active = $10
      WHERE id = $11 AND company_id = $12
    `, [corporate_name, trade_name, tax_id, registration, address, phone, email, rep_name, description, active === undefined ? true : active, req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

app.delete('/api/suppliers/:id', authenticateToken, isAdmin, async (req: any, res) => {
  try {
    await pool.query('UPDATE suppliers SET active = FALSE WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;

