-- Migração para suportar cotações por veículo/placa
-- Criado para transformar o sistema de eventos genéricos para cotações específicas por carro

-- 1. Criar tabela de veículos
CREATE TABLE IF NOT EXISTS veiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placa text NOT NULL UNIQUE,
  modelo text NOT NULL,
  cor text,
  ano integer,
  chassi text,
  proprietario_nome text,
  proprietario_telefone text,
  proprietario_cpf text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 2. Criar tabela de cotações (substitui eventos)
CREATE TABLE IF NOT EXISTS cotacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid REFERENCES veiculos(id) ON DELETE CASCADE,
  titulo text,
  descricao text,
  status text DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  total_economizado numeric(10,2),
  data_fechamento timestamptz,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- 3. Migrar dados existentes de eventos para cotações
-- Primeiro, cria veículos genéricos para eventos existentes
INSERT INTO veiculos (id, placa, modelo, proprietario_nome)
SELECT 
  gen_random_uuid(),
  'MIGRADO-' || id::text,
  nome,
  'Cliente Migrado'
FROM eventos
WHERE NOT EXISTS (SELECT 1 FROM veiculos WHERE placa = 'MIGRADO-' || eventos.id::text);

-- Depois, cria cotações baseadas nos eventos
INSERT INTO cotacoes (id, veiculo_id, titulo, descricao, status, total_economizado, data_fechamento, criado_em)
SELECT 
  e.id,
  v.id as veiculo_id,
  e.nome,
  e.descricao,
  e.status,
  e.total_economizado,
  e.data_fechamento,
  e.criado_em
FROM eventos e
JOIN veiculos v ON v.placa = 'MIGRADO-' || e.id::text
WHERE NOT EXISTS (SELECT 1 FROM cotacoes WHERE cotacoes.id = e.id);

-- 4. Adicionar coluna cotacao_id na tabela pecas (se não existir)
ALTER TABLE pecas ADD COLUMN IF NOT EXISTS cotacao_id uuid;

-- 5. Migrar referências de evento_id para cotacao_id
UPDATE pecas SET cotacao_id = evento_id WHERE cotacao_id IS NULL;

-- 6. Adicionar constraint de foreign key
ALTER TABLE pecas 
  DROP CONSTRAINT IF EXISTS pecas_cotacao_fkey,
  ADD CONSTRAINT pecas_cotacao_fkey 
  FOREIGN KEY (cotacao_id) REFERENCES cotacoes(id) ON DELETE CASCADE;

-- 7. Atualizar lojas para referenciar cotacoes
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS cotacao_id uuid;
UPDATE lojas SET cotacao_id = evento_id WHERE cotacao_id IS NULL;

ALTER TABLE lojas 
  DROP CONSTRAINT IF EXISTS lojas_cotacao_fkey,
  ADD CONSTRAINT lojas_cotacao_fkey 
  FOREIGN KEY (cotacao_id) REFERENCES cotacoes(id) ON DELETE CASCADE;

-- 8. Habilitar RLS para novas tabelas
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS para acesso anônimo (desenvolvimento)
CREATE POLICY "Permitir leitura pública de veículos" ON veiculos
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública de veículos" ON veiculos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de veículos" ON veiculos
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão pública de veículos" ON veiculos
  FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública de cotações" ON cotacoes
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública de cotações" ON cotacoes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de cotações" ON cotacoes
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão pública de cotações" ON cotacoes
  FOR DELETE USING (true);

-- 10. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_cotacoes_veiculo ON cotacoes(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_pecas_cotacao ON pecas(cotacao_id);
CREATE INDEX IF NOT EXISTS idx_lojas_cotacao ON lojas(cotacao_id);

-- 11. OPCIONAL: Remover colunas antigas (comentado para segurança)
-- Descomente apenas após confirmar que a migração funcionou
-- ALTER TABLE pecas DROP COLUMN IF EXISTS evento_id;
-- ALTER TABLE lojas DROP COLUMN IF EXISTS evento_id;
-- DROP TABLE IF EXISTS eventos;
