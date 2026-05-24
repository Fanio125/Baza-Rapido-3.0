# Guia de Segurança Supabase - Baza Rápido

Para garantir que o teu aplicativo seja seguro para milhares de utilizadores, deves configurar o **Row Level Security (RLS)** no Supabase. Sem isto, qualquer pessoa com o teu `supabase_url` e `anon_key` pode ler ou apagar todos os dados!

## 1. Ativar RLS em todas as tabelas
No teu painel do Supabase, vai a **Database -> Tables** e ativa o RLS para:
- `saved_locations`
- `trip_history`
- `profiles`
- `recent_searches`

## 2. Criar Políticas de Segurança (Policies)

### Tabela: saved_locations
- **SELECT**: `auth.uid() = user_id` (Apenas o dono pode ver)
- **INSERT**: `auth.uid() = user_id` (Apenas o dono pode criar para si)
- **UPDATE**: `auth.uid() = user_id` (Apenas o dono pode editar)
- **DELETE**: `auth.uid() = user_id` (Apenas o dono pode apagar)

### Tabela: profiles
- **SELECT**: `auth.uid() = id`
- **UPDATE**: `auth.uid() = id` (Bloquear alteração de `email` via cliente, apenas via Auth)

## 3. Validação Server-Side (Edge Functions)
Para evitar que utilizadores manipulem preços simulados no cliente, os cálculos mais sensíveis devem ser feitos numa **Supabase Edge Function**.

Exemplo de lógica recomendada:
1. O cliente envia `origin` e `destination`.
2. A Edge Function calcula a distância usando uma API real (ex: Google Maps ou OSRM).
3. A Function aplica as tarifas dos parceiros (Yango, Bolt).
4. A Function retorna o JSON assinado para o cliente.

## 4. Proteção de API Keys
- Nunca coloques chaves secretas no código frontend.
- Usa `process.env` (já configurado no projeto) para variáveis de ambiente.
- No Supabase, limita as origens permitidas (CORS) apenas ao domínio do teu aplicativo.

---
**Status atual:** O código frontend já utiliza `useAuth` para garantir que as chamadas às tabelas protegidas sejam feitas com o token de autenticação correto.
