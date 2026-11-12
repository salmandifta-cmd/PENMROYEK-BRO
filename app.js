/**
 * ==============================================================================
 * PROYEK: PENMROYEK (Pengendalian dan Monitoring Proyek)
 * FILE: public/app.js
 * DESKRIPSI: 100% Client-Side Engine (Offline & Netlify-Ready via LocalStorage)
 * FITUR:
 * - LocalStorage Persistent Data Layer with Preloaded Project Control Seeds
 * - Dynamic Executive KPI Summary & Real-time Metrics
 * - S-Curve Engine: Math Modeling for Baseline vs Actual + Risk Slippage
 * - Civil Engineering Risk Impact Engine (+7 Hari Critical, +3 Hari High)
 * - Material Management, Labor Requirements, Quality Control (QC), Risk Heatmap 5x5
 * - Waste Management & ISO 14001 Diversion Analytics
 * - In-Browser MS Project XML Parser & Base64 Attachment Storer
 * ==============================================================================
 */

// Global Instances & Cache
let scurveChartInstance = null;
let wasteChartInstance = null;
let bsToastInstance = null;
let cachedSchedules = [];

// ==============================================================================
// 1. DATA LAYER (LOCALSTORAGE ADAPTER)
// ==============================================================================
const STORAGE_KEYS = {
    MATERIALS: 'gmc_materials',
    SCHEDULES: 'gmc_schedules',
    SCURVE: 'gmc_scurve',
    LABOR: 'gmc_labor_requirements',
    ATTENDANCE: 'gmc_attendance',
    QUALITY_CONTROL: 'gmc_quality_control',
    MAINTENANCE: 'gmc_maintenance',
    RISKS: 'gmc_risks',
    WASTE: 'gmc_waste',
    DELIVERIES: 'gmc_material_deliveries',
    EQUIPMENT: 'gmc_heavy_equipment',
    USERS: 'gmc_users',
    AUTH_SESSION: 'gmc_auth_session'
};

// ==============================================================================
// 1.B HAK AKSES PERAN PEKERJA (ROLE-BASED ACCESS CONTROL / RBAC)
// ==============================================================================
const ROLES_CONFIG = {
    admin: {
        id: 'admin',
        name: 'Project Manager / Site Manager',
        badge: 'bg-primary',
        badgeText: 'Project Manager',
        avatarBg: 'bg-primary',
        modules: ['materials', 'schedules', 'labor', 'qc', 'risks', 'waste', 'logistics'],
        desc: 'Akses penuh ke semua modul PENMROYEK'
    },
    material: {
        id: 'material',
        name: 'Petugas Gudang & Material',
        badge: 'bg-success',
        badgeText: 'Logistik Material',
        avatarBg: 'bg-success',
        modules: ['materials'],
        desc: 'Input stok material ramah lingkungan & reorder minimum'
    },
    planner: {
        id: 'planner',
        name: 'Site Engineer & Planner',
        badge: 'bg-info text-dark',
        badgeText: 'Planner / Scheduler',
        avatarBg: 'bg-info text-dark',
        modules: ['schedules'],
        desc: 'Unggah MS Project, distribusi WBS & Kurva S dinamis'
    },
    mandor: {
        id: 'mandor',
        name: 'Mandor Utama / Supervisor Lapangan',
        badge: 'bg-warning text-dark',
        badgeText: 'Mandor / Pelaksana',
        avatarBg: 'bg-warning text-dark',
        modules: ['labor'],
        desc: 'Analisis kebutuhan tenaga kerja (koefisien SNI, volume, target hari)'
    },
    qc: {
        id: 'qc',
        name: 'Quality Control (QC) Inspector',
        badge: 'bg-danger',
        badgeText: 'QC Inspector',
        avatarBg: 'bg-danger',
        modules: ['qc'],
        desc: 'Pencatatan mutu, uji slump/silinder & punch list rework'
    },
    risk: {
        id: 'risk',
        name: 'Petugas HSE & Ahli K3 Konstruksi',
        badge: 'bg-dark',
        badgeText: 'HSE & Risk Officer',
        avatarBg: 'bg-dark',
        modules: ['risks'],
        desc: 'Identifikasi risiko ISO 31000, matriks 5x5, dan mitigasi delay'
    },
    waste: {
        id: 'waste',
        name: 'Petugas Lingkungan & Limbah',
        badge: 'bg-secondary',
        badgeText: 'Waste Officer',
        avatarBg: 'bg-secondary',
        modules: ['waste'],
        desc: 'Pencatatan timbulan limbah proyek, manifest B3 & daur ulang'
    },
    logistics: {
        id: 'logistics',
        name: 'Koordinator Alat Berat & Logistik',
        badge: 'bg-warning text-dark',
        badgeText: 'Koordinator Alat Berat',
        avatarBg: 'bg-warning text-dark',
        modules: ['logistics'],
        desc: 'Jadwal kedatangan material JIT & mobilisasi alat berat/SIA'
    },
    viewer: {
        id: 'viewer',
        name: 'Pekerja Lapangan / Tamu',
        badge: 'bg-light text-dark border',
        badgeText: 'Hanya Lihat',
        avatarBg: 'bg-secondary text-white',
        modules: [],
        desc: 'Akses baca seluruh modul tanpa hak penambahan/perubahan'
    }
};

const DEFAULT_USERS = [
    { id: 1, email: 'admin@proyek.com', password: 'password123', name: 'Ir. Hendra Gunawan', role: 'admin', jabatan: 'Project Manager' },
    { id: 2, email: 'material@proyek.com', password: 'password123', name: 'Bambang Subagyo', role: 'material', jabatan: 'Petugas Gudang & Material' },
    { id: 3, email: 'planner@proyek.com', password: 'password123', name: 'Dian Paramitha, S.T.', role: 'planner', jabatan: 'Site Engineer & Planner' },
    { id: 4, email: 'mandor@proyek.com', password: 'password123', name: 'Pak Trisno (Mandor)', role: 'mandor', jabatan: 'Mandor Utama' },
    { id: 5, email: 'qc@proyek.com', password: 'password123', name: 'Ir. Reza Fahmi', role: 'qc', jabatan: 'Quality Control Engineer' },
    { id: 6, email: 'risk@proyek.com', password: 'password123', name: 'Siti Aminah, S.K.M.', role: 'risk', jabatan: 'Petugas HSE & K3' },
    { id: 7, email: 'waste@proyek.com', password: 'password123', name: 'Agus Purnomo', role: 'waste', jabatan: 'Petugas Lingkungan & Limbah' },
    { id: 8, email: 'alat@proyek.com', password: 'password123', name: 'Rahmat Hidayat', role: 'logistics', jabatan: 'Koordinator Alat Berat' },
    { id: 9, email: 'pekerja@proyek.com', password: 'password123', name: 'Wahyu Ramadhan', role: 'viewer', jabatan: 'Pekerja Lapangan (Tamu)' }
];

const AuthManager = {
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        }

        // Render daftar pekerja untuk portal login dan modal auth
        this.renderQuickWorkers();

        // Periksa apakah sudah ada sesi aktif pekerja
        const sess = this.getSessionUser();
        if (sess) {
            this.showMainDashboard(sess);
        } else {
            this.showLoginView();
        }
    },

    getSessionUser() {
        try {
            const rawSession = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
            if (rawSession) return JSON.parse(rawSession);

            const rawLocal = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
            if (rawLocal) return JSON.parse(rawLocal);

            return null;
        } catch (e) {
            return null;
        }
    },

    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || DEFAULT_USERS;
        } catch (e) {
            return DEFAULT_USERS;
        }
    },

    saveUsers(users) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    },

    getCurrentUser() {
        const sess = this.getSessionUser();
        return sess || DEFAULT_USERS[0];
    },

    showLoginView() {
        const loginView = document.getElementById('appLoginView');
        const mainView = document.getElementById('appMainView');
        if (loginView) loginView.classList.remove('d-none');
        if (mainView) mainView.classList.add('d-none');
        this.renderQuickWorkers();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showMainDashboard(user) {
        const loginView = document.getElementById('appLoginView');
        const mainView = document.getElementById('appMainView');
        if (loginView) loginView.classList.add('d-none');
        if (mainView) mainView.classList.remove('d-none');

        this.applyRbacUi();
        if (typeof loadMaterialsData === 'function') loadMaterialsData();
        if (typeof loadSchedulesData === 'function') loadSchedulesData();
        if (typeof loadLaborData === 'function') loadLaborData();
        if (typeof loadQualityControlData === 'function') loadQualityControlData();
        if (typeof loadRisksData === 'function') loadRisksData();
        if (typeof loadWasteData === 'function') loadWasteData();
        if (typeof loadLogisticsData === 'function') loadLogisticsData();
        if (typeof fetchSummaryStats === 'function') fetchSummaryStats();
    },

    setCurrentUser(user) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(user));
        this.showMainDashboard(user);
    },

    hasWriteAccess(moduleKey) {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (user.role === 'admin') return true;
        const roleConf = ROLES_CONFIG[user.role];
        if (!roleConf || !roleConf.modules) return false;
        return roleConf.modules.includes(moduleKey);
    },

    login(email, password) {
        const users = this.getUsers();
        const found = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
        if (!found) {
            return { success: false, message: 'Email pekerja tidak ditemukan. Silakan periksa kembali atau pilih profil pekerja di tab sebelah.' };
        }
        if (found.password !== password) {
            return { success: false, message: 'Password salah. Password bawaan seluruh akun demo: password123' };
        }
        this.setCurrentUser(found);
        return { success: true, user: found };
    },

    register(data) {
        const users = this.getUsers();
        const exists = users.find(u => u.email.trim().toLowerCase() === data.email.trim().toLowerCase());
        if (exists) {
            return { success: false, message: 'Alamat email tersebut sudah terdaftar sebagai pekerja!' };
        }
        const newUser = {
            id: Date.now(),
            email: data.email.trim().toLowerCase(),
            password: data.password,
            name: data.name.trim(),
            role: data.role,
            jabatan: ROLES_CONFIG[data.role]?.name || 'Pekerja Proyek'
        };
        users.push(newUser);
        this.saveUsers(users);
        this.setCurrentUser(newUser);
        this.renderQuickWorkers();
        return { success: true, user: newUser };
    },

    logout() {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
        this.showLoginView();
        showToast('Anda telah keluar dari sistem. Silakan masuk kembali dengan akun atau pilih peran pekerja.');
    },

    openSwitchTab() {
        openAuthModal('switch');
    },

    renderQuickWorkers() {
        const users = this.getUsers();
        const currentUser = this.getSessionUser();

        // 1. Render Portal Landing Cards (Initial Login Screen)
        const portalContainer = document.getElementById('portalQuickWorkersGrid');
        if (portalContainer) {
            portalContainer.innerHTML = users.map(u => {
                const roleConf = ROLES_CONFIG[u.role] || ROLES_CONFIG.viewer;
                const isCurrent = currentUser && currentUser.email === u.email;
                return `
                    <div class="col-md-6 col-lg-4">
                        <div class="card p-3 h-100 portal-worker-card shadow-sm ${isCurrent ? 'active-worker border-primary' : ''}" onclick="AuthManager.switchDirectly('${u.email}')">
                            <div class="d-flex align-items-start gap-2 mb-2">
                                <div class="rounded-circle ${roleConf.avatarBg} text-white d-flex align-items-center justify-content-center shadow-xs flex-shrink-0" style="width:38px; height:38px; font-size: 0.95rem;">
                                    <i class="bi bi-person-fill"></i>
                                </div>
                                <div class="overflow-hidden">
                                    <div class="fw-bold text-dark text-truncate" style="font-size: 0.88rem;">${escapeHtml(u.name)}</div>
                                    <div class="text-muted text-truncate" style="font-size: 0.72rem;">${escapeHtml(u.email)}</div>
                                    <span class="badge ${roleConf.badge} mt-1" style="font-size: 0.65rem;">${roleConf.badgeText}</span>
                                </div>
                            </div>
                            <p class="text-secondary small mb-3 flex-grow-1" style="font-size: 0.74rem; line-height: 1.4;">
                                ${escapeHtml(roleConf.desc || u.jabatan)}
                            </p>
                            <button type="button" class="btn btn-sm ${isCurrent ? 'btn-success text-white' : 'btn-outline-primary'} w-100 fw-semibold py-1 rounded-pill" style="font-size: 0.75rem;">
                                <i class="bi bi-box-arrow-in-right me-1"></i> Masuk Sebagai ${escapeHtml(roleConf.badgeText)}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 2. Render Modal Grid (In-App Role Switcher)
        const modalContainer = document.getElementById('quickWorkersGrid');
        if (modalContainer) {
            modalContainer.innerHTML = users.map(u => {
                const roleConf = ROLES_CONFIG[u.role] || ROLES_CONFIG.viewer;
                const isCurrent = currentUser && currentUser.email === u.email;
                return `
                    <div class="col-md-6">
                        <div class="card p-2 border ${isCurrent ? 'border-primary bg-primary-subtle shadow-sm' : 'border-light-subtle bg-white'} h-100" style="cursor: pointer; transition: all 0.2s;" onclick="AuthManager.switchDirectly('${u.email}')">
                            <div class="d-flex align-items-center justify-content-between">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="rounded-circle ${roleConf.avatarBg} text-white d-flex align-items-center justify-content-center shadow-xs" style="width:34px; height:34px; font-size: 0.85rem; flex-shrink: 0;">
                                        <i class="bi bi-person-fill"></i>
                                    </div>
                                    <div style="min-width: 0;">
                                        <div class="fw-bold text-dark text-truncate" style="font-size: 0.82rem;">${escapeHtml(u.name)}</div>
                                        <div class="text-muted text-truncate" style="font-size: 0.72rem;">${escapeHtml(u.email)}</div>
                                        <span class="badge ${roleConf.badge} mt-1" style="font-size: 0.65rem;">${roleConf.badgeText}</span>
                                    </div>
                                </div>
                                <div>
                                    ${isCurrent 
                                        ? '<span class="badge bg-primary text-white"><i class="bi bi-check-lg me-1"></i>Aktif</span>'
                                        : '<button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.72rem;">Pilih</button>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    switchDirectly(email) {
        const users = this.getUsers();
        const found = users.find(u => u.email === email);
        if (found) {
            this.setCurrentUser(found);
            showToast(`Berhasil masuk sebagai: ${found.name} (${ROLES_CONFIG[found.role]?.badgeText || found.role})`);
            const modalEl = document.getElementById('modalAuth');
            if (modalEl && window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        }
    },

    applyRbacUi() {
        const user = this.getCurrentUser();
        const roleConf = ROLES_CONFIG[user?.role] || ROLES_CONFIG.viewer;

        // 1. Update Navbar Elements
        const navName = document.getElementById('navUserName');
        const navBadge = document.getElementById('navUserBadge');
        const menuName = document.getElementById('menuUserFullName');
        const menuEmail = document.getElementById('menuUserEmail');
        const menuJab = document.getElementById('menuUserJabatanBadge');
        const menuPerms = document.getElementById('menuUserPermissions');

        if (navName) navName.textContent = user.name;
        if (navBadge) {
            navBadge.textContent = roleConf.badgeText;
            navBadge.className = `badge ${roleConf.badge} border mt-1`;
        }
        if (menuName) menuName.textContent = user.name;
        if (menuEmail) menuEmail.textContent = user.email;
        if (menuJab) {
            menuJab.innerHTML = `<span class="badge ${roleConf.badge} me-1">${roleConf.badgeText}</span> <small class="text-muted">(${user.jabatan || roleConf.name})</small>`;
        }
        if (menuPerms) {
            if (user.role === 'admin') {
                menuPerms.innerHTML = '<span class="text-success fw-bold"><i class="bi bi-check-all me-1"></i>Akses Penuh (Semua 7 Modul)</span>';
            } else if (roleConf.modules.length > 0) {
                const modLabels = roleConf.modules.map(m => {
                    const dict = {
                        materials: '📦 Material',
                        schedules: '📊 Jadwal/Kurva S',
                        labor: '👷 Kebutuhan Tenaga',
                        qc: '🔍 Quality Control',
                        risks: '🛡️ Analisis Risiko',
                        waste: '♻️ Manajemen Limbah',
                        logistics: '🚜 Logistik & Alat Berat'
                    };
                    return dict[m] || m;
                });
                menuPerms.innerHTML = `<div class="text-primary fw-semibold mb-1"><i class="bi bi-pencil-square me-1"></i>Dapat Edit: ${modLabels.join(', ')}</div><div class="text-muted" style="font-size:0.75rem;"><i class="bi bi-eye me-1"></i>Modul lainnya: Hanya Dapat Melihat</div>`;
            } else {
                menuPerms.innerHTML = '<span class="text-secondary"><i class="bi bi-eye-fill me-1"></i>Mode Hanya Lihat (Seluruh Modul)</span>';
            }
        }

        // 2. Terapkan Pembatasan Akses Banner Mode Hanya Lihat
        const modulesList = [
            { key: 'materials', alertId: 'alertRbacMaterials', name: 'Material' },
            { key: 'schedules', alertId: 'alertRbacSchedules', name: 'Progres Jadwal & Kurva S' },
            { key: 'labor', alertId: 'alertRbacLabor', name: 'Kebutuhan Tenaga Kerja' },
            { key: 'qc', alertId: 'alertRbacQc', name: 'Quality Control (QC)' },
            { key: 'risks', alertId: 'alertRbacRisks', name: 'Analisis Risiko' },
            { key: 'waste', alertId: 'alertRbacWaste', name: 'Manajemen Limbah' },
            { key: 'logistics', alertId: 'alertRbacLogistics', name: 'Logistik & Alat Berat' }
        ];

        modulesList.forEach(mod => {
            const canWrite = this.hasWriteAccess(mod.key);
            const alertEl = document.getElementById(mod.alertId);
            if (alertEl) {
                if (canWrite) {
                    alertEl.classList.add('d-none');
                } else {
                    alertEl.classList.remove('d-none');
                    const nameSpan = alertEl.querySelector('.rbac-user-name');
                    const roleSpan = alertEl.querySelector('.rbac-user-role');
                    if (nameSpan) nameSpan.textContent = user.name;
                    if (roleSpan) roleSpan.textContent = roleConf.badgeText;
                }
            }
        });

        // 3. Disable / Enable Input Form & Tombol Tambah
        const btnOpenMat = document.querySelector('[data-bs-target="#modalAddMaterial"]');
        if (btnOpenMat) {
            btnOpenMat.disabled = !this.hasWriteAccess('materials');
            btnOpenMat.title = !this.hasWriteAccess('materials') ? 'Hanya Petugas Material / Admin yang dapat menambah material' : 'Tambah Material Baru';
        }
        const formMat = document.getElementById('formAddMaterial');
        if (formMat) {
            const inputs = formMat.querySelectorAll('input, select, textarea, button[type="submit"]');
            inputs.forEach(el => el.disabled = !this.hasWriteAccess('materials'));
        }

        const btnUploadXml = document.getElementById('btnUploadXml');
        const inputXml = document.getElementById('inputXmlFile');
        if (btnUploadXml) btnUploadXml.disabled = !this.hasWriteAccess('schedules');
        if (inputXml) inputXml.disabled = !this.hasWriteAccess('schedules');

        const formLabor = document.getElementById('formLaborRequirement');
        if (formLabor) {
            const inputs = formLabor.querySelectorAll('input, select, textarea, button[type="submit"]');
            inputs.forEach(el => el.disabled = !this.hasWriteAccess('labor'));
        }

        const formQc = document.getElementById('formAddQualityControl');
        if (formQc) {
            const inputs = formQc.querySelectorAll('input, select, textarea, button[type="submit"]');
            inputs.forEach(el => el.disabled = !this.hasWriteAccess('qc'));
        }

        const formRisk = document.getElementById('formAddRisk');
        if (formRisk) {
            const inputs = formRisk.querySelectorAll('input, select, textarea, button[type="submit"]');
            inputs.forEach(el => el.disabled = !this.hasWriteAccess('risks'));
        }

        const btnOpenWaste = document.querySelector('[data-bs-target="#modalAddWaste"]');
        if (btnOpenWaste) {
            btnOpenWaste.disabled = !this.hasWriteAccess('waste');
        }
        const formWaste = document.getElementById('formAddWaste');
        if (formWaste) {
            const inputs = formWaste.querySelectorAll('input, select, textarea, button[type="submit"]');
            inputs.forEach(el => el.disabled = !this.hasWriteAccess('waste'));
        }

        const btnOpenDeliv = document.querySelector('[data-bs-target="#modalAddDelivery"]');
        const btnOpenEquip = document.querySelector('[data-bs-target="#modalAddEquipment"]');
        if (btnOpenDeliv) btnOpenDeliv.disabled = !this.hasWriteAccess('logistics');
        if (btnOpenEquip) btnOpenEquip.disabled = !this.hasWriteAccess('logistics');

        const formDeliv = document.getElementById('formAddDelivery');
        if (formDeliv) {
            const inputs = formDeliv.querySelectorAll('input, select, textarea, button[type="submit"]');
            inputs.forEach(el => el.disabled = !this.hasWriteAccess('logistics'));
        }
        const formEquip = document.getElementById('formAddEquipment');
        if (formEquip) {
            const inputs = formEquip.querySelectorAll('input, select, textarea, button[type="submit"]');
            inputs.forEach(el => el.disabled = !this.hasWriteAccess('logistics'));
        }
    }
};

function openAuthModal(tab) {
    const modalEl = document.getElementById('modalAuth');
    if (!modalEl || !window.bootstrap) return;
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    if (tab === 'switch') {
        const switchBtn = document.getElementById('tab-quick-btn');
        if (switchBtn) {
            const tabInst = bootstrap.Tab.getOrCreateInstance(switchBtn);
            tabInst.show();
        }
    } else if (tab === 'login') {
        const loginBtn = document.getElementById('tab-login-btn');
        if (loginBtn) {
            const tabInst = bootstrap.Tab.getOrCreateInstance(loginBtn);
            tabInst.show();
        }
    } else if (tab === 'register') {
        const regBtn = document.getElementById('tab-register-btn');
        if (regBtn) {
            const tabInst = bootstrap.Tab.getOrCreateInstance(regBtn);
            tabInst.show();
        }
    }
    modal.show();
}

function togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        btnEl.innerHTML = '<i class="bi bi-eye-slash"></i> Sembunyikan Password';
    } else {
        input.type = 'password';
        btnEl.innerHTML = '<i class="bi bi-eye"></i> Lihat Password';
    }
}

function quickFillAndLogin(email, password) {
    const emailInput = document.getElementById('portalLoginEmail');
    const passInput = document.getElementById('portalLoginPassword');
    if (emailInput) emailInput.value = email;
    if (passInput) passInput.value = password;

    const res = AuthManager.login(email, password);
    if (res.success) {
        showToast(`Selamat datang, ${res.user.name}! Anda masuk sebagai ${ROLES_CONFIG[res.user.role]?.badgeText || res.user.role}.`);
    } else {
        const alertEl = document.getElementById('portalLoginAlert');
        if (alertEl) {
            alertEl.textContent = res.message;
            alertEl.classList.remove('d-none');
        }
    }
}

const DEFAULT_SEEDS = {
    materials: [
        { id: 1, nama_material: 'Semen Ramah Lingkungan (PCC Blended Fly Ash)', satuan: 'Sak', stok_masuk: 1200, stok_keluar: 950, sisa_stok: 250, min_stok: 300, perlu_reorder: 1, updated_at: '2026-11-03 10:00' },
        { id: 2, nama_material: 'Baja Tulangan Daur Ulang BJTS 420B (Ulir 16mm)', satuan: 'Batang', stok_masuk: 850, stok_keluar: 600, sisa_stok: 250, min_stok: 150, perlu_reorder: 0, updated_at: '2026-11-03 10:00' },
        { id: 3, nama_material: 'Porous Paving Block (Permeable Concrete)', satuan: 'M2', stok_masuk: 500, stok_keluar: 480, sisa_stok: 20, min_stok: 50, perlu_reorder: 1, updated_at: '2026-11-03 10:00' },
        { id: 4, nama_material: 'Bambu Petung Terawetkan Struktural', satuan: 'Batang', stok_masuk: 300, stok_keluar: 120, sisa_stok: 180, min_stok: 60, perlu_reorder: 0, updated_at: '2026-11-03 10:00' },
        { id: 5, nama_material: 'Cat Dinding Interior Low-VOC Eco-Shield', satuan: 'Pail', stok_masuk: 80, stok_keluar: 35, sisa_stok: 45, min_stok: 20, perlu_reorder: 0, updated_at: '2026-11-03 10:00' },
        { id: 6, nama_material: 'Solar PV Panel Monocrystalline 550Wp', satuan: 'Unit', stok_masuk: 60, stok_keluar: 10, sisa_stok: 50, min_stok: 15, perlu_reorder: 0, updated_at: '2026-11-03 10:00' }
    ],
    schedules: [
        { id: 1, nama_pekerjaan: 'Pekerjaan Persiapan & Manajemen Limbah Demolisi B3', start_date: '2026-11-01', end_date: '2026-11-14', plan_progress: 100.00, actual_progress: 100.00, bobot: 8.00, status: 'Selesai', delay_days: 0, durasi_hari: 13 },
        { id: 2, nama_pekerjaan: 'Pondasi Bore Pile & Green Concrete Rendah Karbon', start_date: '2026-11-10', end_date: '2026-12-05', plan_progress: 100.00, actual_progress: 95.00, bobot: 18.00, status: 'Sedang Berjalan', delay_days: 0, durasi_hari: 25 },
        { id: 3, nama_pekerjaan: 'Struktur Kolom & Balok Baja Daur Ulang Bertingkat', start_date: '2026-11-25', end_date: '2026-12-30', plan_progress: 65.00, actual_progress: 50.00, bobot: 24.00, status: 'Sedang Berjalan', delay_days: 0, durasi_hari: 35 },
        { id: 4, nama_pekerjaan: 'Dinding Bata Ringan Ramah Lingkungan & Insulasi Termal', start_date: '2026-12-15', end_date: '2027-01-20', plan_progress: 25.00, actual_progress: 15.00, bobot: 16.00, status: 'Sedang Berjalan', delay_days: 0, durasi_hari: 36 },
        { id: 5, nama_pekerjaan: 'Instalasi MEP, Rainwater Harvesting & Solar Rooftop', start_date: '2027-01-05', end_date: '2027-02-15', plan_progress: 0.00, actual_progress: 0.00, bobot: 20.00, status: 'Belum Mulai', delay_days: 0, durasi_hari: 41 },
        { id: 6, nama_pekerjaan: 'Pekerjaan Finishing Green Building & Sertifikasi Greenship', start_date: '2027-02-01', end_date: '2027-02-28', plan_progress: 0.00, actual_progress: 0.00, bobot: 14.00, status: 'Belum Mulai', delay_days: 0, durasi_hari: 27 }
    ],
    labor: [
        { id: 1, nama_pekerjaan: 'Pondasi Bore Pile & Green Concrete Rendah Karbon', volume: 450.00, satuan: 'm³', koef_pekerja: 0.2500, koef_tukang: 0.0500, target_hari: 25, total_oh_pekerja: 112.50, total_oh_tukang: 22.50, total_oh: 135.00, pekerja_per_hari: 5, tukang_per_hari: 1, total_pekerja_hari: 6, catatan: 'Acuan SNI 7394:2008 Beton Ready Mix Rendah Emisi' },
        { id: 2, nama_pekerjaan: 'Struktur Kolom & Balok Baja Daur Ulang Bertingkat', volume: 12000.00, satuan: 'kg', koef_pekerja: 0.0080, koef_tukang: 0.0080, target_hari: 35, total_oh_pekerja: 96.00, total_oh_tukang: 96.00, total_oh: 192.00, pekerja_per_hari: 3, tukang_per_hari: 3, total_pekerja_hari: 6, catatan: 'Erection & Sambungan Baut Mutu Tinggi BJTS 420B' },
        { id: 3, nama_pekerjaan: 'Dinding Bata Ringan Ramah Lingkungan & Insulasi Termal', volume: 900.00, satuan: 'm²', koef_pekerja: 0.1000, koef_tukang: 0.0500, target_hari: 36, total_oh_pekerja: 90.00, total_oh_tukang: 45.00, total_oh: 135.00, pekerja_per_hari: 3, tukang_per_hari: 2, total_pekerja_hari: 5, catatan: 'AAC Block tebal 10cm + Mortar Thinbed Ramah Lingkungan' },
        { id: 4, nama_pekerjaan: 'Instalasi MEP, Rainwater Harvesting & Solar Rooftop', volume: 150.00, satuan: 'titik', koef_pekerja: 0.2000, koef_tukang: 0.3500, target_hari: 41, total_oh_pekerja: 30.00, total_oh_tukang: 52.50, total_oh: 82.50, pekerja_per_hari: 1, tukang_per_hari: 2, total_pekerja_hari: 3, catatan: 'Wiring Inverter Surya PV & Pipa Resapan Biopori' }
    ],
    quality_control: [
        { id: 1, item_pekerjaan: 'Pengecoran Beton Ready Mix Kolom Lantai 2 (Zona A)', kategori: 'Struktur & Pembesian', metode_uji: 'Uji Slump (12±2 cm) & Uji Kuat Tekan Silinder fc\' 30 MPa', standar_acuan: 'SNI 2847:2019 / ASTM C39', tanggal_inspeksi: '2026-11-03', pic: 'Ir. Reza Fahmi (QC Eng.)', urgensi: 'Critical', status: 'Lolos QC / Approved', deskripsi: 'Nilai slump rata-rata 11.5 cm memenuhi toleransi. Benda uji silinder 6 sampel disiapkan untuk uji tekan 7, 14, dan 28 hari.', foto_inspeksi: null },
        { id: 2, item_pekerjaan: 'Pemasangan Tulangan Kolom & Selimut Beton (Rebar Spacing)', kategori: 'Struktur & Pembesian', metode_uji: 'Pemeriksaan Diameter, Jumlah Bar, Overlap Splice & Beton Decking', standar_acuan: 'Gambar DED & SNI 2052:2017', tanggal_inspeksi: '2026-11-04', pic: 'Supardi (Site Inspector)', urgensi: 'High', status: 'Perlu Perbaikan / Punch List', deskripsi: 'Ditemukan 3 titik decking beton pecah pada sisi timur kolom K-04 sehingga jarak selimut beton kurang dari 40 mm. Wajib dipasang kembali sebelum pouring beton.', foto_inspeksi: null },
        { id: 3, item_pekerjaan: 'Pipa Distribusi Air Bersih & Rainwater Harvesting', kategori: 'MEP & Plumbing', metode_uji: 'Hydrostatic Pressure Test (Tekanan Uji 10 Bar selama 2 Jam)', standar_acuan: 'SNI 03-6481-2000 Sistem Plambing', tanggal_inspeksi: '2026-11-05', pic: 'Dedi Suwandi (MEP Inspector)', urgensi: 'Medium', status: 'Lolos QC / Approved', deskripsi: 'Tekanan konstan 10 bar selama 2 jam tanpa ada penurunan jarum manometer. Tidak ada rembesan pada sambungan socket pipa HDPE.', foto_inspeksi: null },
        { id: 4, item_pekerjaan: 'Ketegakan & Plesteran Dinding Bata Ringan Koridor Lt. 1', kategori: 'Arsitektur & Façade', metode_uji: 'Uji Ketegakan Plumb Bob & Waterpass 2 Meter', standar_acuan: 'Toleransi Deviasi Maks 3mm per 2 Meter', tanggal_inspeksi: '2026-11-06', pic: 'Budi Santoso (Site Engineer)', urgensi: 'Low', status: 'Perlu Perbaikan / Punch List', deskripsi: 'Ditemukan deviasi ketegakan 5mm pada sudut barat dinding koridor. Perlu perataan dan acian ulang sebelum pengecatan primer.', foto_inspeksi: null }
    ],
    attendance: [],
    maintenance: [],
    risks: [
        { id: 1, nama_risiko: 'Keterlambatan Pasokan Beton Readymix Rendah Karbon', kategori: 'Waktu & Jadwal (Delay)', probability: 4, impact: 3, score: 12, level: 'High', mitigasi: 'Melakukan dual-sourcing batching plant bersertifikat ramah lingkungan terdekat.', status: 'Open', pekerjaan_id: 2, nama_pekerjaan: 'Pondasi Bore Pile & Green Concrete Rendah Karbon', delay_days: 0 },
        { id: 2, nama_risiko: 'Curah Hujan Ekstrem Mengganggu Pengecoran Kolom', kategori: 'Faktor Cuaca & Alam', probability: 3, impact: 4, score: 12, level: 'High', mitigasi: 'Penyediaan tenda pelindung struktur dan pompa dewatering cadangan.', status: 'Open', pekerjaan_id: 2, nama_pekerjaan: 'Pondasi Bore Pile & Green Concrete Rendah Karbon', delay_days: 0 },
        { id: 3, nama_risiko: 'Keterlambatan Fabrikasi Sambungan Struktur Baja Daur Ulang', kategori: 'Mutu & Kualitas Material', probability: 5, impact: 4, score: 20, level: 'Critical', mitigasi: 'Inspeksi berkala ke workshop vendor dan penambahan shift perakitan erection.', status: 'Open', pekerjaan_id: 3, nama_pekerjaan: 'Struktur Kolom & Balok Baja Daur Ulang Bertingkat', delay_days: 0 }
    ],
    waste: [
        { id: 1, tanggal: '2026-11-02', nama_limbah: 'Limbah Oli Bekas Alat Berat & Excavator', kategori: 'Limbah B3', volume: 120.00, satuan: 'Liter', metode_pengelolaan: 'Diserahkan ke Pihak ke-3 Berizin', vendor_pengolah: 'PT. Wastec International B3', status: 'Selesai Terangkut / Didaur Ulang', keterangan: 'Penyerahan limbah oli hidrolik drum berizin B3 dengan berita acara manifest.', bukti_manifest: null },
        { id: 2, tanggal: '2026-11-03', nama_limbah: 'Sisa Potongan Besi Beton Tulangan (Scrap Rebar)', kategori: 'Limbah Padat Daur Ulang', volume: 450.00, satuan: 'Kg', metode_pengelolaan: 'Recycle', vendor_pengolah: 'PT. Baja Daur Ulang Mandiri', status: 'Selesai Terangkut / Didaur Ulang', keterangan: 'Dijual ke peleburan baja berlisensi daur ulang untuk diolah kembali.', bukti_manifest: null },
        { id: 3, tanggal: '2026-11-04', nama_limbah: 'Puing Beton & Mortar Demolisi Bangunan Lama', kategori: 'Limbah Non-B3 / Demolisi', volume: 12.50, satuan: 'Ton', metode_pengelolaan: 'Reuse', vendor_pengolah: 'Internal Proyek', status: 'Selesai Terangkut / Didaur Ulang', keterangan: 'Dihancurkan (crushed) untuk material urugan lapis pondasi jalan kerja sementara.', bukti_manifest: null },
        { id: 4, tanggal: '2026-11-05', nama_limbah: 'Kemasan Kaleng Cat Kimia & Thinner Low-VOC', kategori: 'Limbah B3', volume: 35.00, satuan: 'Kg', metode_pengelolaan: 'Penampungan TPS Sementara', vendor_pengolah: 'TPS B3 Proyek', status: 'Tersimpan di TPS', keterangan: 'Disimpan di TPS B3 berizin beratap dan berpalet kedap air.', bukti_manifest: null },
        { id: 5, tanggal: '2026-11-06', nama_limbah: 'Potongan Kayu Bekisting Rusak', kategori: 'Limbah Padat Daur Ulang', volume: 280.00, satuan: 'Kg', metode_pengelolaan: 'Reuse', vendor_pengolah: 'Pengrajin Palet Lokal', status: 'Tersimpan di TPS', keterangan: 'Dipilah untuk pembuatan patok ukur bowplank dan diserahkan ke pengrajin.', bukti_manifest: null }
    ],
    deliveries: [
        { id: 1, nama_material: 'Semen Ramah Lingkungan (PCC Blended Fly Ash)', volume: 300, satuan: 'Sak', vendor: 'PT. Semen Nusantara Eco', tanggal: '2026-11-03', jam: '08:30', titik_drop: 'Gudang Transit Sisi Utara', status: 'Tiba & Lolos QC', surat_jalan: null },
        { id: 2, nama_material: 'Baja Tulangan Daur Ulang BJTS 420B (Ulir 16mm)', volume: 250, satuan: 'Batang', vendor: 'PT. Steel Recycle Prima', tanggal: '2026-11-03', jam: '13:00', titik_drop: 'Fabrikasi Pembesian Zona 2', status: 'Dalam Perjalanan', surat_jalan: null },
        { id: 3, nama_material: 'Porous Paving Block (Permeable Concrete)', volume: 150, satuan: 'M2', vendor: 'CV. Paving Hijau Lestari', tanggal: '2026-11-04', jam: '10:00', titik_drop: 'Area Parkir & Landscape', status: 'Dijadwalkan', surat_jalan: null },
        { id: 4, nama_material: 'Solar PV Panel Monocrystalline 550Wp', volume: 20, satuan: 'Unit', vendor: 'PT. Surya Mandiri Energi', tanggal: '2026-11-05', jam: '14:00', titik_drop: 'Gudang Elektrikal Lt. Basement', status: 'Dijadwalkan', surat_jalan: null }
    ],
    equipment: [
        { id: 1, nama_alat: 'Tower Crane Liebherr 280 EC-H', kode_unit: 'TC-01', kategori: 'Tower Crane', operator: 'Joko Susilo', vendor: 'PT. Alat Konstruksi Prima', tgl_masuk: '2026-11-01', tgl_keluar: '2027-01-31', status_sia: 'SIA Aktif & Terverifikasi', status: 'Beroperasi di Proyek' },
        { id: 2, nama_alat: 'Excavator Komatsu PC200 Bio-Diesel', kode_unit: 'EX-02', kategori: 'Excavator & Backhoe', operator: 'Bambang Irawan', vendor: 'CV. Bumi Makmur Rental', tgl_masuk: '2026-11-05', tgl_keluar: '2026-11-25', status_sia: 'SIA Aktif & Terverifikasi', status: 'Beroperasi di Proyek' },
        { id: 3, nama_alat: 'Concrete Pump Truck Putzmeister 36m', kode_unit: 'CP-05', kategori: 'Concrete Pump', operator: 'Hendra Gunawan', vendor: 'PT. Adhi Readymix Equipment', tgl_masuk: '2026-11-12', tgl_keluar: '2026-11-14', status_sia: 'SIA Aktif & Terverifikasi', status: 'Dijadwalkan Mobilisasi' }
    ]
};

const DataStore = {
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
            localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(DEFAULT_SEEDS.materials));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
            localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(DEFAULT_SEEDS.schedules));
        }
        if (!localStorage.getItem(STORAGE_KEYS.LABOR)) {
            localStorage.setItem(STORAGE_KEYS.LABOR, JSON.stringify(DEFAULT_SEEDS.labor));
        }
        if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
            localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(DEFAULT_SEEDS.attendance));
        }
        if (!localStorage.getItem(STORAGE_KEYS.QUALITY_CONTROL)) {
            localStorage.setItem(STORAGE_KEYS.QUALITY_CONTROL, JSON.stringify(DEFAULT_SEEDS.quality_control));
        }
        if (!localStorage.getItem(STORAGE_KEYS.MAINTENANCE)) {
            localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(DEFAULT_SEEDS.maintenance));
        }
        if (!localStorage.getItem(STORAGE_KEYS.RISKS)) {
            localStorage.setItem(STORAGE_KEYS.RISKS, JSON.stringify(DEFAULT_SEEDS.risks));
        }
        if (!localStorage.getItem(STORAGE_KEYS.WASTE)) {
            localStorage.setItem(STORAGE_KEYS.WASTE, JSON.stringify(DEFAULT_SEEDS.waste));
        }
        if (!localStorage.getItem(STORAGE_KEYS.DELIVERIES)) {
            localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(DEFAULT_SEEDS.deliveries));
        }
        if (!localStorage.getItem(STORAGE_KEYS.EQUIPMENT)) {
            localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(DEFAULT_SEEDS.equipment));
        }
        this.recalculateSCurve();
    },

    get(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (e) {
            return [];
        }
    },

    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('LocalStorage quota warning:', e);
            if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
                try {
                    // Jika memori browser penuh, pangkas string base64 gambar lama agar data tetap tersimpan
                    const stripped = Array.isArray(data) ? data.map(item => {
                        const copy = { ...item };
                        if (copy.bukti_manifest && copy.bukti_manifest.length > 500) copy.bukti_manifest = null;
                        if (copy.foto_temuan && copy.foto_temuan.length > 500) copy.foto_temuan = null;
                        if (copy.surat_jalan && copy.surat_jalan.length > 500) copy.surat_jalan = null;
                        return copy;
                    }) : data;
                    localStorage.setItem(key, JSON.stringify(stripped));
                    if (typeof showToast === 'function') {
                        showToast('Catatan berhasil disimpan (Foto tidak disertakan karena kapasitas penyimpanan browser penuh).');
                    }
                    return;
                } catch (e2) {
                    console.error('LocalStorage critical storage error:', e2);
                }
            }
            if (typeof showToast === 'function') {
                showToast('Gagal menyimpan ke penyimpanan browser: Memori penuh.', true);
            }
        }
    },

    recalculateSCurve() {
        const tasks = this.get(STORAGE_KEYS.SCHEDULES);
        if (!tasks || tasks.length === 0) {
            this.set(STORAGE_KEYS.SCURVE, []);
            return [];
        }

        let minStart = new Date(tasks[0].start_date);
        let maxEnd = new Date(tasks[0].end_date);

        tasks.forEach(t => {
            const s = new Date(t.start_date);
            const e = new Date(t.end_date);
            if (s < minStart) minStart = s;
            if (e > maxEnd) maxEnd = e;
        });

        const totalDurationDays = Math.max(1, Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)));
        const totalWeeks = Math.max(4, Math.ceil(totalDurationDays / 7));

        let totalWeightGiven = tasks.reduce((sum, t) => sum + (parseFloat(t.bobot) || 0), 0);
        const normalizedTasks = tasks.map(t => {
            const taskDur = Math.max(1, Math.ceil((new Date(t.end_date) - new Date(t.start_date)) / (1000 * 60 * 60 * 24)));
            let weight = parseFloat(t.bobot) || 0;
            if (totalWeightGiven <= 0) {
                weight = (taskDur / totalDurationDays) * 100;
            } else {
                weight = (weight / totalWeightGiven) * 100;
            }
            return {
                ...t,
                weight: weight,
                taskDuration: taskDur,
                sDate: new Date(t.start_date),
                eDate: new Date(t.end_date)
            };
        });

        const weeklyData = [];
        for (let w = 1; w <= totalWeeks; w++) {
            const weekEndDate = new Date(minStart.getTime() + w * 7 * 24 * 60 * 60 * 1000);
            let weekPlannedProgress = 0;
            let weekActualProgress = 0;

            normalizedTasks.forEach(task => {
                let planRatio = 0;
                if (weekEndDate >= task.eDate) {
                    planRatio = 1.0;
                } else if (weekEndDate <= task.sDate) {
                    planRatio = 0.0;
                } else {
                    const elapsed = (weekEndDate - task.sDate) / (1000 * 60 * 60 * 24);
                    planRatio = Math.min(1.0, elapsed / task.taskDuration);
                }

                let actualRatio = 0;
                const reportedActual = (parseFloat(task.actual_progress) || 0) / 100;
                if (weekEndDate >= task.eDate) {
                    actualRatio = reportedActual;
                } else if (weekEndDate <= task.sDate) {
                    actualRatio = 0.0;
                } else {
                    const elapsed = (weekEndDate - task.sDate) / (1000 * 60 * 60 * 24);
                    const linearRatio = Math.min(1.0, elapsed / task.taskDuration);
                    actualRatio = Math.min(reportedActual, linearRatio * reportedActual);
                }

                weekPlannedProgress += task.weight * planRatio;
                weekActualProgress += task.weight * actualRatio;
            });

            const planKum = Math.min(100, Math.round(weekPlannedProgress * 100) / 100);
            const actKum = Math.min(100, Math.round(weekActualProgress * 100) / 100);

            weeklyData.push({
                id: w,
                periode: `Minggu ${w}`,
                plan_kumulatif: planKum,
                actual_kumulatif: actKum
            });
        }

        this.set(STORAGE_KEYS.SCURVE, weeklyData);
        return weeklyData;
    }
};

// ==============================================================================
// 2. INISIALISASI APLIKASI
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi DataStore Offline
    DataStore.init();

    // Inisialisasi Autentikasi & Hak Akses Pekerja (RBAC)
    AuthManager.init();

    // Inisialisasi Toast
    const toastEl = document.getElementById('liveToast');
    if (toastEl && window.bootstrap) {
        bsToastInstance = new bootstrap.Toast(toastEl, { delay: 4500 });
    }

    // Tanggal Hari Ini Default
    const todayStr = new Date().toISOString().split('T')[0];
    const attTanggal = document.getElementById('attTanggal');
    if (attTanggal) attTanggal.value = todayStr;

    const qcTanggal = document.getElementById('qcTanggal');
    if (qcTanggal) qcTanggal.value = todayStr;

    const maintTanggal = document.getElementById('maintTanggal');
    if (maintTanggal) maintTanggal.value = todayStr;

    const wasteTanggal = document.getElementById('wasteTanggal');
    if (wasteTanggal) wasteTanggal.value = todayStr;

    const delivTanggal = document.getElementById('delivTanggal');
    if (delivTanggal) delivTanggal.value = todayStr;

    const equipTglMasuk = document.getElementById('equipTglMasuk');
    if (equipTglMasuk) equipTglMasuk.value = todayStr;

    const equipTglKeluar = document.getElementById('equipTglKeluar');
    if (equipTglKeluar) {
        const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        equipTglKeluar.value = nextMonth;
    }

    // Load Data Seluruh Modul
    checkDatabaseStatus();
    fetchSummaryStats();
    loadMaterialsData();
    loadSchedulesData();
    loadSCurveData();
    loadLaborData();
    loadQualityControlData();
    loadRisksData();
    loadRiskMatrix();
    loadWasteData();
    loadWasteStats();
    loadLogisticsData();
    populateWbsDropdown();
    updateRiskScorePreview();

    // Listener Tab S-Curve & Waste Chart Resize
    const tabScurveBtn = document.getElementById('tab-scurve-btn');
    if (tabScurveBtn) {
        tabScurveBtn.addEventListener('shown.bs.tab', () => {
            if (scurveChartInstance) scurveChartInstance.resize();
        });
    }

    const tabWasteBtn = document.getElementById('tab-waste-btn');
    if (tabWasteBtn) {
        tabWasteBtn.addEventListener('shown.bs.tab', () => {
            if (wasteChartInstance) wasteChartInstance.resize();
        });
    }

    // Registrasi Event Form
    initFormHandlers();
});

// ==============================================================================
// UTILITY HELPERS
// ==============================================================================
function checkDatabaseStatus() {
    const banner = document.getElementById('dbAlertBanner');
    if (banner) {
        // Pada Netlify / Offline Mode, hilangkan alert banner database terputus
        banner.classList.add('d-none');
    }
}

function showToast(message, isError = false) {
    const toastEl = document.getElementById('liveToast');
    const toastMsg = document.getElementById('toastMessage');
    if (!toastEl || !toastMsg) return;

    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-dark');
    toastEl.classList.add(isError ? 'bg-danger' : 'bg-success');
    toastMsg.innerHTML = message;

    if (bsToastInstance) {
        bsToastInstance.show();
    }
}

function formatRupiah(number) {
    const num = parseFloat(number) || 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(num);
}

function viewImage(imgUrl, title = 'Bukti Foto') {
    const modalImg = document.getElementById('modalImageSrc');
    const modalTitle = document.getElementById('modalImageTitle');
    if (modalImg && modalTitle) {
        modalImg.src = imgUrl;
        modalTitle.textContent = title;
        const modalEl = document.getElementById('modalImageViewer');
        if (modalEl && window.bootstrap) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve) => {
        if (!file) return resolve(null);
        if (!file.type || !file.type.startsWith('image/')) {
            if (file.size > 800 * 1024) {
                return resolve(null);
            }
            return fileToBase64(file).then(resolve).catch(() => resolve(null));
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = () => resolve(null);
            img.src = event.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

// ==============================================================================
// 3. EXECUTIVE KPI SUMMARY
// ==============================================================================
function fetchSummaryStats() {
    const materials = DataStore.get(STORAGE_KEYS.MATERIALS) || [];
    const schedules = DataStore.get(STORAGE_KEYS.SCHEDULES) || [];
    const laborList = DataStore.get(STORAGE_KEYS.LABOR) || [];
    const qcList = DataStore.get(STORAGE_KEYS.QUALITY_CONTROL) || [];
    const risks = DataStore.get(STORAGE_KEYS.RISKS) || [];

    const lowStock = materials.filter(m => {
        const sisa = (parseFloat(m.stok_masuk) || 0) - (parseFloat(m.stok_keluar) || 0);
        return sisa <= (parseFloat(m.min_stok) || 0);
    }).length;

    // Hitung Kebutuhan Tenaga Kerja Harian (Pekerja + Tukang)
    const sumTotalTenagaPerHari = laborList.reduce((acc, l) => acc + (parseInt(l.total_pekerja_hari) || 0), 0);
    const sumTukangPerHari = laborList.reduce((acc, l) => acc + (parseInt(l.tukang_per_hari) || 0), 0);
    const sumPekerjaPerHari = laborList.reduce((acc, l) => acc + (parseInt(l.pekerja_per_hari) || 0), 0);

    // Hitung Temuan QC / Punch List yang belum Approved
    const activeQc = qcList.filter(q => q.status === 'Perlu Perbaikan / Punch List' || q.status === 'Ditolak / Rejected' || q.status === 'Menunggu Uji Lab').length;
    const critRisks = risks.filter(r => r.level === 'Critical' && r.status === 'Open').length;

    const totalProg = schedules.reduce((acc, s) => acc + (parseFloat(s.actual_progress) || 0), 0);
    const avgProg = schedules.length > 0 ? (totalProg / schedules.length).toFixed(1) : 0;

    const elAvg = document.getElementById('kpiAvgProgress');
    const elLow = document.getElementById('kpiLowStock');
    const elWorkNeeded = document.getElementById('kpiWorkersNeeded');
    const elWorkDetail = document.getElementById('kpiWorkersDetail');
    const elWork = document.getElementById('kpiWorkersPresent');
    const elQc = document.getElementById('kpiActiveQc');
    const elMaint = document.getElementById('kpiActiveMaint');
    const elCrit = document.getElementById('kpiCritRisks');

    if (elAvg) elAvg.textContent = `${avgProg}%`;
    if (elLow) elLow.textContent = `${lowStock} Item`;
    if (elWorkNeeded) elWorkNeeded.textContent = `${sumTotalTenagaPerHari} Org/Hari`;
    if (elWorkDetail) elWorkDetail.textContent = `${sumTukangPerHari} Tukang + ${sumPekerjaPerHari} Pekerja`;
    if (elWork) elWork.textContent = `${sumTotalTenagaPerHari} Org`;
    if (elQc) elQc.textContent = `${activeQc} Item`;
    if (elMaint) elMaint.textContent = `${activeQc} Item`;
    if (elCrit) elCrit.textContent = `${critRisks} Isu`;
}

// ==============================================================================
// 4. MODUL: KONTROL MATERIAL
// ==============================================================================
function loadMaterialsData() {
    const materials = DataStore.get(STORAGE_KEYS.MATERIALS);
    const tbody = document.getElementById('tbodyMaterials');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!materials || materials.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">Belum ada data material. Silakan klik "Tambah Material Baru".</td></tr>`;
        return;
    }

    materials.forEach((m, idx) => {
        const masuk = parseFloat(m.stok_masuk) || 0;
        const keluar = parseFloat(m.stok_keluar) || 0;
        const sisa = masuk - keluar;
        const min = parseFloat(m.min_stok) || 0;
        const isLow = sisa <= min;

        const statusBadge = isLow
            ? `<span class="badge badge-pulse-danger px-2 py-1"><i class="bi bi-exclamation-triangle-fill me-1"></i>REORDER SEGERA</span>`
            : `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i>Aman</span>`;

        const canWrite = AuthManager.hasWriteAccess('materials');
        const actionsHtml = canWrite
            ? `<button class="btn btn-sm btn-outline-primary me-1" onclick="openEditMaterialModal(${m.id})" title="Edit Material">
                   <i class="bi bi-pencil"></i>
               </button>
               <button class="btn btn-sm btn-outline-danger" onclick="deleteMaterial(${m.id})" title="Hapus Material">
                   <i class="bi bi-trash"></i>
               </button>`
            : `<span class="badge bg-light text-muted border py-1 px-2" title="Hanya Petugas Material / Admin yang berhak"><i class="bi bi-lock-fill me-1"></i>Hanya Lihat</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-muted small">${idx + 1}</td>
            <td class="fw-semibold text-dark">${escapeHtml(m.nama_material)}</td>
            <td><span class="badge bg-light text-dark border">${escapeHtml(m.satuan)}</span></td>
            <td class="text-success fw-bold">${masuk.toLocaleString('id-ID')}</td>
            <td class="text-danger fw-bold">${keluar.toLocaleString('id-ID')}</td>
            <td class="fw-bold ${isLow ? 'text-danger' : 'text-primary'}">${sisa.toLocaleString('id-ID')}</td>
            <td class="text-muted">${min.toLocaleString('id-ID')}</td>
            <td>${statusBadge}</td>
            <td class="text-center">
                ${actionsHtml}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openEditMaterialModal(id) {
    if (!AuthManager.hasWriteAccess('materials')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Material.', true);
        return;
    }
    const materials = DataStore.get(STORAGE_KEYS.MATERIALS);
    const mat = materials.find(m => m.id == id);
    if (!mat) return;

    document.getElementById('modalMaterialTitle').textContent = 'Edit Data Material';
    document.getElementById('matId').value = mat.id;
    document.getElementById('matNama').value = mat.nama_material;
    document.getElementById('matSatuan').value = mat.satuan;
    document.getElementById('matMasuk').value = mat.stok_masuk;
    document.getElementById('matKeluar').value = mat.stok_keluar;
    document.getElementById('matMin').value = mat.min_stok;

    const modalEl = document.getElementById('modalAddMaterial');
    if (modalEl && window.bootstrap) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

function deleteMaterial(id) {
    if (!AuthManager.hasWriteAccess('materials')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Material.', true);
        return;
    }
    if (!confirm('Apakah Anda yakin ingin menghapus data material ini?')) return;
    let materials = DataStore.get(STORAGE_KEYS.MATERIALS);
    materials = materials.filter(m => m.id != id);
    DataStore.set(STORAGE_KEYS.MATERIALS, materials);

    showToast('Material berhasil dihapus!');
    loadMaterialsData();
    fetchSummaryStats();
}

// ==============================================================================
// 5. MODUL: JADWAL WBS & KURVA S (CHART.JS)
// ==============================================================================
function loadSCurveData() {
    const scurve = DataStore.recalculateSCurve();
    const wrapper = document.getElementById('scurveCanvasWrapper');
    const placeholder = document.getElementById('scurvePlaceholder');

    if (!scurve || scurve.length === 0) {
        if (wrapper) wrapper.classList.add('d-none');
        if (placeholder) placeholder.classList.remove('d-none');
        return;
    }

    if (wrapper) wrapper.classList.remove('d-none');
    if (placeholder) placeholder.classList.add('d-none');

    const labels = scurve.map(d => d.periode);
    const planData = scurve.map(d => parseFloat(d.plan_kumulatif) || 0);
    const actualData = scurve.map(d => parseFloat(d.actual_kumulatif) || 0);

    const ctx = document.getElementById('scurveChart');
    if (!ctx) return;

    if (scurveChartInstance) {
        scurveChartInstance.destroy();
    }

    scurveChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Kurva S Rencana Baseline (%)',
                    data: planData,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    borderWidth: 2.5,
                    borderDash: [6, 4],
                    fill: false,
                    tension: 0.35,
                    pointBackgroundColor: '#2563eb',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Kurva S Realisasi Lapangan (%)',
                    data: actualData,
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.15)',
                    borderWidth: 3.5,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#059669',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { size: 12, weight: 'bold' }, usePointStyle: true, padding: 20 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ` ${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                        },
                        afterBody: function (context) {
                            if (context.length >= 2) {
                                const plan = context[0].parsed.y;
                                const act = context[1].parsed.y;
                                const dev = act - plan;
                                const devStatus = dev >= 0
                                    ? `+${dev.toFixed(2)}% (Ahead of Schedule)`
                                    : `${dev.toFixed(2)}% (Slippage / Terlambat)`;
                                return `-------------------\nDeviasi Kumulatif: ${devStatus}`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Progres Kumulatif (%)', font: { weight: 'bold' } },
                    ticks: { callback: value => `${value}%` },
                    grid: { color: '#e2e8f0' }
                },
                x: { grid: { color: '#f1f5f9' } }
            }
        }
    });
}

function loadSchedulesData() {
    const schedules = DataStore.get(STORAGE_KEYS.SCHEDULES);
    cachedSchedules = schedules;
    const tbody = document.getElementById('tbodySchedules');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!schedules || schedules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Belum ada item WBS. Unggah file MS Project atau klik "Muat Template".</td></tr>`;
        return;
    }

    schedules.forEach(s => {
        const plan = parseFloat(s.plan_progress) || 0;
        const actual = parseFloat(s.actual_progress) || 0;
        const delayDays = parseInt(s.delay_days) || 0;

        let statusBadge = '';
        if (s.status === 'Selesai' || actual >= 100) {
            statusBadge = '<span class="badge bg-success">Selesai</span>';
        } else if (s.status === 'Terlambat' || (actual < plan && actual > 0)) {
            statusBadge = '<span class="badge bg-danger">Terlambat</span>';
        } else if (actual > 0) {
            statusBadge = '<span class="badge bg-primary">Sedang Berjalan</span>';
        } else {
            statusBadge = '<span class="badge bg-secondary">Belum Mulai</span>';
        }

        const delayBadge = delayDays > 0
            ? `<span class="badge badge-delay ms-1" title="Dampak Risiko Real-time">+${delayDays} Hari Delay</span>`
            : '';

        const progressColor = actual >= 100 ? 'bg-success' : (actual < plan ? 'bg-danger' : 'bg-primary');
        const progressHtml = `
            <div class="d-flex align-items-center gap-2" style="min-width: 120px;">
                <div class="progress flex-grow-1" style="height: 8px;">
                    <div class="progress-bar ${progressColor}" role="progressbar" style="width: ${Math.min(100, actual)}%"></div>
                </div>
                <span class="small fw-bold ${actual < plan ? 'text-danger' : 'text-success'}">${actual.toFixed(1)}%</span>
            </div>
        `;

        const canWrite = AuthManager.hasWriteAccess('schedules');
        const actionsHtml = canWrite
            ? `<button class="btn btn-sm btn-primary px-2 py-1 shadow-sm" onclick="openUpdateProgressModal(${s.id})" title="Input progres realisasi lapangan">
                   <i class="bi bi-speedometer2 me-1"></i> Update Progres
               </button>`
            : `<span class="badge bg-light text-muted border py-1 px-2" title="Hanya Planner / Site Engineer yang berhak"><i class="bi bi-lock-fill me-1"></i>Hanya Lihat</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-semibold text-dark">${escapeHtml(s.nama_pekerjaan)}</td>
            <td class="small text-muted">${s.start_date}</td>
            <td class="small fw-bold text-dark">${s.end_date} ${delayBadge}</td>
            <td class="text-center fw-bold text-secondary">${parseFloat(s.bobot || 0).toFixed(1)}%</td>
            <td class="text-center text-muted">${plan.toFixed(1)}%</td>
            <td>${progressHtml}</td>
            <td>${statusBadge}</td>
            <td class="text-center">
                ${actionsHtml}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openUpdateProgressModal(wbsId) {
    if (!AuthManager.hasWriteAccess('schedules')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Jadwal & Kurva S.', true);
        return;
    }
    const task = cachedSchedules.find(s => s.id == wbsId);
    if (!task) return;

    document.getElementById('progWbsId').value = task.id;
    document.getElementById('progWbsNama').textContent = task.nama_pekerjaan;
    document.getElementById('progWbsDates').textContent = `${task.start_date} s/d ${task.end_date}`;
    document.getElementById('progWbsBobot').textContent = `${parseFloat(task.bobot || 0).toFixed(2)}%`;
    document.getElementById('progWbsPlan').textContent = `${parseFloat(task.plan_progress || 0).toFixed(2)}%`;

    const actual = parseFloat(task.actual_progress) || 0;
    document.getElementById('progRangeSlider').value = actual;
    document.getElementById('progInputNumber').value = actual;
    document.getElementById('progValDisplay').textContent = `${actual.toFixed(2)}%`;
    document.getElementById('progNotes').value = '';

    const statusBadge = document.getElementById('progWbsCurrentStatusBadge');
    if (statusBadge) {
        statusBadge.textContent = task.status;
        statusBadge.className = 'badge ' + (task.status === 'Selesai' ? 'bg-success' : (task.status === 'Terlambat' ? 'bg-danger' : 'bg-primary'));
    }

    updateDeviationDisplay(actual, parseFloat(task.plan_progress) || 0);

    const modalEl = document.getElementById('modalUpdateProgress');
    if (modalEl && window.bootstrap) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

function setQuickProgress(val) {
    const numInput = document.getElementById('progInputNumber');
    const slider = document.getElementById('progRangeSlider');
    const display = document.getElementById('progValDisplay');
    const plan = parseFloat(document.getElementById('progWbsPlan').textContent) || 0;

    if (numInput && slider && display) {
        numInput.value = val;
        slider.value = val;
        display.textContent = `${parseFloat(val).toFixed(2)}%`;
        updateDeviationDisplay(val, plan);
    }
}

function adjustQuickProgress(delta) {
    const numInput = document.getElementById('progInputNumber');
    if (!numInput) return;
    let cur = parseFloat(numInput.value) || 0;
    cur = Math.min(100, Math.max(0, cur + delta));
    setQuickProgress(cur);
}

function updateDeviationDisplay(actual, plan) {
    const dev = actual - plan;
    const devBox = document.getElementById('progDeviationBox');
    const devText = document.getElementById('progDeviasiText');
    if (!devBox || !devText) return;

    if (dev >= 0) {
        devBox.className = 'p-2 rounded border border-success-subtle bg-success-subtle mb-3';
        devText.className = 'fw-bold text-success';
        devText.textContent = `+${dev.toFixed(2)}% (Sesuai / Melampaui Target Baseline)`;
    } else {
        devBox.className = 'p-2 rounded border border-danger-subtle bg-danger-subtle mb-3';
        devText.className = 'fw-bold text-danger';
        devText.textContent = `${dev.toFixed(2)}% (Terjadi Deviasi Keterlambatan Fisik)`;
    }
}

function loadDemoProject() {
    DataStore.set(STORAGE_KEYS.SCHEDULES, DEFAULT_SEEDS.schedules);
    DataStore.set(STORAGE_KEYS.RISKS, DEFAULT_SEEDS.risks);
    DataStore.recalculateSCurve();

    showToast('Berhasil memuat contoh template proyek Green Building!');
    loadSchedulesData();
    loadSCurveData();
    populateWbsDropdown();
    loadRisksData();
    loadRiskMatrix();
    fetchSummaryStats();
}

// ==============================================================================
// 6. MODUL: KEBUTUHAN TENAGA KERJA (ANALISIS KOEFISIEN, VOLUME & TARGET HARI)
// ==============================================================================
const AHSP_PRESETS = {
    preset_beton: {
        nama: 'Pengecoran Beton Ready Mix Rendah Emisi (Green Concrete)',
        satuan: 'm³',
        koef_pekerja: 0.2500,
        koef_tukang: 0.0500,
        catatan: 'AHSP SNI 7394:2008 Beton Mutu Rendah Karbon'
    },
    preset_besi: {
        nama: 'Fabrikasi & Erection Pembesian Baja Tulangan BJTS',
        satuan: 'kg',
        koef_pekerja: 0.0080,
        koef_tukang: 0.0080,
        catatan: 'AHSP SNI 7394:2008 Pembesian dengan Baja Daur Ulang'
    },
    preset_bata: {
        nama: 'Pasangan Dinding Bata Ringan (AAC Block) Tebal 10 cm',
        satuan: 'm²',
        koef_pekerja: 0.1000,
        koef_tukang: 0.0500,
        catatan: 'AHSP Permen PUPR - Mortar Perekat Siap Pakai'
    },
    preset_plester: {
        nama: 'Plesteran Dinding & Acian Mortar Ramah Lingkungan',
        satuan: 'm²',
        koef_pekerja: 0.2000,
        koef_tukang: 0.1500,
        catatan: 'AHSP SNI 2837:2008 Tebal 15mm'
    },
    preset_galian: {
        nama: 'Galian Tanah Pondasi / Bore Pile Kedalaman 1-2 Meter',
        satuan: 'm³',
        koef_pekerja: 0.5200,
        koef_tukang: 0.0000,
        catatan: 'AHSP SNI 2835:2008 Galian Tanah Biasa'
    },
    preset_mep: {
        nama: 'Instalasi MEP, Solar Rooftop 550Wp & Plumbing Rainwater',
        satuan: 'titik',
        koef_pekerja: 0.2000,
        koef_tukang: 0.3500,
        catatan: 'AHSP Permen PUPR Mekanikal & Elektrikal Tenaga Surya'
    },
    preset_cat: {
        nama: 'Pengecatan Dinding Interior Eco-Shield Low-VOC (3 Lapis)',
        satuan: 'm²',
        koef_pekerja: 0.0200,
        koef_tukang: 0.0630,
        catatan: 'AHSP SNI Finishing Cat Ramah Lingkungan'
    }
};

function calculateLaborValues(volume, koefPekerja, koefTukang, targetHari) {
    const vol = parseFloat(volume) || 0;
    const kp = parseFloat(koefPekerja) || 0;
    const kt = parseFloat(koefTukang) || 0;
    const dur = parseInt(targetHari) || 1;

    const totalOhPekerja = vol * kp;
    const totalOhTukang = vol * kt;
    const totalOh = totalOhPekerja + totalOhTukang;

    // Alokasi pembulatan ke atas (Math.ceil) untuk kebutuhan alokasi orang per hari di lapangan
    const pekerjaPerHari = Math.ceil(totalOhPekerja / dur) || 0;
    const tukangPerHari = Math.ceil(totalOhTukang / dur) || 0;
    const totalPekerjaHari = pekerjaPerHari + tukangPerHari;

    return {
        vol, kp, kt, dur,
        totalOhPekerja,
        totalOhTukang,
        totalOh,
        pekerjaPerHari,
        tukangPerHari,
        totalPekerjaHari,
        pekerjaExact: dur > 0 ? (totalOhPekerja / dur).toFixed(2) : '0.00',
        tukangExact: dur > 0 ? (totalOhTukang / dur).toFixed(2) : '0.00'
    };
}

function updateLaborLivePreview() {
    const vol = document.getElementById('laborVolume')?.value;
    const kp = document.getElementById('laborKoefPekerja')?.value;
    const kt = document.getElementById('laborKoefTukang')?.value;
    const target = document.getElementById('laborTargetHari')?.value;

    const calc = calculateLaborValues(vol, kp, kt, target);

    const previewBadge = document.getElementById('previewTotalTenagaBadge');
    const previewPekerja = document.getElementById('previewPekerjaHari');
    const previewOhPek = document.getElementById('previewOhPekerja');
    const previewTukang = document.getElementById('previewTukangHari');
    const previewOhTuk = document.getElementById('previewOhTukang');
    const previewTotalOh = document.getElementById('previewTotalOh');
    const previewRasio = document.getElementById('previewRasioRegu');

    if (previewBadge) previewBadge.textContent = `${calc.totalPekerjaHari} Orang / Hari`;
    if (previewPekerja) previewPekerja.innerHTML = `${calc.pekerjaPerHari} Orang <span class="text-muted fw-normal">(${calc.pekerjaExact} org/hari)</span>`;
    if (previewOhPek) previewOhPek.textContent = `(${calc.totalOhPekerja.toFixed(2)} OH)`;
    if (previewTukang) previewTukang.innerHTML = `${calc.tukangPerHari} Orang <span class="text-muted fw-normal">(${calc.tukangExact} org/hari)</span>`;
    if (previewOhTuk) previewOhTuk.textContent = `(${calc.totalOhTukang.toFixed(2)} OH)`;
    if (previewTotalOh) previewTotalOh.textContent = `${calc.totalOh.toFixed(2)} Orang-Hari (OH)`;

    if (previewRasio) {
        if (calc.tukangPerHari > 0 && calc.pekerjaPerHari > 0) {
            const ratio = (calc.pekerjaPerHari / calc.tukangPerHari).toFixed(1);
            previewRasio.innerHTML = `💡 Komposisi Regu Kerja: <strong>1 Tukang membawahi ~${ratio} Pekerja</strong> (Total Regu: ${calc.totalPekerjaHari} orang)`;
        } else if (calc.tukangPerHari > 0) {
            previewRasio.innerHTML = `💡 Komposisi Regu Kerja: <strong>Tenaga Ahli Tukang Spesialis (${calc.tukangPerHari} orang/hari)</strong>`;
        } else if (calc.pekerjaPerHari > 0) {
            previewRasio.innerHTML = `💡 Komposisi Regu Kerja: <strong>Tenaga Pekerja Pelaksana (${calc.pekerjaPerHari} orang/hari)</strong>`;
        } else {
            previewRasio.innerHTML = `💡 Komposisi Regu Kerja: <strong>Masukkan volume, koefisien &amp; durasi</strong>`;
        }
    }
}

function loadLaborData() {
    const laborList = DataStore.get(STORAGE_KEYS.LABOR) || [];
    const tbody = document.getElementById('tbodyLabor');
    if (!tbody) return;
    tbody.innerHTML = '';

    let sumPekerjaPerHari = 0;
    let sumTukangPerHari = 0;
    let sumTotalTenagaPerHari = 0;
    let sumTotalManDays = 0;

    if (laborList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Belum ada analisis kebutuhan tenaga kerja. Silakan input formulir di samping.</td></tr>`;
    } else {
        laborList.forEach((item) => {
            sumPekerjaPerHari += (parseInt(item.pekerja_per_hari) || 0);
            sumTukangPerHari += (parseInt(item.tukang_per_hari) || 0);
            sumTotalTenagaPerHari += (parseInt(item.total_pekerja_hari) || 0);
            sumTotalManDays += (parseFloat(item.total_oh) || 0);

            const ratioText = (item.tukang_per_hari > 0 && item.pekerja_per_hari > 0)
                ? `1 Tukang : ${(item.pekerja_per_hari / item.tukang_per_hari).toFixed(1)} Pekerja`
                : (item.tukang_per_hari > 0 ? `${item.tukang_per_hari} Tukang` : `${item.pekerja_per_hari} Pekerja`);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong class="text-dark d-block">${escapeHtml(item.nama_pekerjaan)}</strong>
                    <small class="text-muted">${escapeHtml(item.catatan || 'Kebutuhan Tenaga Kerja Standar')}</small>
                </td>
                <td>
                    <span class="badge bg-secondary-subtle text-secondary">${parseFloat(item.volume).toLocaleString('id-ID')} ${escapeHtml(item.satuan)}</span>
                </td>
                <td class="small">
                    <div><i class="bi bi-person text-primary"></i> P: <code>${parseFloat(item.koef_pekerja).toFixed(4)}</code></div>
                    <div><i class="bi bi-tools text-success"></i> T: <code>${parseFloat(item.koef_tukang).toFixed(4)}</code></div>
                </td>
                <td>
                    <span class="badge bg-light text-dark border"><i class="bi bi-clock me-1"></i>${item.target_hari} Hari</span>
                </td>
                <td class="small">
                    <div><strong>${parseFloat(item.total_oh).toFixed(2)}</strong> OH</div>
                    <div class="text-muted" style="font-size:0.75rem;">(${parseFloat(item.total_oh_pekerja).toFixed(1)} P / ${parseFloat(item.total_oh_tukang).toFixed(1)} T)</div>
                </td>
                <td class="table-primary text-center">
                    <h6 class="mb-0 fw-bold text-primary">${item.total_pekerja_hari} Org/Hari</h6>
                    <small class="text-muted" style="font-size:0.72rem;">${item.tukang_per_hari} Tukang + ${item.pekerja_per_hari} Pekerja</small>
                </td>
                <td class="small">
                    <span class="badge bg-info-subtle text-info border border-info-subtle">${ratioText}</span>
                </td>
                <td class="text-center">
                    ${AuthManager.hasWriteAccess('labor')
                        ? `<button class="btn btn-sm btn-outline-danger" title="Hapus" onclick="deleteLaborItem(${item.id})">
                               <i class="bi bi-trash"></i>
                           </button>`
                        : `<span class="badge bg-light text-muted border py-1 px-2" title="Hanya Mandor / Admin yang berhak"><i class="bi bi-lock-fill me-1"></i>Hanya Lihat</span>`
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Update Mini Stat Cards
    const elPek = document.getElementById('statPekerjaPerHari');
    const elTuk = document.getElementById('statTukangPerHari');
    const elTot = document.getElementById('statTotalTenagaPerHari');
    const elOh = document.getElementById('statTotalManDays');

    if (elPek) elPek.textContent = sumPekerjaPerHari;
    if (elTuk) elTuk.textContent = sumTukangPerHari;
    if (elTot) elTot.textContent = sumTotalTenagaPerHari;
    if (elOh) elOh.textContent = sumTotalManDays.toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

function deleteLaborItem(id) {
    if (!AuthManager.hasWriteAccess('labor')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Kebutuhan Tenaga Kerja.', true);
        return;
    }
    if (!confirm('Hapus analisis kebutuhan tenaga kerja ini?')) return;
    let list = DataStore.get(STORAGE_KEYS.LABOR) || [];
    list = list.filter(item => item.id != id);
    DataStore.set(STORAGE_KEYS.LABOR, list);

    showToast('Analisis kebutuhan tenaga kerja berhasil dihapus!');
    loadLaborData();
    fetchSummaryStats();
}

function exportLaborRequirements() {
    const laborList = DataStore.get(STORAGE_KEYS.LABOR) || [];
    if (laborList.length === 0) {
        alert('Belum ada data kebutuhan tenaga kerja untuk dicetak.');
        return;
    }

    let printHtml = `
    <html>
    <head>
        <title>Rekapitulasi Kebutuhan Tenaga Kerja - PENMROYEK</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 25px; color: #333; }
            h2 { color: #198754; margin-bottom: 5px; }
            p { font-size: 13px; color: #666; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-center { text-align: center; }
            .summary-box { display: flex; gap: 15px; margin-top: 20px; }
            .summary-item { border: 1px solid #198754; padding: 10px; border-radius: 4px; flex: 1; }
            .fw-bold { font-weight: bold; }
        </style>
    </head>
    <body>
        <h2>LAPORAN ANALISIS KEBUTUHAN TENAGA KERJA PROYEK</h2>
        <p>Proyek: PENMROYEK (Pengendalian dan Monitoring Proyek) &bull; Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Nama Pekerjaan</th>
                    <th>Volume</th>
                    <th>Koef. Pekerja</th>
                    <th>Koef. Tukang</th>
                    <th>Target (Hari)</th>
                    <th>Total OH</th>
                    <th>Kebutuhan/Hari</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalPekerja = 0, totalTukang = 0, totalTenaga = 0, totalOH = 0;
    laborList.forEach((item, idx) => {
        totalPekerja += parseInt(item.pekerja_per_hari) || 0;
        totalTukang += parseInt(item.tukang_per_hari) || 0;
        totalTenaga += parseInt(item.total_pekerja_hari) || 0;
        totalOH += parseFloat(item.total_oh) || 0;

        printHtml += `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td><strong>${item.nama_pekerjaan}</strong><br><small>${item.catatan || '-'}</small></td>
                <td>${item.volume} ${item.satuan}</td>
                <td>${item.koef_pekerja}</td>
                <td>${item.koef_tukang}</td>
                <td class="text-center">${item.target_hari} Hari</td>
                <td>${item.total_oh} OH</td>
                <td class="text-center"><strong>${item.total_pekerja_hari} Org/Hari</strong> (${item.tukang_per_hari} T + ${item.pekerja_per_hari} P)</td>
            </tr>
        `;
    });

    printHtml += `
            </tbody>
            <tfoot>
                <tr style="background:#f8f9fa; font-weight:bold;">
                    <td colspan="6" style="text-align:right;">TOTAL KEBUTUHAN LAPANGAN:</td>
                    <td>${totalOH.toFixed(2)} OH</td>
                    <td class="text-center">${totalTenaga} Org/Hari (${totalTukang} Tukang + ${totalPekerja} Pekerja)</td>
                </tr>
            </tfoot>
        </table>
    </body>
    </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.write(printHtml);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
            printWin.print();
        }, 350);
    }
}

// Fallback compatibility alias
function loadAttendanceData() {
    loadLaborData();
}
function deleteAttendance(id) {
    deleteLaborItem(id);
}

// ==============================================================================
// 7. MODUL: QUALITY CONTROL (QC) & KENDALI MUTU KONSTRUKSI
// ==============================================================================
function loadQualityControlData() {
    const list = DataStore.get(STORAGE_KEYS.QUALITY_CONTROL) || [];
    const tbody = document.getElementById('tbodyQualityControl');
    if (!tbody) return;
    tbody.innerHTML = '';

    let countApproved = 0;
    let countPunchList = 0;
    let countRejected = 0;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Belum ada catatan inspeksi Quality Control. Silakan gunakan formulir di samping untuk mendaftarkan inspeksi mutu.</td></tr>`;
    } else {
        list.forEach(item => {
            if (item.status === 'Lolos QC / Approved') countApproved++;
            else if (item.status === 'Perlu Perbaikan / Punch List') countPunchList++;
            else if (item.status === 'Ditolak / Rejected') countRejected++;

            let severityBadge = '';
            switch (item.urgensi) {
                case 'Critical': severityBadge = '<span class="badge bg-danger"><i class="bi bi-exclamation-octagon me-1"></i>Critical</span>'; break;
                case 'Major': severityBadge = '<span class="badge bg-warning text-dark" style="background-color: #ea580c !important; color:#fff !important;">Major</span>'; break;
                case 'Moderate': severityBadge = '<span class="badge bg-warning text-dark">Moderate</span>'; break;
                case 'Minor': severityBadge = '<span class="badge bg-info-subtle text-info border">Minor</span>'; break;
                default: severityBadge = '<span class="badge bg-secondary">Moderate</span>';
            }

            const photoCell = item.foto_inspeksi
                ? `<img src="${item.foto_inspeksi}" class="img-thumb-preview" alt="Foto QC" onclick="viewImage('${item.foto_inspeksi}', 'QC: ${escapeHtml(item.item_pekerjaan)}')">`
                : `<div class="bg-secondary-subtle text-secondary rounded d-flex align-items-center justify-content-center" style="width:48px;height:48px;"><i class="bi bi-patch-check"></i></div>`;

            const canWrite = AuthManager.hasWriteAccess('qc');
            const statusCell = canWrite
                ? `<select class="form-select form-select-sm fw-semibold ${item.status === 'Lolos QC / Approved' ? 'text-success border-success' : (item.status === 'Ditolak / Rejected' ? 'text-danger border-danger' : 'text-warning border-warning')}" onchange="updateQualityControlStatus(${item.id}, this.value)">
                       <option value="Lolos QC / Approved" ${item.status === 'Lolos QC / Approved' ? 'selected' : ''}>✅ Lolos QC / Approved</option>
                       <option value="Perlu Perbaikan / Punch List" ${item.status === 'Perlu Perbaikan / Punch List' ? 'selected' : ''}>⚠️ Punch List / Rework</option>
                       <option value="Ditolak / Rejected" ${item.status === 'Ditolak / Rejected' ? 'selected' : ''}>❌ Ditolak / Rejected</option>
                       <option value="Menunggu Uji Lab" ${item.status === 'Menunggu Uji Lab' ? 'selected' : ''}>🧪 Menunggu Uji Lab</option>
                   </select>`
                : `<span class="badge ${item.status === 'Lolos QC / Approved' ? 'bg-success' : (item.status === 'Ditolak / Rejected' ? 'bg-danger' : 'bg-warning text-dark')}">${escapeHtml(item.status)}</span>`;

            const actionCell = canWrite
                ? `<button class="btn btn-sm btn-outline-danger" title="Hapus Inspeksi QC" onclick="deleteQualityControl(${item.id})">
                       <i class="bi bi-trash"></i>
                   </button>`
                : `<span class="badge bg-light text-muted border py-1 px-2" title="Hanya QC Inspector / Admin yang berhak"><i class="bi bi-lock-fill me-1"></i>Hanya Lihat</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${photoCell}</td>
                <td>
                    <span class="fw-bold text-dark d-block">${escapeHtml(item.item_pekerjaan)}</span>
                    <span class="badge bg-secondary-subtle text-secondary small">${escapeHtml(item.kategori)}</span>
                    ${item.deskripsi ? `<div class="small text-muted mt-1" style="font-size:0.75rem;"><i class="bi bi-info-circle me-1"></i>${escapeHtml(item.deskripsi)}</div>` : ''}
                </td>
                <td class="small">
                    <strong>${escapeHtml(item.metode_uji)}</strong>
                    <div class="text-muted" style="font-size:0.75rem;"><i class="bi bi-file-earmark-check me-1"></i>${escapeHtml(item.standar_acuan || '-')}</div>
                </td>
                <td class="small">
                    <strong class="text-dark">${escapeHtml(item.pic)}</strong>
                    <div class="text-muted" style="font-size:0.75rem;"><i class="bi bi-calendar-event me-1"></i>${item.tanggal_inspeksi}</div>
                </td>
                <td>${severityBadge}</td>
                <td>${statusCell}</td>
                <td class="text-center">${actionCell}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Update Mini Stat Cards
    const elTot = document.getElementById('statQcTotal');
    const elApp = document.getElementById('statQcApproved');
    const elPunch = document.getElementById('statQcPunchList');
    const elRej = document.getElementById('statQcRejected');

    if (elTot) elTot.textContent = list.length;
    if (elApp) elApp.textContent = countApproved;
    if (elPunch) elPunch.textContent = countPunchList;
    if (elRej) elRej.textContent = countRejected;
}

function updateQualityControlStatus(id, newStatus) {
    if (!AuthManager.hasWriteAccess('qc')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Quality Control.', true);
        return;
    }
    let list = DataStore.get(STORAGE_KEYS.QUALITY_CONTROL) || [];
    const item = list.find(q => q.id == id);
    if (item) {
        item.status = newStatus;
        DataStore.set(STORAGE_KEYS.QUALITY_CONTROL, list);
        showToast(`Status QC berhasil diubah menjadi "${newStatus}".`);
        loadQualityControlData();
        fetchSummaryStats();
    }
}

function deleteQualityControl(id) {
    if (!AuthManager.hasWriteAccess('qc')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Quality Control.', true);
        return;
    }
    if (!confirm('Hapus catatan inspeksi Quality Control ini?')) return;
    let list = DataStore.get(STORAGE_KEYS.QUALITY_CONTROL) || [];
    list = list.filter(q => q.id != id);
    DataStore.set(STORAGE_KEYS.QUALITY_CONTROL, list);

    showToast('Catatan Quality Control berhasil dihapus!');
    loadQualityControlData();
    fetchSummaryStats();
}

function exportQualityControlReport() {
    const list = DataStore.get(STORAGE_KEYS.QUALITY_CONTROL) || [];
    if (list.length === 0) {
        alert('Belum ada data Quality Control untuk dicetak.');
        return;
    }

    let printHtml = `
    <html>
    <head>
        <title>Laporan Quality Control (QC) - PENMROYEK</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 25px; color: #333; }
            h2 { color: #0284c7; margin-bottom: 5px; }
            p { font-size: 13px; color: #666; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .text-center { text-align: center; }
            .badge-approved { color: #16a34a; font-weight: bold; }
            .badge-punch { color: #d97706; font-weight: bold; }
            .badge-rejected { color: #dc2626; font-weight: bold; }
        </style>
    </head>
    <body>
        <h2>LAPORAN QUALITY CONTROL (QC) &amp; INSPEKSI MUTU LAPANGAN</h2>
        <p>Proyek: PENMROYEK (Pengendalian dan Monitoring Proyek) &bull; Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Item Pekerjaan Diinspeksi</th>
                    <th>Kategori Divisi</th>
                    <th>Metode Uji &amp; Standar</th>
                    <th>QC Inspector</th>
                    <th>Tanggal</th>
                    <th>Tingkat Severity</th>
                    <th>Status Mutu</th>
                </tr>
            </thead>
            <tbody>
    `;

    list.forEach((item, idx) => {
        let statusClass = 'badge-punch';
        if (item.status === 'Lolos QC / Approved') statusClass = 'badge-approved';
        else if (item.status === 'Ditolak / Rejected') statusClass = 'badge-rejected';

        printHtml += `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td><strong>${escapeHtml(item.item_pekerjaan)}</strong><br><small>${escapeHtml(item.deskripsi || '-')}</small></td>
                <td>${escapeHtml(item.kategori)}</td>
                <td>${escapeHtml(item.metode_uji)}<br><small>(${escapeHtml(item.standar_acuan || '-')})</small></td>
                <td>${escapeHtml(item.pic)}</td>
                <td class="text-center">${item.tanggal_inspeksi}</td>
                <td>${escapeHtml(item.urgensi)}</td>
                <td class="${statusClass}"><strong>${escapeHtml(item.status)}</strong></td>
            </tr>
        `;
    });

    printHtml += `
            </tbody>
        </table>
    </body>
    </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.write(printHtml);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
            printWin.print();
        }, 350);
    }
}

// Fallback compatibility alias
function loadMaintenanceData() {
    loadQualityControlData();
}
function deleteMaintenance(id) {
    deleteQualityControl(id);
}
function updateMaintenanceStatus(id, newStatus) {
    updateQualityControlStatus(id, newStatus);
}

// ==============================================================================
// 8. MODUL: MANAJEMEN RISIKO, 5x5 HEATMAP & RISK IMPACT ENGINE
// ==============================================================================
function populateWbsDropdown() {
    const schedules = DataStore.get(STORAGE_KEYS.SCHEDULES) || [];
    
    // 1. Populate Risk WBS Dropdown
    const riskSelect = document.getElementById('riskWbsSelect');
    if (riskSelect) {
        riskSelect.innerHTML = '<option value="">-- Pilih Pekerjaan WBS Terkait --</option>';
        schedules.forEach(task => {
            const opt = document.createElement('option');
            opt.value = task.id;
            opt.textContent = `WBS #${task.id}: ${task.nama_pekerjaan} (${task.start_date} s/d ${task.end_date})`;
            riskSelect.appendChild(opt);
        });
    }

    // 2. Populate Labor Requirements WBS Dropdown
    const laborWbsSelect = document.getElementById('laborWbsSelect');
    if (laborWbsSelect) {
        laborWbsSelect.innerHTML = '<option value="">-- Pilih dari Jadwal WBS Proyek (Opsional) --</option>';
        schedules.forEach(task => {
            const opt = document.createElement('option');
            opt.value = task.id;
            opt.dataset.nama = task.nama_pekerjaan;
            opt.dataset.durasi = task.durasi_hari || 10;
            opt.textContent = `WBS #${task.id}: ${task.nama_pekerjaan} (${task.durasi_hari || '-'} Hari)`;
            laborWbsSelect.appendChild(opt);
        });
    }
}

function updateRiskScorePreview() {
    const probEl = document.getElementById('riskProb');
    const impactEl = document.getElementById('riskImpact');
    const box = document.getElementById('riskScorePreviewBox');
    if (!probEl || !impactEl || !box) return;

    const prob = parseInt(probEl.value) || 1;
    const impact = parseInt(impactEl.value) || 1;
    const score = prob * impact;

    let levelText = 'Low';
    let badgeClass = 'bg-success';
    let engineNotice = 'Tidak ada penambahan hari pada jadwal WBS.';

    if (score >= 20) {
        levelText = 'Critical';
        badgeClass = 'bg-danger text-white';
        engineNotice = '⚠️ <strong>CRITICAL DETECTED:</strong> Menambah <strong>+7 Hari</strong> pada WBS dan memicu deviasi Kurva S!';
    } else if (score >= 12) {
        levelText = 'High';
        badgeClass = 'bg-warning text-dark';
        engineNotice = '⚠️ <strong>HIGH DETECTED:</strong> Menambah <strong>+3 Hari</strong> pada WBS dan memicu perlambatan progres!';
    } else if (score >= 6) {
        levelText = 'Medium';
        badgeClass = 'bg-warning-subtle text-warning-emphasis border border-warning';
        engineNotice = 'Perlu monitoring berkala (toleransi jadwal normal).';
    } else {
        levelText = 'Low';
        badgeClass = 'bg-success-subtle text-success border border-success';
        engineNotice = 'Tingkat risiko aman.';
    }

    box.innerHTML = `
        <div class="p-2 rounded border bg-light">
            <div class="d-flex align-items-center justify-content-between mb-1">
                <span class="small fw-bold">Kalkulasi Skor: ${prob} &times; ${impact} = <strong>${score}</strong></span>
                <span class="badge ${badgeClass} px-2 py-1">${levelText}</span>
            </div>
            <div class="small ${score >= 12 ? 'text-danger fw-semibold' : 'text-muted'}">${engineNotice}</div>
        </div>
    `;
}

function loadRiskMatrix() {
    const risks = DataStore.get(STORAGE_KEYS.RISKS);
    const schedules = DataStore.get(STORAGE_KEYS.SCHEDULES);

    const matrix = {};
    for (let p = 1; p <= 5; p++) {
        matrix[p] = {};
        for (let i = 1; i <= 5; i++) matrix[p][i] = 0;
    }

    let critCount = 0;
    let highCount = 0;
    let medCount = 0;
    let lowCount = 0;

    risks.forEach(r => {
        const p = parseInt(r.probability) || 1;
        const i = parseInt(r.impact) || 1;
        if (matrix[p] && matrix[p][i] !== undefined) {
            matrix[p][i]++;
        }
        if (r.level === 'Critical') critCount++;
        else if (r.level === 'High') highCount++;
        else if (r.level === 'Medium') medCount++;
        else lowCount++;
    });

    for (let p = 1; p <= 5; p++) {
        for (let i = 1; i <= 5; i++) {
            const cell = document.getElementById(`cell-${p}-${i}`);
            if (cell) {
                const count = matrix[p][i];
                cell.textContent = count;
                cell.title = `P:${p}, I:${i} (Skor ${p * i}) - ${count} Isu Risiko`;
            }
        }
    }

    const totalDelay = schedules.reduce((acc, s) => acc + (parseInt(s.delay_days) || 0), 0);
    const summaryCard = document.getElementById('projectRiskSummaryCard');

    if (summaryCard) {
        let healthStatusHtml = '';
        if (critCount > 0) {
            healthStatusHtml = `
                <div class="alert alert-danger mb-3 py-2 d-flex align-items-center gap-2">
                    <i class="bi bi-shield-slash-fill fs-3 text-danger"></i>
                    <div>
                        <strong class="d-block">STATUS KRITIS (HIGH THREAT ON SCHEDULE)</strong>
                        <span class="small">Terdapat ${critCount} risiko Critical aktif yang memicu penambahan durasi konstruksi!</span>
                    </div>
                </div>
            `;
        } else if (highCount > 0) {
            healthStatusHtml = `
                <div class="alert alert-warning mb-3 py-2 d-flex align-items-center gap-2">
                    <i class="bi bi-shield-exclamation fs-3 text-warning"></i>
                    <div>
                        <strong class="d-block">STATUS WASPADA (MODERATE THREAT)</strong>
                        <span class="small">Terdapat ${highCount} risiko High. Pengawasan ekstra lintasan kritis diperlukan.</span>
                    </div>
                </div>
            `;
        } else {
            healthStatusHtml = `
                <div class="alert alert-success mb-3 py-2 d-flex align-items-center gap-2">
                    <i class="bi bi-shield-check fs-3 text-success"></i>
                    <div>
                        <strong class="d-block">STATUS PROYEK AMAN (STABLE)</strong>
                        <span class="small">Tidak ada ancaman risiko level Critical atau High aktif.</span>
                    </div>
                </div>
            `;
        }

        summaryCard.innerHTML = `
            ${healthStatusHtml}
            <div class="row g-2 text-center">
                <div class="col-3">
                    <div class="p-2 border rounded bg-light">
                        <div class="small text-muted">Total Risiko</div>
                        <h5 class="fw-bold mb-0 text-dark">${risks.length}</h5>
                    </div>
                </div>
                <div class="col-3">
                    <div class="p-2 border rounded bg-danger-subtle">
                        <div class="small text-danger fw-bold">Critical</div>
                        <h5 class="fw-bold mb-0 text-danger">${critCount}</h5>
                    </div>
                </div>
                <div class="col-3">
                    <div class="p-2 border rounded bg-warning-subtle">
                        <div class="small text-warning-emphasis fw-bold">High</div>
                        <h5 class="fw-bold mb-0 text-warning-emphasis">${highCount}</h5>
                    </div>
                </div>
                <div class="col-3">
                    <div class="p-2 border rounded bg-primary-subtle">
                        <div class="small text-primary fw-bold">Akumulasi Delay</div>
                        <h5 class="fw-bold mb-0 text-primary">+${totalDelay} Hari</h5>
                    </div>
                </div>
            </div>
        `;
    }
}

function loadRisksData() {
    const risks = DataStore.get(STORAGE_KEYS.RISKS);
    const tbody = document.getElementById('tbodyRisks');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!risks || risks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Belum ada identifikasi risiko. Gunakan form di sebelah kanan.</td></tr>`;
        return;
    }

    risks.forEach(r => {
        let levelBadge = '';
        let delayImpact = '<span class="text-muted small">Normal (0 Hari)</span>';

        if (r.level === 'Critical') {
            levelBadge = `<span class="badge bg-danger">Critical (Skor ${r.score})</span>`;
            delayImpact = `<span class="badge badge-delay">+7 Hari Delay WBS</span>`;
        } else if (r.level === 'High') {
            levelBadge = `<span class="badge bg-warning text-dark" style="background-color: #f97316 !important; color:#fff !important;">High (Skor ${r.score})</span>`;
            delayImpact = `<span class="badge bg-warning text-dark">+3 Hari Delay WBS</span>`;
        } else if (r.level === 'Medium') {
            levelBadge = `<span class="badge bg-warning text-dark">Medium (Skor ${r.score})</span>`;
        } else {
            levelBadge = `<span class="badge bg-success">Low (Skor ${r.score})</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="fw-bold text-dark d-block">${escapeHtml(r.nama_risiko)}</span>
                <span class="small text-muted">${escapeHtml(r.kategori)}</span>
            </td>
            <td class="small">
                <strong>${r.nama_pekerjaan ? escapeHtml(r.nama_pekerjaan) : 'WBS #' + r.pekerjaan_id}</strong>
            </td>
            <td class="text-center small">${r.probability} &times; ${r.impact} = <strong>${r.score}</strong></td>
            <td>${levelBadge}</td>
            <td>${delayImpact}</td>
            <td class="small text-muted" style="max-width: 220px;">${escapeHtml(r.mitigasi || '-')}</td>
            <td><span class="badge bg-light text-dark border">${escapeHtml(r.status)}</span></td>
            <td class="text-center">
                ${AuthManager.hasWriteAccess('risks')
                    ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteRisk(${r.id})" title="Hapus Risiko">
                           <i class="bi bi-trash"></i>
                       </button>`
                    : `<span class="badge bg-light text-muted border py-1 px-2" title="Hanya HSE Officer / Admin yang berhak"><i class="bi bi-lock-fill me-1"></i>Hanya Lihat</span>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteRisk(id) {
    if (!AuthManager.hasWriteAccess('risks')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Analisis Risiko.', true);
        return;
    }
    if (!confirm('Hapus pencatatan risiko ini?')) return;
    let risks = DataStore.get(STORAGE_KEYS.RISKS);
    risks = risks.filter(r => r.id != id);
    DataStore.set(STORAGE_KEYS.RISKS, risks);

    showToast('Risiko berhasil dihapus!');
    loadRisksData();
    loadRiskMatrix();
    fetchSummaryStats();
}

// ==============================================================================
// 9. MODUL: MANAJEMEN & ANALISIS LIMBAH KONSTRUKSI (TERPISAH)
// ==============================================================================
function loadWasteData() {
    const list = DataStore.get(STORAGE_KEYS.WASTE);
    const tbody = document.getElementById('tbodyWaste');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">Belum ada catatan timbulan limbah proyek.</td></tr>`;
        return;
    }

    list.forEach(w => {
        let badgeKat = 'bg-secondary';
        if (w.kategori === 'Limbah B3') badgeKat = 'bg-danger';
        else if (w.kategori === 'Limbah Padat Daur Ulang') badgeKat = 'bg-primary';
        else if (w.kategori === 'Limbah Domestik / Organik') badgeKat = 'bg-success';

        const fileLink = w.bukti_manifest
            ? `<a href="javascript:void(0)" onclick="viewImage('${w.bukti_manifest}', 'Manifest: ${escapeHtml(w.nama_limbah)}')" class="btn btn-sm btn-outline-info py-0 px-2"><i class="bi bi-file-earmark-check me-1"></i>Lihat</a>`
            : '<span class="text-muted small">-</span>';

        const canWrite = AuthManager.hasWriteAccess('waste');
        const statusCell = canWrite
            ? `<select class="form-select form-select-sm" onchange="updateWasteStatus(${w.id}, this.value)">
                   <option value="Tersimpan di TPS" ${w.status === 'Tersimpan di TPS' ? 'selected' : ''}>Tersimpan di TPS</option>
                   <option value="Selesai Terangkut / Didaur Ulang" ${w.status === 'Selesai Terangkut / Didaur Ulang' ? 'selected' : ''}>Selesai Didaur Ulang</option>
               </select>`
            : `<span class="badge ${w.status === 'Selesai Terangkut / Didaur Ulang' ? 'bg-success' : 'bg-warning text-dark'}">${escapeHtml(w.status)}</span>`;

        const actionCell = canWrite
            ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteWaste(${w.id})" title="Hapus Limbah">
                   <i class="bi bi-trash"></i>
               </button>`
            : `<span class="badge bg-light text-muted border py-1 px-2" title="Hanya Petugas Limbah / Admin yang berhak"><i class="bi bi-lock-fill me-1"></i>Hanya Lihat</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fileLink}</td>
            <td class="small">${w.tanggal}</td>
            <td class="fw-semibold text-dark">${escapeHtml(w.nama_limbah)}</td>
            <td><span class="badge ${badgeKat}">${escapeHtml(w.kategori)}</span></td>
            <td class="fw-bold">${parseFloat(w.volume || 0).toLocaleString('id-ID')} ${escapeHtml(w.satuan || 'Kg')}</td>
            <td><span class="badge bg-light text-dark border">${escapeHtml(w.metode_pengelolaan)}</span></td>
            <td class="small text-muted">${escapeHtml(w.vendor_pengolah || '-')}</td>
            <td>${statusCell}</td>
            <td class="text-center">${actionCell}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateWasteStatus(id, newStatus) {
    if (!AuthManager.hasWriteAccess('waste')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Manajemen Limbah.', true);
        return;
    }
    let list = DataStore.get(STORAGE_KEYS.WASTE);
    const item = list.find(w => w.id == id);
    if (item) {
        item.status = newStatus;
        DataStore.set(STORAGE_KEYS.WASTE, list);
        showToast(`Status limbah berhasil diubah menjadi "${newStatus}".`);
        loadWasteStats();
    }
}

function deleteWaste(id) {
    if (!AuthManager.hasWriteAccess('waste')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Manajemen Limbah.', true);
        return;
    }
    if (!confirm('Hapus data limbah konstruksi ini?')) return;
    let list = DataStore.get(STORAGE_KEYS.WASTE);
    list = list.filter(w => w.id != id);
    DataStore.set(STORAGE_KEYS.WASTE, list);

    showToast('Data limbah berhasil dihapus!');
    loadWasteData();
    loadWasteStats();
}

function loadWasteStats() {
    const list = DataStore.get(STORAGE_KEYS.WASTE);

    let totalVolumeKg = 0;
    let divertedVolumeKg = 0;
    let b3ItemsCount = 0;
    let tpsStoredCount = 0;

    const categories = {
        'Limbah Padat Daur Ulang': 0,
        'Limbah B3': 0,
        'Limbah Non-B3 / Demolisi': 0,
        'Limbah Domestik / Organik': 0
    };

    list.forEach(w => {
        const vol = parseFloat(w.volume) || 0;
        const volKg = (w.satuan && w.satuan.toLowerCase() === 'ton') ? vol * 1000 : vol;
        totalVolumeKg += volKg;

        if (w.metode_pengelolaan === 'Reuse' || w.metode_pengelolaan === 'Recycle' || w.status === 'Selesai Terangkut / Didaur Ulang') {
            divertedVolumeKg += volKg;
        }

        if (w.kategori === 'Limbah B3') b3ItemsCount++;
        if (w.status === 'Tersimpan di TPS') tpsStoredCount++;

        if (categories[w.kategori] !== undefined) {
            categories[w.kategori] += volKg;
        }
    });

    const diversionRate = totalVolumeKg > 0 ? ((divertedVolumeKg / totalVolumeKg) * 100).toFixed(1) : 0;

    const elTotal = document.getElementById('kpiWasteTotal');
    const elDiv = document.getElementById('kpiWasteDiversion');
    const elB3 = document.getElementById('kpiWasteB3');
    const elTps = document.getElementById('kpiWasteTPS');

    if (elTotal) elTotal.textContent = `${totalVolumeKg.toLocaleString('id-ID')} Kg`;
    if (elDiv) elDiv.textContent = `${diversionRate}%`;
    if (elB3) elB3.textContent = `${b3ItemsCount} Item`;
    if (elTps) elTps.textContent = `${tpsStoredCount} Item`;

    // Render Chart Komposisi Limbah Chart.js
    const ctx = document.getElementById('wasteChart');
    if (!ctx) return;

    if (wasteChartInstance) {
        wasteChartInstance.destroy();
    }

    wasteChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#2563eb', // Padat Daur Ulang
                    '#dc2626', // B3
                    '#64748b', // Demolisi Non-B3
                    '#16a34a'  // Domestik / Organik
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 12, font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const val = context.raw || 0;
                            const pct = totalVolumeKg > 0 ? ((val / totalVolumeKg) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${val.toLocaleString('id-ID')} Kg (${pct}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// ==============================================================================
// 10. MODUL: LOGISTIK KEDATANGAN MATERIAL & ALAT BERAT (JIT LOGISTICS)
// ==============================================================================
function loadLogisticsData() {
    loadMaterialDeliveriesData();
    loadHeavyEquipmentData();
    updateLogisticsKpis();
}

function updateLogisticsKpis() {
    const deliveries = DataStore.get(STORAGE_KEYS.DELIVERIES);
    const equipment = DataStore.get(STORAGE_KEYS.EQUIPMENT);
    const todayStr = new Date().toISOString().split('T')[0];

    const todayCount = deliveries.filter(d => d.tanggal === todayStr).length;
    const arrivedCount = deliveries.filter(d => d.status === 'Tiba & Lolos QC').length;
    const delayedCount = deliveries.filter(d => d.status === 'Tertunda').length;
    const activeEquipCount = equipment.filter(e => e.status === 'Beroperasi di Proyek').length;

    const elToday = document.getElementById('kpiLogisticsToday');
    const elArrived = document.getElementById('kpiMaterialArrived');
    const elActive = document.getElementById('kpiEquipmentActive');
    const elDelayed = document.getElementById('kpiLogisticsDelayed');

    if (elToday) elToday.textContent = `${todayCount} Batch`;
    if (elArrived) elArrived.textContent = `${arrivedCount} Kiriman`;
    if (elActive) elActive.textContent = `${activeEquipCount} Unit`;
    if (elDelayed) elDelayed.textContent = `${delayedCount} Kasus`;
}

function loadMaterialDeliveriesData() {
    const deliveries = DataStore.get(STORAGE_KEYS.DELIVERIES);
    const tbody = document.getElementById('tbodyMaterialDeliveries');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!deliveries || deliveries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Belum ada jadwal kedatangan material. Klik tombol "Jadwalkan Kedatangan Material".</td></tr>`;
        return;
    }

    deliveries.forEach(d => {
        let statusBadge = '';
        if (d.status === 'Tiba & Lolos QC') {
            statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Tiba & Lolos QC</span>';
        } else if (d.status === 'Dalam Perjalanan') {
            statusBadge = '<span class="badge bg-primary"><i class="bi bi-truck me-1"></i>En-Route</span>';
        } else if (d.status === 'Tertunda') {
            statusBadge = '<span class="badge bg-danger"><i class="bi bi-exclamation-triangle me-1"></i>Tertunda (Delay)</span>';
        } else {
            statusBadge = '<span class="badge bg-secondary"><i class="bi bi-calendar3 me-1"></i>Dijadwalkan</span>';
        }

        const fileLink = d.surat_jalan
            ? `<a href="javascript:void(0)" onclick="viewImage('${d.surat_jalan}', 'Surat Jalan DO: ${escapeHtml(d.nama_material)}')" class="btn btn-sm btn-outline-info py-0 px-2"><i class="bi bi-file-earmark-text me-1"></i>Lihat DO</a>`
            : '<span class="text-muted small">-</span>';

        const canWrite = AuthManager.hasWriteAccess('logistics');
        const actionsHtml = canWrite
            ? `${d.status !== 'Tiba & Lolos QC' 
                    ? `<button class="btn btn-sm btn-success py-0 px-2 me-1" onclick="verifyAndReceiveMaterial(${d.id})" title="Verifikasi Lolos QC & Otomatis Tambah Stok Material"><i class="bi bi-check-lg me-1"></i>QC Pass</button>` 
                    : '<span class="badge bg-success-subtle text-success border border-success-subtle me-1"><i class="bi bi-shield-check me-1"></i>Stok Sinkron</span>'
               }
               <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="deleteMaterialDelivery(${d.id})" title="Hapus">
                   <i class="bi bi-trash"></i>
               </button>`
            : `<span class="badge bg-light text-muted border py-1 px-2" title="Hanya Koordinator Logistik / Admin yang berhak"><i class="bi bi-lock-fill me-1"></i>Hanya Lihat</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fileLink}</td>
            <td class="fw-semibold text-dark">${escapeHtml(d.nama_material)}</td>
            <td class="fw-bold">${parseFloat(d.volume || 0).toLocaleString('id-ID')} ${escapeHtml(d.satuan || '')}</td>
            <td class="small text-muted">${escapeHtml(d.vendor || '-')}</td>
            <td class="small">
                <strong>${d.tanggal}</strong>
                <span class="text-muted d-block" style="font-size:0.75rem;"><i class="bi bi-clock me-1"></i>${d.jam || '09:00'}</span>
            </td>
            <td class="small text-dark">${escapeHtml(d.titik_drop || '-')}</td>
            <td>${statusBadge}</td>
            <td class="text-center">
                ${actionsHtml}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function verifyAndReceiveMaterial(deliveryId) {
    if (!AuthManager.hasWriteAccess('logistics')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Logistik & Alat Berat.', true);
        return;
    }
    let deliveries = DataStore.get(STORAGE_KEYS.DELIVERIES);
    const item = deliveries.find(d => d.id == deliveryId);
    if (!item) return;

    if (!confirm(`Verifikasi bahwa kiriman ${item.nama_material} (${item.volume} ${item.satuan}) telah tiba dan lolos inspeksi QC mutu?\n\nSistem akan otomatis menambahkan volume ini ke Modul Kontrol Material.`)) {
        return;
    }

    item.status = 'Tiba & Lolos QC';
    DataStore.set(STORAGE_KEYS.DELIVERIES, deliveries);

    // Integrasi Otomatis ke Modul Material (Sinkronisasi Stok Masuk)
    let materials = DataStore.get(STORAGE_KEYS.MATERIALS);
    let targetMat = materials.find(m => m.nama_material.toLowerCase().trim() === item.nama_material.toLowerCase().trim());

    if (targetMat) {
        targetMat.stok_masuk = (parseFloat(targetMat.stok_masuk) || 0) + (parseFloat(item.volume) || 0);
        targetMat.sisa_stok = (parseFloat(targetMat.stok_masuk) || 0) - (parseFloat(targetMat.stok_keluar) || 0);
        targetMat.perlu_reorder = targetMat.sisa_stok <= (parseFloat(targetMat.min_stok) || 0) ? 1 : 0;
        targetMat.updated_at = new Date().toISOString().substring(0, 16).replace('T', ' ');
    } else {
        const newId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
        materials.unshift({
            id: newId,
            nama_material: item.nama_material,
            satuan: item.satuan,
            stok_masuk: parseFloat(item.volume) || 0,
            stok_keluar: 0,
            sisa_stok: parseFloat(item.volume) || 0,
            min_stok: Math.round((parseFloat(item.volume) || 0) * 0.2),
            perlu_reorder: 0,
            updated_at: new Date().toISOString().substring(0, 16).replace('T', ' ')
        });
    }

    DataStore.set(STORAGE_KEYS.MATERIALS, materials);

    showToast(`✅ Material diterima & Lolos QC! Stok masuk (${item.volume} ${item.satuan}) otomatis disinkronkan ke Kontrol Material.`);
    loadLogisticsData();
    loadMaterialsData();
    fetchSummaryStats();
}

function deleteMaterialDelivery(id) {
    if (!AuthManager.hasWriteAccess('logistics')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Logistik & Alat Berat.', true);
        return;
    }
    if (!confirm('Hapus jadwal kedatangan material ini?')) return;
    let deliveries = DataStore.get(STORAGE_KEYS.DELIVERIES);
    deliveries = deliveries.filter(d => d.id != id);
    DataStore.set(STORAGE_KEYS.DELIVERIES, deliveries);

    showToast('Jadwal material berhasil dihapus!');
    loadLogisticsData();
}

function loadHeavyEquipmentData() {
    const equipment = DataStore.get(STORAGE_KEYS.EQUIPMENT);
    const tbody = document.getElementById('tbodyHeavyEquipment');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!equipment || equipment.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Belum ada alat berat yang terdaftar. Klik tombol "Registrasi Alat Berat".</td></tr>`;
        return;
    }

    equipment.forEach(e => {
        let statusBadge = '';
        if (e.status === 'Beroperasi di Proyek') {
            statusBadge = '<span class="badge bg-success"><i class="bi bi-activity me-1"></i>Beroperasi</span>';
        } else if (e.status === 'Dijadwalkan Mobilisasi') {
            statusBadge = '<span class="badge bg-primary"><i class="bi bi-clock me-1"></i>Jadwal Mobilisasi</span>';
        } else if (e.status === 'Maintenance / Rusak') {
            statusBadge = '<span class="badge bg-danger"><i class="bi bi-tools me-1"></i>Breakdown/Repair</span>';
        } else {
            statusBadge = '<span class="badge bg-secondary"><i class="bi bi-box-arrow-right me-1"></i>Demobilisasi</span>';
        }

        let siaBadge = '';
        if (e.status_sia && e.status_sia.includes('Aktif')) {
            siaBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-patch-check-fill me-1"></i>SIA/SILO Valid</span>';
        } else if (e.status_sia && e.status_sia.includes('Habis')) {
            siaBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="bi bi-exclamation-triangle-fill me-1"></i>Masa SIA Habis</span>';
        } else {
            siaBadge = '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"><i class="bi bi-hourglass-split me-1"></i>Proses Uji Riksa</span>';
        }

        const canWrite = AuthManager.hasWriteAccess('logistics');
        const actionsHtml = canWrite
            ? `<select class="form-select form-select-sm d-inline-block w-auto" onchange="updateEquipmentStatus(${e.id}, this.value)">
                   <option value="Beroperasi di Proyek" ${e.status === 'Beroperasi di Proyek' ? 'selected' : ''}>Beroperasi</option>
                   <option value="Dijadwalkan Mobilisasi" ${e.status === 'Dijadwalkan Mobilisasi' ? 'selected' : ''}>Dijadwalkan</option>
                   <option value="Maintenance / Rusak" ${e.status === 'Maintenance / Rusak' ? 'selected' : ''}>Maintenance</option>
                   <option value="Selesai Demobilisasi" ${e.status === 'Selesai Demobilisasi' ? 'selected' : ''}>Demobilisasi</option>
               </select>
               <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteHeavyEquipment(${e.id})" title="Hapus">
                   <i class="bi bi-trash"></i>
               </button>`
            : `<span class="badge bg-light text-muted border py-1 px-2" title="Hanya Koordinator Logistik / Admin yang berhak"><i class="bi bi-lock-fill me-1"></i>Hanya Lihat</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="fw-bold text-dark d-block">${escapeHtml(e.nama_alat)}</span>
                <span class="badge bg-light text-dark border font-monospace">${escapeHtml(e.kode_unit || '-')}</span>
            </td>
            <td><span class="badge bg-secondary-subtle text-secondary">${escapeHtml(e.kategori || '-')}</span></td>
            <td class="small">
                <strong><i class="bi bi-person me-1"></i>${escapeHtml(e.operator || '-')}</strong>
                <div class="text-muted"><i class="bi bi-building me-1"></i>${escapeHtml(e.vendor || '-')}</div>
            </td>
            <td class="small text-dark font-monospace">${e.tgl_masuk}</td>
            <td class="small text-danger font-monospace">${e.tgl_keluar}</td>
            <td>${siaBadge}</td>
            <td>${statusBadge}</td>
            <td class="text-center">
                ${actionsHtml}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateEquipmentStatus(id, newStatus) {
    if (!AuthManager.hasWriteAccess('logistics')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Logistik & Alat Berat.', true);
        return;
    }
    let equipment = DataStore.get(STORAGE_KEYS.EQUIPMENT);
    const item = equipment.find(e => e.id == id);
    if (item) {
        item.status = newStatus;
        DataStore.set(STORAGE_KEYS.EQUIPMENT, equipment);
        showToast(`Status operasional alat "${item.nama_alat}" diubah ke "${newStatus}".`);
        loadLogisticsData();
    }
}

function deleteHeavyEquipment(id) {
    if (!AuthManager.hasWriteAccess('logistics')) {
        showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Logistik & Alat Berat.', true);
        return;
    }
    if (!confirm('Hapus data alat berat ini?')) return;
    let equipment = DataStore.get(STORAGE_KEYS.EQUIPMENT);
    equipment = equipment.filter(e => e.id != id);
    DataStore.set(STORAGE_KEYS.EQUIPMENT, equipment);

    showToast('Data alat berat berhasil dihapus!');
    loadLogisticsData();
}

// ==============================================================================
// 11. FORM EVENT HANDLERS REGISTRATION
// ==============================================================================
function initFormHandlers() {
    // --------------------------------------------------------------------------
    // Autentikasi Portal: Form Sign In (Layar Awal Login)
    // --------------------------------------------------------------------------
    const portalFormSignIn = document.getElementById('portalFormSignIn');
    if (portalFormSignIn) {
        portalFormSignIn.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('portalLoginEmail')?.value || '';
            const pass = document.getElementById('portalLoginPassword')?.value || '';
            const alertEl = document.getElementById('portalLoginAlert');

            const res = AuthManager.login(email, pass);
            if (res.success) {
                if (alertEl) alertEl.classList.add('d-none');
                portalFormSignIn.reset();
                showToast(`Selamat datang, ${res.user.name}! Anda masuk sebagai ${ROLES_CONFIG[res.user.role]?.badgeText || res.user.role}.`);
            } else {
                if (alertEl) {
                    alertEl.textContent = res.message;
                    alertEl.classList.remove('d-none');
                }
            }
        });
    }

    // --------------------------------------------------------------------------
    // Autentikasi Portal: Form Registrasi Pekerja Baru (Layar Awal Login)
    // --------------------------------------------------------------------------
    const portalFormRegister = document.getElementById('portalFormRegister');
    if (portalFormRegister) {
        portalFormRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            const nama = document.getElementById('portalRegNama')?.value || '';
            const email = document.getElementById('portalRegEmail')?.value || '';
            const role = document.getElementById('portalRegRole')?.value || '';
            const pass = document.getElementById('portalRegPassword')?.value || '';
            const passConf = document.getElementById('portalRegPasswordConfirm')?.value || '';
            const alertEl = document.getElementById('portalRegAlert');

            if (pass !== passConf) {
                if (alertEl) {
                    alertEl.textContent = 'Password dan Konfirmasi Password tidak cocok!';
                    alertEl.classList.remove('d-none');
                }
                return;
            }

            const res = AuthManager.register({ name: nama, email, role, password: pass });
            if (res.success) {
                if (alertEl) alertEl.classList.add('d-none');
                portalFormRegister.reset();
                showToast(`Akun pekerja ${res.user.name} berhasil didaftarkan dan Anda langsung masuk!`);
            } else {
                if (alertEl) {
                    alertEl.textContent = res.message;
                    alertEl.classList.remove('d-none');
                }
            }
        });
    }

    // --------------------------------------------------------------------------
    // Autentikasi Modal: Form Sign In Pekerja (Email & Password di Dashboard)
    // --------------------------------------------------------------------------
    const formSignIn = document.getElementById('formSignIn');
    if (formSignIn) {
        formSignIn.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value || '';
            const pass = document.getElementById('loginPassword')?.value || '';
            const alertEl = document.getElementById('loginAlert');

            const res = AuthManager.login(email, pass);
            if (res.success) {
                if (alertEl) alertEl.classList.add('d-none');
                formSignIn.reset();
                const modalEl = document.getElementById('modalAuth');
                if (modalEl && window.bootstrap) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }
                showToast(`Selamat datang, ${res.user.name}! Anda masuk sebagai ${ROLES_CONFIG[res.user.role]?.badgeText || res.user.role}.`);
            } else {
                if (alertEl) {
                    alertEl.textContent = res.message;
                    alertEl.classList.remove('d-none');
                }
            }
        });
    }

    // --------------------------------------------------------------------------
    // Autentikasi: Form Registrasi Pekerja Baru
    // --------------------------------------------------------------------------
    const formRegister = document.getElementById('formRegister');
    if (formRegister) {
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            const nama = document.getElementById('regNama')?.value || '';
            const email = document.getElementById('regEmail')?.value || '';
            const role = document.getElementById('regRole')?.value || '';
            const pass = document.getElementById('regPassword')?.value || '';
            const passConf = document.getElementById('regPasswordConfirm')?.value || '';
            const alertEl = document.getElementById('regAlert');

            if (pass !== passConf) {
                if (alertEl) {
                    alertEl.textContent = 'Password dan Konfirmasi Password tidak cocok!';
                    alertEl.classList.remove('d-none');
                }
                return;
            }

            const res = AuthManager.register({ name: nama, email, role, password: pass });
            if (res.success) {
                if (alertEl) alertEl.classList.add('d-none');
                formRegister.reset();
                const modalEl = document.getElementById('modalAuth');
                if (modalEl && window.bootstrap) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }
                showToast(`Akun pekerja ${res.user.name} berhasil didaftarkan dan aktif!`);
            } else {
                if (alertEl) {
                    alertEl.textContent = res.message;
                    alertEl.classList.remove('d-none');
                }
            }
        });
    }

    // Slider & Number Input Sync pada Modal Update Progres
    const slider = document.getElementById('progRangeSlider');
    const numInput = document.getElementById('progInputNumber');
    if (slider && numInput) {
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            numInput.value = val;
            document.getElementById('progValDisplay').textContent = `${val.toFixed(2)}%`;
            const plan = parseFloat(document.getElementById('progWbsPlan').textContent) || 0;
            updateDeviationDisplay(val, plan);
        });
        numInput.addEventListener('input', (e) => {
            const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
            slider.value = val;
            document.getElementById('progValDisplay').textContent = `${val.toFixed(2)}%`;
            const plan = parseFloat(document.getElementById('progWbsPlan').textContent) || 0;
            updateDeviationDisplay(val, plan);
        });
    }

    // Form Update Progres WBS
    const formProg = document.getElementById('formUpdateProgress');
    if (formProg) {
        formProg.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!AuthManager.hasWriteAccess('schedules')) {
                showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Jadwal & Kurva S.', true);
                return;
            }
            const id = document.getElementById('progWbsId').value;
            const actual = Math.min(100, Math.max(0, parseFloat(document.getElementById('progInputNumber').value) || 0));

            let schedules = DataStore.get(STORAGE_KEYS.SCHEDULES);
            const task = schedules.find(s => s.id == id);
            if (task) {
                task.actual_progress = actual;
                if (actual >= 100) {
                    task.status = 'Selesai';
                } else if (actual > 0) {
                    task.status = (actual < (parseFloat(task.plan_progress) || 0) || task.delay_days > 0) ? 'Terlambat' : 'Sedang Berjalan';
                } else {
                    task.status = 'Belum Mulai';
                }
                DataStore.set(STORAGE_KEYS.SCHEDULES, schedules);
                DataStore.recalculateSCurve();

                showToast(`Progres realisasi WBS #${id} berhasil diupdate ke ${actual}%!`);

                const modalEl = document.getElementById('modalUpdateProgress');
                if (modalEl && window.bootstrap) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }

                loadSchedulesData();
                loadSCurveData();
                fetchSummaryStats();
            }
        });
    }

    // Form: Tambah / Edit Material
    const formMaterial = document.getElementById('formMaterial');
    if (formMaterial) {
        formMaterial.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!AuthManager.hasWriteAccess('materials')) {
                showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Material.', true);
                return;
            }
            const id = document.getElementById('matId').value;
            const nama = document.getElementById('matNama').value;
            const satuan = document.getElementById('matSatuan').value;
            const masuk = parseFloat(document.getElementById('matMasuk').value) || 0;
            const keluar = parseFloat(document.getElementById('matKeluar').value) || 0;
            const min = parseFloat(document.getElementById('matMin').value) || 0;
            const sisa = masuk - keluar;

            let materials = DataStore.get(STORAGE_KEYS.MATERIALS);

            if (id) {
                // Update
                const item = materials.find(m => m.id == id);
                if (item) {
                    item.nama_material = nama;
                    item.satuan = satuan;
                    item.stok_masuk = masuk;
                    item.stok_keluar = keluar;
                    item.sisa_stok = sisa;
                    item.min_stok = min;
                    item.perlu_reorder = sisa <= min ? 1 : 0;
                    item.updated_at = new Date().toISOString().substring(0, 16).replace('T', ' ');
                }
                showToast('Material berhasil diperbarui!');
            } else {
                // Create
                const newId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
                materials.unshift({
                    id: newId,
                    nama_material: nama,
                    satuan,
                    stok_masuk: masuk,
                    stok_keluar: keluar,
                    sisa_stok: sisa,
                    min_stok: min,
                    perlu_reorder: sisa <= min ? 1 : 0,
                    updated_at: new Date().toISOString().substring(0, 16).replace('T', ' ')
                });
                showToast('Material baru berhasil ditambahkan!');
            }

            DataStore.set(STORAGE_KEYS.MATERIALS, materials);
            formMaterial.reset();
            document.getElementById('matId').value = '';
            document.getElementById('modalMaterialTitle').textContent = 'Tambah Material Baru';

            const modalEl = document.getElementById('modalAddMaterial');
            if (modalEl && window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }

            loadMaterialsData();
            fetchSummaryStats();
        });
    }

    // Form: Tambah WBS Manual
    const formAddWbs = document.getElementById('formAddWbs');
    if (formAddWbs) {
        formAddWbs.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!AuthManager.hasWriteAccess('schedules')) {
                showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Jadwal & Kurva S.', true);
                return;
            }
            const nama = document.getElementById('wbsNama').value;
            const start = document.getElementById('wbsStart').value;
            const end = document.getElementById('wbsEnd').value;
            const bobot = parseFloat(document.getElementById('wbsBobot').value) || 10;
            const plan = parseFloat(document.getElementById('wbsPlan').value) || 100;
            const act = parseFloat(document.getElementById('wbsActual').value) || 0;

            let schedules = DataStore.get(STORAGE_KEYS.SCHEDULES);
            const newId = schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) + 1 : 1;

            schedules.push({
                id: newId,
                nama_pekerjaan: nama,
                start_date: start,
                end_date: end,
                plan_progress: plan,
                actual_progress: act,
                bobot,
                status: act >= 100 ? 'Selesai' : (act > 0 ? 'Sedang Berjalan' : 'Belum Mulai'),
                delay_days: 0,
                durasi_hari: Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000))
            });

            DataStore.set(STORAGE_KEYS.SCHEDULES, schedules);
            DataStore.recalculateSCurve();

            showToast('Pekerjaan WBS baru berhasil ditambahkan!');
            formAddWbs.reset();

            const modalEl = document.getElementById('modalAddWbs');
            if (modalEl && window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }

            loadSchedulesData();
            loadSCurveData();
            populateWbsDropdown();
            fetchSummaryStats();
        });
    }

    // ==============================================================================
    // Modul: Kebutuhan Tenaga Kerja (Form & Live Calculator Listeners)
    // ==============================================================================
    const formLabor = document.getElementById('formLaborRequirement');
    if (formLabor) {
        formLabor.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!AuthManager.hasWriteAccess('labor')) {
                showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Kebutuhan Tenaga Kerja.', true);
                return;
            }

            const nama = document.getElementById('laborNamaPekerjaan')?.value.trim();
            const volume = parseFloat(document.getElementById('laborVolume')?.value) || 0;
            const satuan = document.getElementById('laborSatuan')?.value || 'm³';
            const koefPekerja = parseFloat(document.getElementById('laborKoefPekerja')?.value) || 0;
            const koefTukang = parseFloat(document.getElementById('laborKoefTukang')?.value) || 0;
            const targetHari = parseInt(document.getElementById('laborTargetHari')?.value) || 1;
            const catatan = document.getElementById('laborCatatan')?.value.trim() || '';

            if (!nama || volume <= 0 || targetHari <= 0) {
                alert('Silakan lengkapi nama pekerjaan, volume, dan target hari dengan benar.');
                return;
            }

            const calc = calculateLaborValues(volume, koefPekerja, koefTukang, targetHari);

            let list = DataStore.get(STORAGE_KEYS.LABOR) || [];
            const newId = list.length > 0 ? Math.max(...list.map(l => l.id || 0)) + 1 : 1;

            const newItem = {
                id: newId,
                nama_pekerjaan: nama,
                volume: volume,
                satuan: satuan,
                koef_pekerja: koefPekerja,
                koef_tukang: koefTukang,
                target_hari: targetHari,
                total_oh_pekerja: parseFloat(calc.totalOhPekerja.toFixed(2)),
                total_oh_tukang: parseFloat(calc.totalOhTukang.toFixed(2)),
                total_oh: parseFloat(calc.totalOh.toFixed(2)),
                pekerja_per_hari: calc.pekerjaPerHari,
                tukang_per_hari: calc.tukangPerHari,
                total_pekerja_hari: calc.totalPekerjaHari,
                catatan: catatan,
                created_at: new Date().toISOString()
            };

            list.unshift(newItem);
            DataStore.set(STORAGE_KEYS.LABOR, list);

            showToast('Analisis kebutuhan tenaga kerja berhasil disimpan!');
            formLabor.reset();
            const presetSelect = document.getElementById('laborPresetSelect');
            if (presetSelect) presetSelect.value = '';
            const wbsSelect = document.getElementById('laborWbsSelect');
            if (wbsSelect) wbsSelect.value = '';

            updateLaborLivePreview();
            loadLaborData();
            fetchSummaryStats();
        });
    }

    // Preset AHSP Selection Handler
    const laborPresetSelect = document.getElementById('laborPresetSelect');
    if (laborPresetSelect) {
        laborPresetSelect.addEventListener('change', (e) => {
            const key = e.target.value;
            if (key && AHSP_PRESETS[key]) {
                const preset = AHSP_PRESETS[key];
                const elNama = document.getElementById('laborNamaPekerjaan');
                const elSat = document.getElementById('laborSatuan');
                const elKp = document.getElementById('laborKoefPekerja');
                const elKt = document.getElementById('laborKoefTukang');
                const elCat = document.getElementById('laborCatatan');

                if (elNama && (!elNama.value || elNama.dataset.presetManaged === "true")) {
                    elNama.value = preset.nama;
                    elNama.dataset.presetManaged = "true";
                } else if (elNama && !elNama.value) {
                    elNama.value = preset.nama;
                }
                if (elSat) elSat.value = preset.satuan;
                if (elKp) elKp.value = preset.koef_pekerja;
                if (elKt) elKt.value = preset.koef_tukang;
                if (elCat) elCat.value = preset.catatan;

                updateLaborLivePreview();
            }
        });
    }

    // WBS Selection Handler
    const laborWbsSelect = document.getElementById('laborWbsSelect');
    if (laborWbsSelect) {
        laborWbsSelect.addEventListener('change', (e) => {
            const opt = e.target.options[e.target.selectedIndex];
            if (opt && opt.dataset.nama) {
                const elNama = document.getElementById('laborNamaPekerjaan');
                const elTarget = document.getElementById('laborTargetHari');
                if (elNama) elNama.value = opt.dataset.nama;
                if (elTarget && opt.dataset.durasi) elTarget.value = opt.dataset.durasi;
                updateLaborLivePreview();
            }
        });
    }

    // Live Real-Time Typing Preview Listeners
    ['laborVolume', 'laborKoefPekerja', 'laborKoefTukang', 'laborTargetHari'].forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            input.addEventListener('input', updateLaborLivePreview);
            input.addEventListener('change', updateLaborLivePreview);
        }
    });

    // Inisialisasi awal live preview
    updateLaborLivePreview();

    // Form: Quality Control (QC) & Inspeksi Mutu
    const formQc = document.getElementById('formQualityControl');
    if (formQc) {
        formQc.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!AuthManager.hasWriteAccess('qc')) {
                showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Quality Control.', true);
                return;
            }
            const fileInput = document.getElementById('qcFoto');
            let photoDataUrl = null;
            if (fileInput && fileInput.files && fileInput.files[0]) {
                photoDataUrl = await compressImage(fileInput.files[0]);
            }

            const itemPekerjaan = document.getElementById('qcItemPekerjaan')?.value.trim();
            const kategori = document.getElementById('qcKategori')?.value;
            const tanggal = document.getElementById('qcTanggal')?.value;
            const metodeUji = document.getElementById('qcMetodeUji')?.value.trim();
            const standarAcuan = document.getElementById('qcStandarAcuan')?.value.trim() || '-';
            const pic = document.getElementById('qcPic')?.value.trim();
            const urgensi = document.getElementById('qcUrgensi')?.value;
            const status = document.getElementById('qcStatus')?.value;
            const deskripsi = document.getElementById('qcDeskripsi')?.value.trim();

            if (!itemPekerjaan || !tanggal || !pic) {
                alert('Silakan lengkapi item pekerjaan, tanggal inspeksi, dan PIC QC.');
                return;
            }

            let list = DataStore.get(STORAGE_KEYS.QUALITY_CONTROL) || [];
            const newId = list.length > 0 ? Math.max(...list.map(q => q.id || 0)) + 1 : 1;

            list.unshift({
                id: newId,
                item_pekerjaan: itemPekerjaan,
                kategori,
                metode_uji: metodeUji,
                standar_acuan: standarAcuan,
                tanggal_inspeksi: tanggal,
                pic,
                urgensi,
                status,
                deskripsi,
                foto_inspeksi: photoDataUrl,
                created_at: new Date().toISOString()
            });

            DataStore.set(STORAGE_KEYS.QUALITY_CONTROL, list);
            showToast('Laporan inspeksi Quality Control berhasil disimpan!');
            formQc.reset();
            const qcTglEl = document.getElementById('qcTanggal');
            if (qcTglEl) qcTglEl.value = new Date().toISOString().split('T')[0];

            loadQualityControlData();
            fetchSummaryStats();
        });
    }

    // Form: Input Risiko Baru (Risk Impact Engine)
    const formRisk = document.getElementById('formRisk');
    if (formRisk) {
        formRisk.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!AuthManager.hasWriteAccess('risks')) {
                showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Analisis Risiko.', true);
                return;
            }
            const nama = document.getElementById('riskNama').value;
            const kategori = document.getElementById('riskKategori').value;
            const wbsId = parseInt(document.getElementById('riskWbsSelect').value);
            const prob = Math.min(5, Math.max(1, parseInt(document.getElementById('riskProb').value) || 1));
            const imp = Math.min(5, Math.max(1, parseInt(document.getElementById('riskImpact').value) || 1));
            const mitigasi = document.getElementById('riskMitigasi').value;
            const status = document.getElementById('riskStatus').value;
            const score = prob * imp;

            let level = 'Low';
            if (score >= 20) level = 'Critical';
            else if (score >= 12) level = 'High';
            else if (score >= 6) level = 'Medium';

            let schedules = DataStore.get(STORAGE_KEYS.SCHEDULES);
            const targetWbs = schedules.find(s => s.id == wbsId);
            const wbsName = targetWbs ? targetWbs.nama_pekerjaan : `WBS #${wbsId}`;

            let engineNotice = '';

            // CIVIL ENGINEERING RISK IMPACT ENGINE
            if (targetWbs && (level === 'Critical' || level === 'High')) {
                const addedDays = level === 'Critical' ? 7 : 3;
                const progressLagPenalty = level === 'Critical' ? 10.0 : 5.0;

                const curEnd = new Date(targetWbs.end_date);
                curEnd.setDate(curEnd.getDate() + addedDays);
                targetWbs.end_date = curEnd.toISOString().substring(0, 10);
                targetWbs.delay_days = (targetWbs.delay_days || 0) + addedDays;
                targetWbs.actual_progress = Math.max(0, (parseFloat(targetWbs.actual_progress) || 0) - progressLagPenalty);
                targetWbs.status = targetWbs.actual_progress >= 100 ? 'Selesai' : 'Terlambat';

                DataStore.set(STORAGE_KEYS.SCHEDULES, schedules);
                DataStore.recalculateSCurve();

                engineNotice = `⚠️ [RISK IMPACT ENGINE AKTIF] Risiko level ${level} (Skor: ${score}) menambah +${addedDays} hari pada WBS #${wbsId} dan Kurva S Realisasi telah dirender ulang!`;
            }

            let risks = DataStore.get(STORAGE_KEYS.RISKS);
            const newId = risks.length > 0 ? Math.max(...risks.map(r => r.id)) + 1 : 1;

            risks.unshift({
                id: newId,
                nama_risiko: nama,
                kategori,
                probability: prob,
                impact: imp,
                score,
                level,
                mitigasi,
                status,
                pekerjaan_id: wbsId,
                nama_pekerjaan: wbsName
            });

            DataStore.set(STORAGE_KEYS.RISKS, risks);

            if (engineNotice) {
                showToast(engineNotice, false);
            } else {
                showToast(`Risiko baru berhasil dicatat dengan tingkat: ${level}`);
            }

            formRisk.reset();
            updateRiskScorePreview();

            loadRisksData();
            loadRiskMatrix();
            loadSchedulesData();
            loadSCurveData();
            fetchSummaryStats();
        });
    }

    // Form: Registrasi Timbulan Limbah
    const formWaste = document.getElementById('formWaste');
    if (formWaste) {
        formWaste.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                if (!AuthManager.hasWriteAccess('waste')) {
                    showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Manajemen Limbah.', true);
                    return;
                }

                const nama = document.getElementById('wasteNama')?.value?.trim();
                if (!nama) {
                    showToast('Mohon isi "Nama / Jenis Material Limbah" di bagian atas formulir!', true);
                    const elNama = document.getElementById('wasteNama');
                    if (elNama) {
                        elNama.focus();
                        elNama.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }

                const volume = parseFloat(document.getElementById('wasteVolume')?.value);
                if (isNaN(volume) || volume <= 0) {
                    showToast('Mohon masukkan jumlah / volume limbah yang valid (angka lebih dari 0)!', true);
                    const elVol = document.getElementById('wasteVolume');
                    if (elVol) {
                        elVol.focus();
                        elVol.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }

                const fileInput = document.getElementById('wasteFile');
                let manifestDataUrl = null;
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    manifestDataUrl = await compressImage(fileInput.files[0]);
                }

                const tanggal = document.getElementById('wasteTanggal')?.value || new Date().toISOString().split('T')[0];
                const kategori = document.getElementById('wasteKategori')?.value || 'Limbah Padat Daur Ulang';
                const satuan = document.getElementById('wasteSatuan')?.value || 'Kg';
                const metode = document.getElementById('wasteMetode')?.value || 'Recycle';
                const status = document.getElementById('wasteStatus')?.value || 'Tersimpan di TPS';
                const vendor = document.getElementById('wasteVendor')?.value || '';
                const keterangan = document.getElementById('wasteKeterangan')?.value || '';

                let list = DataStore.get(STORAGE_KEYS.WASTE);
                const newId = list.length > 0 ? Math.max(...list.map(w => w.id)) + 1 : 1;

                list.unshift({
                    id: newId,
                    tanggal,
                    nama_limbah: nama,
                    kategori,
                    volume,
                    satuan,
                    metode_pengelolaan: metode,
                    vendor_pengolah: vendor,
                    status,
                    keterangan,
                    bukti_manifest: manifestDataUrl,
                    created_at: new Date().toISOString().substring(0, 16).replace('T', ' ')
                });

                DataStore.set(STORAGE_KEYS.WASTE, list);
                showToast('Data neraca limbah konstruksi berhasil dicatat!');
                formWaste.reset();
                document.getElementById('wasteTanggal').value = new Date().toISOString().split('T')[0];

                loadWasteData();
                loadWasteStats();
            } catch (err) {
                console.error('Error saat menyimpan data limbah:', err);
                showToast('Terjadi kesalahan saat menyimpan data: ' + err.message, true);
            }
        });
    }

// ==============================================================================
// 10. HELPER PARSER & IMPORT JADWAL (.MPP / .XML / .XLSX / .CSV)
// ==============================================================================
function normalizeScheduleDate(val, fallbackDaysFromNow = 0) {
    if (!val) {
        return new Date(Date.now() + fallbackDaysFromNow * 86400000).toISOString().substring(0, 10);
    }
    if (val instanceof Date && !isNaN(val)) {
        return val.toISOString().substring(0, 10);
    }
    const num = Number(val);
    if (!isNaN(num) && num > 30000 && num < 70000) {
        const epoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(epoch.getTime() + num * 86400000);
        return date.toISOString().substring(0, 10);
    }

    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.substring(0, 10);
    }
    const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dmy) {
        const d = dmy[1].padStart(2, '0');
        const m = dmy[2].padStart(2, '0');
        const y = dmy[3];
        return `${y}-${m}-${d}`;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().substring(0, 10);
    }

    return new Date(Date.now() + fallbackDaysFromNow * 86400000).toISOString().substring(0, 10);
}

function downloadCsvTemplate() {
    const csvContent = "Nama Pekerjaan,Tanggal Mulai,Tanggal Selesai,Progres Aktual (%),Bobot (%)\n" +
        "Pekerjaan Persiapan & Manajemen K3,2026-12-01,2026-12-14,100,5.00\n" +
        "Pekerjaan Tanah & Galian Pondasi,2026-12-05,2026-12-25,100,8.00\n" +
        "Pekerjaan Pondasi Bore Pile & Tiang Pancang,2026-12-15,2027-01-15,85,15.00\n" +
        "Pekerjaan Struktur Kolom Balok Lt 1,2027-01-05,2027-02-10,50,20.00\n" +
        "Pekerjaan Struktur Kolom Balok Lt 2,2027-01-25,2027-03-05,20,18.00\n" +
        "Pekerjaan Dinding Bata Ringan & Plesteran,2027-02-15,2027-03-25,0,12.00\n" +
        "Pekerjaan Atap & Insulasi Green Building,2027-03-01,2027-04-15,0,10.00\n" +
        "Pekerjaan MEP & Solar PV Panel Rooftop,2027-03-15,2027-05-01,0,8.00\n" +
        "Pekerjaan Finishing & Uji Mutu QC,2027-04-15,2027-05-20,0,4.00\n";

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Jadwal_WBS_KurvaS.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') {
        showToast('Template file jadwal WBS (.csv) berhasil diunduh! Silakan buka di Excel lalu upload kembali.');
    }
}

function openMppGuideModal() {
    const modalEl = document.getElementById('modalMppGuide');
    if (modalEl && window.bootstrap) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

function extractStringsFromMpp(buffer) {
    const bytes = new Uint8Array(buffer);
    const tasksFound = [];
    const seen = new Set();

    let currentChars = [];
    for (let i = 0; i < bytes.length - 1; i += 2) {
        const code = bytes[i] | (bytes[i + 1] << 8);
        if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) {
            currentChars.push(String.fromCharCode(code));
        } else {
            if (currentChars.length >= 4 && currentChars.length <= 90) {
                const str = currentChars.join('').trim();
                if (isLikelyTaskName(str) && !seen.has(str.toLowerCase())) {
                    seen.add(str.toLowerCase());
                    tasksFound.push(str);
                }
            }
            currentChars = [];
        }
    }

    if (tasksFound.length < 3) {
        let asciiChars = [];
        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];
            if ((b >= 32 && b <= 126) || (b >= 160 && b <= 255)) {
                asciiChars.push(String.fromCharCode(b));
            } else {
                if (asciiChars.length >= 4 && asciiChars.length <= 90) {
                    const str = asciiChars.join('').trim();
                    if (isLikelyTaskName(str) && !seen.has(str.toLowerCase())) {
                        seen.add(str.toLowerCase());
                        tasksFound.push(str);
                    }
                }
                asciiChars = [];
            }
        }
    }

    return tasksFound;
}

function isLikelyTaskName(str) {
    if (!str || str.length < 4) return false;
    if (/^(xmlns|xml|http|ms-project|props|root|catalog|schema|ole|font|calibri|arial|table|view|standard|project|microsoft|summary|outline|duration|work|resource|calendar|guid|true|false)/i.test(str)) {
        return false;
    }
    if (!/[a-zA-Z]{3,}/.test(str)) return false;
    if (/[<>{}\\]/.test(str)) return false;
    if (str.includes('/') || str.includes('://')) return false;
    return true;
}

function parseXmlScheduleFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const xmlStr = e.target.result;
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
                const taskNodes = xmlDoc.getElementsByTagName('Task');
                const parsed = [];

                for (let i = 0; i < taskNodes.length; i++) {
                    const t = taskNodes[i];
                    const nameNode = t.getElementsByTagName('Name')[0];
                    const startNode = t.getElementsByTagName('Start')[0];
                    const finishNode = t.getElementsByTagName('Finish')[0];
                    const pctNode = t.getElementsByTagName('PercentComplete')[0];
                    const uidNode = t.getElementsByTagName('UID')[0];

                    if (nameNode) {
                        const name = nameNode.textContent.trim();
                        if (name && uidNode && uidNode.textContent.trim() === '0') continue;
                        if (name && !name.toLowerCase().includes('project summary')) {
                            const start = startNode ? normalizeScheduleDate(startNode.textContent) : new Date().toISOString().substring(0, 10);
                            const end = finishNode ? normalizeScheduleDate(finishNode.textContent, 14) : new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10);
                            const prog = pctNode ? parseFloat(pctNode.textContent) || 0 : 0;

                            parsed.push({
                                name,
                                start,
                                end,
                                progress: prog
                            });
                        }
                    }
                }
                resolve(parsed);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function parseExcelScheduleFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (typeof XLSX === 'undefined') {
                    throw new Error('Pustaka SheetJS belum selesai dimuat. Silakan periksa koneksi internet.');
                }
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheet = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheet];
                const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                if (!rawRows || rawRows.length === 0) {
                    return resolve([]);
                }

                const parsed = [];
                rawRows.forEach((row, idx) => {
                    const keys = Object.keys(row);
                    if (keys.length === 0) return;

                    const nameKey = keys.find(k => /nama|task|pekerjaan|wbs|item|uraian/i.test(k)) || keys[0];
                    const startKey = keys.find(k => /mulai|start|awal|dari/i.test(k));
                    const endKey = keys.find(k => /selesai|finish|end|target|sampai/i.test(k));
                    const progKey = keys.find(k => /progres|progress|realisasi|aktual|%/i.test(k));
                    const bobotKey = keys.find(k => /bobot|weight/i.test(k));

                    const nameVal = String(row[nameKey] || '').trim();
                    if (!nameVal || nameVal.toLowerCase() === 'total' || nameVal.toLowerCase().includes('project summary')) return;

                    const startVal = startKey ? row[startKey] : null;
                    const endVal = endKey ? row[endKey] : null;
                    const progVal = progKey ? parseFloat(row[progKey]) || 0 : 0;
                    const bobotVal = bobotKey ? parseFloat(row[bobotKey]) || 0 : 0;

                    parsed.push({
                        name: nameVal,
                        start: normalizeScheduleDate(startVal, idx * 5),
                        end: normalizeScheduleDate(endVal, (idx + 1) * 12),
                        progress: progVal,
                        bobot: bobotVal
                    });
                });

                resolve(parsed);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function parseCsvScheduleFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (typeof XLSX !== 'undefined') {
                    const workbook = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                    if (rawRows && rawRows.length > 0) {
                        const parsed = [];
                        rawRows.forEach((row, idx) => {
                            const keys = Object.keys(row);
                            const nameKey = keys.find(k => /nama|task|pekerjaan|wbs|item|uraian/i.test(k)) || keys[0];
                            const startKey = keys.find(k => /mulai|start|awal|dari/i.test(k));
                            const endKey = keys.find(k => /selesai|finish|end|target|sampai/i.test(k));
                            const progKey = keys.find(k => /progres|progress|realisasi|aktual|%/i.test(k));
                            const bobotKey = keys.find(k => /bobot|weight/i.test(k));

                            const nameVal = String(row[nameKey] || '').trim();
                            if (!nameVal || nameVal.toLowerCase() === 'total') return;

                            parsed.push({
                                name: nameVal,
                                start: normalizeScheduleDate(row[startKey], idx * 5),
                                end: normalizeScheduleDate(row[endKey], (idx + 1) * 12),
                                progress: progKey ? parseFloat(row[progKey]) || 0 : 0,
                                bobot: bobotKey ? parseFloat(row[bobotKey]) || 0 : 0
                            });
                        });
                        return resolve(parsed);
                    }
                }

                const text = e.target.result;
                const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                if (lines.length <= 1) return resolve([]);

                const firstLine = lines[0];
                const delimiter = firstLine.includes(';') ? ';' : (firstLine.includes('\t') ? '\t' : ',');
                const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));

                const nameIdx = headers.findIndex(h => /nama|task|pekerjaan|wbs|item/i.test(h));
                const startIdx = headers.findIndex(h => /mulai|start|awal/i.test(h));
                const endIdx = headers.findIndex(h => /selesai|finish|end|target/i.test(h));
                const progIdx = headers.findIndex(h => /progres|progress|realisasi|%/i.test(h));
                const bobotIdx = headers.findIndex(h => /bobot|weight/i.test(h));

                const parsed = [];
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
                    const name = cols[nameIdx !== -1 ? nameIdx : 0];
                    if (!name || name.length < 2 || name.toLowerCase() === 'total') continue;

                    const start = cols[startIdx !== -1 ? startIdx : 1];
                    const end = cols[endIdx !== -1 ? endIdx : 2];
                    const prog = cols[progIdx !== -1 ? progIdx : 3];
                    const bobot = cols[bobotIdx !== -1 ? bobotIdx : 4];

                    parsed.push({
                        name,
                        start: normalizeScheduleDate(start, (i - 1) * 5),
                        end: normalizeScheduleDate(end, i * 12),
                        progress: parseFloat(prog) || 0,
                        bobot: parseFloat(bobot) || 0
                    });
                }
                resolve(parsed);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function parseMppScheduleFile(file) {
    return new Promise((resolve) => {
        // Format .MPP adalah file biner OLE2 terkompresi buatan Microsoft.
        // Membaca file biner secara mentah akan menghasilkan metadata sistem seperti CompObj, DocumentSummaryInformation, dll.
        // Cara resmi dan 100% presisi adalah dengan menyimpannya sebagai XML (*.xml) atau Excel/CSV dari MS Project.
        openMppGuideModal();
        resolve([]);
    });
}

    // Form: Upload & Parsing Jadwal WBS (.mpp / .xml / .xlsx / .csv)
    const formXml = document.getElementById('formXmlUpload');
    if (formXml) {
        formXml.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!AuthManager.hasWriteAccess('schedules')) {
                showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Jadwal & Kurva S.', true);
                return;
            }
            const fileInput = document.getElementById('inputXmlFile');
            if (!fileInput.files || fileInput.files.length === 0) {
                showToast('Pilih file jadwal (.mpp, .xml, .xlsx, atau .csv) terlebih dahulu!', true);
                return;
            }

            const file = fileInput.files[0];
            const ext = file.name.split('.').pop().toLowerCase();

            try {
                let parsedTasks = [];

                if (ext === 'xlsx' || ext === 'xls') {
                    parsedTasks = await parseExcelScheduleFile(file);
                } else if (ext === 'csv') {
                    parsedTasks = await parseCsvScheduleFile(file);
                } else if (ext === 'xml') {
                    parsedTasks = await parseXmlScheduleFile(file);
                } else if (ext === 'mpp') {
                    parsedTasks = await parseMppScheduleFile(file);
                } else {
                    showToast('Format file tidak didukung. Harap pilih file .mpp, .xml, .xlsx, atau .csv!', true);
                    return;
                }

                if (!parsedTasks || parsedTasks.length === 0) {
                    return;
                }

                let totalDays = 0;
                parsedTasks.forEach(t => {
                    const s = new Date(t.start);
                    const e = new Date(t.end);
                    const diff = Math.max(1, Math.ceil((e - s) / 86400000));
                    t.duration = diff;
                    totalDays += diff;
                });

                const newSchedules = parsedTasks.map((t, idx) => ({
                    id: idx + 1,
                    nama_pekerjaan: t.name,
                    start_date: t.start,
                    end_date: t.end,
                    plan_progress: 100.00,
                    actual_progress: Math.min(100, Math.max(0, t.progress || 0)),
                    bobot: t.bobot && t.bobot > 0 ? t.bobot : parseFloat(((t.duration / totalDays) * 100).toFixed(2)),
                    status: (t.progress >= 100) ? 'Selesai' : (t.progress > 0 ? 'Sedang Berjalan' : 'Belum Mulai'),
                    delay_days: 0,
                    durasi_hari: t.duration
                }));

                const totalBobot = newSchedules.reduce((acc, s) => acc + (parseFloat(s.bobot) || 0), 0);
                if (totalBobot > 0 && Math.abs(totalBobot - 100) > 1) {
                    newSchedules.forEach(s => {
                        s.bobot = parseFloat(((s.bobot / totalBobot) * 100).toFixed(2));
                    });
                }

                DataStore.set(STORAGE_KEYS.SCHEDULES, newSchedules);
                DataStore.set(STORAGE_KEYS.RISKS, []);
                DataStore.recalculateSCurve();

                showToast(`Berhasil mengimpor ${newSchedules.length} paket pekerjaan WBS dan Kurva S telah dikalkulasi ulang!`);
                formXml.reset();

                loadSchedulesData();
                loadSCurveData();
                populateWbsDropdown();
                loadRisksData();
                loadRiskMatrix();
                fetchSummaryStats();
            } catch (err) {
                console.error('Error importing schedule file:', err);
                showToast('Gagal memproses file jadwal: ' + err.message, true);
            }
        });
    }

    // Form: Jadwalkan Kedatangan Material Baru (Base64 Surat Jalan)
    const formDeliv = document.getElementById('formMaterialDelivery');
    if (formDeliv) {
        formDeliv.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!AuthManager.hasWriteAccess('logistics')) {
                showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Logistik & Alat Berat.', true);
                return;
            }
            const fileInput = document.getElementById('delivSuratJalan');
            let suratJalanUrl = null;
            if (fileInput && fileInput.files && fileInput.files[0]) {
                suratJalanUrl = await compressImage(fileInput.files[0]);
            }

            const nama = document.getElementById('delivNama').value;
            const volume = parseFloat(document.getElementById('delivVolume').value) || 0;
            const satuan = document.getElementById('delivSatuan').value;
            const vendor = document.getElementById('delivVendor').value;
            const tanggal = document.getElementById('delivTanggal').value;
            const jam = document.getElementById('delivJam').value;
            const titikDrop = document.getElementById('delivTitikDrop').value;
            const status = document.getElementById('delivStatus').value;

            let deliveries = DataStore.get(STORAGE_KEYS.DELIVERIES);
            const newId = deliveries.length > 0 ? Math.max(...deliveries.map(d => d.id)) + 1 : 1;

            deliveries.unshift({
                id: newId,
                nama_material: nama,
                volume,
                satuan,
                vendor,
                tanggal,
                jam,
                titik_drop: titikDrop,
                status,
                surat_jalan: suratJalanUrl
            });

            DataStore.set(STORAGE_KEYS.DELIVERIES, deliveries);

            // Jika status langsung 'Tiba & Lolos QC', otomatis sinkronkan ke stok material
            if (status === 'Tiba & Lolos QC') {
                let materials = DataStore.get(STORAGE_KEYS.MATERIALS);
                let targetMat = materials.find(m => m.nama_material.toLowerCase().trim() === nama.toLowerCase().trim());
                if (targetMat) {
                    targetMat.stok_masuk = (parseFloat(targetMat.stok_masuk) || 0) + volume;
                    targetMat.sisa_stok = (parseFloat(targetMat.stok_masuk) || 0) - (parseFloat(targetMat.stok_keluar) || 0);
                    targetMat.perlu_reorder = targetMat.sisa_stok <= (parseFloat(targetMat.min_stok) || 0) ? 1 : 0;
                    targetMat.updated_at = new Date().toISOString().substring(0, 16).replace('T', ' ');
                }
                DataStore.set(STORAGE_KEYS.MATERIALS, materials);
                loadMaterialsData();
            }

            showToast('Jadwal kedatangan material berhasil disimpan!');
            formDeliv.reset();
            document.getElementById('delivTanggal').value = new Date().toISOString().split('T')[0];

            const modalEl = document.getElementById('modalAddMaterialDelivery');
            if (modalEl && window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }

            loadLogisticsData();
            fetchSummaryStats();
        });
    }

    // Form: Registrasi Mobilisasi Alat Berat
    const formEquip = document.getElementById('formHeavyEquipment');
    if (formEquip) {
        formEquip.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!AuthManager.hasWriteAccess('logistics')) {
                showToast('Akses Dibatasi: Anda hanya memiliki hak lihat untuk Modul Logistik & Alat Berat.', true);
                return;
            }
            const nama = document.getElementById('equipNama').value;
            const kode = document.getElementById('equipKode').value;
            const kategori = document.getElementById('equipKategori').value;
            const operator = document.getElementById('equipOperator').value;
            const vendor = document.getElementById('equipVendor').value;
            const tglMasuk = document.getElementById('equipTglMasuk').value;
            const tglKeluar = document.getElementById('equipTglKeluar').value;
            const statusSia = document.getElementById('equipSIA').value;
            const status = document.getElementById('equipStatus').value;

            let equipment = DataStore.get(STORAGE_KEYS.EQUIPMENT);
            const newId = equipment.length > 0 ? Math.max(...equipment.map(e => e.id)) + 1 : 1;

            equipment.unshift({
                id: newId,
                nama_alat: nama,
                kode_unit: kode,
                kategori,
                operator,
                vendor,
                tgl_masuk: tglMasuk,
                tgl_keluar: tglKeluar,
                status_sia: statusSia,
                status
            });

            DataStore.set(STORAGE_KEYS.EQUIPMENT, equipment);
            showToast('Data mobilisasi alat berat berhasil disimpan!');
            formEquip.reset();
            document.getElementById('equipTglMasuk').value = new Date().toISOString().split('T')[0];

            const modalEl = document.getElementById('modalAddEquipment');
            if (modalEl && window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }

            loadLogisticsData();
        });
    }
}
