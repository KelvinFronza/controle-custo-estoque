const STORAGE_KEY = 'site_leader_inventory_v1';
const SESSION_USER_KEY = 'cd_logged_user_v1';
const SESSION_CD_KEY = 'cd_logged_site_v1';

// Usuário e CD autenticados e travados na sessão atual
let currentUser = null;
let currentCdId = 'cd-sp-01';

// Estado global corporativo (Macro & Micro do CD) com isolamento por CD
let state = {
    siteName: 'CD São Paulo - Site 01',
    siteLeaderName: 'Kelvin',
    activeShift: 'T1 - Manhã',
    products: [],
    movements: [],
    loans: [],
    handovers: [],
    employees: [],
    users: [],
    cds: [],
    cdWorkspaces: {}
};

// Formatadores executivos
const fmtCurrency = (val) =>
    Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtNumber = (val) =>
    Number(val || 0).toLocaleString('pt-BR');

const fmtDate = (iso) => {
    if (!iso) return '-';
    const parts = String(iso).slice(0, 10).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
};

const fmtDateTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatCpf = (val) => {
    const digits = String(val || '').replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const formatPhone = (val) => {
    const digits = String(val || '').replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Dados demonstrativos de RH do CD
function getInitialEmployeesDemo() {
    return [
        {
            id: 'emp1',
            code: 'MAT-3092',
            name: 'Lucas Mendonça',
            cpf: '384.920.118-45',
            phone: '(11) 98742-1190',
            role: 'Operador Logístico II',
            sector: 'Picking',
            shift: 'T1 - Manhã',
            hireDate: '2026-02-10',
            salary: 2380.00,
            benefits: 920.00,
            status: 'ATIVO',
            dismissDate: '',
            dismissReason: ''
        },
        {
            id: 'emp2',
            code: 'MAT-4510',
            name: 'Diego Ribeiro',
            cpf: '412.885.309-12',
            phone: '(11) 99123-4481',
            role: 'Conferente de Carga',
            sector: 'Recebimento',
            shift: 'T2 - Tarde',
            hireDate: '2025-08-15',
            salary: 2650.00,
            benefits: 980.00,
            status: 'ATIVO',
            dismissDate: '',
            dismissReason: ''
        },
        {
            id: 'emp3',
            code: 'MAT-1184',
            name: 'Patrícia Gomes',
            cpf: '295.441.878-90',
            phone: '(11) 97410-3329',
            role: 'Operadora de Empilhadeira',
            sector: 'Expedição / Doca',
            shift: 'T3 - Noite',
            hireDate: '2025-11-03',
            salary: 3120.00,
            benefits: 1150.00,
            status: 'ATIVO',
            dismissDate: '',
            dismissReason: ''
        },
        {
            id: 'emp4',
            code: 'MAT-2201',
            name: 'Marcos Oliveira',
            cpf: '198.762.543-08',
            phone: '(11) 98231-9087',
            role: 'Analista de Inventário',
            sector: 'Inventário / Qualidade',
            shift: 'T1 - Manhã',
            hireDate: '2025-05-20',
            salary: 3450.00,
            benefits: 1240.00,
            status: 'ATIVO',
            dismissDate: '',
            dismissReason: ''
        },
        {
            id: 'emp5',
            code: 'MAT-2890',
            name: 'Fernanda Costa',
            cpf: '349.110.287-64',
            phone: '(11) 99654-7712',
            role: 'Líder de Turno',
            sector: 'Liderança / Gestão',
            shift: 'T3 - Noite',
            hireDate: '2024-09-01',
            salary: 4600.00,
            benefits: 1580.00,
            status: 'ATIVO',
            dismissDate: '',
            dismissReason: ''
        },
        {
            id: 'emp6',
            code: 'MAT-5014',
            name: 'Camila Rocha Santos',
            cpf: '455.901.238-77',
            phone: '(11) 98871-6543',
            role: 'Operadora Logística I',
            sector: 'Packing',
            shift: 'T1 - Manhã',
            hireDate: '2026-09-12',
            salary: 2150.00,
            benefits: 860.00,
            status: 'ATIVO',
            dismissDate: '',
            dismissReason: ''
        },
        {
            id: 'emp7',
            code: 'MAT-3319',
            name: 'Roberto Almeida',
            cpf: '277.619.402-31',
            phone: '(11) 99310-8821',
            role: 'Líder de Turno',
            sector: 'Liderança / Gestão',
            shift: 'T2 - Tarde',
            hireDate: '2025-01-10',
            salary: 4600.00,
            benefits: 1580.00,
            status: 'FERIAS',
            dismissDate: '',
            dismissReason: ''
        },
        {
            id: 'emp8',
            code: 'MAT-4902',
            name: 'Henrique Souza Lima',
            cpf: '391.008.765-22',
            phone: '(11) 96543-2109',
            role: 'Operador Logístico I',
            sector: 'Picking',
            shift: 'T2 - Tarde',
            hireDate: '2026-04-01',
            salary: 2150.00,
            benefits: 860.00,
            status: 'DESLIGADO',
            dismissDate: '2026-10-25',
            dismissReason: 'Voluntário (Pedido de Demissão)'
        },
        {
            id: 'emp9',
            code: 'MAT-4788',
            name: 'Juliana Martins',
            cpf: '429.331.890-55',
            phone: '(11) 97112-9034',
            role: 'Auxiliar de Expedição',
            sector: 'Packing',
            shift: 'T3 - Noite',
            hireDate: '2026-06-15',
            salary: 2150.00,
            benefits: 860.00,
            status: 'DESLIGADO',
            dismissDate: '2026-11-02',
            dismissReason: 'Involuntário (Desempenho / Empresa)'
        }
    ];
}

// Dados demonstrativos gerenciais completos (Estoque + RH)
function getInitialDemoData() {
    const now = new Date();
    const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
    const hoursAhead = (h) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

    return {
        siteName: 'CD São Paulo - Site 01',
        siteLeaderName: 'Kelvin',
        activeShift: 'T1 - Manhã',
        products: [
            {
                id: 'p1',
                sku: 'MER-101',
                name: 'Caixa Papelão Triplex 60x40x40cm',
                category: 'Insumos & Embalagens',
                location: 'Rua A-01 / N1',
                unit: 'UN',
                quantity: 420,
                minStock: 150,
                price: 6.50,
                notes: 'Fornecedor Klabin • SLA Entrega: 24h',
                updatedAt: hoursAgo(2)
            },
            {
                id: 'p2',
                sku: 'MER-102',
                name: 'Filme Stretch 500mm x 25 micras (Bobina)',
                category: 'Insumos & Embalagens',
                location: 'Rua A-02 / Doca',
                unit: 'RL',
                quantity: 8,
                minStock: 20,
                price: 89.90,
                notes: 'Crítico: alto consumo nos turnos T2 e T3',
                updatedAt: hoursAgo(1)
            },
            {
                id: 'p3',
                sku: 'MER-205',
                name: 'Etiqueta Térmica Adesiva 100x150mm (Rolo)',
                category: 'Expedição & Logística',
                location: 'Armário Packing 01',
                unit: 'RL',
                quantity: 0,
                minStock: 30,
                price: 24.50,
                notes: 'Pedido emergencial #8841 em trânsito',
                updatedAt: hoursAgo(3)
            },
            {
                id: 'p4',
                sku: 'EQP-301',
                name: 'Coletor de Dados Zebra TC21 Android',
                category: 'Eletrônicos & Coletor',
                location: 'Sala Site Leader / Cofre',
                unit: 'UN',
                quantity: 14,
                minStock: 10,
                price: 2450.00,
                notes: 'Ativo crítico • Cautela nominal obrigatória',
                updatedAt: hoursAgo(4)
            },
            {
                id: 'p5',
                sku: 'EQP-305',
                name: 'Rádio Comunicador HT Motorola DEP450',
                category: 'Eletrônicos & Coletor',
                location: 'Sala Site Leader',
                unit: 'UN',
                quantity: 9,
                minStock: 8,
                price: 980.00,
                notes: 'Acompanha base carregadora e clip',
                updatedAt: hoursAgo(6)
            },
            {
                id: 'p6',
                sku: 'MER-410',
                name: 'Kit Mercadoria Promocional Hub Standard',
                category: 'Mercadorias Gerais',
                location: 'Rua B-04 / N2',
                unit: 'KIT',
                quantity: 185,
                minStock: 60,
                price: 142.00,
                notes: 'Mercadoria de alto giro para expedição diária',
                updatedAt: hoursAgo(5)
            },
            {
                id: 'p7',
                sku: 'MER-418',
                name: 'Mercadoria Lote Especial Eletrônicos Smart',
                category: 'Mercadorias Gerais',
                location: 'Gaiola Alto Valor #02',
                unit: 'CX',
                quantity: 12,
                minStock: 15,
                price: 680.00,
                notes: 'Auditoria obrigatória na troca de turno',
                updatedAt: hoursAgo(2)
            },
            {
                id: 'p8',
                sku: 'EPI-502',
                name: 'Luva de Segurança PU Multitato Tam. G',
                category: 'EPI & Segurança',
                location: 'Almoxarifado EPI - Gaveta 4',
                unit: 'PAR',
                quantity: 64,
                minStock: 25,
                price: 8.90,
                notes: 'CA 31920 • Entrega mediante ficha de EPI',
                updatedAt: hoursAgo(12)
            }
        ],
        movements: [
            {
                id: 'm1',
                date: hoursAgo(1),
                type: 'OUT',
                productId: 'p2',
                sku: 'MER-102',
                productName: 'Filme Stretch 500mm x 25 micras (Bobina)',
                quantity: 6,
                unitPrice: 89.90,
                balanceAfter: 8,
                shift: 'T1 - Manhã',
                responsible: 'Kelvin (Site Leader)',
                reason: 'Abastecimento das docas de expedição 01 a 04'
            },
            {
                id: 'm2',
                date: hoursAgo(2),
                type: 'IN',
                productId: 'p1',
                sku: 'MER-101',
                productName: 'Caixa Papelão Triplex 60x40x40cm',
                quantity: 200,
                unitPrice: 6.50,
                balanceAfter: 420,
                shift: 'T1 - Manhã',
                responsible: 'Marcos Oliveira',
                reason: 'Recebimento NF 90412 - Fornecedor Klabin'
            },
            {
                id: 'm3',
                date: hoursAgo(3),
                type: 'OUT',
                productId: 'p3',
                sku: 'MER-205',
                productName: 'Etiqueta Térmica Adesiva 100x150mm (Rolo)',
                quantity: 12,
                unitPrice: 24.50,
                balanceAfter: 0,
                shift: 'T3 - Noite',
                responsible: 'Fernanda Costa (Líder T3)',
                reason: 'Consumo bancadas de Packing - Saldo entrou em ruptura'
            },
            {
                id: 'm4',
                date: hoursAgo(5),
                type: 'OUT',
                productId: 'p6',
                sku: 'MER-410',
                productName: 'Kit Mercadoria Promocional Hub Standard',
                quantity: 45,
                unitPrice: 142.00,
                balanceAfter: 185,
                shift: 'T2 - Tarde',
                responsible: 'Roberto Almeida',
                reason: 'Expedição Romaneio #7742 - Rota Sul'
            },
            {
                id: 'm5',
                date: hoursAgo(7),
                type: 'LOSS',
                productId: 'p1',
                sku: 'MER-101',
                productName: 'Caixa Papelão Triplex 60x40x40cm',
                quantity: 10,
                unitPrice: 6.50,
                balanceAfter: 220,
                shift: 'T2 - Tarde',
                responsible: 'Roberto Almeida',
                reason: 'Avaria por umidade próxima à doca externa 03'
            }
        ],
        loans: [
            {
                id: 'l1',
                productId: 'p4',
                sku: 'EQP-301',
                productName: 'Coletor de Dados Zebra TC21 Android',
                quantity: 1,
                employeeName: 'Lucas Mendonça',
                employeeId: 'MAT-3092',
                department: 'Picking - T1 - Manhã',
                loanDate: hoursAgo(5),
                dueDate: hoursAhead(3),
                returnedDate: null,
                status: 'ACTIVE',
                notes: 'Patrimônio #ZB-14 • Com alça e bateria 100%'
            },
            {
                id: 'l2',
                productId: 'p5',
                sku: 'EQP-305',
                productName: 'Rádio Comunicador HT Motorola DEP450',
                quantity: 1,
                employeeName: 'Patrícia Gomes',
                employeeId: 'MAT-1184',
                department: 'Expedição / Doca - T3 - Noite',
                loanDate: hoursAgo(14),
                dueDate: hoursAgo(4),
                returnedDate: null,
                status: 'ACTIVE',
                notes: 'Rádio Canal 2 • Pendente devolução encerramento T3'
            },
            {
                id: 'l3',
                productId: 'p4',
                sku: 'EQP-301',
                productName: 'Coletor de Dados Zebra TC21 Android',
                quantity: 1,
                employeeName: 'Diego Ribeiro',
                employeeId: 'MAT-4510',
                department: 'Recebimento - T2 - Tarde',
                loanDate: hoursAgo(20),
                dueDate: hoursAgo(12),
                returnedDate: hoursAgo(12.5),
                status: 'RETURNED',
                notes: 'Devolvido OK ao final do turno'
            }
        ],
        handovers: [
            {
                id: 'ho1',
                date: hoursAgo(8),
                fromShift: 'T3 - Noite',
                toShift: 'T1 - Manhã',
                leaderOut: 'Fernanda Costa (Líder T3)',
                leaderIn: 'Kelvin (Site Leader)',
                checks: ['Gaiola Alto Valor OK', 'Coletores Conferidos', 'Equipe Conferida'],
                notes: 'Atenção: Etiqueta térmica 100x150mm zerou no final do T3. Cobrar devolução do Rádio HT da colaboradora Patrícia Gomes.',
                snapshotSla: '63%',
                snapshotValue: 'R$ 81.919,80',
                snapshotCriticals: 3
            }
        ],
        employees: getInitialEmployeesDemo(),
        users: getInitialUsersDemo()
    };
}

// Abas de Governança & Dados restritas exclusivamente ao Usuário Master
const GOVERNANCE_MASTER_ONLY_TABS = ['handover', 'relatorios', 'usuarios'];

// Matriz de Perfis e Usuários Iniciais (Kelvin Master + Líder + Operador)
function getRolePresetPermissions(preset) {
    if (preset === 'MASTER') {
        return {
            tabs: ['dashboard', 'rh', 'analytics', 'produtos', 'movimentacoes', 'cautelas', 'handover', 'relatorios', 'usuarios'],
            actions: {
                viewFinancials: true,
                manageProducts: true,
                registerMovements: true,
                manageLoans: true,
                auditStock: true,
                manageHr: true
            }
        };
    }
    if (preset === 'LIDER') {
        return {
            tabs: ['dashboard', 'produtos', 'movimentacoes', 'cautelas'],
            actions: {
                viewFinancials: true,
                manageProducts: true,
                registerMovements: true,
                manageLoans: true,
                auditStock: true,
                manageHr: false
            }
        };
    }
    if (preset === 'RH') {
        return {
            tabs: ['dashboard', 'rh', 'cautelas'],
            actions: {
                viewFinancials: true,
                manageProducts: false,
                registerMovements: false,
                manageLoans: true,
                auditStock: false,
                manageHr: true
            }
        };
    }
    // OPERADOR padrão
    return {
        tabs: ['produtos', 'movimentacoes', 'cautelas'],
        actions: {
            viewFinancials: false,
            manageProducts: false,
            registerMovements: true,
            manageLoans: true,
            auditStock: false,
            manageHr: false
        }
    };
}

function getDefaultCds() {
    return [
        { id: 'cd-sp-01', name: 'CD São Paulo - Site 01' },
        { id: 'cd-cajamar-02', name: 'CD Cajamar - Site 02' },
        { id: 'cd-extrema-03', name: 'CD Extrema / MG - Site 03' },
        { id: 'cd-sul-04', name: 'CD Sul / Itajaí - Site 04' }
    ];
}

function getInitialUsersDemo() {
    return [
        {
            id: 'usr_master_kelvin',
            username: 'kelvin',
            password: 'admin123',
            name: 'Kelvin (Site Leader Master)',
            rolePreset: 'MASTER',
            roleLabel: 'Master / Site Leader',
            isMaster: true,
            shift: 'Todos',
            status: 'ATIVO',
            allowedCds: ['ALL'],
            permissions: getRolePresetPermissions('MASTER')
        },
        {
            id: 'usr_lider_fernanda',
            username: 'fernanda.t3',
            password: 'lider123',
            name: 'Fernanda Costa',
            rolePreset: 'LIDER',
            roleLabel: 'Líder de Turno',
            isMaster: false,
            shift: 'T3 - Noite',
            status: 'ATIVO',
            allowedCds: ['cd-sp-01'],
            permissions: getRolePresetPermissions('LIDER')
        },
        {
            id: 'usr_op_lucas',
            username: 'lucas.op',
            password: 'op123',
            name: 'Lucas Mendonça',
            rolePreset: 'OPERADOR',
            roleLabel: 'Operador Logístico',
            isMaster: false,
            shift: 'T1 - Manhã',
            status: 'ATIVO',
            allowedCds: ['cd-sp-01'],
            permissions: getRolePresetPermissions('OPERADOR')
        }
    ];
}

// Garante que a lista de CDs, workspaces isolados por CD e a conta Master (kelvin) sempre existam
function ensureUsersIntegrity() {
    const defaultUsers = getInitialUsersDemo();
    if (!state || typeof state !== 'object') return;

    if (!Array.isArray(state.cds) || state.cds.length === 0) {
        state.cds = getDefaultCds();
    }
    if (!state.cdWorkspaces || typeof state.cdWorkspaces !== 'object') {
        state.cdWorkspaces = {};
    }

    // Garante que cada CD tenha seu próprio workspace isolado
    state.cds.forEach((cd, idx) => {
        if (!state.cdWorkspaces[cd.id]) {
            if (idx === 0 && Array.isArray(state.products) && state.products.length > 0) {
                state.cdWorkspaces[cd.id] = {
                    siteName: cd.name,
                    activeShift: state.activeShift || 'T1 - Manhã',
                    products: state.products,
                    movements: state.movements || [],
                    loans: state.loans || [],
                    handovers: state.handovers || [],
                    employees: state.employees || []
                };
            } else {
                state.cdWorkspaces[cd.id] = {
                    siteName: cd.name,
                    activeShift: 'T1 - Manhã',
                    products: [],
                    movements: [],
                    loans: [],
                    handovers: [],
                    employees: []
                };
            }
        }
    });

    if (!Array.isArray(state.users) || state.users.length === 0) {
        state.users = defaultUsers;
    } else {
        defaultUsers.forEach((defUser) => {
            const exists = state.users.find(
                (u) => u && u.username && u.username.toLowerCase() === defUser.username.toLowerCase()
            );
            if (!exists) {
                state.users.push(defUser);
            } else if (defUser.username === 'kelvin') {
                exists.isMaster = true;
                exists.rolePreset = 'MASTER';
                exists.status = 'ATIVO';
                exists.allowedCds = ['ALL'];
                if (!exists.password) exists.password = 'admin123';
                exists.permissions = getRolePresetPermissions('MASTER');
            }
        });
    }

    // Garante que usuários não-Master não possuam as abas de Governança & Dados e tenham allowedCds definido
    state.users.forEach((u) => {
        if (!u) return;
        if (u.isMaster || u.rolePreset === 'MASTER') {
            u.allowedCds = ['ALL'];
        } else {
            if (!Array.isArray(u.allowedCds) || u.allowedCds.length === 0) {
                u.allowedCds = ['cd-sp-01'];
            }
            if (u.permissions && Array.isArray(u.permissions.tabs)) {
                u.permissions.tabs = u.permissions.tabs.filter((t) => !GOVERNANCE_MASTER_ONLY_TABS.includes(t));
            }
        }
    });

    populateLoginCdSelect();
}

function syncCurrentCdToWorkspaces() {
    if (!state.cdWorkspaces || typeof state.cdWorkspaces !== 'object') {
        state.cdWorkspaces = {};
    }
    const cdObj = (state.cds || []).find((c) => c.id === currentCdId);
    state.cdWorkspaces[currentCdId] = {
        siteName: cdObj ? cdObj.name : state.siteName,
        activeShift: state.activeShift || 'T1 - Manhã',
        products: Array.isArray(state.products) ? state.products : [],
        movements: Array.isArray(state.movements) ? state.movements : [],
        loans: Array.isArray(state.loans) ? state.loans : [],
        handovers: Array.isArray(state.handovers) ? state.handovers : [],
        employees: Array.isArray(state.employees) ? state.employees : []
    };
}

function switchActiveCdWorkspace(targetCdId) {
    ensureUsersIntegrity();
    const validCd = (state.cds || []).find((c) => c.id === targetCdId) || state.cds[0];
    if (!validCd) return;

    currentCdId = validCd.id;
    if (!state.cdWorkspaces[currentCdId]) {
        state.cdWorkspaces[currentCdId] = {
            siteName: validCd.name,
            activeShift: 'T1 - Manhã',
            products: [],
            movements: [],
            loans: [],
            handovers: [],
            employees: []
        };
    }

    const ws = state.cdWorkspaces[currentCdId];
    state.siteName = validCd.name;
    state.activeShift = ws.activeShift || 'T1 - Manhã';
    state.products = Array.isArray(ws.products) ? ws.products : [];
    state.movements = Array.isArray(ws.movements) ? ws.movements : [];
    state.loans = Array.isArray(ws.loans) ? ws.loans : [];
    state.handovers = Array.isArray(ws.handovers) ? ws.handovers : [];
    state.employees = Array.isArray(ws.employees) ? ws.employees : [];
}

function populateLoginCdSelect() {
    const sel = document.getElementById('loginCdSelect');
    if (!sel) return;
    const cds = Array.isArray(state.cds) && state.cds.length > 0 ? state.cds : getDefaultCds();
    const currentVal = sel.value;
    sel.innerHTML = cds
        .map((cd) => `<option value="${escapeHtml(cd.id)}">${escapeHtml(cd.name)}</option>`)
        .join('');
    if (cds.some((c) => c.id === currentVal)) {
        sel.value = currentVal;
    }
}

function userHasCdAccess(user, cdId) {
    if (!user) return false;
    if (user.isMaster || user.rolePreset === 'MASTER') return true;
    const allowed = Array.isArray(user.allowedCds) ? user.allowedCds : ['cd-sp-01'];
    return allowed.includes('ALL') || allowed.includes(cdId);
}

// Persistência local com migração automática da base de RH, CDs e Usuários
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const demo = getInitialDemoData();
            state = {
                siteName: parsed.siteName || demo.siteName,
                siteLeaderName: parsed.siteLeaderName || 'Kelvin',
                activeShift: parsed.activeShift || demo.activeShift,
                products: Array.isArray(parsed.products) ? parsed.products : demo.products,
                movements: Array.isArray(parsed.movements) ? parsed.movements : demo.movements,
                loans: Array.isArray(parsed.loans) ? parsed.loans : demo.loans,
                handovers: Array.isArray(parsed.handovers) ? parsed.handovers : demo.handovers,
                employees:
                    Array.isArray(parsed.employees) && parsed.employees.length > 0
                        ? parsed.employees
                        : demo.employees,
                users:
                    Array.isArray(parsed.users) && parsed.users.length > 0
                        ? parsed.users
                        : demo.users,
                cds: Array.isArray(parsed.cds) && parsed.cds.length > 0 ? parsed.cds : getDefaultCds(),
                cdWorkspaces:
                    parsed.cdWorkspaces && typeof parsed.cdWorkspaces === 'object'
                        ? parsed.cdWorkspaces
                        : {}
            };
            ensureUsersIntegrity();
            switchActiveCdWorkspace(currentCdId);
            saveState();
        } else {
            state = getInitialDemoData();
            state.cds = getDefaultCds();
            state.cdWorkspaces = {};
            ensureUsersIntegrity();
            switchActiveCdWorkspace('cd-sp-01');
            saveState();
        }
    } catch (err) {
        console.error('Erro ao carregar estado:', err);
        state = getInitialDemoData();
        state.cds = getDefaultCds();
        state.cdWorkspaces = {};
        ensureUsersIntegrity();
        switchActiveCdWorkspace('cd-sp-01');
    }
}

const SB_CONFIG_KEY = 'site_leader_supabase_config_v1';
let supabaseClient = null;

function getSupabaseCredentials() {
    const saved = localStorage.getItem(SB_CONFIG_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.url && parsed.anonKey) return parsed;
        } catch (e) {}
    }
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey) {
        return {
            url: window.SUPABASE_CONFIG.url.trim(),
            anonKey: window.SUPABASE_CONFIG.anonKey.trim()
        };
    }
    return { url: '', anonKey: '' };
}

function initSupabaseClient() {
    const creds = getSupabaseCredentials();
    const statusEl = document.getElementById('supabaseSyncStatus');
    const urlInput = document.getElementById('sbUrlInput');
    const keyInput = document.getElementById('sbKeyInput');

    if (urlInput && creds.url) urlInput.value = creds.url;
    if (keyInput && creds.anonKey) keyInput.value = creds.anonKey;

    if (creds.url && creds.anonKey && window.supabase) {
        try {
            supabaseClient = window.supabase.createClient(creds.url, creds.anonKey);
            if (statusEl) {
                statusEl.textContent = '☁️ Supabase Conectado';
                statusEl.style.color = '#34d399';
            }
            return true;
        } catch (err) {
            console.error('Erro ao iniciar Supabase:', err);
        }
    }
    supabaseClient = null;
    if (statusEl) {
        statusEl.textContent = 'Modo Local';
        statusEl.style.color = '#64748b';
    }
    return false;
}

async function pushStateToSupabase(showNotification = false) {
    if (!supabaseClient) return;
    const statusEl = document.getElementById('supabaseSyncStatus');
    if (statusEl) statusEl.textContent = '☁️ Sincronizando...';

    try {
        // 1. Salva o snapshot completo na tabela cd_app_state
        const { error } = await supabaseClient.from('cd_app_state').upsert(
            {
                site_id: 'cd-principal',
                site_name: state.siteName,
                site_leader_name: state.siteLeaderName || 'Kelvin',
                active_shift: state.activeShift,
                payload: state,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'site_id' }
        );

        if (error) throw error;

        // 2. Sincroniza também as tabelas relacionais de Produtos e RH (se criadas)
        if (state.products && state.products.length > 0) {
            const prodRows = state.products.map((p) => ({
                id: String(p.id),
                sku: p.sku,
                name: p.name,
                category: p.category,
                location: p.location,
                unit: p.unit || 'UN',
                quantity: Number(p.quantity) || 0,
                min_stock: Number(p.minStock) || 0,
                price: Number(p.price) || 0,
                notes: p.notes || '',
                updated_at: p.updatedAt || new Date().toISOString()
            }));
            await supabaseClient.from('cd_products').upsert(prodRows, { onConflict: 'id' });
        }

        if (state.employees && state.employees.length > 0) {
            const empRows = state.employees.map((e) => ({
                id: String(e.id),
                code: e.code,
                name: e.name,
                cpf: e.cpf || '',
                phone: e.phone || '',
                role: e.role || '',
                sector: e.sector || '',
                shift: e.shift || '',
                hire_date: e.hireDate || null,
                salary: Number(e.salary) || 0,
                benefits: Number(e.benefits) || 0,
                status: e.status || 'ATIVO',
                dismiss_date: e.dismissDate || null,
                dismiss_reason: e.dismissReason || ''
            }));
            await supabaseClient.from('cd_employees').upsert(empRows, { onConflict: 'id' });
        }

        if (statusEl) {
            statusEl.textContent = '☁️ Supabase Sincronizado';
            statusEl.style.color = '#34d399';
        }
        if (showNotification) {
            showToast('Dados sincronizados com sucesso no Supabase!', 'success');
        }
    } catch (err) {
        console.error('Erro ao sincronizar Supabase:', err);
        if (statusEl) {
            statusEl.textContent = '⚠️ Erro Supabase';
            statusEl.style.color = '#f87171';
        }
        if (showNotification) {
            showToast(`Erro no Supabase: ${err.message || 'Verifique se rodou o supabase_schema.sql'}`, 'error');
        }
    }
}

async function pullStateFromSupabase(showNotification = false) {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('cd_app_state')
            .select('*')
            .eq('site_id', 'cd-principal')
            .maybeSingle();

        if (error) throw error;

        if (data && data.payload && Array.isArray(data.payload.products)) {
            const hadUsersInCloud = Array.isArray(data.payload.users) && data.payload.users.length > 0;
            const currentUsersBackup = state.users;
            const currentCdsBackup = state.cds;
            const currentWorkspacesBackup = state.cdWorkspaces;
            state = {
                ...state,
                ...data.payload,
                users: hadUsersInCloud ? data.payload.users : currentUsersBackup,
                cds:
                    Array.isArray(data.payload.cds) && data.payload.cds.length > 0
                        ? data.payload.cds
                        : currentCdsBackup,
                cdWorkspaces:
                    data.payload.cdWorkspaces && typeof data.payload.cdWorkspaces === 'object'
                        ? data.payload.cdWorkspaces
                        : currentWorkspacesBackup
            };
            ensureUsersIntegrity();
            switchActiveCdWorkspace(currentCdId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            renderAll();
            if (!hadUsersInCloud || !data.payload.cdWorkspaces) {
                await pushStateToSupabase(false);
            }
            if (showNotification) {
                showToast('Dados baixados do Supabase com sucesso!', 'success');
            }
        } else {
            // Primeiro acesso na nuvem: envia o estado atual para inicializar o banco
            ensureUsersIntegrity();
            await pushStateToSupabase(showNotification);
        }
    } catch (err) {
        console.error('Erro ao buscar dados do Supabase:', err);
        if (showNotification) {
            showToast(`Erro ao ler Supabase: ${err.message}`, 'error');
        }
    }
}

function saveState() {
    syncCurrentCdToWorkspaces();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (supabaseClient) {
        pushStateToSupabase(false);
    }
}

// Toast corporativo
function showToast(message, type = 'primary') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3400);
}

// Classificação de Status Operacional do SKU
function getProductStatus(p) {
    const qty = Number(p.quantity) || 0;
    const min = Number(p.minStock) || 0;
    if (qty <= 0) {
        return { code: 'ZERO', label: 'Em Ruptura', badgeClass: 'badge-zero', color: '#dc2626' };
    }
    if (qty <= min) {
        return { code: 'LOW', label: 'Ponto de Pedido', badgeClass: 'badge-low', color: '#d97706' };
    }
    return { code: 'OK', label: 'Saudável', badgeClass: 'badge-ok', color: '#059669' };
}

// Cálculo Consolidado de Indicadores de RH, Folha e Turnover
function computeHrMetrics() {
    const all = state.employees || [];
    const active = all.filter((e) => e.status === 'ATIVO');
    const onLeave = all.filter((e) => e.status === 'FERIAS');
    const activeWorkforce = [...active, ...onLeave]; // Quadro efetivo contratado
    const dismissed = all.filter((e) => e.status === 'DESLIGADO');

    // Admissões recentes (últimos 180 dias) para índice de Turnover
    const cutoff = new Date(Date.now() - 180 * 24 * 3600 * 1000);
    const recentHires = all.filter((e) => new Date(e.hireDate) >= cutoff).length;
    const dismissalsCount = dismissed.length;

    const headcountBase = Math.max(activeWorkforce.length, 1);
    // Fórmula clássica de Turnover: (((Admissões + Desligamentos) / 2) / Efetivo) * 100
    const turnoverRate = (((recentHires + dismissalsCount) / 2) / headcountBase) * 100;
    const retentionRate = Math.max(0, 100 - (dismissalsCount / Math.max(all.length, 1)) * 100);

    const basePayroll = activeWorkforce.reduce((acc, e) => acc + (Number(e.salary) || 0), 0);
    const totalBenefits = activeWorkforce.reduce((acc, e) => acc + (Number(e.benefits) || 0), 0);
    const totalHrCost = basePayroll + totalBenefits;

    const avgSalary = activeWorkforce.length > 0 ? basePayroll / activeWorkforce.length : 0;
    const avgTotalCost = activeWorkforce.length > 0 ? totalHrCost / activeWorkforce.length : 0;

    return {
        totalRegistered: all.length,
        activeCount: active.length,
        onLeaveCount: onLeave.length,
        workforceCount: activeWorkforce.length,
        dismissalsCount,
        recentHires,
        turnoverRate,
        retentionRate,
        basePayroll,
        totalBenefits,
        totalHrCost,
        avgSalary,
        avgTotalCost
    };
}

// Cálculo Dinâmico da Matriz Curva ABC (Pareto 80 / 15 / 5)
function computeAbcAnalysis() {
    const totalValue = state.products.reduce(
        (acc, p) => acc + (Number(p.quantity) || 0) * (Number(p.price) || 0),
        0
    );

    const enriched = state.products
        .map((p) => {
            const val = (Number(p.quantity) || 0) * (Number(p.price) || 0);
            return { ...p, totalValue: val };
        })
        .sort((a, b) => b.totalValue - a.totalValue);

    let cumulative = 0;
    const abcMap = {};

    const ranked = enriched.map((item, idx) => {
        const share = totalValue > 0 ? (item.totalValue / totalValue) * 100 : 0;
        const prevCum = cumulative;
        cumulative += share;

        let abcClass = 'C';
        if (prevCum < 80) abcClass = 'A';
        else if (prevCum < 95) abcClass = 'B';

        abcMap[item.id] = abcClass;
        return {
            ...item,
            rank: idx + 1,
            sharePct: share,
            cumulativePct: Math.min(cumulative, 100),
            abcClass
        };
    });

    return { totalValue, ranked, abcMap };
}

// Status de Cautela
function getLoanComputedStatus(loan) {
    if (loan.status === 'RETURNED') {
        return { code: 'RETURNED', label: 'Devolvido', badgeClass: 'badge-ok' };
    }
    const now = new Date();
    const due = new Date(loan.dueDate);
    if (due < now) {
        return { code: 'OVERDUE', label: 'Em Atraso', badgeClass: 'badge-zero' };
    }
    return { code: 'ACTIVE', label: 'Em Uso', badgeClass: 'badge-low' };
}

function getMovementTypeBadge(type) {
    switch (type) {
        case 'IN':
            return { label: 'Entrada NF', cls: 'badge-in', sign: '+' };
        case 'OUT':
            return { label: 'Expedição/Saída', cls: 'badge-out', sign: '-' };
        case 'LOSS':
            return { label: 'Perda/Avaria', cls: 'badge-loss', sign: '-' };
        case 'ADJUST':
            return { label: 'Conciliação Inv.', cls: 'badge-adjust', sign: '=' };
        default:
            return { label: type, cls: 'badge-out', sign: '' };
    }
}

// ============================================================================
// CONTROLE DE AUTENTICAÇÃO E PERMISSÕES (RBAC MASTER)
// ============================================================================

function performLogin(rawUsername, rawPassword, rawCdId) {
    ensureUsersIntegrity();
    const username = String(rawUsername || '').trim().toLowerCase();
    const password = String(rawPassword || '').trim();
    const cdSelectEl = document.getElementById('loginCdSelect');
    const selectedCdId = rawCdId || (cdSelectEl ? cdSelectEl.value : 'cd-sp-01') || 'cd-sp-01';
    const errBox = document.getElementById('loginErrorMsg');

    const user = (state.users || []).find(
        (u) =>
            u &&
            String(u.username || '').trim().toLowerCase() === username &&
            String(u.password || '').trim() === password
    );

    if (!user) {
        if (errBox) {
            errBox.textContent = 'Login ou senha inválidos. Verifique suas credenciais.';
            errBox.style.display = 'block';
        }
        return false;
    }

    if (user.status === 'BLOQUEADO') {
        if (errBox) {
            errBox.textContent = 'Esta conta foi bloqueada pelo Usuário Master.';
            errBox.style.display = 'block';
        }
        return false;
    }

    const targetCdObj = (state.cds || []).find((c) => c.id === selectedCdId) || state.cds[0];
    if (!userHasCdAccess(user, targetCdObj.id)) {
        if (errBox) {
            errBox.textContent = `Acesso bloqueado: seu usuário (${user.username}) não possui liberação do Master para operar no "${targetCdObj.name}".`;
            errBox.style.display = 'block';
        }
        return false;
    }

    if (errBox) errBox.style.display = 'none';
    syncCurrentCdToWorkspaces();
    switchActiveCdWorkspace(targetCdObj.id);
    currentUser = user;
    state.siteLeaderName = user.name;
    sessionStorage.setItem(SESSION_USER_KEY, user.username);
    sessionStorage.setItem(SESSION_CD_KEY, targetCdObj.id);
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.add('hidden');
    renderAll();
    showToast(`Bem-vindo(a), ${user.name} • Operando em: ${targetCdObj.name}`, 'success');
    return true;
}

function hasTabPermission(tabId) {
    if (!currentUser) return false;
    const isMasterUser = Boolean(currentUser.isMaster || currentUser.rolePreset === 'MASTER');
    if (GOVERNANCE_MASTER_ONLY_TABS.includes(tabId)) {
        return isMasterUser;
    }
    if (isMasterUser) return true;
    const tabs = (currentUser.permissions && currentUser.permissions.tabs) || [];
    return tabs.includes(tabId);
}

function hasActionPermission(actionKey) {
    if (!currentUser) return false;
    if (currentUser.isMaster || currentUser.rolePreset === 'MASTER') return true;
    const actions = (currentUser.permissions && currentUser.permissions.actions) || {};
    return Boolean(actions[actionKey]);
}

function requireActionPermission(actionKey, actionName) {
    if (hasActionPermission(actionKey)) return true;
    showToast(`Acesso negado: seu usuário (${currentUser ? currentUser.username : ''}) não tem permissão para "${actionName}". Solicite ao Usuário Master.`, 'error');
    return false;
}

function applyUserPermissions() {
    if (!currentUser) return;

    const userNameEl = document.getElementById('sidebarUserName');
    const userRoleEl = document.getElementById('sidebarUserRole');
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (userRoleEl) userRoleEl.textContent = currentUser.isMaster ? 'MASTER' : currentUser.rolePreset || 'OPERADOR';

    // Controla visibilidade das abas da Sidebar conforme permissão do usuário
    let firstAllowedTab = null;
    document.querySelectorAll('.nav-btn').forEach((btn) => {
        const tabId = btn.dataset.tab;
        const allowed = hasTabPermission(tabId);
        btn.style.display = allowed ? 'flex' : 'none';
        if (allowed && !firstAllowedTab) firstAllowedTab = tabId;
    });

    // Oculta os cabeçalhos das seções da Sidebar se o usuário não tiver acesso às abas daquela seção
    const isMasterUser = Boolean(currentUser.isMaster || currentUser.rolePreset === 'MASTER');
    const govSectionLabel = document.getElementById('navGovSectionLabel');
    if (govSectionLabel) {
        govSectionLabel.style.display = isMasterUser ? 'block' : 'none';
    }
    const macroSectionLabel = document.getElementById('navMacroSectionLabel');
    if (macroSectionLabel) {
        const hasMacro = ['dashboard', 'rh', 'analytics'].some((t) => hasTabPermission(t));
        macroSectionLabel.style.display = hasMacro ? 'block' : 'none';
    }
    const microSectionLabel = document.getElementById('navMicroSectionLabel');
    if (microSectionLabel) {
        const hasMicro = ['produtos', 'movimentacoes', 'cautelas'].some((t) => hasTabPermission(t));
        microSectionLabel.style.display = hasMicro ? 'block' : 'none';
    }

    // Verifica se a aba ativa atual é permitida; se não, redireciona para a primeira permitida
    const activeBtn = document.querySelector('.nav-btn.active');
    const currentTabId = activeBtn ? activeBtn.dataset.tab : 'dashboard';
    if (!hasTabPermission(currentTabId) && firstAllowedTab) {
        document.querySelectorAll('.nav-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.tab === firstAllowedTab);
        });
        document.querySelectorAll('.tab-panel').forEach((panel) => {
            panel.classList.toggle('active', panel.id === `tab-${firstAllowedTab}`);
        });
    }

    // Controla botões de ação rápida no topo conforme permissões granulares
    const btnMap = [
        { id: 'quickNewProductBtn', perm: 'manageProducts' },
        { id: 'quickNewEmployeeBtn', perm: 'manageHr' },
        { id: 'newEmployeeFromTabBtn', perm: 'manageHr' },
        { id: 'quickMovementBtn', perm: 'registerMovements' },
        { id: 'newMovementFromTabBtn', perm: 'registerMovements' },
        { id: 'quickLoanBtn', perm: 'manageLoans' },
        { id: 'newLoanFromTabBtn', perm: 'manageLoans' },
        { id: 'quickAuditBtn', perm: 'auditStock' }
    ];

    btnMap.forEach(({ id, perm }) => {
        const el = document.getElementById(id);
        if (el) el.style.display = hasActionPermission(perm) ? 'inline-flex' : 'none';
    });

    // Oculta faixa de custos macro se o operador não tiver permissão financeira
    const macroBanner = document.querySelector('.macro-banner-grid');
    if (macroBanner) {
        macroBanner.style.display = hasActionPermission('viewFinancials') ? 'grid' : 'none';
    }
}

// Renderização Global
function renderAll() {
    const lockedUserDisplay = currentUser ? currentUser.name : state.siteLeaderName || 'Kelvin';
    document.getElementById('siteNameInput').value = state.siteName;
    document.getElementById('siteNameInput').readOnly = true;
    document.getElementById('siteNameInput').disabled = true;
    document.getElementById('siteLeaderNameInput').value = lockedUserDisplay;
    document.getElementById('siteLeaderNameInput').readOnly = true;
    document.getElementById('siteLeaderNameInput').disabled = true;
    document.getElementById('activeShiftSelect').value = state.activeShift;
    document.getElementById('headerSiteBadge').textContent = `🔒 ${state.siteName}`;
    document.getElementById('headerShiftBadge').textContent = state.activeShift;

    updateCategoryFilterOptions();
    renderDashboard();
    renderHrModule();
    renderAnalytics();
    renderProductsTable();
    renderMovementsTable();
    renderLoansTable();
    renderHandovers();
    renderUsersModule();
    updateSidebarBadges();
    applyUserPermissions();
}

function updateSidebarBadges() {
    const totalSkus = state.products.length;
    const healthySkus = state.products.filter((p) => getProductStatus(p).code === 'OK').length;
    const slaPct = totalSkus > 0 ? Math.round((healthySkus / totalSkus) * 100) : 100;

    const slaPill = document.getElementById('sidebarSlaBadge');
    slaPill.textContent = `SLA ${slaPct}%`;
    slaPill.style.background =
        slaPct >= 85
            ? 'rgba(16, 185, 129, 0.2)'
            : slaPct >= 65
            ? 'rgba(245, 158, 11, 0.25)'
            : 'rgba(239, 68, 68, 0.25)';
    slaPill.style.color = slaPct >= 85 ? '#34d399' : slaPct >= 65 ? '#fbbf24' : '#f87171';

    const criticalCount = totalSkus - healthySkus;
    const navLowBadge = document.getElementById('navLowStockBadge');
    if (criticalCount > 0) {
        navLowBadge.style.display = 'inline-block';
        navLowBadge.textContent = criticalCount;
    } else {
        navLowBadge.style.display = 'none';
    }

    const activeLoansCount = state.loans.filter((l) => l.status !== 'RETURNED').length;
    const navLoansBadge = document.getElementById('navLoansBadge');
    if (activeLoansCount > 0) {
        navLoansBadge.style.display = 'inline-block';
        navLoansBadge.textContent = activeLoansCount;
    } else {
        navLoansBadge.style.display = 'none';
    }

    const hrMetrics = computeHrMetrics();
    const navRhBadge = document.getElementById('navRhBadge');
    if (navRhBadge) {
        navRhBadge.textContent = `${hrMetrics.workforceCount} colab`;
    }
}

function updateCategoryFilterOptions() {
    const select = document.getElementById('productCategoryFilter');
    const currentVal = select.value;
    const categories = Array.from(new Set(state.products.map((p) => p.category).filter(Boolean))).sort();

    select.innerHTML = '<option value="ALL">Todas as Categorias</option>';
    categories.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });

    if (categories.includes(currentVal)) {
        select.value = currentVal;
    }
}

// TAB 1: EXECUTIVE DASHBOARD (MACRO & MICRO CD)
function renderDashboard() {
    const { totalValue, ranked, abcMap } = computeAbcAnalysis();
    const hr = computeHrMetrics();

    const totalUnits = state.products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
    const totalSkus = state.products.length;

    const okProducts = state.products.filter((p) => getProductStatus(p).code === 'OK');
    const lowProducts = state.products.filter((p) => getProductStatus(p).code === 'LOW');
    const zeroProducts = state.products.filter((p) => getProductStatus(p).code === 'ZERO');
    const criticalProducts = [...zeroProducts, ...lowProducts];

    const slaRate = totalSkus > 0 ? Math.round((okProducts.length / totalSkus) * 100) : 100;

    const replenishmentBudget = criticalProducts.reduce((acc, p) => {
        const target = Math.max((Number(p.minStock) || 10) * 2, 1);
        const needed = Math.max(target - (Number(p.quantity) || 0), 0);
        return acc + needed * (Number(p.price) || 0);
    }, 0);

    const classAValue = ranked
        .filter((r) => r.abcClass === 'A')
        .reduce((acc, r) => acc + r.totalValue, 0);
    const classAPct = totalValue > 0 ? Math.round((classAValue / totalValue) * 100) : 0;

    const activeLoans = state.loans.filter((l) => l.status !== 'RETURNED');
    const overdueLoans = activeLoans.filter((l) => getLoanComputedStatus(l).code === 'OVERDUE');
    const loanedValue = activeLoans.reduce((acc, l) => {
        const prod = state.products.find((p) => p.id === l.productId);
        const unitPrice = prod ? Number(prod.price) || 0 : 0;
        return acc + unitPrice * (Number(l.quantity) || 1);
    }, 0);

    const lossMovements = state.movements.filter((m) => m.type === 'LOSS');
    const totalLossValue = lossMovements.reduce((acc, m) => {
        const prod = state.products.find((p) => p.id === m.productId);
        const price = m.unitPrice !== undefined ? Number(m.unitPrice) : prod ? Number(prod.price) || 0 : 0;
        return acc + (Number(m.quantity) || 0) * price;
    }, 0);

    const outUnitsTotal = state.movements
        .filter((m) => m.type === 'OUT')
        .reduce((acc, m) => acc + (Number(m.quantity) || 0), 0);

    // Visão Macro Financeira do CD (Estoque + Folha Mensal RH)
    const macroTotalCd = totalValue + hr.totalHrCost;
    const costPerDispatchedUnit = outUnitsTotal > 0 ? hr.totalHrCost / outUnitsTotal : 0;

    document.getElementById('macroTotalCdCost').textContent = fmtCurrency(macroTotalCd);
    document.getElementById('macroTotalCdBreakdown').textContent = `Estoque: ${fmtCurrency(totalValue)} + Folha RH: ${fmtCurrency(hr.totalHrCost)}`;
    document.getElementById('macroPayrollCost').textContent = fmtCurrency(hr.totalHrCost);
    document.getElementById('macroPayrollSub').textContent = `${hr.workforceCount} efetivos • Custo médio ${fmtCurrency(hr.avgTotalCost)}`;
    document.getElementById('macroTurnoverRate').textContent = `${hr.turnoverRate.toFixed(1).replace('.', ',')}%`;
    document.getElementById('macroTurnoverSub').textContent = `${hr.recentHires} admissões • ${hr.dismissalsCount} desligamentos`;
    document.getElementById('macroCostPerUnit').textContent = `${fmtCurrency(costPerDispatchedUnit)} / un.`;
    document.getElementById('macroLossImpactSub').textContent = `Perdas/Avarias acumuladas: ${fmtCurrency(totalLossValue)}`;

    const todayStr = new Date().toISOString().slice(0, 10);
    const movementsToday = state.movements.filter((m) => (m.date || '').slice(0, 10) === todayStr).length;

    // 5 KPI Cards Operacionais
    document.getElementById('kpiTotalValue').textContent = fmtCurrency(totalValue);
    document.getElementById('kpiClassAShare').textContent = `Classe A concentra ${classAPct}% do capital`;
    document.getElementById('kpiSlaRate').textContent = `${slaRate}%`;
    document.getElementById('kpiTotalSkus').textContent = `${totalSkus} SKUs • ${fmtNumber(totalUnits)} un. físicas`;
    document.getElementById('kpiCriticalCount').textContent = `${criticalProducts.length} SKUs`;
    document.getElementById('kpiZeroStockCount').textContent = `${zeroProducts.length} em ruptura • Reposição: ${fmtCurrency(replenishmentBudget)}`;
    document.getElementById('kpiActiveLoans').textContent = `${activeLoans.length} ativos`;
    document.getElementById('kpiOverdueLoans').textContent = `${overdueLoans.length} atrasados • ${fmtCurrency(loanedValue)} em posse`;
    document.getElementById('kpiLossValue').textContent = fmtCurrency(totalLossValue);
    document.getElementById('kpiMovementsToday').textContent = `${movementsToday} mov. hoje • ${lossMovements.length} ocorrências perda`;

    const critCard = document.getElementById('kpiCriticalCard');
    critCard.classList.toggle('has-alerts', criticalProducts.length > 0);

    // 1. Donut Chart de Saúde do Estoque
    renderStockHealthDonut(okProducts.length, lowProducts.length, zeroProducts.length, totalSkus, slaRate);

    // 2. Comparativo por Turno (Headcount + Volume)
    renderShiftComparisonChart();

    // 3. Custo de Folha por Setor no Dashboard
    renderHrSectorBars('hrSectorBreakdownContainer', 4);

    // 4. Tabela de Plano de Reposição Imediata
    const alertsBody = document.getElementById('dashboardAlertsBody');
    const sortedCriticals = [...criticalProducts]
        .sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0))
        .slice(0, 6);

    if (sortedCriticals.length === 0) {
        alertsBody.innerHTML = `<tr><td colspan="6" class="empty-state">100% dos SKUs estão acima do ponto de pedido. Operação estabilizada!</td></tr>`;
    } else {
        alertsBody.innerHTML = sortedCriticals
            .map((p) => {
                const st = getProductStatus(p);
                const abc = abcMap[p.id] || 'C';
                const targetQty = Math.max((Number(p.minStock) || 10) * 2, 1);
                const buyQty = Math.max(targetQty - (Number(p.quantity) || 0), 1);
                const buyCost = buyQty * (Number(p.price) || 0);
                return `
                <tr>
                    <td>
                        <span class="sku-code">${escapeHtml(p.sku)}</span>
                        <div style="font-weight:600; margin-top:2px;">${escapeHtml(p.name)}</div>
                    </td>
                    <td><span class="abc-pill abc-${abc}">Classe ${abc}</span></td>
                    <td><strong>${fmtNumber(p.quantity)}</strong> / ${fmtNumber(p.minStock)} ${escapeHtml(p.unit)}</td>
                    <td>
                        <strong>+${fmtNumber(buyQty)} ${escapeHtml(p.unit)}</strong>
                        <div class="text-muted" style="font-size:11px;">Est.: ${fmtCurrency(buyCost)}</div>
                    </td>
                    <td><span class="badge ${st.badgeClass}">${st.label}</span></td>
                    <td class="text-right">
                        <button class="btn btn-sm btn-primary" onclick="openMovementModal('${p.id}', 'IN')">+ Receber</button>
                    </td>
                </tr>
            `;
            })
            .join('');
    }

    // 5. Cautelas em Aberto no Dashboard
    const loansBody = document.getElementById('dashboardLoansBody');
    const sortedActiveLoans = [...activeLoans]
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 6);

    if (sortedActiveLoans.length === 0) {
        loansBody.innerHTML = `<tr><td colspan="5" class="empty-state">Nenhum equipamento ou ativo pendente de devolução.</td></tr>`;
    } else {
        loansBody.innerHTML = sortedActiveLoans
            .map((l) => {
                const st = getLoanComputedStatus(l);
                return `
                <tr>
                    <td>
                        <strong>${escapeHtml(l.employeeName)}</strong>
                        <div class="text-muted" style="font-size:11px;">${escapeHtml(l.employeeId)} • ${escapeHtml(l.department)}</div>
                    </td>
                    <td><span class="sku-code">${escapeHtml(l.sku)}</span> ${escapeHtml(l.productName)} <strong>(${l.quantity}x)</strong></td>
                    <td>${fmtDateTime(l.dueDate)}</td>
                    <td><span class="badge ${st.badgeClass}">${st.label}</span></td>
                    <td class="text-right">
                        <button class="btn btn-sm btn-success" onclick="returnLoan('${l.id}')">Baixar</button>
                    </td>
                </tr>
            `;
            })
            .join('');
    }

    // 6. Kardex Recente no Dashboard
    const movBody = document.getElementById('dashboardMovementsBody');
    const recentMovs = [...state.movements]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6);

    if (recentMovs.length === 0) {
        movBody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhuma transação registrada no Kardex.</td></tr>`;
    } else {
        movBody.innerHTML = recentMovs
            .map((m) => {
                const t = getMovementTypeBadge(m.type);
                const prod = state.products.find((p) => p.id === m.productId);
                const unitPrice = m.unitPrice !== undefined ? Number(m.unitPrice) : prod ? Number(prod.price) || 0 : 0;
                const finImpact = (Number(m.quantity) || 0) * unitPrice;
                return `
                <tr>
                    <td>${fmtDateTime(m.date)}</td>
                    <td><span class="badge ${t.cls}">${t.label}</span></td>
                    <td><span class="sku-code">${escapeHtml(m.sku)}</span> <strong>${escapeHtml(m.productName)}</strong></td>
                    <td><strong>${t.sign}${fmtNumber(m.quantity)}</strong></td>
                    <td>${fmtCurrency(finImpact)}</td>
                    <td><strong>${fmtNumber(m.balanceAfter)}</strong></td>
                    <td><strong>${escapeHtml(m.shift)}</strong> • ${escapeHtml(m.responsible)}</td>
                    <td>${escapeHtml(m.reason)}</td>
                </tr>
            `;
            })
            .join('');
    }
}

// Renderiza Donut Chart SVG de Saúde do Inventário
function renderStockHealthDonut(okCount, lowCount, zeroCount, total, slaRate) {
    const container = document.getElementById('stockHealthDonutContainer');
    if (total === 0) {
        container.innerHTML = `<div class="empty-state">Sem SKUs cadastrados.</div>`;
        return;
    }

    const r = 48;
    const c = 2 * Math.PI * r;
    const okLen = (okCount / total) * c;
    const lowLen = (lowCount / total) * c;
    const zeroLen = (zeroCount / total) * c;

    container.innerHTML = `
        <div class="donut-svg-wrap">
            <svg width="132" height="132" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="14"/>
                <circle cx="60" cy="60" r="${r}" fill="none" stroke="#10b981" stroke-width="14"
                    stroke-dasharray="${okLen} ${c}" stroke-dashoffset="0" transform="rotate(-90 60 60)"/>
                <circle cx="60" cy="60" r="${r}" fill="none" stroke="#f59e0b" stroke-width="14"
                    stroke-dasharray="${lowLen} ${c}" stroke-dashoffset="${-okLen}" transform="rotate(-90 60 60)"/>
                <circle cx="60" cy="60" r="${r}" fill="none" stroke="#ef4444" stroke-width="14"
                    stroke-dasharray="${zeroLen} ${c}" stroke-dashoffset="${-(okLen + lowLen)}" transform="rotate(-90 60 60)"/>
            </svg>
            <div class="donut-center-text">
                <strong>${slaRate}%</strong>
                <span>SLA Site</span>
            </div>
        </div>
        <div class="donut-legend">
            <div class="legend-item">
                <span class="legend-left"><span class="legend-dot" style="background:#10b981"></span>Saudável</span>
                <strong>${okCount} SKUs</strong>
            </div>
            <div class="legend-item">
                <span class="legend-left"><span class="legend-dot" style="background:#f59e0b"></span>Ponto Pedido</span>
                <strong>${lowCount} SKUs</strong>
            </div>
            <div class="legend-item">
                <span class="legend-left"><span class="legend-dot" style="background:#ef4444"></span>Em Ruptura</span>
                <strong>${zeroCount} SKUs</strong>
            </div>
        </div>
    `;
}

// Renderiza Comparativo de Movimentações + Headcount por Turno
function renderShiftComparisonChart() {
    const container = document.getElementById('shiftComparisonContainer');
    const shifts = ['T1 - Manhã', 'T2 - Tarde', 'T3 - Noite', 'ADM'];
    const stats = {};
    shifts.forEach((s) => (stats[s] = { inQty: 0, outQty: 0, lossQty: 0, txCount: 0, hc: 0 }));

    (state.employees || []).forEach((e) => {
        if (e.status !== 'DESLIGADO' && stats[e.shift]) {
            stats[e.shift].hc += 1;
        }
    });

    state.movements.forEach((m) => {
        const s = stats[m.shift] ? m.shift : 'T1 - Manhã';
        const q = Number(m.quantity) || 0;
        stats[s].txCount += 1;
        if (m.type === 'IN') stats[s].inQty += q;
        else if (m.type === 'OUT') stats[s].outQty += q;
        else if (m.type === 'LOSS') stats[s].lossQty += q;
    });

    const maxTotal = Math.max(
        ...Object.values(stats).map((d) => d.inQty + d.outQty + d.lossQty),
        1
    );

    container.innerHTML = shifts
        .map((shift) => {
            const d = stats[shift];
            const inPct = Math.round((d.inQty / maxTotal) * 100);
            const outPct = Math.round((d.outQty / maxTotal) * 100);
            const lossPct = Math.round((d.lossQty / maxTotal) * 100);
            return `
            <div class="shift-row">
                <div class="shift-row-header">
                    <span>${escapeHtml(shift)} <small class="text-muted">(${d.hc} colab. • ${d.txCount} mov.)</small></span>
                    <span>
                        <span style="color:#059669">+${fmtNumber(d.inQty)}</span> /
                        <span style="color:#2563eb">-${fmtNumber(d.outQty)}</span>
                        ${d.lossQty > 0 ? `/ <span style="color:#dc2626">-${fmtNumber(d.lossQty)} av.</span>` : ''}
                    </span>
                </div>
                <div class="dual-bar-track">
                    <div class="bar-in" style="width:${inPct}%"></div>
                    <div class="bar-out" style="width:${outPct}%"></div>
                    <div class="bar-loss" style="width:${lossPct}%"></div>
                </div>
            </div>
        `;
        })
        .join('');
}

// Renderiza Barras de Custo de Folha por Setor do CD
function renderHrSectorBars(containerId, limit = 10) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const activeEmps = (state.employees || []).filter((e) => e.status !== 'DESLIGADO');
    if (activeEmps.length === 0) {
        container.innerHTML = `<div class="empty-state">Sem colaboradores ativos cadastrados.</div>`;
        return;
    }

    const map = {};
    activeEmps.forEach((e) => {
        const sec = e.sector || 'Operação Geral';
        if (!map[sec]) map[sec] = { count: 0, cost: 0 };
        map[sec].count += 1;
        map[sec].cost += (Number(e.salary) || 0) + (Number(e.benefits) || 0);
    });

    const entries = Object.entries(map).sort((a, b) => b[1].cost - a[1].cost);
    const maxCost = Math.max(...entries.map(([, d]) => d.cost), 1);

    container.innerHTML = entries
        .slice(0, limit)
        .map(([sec, data]) => {
            const pct = Math.max(8, Math.round((data.cost / maxCost) * 100));
            return `
            <div class="cat-row">
                <div class="cat-row-top">
                    <span>${escapeHtml(sec)} <small class="cat-row-meta">(${data.count} colab.)</small></span>
                    <span>${fmtCurrency(data.cost)}/mês</span>
                </div>
                <div class="cat-progress-bg">
                    <div class="cat-progress-fill" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
        })
        .join('');
}

// TAB 2: CONTROLE DE RH, SALÁRIOS & TURNOVER DO SETOR
function renderHrModule() {
    const hr = computeHrMetrics();

    document.getElementById('rhKpiActiveCount').textContent = `${hr.activeCount} ativos`;
    document.getElementById('rhKpiTotalRegistered').textContent = `${hr.totalRegistered} registrados • ${hr.onLeaveCount} férias/afast.`;
    document.getElementById('rhKpiTurnoverRate').textContent = `${hr.turnoverRate.toFixed(1).replace('.', ',')}%`;
    document.getElementById('rhKpiTurnoverDetail').textContent = `${hr.recentHires} admissões • ${hr.dismissalsCount} desligamentos`;
    document.getElementById('rhKpiBasePayroll').textContent = fmtCurrency(hr.basePayroll);
    document.getElementById('rhKpiAvgSalary').textContent = `Salário base médio: ${fmtCurrency(hr.avgSalary)}`;
    document.getElementById('rhKpiTotalCost').textContent = fmtCurrency(hr.totalHrCost);
    document.getElementById('rhKpiCostPerActive').textContent = `Custo médio total/colab: ${fmtCurrency(hr.avgTotalCost)}`;
    document.getElementById('rhKpiRetentionRate').textContent = `${hr.retentionRate.toFixed(1).replace('.', ',')}%`;
    document.getElementById('rhKpiDismissedCount').textContent = `${hr.dismissalsCount} desligados no histórico`;

    // Gráfico 1: Custo de Folha por Setor
    renderHrSectorBars('rhSectorCostChart', 8);

    // Gráfico 2: Turnover e Efetivo por Turno
    const shiftChart = document.getElementById('rhTurnoverShiftChart');
    const shifts = ['T1 - Manhã', 'T2 - Tarde', 'T3 - Noite', 'ADM'];
    const sMap = {};
    shifts.forEach((s) => (sMap[s] = { active: 0, dismissed: 0, cost: 0 }));

    (state.employees || []).forEach((e) => {
        const s = sMap[e.shift] ? e.shift : 'T1 - Manhã';
        if (e.status === 'DESLIGADO') {
            sMap[s].dismissed += 1;
        } else {
            sMap[s].active += 1;
            sMap[s].cost += (Number(e.salary) || 0) + (Number(e.benefits) || 0);
        }
    });

    const maxShiftEmp = Math.max(...Object.values(sMap).map((d) => d.active + d.dismissed), 1);
    shiftChart.innerHTML = shifts
        .map((shift) => {
            const d = sMap[shift];
            const actPct = Math.round((d.active / maxShiftEmp) * 100);
            const disPct = Math.round((d.dismissed / maxShiftEmp) * 100);
            const shiftTurnover =
                d.active + d.dismissed > 0
                    ? ((d.dismissed / (d.active + d.dismissed)) * 100).toFixed(0)
                    : 0;
            return `
            <div class="shift-row">
                <div class="shift-row-header">
                    <span>${escapeHtml(shift)} <small class="text-muted">(Folha: ${fmtCurrency(d.cost)})</small></span>
                    <span>
                        <span style="color:#059669">${d.active} ativos</span> •
                        <span style="color:#dc2626">${d.dismissed} deslig. (${shiftTurnover}% rot.)</span>
                    </span>
                </div>
                <div class="dual-bar-track">
                    <div class="bar-in" style="width:${actPct}%"></div>
                    <div class="bar-loss" style="width:${disPct}%"></div>
                </div>
            </div>
        `;
        })
        .join('');

    renderEmployeesTable();
}

function renderEmployeesTable() {
    const search = document.getElementById('rhSearchInput').value.trim().toLowerCase();
    const sector = document.getElementById('rhSectorFilter').value;
    const shift = document.getElementById('rhShiftFilter').value;
    const status = document.getElementById('rhStatusFilter').value;

    const filtered = (state.employees || []).filter((e) => {
        const matchesSearch =
            !search ||
            e.name.toLowerCase().includes(search) ||
            e.code.toLowerCase().includes(search) ||
            (e.cpf && e.cpf.toLowerCase().includes(search)) ||
            (e.phone && e.phone.toLowerCase().includes(search)) ||
            (e.role && e.role.toLowerCase().includes(search));

        const matchesSector = sector === 'ALL' || e.sector === sector;
        const matchesShift = shift === 'ALL' || e.shift === shift;
        const matchesStatus = status === 'ALL' || e.status === status;

        return matchesSearch && matchesSector && matchesShift && matchesStatus;
    });

    const tbody = document.getElementById('rhTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="empty-state">Nenhum colaborador encontrado para os filtros aplicados.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered
        .map((e) => {
            const totalCost = (Number(e.salary) || 0) + (Number(e.benefits) || 0);
            const activeLoansForEmp = state.loans.filter(
                (l) =>
                    l.status !== 'RETURNED' &&
                    (l.employeeId.toUpperCase() === e.code.toUpperCase() ||
                        l.employeeName.toLowerCase() === e.name.toLowerCase())
            ).length;

            let badgeHtml = `<span class="badge badge-ok">Ativo</span>`;
            if (e.status === 'FERIAS') {
                badgeHtml = `<span class="badge badge-low">Férias/Afast.</span>`;
            } else if (e.status === 'DESLIGADO') {
                badgeHtml = `<span class="badge badge-zero" title="${escapeHtml(e.dismissReason || '')}">Desligado</span>`;
            }

            const cleanDigits = String(e.phone || '').replace(/\D/g, '');
            const waUrl = cleanDigits ? `https://wa.me/55${cleanDigits}` : '#';

            return `
            <tr>
                <td><span class="sku-code">${escapeHtml(e.code)}</span></td>
                <td>
                    <strong>${escapeHtml(e.name)}</strong>
                    <div class="text-muted" style="font-size:11.5px;">${escapeHtml(e.role)}</div>
                </td>
                <td><span class="sku-code">${escapeHtml(e.cpf)}</span></td>
                <td>
                    <a href="${waUrl}" target="_blank" class="phone-link" title="Chamar no WhatsApp">
                        📱 ${escapeHtml(e.phone)}
                    </a>
                </td>
                <td>
                    <strong>${escapeHtml(e.sector)}</strong>
                    <div class="text-muted" style="font-size:11px;">${escapeHtml(e.shift)}</div>
                </td>
                <td>
                    ${fmtDate(e.hireDate)}
                    ${e.status === 'DESLIGADO' && e.dismissDate ? `<div class="text-muted" style="font-size:11px; color:var(--danger)">Saída: ${fmtDate(e.dismissDate)}</div>` : ''}
                </td>
                <td>${fmtCurrency(e.salary)}</td>
                <td>
                    <strong>${fmtCurrency(totalCost)}</strong>
                    <div class="text-muted" style="font-size:10.5px;">+${fmtCurrency(e.benefits)} enc./benef.</div>
                </td>
                <td>
                    ${
                        activeLoansForEmp > 0
                            ? `<span class="badge badge-low">${activeLoansForEmp} item(ns)</span>`
                            : `<span class="text-muted">0</span>`
                    }
                </td>
                <td>
                    ${badgeHtml}
                    ${e.status === 'DESLIGADO' && e.dismissReason ? `<div class="text-muted" style="font-size:10.5px;">${escapeHtml(e.dismissReason)}</div>` : ''}
                </td>
                <td class="text-right">
                    <div class="action-group">
                        <button class="btn btn-sm btn-outline" onclick="openEditEmployeeModal('${e.id}')">Editar</button>
                        <button class="btn btn-sm btn-outline" style="color:var(--danger)" onclick="deleteEmployee('${e.id}')">✕</button>
                    </div>
                </td>
            </tr>
        `;
        })
        .join('');
}

// TAB 3: CURVA ABC & CUSTOS
function renderAnalytics() {
    const { totalValue, ranked } = computeAbcAnalysis();
    const hr = computeHrMetrics();

    const groups = {
        A: { title: 'Classe A (Alto Impacto • ~80% Valor)', items: [], val: 0 },
        B: { title: 'Classe B (Médio Impacto • ~15% Valor)', items: [], val: 0 },
        C: { title: 'Classe C (Baixo Impacto • ~5% Valor)', items: [], val: 0 }
    };

    ranked.forEach((item) => {
        groups[item.abcClass].items.push(item);
        groups[item.abcClass].val += item.totalValue;
    });

    const cardsContainer = document.getElementById('abcSummaryCards');
    cardsContainer.innerHTML = ['A', 'B', 'C']
        .map((cls) => {
            const g = groups[cls];
            const pctVal = totalValue > 0 ? ((g.val / totalValue) * 100).toFixed(1) : '0.0';
            const pctSkus =
                ranked.length > 0 ? Math.round((g.items.length / ranked.length) * 100) : 0;
            return `
            <div class="abc-card">
                <div class="abc-card-header">
                    <strong>${g.title}</strong>
                    <span class="abc-pill abc-${cls}">Curva ${cls}</span>
                </div>
                <div style="font-size:22px; font-weight:800; margin:4px 0;">${fmtCurrency(g.val)}</div>
                <div class="text-muted">${pctVal}% do valor financeiro • ${g.items.length} SKUs (${pctSkus}% do catálogo)</div>
            </div>
        `;
        })
        .join('');

    const abcBody = document.getElementById('abcTableBody');
    if (ranked.length === 0) {
        abcBody.innerHTML = `<tr><td colspan="8" class="empty-state">Cadastre SKUs para gerar a Matriz ABC.</td></tr>`;
    } else {
        abcBody.innerHTML = ranked
            .map(
                (item) => `
            <tr>
                <td><strong>#${item.rank}</strong></td>
                <td><span class="sku-code">${escapeHtml(item.sku)}</span> <strong>${escapeHtml(item.name)}</strong></td>
                <td>${fmtNumber(item.quantity)} ${escapeHtml(item.unit)}</td>
                <td>${fmtCurrency(item.price)}</td>
                <td><strong>${fmtCurrency(item.totalValue)}</strong></td>
                <td>${item.sharePct.toFixed(1)}%</td>
                <td><strong>${item.cumulativePct.toFixed(1)}%</strong></td>
                <td><span class="abc-pill abc-${item.abcClass}">Classe ${item.abcClass}</span></td>
            </tr>
        `
            )
            .join('');
    }

    const capexBox = document.getElementById('capexProjectionBox');
    let totalToMin = 0;
    let totalToIdeal = 0;

    state.products.forEach((p) => {
        const qty = Number(p.quantity) || 0;
        const min = Number(p.minStock) || 0;
        const price = Number(p.price) || 0;
        if (qty < min) totalToMin += (min - qty) * price;
        if (qty < min * 2) totalToIdeal += (min * 2 - qty) * price;
    });

    capexBox.innerHTML = `
        <div class="capex-highlight">
            <span class="kpi-label">Custo Global do CD (Folha RH + Estoque + Reposição Ideal)</span>
            <div style="font-size:22px; font-weight:800; color:#0f172a; margin:4px 0;">${fmtCurrency(totalValue + hr.totalHrCost + totalToIdeal)}</div>
            <p class="text-muted">Soma do Capital em Estoque (${fmtCurrency(totalValue)}) + Folha Mensal RH (${fmtCurrency(hr.totalHrCost)}) + Reposição Ideal (${fmtCurrency(totalToIdeal)}).</p>
        </div>
        <div class="capex-highlight">
            <span class="kpi-label">Orçamento Mínimo de Estoque (Zerar Rupturas)</span>
            <div style="font-size:22px; font-weight:800; color:var(--danger); margin:4px 0;">${fmtCurrency(totalToMin)}</div>
            <p class="text-muted">Valor estritamente necessário para recompor todos os itens críticos até o estoque mínimo.</p>
        </div>
        <div class="capex-highlight">
            <span class="kpi-label">Orçamento Ideal de Cobertura (Estoque Alvo = 2x Mínimo)</span>
            <div style="font-size:22px; font-weight:800; color:var(--primary); margin:4px 0;">${fmtCurrency(totalToIdeal)}</div>
            <p class="text-muted">Investimento recomendado para garantir folga operacional nos 3 turnos sem risco de parada.</p>
        </div>
    `;
}

// TAB 4: TABELA DE PRODUTOS & POSIÇÃO
function renderProductsTable() {
    const search = document.getElementById('productSearchInput').value.trim().toLowerCase();
    const category = document.getElementById('productCategoryFilter').value;
    const abcFilter = document.getElementById('productAbcFilter').value;
    const statusFilter = document.getElementById('productStatusFilter').value;
    const sortBy = document.getElementById('productSortSelect').value;

    const { abcMap } = computeAbcAnalysis();

    let filtered = state.products.filter((p) => {
        const matchesSearch =
            !search ||
            p.sku.toLowerCase().includes(search) ||
            p.name.toLowerCase().includes(search) ||
            (p.location && p.location.toLowerCase().includes(search)) ||
            (p.notes && p.notes.toLowerCase().includes(search));

        const matchesCategory = category === 'ALL' || p.category === category;
        const pAbc = abcMap[p.id] || 'C';
        const matchesAbc = abcFilter === 'ALL' || pAbc === abcFilter;

        const st = getProductStatus(p).code;
        let matchesStatus = true;
        if (statusFilter === 'CRITICAL') matchesStatus = st === 'LOW' || st === 'ZERO';
        else if (statusFilter !== 'ALL') matchesStatus = st === statusFilter;

        return matchesSearch && matchesCategory && matchesAbc && matchesStatus;
    });

    filtered.sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'stock-asc') return (Number(a.quantity) || 0) - (Number(b.quantity) || 0);
        if (sortBy === 'value-desc') {
            return (
                (Number(b.quantity) || 0) * (Number(b.price) || 0) -
                (Number(a.quantity) || 0) * (Number(a.price) || 0)
            );
        }
        if (sortBy === 'updated-desc') {
            return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        }
        return 0;
    });

    const tbody = document.getElementById('productsTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="empty-state">Nenhum SKU encontrado para os critérios selecionados.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered
        .map((p) => {
            const st = getProductStatus(p);
            const abc = abcMap[p.id] || 'C';
            const totalVal = (Number(p.quantity) || 0) * (Number(p.price) || 0);
            const idealQty = Math.max((Number(p.minStock) || 10) * 2, 1);
            const fillPct = Math.min(100, Math.round(((Number(p.quantity) || 0) / idealQty) * 100));

            return `
            <tr>
                <td><span class="sku-code">${escapeHtml(p.sku)}</span></td>
                <td>
                    <strong>${escapeHtml(p.name)}</strong>
                    ${p.notes ? `<div class="text-muted" style="font-size:11px;">${escapeHtml(p.notes)}</div>` : ''}
                </td>
                <td><span class="abc-pill abc-${abc}">${abc}</span></td>
                <td>${escapeHtml(p.category)}</td>
                <td><span class="location-pill">${escapeHtml(p.location)}</span></td>
                <td><strong style="font-size:13.5px;">${fmtNumber(p.quantity)}</strong> <small class="text-muted">${escapeHtml(p.unit)}</small></td>
                <td>${fmtNumber(p.minStock)} / ${fmtNumber(idealQty)}</td>
                <td>
                    <div class="mini-gauge" title="${fillPct}% do estoque alvo">
                        <div class="mini-gauge-fill" style="width:${fillPct}%; background:${st.color}"></div>
                    </div>
                </td>
                <td>${fmtCurrency(p.price)}</td>
                <td><strong>${fmtCurrency(totalVal)}</strong></td>
                <td><span class="badge ${st.badgeClass}">${st.label}</span></td>
                <td class="text-right">
                    <div class="action-group">
                        <button class="btn btn-sm btn-outline" onclick="openMovementModal('${p.id}', 'IN')">+ Ent</button>
                        <button class="btn btn-sm btn-outline" onclick="openMovementModal('${p.id}', 'OUT')">- Saí</button>
                        <button class="btn btn-sm btn-outline" onclick="openEditProductModal('${p.id}')">Editar</button>
                        <button class="btn btn-sm btn-outline" style="color:var(--danger)" onclick="deleteProduct('${p.id}')">✕</button>
                    </div>
                </td>
            </tr>
        `;
        })
        .join('');
}

// TAB 5: TABELA DE MOVIMENTAÇÕES (KARDEX)
function renderMovementsTable() {
    const search = document.getElementById('movementSearchInput').value.trim().toLowerCase();
    const typeFilter = document.getElementById('movementTypeFilter').value;
    const shiftFilter = document.getElementById('movementShiftFilter').value;

    const filtered = state.movements
        .filter((m) => {
            const matchesSearch =
                !search ||
                (m.sku && m.sku.toLowerCase().includes(search)) ||
                (m.productName && m.productName.toLowerCase().includes(search)) ||
                (m.responsible && m.responsible.toLowerCase().includes(search)) ||
                (m.reason && m.reason.toLowerCase().includes(search));

            const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
            const matchesShift = shiftFilter === 'ALL' || m.shift === shiftFilter;
            return matchesSearch && matchesType && matchesShift;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('movementsTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Nenhuma movimentação encontrada para os filtros selecionados.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered
        .map((m) => {
            const t = getMovementTypeBadge(m.type);
            const prod = state.products.find((p) => p.id === m.productId);
            const unitPrice = m.unitPrice !== undefined ? Number(m.unitPrice) : prod ? Number(prod.price) || 0 : 0;
            const impact = (Number(m.quantity) || 0) * unitPrice;
            return `
            <tr>
                <td>${fmtDateTime(m.date)}</td>
                <td><span class="badge ${t.cls}">${t.label}</span></td>
                <td><span class="sku-code">${escapeHtml(m.sku)}</span> <strong>${escapeHtml(m.productName)}</strong></td>
                <td><strong>${t.sign}${fmtNumber(m.quantity)}</strong></td>
                <td>${fmtCurrency(impact)}</td>
                <td><strong>${fmtNumber(m.balanceAfter)}</strong></td>
                <td>${escapeHtml(m.shift)}</td>
                <td>${escapeHtml(m.responsible)}</td>
                <td>${escapeHtml(m.reason)}</td>
            </tr>
        `;
        })
        .join('');
}

// TAB 6: TABELA DE CAUTELAS
function renderLoansTable() {
    const search = document.getElementById('loanSearchInput').value.trim().toLowerCase();
    const statusFilter = document.getElementById('loanStatusFilter').value;

    const filtered = state.loans
        .filter((l) => {
            const matchesSearch =
                !search ||
                l.employeeName.toLowerCase().includes(search) ||
                l.employeeId.toLowerCase().includes(search) ||
                l.department.toLowerCase().includes(search) ||
                l.productName.toLowerCase().includes(search) ||
                l.sku.toLowerCase().includes(search);

            const computed = getLoanComputedStatus(l).code;
            let matchesStatus = true;
            if (statusFilter === 'ACTIVE') matchesStatus = computed === 'ACTIVE' || computed === 'OVERDUE';
            else if (statusFilter === 'OVERDUE') matchesStatus = computed === 'OVERDUE';
            else if (statusFilter === 'RETURNED') matchesStatus = computed === 'RETURNED';

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (a.status === 'RETURNED' && b.status !== 'RETURNED') return 1;
            if (a.status !== 'RETURNED' && b.status === 'RETURNED') return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

    const tbody = document.getElementById('loansTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Nenhum registro de cautela encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered
        .map((l) => {
            const st = getLoanComputedStatus(l);
            const prod = state.products.find((p) => p.id === l.productId);
            const valResp = (prod ? Number(prod.price) || 0 : 0) * (Number(l.quantity) || 1);
            return `
            <tr>
                <td>
                    <strong>${escapeHtml(l.employeeName)}</strong>
                    ${l.notes ? `<div class="text-muted" style="font-size:11px;">${escapeHtml(l.notes)}</div>` : ''}
                </td>
                <td><span class="sku-code">${escapeHtml(l.employeeId)}</span> • ${escapeHtml(l.department)}</td>
                <td><span class="sku-code">${escapeHtml(l.sku)}</span> ${escapeHtml(l.productName)}</td>
                <td><strong>${fmtNumber(l.quantity)}</strong></td>
                <td>${fmtCurrency(valResp)}</td>
                <td>${fmtDateTime(l.loanDate)}</td>
                <td>
                    ${fmtDateTime(l.dueDate)}
                    ${l.returnedDate ? `<div class="text-muted" style="font-size:11px;">Devolvido: ${fmtDateTime(l.returnedDate)}</div>` : ''}
                </td>
                <td><span class="badge ${st.badgeClass}">${st.label}</span></td>
                <td class="text-right">
                    <div class="action-group">
                        ${
                            l.status !== 'RETURNED'
                                ? `<button class="btn btn-sm btn-success" onclick="returnLoan('${l.id}')">Confirmar Devolução</button>`
                                : ''
                        }
                        <button class="btn btn-sm btn-outline" onclick="printLoanReceipt('${l.id}')">Emitir Termo</button>
                    </div>
                </td>
            </tr>
        `;
        })
        .join('');
}

// TAB 7: PASSAGEM DE TURNO (SHIFT HANDOVER)
function renderHandovers() {
    const list = document.getElementById('handoverHistoryList');
    document.getElementById('hoFromShift').value = state.activeShift;
    document.getElementById('hoLeaderOut').value = `${state.siteLeaderName || 'Kelvin'} (Site Leader)`;

    if (!state.handovers || state.handovers.length === 0) {
        list.innerHTML = `<div class="empty-state">Nenhuma passagem de turno registrada ainda.</div>`;
        return;
    }

    list.innerHTML = state.handovers
        .map(
            (h) => `
        <div class="handover-item">
            <div class="handover-top">
                <strong>${escapeHtml(h.fromShift)} &rarr; ${escapeHtml(h.toShift)}</strong>
                <span class="text-muted">${fmtDateTime(h.date)}</span>
            </div>
            <div style="font-size:12.5px; margin-bottom:6px;">
                Entregue por: <strong>${escapeHtml(h.leaderOut)}</strong> • Recebido por: <strong>${escapeHtml(h.leaderIn)}</strong>
            </div>
            <div class="handover-kpi-strip">
                <span>SLA: ${escapeHtml(h.snapshotSla)}</span>
                <span>Estoque: ${escapeHtml(h.snapshotValue)}</span>
                <span>Críticos: ${h.snapshotCriticals} SKUs</span>
                ${(h.checks || []).map((c) => `<span style="color:#059669">✓ ${escapeHtml(c)}</span>`).join('')}
            </div>
            <p style="font-size:12.5px; color:var(--text-secondary); margin-top:6px;">
                <strong>Apontamentos:</strong> ${escapeHtml(h.notes)}
            </p>
        </div>
    `
        )
        .join('');
}

// TAB 9: GESTÃO DE USUÁRIOS & PERMISSÕES (RBAC MASTER)
function renderUsersModule() {
    const users = state.users || [];
    const cds = state.cds || getDefaultCds();
    const masters = users.filter((u) => u.isMaster || u.rolePreset === 'MASTER');
    const active = users.filter((u) => u.status === 'ATIVO');
    const blocked = users.filter((u) => u.status === 'BLOQUEADO');

    const elTotal = document.getElementById('usrKpiTotal');
    if (!elTotal) return;
    elTotal.textContent = users.length;
    document.getElementById('usrKpiMasters').textContent = masters.length;
    document.getElementById('usrKpiActive').textContent = active.length;
    document.getElementById('usrKpiBlocked').textContent = blocked.length;

    const cdsListEl = document.getElementById('registeredCdsList');
    if (cdsListEl) {
        cdsListEl.innerHTML = cds
            .map((cd) => {
                const ws = (state.cdWorkspaces && state.cdWorkspaces[cd.id]) || {};
                const skuCount = cd.id === currentCdId ? state.products.length : (ws.products || []).length;
                const empCount = cd.id === currentCdId ? state.employees.length : (ws.employees || []).length;
                const isCurrent = cd.id === currentCdId;
                return `<span class="perm-tag ${isCurrent ? 'action' : ''}" style="padding:6px 10px; font-size:12px;">
                    🏢 <strong>${escapeHtml(cd.name)}</strong> (${skuCount} SKUs • ${empCount} Colab.)${isCurrent ? ' • [Ativo na sua sessão]' : ''}
                </span>`;
            })
            .join('');
    }

    const cdNamesMap = {};
    cds.forEach((c) => {
        cdNamesMap[c.id] = c.name;
    });

    const tabNamesMap = {
        dashboard: 'Dashboard',
        rh: 'RH & Turnover',
        analytics: 'Curva ABC',
        produtos: 'Estoque SKUs',
        movimentacoes: 'Kardex',
        cautelas: 'Cautelas',
        handover: 'Passagem Turno',
        relatorios: 'CSV & Dados',
        usuarios: 'Master Admin'
    };

    const actionNamesMap = {
        viewFinancials: 'Ver Custos (R$)',
        manageProducts: 'Criar/Editar SKUs',
        registerMovements: 'Movimentar Kardex',
        manageLoans: 'Gerenciar Cautelas',
        auditStock: 'Auditoria Inv.',
        manageHr: 'Gerenciar RH'
    };

    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = users
        .map((u) => {
            const tabs = u.isMaster
                ? Object.keys(tabNamesMap)
                : (u.permissions && u.permissions.tabs) || [];
            const actionsObj = u.isMaster
                ? {
                      viewFinancials: true,
                      manageProducts: true,
                      registerMovements: true,
                      manageLoans: true,
                      auditStock: true,
                      manageHr: true
                  }
                : (u.permissions && u.permissions.actions) || {};

            const allowedCds = u.isMaster || (u.allowedCds && u.allowedCds.includes('ALL'))
                ? ['ALL']
                : Array.isArray(u.allowedCds) && u.allowedCds.length > 0
                ? u.allowedCds
                : ['cd-sp-01'];

            const cdsHtml = allowedCds.includes('ALL')
                ? `<span class="perm-tag action">👑 Todos os CDs (${cds.length})</span>`
                : allowedCds
                      .map((cdId) => `<span class="perm-tag">🏢 ${escapeHtml(cdNamesMap[cdId] || cdId)}</span>`)
                      .join('');

            const tabsHtml = tabs
                .map((t) => `<span class="perm-tag">${escapeHtml(tabNamesMap[t] || t)}</span>`)
                .join('');
            const actionsHtml = Object.entries(actionsObj)
                .filter(([, val]) => Boolean(val))
                .map(([k]) => `<span class="perm-tag action">${escapeHtml(actionNamesMap[k] || k)}</span>`)
                .join('');

            const isBlocked = u.status === 'BLOQUEADO';
            return `
            <tr>
                <td><span class="sku-code">${escapeHtml(u.username)}</span></td>
                <td>
                    <strong>${escapeHtml(u.name)}</strong>
                    <div class="text-muted" style="font-size:11px;">Senha: <code>${escapeHtml(u.password)}</code></div>
                </td>
                <td>
                    <span class="abc-pill ${u.isMaster ? 'abc-A' : 'abc-B'}">
                        ${u.isMaster ? '👑 MASTER' : escapeHtml(u.roleLabel || u.rolePreset)}
                    </span>
                </td>
                <td><div class="perm-pill-list">${cdsHtml}</div></td>
                <td>${escapeHtml(u.shift || 'Todos')}</td>
                <td><div class="perm-pill-list">${tabsHtml || '<span class="text-muted">Nenhuma</span>'}</div></td>
                <td><div class="perm-pill-list">${actionsHtml || '<span class="text-muted">Somente Leitura</span>'}</div></td>
                <td>
                    <span class="badge ${isBlocked ? 'badge-zero' : 'badge-ok'}">
                        ${isBlocked ? 'Bloqueado' : 'Ativo'}
                    </span>
                </td>
                <td class="text-right">
                    <div class="action-group">
                        <button class="btn btn-sm btn-outline" onclick="openEditUserModal('${u.id}')">Permissões / CDs</button>
                        ${
                            u.username !== 'kelvin'
                                ? `<button class="btn btn-sm btn-outline" onclick="toggleUserBlock('${u.id}')">${isBlocked ? 'Desbloquear' : 'Bloquear'}</button>
                                   <button class="btn btn-sm btn-outline" style="color:var(--danger)" onclick="deleteUser('${u.id}')">✕</button>`
                                : ''
                        }
                    </div>
                </td>
            </tr>
        `;
        })
        .join('');
}

function renderCdsChecklistInModal(selectedCds = ['cd-sp-01'], isMasterRole = false) {
    const container = document.getElementById('userAllowedCdsChecklist');
    if (!container) return;
    const cds = Array.isArray(state.cds) && state.cds.length > 0 ? state.cds : getDefaultCds();
    const allSelected = isMasterRole || (Array.isArray(selectedCds) && selectedCds.includes('ALL'));

    container.innerHTML = cds
        .map((cd) => {
            const isChecked = allSelected || (Array.isArray(selectedCds) && selectedCds.includes(cd.id));
            return `<label class="check-item">
                <input type="checkbox" class="perm-cd-checkbox" value="${escapeHtml(cd.id)}" ${isChecked ? 'checked' : ''} ${isMasterRole ? 'disabled' : ''}>
                🏢 ${escapeHtml(cd.name)}
            </label>`;
        })
        .join('');
}

function syncGovernanceMasterLockInModal(isMasterRole) {
    ['permTabHandover', 'permTabRelatorios', 'permTabUsuarios'].forEach((chkId) => {
        const chk = document.getElementById(chkId);
        if (!chk) return;
        chk.checked = Boolean(isMasterRole);
        chk.disabled = !isMasterRole;
    });
    document.querySelectorAll('.perm-cd-checkbox').forEach((chk) => {
        if (isMasterRole) {
            chk.checked = true;
            chk.disabled = true;
        } else {
            chk.disabled = false;
        }
    });
}

function applyUserPresetToModal(preset) {
    const isMasterRole = preset === 'MASTER';
    syncGovernanceMasterLockInModal(isMasterRole);
    if (preset === 'CUSTOM') return;
    const perms = getRolePresetPermissions(preset);
    const t = perms.tabs;
    const a = perms.actions;

    document.getElementById('permTabDashboard').checked = t.includes('dashboard');
    document.getElementById('permTabRh').checked = t.includes('rh');
    document.getElementById('permTabAnalytics').checked = t.includes('analytics');
    document.getElementById('permTabProdutos').checked = t.includes('produtos');
    document.getElementById('permTabMovimentacoes').checked = t.includes('movimentacoes');
    document.getElementById('permTabCautelas').checked = t.includes('cautelas');
    document.getElementById('permTabHandover').checked = isMasterRole;
    document.getElementById('permTabRelatorios').checked = isMasterRole;
    document.getElementById('permTabUsuarios').checked = isMasterRole;

    document.getElementById('permActViewFinancials').checked = Boolean(a.viewFinancials);
    document.getElementById('permActManageProducts').checked = Boolean(a.manageProducts);
    document.getElementById('permActRegisterMovements').checked = Boolean(a.registerMovements);
    document.getElementById('permActManageLoans').checked = Boolean(a.manageLoans);
    document.getElementById('permActAuditStock').checked = Boolean(a.auditStock);
    document.getElementById('permActManageHr').checked = Boolean(a.manageHr);
}

function openNewUserModal() {
    if (!currentUser || (!currentUser.isMaster && currentUser.rolePreset !== 'MASTER')) {
        showToast('Apenas o Usuário Master pode cadastrar ou alterar usuários.', 'error');
        return;
    }
    document.getElementById('userModalTitle').textContent = 'Cadastrar Novo Usuário & Definir CDs e Permissões';
    document.getElementById('userForm').reset();
    document.getElementById('usrId').value = '';
    document.getElementById('usrUsername').disabled = false;
    document.getElementById('usrRolePreset').value = 'OPERADOR';
    renderCdsChecklistInModal([currentCdId], false);
    applyUserPresetToModal('OPERADOR');
    openModal('userModal');
}

function openEditUserModal(userId) {
    if (!currentUser || (!currentUser.isMaster && currentUser.rolePreset !== 'MASTER')) {
        showToast('Apenas o Usuário Master pode alterar permissões.', 'error');
        return;
    }
    const u = (state.users || []).find((item) => item.id === userId);
    if (!u) return;

    const isMasterRole = Boolean(u.isMaster || u.rolePreset === 'MASTER');
    document.getElementById('userModalTitle').textContent = `Configurar CDs & Permissões: ${u.name} (${u.username})`;
    document.getElementById('usrId').value = u.id;
    document.getElementById('usrUsername').value = u.username;
    document.getElementById('usrPassword').value = u.password;
    document.getElementById('usrName').value = u.name;
    document.getElementById('usrRolePreset').value = u.rolePreset || 'CUSTOM';
    document.getElementById('usrShift').value = u.shift || 'Todos';
    document.getElementById('usrStatus').value = u.status || 'ATIVO';

    renderCdsChecklistInModal(u.allowedCds || ['cd-sp-01'], isMasterRole);

    const t = isMasterRole
        ? ['dashboard', 'rh', 'analytics', 'produtos', 'movimentacoes', 'cautelas', 'handover', 'relatorios', 'usuarios']
        : (u.permissions && u.permissions.tabs) || [];
    const a = isMasterRole
        ? {
              viewFinancials: true,
              manageProducts: true,
              registerMovements: true,
              manageLoans: true,
              auditStock: true,
              manageHr: true
          }
        : (u.permissions && u.permissions.actions) || {};

    document.getElementById('permTabDashboard').checked = t.includes('dashboard');
    document.getElementById('permTabRh').checked = t.includes('rh');
    document.getElementById('permTabAnalytics').checked = t.includes('analytics');
    document.getElementById('permTabProdutos').checked = t.includes('produtos');
    document.getElementById('permTabMovimentacoes').checked = t.includes('movimentacoes');
    document.getElementById('permTabCautelas').checked = t.includes('cautelas');
    syncGovernanceMasterLockInModal(isMasterRole);

    document.getElementById('permActViewFinancials').checked = Boolean(a.viewFinancials);
    document.getElementById('permActManageProducts').checked = Boolean(a.manageProducts);
    document.getElementById('permActRegisterMovements').checked = Boolean(a.registerMovements);
    document.getElementById('permActManageLoans').checked = Boolean(a.manageLoans);
    document.getElementById('permActAuditStock').checked = Boolean(a.auditStock);
    document.getElementById('permActManageHr').checked = Boolean(a.manageHr);

    openModal('userModal');
}

function toggleUserBlock(userId) {
    const u = (state.users || []).find((item) => item.id === userId);
    if (!u || u.username === 'kelvin') return;
    u.status = u.status === 'BLOQUEADO' ? 'ATIVO' : 'BLOQUEADO';
    saveState();
    renderAll();
    showToast(`Status do usuário ${u.username} alterado para ${u.status}.`, 'success');
}

function deleteUser(userId) {
    const u = (state.users || []).find((item) => item.id === userId);
    if (!u || u.username === 'kelvin') return;
    if (!confirm(`Deseja realmente excluir o usuário "${u.username} - ${u.name}"?`)) return;
    state.users = state.users.filter((item) => item.id !== userId);
    saveState();
    renderAll();
    showToast(`Usuário ${u.username} removido.`, 'success');
}

// Modais
function openModal(modalId) {
    document.getElementById(modalId).classList.add('open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

// Modal de Colaborador (RH)
function openNewEmployeeModal() {
    if (!requireActionPermission('manageHr', 'Cadastrar Colaboradores no RH')) return;
    document.getElementById('employeeModalTitle').textContent = 'Cadastrar Novo Colaborador no CD (RH & Folha)';
    document.getElementById('employeeForm').reset();
    document.getElementById('empId').value = '';
    const nextCode = 5000 + (state.employees ? state.employees.length + 15 : 1);
    document.getElementById('empCode').value = `MAT-${nextCode}`;
    document.getElementById('empShift').value = state.activeShift;
    document.getElementById('empHireDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('empStatus').value = 'ATIVO';
    toggleDismissFields();
    updateEmployeeCostPreview();
    openModal('employeeModal');
}

function openEditEmployeeModal(empId) {
    if (!requireActionPermission('manageHr', 'Editar Colaboradores no RH')) return;
    const e = (state.employees || []).find((item) => item.id === empId);
    if (!e) return;

    document.getElementById('employeeModalTitle').textContent = `Editar Colaborador (${e.code} - ${e.name})`;
    document.getElementById('empId').value = e.id;
    document.getElementById('empCode').value = e.code;
    document.getElementById('empName').value = e.name;
    document.getElementById('empCpf').value = e.cpf;
    document.getElementById('empPhone').value = e.phone;
    document.getElementById('empRole').value = e.role;
    document.getElementById('empSector').value = e.sector;
    document.getElementById('empShift').value = e.shift;
    document.getElementById('empHireDate').value = e.hireDate;
    document.getElementById('empSalary').value = e.salary;
    document.getElementById('empBenefits').value = e.benefits;
    document.getElementById('empStatus').value = e.status;
    document.getElementById('empDismissDate').value = e.dismissDate || new Date().toISOString().slice(0, 10);
    document.getElementById('empDismissReason').value =
        e.dismissReason || 'Involuntário (Desempenho / Empresa)';
    toggleDismissFields();
    updateEmployeeCostPreview();
    openModal('employeeModal');
}

function deleteEmployee(empId) {
    if (!requireActionPermission('manageHr', 'Excluir Colaboradores no RH')) return;
    const e = (state.employees || []).find((item) => item.id === empId);
    if (!e) return;
    if (!confirm(`Deseja realmente excluir o cadastro do colaborador "${e.code} - ${e.name}"?`)) return;

    state.employees = state.employees.filter((item) => item.id !== empId);
    saveState();
    renderAll();
    showToast(`Colaborador ${e.name} removido da base de RH.`, 'success');
}

function toggleDismissFields() {
    const st = document.getElementById('empStatus').value;
    const isDismissed = st === 'DESLIGADO';
    document.getElementById('empDismissDateGroup').style.display = isDismissed ? 'flex' : 'none';
    document.getElementById('empDismissReasonGroup').style.display = isDismissed ? 'flex' : 'none';
}

function updateEmployeeCostPreview() {
    const sal = Number(document.getElementById('empSalary').value) || 0;
    const ben = Number(document.getElementById('empBenefits').value) || 0;
    const total = sal + ben;
    const annual = total * 12;
    document.getElementById('empCostPreview').innerHTML = `
        Custo Mensal Total p/ o CD: <strong>${fmtCurrency(total)}</strong>
        (Salário: ${fmtCurrency(sal)} + Encargos/Benef.: ${fmtCurrency(ben)}) •
        Projeção Anual: <strong>${fmtCurrency(annual)}</strong>
    `;
}

// Modal de Produto
function openNewProductModal() {
    if (!requireActionPermission('manageProducts', 'Cadastrar Novo SKU')) return;
    document.getElementById('productModalTitle').textContent = 'Cadastrar Novo SKU no Catálogo';
    document.getElementById('productForm').reset();
    document.getElementById('prodId').value = '';
    const nextNum = state.products.length + 101;
    document.getElementById('prodSku').value = `MER-${nextNum}`;
    openModal('productModal');
}

function openEditProductModal(productId) {
    if (!requireActionPermission('manageProducts', 'Editar SKU')) return;
    const p = state.products.find((item) => item.id === productId);
    if (!p) return;

    document.getElementById('productModalTitle').textContent = `Editar SKU (${p.sku})`;
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodSku').value = p.sku;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodLocation').value = p.location;
    document.getElementById('prodUnit').value = p.unit || 'UN';
    document.getElementById('prodQuantity').value = p.quantity;
    document.getElementById('prodMinStock').value = p.minStock;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodNotes').value = p.notes || '';
    openModal('productModal');
}

function deleteProduct(productId) {
    if (!requireActionPermission('manageProducts', 'Excluir SKU')) return;
    const p = state.products.find((item) => item.id === productId);
    if (!p) return;
    if (!confirm(`Confirmar exclusão definitiva do SKU "${p.sku} - ${p.name}"?`)) return;

    state.products = state.products.filter((item) => item.id !== productId);
    saveState();
    renderAll();
    showToast(`SKU ${p.sku} removido do catálogo.`, 'success');
}

// Modal de Movimentação
function openMovementModal(preselectedProductId = null, preselectedType = 'IN') {
    if (!requireActionPermission('registerMovements', 'Lançar Movimentações no Kardex')) return;
    if (state.products.length === 0) {
        showToast('Cadastre ao menos um SKU antes de movimentar o estoque.', 'error');
        return;
    }

    const select = document.getElementById('movProductSelect');
    select.innerHTML = state.products
        .map(
            (p) =>
                `<option value="${p.id}">[${escapeHtml(p.sku)}] ${escapeHtml(p.name)} (Saldo: ${p.quantity} ${p.unit})</option>`
        )
        .join('');

    if (preselectedProductId) select.value = preselectedProductId;

    document.getElementById('movType').value = preselectedType;
    document.getElementById('movQty').value = 1;
    document.getElementById('movShift').value = state.activeShift;
    document.getElementById('movResponsible').value = currentUser ? currentUser.name : `${state.siteLeaderName || 'Kelvin'} (Site Leader)`;
    document.getElementById('movReason').value = '';
    updateMovementStockPreview();
    openModal('movementModal');
}

function updateMovementStockPreview() {
    const prodId = document.getElementById('movProductSelect').value;
    const type = document.getElementById('movType').value;
    const qty = Number(document.getElementById('movQty').value) || 0;
    const qtyLabel = document.getElementById('movQtyLabel');
    const preview = document.getElementById('movStockPreview');

    const p = state.products.find((item) => item.id === prodId);
    if (!p) return;

    const current = Number(p.quantity) || 0;
    let after = current;

    if (type === 'IN') {
        qtyLabel.textContent = 'Quantidade Recebida *';
        after = current + qty;
    } else if (type === 'OUT' || type === 'LOSS') {
        qtyLabel.textContent = 'Quantidade de Saída/Baixa *';
        after = current - qty;
    } else if (type === 'ADJUST') {
        qtyLabel.textContent = 'Novo Saldo Físico Apurado *';
        after = qty;
    }

    const finImpact = Math.abs(type === 'ADJUST' ? after - current : qty) * (Number(p.price) || 0);
    const color = after < 0 ? 'var(--danger)' : 'var(--primary)';
    preview.innerHTML = `SKU: <strong>${escapeHtml(p.sku)}</strong> | Saldo atual: <strong>${current} ${escapeHtml(
        p.unit
    )}</strong> &rarr; Saldo projetado: <strong style="color:${color}">${after} ${escapeHtml(
        p.unit
    )}</strong> | Impacto Fin.: <strong>${fmtCurrency(finImpact)}</strong>`;
}

// Modal de Auditoria Rápida
function openAuditModal() {
    if (!requireActionPermission('auditStock', 'Realizar Auditoria de Inventário')) return;
    if (state.products.length === 0) {
        showToast('Não há SKUs cadastrados para auditar.', 'error');
        return;
    }
    const select = document.getElementById('auditProductSelect');
    select.innerHTML = state.products
        .map(
            (p) =>
                `<option value="${p.id}">[${escapeHtml(p.sku)}] ${escapeHtml(p.name)} (Saldo Sistêmico: ${p.quantity} ${p.unit})</option>`
        )
        .join('');

    const first = state.products[0];
    document.getElementById('auditCountedQty').value = first.quantity;
    document.getElementById('auditNotes').value = `Auditoria cíclica de inventário conduzida no turno ${state.activeShift}`;
    updateAuditVariancePreview();
    openModal('auditModal');
}

function updateAuditVariancePreview() {
    const prodId = document.getElementById('auditProductSelect').value;
    const counted = Number(document.getElementById('auditCountedQty').value) || 0;
    const p = state.products.find((item) => item.id === prodId);
    if (!p) return;

    const sys = Number(p.quantity) || 0;
    const diff = counted - sys;
    const diffVal = diff * (Number(p.price) || 0);
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
    const color = diff === 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--primary)';

    document.getElementById('auditVariancePreview').innerHTML = `
        Saldo Sistêmico: <strong>${sys} ${escapeHtml(p.unit)}</strong> |
        Contagem Física: <strong>${counted} ${escapeHtml(p.unit)}</strong> |
        Divergência: <strong style="color:${color}">${diffStr} ${escapeHtml(p.unit)} (${fmtCurrency(diffVal)})</strong>
    `;
}

// Modal de Nova Cautela integrado ao RH
function openLoanModal() {
    if (!requireActionPermission('manageLoans', 'Emitir Cautela de Equipamento')) return;
    const availableProducts = state.products.filter((p) => (Number(p.quantity) || 0) > 0);
    if (availableProducts.length === 0) {
        showToast('Não há itens com saldo disponível para cautela.', 'error');
        return;
    }

    const select = document.getElementById('loanProductSelect');
    select.innerHTML = availableProducts
        .map(
            (p) =>
                `<option value="${p.id}">[${escapeHtml(p.sku)}] ${escapeHtml(p.name)} (Disp: ${p.quantity} ${p.unit})</option>`
        )
        .join('');

    const empQuick = document.getElementById('loanEmployeeQuickSelect');
    const activeEmps = (state.employees || []).filter((e) => e.status === 'ATIVO');
    empQuick.innerHTML =
        `<option value="">-- Selecione um colaborador ativo do RH (ou preencha abaixo) --</option>` +
        activeEmps
            .map(
                (e) =>
                    `<option value="${e.id}">[${escapeHtml(e.code)}] ${escapeHtml(e.name)} (${escapeHtml(e.sector)} • ${escapeHtml(e.shift)})</option>`
            )
            .join('');

    document.getElementById('loanForm').reset();
    document.getElementById('loanDepartment').value = state.activeShift;

    const due = new Date(Date.now() + 8 * 3600 * 1000);
    const localIso = new Date(due.getTime() - due.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('loanDueDate').value = localIso;

    openModal('loanModal');
}

function returnLoan(loanId) {
    if (!requireActionPermission('manageLoans', 'Confirmar Devolução de Cautela')) return;
    const loan = state.loans.find((l) => l.id === loanId);
    if (!loan || loan.status === 'RETURNED') return;

    loan.status = 'RETURNED';
    loan.returnedDate = new Date().toISOString();

    const product = state.products.find((p) => p.id === loan.productId);
    if (product) {
        product.quantity = (Number(product.quantity) || 0) + (Number(loan.quantity) || 1);
        product.updatedAt = new Date().toISOString();

        state.movements.unshift({
            id: 'mov_' + Date.now(),
            date: new Date().toISOString(),
            type: 'IN',
            productId: product.id,
            sku: product.sku,
            productName: product.name,
            quantity: Number(loan.quantity) || 1,
            unitPrice: product.price,
            balanceAfter: product.quantity,
            shift: state.activeShift,
            responsible: loan.employeeName,
            reason: `Baixa/Devolução de Cautela (${loan.employeeId})`
        });
    }

    saveState();
    renderAll();
    showToast(`Devolução de ${loan.employeeName} concluída e estoque recomposto!`, 'success');
}

function printLoanReceipt(loanId) {
    const l = state.loans.find((item) => item.id === loanId);
    if (!l) return;

    const prod = state.products.find((p) => p.id === l.productId);
    const unitVal = prod ? Number(prod.price) || 0 : 0;

    const win = window.open('', '_blank', 'width=760,height=660');
    if (!win) {
        showToast('Habilite pop-ups para imprimir o Termo de Responsabilidade.', 'error');
        return;
    }

    win.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Controle de Custos e Estoque | Termo de Cautela - ${escapeHtml(l.employeeName)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 36px; color: #0f172a; line-height: 1.6; }
                .header { display:flex; justify-content:space-between; border-bottom:2px solid #0f172a; padding-bottom:12px; margin-bottom:20px; }
                .box { border: 1px solid #cbd5e1; padding: 16px; border-radius: 6px; margin: 18px 0; background:#f8fafc; }
                .sign-row { display: flex; justify-content: space-between; margin-top: 72px; gap: 36px; }
                .sign-line { flex: 1; border-top: 1px solid #0f172a; text-align: center; padding-top: 8px; font-size: 13px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h2 style="margin:0;">CONTROLE DE CUSTOS E ESTOQUE — TERMO DE CAUTELA</h2>
                    <small>Centro de Distribuição: <strong>${escapeHtml(state.siteName)}</strong></small>
                </div>
                <div style="text-align:right; font-size:12px;">
                    <strong>Protocolo: #${escapeHtml(l.id.toUpperCase())}</strong><br>
                    Emissão: ${fmtDateTime(new Date().toISOString())}
                </div>
            </div>
            <div class="box">
                <p><strong>Colaborador Responsável:</strong> ${escapeHtml(l.employeeName)} | <strong>Matrícula:</strong> ${escapeHtml(l.employeeId)}</p>
                <p><strong>Setor / Turno:</strong> ${escapeHtml(l.department)}</p>
                <p><strong>Ativo / Mercadoria:</strong> [${escapeHtml(l.sku)}] ${escapeHtml(l.productName)}</p>
                <p><strong>Quantidade:</strong> ${l.quantity} | <strong>Valor Declarado:</strong> ${fmtCurrency(unitVal * l.quantity)}</p>
                <p><strong>Data/Hora Retirada:</strong> ${fmtDateTime(l.loanDate)} | <strong>Limite para Devolução:</strong> ${fmtDateTime(l.dueDate)}</p>
                <p><strong>Nº Série / Patrimônio / Condição:</strong> ${escapeHtml(l.notes || 'Entregue em perfeito estado operacional')}</p>
            </div>
            <p style="font-size:13px;">Declaro para os devidos fins ter recebido o(s) equipamento(s)/item(ns) discriminado(s) acima em perfeitas condições de funcionamento, assumindo total responsabilidade por sua guarda, uso exclusivo na operação e devolução obrigatória ao Site Leader ao final do turno estipulado.</p>
            <div class="sign-row">
                <div class="sign-line">Assinatura do Colaborador<br><strong>${escapeHtml(l.employeeName)} (${escapeHtml(l.employeeId)})</strong></div>
                <div class="sign-line">Autorizado pelo Site Leader<br><strong>${escapeHtml(state.siteLeaderName || 'Kelvin')} - ${escapeHtml(state.siteName)}</strong></div>
            </div>
            <script>window.print();<\/script>
        </body>
        </html>
    `);
    win.document.close();
}

// Exportação CSV com BOM UTF-8 (para planilha modelo)
function downloadCsv(filename, headers, rows) {
    const escapeCsvCell = (val) => {
        const str = val === null || val === undefined ? '' : String(val);
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvLines = [
        headers.map(escapeCsvCell).join(';'),
        ...rows.map((row) => row.map(escapeCsvCell).join(';'))
    ];

    const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// Exportação nativa formatada para Microsoft Excel (.xls com tabela corporativa, KPIs e bordas)
function downloadExcelReport(filenameBase, reportTitle, kpis, headers, rows) {
    const nowStr = fmtDateTime(new Date().toISOString());
    const userLabel = currentUser ? `${currentUser.name} (${currentUser.username})` : state.siteLeaderName || 'Kelvin';

    const kpiCells = (kpis || [])
        .map(
            (k) =>
                `<td colspan="2" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:8px; font-family:Calibri,Arial,sans-serif;">
                    <div style="font-size:10pt; color:#475569;">${escapeHtml(k.label)}</div>
                    <div style="font-size:12pt; font-weight:bold; color:#0f172a;">${escapeHtml(k.value)}</div>
                </td>`
        )
        .join('');

    const headerCells = headers
        .map(
            (h) =>
                `<th style="background:#1e3a8a; color:#ffffff; font-weight:bold; padding:8px 10px; border:1px solid #1e293b; text-align:left; font-family:Calibri,Arial,sans-serif; font-size:10.5pt;">${escapeHtml(
                    h
                )}</th>`
        )
        .join('');

    const bodyRows =
        rows.length > 0
            ? rows
                  .map((row, idx) => {
                      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                      const cells = row
                          .map(
                              (cell) =>
                                  `<td style="background:${bg}; padding:6px 10px; border:1px solid #cbd5e1; font-family:Calibri,Arial,sans-serif; font-size:10pt; color:#0f172a;">${escapeHtml(
                                      cell === null || cell === undefined ? '' : String(cell)
                                  )}</td>`
                          )
                          .join('');
                      return `<tr>${cells}</tr>`;
                  })
                  .join('')
            : `<tr><td colspan="${headers.length}" style="padding:14px; text-align:center;">Nenhum registro encontrado.</td></tr>`;

    const htmlExcel = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Relatorio CD</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head>
        <body>
            <table border="1" cellspacing="0" cellpadding="4">
                <tr>
                    <td colspan="${headers.length}" style="background:#0f172a; color:#ffffff; font-size:14pt; font-weight:bold; padding:12px; font-family:Calibri,Arial,sans-serif;">
                        CONTROLE DE CUSTOS E ESTOQUE — ${escapeHtml(reportTitle.toUpperCase())}
                    </td>
                </tr>
                <tr>
                    <td colspan="${headers.length}" style="background:#e2e8f0; color:#1e293b; font-size:10pt; padding:6px 10px; font-family:Calibri,Arial,sans-serif;">
                        <strong>Unidade / CD:</strong> ${escapeHtml(state.siteName)} &nbsp;|&nbsp;
                        <strong>Turno:</strong> ${escapeHtml(state.activeShift)} &nbsp;|&nbsp;
                        <strong>Emitido por:</strong> ${escapeHtml(userLabel)} &nbsp;|&nbsp;
                        <strong>Data/Hora:</strong> ${escapeHtml(nowStr)}
                    </td>
                </tr>
                ${kpiCells ? `<tr>${kpiCells}</tr>` : ''}
                <tr><td colspan="${headers.length}"></td></tr>
                <tr>${headerCells}</tr>
                ${bodyRows}
            </table>
        </body>
        </html>
    `;

    const blob = new Blob(['\uFEFF' + htmlExcel], {
        type: 'application/vnd.ms-excel;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase}_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// Gerador de Relatório Executivo em PDF (Janela Corporativa Formatada pronta para Salvar como PDF / Impressão)
function openExecutivePdfReport(reportTitle, reportSubtitle, kpis, headers, rows) {
    const win = window.open('', '_blank', 'width=1080,height=780');
    if (!win) {
        showToast('Habilite pop-ups no navegador para gerar o relatório em PDF.', 'error');
        return;
    }

    const nowStr = fmtDateTime(new Date().toISOString());
    const userLabel = currentUser ? `${currentUser.name} (${currentUser.username})` : state.siteLeaderName || 'Kelvin';

    const kpisHtml = (kpis || [])
        .map(
            (k) => `
            <div class="kpi-box">
                <span class="kpi-lbl">${escapeHtml(k.label)}</span>
                <strong class="kpi-val">${escapeHtml(k.value)}</strong>
            </div>
        `
        )
        .join('');

    const thHtml = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
    const trHtml =
        rows.length > 0
            ? rows
                  .map(
                      (row) =>
                          `<tr>${row
                              .map((cell) => `<td>${escapeHtml(cell === null || cell === undefined ? '' : String(cell))}</td>`)
                              .join('')}</tr>`
                  )
                  .join('')
            : `<tr><td colspan="${headers.length}" style="text-align:center; padding:20px; color:#64748b;">Nenhum registro encontrado neste CD.</td></tr>`;

    win.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>${escapeHtml(reportTitle)} | ${escapeHtml(state.siteName)}</title>
            <style>
                @page { size: landscape; margin: 12mm; }
                * { box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    color: #0f172a;
                    margin: 0;
                    padding: 24px;
                    background: #ffffff;
                }
                .top-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #0f172a;
                    color: #fff;
                    padding: 12px 18px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .top-actions button {
                    background: #2563eb;
                    color: #fff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 700;
                    cursor: pointer;
                    font-size: 13px;
                }
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 2px solid #0f172a;
                    padding-bottom: 14px;
                    margin-bottom: 18px;
                }
                .report-header h1 {
                    margin: 0 0 4px 0;
                    font-size: 20px;
                    color: #0f172a;
                }
                .report-header p {
                    margin: 0;
                    font-size: 12.5px;
                    color: #475569;
                }
                .meta-box {
                    text-align: right;
                    font-size: 12px;
                    line-height: 1.5;
                    color: #334155;
                }
                .kpi-strip {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
                    gap: 10px;
                    margin-bottom: 18px;
                }
                .kpi-box {
                    background: #f8fafc;
                    border: 1px solid #cbd5e1;
                    border-left: 4px solid #2563eb;
                    padding: 10px 12px;
                    border-radius: 6px;
                }
                .kpi-lbl {
                    display: block;
                    font-size: 11px;
                    text-transform: uppercase;
                    color: #64748b;
                    margin-bottom: 4px;
                }
                .kpi-val {
                    font-size: 16px;
                    color: #0f172a;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11.5px;
                }
                th {
                    background: #1e293b;
                    color: #ffffff;
                    text-align: left;
                    padding: 8px 9px;
                    border: 1px solid #1e293b;
                    font-weight: 600;
                }
                td {
                    padding: 7px 9px;
                    border: 1px solid #cbd5e1;
                    color: #1e293b;
                }
                tr:nth-child(even) td {
                    background: #f8fafc;
                }
                .signatures {
                    display: flex;
                    justify-content: space-between;
                    gap: 48px;
                    margin-top: 46px;
                    page-break-inside: avoid;
                }
                .sig-line {
                    flex: 1;
                    border-top: 1px solid #0f172a;
                    text-align: center;
                    padding-top: 6px;
                    font-size: 12px;
                }
                @media print {
                    .top-actions { display: none !important; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="top-actions">
                <div>
                    <strong>Visualização de Documento Executivo (PDF)</strong> — Escolha <em>"Salvar como PDF"</em> no destino da impressão.
                </div>
                <button onclick="window.print()">🖨️ Salvar como PDF / Imprimir</button>
            </div>
            <div class="report-header">
                <div>
                    <h1>${escapeHtml(reportTitle)}</h1>
                    <p>${escapeHtml(reportSubtitle)}</p>
                </div>
                <div class="meta-box">
                    <strong>Unidade / CD:</strong> ${escapeHtml(state.siteName)}<br>
                    <strong>Turno Operacional:</strong> ${escapeHtml(state.activeShift)}<br>
                    <strong>Emitido por:</strong> ${escapeHtml(userLabel)}<br>
                    <strong>Emissão:</strong> ${escapeHtml(nowStr)}
                </div>
            </div>
            ${kpisHtml ? `<div class="kpi-strip">${kpisHtml}</div>` : ''}
            <table>
                <thead><tr>${thHtml}</tr></thead>
                <tbody>${trHtml}</tbody>
            </table>
            <div class="signatures">
                <div class="sig-line">Responsável pela Emissão<br><strong>${escapeHtml(userLabel)}</strong></div>
                <div class="sig-line">Validação Gerencial / Site Leader Master<br><strong>${escapeHtml(state.siteName)}</strong></div>
            </div>
            <script>
                setTimeout(() => { window.print(); }, 350);
            <\/script>
        </body>
        </html>
    `);
    win.document.close();
}

// Inicialização e Eventos
document.addEventListener('DOMContentLoaded', () => {
    loadState();

    // Restaura sessão logada (Usuário + CD travado) se existir e ainda estiver ativa
    const savedSessionUsername = sessionStorage.getItem(SESSION_USER_KEY);
    const savedSessionCdId = sessionStorage.getItem(SESSION_CD_KEY) || 'cd-sp-01';
    if (savedSessionUsername) {
        const found = (state.users || []).find(
            (u) => u.username.toLowerCase() === savedSessionUsername.toLowerCase() && u.status === 'ATIVO'
        );
        if (found && userHasCdAccess(found, savedSessionCdId)) {
            switchActiveCdWorkspace(savedSessionCdId);
            currentUser = found;
            state.siteLeaderName = found.name;
            document.getElementById('loginOverlay').classList.add('hidden');
        }
    }

    renderAll();
    if (initSupabaseClient()) {
        pullStateFromSupabase(false);
    }

    // Autenticação de Login, Senha e CD Operacional
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const selectedCdId = document.getElementById('loginCdSelect').value;
        performLogin(username, password, selectedCdId);
    });

    // Logout / Trocar Usuário ou CD
    document.getElementById('logoutBtn').addEventListener('click', () => {
        saveState();
        currentUser = null;
        sessionStorage.removeItem(SESSION_USER_KEY);
        sessionStorage.removeItem(SESSION_CD_KEY);
        document.getElementById('loginForm').reset();
        populateLoginCdSelect();
        document.getElementById('loginErrorMsg').style.display = 'none';
        document.getElementById('loginOverlay').classList.remove('hidden');
        showToast('Sessão encerrada com segurança.', 'primary');
    });

    // Cadastro de Novo CD pelo Master
    const addNewCdBtn = document.getElementById('addNewCdBtn');
    if (addNewCdBtn) {
        addNewCdBtn.addEventListener('click', () => {
            if (!currentUser || (!currentUser.isMaster && currentUser.rolePreset !== 'MASTER')) {
                showToast('Apenas o Usuário Master pode cadastrar novos CDs.', 'error');
                return;
            }
            const inp = document.getElementById('newCdNameInput');
            const name = inp ? inp.value.trim() : '';
            if (!name) {
                showToast('Digite o nome do novo Centro de Distribuição (CD).', 'error');
                return;
            }
            if ((state.cds || []).some((c) => c.name.toLowerCase() === name.toLowerCase())) {
                showToast('Este CD já está cadastrado.', 'error');
                return;
            }
            const newId = 'cd-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-3);
            state.cds.push({ id: newId, name });
            state.cdWorkspaces[newId] = {
                siteName: name,
                activeShift: 'T1 - Manhã',
                products: [],
                movements: [],
                loans: [],
                handovers: [],
                employees: []
            };
            if (inp) inp.value = '';
            populateLoginCdSelect();
            saveState();
            renderAll();
            showToast(`Unidade "${name}" criada com base de dados isolada!`, 'success');
        });
    }

    // Eventos do Modal de Usuários & Permissões (Master)
    const newUserBtn = document.getElementById('newUserBtn');
    if (newUserBtn) newUserBtn.addEventListener('click', openNewUserModal);

    const rolePresetSelect = document.getElementById('usrRolePreset');
    if (rolePresetSelect) {
        rolePresetSelect.addEventListener('change', (e) => applyUserPresetToModal(e.target.value));
    }

    document.getElementById('userForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('usrId').value;
        const username = document.getElementById('usrUsername').value.trim().toLowerCase();
        const password = document.getElementById('usrPassword').value.trim();
        const name = document.getElementById('usrName').value.trim();
        const rolePreset = document.getElementById('usrRolePreset').value;
        const shift = document.getElementById('usrShift').value;
        const status = document.getElementById('usrStatus').value;

        const duplicate = (state.users || []).find(
            (u) => u.username.toLowerCase() === username && u.id !== id
        );
        if (duplicate) {
            showToast(`O login "${username}" já está cadastrado.`, 'error');
            return;
        }

        const isMaster = rolePreset === 'MASTER' || username === 'kelvin';

        const checkedCds = Array.from(document.querySelectorAll('.perm-cd-checkbox:checked')).map(
            (chk) => chk.value
        );
        if (!isMaster && checkedCds.length === 0) {
            showToast('Selecione pelo menos 1 Centro de Distribuição (CD) para este usuário operar.', 'error');
            return;
        }
        const allowedCds = isMaster ? ['ALL'] : checkedCds;

        const tabs = [];
        if (document.getElementById('permTabDashboard').checked) tabs.push('dashboard');
        if (document.getElementById('permTabRh').checked) tabs.push('rh');
        if (document.getElementById('permTabAnalytics').checked) tabs.push('analytics');
        if (document.getElementById('permTabProdutos').checked) tabs.push('produtos');
        if (document.getElementById('permTabMovimentacoes').checked) tabs.push('movimentacoes');
        if (document.getElementById('permTabCautelas').checked) tabs.push('cautelas');
        if (isMaster) {
            tabs.push('handover', 'relatorios', 'usuarios');
        }

        if (tabs.length === 0) {
            showToast('Selecione pelo menos 1 módulo/tela para o usuário acessar.', 'error');
            return;
        }

        const actions = {
            viewFinancials: document.getElementById('permActViewFinancials').checked,
            manageProducts: document.getElementById('permActManageProducts').checked,
            registerMovements: document.getElementById('permActRegisterMovements').checked,
            manageLoans: document.getElementById('permActManageLoans').checked,
            auditStock: document.getElementById('permActAuditStock').checked,
            manageHr: document.getElementById('permActManageHr').checked
        };

        const roleLabels = {
            MASTER: 'Master / Site Leader',
            LIDER: 'Líder de Turno',
            OPERADOR: 'Operador Logístico',
            RH: 'Analista de RH',
            CUSTOM: 'Perfil Personalizado'
        };

        if (id) {
            const existing = state.users.find((u) => u.id === id);
            if (existing) {
                Object.assign(existing, {
                    username,
                    password,
                    name,
                    rolePreset,
                    roleLabel: roleLabels[rolePreset] || 'Personalizado',
                    isMaster,
                    shift,
                    status: username === 'kelvin' ? 'ATIVO' : status,
                    allowedCds,
                    permissions: { tabs, actions }
                });
                if (currentUser && currentUser.id === existing.id) {
                    currentUser = existing;
                }
                showToast(`Permissões e CDs do usuário ${username} atualizados!`, 'success');
            }
        } else {
            state.users.push({
                id: 'usr_' + Date.now(),
                username,
                password,
                name,
                rolePreset,
                roleLabel: roleLabels[rolePreset] || 'Personalizado',
                isMaster,
                shift,
                status,
                allowedCds,
                permissions: { tabs, actions }
            });
            showToast(`Usuário ${username} criado com sucesso!`, 'success');
        }

        saveState();
        renderAll();
        closeModal('userModal');
    });

    const saveSbBtn = document.getElementById('saveSupabaseConfigBtn');
    if (saveSbBtn) {
        saveSbBtn.addEventListener('click', async () => {
            const url = document.getElementById('sbUrlInput').value.trim();
            const anonKey = document.getElementById('sbKeyInput').value.trim();
            if (!url || !anonKey) {
                showToast('Informe a Project URL e a Anon Key do Supabase.', 'error');
                return;
            }
            localStorage.setItem(SB_CONFIG_KEY, JSON.stringify({ url, anonKey }));
            if (initSupabaseClient()) {
                await pushStateToSupabase(true);
            }
        });
    }

    const pullSbBtn = document.getElementById('pullSupabaseBtn');
    if (pullSbBtn) {
        pullSbBtn.addEventListener('click', async () => {
            if (!supabaseClient && !initSupabaseClient()) {
                showToast('Configure a URL e a Anon Key do Supabase primeiro.', 'error');
                return;
            }
            await pullStateFromSupabase(true);
        });
    }

    // Relógio em Tempo Real na Sidebar
    const updateClock = () => {
        const now = new Date();
        const el = document.getElementById('liveClockDisplay');
        if (el) el.textContent = now.toLocaleTimeString('pt-BR');
    };
    updateClock();
    setInterval(updateClock, 1000);

    // Títulos de Abas
    const tabMeta = {
        dashboard: {
            title: 'Visão Macro & Micro do Centro de Distribuição',
            subtitle: 'Consolidação executiva de custos operacionais, folha de RH, turnover, nível de serviço (SLA) e estoque'
        },
        rh: {
            title: 'Controle de RH, Folha de Custos & Turnover do Setor',
            subtitle: 'Gestão completa de colaboradores (CPF, celular, salários, encargos), headcount e rotatividade por turno'
        },
        analytics: {
            title: 'Matriz de Curva ABC (Pareto) & Orçamento CAPEX/OPEX',
            subtitle: 'Classificação financeira dos SKUs e projeção orçamentária para cobertura ideal do CD'
        },
        produtos: {
            title: 'Catálogo de SKUs & Posição Física de Estoque',
            subtitle: 'Gestão de endereçamento logístico, ponto de pedido, classe ABC e saldos por mercadoria'
        },
        movimentacoes: {
            title: 'Kardex Auditável de Movimentações por Turno',
            subtitle: 'Rastreabilidade completa de recebimentos (NF), expedições, baixas por avaria e conciliações'
        },
        cautelas: {
            title: 'Gestão de Cautelas & Ativos Sob Responsabilidade',
            subtitle: 'Controle nominal de coletores, rádios e materiais críticos emprestados à operação'
        },
        handover: {
            title: 'Passagem de Turno (Shift Handover S&OP)',
            subtitle: 'Formalização de entrega de turno com checklist operacional e snapshot automático dos KPIs'
        },
        relatorios: {
            title: 'Central de Dados, Exportação Excel (CSV) & Backup',
            subtitle: 'Extração de relatórios gerenciais (RH, Folha, Estoque, Kardex) e importação em lote'
        },
        usuarios: {
            title: 'Gestão de Usuários, Senhas & Matriz de Permissões (Master)',
            subtitle: 'Controle de acesso ao sistema: habilite ou restrinja telas e funcionalidades para cada operador'
        }
    };

    function switchTab(tabId) {
        if (currentUser && !hasTabPermission(tabId)) {
            showToast('Acesso restrito: seu usuário não tem permissão para acessar este módulo.', 'error');
            return;
        }
        document.querySelectorAll('.nav-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.tab-panel').forEach((panel) => {
            panel.classList.toggle('active', panel.id === `tab-${tabId}`);
        });
        if (tabMeta[tabId]) {
            document.getElementById('pageTitle').textContent = tabMeta[tabId].title;
            document.getElementById('pageSubtitle').textContent = tabMeta[tabId].subtitle;
        }
    }

    document.querySelectorAll('.nav-btn').forEach((btn) => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.querySelectorAll('[data-goto]').forEach((btn) => {
        btn.addEventListener('click', () => switchTab(btn.dataset.goto));
    });

    // Inputs da Unidade e Usuário agora são travados pela sessão de login
    document.getElementById('activeShiftSelect').addEventListener('change', (e) => {
        state.activeShift = e.target.value;
        saveState();
        renderAll();
        showToast(`Turno ativo alterado para ${state.activeShift}`, 'primary');
    });

    // Ações rápidas da Topbar
    document.getElementById('quickNewProductBtn').addEventListener('click', openNewProductModal);
    document.getElementById('quickNewEmployeeBtn').addEventListener('click', openNewEmployeeModal);
    document.getElementById('newEmployeeFromTabBtn').addEventListener('click', openNewEmployeeModal);
    document.getElementById('quickMovementBtn').addEventListener('click', () => openMovementModal(null, 'IN'));
    document.getElementById('newMovementFromTabBtn').addEventListener('click', () => openMovementModal(null, 'IN'));
    document.getElementById('quickLoanBtn').addEventListener('click', openLoanModal);
    document.getElementById('newLoanFromTabBtn').addEventListener('click', openLoanModal);
    document.getElementById('quickAuditBtn').addEventListener('click', openAuditModal);

    // Fechar Modais
    document.querySelectorAll('[data-close]').forEach((btn) => {
        btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) backdrop.classList.remove('open');
        });
    });

    // Máscaras de CPF e Celular + Custo em tempo real no Modal de RH
    document.getElementById('empCpf').addEventListener('input', (e) => {
        e.target.value = formatCpf(e.target.value);
    });
    document.getElementById('empPhone').addEventListener('input', (e) => {
        e.target.value = formatPhone(e.target.value);
    });
    document.getElementById('empStatus').addEventListener('change', toggleDismissFields);
    ['empSalary', 'empBenefits'].forEach((id) => {
        document.getElementById(id).addEventListener('input', updateEmployeeCostPreview);
    });

    // Salvar Colaborador (RH)
    document.getElementById('employeeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('empId').value;
        const code = document.getElementById('empCode').value.trim().toUpperCase();
        const name = document.getElementById('empName').value.trim();
        const cpf = formatCpf(document.getElementById('empCpf').value.trim());
        const phone = formatPhone(document.getElementById('empPhone').value.trim());
        const role = document.getElementById('empRole').value.trim();
        const sector = document.getElementById('empSector').value;
        const shift = document.getElementById('empShift').value;
        const hireDate = document.getElementById('empHireDate').value;
        const salary = Number(document.getElementById('empSalary').value) || 0;
        const benefits = Number(document.getElementById('empBenefits').value) || 0;
        const status = document.getElementById('empStatus').value;
        const dismissDate = status === 'DESLIGADO' ? document.getElementById('empDismissDate').value : '';
        const dismissReason = status === 'DESLIGADO' ? document.getElementById('empDismissReason').value : '';

        const duplicateCode = (state.employees || []).find(
            (emp) => emp.code.toUpperCase() === code && emp.id !== id
        );
        if (duplicateCode) {
            showToast(`A matrícula ${code} já pertence a outro colaborador.`, 'error');
            return;
        }

        if (id) {
            const existing = state.employees.find((emp) => emp.id === id);
            if (existing) {
                Object.assign(existing, {
                    code,
                    name,
                    cpf,
                    phone,
                    role,
                    sector,
                    shift,
                    hireDate,
                    salary,
                    benefits,
                    status,
                    dismissDate,
                    dismissReason
                });
                showToast(`Cadastro de ${name} atualizado no RH!`, 'success');
            }
        } else {
            state.employees.unshift({
                id: 'emp_' + Date.now(),
                code,
                name,
                cpf,
                phone,
                role,
                sector,
                shift,
                hireDate,
                salary,
                benefits,
                status,
                dismissDate,
                dismissReason
            });
            showToast(`Colaborador ${name} cadastrado com sucesso!`, 'success');
        }

        saveState();
        renderAll();
        closeModal('employeeModal');
    });

    // Seleção rápida de colaborador no Modal de Cautela
    document.getElementById('loanEmployeeQuickSelect').addEventListener('change', (e) => {
        const emp = (state.employees || []).find((item) => item.id === e.target.value);
        if (emp) {
            document.getElementById('loanEmployeeName').value = emp.name;
            document.getElementById('loanEmployeeId').value = emp.code;
            document.getElementById('loanDepartment').value = `${emp.sector} - ${emp.shift}`;
        }
    });

    // Salvar Produto
    document.getElementById('productForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('prodId').value;
        const sku = document.getElementById('prodSku').value.trim().toUpperCase();
        const name = document.getElementById('prodName').value.trim();
        const category = document.getElementById('prodCategory').value.trim();
        const location = document.getElementById('prodLocation').value.trim();
        const unit = document.getElementById('prodUnit').value;
        const quantity = Number(document.getElementById('prodQuantity').value) || 0;
        const minStock = Number(document.getElementById('prodMinStock').value) || 0;
        const price = Number(document.getElementById('prodPrice').value) || 0;
        const notes = document.getElementById('prodNotes').value.trim();

        const duplicateSku = state.products.find((p) => p.sku.toUpperCase() === sku && p.id !== id);
        if (duplicateSku) {
            showToast(`Conflito: O código SKU ${sku} já está em uso.`, 'error');
            return;
        }

        if (id) {
            const existing = state.products.find((p) => p.id === id);
            if (existing) {
                const prevQty = Number(existing.quantity) || 0;
                existing.sku = sku;
                existing.name = name;
                existing.category = category;
                existing.location = location;
                existing.unit = unit;
                existing.quantity = quantity;
                existing.minStock = minStock;
                existing.price = price;
                existing.notes = notes;
                existing.updatedAt = new Date().toISOString();

                if (prevQty !== quantity) {
                    state.movements.unshift({
                        id: 'mov_' + Date.now(),
                        date: new Date().toISOString(),
                        type: 'ADJUST',
                        productId: existing.id,
                        sku: existing.sku,
                        productName: existing.name,
                        quantity: Math.abs(quantity - prevQty),
                        unitPrice: price,
                        balanceAfter: quantity,
                        shift: state.activeShift,
                        responsible: `${state.siteLeaderName} (Site Leader)`,
                        reason: `Edição de cadastro (Saldo anterior: ${prevQty})`
                    });
                }
                showToast(`SKU ${sku} atualizado com sucesso!`, 'success');
            }
        } else {
            const newProd = {
                id: 'prod_' + Date.now(),
                sku,
                name,
                category,
                location,
                unit,
                quantity,
                minStock,
                price,
                notes,
                updatedAt: new Date().toISOString()
            };
            state.products.push(newProd);

            if (quantity > 0) {
                state.movements.unshift({
                    id: 'mov_' + Date.now(),
                    date: new Date().toISOString(),
                    type: 'IN',
                    productId: newProd.id,
                    sku: newProd.sku,
                    productName: newProd.name,
                    quantity,
                    unitPrice: price,
                    balanceAfter: quantity,
                    shift: state.activeShift,
                    responsible: `${state.siteLeaderName} (Site Leader)`,
                    reason: 'Implantação de saldo inicial no catálogo'
                });
            }
            showToast(`SKU ${sku} cadastrado com sucesso!`, 'success');
        }

        saveState();
        renderAll();
        closeModal('productModal');
    });

    // Eventos do Modal de Movimentação
    ['movProductSelect', 'movType', 'movQty'].forEach((id) => {
        document.getElementById(id).addEventListener('input', updateMovementStockPreview);
        document.getElementById(id).addEventListener('change', updateMovementStockPreview);
    });

    document.getElementById('movementForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const prodId = document.getElementById('movProductSelect').value;
        const type = document.getElementById('movType').value;
        const qty = Number(document.getElementById('movQty').value) || 0;
        const shift = document.getElementById('movShift').value;
        const responsible = document.getElementById('movResponsible').value.trim();
        const reason = document.getElementById('movReason').value.trim();

        const product = state.products.find((p) => p.id === prodId);
        if (!product) return;

        const current = Number(product.quantity) || 0;
        let newBalance = current;

        if (type === 'IN') {
            newBalance = current + qty;
        } else if (type === 'OUT' || type === 'LOSS') {
            if (qty > current) {
                showToast(
                    `Operação bloqueada: Saldo disponível de ${product.sku} é de apenas ${current} ${product.unit}.`,
                    'error'
                );
                return;
            }
            newBalance = current - qty;
        } else if (type === 'ADJUST') {
            newBalance = qty;
        }

        product.quantity = newBalance;
        product.updatedAt = new Date().toISOString();

        state.movements.unshift({
            id: 'mov_' + Date.now(),
            date: new Date().toISOString(),
            type,
            productId: product.id,
            sku: product.sku,
            productName: product.name,
            quantity: type === 'ADJUST' ? Math.abs(newBalance - current) : qty,
            unitPrice: product.price,
            balanceAfter: newBalance,
            shift,
            responsible,
            reason
        });

        saveState();
        renderAll();
        closeModal('movementModal');
        showToast(`Lançamento Kardex registrado para ${product.sku}!`, 'success');
    });

    // Eventos do Modal de Auditoria Rápida
    document.getElementById('auditProductSelect').addEventListener('change', (e) => {
        const p = state.products.find((item) => item.id === e.target.value);
        if (p) document.getElementById('auditCountedQty').value = p.quantity;
        updateAuditVariancePreview();
    });
    document.getElementById('auditCountedQty').addEventListener('input', updateAuditVariancePreview);

    document.getElementById('auditForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const prodId = document.getElementById('auditProductSelect').value;
        const counted = Number(document.getElementById('auditCountedQty').value) || 0;
        const notes = document.getElementById('auditNotes').value.trim();

        const product = state.products.find((p) => p.id === prodId);
        if (!product) return;

        const prev = Number(product.quantity) || 0;
        const diff = counted - prev;
        product.quantity = counted;
        product.updatedAt = new Date().toISOString();

        state.movements.unshift({
            id: 'mov_' + Date.now(),
            date: new Date().toISOString(),
            type: 'ADJUST',
            productId: product.id,
            sku: product.sku,
            productName: product.name,
            quantity: Math.abs(diff),
            unitPrice: product.price,
            balanceAfter: counted,
            shift: state.activeShift,
            responsible: `${state.siteLeaderName} (Auditoria)`,
            reason: `${notes} (Sistêmico: ${prev} -> Contado: ${counted}, Var: ${diff >= 0 ? '+' + diff : diff})`
        });

        saveState();
        renderAll();
        closeModal('auditModal');
        showToast(`Conciliação de inventário aplicada ao SKU ${product.sku}!`, 'success');
    });

    // Salvar Cautela
    document.getElementById('loanForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const prodId = document.getElementById('loanProductSelect').value;
        const qty = Number(document.getElementById('loanQty').value) || 1;
        const employeeName = document.getElementById('loanEmployeeName').value.trim();
        const employeeId = document.getElementById('loanEmployeeId').value.trim().toUpperCase();
        const department = document.getElementById('loanDepartment').value.trim();
        const dueDate = document.getElementById('loanDueDate').value;
        const notes = document.getElementById('loanNotes').value.trim();

        const product = state.products.find((p) => p.id === prodId);
        if (!product) return;

        if (qty > product.quantity) {
            showToast(`Saldo insuficiente para cautela! Disponível: ${product.quantity}`, 'error');
            return;
        }

        product.quantity -= qty;
        product.updatedAt = new Date().toISOString();

        state.loans.unshift({
            id: 'loan_' + Date.now(),
            productId: product.id,
            sku: product.sku,
            productName: product.name,
            quantity: qty,
            employeeName,
            employeeId,
            department,
            loanDate: new Date().toISOString(),
            dueDate: new Date(dueDate).toISOString(),
            returnedDate: null,
            status: 'ACTIVE',
            notes
        });

        state.movements.unshift({
            id: 'mov_' + Date.now(),
            date: new Date().toISOString(),
            type: 'OUT',
            productId: product.id,
            sku: product.sku,
            productName: product.name,
            quantity: qty,
            unitPrice: product.price,
            balanceAfter: product.quantity,
            shift: state.activeShift,
            responsible: employeeName,
            reason: `Saída por Termo de Cautela (${employeeId} - ${department})`
        });

        saveState();
        renderAll();
        closeModal('loanModal');
        showToast(`Cautela emitida para ${employeeName}!`, 'success');
    });

    // Salvar Passagem de Turno (Shift Handover)
    document.getElementById('handoverForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const fromShift = document.getElementById('hoFromShift').value;
        const toShift = document.getElementById('hoToShift').value;
        const leaderOut = document.getElementById('hoLeaderOut').value.trim();
        const leaderIn = document.getElementById('hoLeaderIn').value.trim();
        const notes = document.getElementById('hoNotes').value.trim();

        const checks = [];
        if (document.getElementById('chkHighValue').checked) checks.push('Gaiola Alto Valor OK');
        if (document.getElementById('chkCollectors').checked) checks.push('Coletores Conferidos');
        if (document.getElementById('chkDocks').checked) checks.push('Docas Abastecidas');
        if (document.getElementById('chkSafety').checked) checks.push('Equipe Conferida');

        const { totalValue } = computeAbcAnalysis();
        const totalSkus = state.products.length;
        const okSkus = state.products.filter((p) => getProductStatus(p).code === 'OK').length;
        const slaPct = totalSkus > 0 ? Math.round((okSkus / totalSkus) * 100) : 100;

        state.handovers.unshift({
            id: 'ho_' + Date.now(),
            date: new Date().toISOString(),
            fromShift,
            toShift,
            leaderOut,
            leaderIn,
            checks,
            notes,
            snapshotSla: `${slaPct}%`,
            snapshotValue: fmtCurrency(totalValue),
            snapshotCriticals: totalSkus - okSkus
        });

        state.activeShift = toShift;
        document.getElementById('hoNotes').value = '';
        saveState();
        renderAll();
        showToast(`Passagem de turno (${fromShift} -> ${toShift}) formalizada!`, 'success');
    });

    // Filtros de Tabelas
    ['rhSearchInput', 'rhSectorFilter', 'rhShiftFilter', 'rhStatusFilter'].forEach((id) => {
        document.getElementById(id).addEventListener('input', renderEmployeesTable);
        document.getElementById(id).addEventListener('change', renderEmployeesTable);
    });

    ['productSearchInput', 'productCategoryFilter', 'productAbcFilter', 'productStatusFilter', 'productSortSelect'].forEach(
        (id) => {
            document.getElementById(id).addEventListener('input', renderProductsTable);
            document.getElementById(id).addEventListener('change', renderProductsTable);
        }
    );

    ['movementSearchInput', 'movementTypeFilter', 'movementShiftFilter'].forEach((id) => {
        document.getElementById(id).addEventListener('input', renderMovementsTable);
        document.getElementById(id).addEventListener('change', renderMovementsTable);
    });

    ['loanSearchInput', 'loanStatusFilter'].forEach((id) => {
        document.getElementById(id).addEventListener('input', renderLoansTable);
        document.getElementById(id).addEventListener('change', renderLoansTable);
    });

    // Impressão Executiva
    document.getElementById('printReportBtn').addEventListener('click', () => window.print());

    // =========================================================================
    // CENTRAL DE RELATÓRIOS EXECUTIVOS (EXCEL .XLS & PDF PARA OS 5 RELATÓRIOS)
    // =========================================================================

    // 1. Quadro de Colaboradores, Salários & Turnover (RH)
    function buildRhReportData() {
        const hr = computeHrMetrics();
        const kpis = [
            { label: 'Efetivo Ativo + Férias', value: `${hr.workforceCount} colaboradores` },
            { label: 'Folha Base Mensal', value: fmtCurrency(hr.basePayroll) },
            { label: 'Encargos & Benefícios', value: fmtCurrency(hr.totalBenefits) },
            { label: 'Custo Total Mensal RH', value: fmtCurrency(hr.totalHrCost) },
            { label: 'Índice de Turnover', value: `${hr.turnoverRate.toFixed(1)}% (${hr.dismissalsCount} deslig.)` }
        ];
        const headers = [
            'Matrícula',
            'Nome Completo',
            'CPF',
            'Celular / WhatsApp',
            'Cargo / Função',
            'Setor do CD',
            'Turno',
            'Admissão',
            'Salário Base (R$)',
            'Encargos/Benef. (R$)',
            'Custo Total (R$)',
            'Status',
            'Desligamento / Motivo'
        ];
        const rows = (state.employees || []).map((e) => [
            e.code,
            e.name,
            e.cpf,
            e.phone,
            e.role,
            e.sector,
            e.shift,
            fmtDate(e.hireDate),
            fmtCurrency(e.salary || 0),
            fmtCurrency(e.benefits || 0),
            fmtCurrency((Number(e.salary) || 0) + (Number(e.benefits) || 0)),
            e.status,
            e.status === 'DESLIGADO'
                ? `${e.dismissDate ? fmtDate(e.dismissDate) : ''} - ${e.dismissReason || ''}`
                : '-'
        ]);
        return { kpis, headers, rows };
    }

    document.getElementById('exportEmployeesCsvBtn').addEventListener('click', () => {
        const { kpis, headers, rows } = buildRhReportData();
        downloadExcelReport('relatorio_rh_salarios_turnover', 'Quadro de Colaboradores, Salários e Turnover (RH)', kpis, headers, rows);
        showToast('Planilha Excel (.XLS) de RH, Salários e Turnover gerada!', 'success');
    });

    document.getElementById('exportEmployeesPdfBtn').addEventListener('click', () => {
        const { kpis, headers, rows } = buildRhReportData();
        openExecutivePdfReport(
            'Relatório de Quadro de Colaboradores, Salários & Turnover (RH)',
            'Demonstrativo analítico da folha de pagamento, encargos, headcount e rotatividade por turno',
            kpis,
            headers,
            rows
        );
    });

    // 2. Posição Completa de Estoque + Curva ABC
    function buildProductsReportData() {
        const { totalValue, ranked, abcMap } = computeAbcAnalysis();
        const totalUnits = state.products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
        const classACount = ranked.filter((r) => r.abcClass === 'A').length;
        const criticalCount = state.products.filter((p) => getProductStatus(p).code !== 'OK').length;

        const kpis = [
            { label: 'Total de SKUs no CD', value: `${state.products.length} SKUs` },
            { label: 'Volume Físico Total', value: `${fmtNumber(totalUnits)} unidades` },
            { label: 'Valor Imobilizado Total', value: fmtCurrency(totalValue) },
            { label: 'Itens Classe A (80% Valor)', value: `${classACount} SKUs` },
            { label: 'SKUs em Alerta / Ruptura', value: `${criticalCount} SKUs` }
        ];
        const headers = [
            'SKU',
            'Mercadoria',
            'Classe ABC',
            'Categoria',
            'Endereço Logístico',
            'Unid.',
            'Saldo Atual',
            'Estoque Mín.',
            'Custo Unit. (R$)',
            'Valor Total (R$)',
            'Status Operacional',
            'Observações'
        ];
        const rows = state.products.map((p) => [
            p.sku,
            p.name,
            `Classe ${abcMap[p.id] || 'C'}`,
            p.category,
            p.location,
            p.unit,
            p.quantity,
            p.minStock,
            fmtCurrency(p.price || 0),
            fmtCurrency((Number(p.quantity) || 0) * (Number(p.price) || 0)),
            getProductStatus(p).label,
            p.notes || ''
        ]);
        return { kpis, headers, rows };
    }

    document.getElementById('exportProductsCsvBtn').addEventListener('click', () => {
        const { kpis, headers, rows } = buildProductsReportData();
        downloadExcelReport('posicao_estoque_curva_abc', 'Posição Completa de Estoque + Curva ABC', kpis, headers, rows);
        showToast('Planilha Excel (.XLS) de Estoque + Curva ABC gerada!', 'success');
    });

    document.getElementById('exportProductsPdfBtn').addEventListener('click', () => {
        const { kpis, headers, rows } = buildProductsReportData();
        openExecutivePdfReport(
            'Posição Completa de Estoque + Matriz de Curva ABC',
            'Inventário valorizado por SKU, endereçamento físico, ponto de pedido e classificação Pareto (80/15/5)',
            kpis,
            headers,
            rows
        );
    });

    // 3. Plano de Compras & Reposição Crítica
    function buildReplenishmentReportData() {
        const { abcMap } = computeAbcAnalysis();
        const criticals = state.products.filter((p) => {
            const code = getProductStatus(p).code;
            return code === 'LOW' || code === 'ZERO';
        });
        let totalBudget = 0;
        let totalUnitsToBuy = 0;

        const headers = [
            'SKU',
            'Mercadoria',
            'Classe ABC',
            'Categoria',
            'Endereço',
            'Status Atual',
            'Saldo Atual',
            'Estoque Mínimo',
            'Compra Sugerida (2x Mín)',
            'Custo Unit. (R$)',
            'Orçamento Estimado (R$)'
        ];
        const rows = criticals.map((p) => {
            const suggested = Math.max((Number(p.minStock) || 10) * 2 - (Number(p.quantity) || 0), 1);
            const estCost = suggested * (Number(p.price) || 0);
            totalBudget += estCost;
            totalUnitsToBuy += suggested;
            return [
                p.sku,
                p.name,
                `Classe ${abcMap[p.id] || 'C'}`,
                p.category,
                p.location,
                getProductStatus(p).label,
                `${p.quantity} ${p.unit}`,
                `${p.minStock} ${p.unit}`,
                `${suggested} ${p.unit}`,
                fmtCurrency(p.price || 0),
                fmtCurrency(estCost)
            ];
        });

        const zeroCount = criticals.filter((p) => getProductStatus(p).code === 'ZERO').length;
        const lowCount = criticals.filter((p) => getProductStatus(p).code === 'LOW').length;
        const kpis = [
            { label: 'SKUs Críticos p/ Compra', value: `${criticals.length} SKUs` },
            { label: 'Em Ruptura Total (Zero)', value: `${zeroCount} SKUs` },
            { label: 'Em Ponto de Pedido', value: `${lowCount} SKUs` },
            { label: 'Volume Total a Comprar', value: `${fmtNumber(totalUnitsToBuy)} unid.` },
            { label: 'Orçamento CAPEX/OPEX', value: fmtCurrency(totalBudget) }
        ];
        return { kpis, headers, rows };
    }

    document.getElementById('exportLowStockCsvBtn').addEventListener('click', () => {
        const { kpis, headers, rows } = buildReplenishmentReportData();
        downloadExcelReport('plano_compras_reposicao', 'Plano de Compras e Reposição Crítica do CD', kpis, headers, rows);
        showToast('Planilha Excel (.XLS) do Plano de Compras e Reposição gerada!', 'success');
    });

    document.getElementById('exportLowStockPdfBtn').addEventListener('click', () => {
        const { kpis, headers, rows } = buildReplenishmentReportData();
        openExecutivePdfReport(
            'Plano de Compras & Reposição Crítica de Estoque (CAPEX / OPEX)',
            'Relação de itens em ruptura ou abaixo do estoque de segurança com orçamento necessário para cobertura 2x',
            kpis,
            headers,
            rows
        );
    });

    // 4. Kardex Completo de Movimentações por Turno
    function buildKardexReportData() {
        const inMovs = state.movements.filter((m) => m.type === 'IN').length;
        const outMovs = state.movements.filter((m) => m.type === 'OUT').length;
        const lossMovs = state.movements.filter((m) => m.type === 'LOSS');
        const lossVal = lossMovs.reduce((acc, m) => {
            const prod = state.products.find((p) => p.id === m.productId);
            const price = m.unitPrice !== undefined ? Number(m.unitPrice) : prod ? Number(prod.price) || 0 : 0;
            return acc + (Number(m.quantity) || 0) * price;
        }, 0);

        const kpis = [
            { label: 'Total de Lançamentos', value: `${state.movements.length} registros` },
            { label: 'Entradas / Recebimentos NF', value: `${inMovs} operações` },
            { label: 'Saídas / Expedições', value: `${outMovs} operações` },
            { label: 'Ocorrências de Avaria/Perda', value: `${lossMovs.length} baixas` },
            { label: 'Custo de Perdas & Avarias', value: fmtCurrency(lossVal) }
        ];
        const headers = [
            'Data / Hora',
            'Natureza da Operação',
            'SKU',
            'Mercadoria',
            'Quantidade',
            'Impacto Fin. (R$)',
            'Saldo Final',
            'Turno',
            'Responsável',
            'Documento / NF / Justificativa'
        ];
        const rows = state.movements.map((m) => {
            const t = getMovementTypeBadge(m.type);
            const prod = state.products.find((p) => p.id === m.productId);
            const unitPrice = m.unitPrice !== undefined ? Number(m.unitPrice) : prod ? Number(prod.price) || 0 : 0;
            const impact = (Number(m.quantity) || 0) * unitPrice;
            return [
                fmtDateTime(m.date),
                t.label,
                m.sku,
                m.productName,
                `${t.sign}${m.quantity}`,
                fmtCurrency(impact),
                m.balanceAfter,
                m.shift,
                m.responsible,
                m.reason
            ];
        });
        return { kpis, headers, rows };
    }

    document.getElementById('exportMovementsCsvBtn').addEventListener('click', () => {
        const { kpis, headers, rows } = buildKardexReportData();
        downloadExcelReport('kardex_completo_movimentacoes', 'Kardex Completo de Movimentações por Turno', kpis, headers, rows);
        showToast('Planilha Excel (.XLS) do Kardex Completo gerada!', 'success');
    });

    document.getElementById('exportMovementsPdfBtn').addEventListener('click', () => {
        const { kpis, headers, rows } = buildKardexReportData();
        openExecutivePdfReport(
            'Kardex Completo & Auditável de Movimentações por Turno',
            'Rastreabilidade integral de entradas (NF), expedições, perdas/avarias e conciliações de inventário',
            kpis,
            headers,
            rows
        );
    });

    // 5. Relatório de Cautelas & Patrimônio
    function buildLoansReportData() {
        const activeLoans = state.loans.filter((l) => l.status !== 'RETURNED');
        const overdueLoans = activeLoans.filter((l) => getLoanComputedStatus(l).code === 'OVERDUE');
        const returnedLoans = state.loans.filter((l) => l.status === 'RETURNED');
        const activeValue = activeLoans.reduce((acc, l) => {
            const prod = state.products.find((p) => p.id === l.productId);
            return acc + (prod ? Number(prod.price) || 0 : 0) * (Number(l.quantity) || 1);
        }, 0);

        const kpis = [
            { label: 'Total Histórico Cautelas', value: `${state.loans.length} termos` },
            { label: 'Ativos em Uso Agora', value: `${activeLoans.length} cautelas` },
            { label: 'Cautelas em Atraso', value: `${overdueLoans.length} alertas` },
            { label: 'Devoluções Concluídas', value: `${returnedLoans.length} baixas` },
            { label: 'Patrimônio em Cautela Ativa', value: fmtCurrency(activeValue) }
        ];
        const headers = [
            'Colaborador Responsável',
            'Matrícula',
            'Setor / Turno',
            'SKU',
            'Ativo / Equipamento',
            'Qtd.',
            'Valor Patr. (R$)',
            'Data/Hora Retirada',
            'Prazo Devolução',
            'Data Devolução',
            'Status',
            'Nº Série / Patrimônio / Obs.'
        ];
        const rows = state.loans.map((l) => {
            const prod = state.products.find((p) => p.id === l.productId);
            const valResp = (prod ? Number(prod.price) || 0 : 0) * (Number(l.quantity) || 1);
            return [
                l.employeeName,
                l.employeeId,
                l.department,
                l.sku,
                l.productName,
                l.quantity,
                fmtCurrency(valResp),
                fmtDateTime(l.loanDate),
                fmtDateTime(l.dueDate),
                l.returnedDate ? fmtDateTime(l.returnedDate) : 'Em aberto',
                getLoanComputedStatus(l).label,
                l.notes || ''
            ];
        });
        return { kpis, headers, rows };
    }

    document.getElementById('exportLoansCsvBtn').addEventListener('click', () => {
        const { kpis, headers, rows } = buildLoansReportData();
        downloadExcelReport('relatorio_cautelas_patrimonio', 'Relatório de Cautelas e Patrimônio Operacional', kpis, headers, rows);
        showToast('Planilha Excel (.XLS) de Cautelas e Patrimônio gerada!', 'success');
    });

    document.getElementById('exportLoansPdfBtn').addEventListener('click', () => {
        const { kpis, headers, rows } = buildLoansReportData();
        openExecutivePdfReport(
            'Relatório Nominal de Cautelas & Controle de Patrimônio',
            'Acompanhamento de equipamentos, coletores, rádios e ativos sob guarda de colaboradores da operação',
            kpis,
            headers,
            rows
        );
    });

    // Planilha Modelo CSV
    document.getElementById('downloadCsvTemplateBtn').addEventListener('click', () => {
        const headers = [
            'SKU',
            'Nome',
            'Categoria',
            'Localizacao',
            'Unidade',
            'Quantidade',
            'EstoqueMinimo',
            'PrecoUnitario'
        ];
        const sampleRows = [
            ['MER-501', 'Fita Adesiva Transparente 48mmx100m', 'Insumos & Embalagens', 'Rua A-03', 'RL', '120', '40', '4,90'],
            ['MER-502', 'Palete PBR Madeira Reforçado', 'Expedição & Logística', 'Doca Externa 02', 'UN', '45', '20', '35,00']
        ];
        downloadCsv('modelo_importacao_custos_estoque.csv', headers, sampleRows);
    });

    // Importação CSV
    document.getElementById('importCsvFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
            if (lines.length < 2) {
                showToast('O arquivo CSV está vazio.', 'error');
                return;
            }

            const sep = lines[0].includes(';') ? ';' : ',';
            let imported = 0;
            let updated = 0;

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
                if (cols.length < 2 || !cols[0] || !cols[1]) continue;

                const sku = cols[0].toUpperCase();
                const name = cols[1];
                const category = cols[2] || 'Mercadorias Gerais';
                const location = cols[3] || 'Geral';
                const unit = cols[4] || 'UN';
                const quantity = Number((cols[5] || '0').replace(',', '.')) || 0;
                const minStock = Number((cols[6] || '10').replace(',', '.')) || 0;
                const price = Number((cols[7] || '0').replace(',', '.')) || 0;

                const existing = state.products.find((p) => p.sku.toUpperCase() === sku);
                if (existing) {
                    existing.name = name;
                    existing.category = category;
                    existing.location = location;
                    existing.unit = unit;
                    existing.quantity = quantity;
                    existing.minStock = minStock;
                    existing.price = price;
                    existing.updatedAt = new Date().toISOString();
                    updated++;
                } else {
                    state.products.push({
                        id: 'imp_' + Date.now() + '_' + i,
                        sku,
                        name,
                        category,
                        location,
                        unit,
                        quantity,
                        minStock,
                        price,
                        notes: 'Importado em lote via CSV',
                        updatedAt: new Date().toISOString()
                    });
                    imported++;
                }
            }

            saveState();
            renderAll();
            e.target.value = '';
            showToast(`Processado: ${imported} novos SKUs e ${updated} atualizados!`, 'success');
        };
        reader.readAsText(file, 'UTF-8');
    });

    // Snapshot JSON
    document.getElementById('exportBackupJsonBtn').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot_custos_estoque_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Snapshot JSON exportado!', 'success');
    });

    document.getElementById('importBackupJsonInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target.result);
                if (!Array.isArray(parsed.products)) throw new Error('JSON inválido');
                state = parsed;
                saveState();
                renderAll();
                showToast('Snapshot restaurado com sucesso!', 'success');
            } catch (err) {
                showToast('Arquivo JSON inválido.', 'error');
            }
            e.target.value = '';
        };
        reader.readAsText(file, 'UTF-8');
    });

    document.getElementById('resetDemoDataBtn').addEventListener('click', () => {
        if (!confirm('Restaurar o cenário demonstrativo completo (Estoque + RH)?')) return;
        state = getInitialDemoData();
        saveState();
        renderAll();
        showToast('Cenário demonstrativo restaurado!', 'success');
    });

    document.getElementById('clearAllDataBtn').addEventListener('click', () => {
        if (!confirm('Atenção: Zerar todos os cadastros de RH, estoque, Kardex, cautelas e passagens de turno?')) return;
        state.products = [];
        state.movements = [];
        state.loans = [];
        state.handovers = [];
        state.employees = [];
        saveState();
        renderAll();
        showToast('Base de dados zerada!', 'success');
    });
});
