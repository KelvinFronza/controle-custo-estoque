(() => {
    'use strict';

    // Limpa caches locais da versão anterior para iniciar 100% do zero
    const LEGACY_KEYS = [
        'site_leader_inventory_v1',
        'site_leader_master_backup_v2',
        'cd_logged_user_v1',
        'cd_logged_site_v1',
        'cd_session_token_v1',
        'cd_local_tab_hb_v1'
    ];
    LEGACY_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });

    let supabaseClient = null;

    function showToast(message, type = 'primary') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }

    function setLog(message) {
        const logEl = document.getElementById('starterLogBox');
        if (logEl) {
            const now = new Date().toLocaleTimeString('pt-BR');
            logEl.textContent = `[${now}] ${message}`;
        }
    }

    function initSupabase() {
        const badge = document.getElementById('supabaseStatusBadge');
        const urlEl = document.getElementById('supabaseProjectUrl');
        const cfg = window.SUPABASE_CONFIG || {};

        if (urlEl && cfg.url) {
            urlEl.textContent = cfg.url;
        }

        if (cfg.url && cfg.anonKey && window.supabase) {
            supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
            if (badge) {
                badge.textContent = 'Conectado';
                badge.className = 'status-pill ok';
            }
            setLog('Supabase inicializado e pronto. Vínculo com GitHub e Vercel mantido.');
            return true;
        }

        if (badge) {
            badge.textContent = 'Não configurado';
            badge.className = 'status-pill error';
        }
        setLog('Verifique o arquivo supabase-config.js.');
        return false;
    }

    async function testSupabaseConnection() {
        if (!supabaseClient && !initSupabase()) return;
        setLog('Testando comunicação com o Supabase...');
        try {
            const { error } = await supabaseClient
                .from('cd_app_state')
                .select('site_id')
                .limit(1);

            if (error) throw error;
            setLog('Conexão com o banco Supabase validada com sucesso!');
            showToast('Supabase conectado e respondendo normalmente!', 'success');
        } catch (err) {
            setLog(`Aviso na consulta: ${err.message}`);
            showToast(`Erro ao testar: ${err.message}`, 'error');
        }
    }

    async function resetCloudData() {
        if (!supabaseClient && !initSupabase()) return;
        if (!confirm('Deseja limpar também os dados antigos salvos na tabela cd_app_state do Supabase?')) return;

        setLog('Limpando estado antigo no Supabase...');
        try {
            const { error } = await supabaseClient
                .from('cd_app_state')
                .upsert(
                    {
                        site_id: 'cd-principal',
                        site_name: 'Novo Projeto',
                        site_leader_name: 'Kelvin',
                        active_shift: 'T1',
                        payload: { initialized: false, resetAt: new Date().toISOString() },
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: 'site_id' }
                );

            if (error) throw error;
            setLog('Dados antigos da nuvem zerados com sucesso!');
            showToast('Base na nuvem zerada! Tudo pronto para o novo projeto.', 'success');
        } catch (err) {
            setLog(`Erro ao limpar nuvem: ${err.message}`);
            showToast(`Erro: ${err.message}`, 'error');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initSupabase();

        const testBtn = document.getElementById('testSupabaseBtn');
        if (testBtn) testBtn.addEventListener('click', testSupabaseConnection);

        const resetBtn = document.getElementById('resetCloudDataBtn');
        if (resetBtn) resetBtn.addEventListener('click', resetCloudData);
    });
})();
