-- Script SQL para Supabase (PostgreSQL) - DF Solutions

-- 1. Criar Tabela de Empresas
CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar Tabela de Marcas
CREATE TABLE brands (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar Tabela de Categorias
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar Tabela de Usuários
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('superadmin', 'admin', 'user')) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Criar Tabela de Produtos
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT, -- Campo legado para compatibilidade
    unit TEXT,
    description TEXT,
    price DECIMAL DEFAULT 0,
    images JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Criar Tabela de Listas de Compras
CREATE TABLE shopping_lists (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Criar Tabela de Itens da Lista
CREATE TABLE shopping_list_items (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL NOT NULL,
    price DECIMAL NOT NULL DEFAULT 0
);

-- 8. Criar Tabela de Histórico de Preços
CREATE TABLE product_price_history (
    id SERIAL PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para registrar histórico de preços
CREATE OR REPLACE FUNCTION record_price_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.price IS DISTINCT FROM NEW.price) THEN
        INSERT INTO product_price_history (product_id, price)
        VALUES (NEW.id, NEW.price);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar histórico
CREATE TRIGGER trigger_record_price_history
AFTER INSERT OR UPDATE OF price ON products
FOR EACH ROW
EXECUTE FUNCTION record_price_history();


-- ==========================================
-- DADOS INICIAIS (SEED)
-- ==========================================

-- Inserir Empresa Inicial
INSERT INTO companies (id, name) VALUES ('c1', 'DF Solutions');

-- Inserir Usuário Admin (Senha: 123456)
INSERT INTO users (id, company_id, name, email, password_hash, role) 
VALUES ('u1', 'c1', 'Admin', 'admin@dfsolutions.com', '$2b$10$bLCMYf4Z1wgFTqFZfvWYZOelC2K.FHuqFoWRqQ9ltT0J2NSsEUsNi', 'admin');

-- Inserir Usuário Super Admin (Senha: Soluc@o02)
INSERT INTO users (id, company_id, name, email, password_hash, role) 
VALUES ('su1', 'c1', 'Super Admin', 'super@dfsolutions.com', '$2b$10$aYaCGla8XyucmFKsmY0X.ONaK3tDHPTPq3TXhmfPG0oNwMN2iX4ma', 'superadmin');

-- Inserir Produtos Iniciais
INSERT INTO products (id, company_id, name, category, unit, description) VALUES
('p0', 'c1', 'Arroz 5kg', 'Grãos', 'un', 'Arroz agulhinha tipo 1'),
('p1', 'c1', 'Feijão Preto 1kg', 'Grãos', 'un', 'Feijão preto selecionado'),
('p2', 'c1', 'Açúcar 1kg', 'Mercearia', 'un', 'Açúcar refinado'),
('p3', 'c1', 'Café 500g', 'Mercearia', 'un', 'Café torrado e moído'),
('p4', 'c1', 'Leite Integral 1L', 'Laticínios', 'un', 'Leite UHT integral');
