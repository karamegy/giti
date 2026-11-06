// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAekw5iD-7t-BeRbrVBykXNWqtY0C7y7ug",
    authDomain: "tarazan-284f3.firebaseapp.com",
    projectId: "tarazan-284f3",
    storageBucket: "tarazan-284f3.firebasestorage.app",
    messagingSenderId: "382519802983",
    appId: "1:382519802983:web:c5826a8cdba73335a528c2",
    measurementId: "G-KCRSY63RTC"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// 1. التحقق من نتيجة إعادة التوجيه عند فتح التطبيق (خاصة بتطبيقات الموبايل والـ WebView)
auth.getRedirectResult().then(async (result) => {
    if (result && result.user) {
        await processGoogleUser(result.user);
    }
}).catch((error) => {
    console.error("خطأ في استكمال تسجيل الدخول عبر Google:", error);
});

// تحسين أداء اللعبة وتنظيف العناصر (DOM Garbage Collector)
const GamePerformanceOptimizer = {
    lastFrameTime: performance.now(),
    fps: 60,
    targetDelta: 1000 / 60,
    cleanUpThreshold: 40,
    optimizeDOM() {
        const garbage = document.querySelectorAll('.explosion, .laser-l1:not([style*="bottom"]), .item:not([style*="top"])');
        if (garbage.length > 20) {
            garbage.forEach(el => el.remove());
        }
    }
};

// التقط عناصر الواجهة
const gameContainer = document.getElementById('game-container');
const deepSpaceBg = document.getElementById('deep-space-bg');
const loginScreen = document.getElementById('login-screen');
const mainMenu = document.getElementById('main-menu');
const bottomNavBar = document.getElementById('bottom-nav-bar');
const topProfileBadge = document.getElementById('top-profile-badge');
const shopModal = document.getElementById('shop-modal');
const gameScreen = document.getElementById('game-screen');
const splitScreenContainer = document.getElementById('split-screen-container');
const lordStoreScreen = document.getElementById('lord-store-screen');
const ui = document.getElementById('ui');
const controls = document.getElementById('controls');
const player = document.getElementById('player');
const floatingStoreBtn = document.getElementById('floating-store-btn');

const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const welcomeTitle = document.getElementById('welcome-title');
const userStatusDesc = document.getElementById('user-status-desc');
const profileAvatarIcon = document.getElementById('profile-avatar-icon');
const profileDisplayName = document.getElementById('profile-display-name');
const profileDisplayRank = document.getElementById('profile-display-rank');
const screenTitle = document.getElementById('screen-title');
const screenDesc = document.getElementById('screen-desc');
const highScoreText = document.getElementById('high-score-text');
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const liveGemsDisplay = document.getElementById('live-gems');
const chatMessagesBox = document.getElementById('chat-messages-box');
const chatTextInput = document.getElementById('chat-text-input');
const navAdminBtn = document.getElementById('nav-admin-btn');
const adminUsersList = document.getElementById('admin-users-list');
const fireBtn = document.getElementById('fire-btn');

// بيانات اللاعب والحالة
let currentPlayer = localStorage.getItem('currentSpacePilotV10') || '';
let currentPilotData = {
    name: '',
    highScores: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0},
    ship: '🛸',
    gems: 1500,
    stars: 3500,
    inventory: [],
    isBanned: false,
    isMuted: false,
    isAdmin: false
};

let isTouchingScreen = false;
let selectedShipIcon = '🛸';

// التعامل مع لمس وتحريك المركبة
gameContainer.addEventListener('touchstart', (e) => {
    if (!isPlaying || isPaused) return;
    if (e.target.closest('#controls') || e.target.closest('#ui') || e.target.closest('#floating-store-btn') || e.target.closest('#split-screen-container')) return;
    isTouchingScreen = true;
    updateTouchPosition(e.touches[0].clientX);
}, { passive: true });

gameContainer.addEventListener('touchmove', (e) => {
    if (!isPlaying || isPaused || !isTouchingScreen) return;
    if (e.target.closest('#split-screen-container')) return;
    updateTouchPosition(e.touches[0].clientX);
}, { passive: true });

gameContainer.addEventListener('touchend', () => { isTouchingScreen = false; });

gameContainer.addEventListener('mousedown', (e) => {
    if (!isPlaying || isPaused) return;
    if (e.target.closest('#controls') || e.target.closest('#ui') || e.target.closest('#floating-store-btn') || e.target.closest('#split-screen-container')) return;
    isTouchingScreen = true;
    updateTouchPosition(e.clientX);
});

window.addEventListener('mousemove', (e) => {
    if (!isPlaying || isPaused || !isTouchingScreen) return;
    updateTouchPosition(e.clientX);
});

window.addEventListener('mouseup', () => { isTouchingScreen = false; });

function updateTouchPosition(clientX) {
    requestAnimationFrame(() => {
        const rect = gameContainer.getBoundingClientRect();
        playerX = clientX - rect.left;
        if (playerX < 35) playerX = 35;
        if (playerX > rect.width - 35) playerX = rect.width - 35;
        player.style.left = playerX + 'px';
    });
}

// أحداث زر الإطلاق
fireBtn.addEventListener('mousedown', onFireButtonDown);
fireBtn.addEventListener('mouseup', onFireButtonUp);
fireBtn.addEventListener('mouseleave', onFireButtonUp);
fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); onFireButtonDown(); });
fireBtn.addEventListener('touchend', onFireButtonUp);

function onFireButtonDown() {
    if (!isPlaying || isPaused) return;
    if (isAutoFire) { disableAutoFire(); return; }
    firePressTimer = setTimeout(() => { enableAutoFire(); }, 350);
}

function onFireButtonUp() {
    if (!isPlaying || isPaused) return;
    if (firePressTimer) {
        clearTimeout(firePressTimer);
        firePressTimer = null;
        if (!isAutoFire) { fireWeapon(); }
    }
}

// التحقق من الجلسة السابقة
if (currentPlayer) {
    loadPlayerDataFromCloud(currentPlayer, (data) => {
        if (data) {
            if (data.isBanned) {
                alert('❌ حسابك محظور نهائياً من قبل الإدارة.');
                logoutPlayer();
                return;
            }
            currentPilotData = data;
        }
        checkKidsAccountAndApplyTheme(currentPlayer);
        updateUserInterfaceProfile();
        loginScreen.style.display = 'none';
        mainMenu.style.display = 'flex';
        bottomNavBar.style.display = 'flex';
        topProfileBadge.style.display = 'flex';
        floatingStoreBtn.style.display = 'flex';
        checkAdminPermissions();
        initChatListener();
    });
}

function switchSection(sectionId, btnElement) {
    document.querySelectorAll('.section-container').forEach(sec => sec.classList.remove('active-section'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active-section');
    btnElement.classList.add('active');
}

function checkAdminPermissions() {
    if (currentPlayer === 'admin' || currentPilotData.isAdmin) {
        navAdminBtn.style.display = 'flex';
    } else {
        navAdminBtn.style.display = 'none';
    }
}

// 2. دالة معالجة بيانات المستخدم بعد نجاح تسجيل الدخول من Google
async function processGoogleUser(user) {
    let name = user.displayName || user.email.split('@')[0];

    const docRef = db.collection("spacePilotsV10").doc(name);
    let doc = await docRef.get();

    if (doc.exists && doc.data().isBanned) {
        alert('❌ هذا الحساب محظور من دخول التطبيق.');
        return;
    }

    if (!doc.exists) {
        currentPilotData = {
            name: name,
            password: '',
            highScores: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0},
            ship: '🛸',
            gems: 1500,
            stars: 3500,
            inventory: [],
            isBanned: false,
            isMuted: false,
            isAdmin: (name === 'admin'),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };
        await docRef.set(currentPilotData);
    } else {
        currentPilotData = doc.data();
        currentPilotData.name = name;
        if (currentPilotData.gems === undefined) currentPilotData.gems = 1500;
        if (currentPilotData.stars === undefined) currentPilotData.stars = 3500;
    }

    currentPlayer = name;
    localStorage.setItem('currentSpacePilotV10', currentPlayer);

    alert(`🎉 أهلاً بك يا ${name}! تم تسجيل الدخول بنجاح عبر Google.`);
    checkKidsAccountAndApplyTheme(currentPlayer);
    updateUserInterfaceProfile();
    loginScreen.style.display = 'none';
    mainMenu.style.display = 'flex';
    bottomNavBar.style.display = 'flex';
    topProfileBadge.style.display = 'flex';
    floatingStoreBtn.style.display = 'flex';
    checkAdminPermissions();
    initChatListener();
}

// 3. دالة فتح نافذة Google الرسمية مع التبديل التلقائي لبيئة الموبايل
async function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // إجبار جوجل على إظهار نافذة اختيار الحساب الرسمية (Select Account Window)
    provider.setCustomParameters({
        prompt: 'select_account'
    });

    try {
        // المحاولة الأولى عبر النافذة المنبثقة (Popup)
        let result = await auth.signInWithPopup(provider);
        if (result && result.user) {
            await processGoogleUser(result.user);
        }
    } catch (error) {
        // في حال تم حظر النافذة المنبثقة داخل الأندرويد/WebView أو المتصفح، يتم التحويل لنموذج Redirect المعتمد
        if (error.code === 'auth/popup-blocked' || 
            error.code === 'auth/operation-not-supported-in-this-environment' || 
            error.code === 'auth/popup-closed-by-user') {
            try {
                await auth.signInWithRedirect(provider);
            } catch (redirectErr) {
                alert('❌ تعذر فتح نافذة تسجيل الدخول: ' + redirectErr.message);
            }
        } else {
            alert('❌ تعذر تسجيل الدخول عبر Google: ' + error.message);
        }
    }
}

async function loginPlayer() {
    let name = usernameInput.value.trim();
    let pass = passwordInput.value.trim();

    if (!name) { alert('الرجاء إدخال اسم الطيار أو البطل!'); return; }

    const docRef = db.collection("spacePilotsV10").doc(name);
    try {
        let doc = await docRef.get();
        if (doc.exists && doc.data().isBanned) {
            alert('❌ حسابك محظور نهائياً من قبل الإدارة.');
            return;
        }

        if (!doc.exists) {
            currentPilotData = {
                name: name,
                password: pass,
                highScores: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0},
                ship: '🛸',
                gems: 1500,
                stars: 3500,
                inventory: [],
                isBanned: false,
                isMuted: false,
                isAdmin: (name === 'admin')
            };
            await docRef.set(currentPilotData);
        } else {
            currentPilotData = doc.data();
            currentPilotData.name = name;
            if (currentPilotData.gems === undefined) currentPilotData.gems = 1500;
            if (currentPilotData.stars === undefined) currentPilotData.stars = 3500;
            if (currentPilotData.inventory === undefined) currentPilotData.inventory = [];
            if (name === 'admin') currentPilotData.isAdmin = true;
        }

        currentPlayer = name;
        localStorage.setItem('currentSpacePilotV10', currentPlayer);

        checkKidsAccountAndApplyTheme(currentPlayer);
        updateUserInterfaceProfile();
        loginScreen.style.display = 'none';
        mainMenu.style.display = 'flex';
        bottomNavBar.style.display = 'flex';
        topProfileBadge.style.display = 'flex';
        floatingStoreBtn.style.display = 'flex';
        checkAdminPermissions();
        initChatListener();
    } catch (error) {
        currentPlayer = name;
        localStorage.setItem('currentSpacePilotV10', currentPlayer);
        checkKidsAccountAndApplyTheme(currentPlayer);
        updateUserInterfaceProfile();
        loginScreen.style.display = 'none';
        mainMenu.style.display = 'flex';
        bottomNavBar.style.display = 'flex';
        topProfileBadge.style.display = 'flex';
        floatingStoreBtn.style.display = 'flex';
        checkAdminPermissions();
    }
}

async function registerNewPlayer() {
    let name = usernameInput.value.trim();
    let pass = passwordInput.value.trim();

    if (!name) {
        alert('الرجاء إدخال اسم الطيار!');
        return;
    }

    const docRef = db.collection("spacePilotsV10").doc(name);
    try {
        let doc = await docRef.get();
        if (doc.exists && doc.data().isBanned) {
            alert('❌ هذا الاسم محظور ولا يمكن التسجيل به.');
            return;
        }

        currentPilotData = {
            name: name,
            password: pass,
            highScores: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0},
            ship: '🛸',
            gems: 1500,
            stars: 3500,
            inventory: [],
            isBanned: false,
            isMuted: false,
            isAdmin: (name === 'admin'),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };

        await docRef.set(currentPilotData);
        currentPlayer = name;
        localStorage.setItem('currentSpacePilotV10', currentPlayer);

        alert('🎉 أهلاً بك في مكتبة الألعاب الفضائية!');
        checkKidsAccountAndApplyTheme(currentPlayer);
        updateUserInterfaceProfile();
        loginScreen.style.display = 'none';
        mainMenu.style.display = 'flex';
        bottomNavBar.style.display = 'flex';
        topProfileBadge.style.display = 'flex';
        floatingStoreBtn.style.display = 'flex';
        checkAdminPermissions();
        initChatListener();
    } catch (error) {
        currentPlayer = name;
        localStorage.setItem('currentSpacePilotV10', currentPlayer);
        checkKidsAccountAndApplyTheme(currentPlayer);
        updateUserInterfaceProfile();
        loginScreen.style.display = 'none';
        mainMenu.style.display = 'flex';
        bottomNavBar.style.display = 'flex';
        topProfileBadge.style.display = 'flex';
        floatingStoreBtn.style.display = 'flex';
        checkAdminPermissions();
    }
}

function loadPlayerDataFromCloud(name, callback) {
    db.collection("spacePilotsV10").doc(name).get().then((doc) => {
        if (doc.exists) { callback(doc.data()); } else { callback(null); }
    }).catch(() => { callback(null); });
}

function savePlayerDataToCloud() {
    if (!currentPlayer) return;
    db.collection("spacePilotsV10").doc(currentPlayer).set(currentPilotData, { merge: true }).catch(() => {});
}

function checkKidsAccountAndApplyTheme(identifier) {
    if (!identifier) return;
    let lowerId = identifier.toLowerCase();
    let isKids = lowerId.includes('child') || lowerId.includes('kid') || lowerId.includes('family') || lowerId.includes('junior') || lowerId.includes('أطفال') || lowerId.includes('طفل') || lowerId.includes('صغير') || lowerId.includes('kids');
    
    if (isKids) {
        document.body.classList.add('kids-theme');
        startKidsFloatingIcons();
    } else {
        document.body.classList.remove('kids-theme');
    }
}

function startKidsFloatingIcons() {
    const container = document.getElementById('game-container');
    const icons = ['🎈', '⭐', '🧸', '🍭', '🎨', '🚀', '🐱', '🦄', '🌈', '⚽', '🍬'];
    setInterval(() => {
        let iconEl = document.createElement('div');
        iconEl.classList.add('kids-floating-icon');
        iconEl.innerText = icons[Math.floor(Math.random() * icons.length)];
        iconEl.style.left = Math.random() * 85 + 'vw';
        iconEl.style.animationDuration = (Math.random() * 2 + 4) + 's';
        container.appendChild(iconEl);
        setTimeout(() => iconEl.remove(), 5000);
    }, 700);
}

function updateUserInterfaceProfile() {
    selectedShipIcon = currentPilotData.ship || '🛸';

    player.innerText = selectedShipIcon;
    welcomeTitle.innerText = `مرحباً بك يا بطل: ${currentPlayer}`;
    userStatusDesc.innerHTML = `الوضع: <span style="color:#2ecc71;">مجاني بالكامل لجميع الأعمار (3-30)</span> | الجواهر: 💎 ${currentPilotData.gems || 0} | النجوم: ⭐ ${currentPilotData.stars || 0}`;
    liveGemsDisplay.innerText = currentPilotData.gems || 0;

    profileAvatarIcon.innerText = selectedShipIcon;
    profileDisplayName.innerText = currentPlayer;
    profileDisplayRank.innerText = (currentPlayer === 'admin' || currentPilotData.isAdmin ? 'مدير النظام 🛡️' : 'متاح للجميع (3-30)');

    const storeWelcome = document.getElementById('store-welcome-msg');
    if (storeWelcome) {
        storeWelcome.innerText = `أهلاً بك يا طيار: ${currentPlayer} ${currentPilotData.isAdmin || currentPlayer === 'admin' ? '(مدير النظام 🛡️)' : ''}`;
    }
    const storeGems = document.getElementById('user-gems-display');
    const storeStars = document.getElementById('user-stars-display');
    if (storeGems) storeGems.innerText = `💎 الجواهر: ${currentPilotData.gems || 0}`;
    if (storeStars) storeStars.innerText = `⭐ النجوم: ${currentPilotData.stars || 0}`;

    if (currentPilotData.inventory) {
        if (currentPilotData.inventory.includes('orion_nebula')) {
            deepSpaceBg.className = 'deep-space-warp bg-orion-nebula';
        } else if (currentPilotData.inventory.includes('milkyway_deep')) {
            deepSpaceBg.className = 'deep-space-warp bg-milkyway-deep';
        }
    }
}

function logoutPlayer() {
    localStorage.removeItem('currentSpacePilotV10');
    currentPlayer = '';
    mainMenu.style.display = 'none';
    bottomNavBar.style.display = 'none';
    topProfileBadge.style.display = 'none';
    floatingStoreBtn.style.display = 'none';
    navAdminBtn.style.display = 'none';
    lordStoreScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
}

// دالة فتح شاشة متجر أساطير الفضاء الموسع المدمجة مباشرة
function openStoreFromIndex() {
    mainMenu.style.display = 'none';
    bottomNavBar.style.display = 'none';
    topProfileBadge.style.display = 'none';
    floatingStoreBtn.style.display = 'none';
    lordStoreScreen.style.display = 'flex';
    updateUserInterfaceProfile();
}

function closeLordStore() {
    lordStoreScreen.style.display = 'none';
    mainMenu.style.display = 'flex';
    bottomNavBar.style.display = 'flex';
    topProfileBadge.style.display = 'flex';
    floatingStoreBtn.style.display = 'flex';
    updateUserInterfaceProfile();
}

// تصفية عناصر المتجر
function filterStore(category, btnEl) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const headers = document.querySelectorAll('.category-header');
    const cards = document.querySelectorAll('.store-item-card');

    if (category === 'all') {
        headers.forEach(h => h.style.display = 'block');
        cards.forEach(c => c.style.display = 'flex');
    } else {
        headers.forEach(h => {
            if (h.dataset.category === category) h.style.display = 'block';
            else h.style.display = 'none';
        });
        cards.forEach(c => {
            if (c.dataset.category === category) c.style.display = 'flex';
            else c.style.display = 'none';
        });
    }
}

// دالة شراء العناصر والمتطلبات
async function buyItem(type, itemId, cost, requiresAdmin = false) {
    let isAdmin = currentPilotData.isAdmin || currentPlayer === 'admin';
    if (requiresAdmin && !isAdmin) {
        alert('❌ هذه المركبة أو الأداة الملكية تتطلب درع وصلاحيات الأدمين (Admin Shield)!');
        return;
    }

    if ((type === 'laser' || type === 'powerup') && (currentPilotData.gems || 0) < cost) {
        alert('❌ رصيدك من الجواهر غير كافٍ!');
        return;
    }

    if ((type === 'background' || type === 'helmet') && (currentPilotData.stars || 0) < cost) {
        alert('❌ رصيدك من النجوم غير كافٍ!');
        return;
    }

    if (!currentPilotData.inventory) currentPilotData.inventory = [];
    if (currentPilotData.inventory.includes(itemId)) {
        alert('⚠️ لقد قمت بشراء هذا العنصر مسبقاً!');
        return;
    }

    if (type === 'laser' || type === 'powerup') currentPilotData.gems -= cost;
    if (type === 'background' || type === 'helmet') currentPilotData.stars -= cost;

    currentPilotData.inventory.push(itemId);

    savePlayerDataToCloud();
    updateUserInterfaceProfile();
    showToast(`🎉 تم شراء العنصر بنجاح وتزامن مع حسابك!`);
}

function openInventory() {
    const container = document.getElementById('inventory-list-container');
    let inv = currentPilotData.inventory || [];
    if (inv.length === 0) {
        container.innerHTML = '<p style="color:#a4b0be; text-align:center;">حقيبتك فارغة حالياً. قم بشراء بعض العناصر لتبدأ مغامرتك!</p>';
    } else {
        container.innerHTML = inv.map(item => `<div style="padding: 5px 0; border-bottom: 1px dashed rgba(0,243,255,0.3);">✨ عنصر ممتلك: <b>${item}</b></div>`).join('');
    }
    document.getElementById('inventory-modal').style.display = 'flex';
}

function closeInventory() {
    document.getElementById('inventory-modal').style.display = 'none';
}

function showToast(msg) {
    const toast = document.getElementById('achievement-toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function openCockpitSimulation() {
    isPlaying = false;
    isPaused = true;
    topProfileBadge.style.display = 'none';
    floatingStoreBtn.style.display = 'none';
    
    screenTitle.innerText = "🛸 محاكاة قمرة القيادة التفاعلية";
    screenDesc.innerHTML = `<h2 id="sim-timer" style="color: #00f3ff; font-size: 1.6rem;">10</h2><p>استمتع برؤية رادار الفضاء المذهل المصمم لجميع الأعمار!</p>`;
    highScoreText.innerText = `البطل: ${currentPlayer}`;
    startBtn.style.display = 'none';
    gameScreen.style.display = 'flex';

    let timeLeft = 10;
    const timerElement = document.getElementById('sim-timer');
    const simInterval = setInterval(() => {
        timeLeft--;
        if (timerElement) timerElement.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(simInterval);
            alert('✨ انتهت جولة المحاكاة الترفيهية بنجاح!');
            startBtn.style.display = 'block';
            returnToMenu();
        }
    }, 1000);
}

// أجزاء وضع الشاشة المنقسمة
let splitActive = false;
let splitAnimFrame = null;
let splitSpawnInterval = null;
let p1X = 200, p2X = 200;
let p1Lives = 12, p2Lives = 12;
let p1Score = 0, p2Score = 0;

let p1AutoFire = false, p2AutoFire = false;
let p1FireInterval = null, p2FireInterval = null;
let p1HoldTimer = null, p2HoldTimer = null;
let p1HoldTriggered = false, p2HoldTriggered = false;

function openSplitScreenGame() {
    mainMenu.style.display = 'none';
    bottomNavBar.style.display = 'none';
    topProfileBadge.style.display = 'none';
    floatingStoreBtn.style.display = 'none';
    splitScreenContainer.style.display = 'flex';
    startSplitScreenGame();
}

function startSplitScreenGame() {
    splitActive = true;
    p1Lives = 12; p2Lives = 12;
    p1Score = 0; p2Score = 0;
    
    disableP1AutoFire();
    disableP2AutoFire();

    document.getElementById('p1-lives').innerText = p1Lives;
    document.getElementById('p2-lives').innerText = p2Lives;
    document.getElementById('p1-score').innerText = p1Score;
    document.getElementById('p2-score').innerText = p2Score;

    const rect = splitScreenContainer.getBoundingClientRect();
    p1X = rect.width / 2;
    p2X = rect.width / 2;
    document.getElementById('p1-ship').style.left = p1X + 'px';
    document.getElementById('p2-ship').style.left = p2X + 'px';

    document.querySelectorAll('.split-laser-p1, .split-laser-p2, .split-meteor').forEach(el => el.remove());
    
    if (splitSpawnInterval) clearInterval(splitSpawnInterval);
    splitSpawnInterval = setInterval(spawnSplitMeteor, 1200);

    bindSplitFireButtons();

    cancelAnimationFrame(splitAnimFrame);
    splitGameLoop();
}

function bindSplitFireButtons() {
    const p1Btn = document.getElementById('p1-fire-btn');
    const p2Btn = document.getElementById('p2-fire-btn');

    if (!p1Btn || !p2Btn) return;

    const onP1Down = (e) => {
        if (e) e.preventDefault();
        if (!splitActive) return;
        p1HoldTriggered = false;
        p1HoldTimer = setTimeout(() => {
            p1HoldTriggered = true;
            toggleP1AutoFire();
        }, 350);
    };

    const onP1Up = (e) => {
        if (e) e.preventDefault();
        if (!splitActive) return;
        if (p1HoldTimer) {
            clearTimeout(p1HoldTimer);
            p1HoldTimer = null;
        }
        if (!p1HoldTriggered) {
            if (p1AutoFire) {
                disableP1AutoFire();
            } else {
                fireSplitLaserP1();
            }
        }
    };

    p1Btn.onmousedown = onP1Down;
    p1Btn.onmouseup = onP1Up;
    p1Btn.onmouseleave = onP1Up;
    p1Btn.ontouchstart = onP1Down;
    p1Btn.ontouchend = onP1Up;

    const onP2Down = (e) => {
        if (e) e.preventDefault();
        if (!splitActive) return;
        p2HoldTriggered = false;
        p2HoldTimer = setTimeout(() => {
            p2HoldTriggered = true;
            toggleP2AutoFire();
        }, 350);
    };

    const onP2Up = (e) => {
        if (e) e.preventDefault();
        if (!splitActive) return;
        if (p2HoldTimer) {
            clearTimeout(p2HoldTimer);
            p2HoldTimer = null;
        }
        if (!p2HoldTriggered) {
            if (p2AutoFire) {
                disableP2AutoFire();
            } else {
                fireSplitLaserP2();
            }
        }
    };

    p2Btn.onmousedown = onP2Down;
    p2Btn.onmouseup = onP2Up;
    p2Btn.onmouseleave = onP2Up;
    p2Btn.ontouchstart = onP2Down;
    p2Btn.ontouchend = onP2Up;
}

function toggleP1AutoFire() {
    if (p1AutoFire) { disableP1AutoFire(); } else { enableP1AutoFire(); }
}

function enableP1AutoFire() {
    p1AutoFire = true;
    const btn = document.getElementById('p1-fire-btn');
    if (btn) {
        btn.innerText = '⚡ آلي P1 🔥';
        btn.style.background = 'linear-gradient(45deg, #00cec9, #0984e3)';
        btn.style.boxShadow = '0 0 25px #00f3ff';
    }
    if (!p1FireInterval) { p1FireInterval = setInterval(fireSplitLaserP1, 150); }
}

function disableP1AutoFire() {
    p1AutoFire = false;
    const btn = document.getElementById('p1-fire-btn');
    if (btn) {
        btn.innerText = '⚡ إطلاق P1';
        btn.style.background = 'linear-gradient(45deg, #00f3ff, #0984e3)';
        btn.style.boxShadow = '0 0 12px #00f3ff';
    }
    if (p1FireInterval) { clearInterval(p1FireInterval); p1FireInterval = null; }
}

function toggleP2AutoFire() {
    if (p2AutoFire) { disableP2AutoFire(); } else { enableP2AutoFire(); }
}

function enableP2AutoFire() {
    p2AutoFire = true;
    const btn = document.getElementById('p2-fire-btn');
    if (btn) {
        btn.innerText = '🔥 آلي P2 🔥';
        btn.style.background = 'linear-gradient(45deg, #e17055, #d63031)';
        btn.style.boxShadow = '0 0 25px #ff3838';
    }
    if (!p2FireInterval) { p2FireInterval = setInterval(fireSplitLaserP2, 150); }
}

function disableP2AutoFire() {
    p2AutoFire = false;
    const btn = document.getElementById('p2-fire-btn');
    if (btn) {
        btn.innerText = '🔥 إطلاق P2';
        btn.style.background = 'linear-gradient(45deg, #ff3838, #c0392b)';
        btn.style.boxShadow = '0 0 12px #ff3838';
    }
    if (p2FireInterval) { clearInterval(p2FireInterval); p2FireInterval = null; }
}

function handleSplitTouch(e) {
    if (!splitActive) return;
    const containerRect = splitScreenContainer.getBoundingClientRect();
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.target.tagName === 'BUTTON') continue;
        const relY = touch.clientY - containerRect.top;
        const relX = touch.clientX - containerRect.left;
        
        if (relY < containerRect.height / 2) {
            p2X = Math.max(30, Math.min(containerRect.width - 30, relX));
            document.getElementById('p2-ship').style.left = p2X + 'px';
        } else {
            p1X = Math.max(30, Math.min(containerRect.width - 30, relX));
            document.getElementById('p1-ship').style.left = p1X + 'px';
        }
    }
}

splitScreenContainer.addEventListener('touchstart', handleSplitTouch, {passive: true});
splitScreenContainer.addEventListener('touchmove', handleSplitTouch, {passive: true});

window.addEventListener('keydown', (e) => {
    if (!splitActive) return;
    const containerRect = splitScreenContainer.getBoundingClientRect();
    if (e.key === 'ArrowLeft') {
        p1X = Math.max(30, p1X - 25);
        document.getElementById('p1-ship').style.left = p1X + 'px';
    } else if (e.key === 'ArrowRight') {
        p1X = Math.min(containerRect.width - 30, p1X + 25);
        document.getElementById('p1-ship').style.left = p1X + 'px';
    } else if (e.key === ' ' || e.code === 'Space') {
        fireSplitLaserP1();
    }

    if (e.key === 'a' || e.key === 'A') {
        p2X = Math.max(30, p2X - 25);
        document.getElementById('p2-ship').style.left = p2X + 'px';
    } else if (e.key === 'd' || e.key === 'D') {
        p2X = Math.min(containerRect.width - 30, p2X + 25);
        document.getElementById('p2-ship').style.left = p2X + 'px';
    } else if (e.key === 'w' || e.key === 'W') {
        fireSplitLaserP2();
    }
});

function fireSplitLaserP1() {
    if (!splitActive) return;
    const laser = document.createElement('div');
    laser.classList.add('split-laser-p1');
    laser.style.left = (p1X - 4) + 'px';
    laser.style.top = (splitScreenContainer.clientHeight - 80) + 'px';
    splitScreenContainer.appendChild(laser);
}

function fireSplitLaserP2() {
    if (!splitActive) return;
    const laser = document.createElement('div');
    laser.classList.add('split-laser-p2');
    laser.style.left = (p2X - 4) + 'px';
    laser.style.top = '70px';
    splitScreenContainer.appendChild(laser);
}

function spawnSplitMeteor() {
    if (!splitActive) return;
    const meteor = document.createElement('div');
    meteor.classList.add('split-meteor');
    meteor.innerText = '☄️';
    const width = splitScreenContainer.clientWidth;
    meteor.style.left = (Math.random() * (width - 40)) + 'px';
    
    if (Math.random() > 0.5) {
        meteor.style.top = '10px';
        meteor.dataset.dir = 'down';
    } else {
        meteor.style.top = (splitScreenContainer.clientHeight - 40) + 'px';
        meteor.dataset.dir = 'up';
    }
    splitScreenContainer.appendChild(meteor);
}

function createExplosionAt(x, y) {
    const exp = document.createElement('div');
    exp.classList.add('explosion');
    exp.style.left = x + 'px';
    exp.style.top = y + 'px';
    splitScreenContainer.appendChild(exp);
    setTimeout(() => exp.remove(), 350);
}

function splitGameLoop() {
    if (!splitActive) return;

    const p1ShipEl = document.getElementById('p1-ship');
    const p2ShipEl = document.getElementById('p2-ship');
    const p1Rect = p1ShipEl.getBoundingClientRect();
    const p2Rect = p2ShipEl.getBoundingClientRect();

    document.querySelectorAll('.split-laser-p1').forEach(laser => {
        let top = parseFloat(laser.style.top);
        top -= 12;
        laser.style.top = top + 'px';
        const lRect = laser.getBoundingClientRect();

        if (lRect.left < p2Rect.right && lRect.right > p2Rect.left && lRect.top < p2Rect.bottom && lRect.bottom > p2Rect.top) {
            p2Lives--;
            p1Score += 100;
            document.getElementById('p2-lives').innerText = p2Lives;
            document.getElementById('p1-score').innerText = p1Score;
            createExplosionAt(p2Rect.left + 20, p2Rect.top + 20);
            laser.remove();
            if (p2Lives <= 0) checkSplitWinner('اللاعب 1 (المجرة الزرقاء)');
        } else if (top < 0) {
            laser.remove();
        }
    });

    document.querySelectorAll('.split-laser-p2').forEach(laser => {
        let top = parseFloat(laser.style.top);
        top += 12;
        laser.style.top = top + 'px';
        const lRect = laser.getBoundingClientRect();

        if (lRect.left < p1Rect.right && lRect.right > p1Rect.left && lRect.top < p1Rect.bottom && lRect.bottom > p1Rect.top) {
            p1Lives--;
            p2Score += 100;
            document.getElementById('p1-lives').innerText = p1Lives;
            document.getElementById('p2-score').innerText = p2Score;
            createExplosionAt(p1Rect.left + 20, p1Rect.top + 20);
            laser.remove();
            if (p1Lives <= 0) checkSplitWinner('اللاعب 2 (المجرة الحمراء)');
        } else if (top > splitScreenContainer.clientHeight) {
            laser.remove();
        }
    });

    document.querySelectorAll('.split-meteor').forEach(meteor => {
        let top = parseFloat(meteor.style.top);
        if (meteor.dataset.dir === 'down') {
            top += 4;
        } else {
            top -= 4;
        }
        meteor.style.top = top + 'px';
        const mRect = meteor.getBoundingClientRect();

        if (mRect.left < p1Rect.right && mRect.right > p1Rect.left && mRect.top < p1Rect.bottom && mRect.bottom > p1Rect.top) {
            p1Lives--;
            document.getElementById('p1-lives').innerText = p1Lives;
            createExplosionAt(p1Rect.left + 20, p1Rect.top + 20);
            meteor.remove();
            if (p1Lives <= 0) checkSplitWinner('اللاعب 2 (المجرة الحمراء)');
        }
        else if (mRect.left < p2Rect.right && mRect.right > p2Rect.left && mRect.top < p2Rect.bottom && mRect.bottom > p2Rect.top) {
            p2Lives--;
            document.getElementById('p2-lives').innerText = p2Lives;
            createExplosionAt(p2Rect.left + 20, p2Rect.top + 20);
            meteor.remove();
            if (p2Lives <= 0) checkSplitWinner('اللاعب 1 (المجرة الزرقاء)');
        } else if (top < -40 || top > splitScreenContainer.clientHeight + 40) {
            meteor.remove();
        }
    });

    if (splitActive) {
        splitAnimFrame = requestAnimationFrame(splitGameLoop);
    }
}

function checkSplitWinner(winnerName) {
    splitActive = false;
    disableP1AutoFire();
    disableP2AutoFire();
    cancelAnimationFrame(splitAnimFrame);
    clearInterval(splitSpawnInterval);

    setTimeout(() => {
        alert(`🎉 انتصر ${winnerName} في صراع المجرّتين!\n\n🏆 النتيجة:\nاللاعب 1: ${p1Score}\nاللاعب 2: ${p2Score}`);
        returnToMenu();
    }, 100);
}

function insertEmoji(e) {
    if (e.target.tagName === 'SPAN') {
        chatTextInput.value += e.target.innerText;
        chatTextInput.focus();
    }
}

async function sendChatMessage(customImgUrl = '') {
    if (currentPilotData.isMuted || currentPilotData.isBanned) {
        alert('❌ تم حظرك أو كتمك من إرسال الرسائل في الشات بواسطة الإدارة.');
        return;
    }

    let msg = chatTextInput.value.trim();
    if (!msg && !customImgUrl) return;

    try {
        await db.collection("spaceChatV10").add({
            sender: currentPlayer,
            rank: (currentPlayer === 'admin' ? 'مدير النظام 🛡️' : 'بطل الفضاء'),
            message: msg,
            image: customImgUrl || '',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        let localChats = JSON.parse(localStorage.getItem('spaceLocalChatsV10') || '[]');
        localChats.push({
            sender: currentPlayer,
            rank: (currentPlayer === 'admin' ? 'مدير النظام 🛡️' : 'بطل الفضاء'),
            message: msg,
            image: customImgUrl || '',
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('spaceLocalChatsV10', JSON.stringify(localChats));
        renderChatMessages();
    }

    chatTextInput.value = '';
}

function initChatListener() {
    db.collection("spaceChatV10").orderBy("timestamp", "asc").limit(50).onSnapshot(snapshot => {
        let serverChats = [];
        snapshot.forEach(doc => {
            serverChats.push({ id: doc.id, ...doc.data() });
        });
        renderCloudAndLocalChats(serverChats);
    }, () => {
        renderChatMessages();
    });
}

function renderChatMessages() {
    let localChats = JSON.parse(localStorage.getItem('spaceLocalChatsV10') || '[]');
    renderCloudAndLocalChats(localChats);
}

function renderCloudAndLocalChats(chatsArray) {
    let html = '';
    chatsArray.forEach(c => {
        let isMe = (c.sender === currentPlayer);
        let isAdminUser = (currentPlayer === 'admin' || currentPilotData.isAdmin);
        html += `
            <div class="chat-msg-item ${isMe ? 'my-msg' : ''}">
                <div style="display:flex; justify-content:space-between; margin-bottom:2px; font-size:0.65rem; color:#00f3ff;">
                    <b>${c.sender} (${c.rank || 'عضو'})</b>
                    ${isAdminUser ? `<button onclick="deleteChatMessage('${c.id || ''}')" style="background:#ff3838; border:none; color:white; border-radius:4px; padding:1px 5px; font-size:0.6rem; cursor:pointer;">حذف</button>` : ''}
                </div>
                <div>${c.message || ''}</div>
                ${c.image ? `<img src="${c.image}" class="chat-snapshot-img">` : ''}
            </div>
        `;
    });
    chatMessagesBox.innerHTML = html || '<div style="color:#a4b0be; text-align:center;">لا توجد رسائل بعد... كن أول المتحدثين!</div>';
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
}

async function deleteChatMessage(msgId) {
    if (!msgId) return;
    try {
        await db.collection("spaceChatV10").doc(msgId).delete();
        alert('🗑️ تم حذف الرسالة بنجاح.');
    } catch (e) {
        alert('❌ تعذر حذف الرسالة.');
    }
}

async function loadAdminUsersList() {
    if (currentPlayer !== 'admin' && !currentPilotData.isAdmin) return;
    adminUsersList.innerHTML = '<p style="color:#00f3ff; font-size:0.75rem;">جاري تحميل القائمة...</p>';
    try {
        let snapshot = await db.collection("spacePilotsV10").get();
        let html = '';
        snapshot.forEach(doc => {
            let u = doc.data();
            html += `
                <div class="admin-user-row">
                    <span><b>${u.name}</b> ${u.isBanned ? '(محظور ❌)' : '(نشط ✅)'}</span>
                    <div>
                        ${u.isBanned ? 
                          `<button class="btn" style="width:auto; padding:3px 8px; font-size:0.65rem; background:#2ecc71;" onclick="setPlayerBanStatus('${u.name}', false)">إلغاء الحظر</button>` : 
                          `<button class="btn btn-red" style="width:auto; padding:3px 8px; font-size:0.65rem;" onclick="setPlayerBanStatus('${u.name}', true)">باند / حظر</button>`
                        }
                    </div>
                </div>
            `;
        });
        adminUsersList.innerHTML = html || '<p style="color:#a4b0be; font-size:0.75rem;">لا توجد حسابات مسجلة.</p>';
    } catch (e) {
        adminUsersList.innerHTML = '<p style="color:#ff3838; font-size:0.75rem;">تعذر جلب المستخدمين.</p>';
    }
}

async function setPlayerBanStatus(username, status) {
    try {
        await db.collection("spacePilotsV10").doc(username).update({
            isBanned: status
        });
        alert(`✅ تم تحديث حالة الحظر للمستخدم: ${username}`);
        loadAdminUsersList();
    } catch (e) {
        alert('❌ حدث خطأ أثناء تنفيذ الحظر.');
    }
}

function takeGameSnapshot() {
    if (!isPlaying) {
        alert('يجب أن تكون داخل اللعبة لالتقاط ومشاركة الصورة!');
        return;
    }
    let canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 150;
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0b0c2a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00f3ff'; ctx.font = '16px Tahoma';
    ctx.fillText(`لقطة شاشة البطل: ${currentPlayer}`, 20, 40);
    ctx.fillText(`النتيجة الحالية: ${score} ⭐`, 20, 80);
    ctx.fillText(`السفينة: ${selectedShipIcon}`, 20, 120);

    let dataUrl = canvas.toDataURL();
    switchSection('sec-chat', document.querySelectorAll('.nav-item')[2]);
    sendChatMessage();
    sendCustomImageToChat(dataUrl);
}

async function sendCustomImageToChat(imgUrl) {
    try {
        await db.collection("spaceChatV10").add({
            sender: currentPlayer,
            rank: (currentPlayer === 'admin' ? 'مدير النظام 🛡️' : 'بطل الفضاء'),
            message: 'لقطة شاشة من داخل اللعبة 🎮',
            image: imgUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {}
}

let currentGame = 1, score = 0, lives = 12, level = 1, gameSpeed = 5, spawnRate = 400;
let gameAnimFrame = null, itemInterval, fireInterval;
let isPlaying = false, isPaused = false, playerX = 240, hasShield = false;
let firePressTimer = null, isAutoFire = false;

// توليد خلفية النجوم
for (let i = 0; i < 25; i++) {
    let star = document.createElement('div');
    star.classList.add('star-bg');
    star.style.left = Math.random() * 100 + 'vw';
    star.style.top = Math.random() * 100 + 'vh';
    let size = Math.random() * 2 + 1;
    star.style.width = size + 'px'; star.style.height = size + 'px';
    star.style.animationDuration = (Math.random() * 3 + 2) + 's';
    gameContainer.appendChild(star);
}

function openShop() {
    mainMenu.style.display = 'none';
    bottomNavBar.style.display = 'none';
    topProfileBadge.style.display = 'none';
    floatingStoreBtn.style.display = 'none';
    shopModal.style.display = 'flex';

    document.querySelectorAll('.ship-option').forEach(o => {
        if(o.innerText === (currentPilotData.ship || '🛸')) {
            o.classList.add('selected');
        } else {
            o.classList.remove('selected');
        }
    });
}

function closeShop() {
    shopModal.style.display = 'none';
    mainMenu.style.display = 'flex';
    bottomNavBar.style.display = 'flex';
    topProfileBadge.style.display = 'flex';
    floatingStoreBtn.style.display = 'flex';
    
    savePlayerDataToCloud();
    updateUserInterfaceProfile();
}

function selectShip(icon, el) {
    selectedShipIcon = icon;
    currentPilotData.ship = icon;
    player.innerText = icon;
    profileAvatarIcon.innerText = icon;
    
    document.querySelectorAll('.ship-option').forEach(o => o.classList.remove('selected'));
    if(el) el.classList.add('selected');
    
    savePlayerDataToCloud();
}

function openGame(gameNum) {
    currentGame = gameNum;
    mainMenu.style.display = 'none';
    bottomNavBar.style.display = 'none';
    topProfileBadge.style.display = 'none';
    floatingStoreBtn.style.display = 'none';
    gameScreen.style.display = 'flex';
    let highScore = (currentPilotData.highScores && currentPilotData.highScores[currentGame]) || 0;
    highScoreText.innerText = `أعلى نتيجة سحابية: ${highScore}`;

    const descriptions = {
        1: "⭐ صائد النجوم الكلاسيكي: طور مستواك بلا نهاية واجمع النجوم بحرية.",
        2: "☄️ تحدي النيازك القاتلة: نيازك متسارعة وتحدٍ مشوق وممتع.",
        3: "🚀 غزو الفضاء السريع: سرعة رائعة وتحدي ردة الفعل للأبطال.",
        4: "💎 جامع الألماس والمجرات: اجمع الألماس الثمين بدون أي قيود.",
        5: "⚡ حرب الثقوب السوداء: مغامرة ممتعة بعناصر كونية مثيرة.",
        6: "🛡️ معركة حقول الألغام: تفادي الحواجز بمهارة وذكاء.",
        7: "🌀 سباق الثقوب الدودية: عواصف نيزكية متعرجة وسرعة مشوقة.",
        8: "🔥 حرب الليزر والصواريخ: إطلاق صواريخ ممتعة ومسلية.",
        9: "👑 معركة الزعيم الأخير: واجه التحدي الكبير بمهارة فائقة!",
        10: "🔒 معركة الحصار الفضائي: لعبة حصرية مفتوحة ومتاحة للجميع مجاناً!"
    };

    const titles = {
        1: "⭐ 1. صائد النجوم الكلاسيكي", 2: "☄ 2. تحدي النيازك القاتلة", 3: "🚀 3. غزو الفضاء السريع",
        4: "💎 4. جامع الألماس والمجرات", 5: "⚡ 5. حرب الثقوب السوداء", 6: "🛡️ 6. معركة حقول الألغام",
        7: "🌀 7. سباق الثقوب الدودية", 8: "🔥 8. حرب الليزر والصواريخ", 9: "👑 9. معركة الزعيم الأخير",
        10: "🔒 10. معركة الحصار الفضائي (مفتوحة للجميع)"
    };

    screenTitle.innerText = titles[gameNum];
    screenDesc.innerText = descriptions[gameNum];
}

function returnToMenu() {
    isPlaying = false; isPaused = false; isAutoFire = false; splitActive = false;
    disableP1AutoFire(); disableP2AutoFire();
    cancelAnimationFrame(gameAnimFrame); clearInterval(itemInterval); clearInterval(fireInterval);
    cancelAnimationFrame(splitAnimFrame); clearInterval(splitSpawnInterval);

    document.querySelectorAll('.item, .laser-l1, .laser-l2, .laser-l3, .laser-plasma_blue, .laser-lava_red, .laser-emerald_quantum, .laser-blackhole_purple, .laser-supernova_gold, .missile, .explosion, .split-laser-p1, .split-laser-p2, .split-meteor').forEach(el => el.remove());
    
    gameScreen.style.display = 'none';
    splitScreenContainer.style.display = 'none';
    lordStoreScreen.style.display = 'none';
    ui.style.display = 'none';
    controls.style.display = 'none';
    player.style.display = 'none';
    mainMenu.style.display = 'flex';
    bottomNavBar.style.display = 'flex';
    topProfileBadge.style.display = 'flex';
    floatingStoreBtn.style.display = 'flex';
    checkAdminPermissions();
    updateUserInterfaceProfile();
}

function enableAutoFire() {
    isAutoFire = true;
    fireBtn.classList.add('auto-fire-active');
    fireBtn.innerText = '🔥';
    if (!fireInterval) { fireInterval = setInterval(fireWeapon, 120); }
}

function disableAutoFire() {
    isAutoFire = false;
    fireBtn.classList.remove('auto-fire-active');
    fireBtn.innerText = '⚡';
    clearInterval(fireInterval);
    fireInterval = null;
}

function fireWeapon() {
    if (!isPlaying || isPaused) return;
    const missile = document.createElement('div');
    
    let inv = currentPilotData.inventory || [];
    if (inv.includes('supernova_gold')) { missile.classList.add('laser-supernova_gold'); }
    else if (inv.includes('blackhole_purple')) { missile.classList.add('laser-blackhole_purple'); }
    else if (inv.includes('emerald_quantum')) { missile.classList.add('laser-emerald_quantum'); }
    else if (inv.includes('lava_red')) { missile.classList.add('laser-lava_red'); }
    else if (inv.includes('plasma_blue')) { missile.classList.add('laser-plasma_blue'); }
    else if (currentGame === 8 || currentGame === 10 || level >= 4) { missile.classList.add('missile'); }
    else if (level === 3) { missile.classList.add('laser-l3'); }
    else if (level === 2) { missile.classList.add('laser-l2'); }
    else { missile.classList.add('laser-l1'); }

    missile.style.left = (playerX - 4) + 'px';
    missile.style.bottom = '135px';
    gameContainer.appendChild(missile);

    if (inv.includes('ai_drone')) {
        const droneLaser1 = document.createElement('div');
        droneLaser1.classList.add('laser-l1');
        droneLaser1.style.left = (playerX - 25) + 'px';
        droneLaser1.style.bottom = '135px';
        gameContainer.appendChild(droneLaser1);

        const droneLaser2 = document.createElement('div');
        droneLaser2.classList.add('laser-l1');
        droneLaser2.style.left = (playerX + 20) + 'px';
        droneLaser2.style.bottom = '135px';
        gameContainer.appendChild(droneLaser2);
    }
}

function startCurrentGame() {
    score = 0;
    lives = 12;
    level = 1;
    hasShield = true;
    isAutoFire = false;
    fireBtn.classList.remove('auto-fire-active');
    fireBtn.innerText = '⚡';

    player.innerText = currentPilotData.ship || selectedShipIcon || '🛸';
    
    if (hasShield) { player.classList.add('shield-active'); } else { player.classList.remove('shield-active'); }

    let speeds = { 1: 5, 2: 6.5, 3: 8, 4: 5.5, 5: 7, 6: 6.5, 7: 8.5, 8: 7, 9: 9.5, 10: 7.5 };
    const rates = { 1: 550, 2: 380, 3: 280, 4: 450, 5: 320, 6: 350, 7: 260, 8: 300, 9: 240, 10: 280 };

    let inv = currentPilotData.inventory || [];
    let speedFactor = inv.includes('time_warp') ? 0.75 : 1.0;

    gameSpeed = (speeds[currentGame] || 5) * speedFactor;
    spawnRate = rates[currentGame] || 500;

    scoreDisplay.innerText = score;
    livesDisplay.innerText = lives;
    liveGemsDisplay.innerText = currentPilotData.gems || 0;

    gameScreen.style.display = 'none';
    ui.style.display = 'flex';
    controls.style.display = 'flex';
    player.style.display = 'block';
    playerX = gameContainer.clientWidth / 2;
    player.style.left = playerX + 'px';

    isPlaying = true; isPaused = false;
    document.querySelectorAll('.item, .laser-l1, .laser-l2, .laser-l3, .laser-plasma_blue, .laser-lava_red, .laser-emerald_quantum, .laser-blackhole_purple, .laser-supernova_gold, .missile, .explosion').forEach(el => el.remove());
    cancelAnimationFrame(gameAnimFrame); clearInterval(itemInterval); clearInterval(fireInterval);
    fireInterval = null;

    itemInterval = setInterval(spawnItem, spawnRate);
    
    function gameLoop() {
        if (!isPlaying) return;
        if (!isPaused) {
            updateGame();
            GamePerformanceOptimizer.optimizeDOM();
        }
        gameAnimFrame = requestAnimationFrame(gameLoop);
    }
    gameAnimFrame = requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (!isPlaying) return;
    isPaused = !isPaused;
    if (isPaused) {
        if (!isAutoFire) { clearInterval(fireInterval); fireInterval = null; }
        screenTitle.innerText = "⏸️ اللعبة متوقفة مؤقتاً";
        screenDesc.innerText = "خذ أنفاسك واستعد للمتابعة!";
        highScoreText.innerText = `النتيجة الحالية: ${score}`;
        startBtn.innerText = "استئناف اللعب";
        gameScreen.style.display = 'flex';
    } else {
        if (isAutoFire && !fireInterval) { fireInterval = setInterval(fireWeapon, 120); }
        gameScreen.style.display = 'none';
    }
}

function spawnItem() {
    if (!isPlaying || isPaused) return;
    const item = document.createElement('div');
    item.classList.add('item');
    const rect = gameContainer.getBoundingClientRect();
    const randomX = Math.random() * (rect.width - 50);
    const rand = Math.random();

    if (currentGame === 9 || currentGame === 10) {
        if (rand < 0.35) { item.innerHTML = '👑'; item.dataset.type = 'good'; item.dataset.val = 60; }
        else { item.innerHTML = '👾'; item.dataset.type = 'bad'; }
    } else {
        if (rand < 0.45) { item.innerHTML = '⭐'; item.dataset.type = 'good'; item.dataset.val = 15; }
        else if (rand < 0.70) { item.innerHTML = '☄️'; item.dataset.type = 'bad'; }
        else if (rand < 0.85) { item.innerHTML = '❤️'; item.dataset.type = 'heart'; }
        else if (rand < 0.95) { item.innerHTML = '🛡️'; item.dataset.type = 'shield'; }
        else { item.innerHTML = '💎'; item.dataset.type = 'gem'; }
    }

    item.style.left = randomX + 'px';
    item.style.top = '-50px';
    gameContainer.appendChild(item);
}

function updateGame() {
    const projectiels = document.querySelectorAll('.laser-l1, .laser-l2, .laser-l3, .laser-plasma_blue, .laser-lava_red, .laser-emerald_quantum, .laser-blackhole_purple, .laser-supernova_gold, .missile');
    projectiels.forEach(proj => {
        let bottom = parseFloat(proj.style.bottom);
        proj.style.bottom = (bottom + 24) + 'px';
        const projRect = proj.getBoundingClientRect();

        const items = document.querySelectorAll('.item');
        items.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            if (projRect.left < itemRect.right && projRect.right > itemRect.left && projRect.top < itemRect.bottom && projRect.bottom > itemRect.top) {
                if (item.dataset.type === 'bad') {
                    score += 15; item.remove();
                    scoreDisplay.innerText = score;
                    proj.remove();
                }
            }
        });
        if (bottom > window.innerHeight) proj.remove();
    });

    const items = document.querySelectorAll('.item');
    const playerRect = player.getBoundingClientRect();

    items.forEach(item => {
        let top = parseFloat(item.style.top);
        item.style.top = (top + gameSpeed) + 'px';
        const itemRect = item.getBoundingClientRect();

        if (itemRect.left < playerRect.right && itemRect.right > playerRect.left && itemRect.top < playerRect.bottom && itemRect.bottom > playerRect.top) {
            let type = item.dataset.type;
            let inv = currentPilotData.inventory || [];

            if (type === 'good') {
                score += Math.round(parseInt(item.dataset.val || 15) * 2);
                scoreDisplay.innerText = score;
                if (score >= level * 100) { level++; gameSpeed += 0.4; }
            } else if (type === 'heart') {
                lives++; livesDisplay.innerText = lives;
            } else if (type === 'shield') {
                hasShield = true; player.classList.add('shield-active');
            } else if (type === 'gem') {
                let gemGain = inv.includes('gem_multiplier') ? 20 : 10;
                currentPilotData.gems = (currentPilotData.gems || 0) + gemGain;
                liveGemsDisplay.innerText = currentPilotData.gems;
                savePlayerDataToCloud();
            } else {
                if (hasShield) {
                    hasShield = false; player.classList.remove('shield-active');
                } else {
                    lives--; livesDisplay.innerText = lives; triggerShake();
                    if (lives <= 0) gameOver();
                }
            }
            item.remove();
        }
        if (top > window.innerHeight) item.remove();
    });
}

function triggerShake() {
    gameContainer.classList.add('shake');
    setTimeout(() => gameContainer.classList.remove('shake'), 300);
}

function gameOver() {
    isPlaying = false; disableAutoFire();
    cancelAnimationFrame(gameAnimFrame); clearInterval(itemInterval);

    if (currentPlayer) {
        if (!currentPilotData.highScores) currentPilotData.highScores = {};
        if (score > (currentPilotData.highScores[currentGame] || 0)) {
            currentPilotData.highScores[currentGame] = score;
        }
        savePlayerDataToCloud();
    }

    let highScore = (currentPilotData.highScores && currentPilotData.highScores[currentGame]) || 0;
    screenTitle.innerText = "🏆 أحسنت صنعاً يا بطل الفضاء!";
    screenDesc.innerHTML = `البطل: <b>${currentPlayer}</b><br>نقاطك: <b>${score}</b><br>رقمك القياسي: <b>${highScore}</b>`;
    highScoreText.innerText = `رصيد الجواهر المجانية: 💎 ${currentPilotData.gems}`;
    startBtn.innerText = "العب مرة أخرى";
    gameScreen.style.display = 'flex';
}

// السحب الخاص بزر FAB المتجر
let isDraggingFab = false;
let fabStartTouchX = 0, fabStartTouchY = 0;
let fabStartLeft = 0, fabStartTop = 0;
let fabHasDragged = false;

function initFabDrag() {
    const fab = document.getElementById('floating-store-btn');
    if (!fab) return;

    const onDragStart = (e) => {
        isDraggingFab = true;
        fabHasDragged = false;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        fabStartTouchX = clientX;
        fabStartTouchY = clientY;
        
        const rect = fab.getBoundingClientRect();
        const containerRect = gameContainer.getBoundingClientRect();

        fabStartLeft = rect.left - containerRect.left;
        fabStartTop = rect.top - containerRect.top;

        fab.style.position = 'absolute';
        fab.style.bottom = 'auto';
        fab.style.right = 'auto';
        fab.style.left = fabStartLeft + 'px';
        fab.style.top = fabStartTop + 'px';
    };

    const onDragMove = (e) => {
        if (!isDraggingFab) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - fabStartTouchX;
        const deltaY = clientY - fabStartTouchY;

        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            fabHasDragged = true;
        }

        const containerRect = gameContainer.getBoundingClientRect();
        let newLeft = fabStartLeft + deltaX;
        let newTop = fabStartTop + deltaY;

        newLeft = Math.max(10, Math.min(containerRect.width - 66, newLeft));
        newTop = Math.max(10, Math.min(containerRect.height - 66, newTop));

        fab.style.left = newLeft + 'px';
        fab.style.top = newTop + 'px';
    };

    const onDragEnd = () => {
        isDraggingFab = false;
    };

    fab.addEventListener('touchstart', onDragStart, { passive: true });
    window.addEventListener('touchmove', onDragMove, { passive: true });
    window.addEventListener('touchend', onDragEnd);

    fab.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);

    fab.addEventListener('click', (e) => {
        if (fabHasDragged) {
            e.stopImmediatePropagation();
            e.preventDefault();
            fabHasDragged = false;
        }
    }, true);
}

// دمج معالج زر الرجوع الخاص بـ Capacitor Native (Android Back Button)
document.addEventListener('DOMContentLoaded', () => {
    initFabDrag();

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', () => {
            const invModal = document.getElementById('inventory-modal');
            if (invModal && invModal.style.display !== 'none') {
                closeInventory();
            } else if (lordStoreScreen && lordStoreScreen.style.display !== 'none') {
                closeLordStore();
            } else if (isPlaying || splitActive) {
                returnToMenu();
            } else if (shopModal.style.display !== 'none') {
                closeShop();
            } else if (mainMenu.style.display !== 'none') {
                window.Capacitor.Plugins.App.minimizeApp();
            }
        });
    }
});

// تسجيل الـ Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((registration) => {
            registration.update();
        }).catch((err) => {});
    });
}
