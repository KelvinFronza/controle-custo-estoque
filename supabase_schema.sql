-- ============================================================================
-- SCRIPT SQL PARA SUPABASE — SISTEMA CONTROLE DE CUSTOS E ESTOQUE (CD ERP v3.0)
-- Como usar: Copie todo este conteúdo, abra o seu projeto no Supabase,
-- vá em "SQL Editor" -> "New Query", cole e clique em "Run".
-- ============================================================================

-- 1. Tabela de Sincronização em Tempo Real do CD (Snapshot Consolidado + Realtime)
CREATE TABLE IF NOT EXISTS public.cd_app_state (
    site_id TEXT PRIMARY KEY DEFAULT 'cd-principal',
    site_name TEXT NOT NULL DEFAULT 'CD São Paulo - Site 01',
    site_leader_name TEXT NOT NULL DEFAULT 'Kelvin',
    active_shift TEXT NOT NULL DEFAULT 'T1 - Manhã',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela Relacional de Produtos / Estoque (SKUs)
CREATE TABLE IF NOT EXISTS public.cd_products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'UN',
    quantity NUMERIC NOT NULL DEFAULT 0,
    min_stock NUMERIC NOT NULL DEFAULT 0,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela Relacional de Colaboradores / RH & Custos
CREATE TABLE IF NOT EXISTS public.cd_employees (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    sector TEXT NOT NULL,
    shift TEXT NOT NULL,
    hire_date DATE,
    salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    benefits NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ATIVO',
    dismiss_date DATE,
    dismiss_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela Relacional de Movimentações (Kardex)
CREATE TABLE IF NOT EXISTS public.cd_movements (
    id TEXT PRIMARY KEY,
    movement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL,
    product_id TEXT,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit_price NUMERIC(12,2) DEFAULT 0,
    balance_after NUMERIC NOT NULL DEFAULT 0,
    shift TEXT NOT NULL,
    responsible TEXT NOT NULL,
    reason TEXT
);

-- 5. Tabela Relacional de Cautelas / Empréstimos
CREATE TABLE IF NOT EXISTS public.cd_loans (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    employee_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    department TEXT NOT NULL,
    loan_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    returned_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    notes TEXT
);

-- 6. Tabela Relacional de Usuários e Permissões de Acesso (RBAC / Master)
CREATE TABLE IF NOT EXISTS public.cd_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role_label TEXT NOT NULL DEFAULT 'Operador',
    is_master BOOLEAN NOT NULL DEFAULT FALSE,
    shift TEXT DEFAULT 'Todos',
    status TEXT NOT NULL DEFAULT 'ATIVO',
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Habilitar Row Level Security (RLS) com acesso público para a aplicação do CD
ALTER TABLE public.cd_app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cd_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total cd_app_state" ON public.cd_app_state;
CREATE POLICY "Acesso total cd_app_state" ON public.cd_app_state FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total cd_products" ON public.cd_products;
CREATE POLICY "Acesso total cd_products" ON public.cd_products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total cd_employees" ON public.cd_employees;
CREATE POLICY "Acesso total cd_employees" ON public.cd_employees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total cd_movements" ON public.cd_movements;
CREATE POLICY "Acesso total cd_movements" ON public.cd_movements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total cd_loans" ON public.cd_loans;
CREATE POLICY "Acesso total cd_loans" ON public.cd_loans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total cd_users" ON public.cd_users;
CREATE POLICY "Acesso total cd_users" ON public.cd_users FOR ALL USING (true) WITH CHECK (true);

