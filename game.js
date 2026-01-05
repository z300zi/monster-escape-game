// ==========================================
// 📺 نظام الإعلانات - AdMob
// ==========================================

const ADMOB_CONFIG = {
    appId: 'ca-app-pub-8134902334876876~8367263880',
    rewardedAdId: 'ca-app-pub-8134902334876876/1431493908',
    interstitialAdId: 'ca-app-pub-8134902334876876/7178644608'
};

const isCapacitorApp = typeof window.Capacitor !== 'undefined';
let gamesPlayedCount = 0;

async function initializeAdMob() {
    if (!isCapacitorApp) {
        console.log('📱 Browser mode - Ads disabled');
        return;
    }
    
    try {
        const { AdMob } = window.Capacitor.Plugins;
        await AdMob.initialize({
            requestTrackingAuthorization: true,
            initializeForTesting: false
        });
        
        console.log('✅ AdMob initialized');
        await loadRewardedAd();
        await loadInterstitialAd();
    } catch (error) {
        console.error('❌ AdMob init failed:', error);
    }
}

async function loadRewardedAd() {
    if (!isCapacitorApp) return;
    try {
        const { AdMob } = window.Capacitor.Plugins;
        await AdMob.prepareRewardVideoAd({
            adId: ADMOB_CONFIG.rewardedAdId,
            isTesting: false
        });
        console.log('✅ Rewarded ad loaded');
    } catch (error) {
        console.error('❌ Rewarded load failed:', error);
    }
}

async function showRewardedAd(onRewardCallback) {
    if (!isCapacitorApp) {
        const watch = confirm('🎬 Watch ad to continue?');
        if (watch && onRewardCallback) onRewardCallback();
        return;
    }
    
    try {
        const { AdMob } = window.Capacitor.Plugins;
        const result = await AdMob.showRewardVideoAd();
        if (result && result.rewarded && onRewardCallback) {
            console.log('✅ Reward given');
            onRewardCallback();
        }
        setTimeout(() => loadRewardedAd(), 1000);
    } catch (error) {
        console.error('❌ Show rewarded failed:', error);
    }
}

async function loadInterstitialAd() {
    if (!isCapacitorApp) return;
    try {
        const { AdMob } = window.Capacitor.Plugins;
        await AdMob.prepareInterstitial({
            adId: ADMOB_CONFIG.interstitialAdId,
            isTesting: false
        });
        console.log('✅ Interstitial loaded');
    } catch (error) {
        console.error('❌ Interstitial load failed:', error);
    }
}

async function showInterstitialAd() {
    if (!isCapacitorApp) return;
    try {
        const { AdMob } = window.Capacitor.Plugins;
        await AdMob.showInterstitial();
        console.log('✅ Interstitial shown');
        setTimeout(() => loadInterstitialAd(), 1000);
    } catch (error) {
        console.error('❌ Show interstitial failed:', error);
    }
}

// ==========================================
// نظام إدارة الحالة
// ==========================================

// تهيئة حالة اللاعب
let playerState = {
    playerName: 'Player' + Math.floor(Math.random() * 9999),
    gold: 1000,
    level: 1,
    unlocked: false,
    killCount: 0,
    highScore: 0,
    totalGoldEarned: 0,
    gamesPlayed: 0,
    achievements: [],
    monthlyScore: 0
};

// تحميل البيانات المحفوظة
if (localStorage.getItem('survivorState')) {
    try {
        playerState = JSON.parse(localStorage.getItem('survivorState'));
    } catch (e) {
        console.log('Error loading save:', e);
    }
}

function saveProgress() {
    localStorage.setItem('survivorState', JSON.stringify(playerState));
}

// الترتيب العالمي
let globalLeaderboard = [];
if (localStorage.getItem('globalLeaderboard')) {
    try {
        globalLeaderboard = JSON.parse(localStorage.getItem('globalLeaderboard'));
    } catch (e) {
        globalLeaderboard = [];
    }
}

function saveLeaderboard() {
    localStorage.setItem('globalLeaderboard', JSON.stringify(globalLeaderboard));
}

function updateLeaderboard(score, goldEarned) {
    const playerIndex = globalLeaderboard.findIndex(p => p.name === playerState.playerName);
    
    if (playerIndex !== -1) {
        if (score > globalLeaderboard[playerIndex].highScore) {
            globalLeaderboard[playerIndex].highScore = score;
        }
        globalLeaderboard[playerIndex].totalGold += goldEarned;
        globalLeaderboard[playerIndex].monthlyScore += score;
        globalLeaderboard[playerIndex].gamesPlayed++;
    } else {
        globalLeaderboard.push({
            name: playerState.playerName,
            highScore: score,
            totalGold: goldEarned,
            monthlyScore: score,
            gamesPlayed: 1,
            level: playerState.level
        });
    }
    
    globalLeaderboard.sort((a, b) => b.monthlyScore - a.monthlyScore);
    
    if (globalLeaderboard.length > 100) {
        globalLeaderboard = globalLeaderboard.slice(0, 100);
    }
    
    saveLeaderboard();
    return globalLeaderboard.findIndex(p => p.name === playerState.playerName) + 1;
}

// ==========================================
// القائمة الرئيسية
// ==========================================
class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    preload() {
        // لا نحتاج لتحميل صور خارجية
    }

    create() {
        // تهيئة الإعلانات
        if (typeof initializeAdMob === 'function') {
            initializeAdMob();
        }
        
        // خلفية متدرجة
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x000510, 0x000510, 0x001a33, 0x002244, 1);
        bg.fillRect(0, 0, 800, 600);

        // كوكب في الخلفية
        this.add.circle(150, 150, 80, 0x4a148c, 0.3);
        this.add.circle(150, 150, 60, 0x6a1b9a, 0.2);

        // النجوم
        this.createStars();

        // خلفية العنوان
        const titleBg = this.add.graphics();
        titleBg.fillStyle(0x000000, 0.6);
        titleBg.fillRoundedRect(100, 35, 600, 75, 15);
        titleBg.lineStyle(3, 0x00ffff, 0.8);
        titleBg.strokeRoundedRect(100, 35, 600, 75, 15);

        // العنوان
        const title = this.add.text(400, 72, '👾 MONSTER ESCAPE 👾', { 
            font: 'bold 48px Arial', 
            fill: '#00ff00' 
        }).setOrigin(0.5);
        title.setStroke('#00ff00', 3);
        title.setShadow(0, 0, '#00ff00', 15, true, true);
        
        // تأثير نبض
        this.tweens.add({
            targets: title,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // إنشاء قوام الشخصية
        this.createPlayerTexture();

        // البطاقة
        this.createCard();
    }

    createStars() {
        for (let i = 0; i < 100; i++) {
            const star = this.add.circle(
                Math.random() * 800, 
                Math.random() * 600, 
                Math.random() * 2, 
                0xffffff, 
                Math.random() * 0.8
            );
            this.tweens.add({
                targets: star,
                alpha: { from: 0.2, to: 1 },
                duration: 1000 + Math.random() * 2000,
                yoyo: true,
                loop: -1
            });
        }
    }

    createPlayerTexture() {
        const g = this.make.graphics({ add: false });
        
        // الرأس (بشري)
        g.fillStyle(0xffcc99, 1);
        g.fillCircle(100, 80, 25);
        
        // الشعر
        g.fillStyle(0x4a2511, 1);
        g.fillEllipse(100, 70, 28, 20);
        
        // العيون
        g.fillStyle(0xffffff, 1);
        g.fillCircle(92, 78, 5);
        g.fillCircle(108, 78, 5);
        g.fillStyle(0x000000, 1);
        g.fillCircle(92, 78, 3);
        g.fillCircle(108, 78, 3);
        
        // الفم
        g.lineStyle(2, 0x000000, 1);
        g.beginPath();
        g.arc(100, 88, 8, 0.2, Math.PI - 0.2, false);
        g.strokePath();
        
        // الجسم (قميص أزرق)
        g.fillStyle(0x4169e1, 1);
        g.fillRect(85, 105, 30, 35);
        
        // الأيدي
        g.fillStyle(0xffcc99, 1);
        g.fillRect(75, 110, 10, 25);
        g.fillRect(115, 110, 10, 25);
        
        // البنطال
        g.fillStyle(0x2c3e50, 1);
        g.fillRect(88, 140, 12, 30);
        g.fillRect(100, 140, 12, 30);
        
        // الأحذية
        g.fillStyle(0x000000, 1);
        g.fillEllipse(94, 172, 8, 5);
        g.fillEllipse(106, 172, 8, 5);
        
        g.generateTexture('playerChar', 200, 200);
        g.destroy();
    }

    createCard() {
        const cardX = 400, cardY = 300;
        
        // إطار البطاقة
        const frame = this.add.graphics();
        frame.lineStyle(3, 0x00ffff, 0.8);
        frame.strokeRoundedRect(cardX - 140, cardY - 180, 280, 420, 15);
        
        // الشخصية
        const char = this.add.image(cardX, cardY - 30, 'playerChar').setScale(0.6);
        
        // تأثير النبض
        this.tweens.add({
            targets: char,
            scaleX: 0.65,
            scaleY: 0.65,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
        
        // المعلومات
        this.add.text(cardX, cardY + 100, `YOUR GOLD: ${playerState.gold}`, { 
            font: '18px Arial', 
            fill: '#ffffff' 
        }).setOrigin(0.5);
        
        this.add.text(cardX, cardY + 125, `LEVEL: ${playerState.level}`, { 
            font: '18px Arial', 
            fill: '#00ff00' 
        }).setOrigin(0.5);
        
        if (playerState.highScore > 0) {
            this.add.text(cardX, cardY + 150, `HIGH SCORE: ${playerState.highScore}`, { 
                font: 'bold 16px Arial', 
                fill: '#ffd700' 
            }).setOrigin(0.5);
        }
        
        // السعر
        const priceY = playerState.highScore > 0 ? cardY + 175 : cardY + 150;
        this.add.text(cardX, priceY, `PRICE: 500 GOLD`, { 
            font: 'bold 20px Arial', 
            fill: '#ffd700' 
        }).setOrigin(0.5);
        
        // زر البدء
        const btnY = playerState.highScore > 0 ? cardY + 220 : cardY + 195;
        this.createButton(cardX, btnY);
    }

    createButton(x, y) {
        const container = this.add.container(x, y);
        const btnColor = playerState.unlocked ? 0x00ff00 : 0x00ffff;
        
        const bg = this.add.graphics();
        bg.fillStyle(0x001122, 0.9);
        bg.fillRoundedRect(-100, -25, 200, 50, 10);
        bg.lineStyle(2, btnColor, 1);
        bg.strokeRoundedRect(-100, -25, 200, 50, 10);
        
        const txt = this.add.text(0, 0, playerState.unlocked ? 'START BATTLE' : 'UNLOCK CARD', { 
            font: 'bold 18px Arial', 
            fill: '#fff' 
        }).setOrigin(0.5);
        
        container.add([bg, txt]);
        container.setSize(200, 50);
        container.setInteractive(new Phaser.Geom.Rectangle(-100, -25, 200, 50), Phaser.Geom.Rectangle.Contains);
        
        container.on('pointerdown', () => {
            if (playerState.unlocked) {
                this.scene.start('GameScene');
            } else if (playerState.gold >= 500) {
                playerState.gold -= 500;
                playerState.unlocked = true;
                saveProgress();
                this.scene.restart();
            } else {
                const msg = this.add.text(x, y + 60, 'NOT ENOUGH GOLD!', {
                    font: 'bold 20px Arial',
                    fill: '#ff0000'
                }).setOrigin(0.5);
                this.time.delayedCall(2000, () => msg.destroy());
            }
        });
        
        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x002244, 0.95);
            bg.fillRoundedRect(-100, -25, 200, 50, 10);
            bg.lineStyle(3, btnColor, 1);
            bg.strokeRoundedRect(-100, -25, 200, 50, 10);
            txt.setScale(1.05);
        });
        
        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x001122, 0.9);
            bg.fillRoundedRect(-100, -25, 200, 50, 10);
            bg.lineStyle(2, btnColor, 1);
            bg.strokeRoundedRect(-100, -25, 200, 50, 10);
            txt.setScale(1);
        });
    }
}

// ==========================================
// مشهد اللعب
// ==========================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // خلفية متدرجة ديناميكية
        this.bgLayer1 = this.add.graphics();
        this.bgLayer2 = this.add.graphics();
        this.updateDynamicBackground();
        
        // كواكب وسديم في الخلفية
        this.createSpaceBackground();
        
        // النجوم المتحركة
        this.createMovingStars();
        
        // إنشاء القوامات
        this.createTextures();
        
        // اللاعب مع تتبع المستوى
        this.player = this.physics.add.sprite(400, 300, 'playerChar').setScale(0.20);
        this.player.setCollideWorldBounds(true);
        this.playerLevel = 1;
        this.updatePlayerAppearance();
        
        // المجموعات
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        this.powerUps = this.physics.add.group();
        this.bossProjectiles = this.physics.add.group();
        this.boss = null;
        
        // متغيرات اللعبة
        this.lives = 3; // 3 قلوب
        this.currentKills = 0;
        this.gameOver = false;
        this.gameStartTime = Date.now();
        this.comboCount = 0;
        this.lastKillTime = 0;
        this.enemySpawnDelay = 1000; // يقل تدريجياً
        this.enemySpeed = 120; // يزيد تدريجياً
        this.invincible = false; // حماية مؤقتة بعد الإصابة
        
        // نظام الـ Boss
        this.bossActive = false;
        this.bossWaveNumber = 1;
        this.nextBossTime = 60000; // Boss كل 60 ثانية
        
        // نظام الإعلانات الإجبارية
        this.lastInterstitialTime = Date.now();
        this.interstitialInterval = 180000; // إعلان كل 3 دقائق (180 ثانية)
        
        // التحكم
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // إضافة التحكم باللمس للجوال
        this.setupMobileControls();
        
        // الأحداث - إطلاق أبطأ وأعداء أسرع
        this.fireRate = 700;
        this.fireTimer = this.time.addEvent({ delay: this.fireRate, callback: this.autoShoot, callbackScope: this, loop: true });
        this.spawnTimer = this.time.addEvent({ 
            delay: this.enemySpawnDelay, 
            callback: this.spawnEnemy, 
            callbackScope: this, 
            loop: true 
        });
        
        // ظهور المكافآت النادرة (كل 15-25 ثانية)
        this.schedulePowerUpSpawn();
        
        // التصادمات
        this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);
        this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);
        this.physics.add.overlap(this.player, this.bossProjectiles, this.hitByBossProjectile, null, this);
        
        // الواجهة
        this.createUI();
    }

    createTextures() {
        // الشخصية البشرية
        const pg = this.make.graphics({ add: false });
        
        // الرأس
        pg.fillStyle(0xffcc99, 1);
        pg.fillCircle(100, 80, 25);
        
        // الشعر
        pg.fillStyle(0x4a2511, 1);
        pg.fillEllipse(100, 70, 28, 20);
        
        // العيون
        pg.fillStyle(0xffffff, 1);
        pg.fillCircle(92, 78, 5);
        pg.fillCircle(108, 78, 5);
        pg.fillStyle(0x000000, 1);
        pg.fillCircle(92, 78, 3);
        pg.fillCircle(108, 78, 3);
        
        // الفم
        pg.lineStyle(2, 0x000000, 1);
        pg.beginPath();
        pg.arc(100, 88, 8, 0.2, Math.PI - 0.2, false);
        pg.strokePath();
        
        // الجسم (قميص أزرق)
        pg.fillStyle(0x4169e1, 1);
        pg.fillRect(85, 105, 30, 35);
        
        // الأيدي
        pg.fillStyle(0xffcc99, 1);
        pg.fillRect(75, 110, 10, 25);
        pg.fillRect(115, 110, 10, 25);
        
        // البنطال
        pg.fillStyle(0x2c3e50, 1);
        pg.fillRect(88, 140, 12, 30);
        pg.fillRect(100, 140, 12, 30);
        
        // الأحذية
        pg.fillStyle(0x000000, 1);
        pg.fillEllipse(94, 172, 8, 5);
        pg.fillEllipse(106, 172, 8, 5);
        
        pg.generateTexture('playerChar', 200, 200);
        pg.destroy();
        
        // الرصاصة
        const bg = this.make.graphics({ add: false });
        bg.fillStyle(0x00ffff, 1);
        bg.fillCircle(5, 5, 5);
        bg.generateTexture('bullet', 10, 10);
        bg.destroy();
        
        // الوحش العادي
        const eg = this.make.graphics({ add: false });
        
        // جسم الوحش الأخضر
        eg.fillStyle(0x00ff00, 1);
        eg.fillCircle(15, 18, 12);
        eg.fillEllipse(15, 25, 10, 8);
        
        // العيون المخيفة الحمراء
        eg.fillStyle(0xff0000, 1);
        eg.fillCircle(11, 16, 4);
        eg.fillCircle(19, 16, 4);
        
        // الفم المخيف مع الأنياب
        eg.fillStyle(0x000000, 1);
        eg.fillEllipse(15, 22, 6, 3);
        
        // أنياب بيضاء
        eg.fillStyle(0xffffff, 1);
        eg.fillTriangle(12, 20, 11, 24, 13, 23);
        eg.fillTriangle(18, 20, 17, 24, 19, 23);
        
        // قرون صغيرة
        eg.fillStyle(0x006600, 1);
        eg.fillTriangle(8, 10, 10, 6, 12, 10);
        eg.fillTriangle(18, 10, 20, 6, 22, 10);
        
        // مخالب/أذرع
        eg.fillStyle(0x00cc00, 1);
        eg.fillRect(5, 22, 4, 8);
        eg.fillRect(21, 22, 4, 8);
        
        eg.generateTexture('enemy', 30, 35);
        eg.destroy();
        
        // العدو Elite - وحش أكبر وأخطر
        const elite = this.make.graphics({ add: false });
        
        // جسم الوحش الأحمر الكبير
        elite.fillStyle(0xff0000, 1);
        elite.fillCircle(18, 20, 15);
        elite.fillEllipse(18, 28, 13, 10);
        
        // عيون متوهجة صفراء
        elite.fillStyle(0xffff00, 1);
        elite.fillCircle(13, 18, 5);
        elite.fillCircle(23, 18, 5);
        elite.fillStyle(0xff0000, 1);
        elite.fillCircle(13, 18, 3);
        elite.fillCircle(23, 18, 3);
        
        // فم مفتوح مخيف
        elite.fillStyle(0x000000, 1);
        elite.fillEllipse(18, 26, 8, 5);
        
        // أنياب كبيرة
        elite.fillStyle(0xffffff, 1);
        elite.fillTriangle(14, 24, 13, 29, 15, 28);
        elite.fillTriangle(22, 24, 21, 29, 23, 28);
        elite.fillTriangle(17, 24, 16, 28, 18, 27);
        
        // قرون كبيرة
        elite.fillStyle(0xaa0000, 1);
        elite.fillTriangle(8, 12, 10, 5, 13, 12);
        elite.fillTriangle(23, 12, 26, 5, 28, 12);
        
        // مخالب حادة
        elite.fillStyle(0xcc0000, 1);
        elite.fillRect(3, 25, 6, 12);
        elite.fillRect(27, 25, 6, 12);
        
        // هالة خطرة
        elite.lineStyle(2, 0xff8800, 0.8);
        elite.strokeCircle(18, 20, 18);
        
        elite.generateTexture('enemyElite', 36, 40);
        elite.destroy();
        
        // مكافأة القلب
        const heart = this.make.graphics({ add: false });
        heart.fillStyle(0xff1744, 1);
        heart.beginPath();
        heart.arc(10, 12, 8, Math.PI, 0, false);
        heart.arc(22, 12, 8, Math.PI, 0, false);
        heart.lineTo(16, 28);
        heart.closePath();
        heart.fillPath();
        heart.lineStyle(2, 0xff5252, 1);
        heart.strokePath();
        heart.generateTexture('heartPowerUp', 32, 32);
        heart.destroy();
        
        // مكافأة السرعة
        const speed = this.make.graphics({ add: false });
        speed.fillStyle(0xffeb3b, 1);
        speed.fillCircle(16, 16, 14);
        speed.fillStyle(0xffc107, 1);
        speed.fillCircle(16, 16, 10);
        // رمز البرق
        speed.fillStyle(0xffffff, 1);
        speed.beginPath();
        speed.moveTo(18, 8);
        speed.lineTo(14, 16);
        speed.lineTo(18, 16);
        speed.lineTo(14, 24);
        speed.lineTo(20, 14);
        speed.lineTo(16, 14);
        speed.closePath();
        speed.fillPath();
        speed.generateTexture('speedPowerUp', 32, 32);
        speed.destroy();
        
        // Boss - كائن ضخم مخيف
        const boss = this.make.graphics({ add: false });
        // جسم Boss الرئيسي
        boss.fillStyle(0x8b00ff, 1);
        boss.fillCircle(40, 40, 35);
        boss.fillStyle(0x6600cc, 1);
        boss.fillCircle(40, 40, 28);
        boss.fillStyle(0x4a0099, 1);
        boss.fillCircle(40, 40, 20);
        
        // عيون متوهجة مخيفة
        boss.fillStyle(0xff0000, 1);
        boss.fillCircle(28, 32, 8);
        boss.fillCircle(52, 32, 8);
        boss.fillStyle(0xff4444, 1);
        boss.fillCircle(28, 32, 4);
        boss.fillCircle(52, 32, 4);
        
        // قرون
        boss.fillStyle(0xff0000, 1);
        boss.fillTriangle(20, 15, 25, 5, 30, 15);
        boss.fillTriangle(50, 15, 55, 5, 60, 15);
        
        // هالة خطرة
        boss.lineStyle(4, 0xff0000, 0.8);
        boss.strokeCircle(40, 40, 38);
        boss.lineStyle(3, 0x8b00ff, 0.6);
        boss.strokeCircle(40, 40, 42);
        boss.lineStyle(2, 0xff00ff, 0.4);
        boss.strokeCircle(40, 40, 46);
        
        boss.generateTexture('boss', 80, 80);
        boss.destroy();
        
        // Boss Projectile - رصاصة Boss
        const bossProj = this.make.graphics({ add: false });
        bossProj.fillStyle(0xff0000, 1);
        bossProj.fillCircle(8, 8, 8);
        bossProj.fillStyle(0xff4444, 1);
        bossProj.fillCircle(8, 8, 5);
        bossProj.lineStyle(2, 0xff8800, 1);
        bossProj.strokeCircle(8, 8, 9);
        bossProj.generateTexture('bossProjectile', 16, 16);
        bossProj.destroy();
    }

    createUI() {
        // خلفية شفافة للـ UI العلوي
        const uiBg = this.add.graphics();
        uiBg.fillStyle(0x000000, 0.6);
        uiBg.fillRoundedRect(10, 10, 780, 95, 10);
        
        // إطار نيوني للـ UI
        const uiBorder = this.add.graphics();
        uiBorder.lineStyle(2, 0x00ffff, 0.8);
        uiBorder.strokeRoundedRect(10, 10, 780, 95, 10);
        
        // النصوص مع أيقونات
        this.scoreText = this.add.text(25, 25, `💰 ${playerState.gold}  |  💀 ${this.currentKills}  |  ⭐ LV.${playerState.level}`, { 
            font: 'bold 20px Arial', 
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        this.timeText = this.add.text(400, 25, '⏱️ 0:00', {
            font: 'bold 20px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // شريط XP للمستوى التالي
        this.createXPBar();
        
        this.comboText = this.add.text(400, 130, '', {
            font: 'bold 36px Arial',
            fill: '#ffff00',
            stroke: '#ff8800',
            strokeThickness: 4
        }).setOrigin(0.5).setVisible(false);
        
        // القلوب مع خلفية
        this.hearts = [];
        const heartsBg = this.add.graphics();
        heartsBg.fillStyle(0x000000, 0.5);
        heartsBg.fillRoundedRect(18, 58, 164, 50, 8);
        
        for (let i = 0; i < 3; i++) {
            const heart = this.add.text(35 + (i * 53), 68, '❤️', {
                font: 'bold 44px Arial'
            });
            this.hearts.push(heart);
            
            // تأثير نبض للقلوب
            this.tweens.add({
                targets: heart,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // زر القائمة المحسن
        const homeBtnBg = this.add.graphics();
        homeBtnBg.fillStyle(0x000000, 0.7);
        homeBtnBg.fillCircle(755, 30, 25);
        homeBtnBg.lineStyle(2, 0xff0000, 1);
        homeBtnBg.strokeCircle(755, 30, 25);
        
        const homeBtn = this.add.text(755, 30, '⌂', {
            font: 'bold 34px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();
        
        homeBtn.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
        
        homeBtn.on('pointerover', () => {
            homeBtn.setScale(1.2);
            homeBtn.setFill('#ff0000');
            homeBtnBg.clear();
            homeBtnBg.fillStyle(0x330000, 0.9);
            homeBtnBg.fillCircle(755, 30, 25);
            homeBtnBg.lineStyle(3, 0xff0000, 1);
            homeBtnBg.strokeCircle(755, 30, 28);
        });
        
        homeBtn.on('pointerout', () => {
            homeBtn.setScale(1);
            homeBtn.setFill('#ffffff');
            homeBtnBg.clear();
            homeBtnBg.fillStyle(0x000000, 0.7);
            homeBtnBg.fillCircle(755, 30, 25);
            homeBtnBg.lineStyle(2, 0xff0000, 1);
            homeBtnBg.strokeCircle(755, 30, 25);
        });
    }

    setupMobileControls() {
        // اكتشاف إذا كان الجهاز جوال
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (!this.isMobile) return;
        
        // إنشاء أزرار التحكم الافتراضية
        this.mobileButtons = {};
        const buttonSize = 70;
        const buttonAlpha = 0.6;
        const buttonY = 520;
        
        // زر اليسار
        this.mobileButtons.left = this.createMobileButton(80, buttonY, '←', buttonSize, buttonAlpha);
        this.mobileButtons.left.on('pointerdown', () => { this.mobileButtons.leftPressed = true; });
        this.mobileButtons.left.on('pointerup', () => { this.mobileButtons.leftPressed = false; });
        this.mobileButtons.left.on('pointerout', () => { this.mobileButtons.leftPressed = false; });
        
        // زر اليمين
        this.mobileButtons.right = this.createMobileButton(220, buttonY, '→', buttonSize, buttonAlpha);
        this.mobileButtons.right.on('pointerdown', () => { this.mobileButtons.rightPressed = true; });
        this.mobileButtons.right.on('pointerup', () => { this.mobileButtons.rightPressed = false; });
        this.mobileButtons.right.on('pointerout', () => { this.mobileButtons.rightPressed = false; });
        
        // زر الأعلى
        this.mobileButtons.up = this.createMobileButton(580, buttonY - 80, '↑', buttonSize, buttonAlpha);
        this.mobileButtons.up.on('pointerdown', () => { this.mobileButtons.upPressed = true; });
        this.mobileButtons.up.on('pointerup', () => { this.mobileButtons.upPressed = false; });
        this.mobileButtons.up.on('pointerout', () => { this.mobileButtons.upPressed = false; });
        
        // زر الأسفل
        this.mobileButtons.down = this.createMobileButton(580, buttonY, '↓', buttonSize, buttonAlpha);
        this.mobileButtons.down.on('pointerdown', () => { this.mobileButtons.downPressed = true; });
        this.mobileButtons.down.on('pointerup', () => { this.mobileButtons.downPressed = false; });
        this.mobileButtons.down.on('pointerout', () => { this.mobileButtons.downPressed = false; });
    }
    
    createMobileButton(x, y, text, size, alpha) {
        const container = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x333333, alpha);
        bg.fillCircle(0, 0, size / 2);
        bg.lineStyle(3, 0x00ff00, 0.8);
        bg.strokeCircle(0, 0, size / 2);
        
        const txt = this.add.text(0, 0, text, {
            font: 'bold 40px Arial',
            fill: '#00ff00'
        }).setOrigin(0.5);
        
        container.add([bg, txt]);
        container.setSize(size, size);
        container.setInteractive(new Phaser.Geom.Circle(0, 0, size / 2), Phaser.Geom.Circle.Contains);
        container.setScrollFactor(0);
        container.setDepth(1000);
        
        return container;
    }

    update() {
        if (this.gameOver) return;
        
        // الحركة مع تأثير أثر الحركة
        this.player.setVelocity(0);
        let isMoving = false;
        
        // دعم لوحة المفاتيح والأزرار الافتراضية
        const leftPressed = this.cursors.left.isDown || (this.mobileButtons && this.mobileButtons.leftPressed);
        const rightPressed = this.cursors.right.isDown || (this.mobileButtons && this.mobileButtons.rightPressed);
        const upPressed = this.cursors.up.isDown || (this.mobileButtons && this.mobileButtons.upPressed);
        const downPressed = this.cursors.down.isDown || (this.mobileButtons && this.mobileButtons.downPressed);
        
        if (leftPressed) {
            this.player.setVelocityX(-300);
            isMoving = true;
        } else if (rightPressed) {
            this.player.setVelocityX(300);
            isMoving = true;
        }
        if (upPressed) {
            this.player.setVelocityY(-300);
            isMoving = true;
        } else if (downPressed) {
            this.player.setVelocityY(300);
            isMoving = true;
        }
        
        // أثر حركة للاعب (كل 100ms)
        if (isMoving && !this.lastTrailTime) this.lastTrailTime = 0;
        if (isMoving && Date.now() - this.lastTrailTime > 100) {
            this.createPlayerTrail();
            this.lastTrailTime = Date.now();
        }
        
        // الأعداء يتابعون اللاعب ديناميكياً (أصعب!)
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) {
                this.physics.moveToObject(enemy, this.player, this.enemySpeed);
            }
        });
        
        // تحديث الوقت
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.timeText.setText(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        
        // تحديث القلوب
        this.updateHearts();
        
        // عرض إعلان إجباري كل 3 دقائق (أثناء اللعب فقط)
        const timeSinceLastAd = Date.now() - this.lastInterstitialTime;
        if (timeSinceLastAd >= this.interstitialInterval) {
            this.lastInterstitialTime = Date.now();
            if (typeof showInterstitialAd === 'function') {
                showInterstitialAd();
            }
        }
        
        // تحديث النجوم المتحركة
        this.updateMovingStars();
        
        // تحديث هالة اللاعب
        if (this.playerAura) {
            this.playerAura.forEach(aura => {
                if (aura && aura.active) {
                    aura.x = this.player.x;
                    aura.y = this.player.y;
                }
            });
        }
        
        // الكومبو
        if (this.comboCount > 0 && Date.now() - this.lastKillTime > 3000) {
            this.comboCount = 0;
            this.comboText.setVisible(false);
        }
        
        // تحديث شريط XP
        this.updateXPBar();
        
        // الترقية
        if (this.currentKills >= playerState.level * 10) {
            this.levelUp();
        }
        
        // فحص ظهور Boss
        if (!this.bossActive && elapsed * 1000 >= this.nextBossTime) {
            this.spawnBoss();
        }
        
        // تحديث Boss
        if (this.boss && this.boss.active) {
            this.updateBoss();
        }
    }

    updateHearts() {
        // تحديث عرض القلوب
        for (let i = 0; i < 3; i++) {
            if (i < this.lives) {
                this.hearts[i].setText('❤️'); // قلب ممتلئ
                this.hearts[i].setAlpha(1);
            } else {
                this.hearts[i].setText('🖤'); // قلب فارغ
                this.hearts[i].setAlpha(0.5);
            }
        }
    }

    autoShoot() {
        if (this.gameOver) return;
        
        let closest = null;
        let minDist = Infinity;
        let targetIsBoss = false;
        
        // إعطاء الأولوية للـ Boss
        if (this.boss && this.boss.active) {
            closest = this.boss;
            targetIsBoss = true;
        } else {
            // البحث عن أقرب عدو
            this.enemies.getChildren().forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    enemy.x, enemy.y
                );
                if (dist < minDist) {
                    minDist = dist;
                    closest = enemy;
                }
            });
        }
        
        if (closest) {
            const bullet = this.projectiles.create(this.player.x, this.player.y, 'bullet');
            const angle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                closest.x, closest.y
            );
            this.physics.velocityFromRotation(angle, 600, bullet.body.velocity);
            
            // وضع علامة إذا كانت نحو Boss
            if (targetIsBoss) {
                bullet.setData('targetBoss', true);
            }
        }
    }

    spawnEnemy() {
        if (this.gameOver) return;
        
        let x, y;
        const edge = Math.floor(Math.random() * 4);
        
        if (edge === 0) { x = Math.random() * 800; y = -20; }
        else if (edge === 1) { x = 820; y = Math.random() * 600; }
        else if (edge === 2) { x = Math.random() * 800; y = 620; }
        else { x = -20; y = Math.random() * 600; }
        
        // فرصة 20% لظهور عدو Elite (أصعب)
        const isElite = Math.random() < 0.2 && playerState.level >= 2;
        const enemyType = isElite ? 'enemyElite' : 'enemy';
        const enemy = this.enemies.create(x, y, enemyType);
        
        // وضع علامة على العدو Elite
        if (isElite) {
            enemy.setData('elite', true);
            enemy.setData('health', 2); // يحتاج ضربتين
            enemy.setScale(1.2);
        }
        
        // سرعة تزيد مع المستوى والوقت
        const timeBonus = Math.floor((Date.now() - this.gameStartTime) / 10000) * 10; // +10 كل 10 ثواني
        this.enemySpeed = 120 + (playerState.level * 15) + timeBonus;
        
        const speed = isElite ? this.enemySpeed * 1.4 : this.enemySpeed; // Elite أسرع بـ 40%
        this.physics.moveToObject(enemy, this.player, speed);
        
        // تقليل وقت ظهور الأعداء تدريجياً (أكثر أعداء)
        if (this.currentKills % 5 === 0 && this.enemySpawnDelay > 400) {
            this.enemySpawnDelay -= 30;
            this.spawnTimer.delay = this.enemySpawnDelay;
        }
        
        // فرصة 20% لظهور عدوين بدلاً من واحد (زيادة من 15%)
        if (Math.random() < 0.2 && playerState.level >= 2) {
            this.time.delayedCall(200, () => {
                const x2 = edge === 0 ? Math.random() * 800 : (edge === 2 ? Math.random() * 800 : (edge === 1 ? 820 : -20));
                const y2 = edge === 1 ? Math.random() * 600 : (edge === 3 ? Math.random() * 600 : (edge === 0 ? -20 : 620));
                const enemy2 = this.enemies.create(x2, y2, 'enemy');
                this.physics.moveToObject(enemy2, this.player, this.enemySpeed);
            });
        }
    }

    hitEnemy(projectile, enemy) {
        if (this.gameOver) return;
        
        // التحقق إذا كان Boss
        if (projectile.getData('targetBoss') && enemy === this.boss) {
            this.hitBoss(projectile, enemy);
            return;
        }
        
        projectile.destroy();
        
        // التحقق من Elite Enemy
        const isElite = enemy.getData('elite');
        
        if (isElite) {
            let health = enemy.getData('health') || 2;
            health--;
            
            if (health > 0) {
                // Elite لم يُقتل بعد، فقط وميض
                enemy.setData('health', health);
                enemy.setTint(0xff8800);
                this.time.delayedCall(100, () => {
                    if (enemy.active) enemy.clearTint();
                });
                
                // نص تحذيري
                const warnText = this.add.text(enemy.x, enemy.y - 20, 'ELITE!', {
                    font: 'bold 14px Arial',
                    fill: '#ff8800'
                }).setOrigin(0.5);
                
                this.tweens.add({
                    targets: warnText,
                    y: enemy.y - 40,
                    alpha: 0,
                    duration: 600,
                    onComplete: () => warnText.destroy()
                });
                
                return; // لا يموت بعد
            }
        }
        
        enemy.destroy();
        
        // الكومبو
        if (Date.now() - this.lastKillTime < 3000) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }
        this.lastKillTime = Date.now();
        
        const multi = 1 + (Math.floor(this.comboCount / 5) * 0.5);
        const baseGold = isElite ? 12 : 5; // Elite يعطي ذهب أكثر
        const goldEarned = Math.floor(baseGold * multi);
        
        playerState.gold += goldEarned;
        playerState.killCount++;
        this.currentKills++;
        saveProgress();
        
        // الكومبو UI
        if (this.comboCount > 1) {
            this.comboText.setText(`${this.comboCount}x COMBO! +${goldEarned} 💰`);
            this.comboText.setVisible(true);
        }
        
        this.scoreText.setText(`💰 ${playerState.gold}  |  💀 ${this.currentKills}  |  ⭐ LV.${playerState.level}`);
        
        // تأثير (أكبر للـ Elite)
        const expColor = isElite ? 0xff8800 : 0x00ffff;
        const expSize = isElite ? 20 : 15;
        const exp = this.add.circle(enemy.x, enemy.y, expSize, expColor, 0.8);
        this.tweens.add({
            targets: exp,
            scaleX: isElite ? 4 : 3,
            scaleY: isElite ? 4 : 3,
            alpha: 0,
            duration: 400,
            onComplete: () => exp.destroy()
        });
        
        // نص الذهب
        const goldText = this.add.text(enemy.x, enemy.y, isElite ? `+${goldEarned} ⭐` : `+${goldEarned}`, {
            font: isElite ? 'bold 18px Arial' : 'bold 16px Arial',
            fill: isElite ? '#ff8800' : '#ffd700'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: goldText,
            y: enemy.y - 40,
            alpha: 0,
            duration: 1000,
            onComplete: () => goldText.destroy()
        });
    }

    playerHit(player, enemy) {
        if (this.gameOver || this.invincible) return;
        
        const isElite = enemy.getData('elite');
        enemy.destroy();
        
        // خسارة قلب واحد
        this.lives--;
        
        // عرض نص خسارة القلب
        const damageText = this.add.text(player.x, player.y - 30, isElite ? '-1 ❤️ ELITE!' : '-1 ❤️', {
            font: 'bold 24px Arial',
            fill: isElite ? '#ff4400' : '#ff0000'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: damageText,
            y: player.y - 70,
            alpha: 0,
            duration: 1000,
            onComplete: () => damageText.destroy()
        });
        
        this.comboCount = 0;
        this.comboText.setVisible(false);
        
        this.cameras.main.shake(isElite ? 500 : 400, isElite ? 0.025 : 0.02);
        
        // حماية مؤقتة 2 ثانية
        this.invincible = true;
        
        // تأثير وميض
        let flashCount = 0;
        const flashInterval = this.time.addEvent({
            delay: 150,
            callback: () => {
                if (this.player.alpha === 1) {
                    this.player.setAlpha(0.3);
                } else {
                    this.player.setAlpha(1);
                }
                flashCount++;
                if (flashCount >= 12) { // 6 ومضات × 2
                    flashInterval.remove();
                    this.player.setAlpha(1);
                    this.invincible = false;
                }
            },
            loop: true
        });
        
        // التحقق من Game Over
        if (this.lives <= 0) {
            this.lives = 0;
            this.triggerGameOver();
        }
    }

    levelUp() {
        playerState.level++;
        
        // استعادة قلب واحد (إذا كان ناقص)
        const heartRestored = this.lives < 3;
        if (heartRestored) {
            this.lives = Math.min(this.lives + 1, 3);
        }
        
        saveProgress();
        
        // تحديث مظهر الشخصية
        this.updatePlayerAppearance();
        
        // تحديث الخلفية
        this.updateDynamicBackground();
        
        // تأثير تطور الشخصية
        const evolutionText = this.getEvolutionText(playerState.level);
        if (evolutionText) {
            const evoMsg = this.add.text(400, 360, evolutionText, {
                font: 'bold 24px Arial',
                fill: this.getEvolutionColor(playerState.level),
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: evoMsg,
                scaleX: { from: 0, to: 1.2 },
                scaleY: { from: 0, to: 1.2 },
                alpha: { from: 1, to: 0 },
                duration: 2000,
                onComplete: () => evoMsg.destroy()
            });
        }
        
        const lvlText = this.add.text(400, 280, `LEVEL UP!\nLevel ${playerState.level}`, {
            font: 'bold 40px Arial',
            fill: '#00ff00',
            align: 'center'
        }).setOrigin(0.5);
        
        lvlText.setStroke('#ffffff', 4);
        
        this.tweens.add({
            targets: lvlText,
            scaleX: { from: 0.5, to: 1.5 },
            scaleY: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 2000,
            onComplete: () => lvlText.destroy()
        });
        
        // رسالة استعادة القلب
        if (heartRestored) {
            const heartText = this.add.text(400, 340, '+1 ❤️ Heart Restored!', {
                font: 'bold 24px Arial',
                fill: '#ff66aa'
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: heartText,
                y: 320,
                alpha: { from: 1, to: 0 },
                duration: 2000,
                onComplete: () => heartText.destroy()
            });
        }
        
        // رسالة تحذيرية بزيادة الصعوبة
        const diffText = this.add.text(400, 380, 'Difficulty Increased! 🔥', {
            font: 'bold 20px Arial',
            fill: '#ff4444'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: diffText,
            alpha: { from: 1, to: 0 },
            duration: 2000,
            onComplete: () => diffText.destroy()
        });
        
        this.scoreText.setText(`💰 ${playerState.gold}  |  💀 ${this.currentKills}  |  ⭐ LV.${playerState.level}`);
    }

    triggerGameOver() {
        this.gameOver = true;
        
        playerState.gamesPlayed++;
        gamesPlayedCount++;
        
        if (this.currentKills > playerState.highScore) {
            playerState.highScore = this.currentKills;
        }
        
        playerState.monthlyScore += this.currentKills;
        saveProgress();
        
        const rank = updateLeaderboard(this.currentKills, this.currentKills * 5);
        
        this.player.setVelocity(0);
        this.player.setTint(0x666666);
        
        this.enemies.clear(true, true);
        this.projectiles.clear(true, true);
        this.powerUps.clear(true, true);
        this.bossProjectiles.clear(true, true);
        
        // تنظيف Boss
        if (this.boss && this.boss.active) this.boss.destroy();
        if (this.bossglow && this.bossglow.active) this.bossglow.destroy();
        if (this.bossHealthBg) this.bossHealthBg.destroy();
        if (this.bossHealthBorder) this.bossHealthBorder.destroy();
        if (this.bossHealthBar) this.bossHealthBar.destroy();
        if (this.bossHealthText) this.bossHealthText.destroy();
        if (this.bossNameText) this.bossNameText.destroy();
        if (this.bossShootTimer) this.bossShootTimer.remove();
        
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        
        const gameOverText = this.add.text(400, 150, 'GAME OVER', {
            font: 'bold 60px Arial',
            fill: '#ff0000'
        }).setOrigin(0.5);
        gameOverText.setStroke('#ffffff', 4);
        
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const stats = this.add.text(400, 260, 
            `Kills: ${this.currentKills}\n` +
            `Time: ${minutes}:${seconds.toString().padStart(2, '0')}\n` +
            `Gold Earned: ${this.currentKills * 5}\n` +
            `High Score: ${playerState.highScore}\n` +
            `Rank: #${rank}`,
            {
                font: 'bold 20px Arial',
                fill: '#ffffff',
                align: 'center',
                lineSpacing: 5
            }
        ).setOrigin(0.5);
        
        // زر الإعلان (إذا قتل 10 على الأقل)
        if (this.currentKills >= 10) {
            this.createAdButton(400, 370, '🎬 CONTINUE - WATCH AD', () => {
                showRewardedAd(() => {
                    this.scene.restart();
                });
            });
        }
        
        this.createGameOverButton(400, 430, 'RETRY', () => {
            this.scene.restart();
        });
        
        this.createGameOverButton(400, 500, 'MAIN MENU', () => {
            this.scene.start('MainMenu');
        });
    }

    schedulePowerUpSpawn() {
        if (this.gameOver) return;
        
        // ظهور عشوائي كل 15-25 ثانية
        const delay = 15000 + Math.random() * 10000;
        
        this.time.delayedCall(delay, () => {
            this.spawnPowerUp();
            this.schedulePowerUpSpawn(); // جدولة التالي
        });
    }

    spawnPowerUp() {
        if (this.gameOver) return;
        
        // موقع عشوائي داخل الشاشة (ليس على الحواف)
        const x = 100 + Math.random() * 600;
        const y = 100 + Math.random() * 400;
        
        // إعلان عن ظهور المكافأة
        const announcement = this.add.text(400, 150, '🎁 POWER-UP APPEARED! 🎁', {
            font: 'bold 24px Arial',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);
        
        this.tweens.add({
            targets: announcement,
            alpha: 1,
            scaleX: { from: 0.5, to: 1.2 },
            scaleY: { from: 0.5, to: 1.2 },
            duration: 500,
            yoyo: true,
            onComplete: () => announcement.destroy()
        });
        
        // نوع عشوائي: 60% قلب، 40% سرعة
        const type = Math.random() < 0.6 ? 'heart' : 'speed';
        const texture = type === 'heart' ? 'heartPowerUp' : 'speedPowerUp';
        
        const powerUp = this.powerUps.create(x, y, texture);
        powerUp.setData('type', type);
        powerUp.setScale(0);
        
        // ظهور مع تأثير انفجار
        this.tweens.add({
            targets: powerUp,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });
        
        // دوائر توهج خلفية
        const glowColor = type === 'heart' ? 0xff1744 : 0xffeb3b;
        const glow = this.add.circle(x, y, 25, glowColor, 0.3);
        powerUp.setData('glow', glow);
        
        this.tweens.add({
            targets: glow,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: { from: 0.3, to: 0.1 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // تأثير نبض
        this.tweens.add({
            targets: powerUp,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // دوران بطيء
        this.tweens.add({
            targets: powerUp,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // نص توضيحي يتحرك مع المكافأة
        const label = type === 'heart' ? '+1 ❤️' : '⚡ SPEED';
        const labelColor = type === 'heart' ? '#ff1744' : '#ffeb3b';
        
        const text = this.add.text(x, y - 30, label, {
            font: 'bold 18px Arial',
            fill: labelColor,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        powerUp.setData('label', text);
        
        // تأثير حركة عمودية للنص
        this.tweens.add({
            targets: text,
            y: y - 40,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // يختفي بعد 10 ثواني
        this.time.delayedCall(10000, () => {
            if (powerUp.active) {
                const glowToDestroy = powerUp.getData('glow');
                // تأثير اختفاء
                this.tweens.add({
                    targets: [powerUp, text, glowToDestroy],
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0,
                    duration: 500,
                    onComplete: () => {
                        if (powerUp.active) powerUp.destroy();
                        if (text.active) text.destroy();
                        if (glowToDestroy && glowToDestroy.active) glowToDestroy.destroy();
                    }
                });
            }
        });
    }

    collectPowerUp(player, powerUp) {
        const type = powerUp.getData('type');
        const label = powerUp.getData('label');
        const glow = powerUp.getData('glow');
        
        // إزالة المكافأة
        powerUp.destroy();
        if (label) label.destroy();
        if (glow) glow.destroy();
        
        // تطبيق المكافأة
        if (type === 'heart') {
            // استعادة قلب
            if (this.lives < 3) {
                this.lives++;
                
                // رسالة
                const text = this.add.text(player.x, player.y - 50, '+1 ❤️ LIFE!', {
                    font: 'bold 28px Arial',
                    fill: '#ff1744'
                }).setOrigin(0.5);
                
                this.tweens.add({
                    targets: text,
                    y: player.y - 100,
                    alpha: 0,
                    duration: 1500,
                    onComplete: () => text.destroy()
                });
                
                // تأثير صوتي بصري
                const circle = this.add.circle(player.x, player.y, 20, 0xff1744, 0.6);
                this.tweens.add({
                    targets: circle,
                    scaleX: 4,
                    scaleY: 4,
                    alpha: 0,
                    duration: 600,
                    onComplete: () => circle.destroy()
                });
            } else {
                // القلوب ممتلئة - كسب ذهب بدلاً
                playerState.gold += 100;
                saveProgress();
                
                const text = this.add.text(player.x, player.y - 50, '+100 💰 BONUS!', {
                    font: 'bold 28px Arial',
                    fill: '#ffd700'
                }).setOrigin(0.5);
                
                this.tweens.add({
                    targets: text,
                    y: player.y - 100,
                    alpha: 0,
                    duration: 1500,
                    onComplete: () => text.destroy()
                });
                
                this.scoreText.setText(`💰 ${playerState.gold}  |  💀 ${this.currentKills}  |  ⭐ LV.${playerState.level}`);
            }
            
        } else if (type === 'speed') {
            // سرعة إطلاق مضاعفة لمدة 10 ثواني
            this.fireRate = 300; // أسرع جداً!
            this.fireTimer.delay = this.fireRate;
            
            // رسالة
            const text = this.add.text(player.x, player.y - 50, '⚡ RAPID FIRE!', {
                font: 'bold 28px Arial',
                fill: '#ffeb3b'
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: text,
                y: player.y - 100,
                alpha: 0,
                duration: 1500,
                onComplete: () => text.destroy()
            });
            
            // مؤشر بصري
            const speedIndicator = this.add.text(400, 80, '⚡ RAPID FIRE ⚡', {
                font: 'bold 24px Arial',
                fill: '#ffeb3b',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
            
            // تأثير لون للاعب
            player.setTint(0xffeb3b);
            
            // إلغاء بعد 10 ثواني
            this.time.delayedCall(10000, () => {
                this.fireRate = 700;
                this.fireTimer.delay = this.fireRate;
                
                if (speedIndicator.active) {
                    this.tweens.add({
                        targets: speedIndicator,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => speedIndicator.destroy()
                    });
                }
                
                if (player.active) player.clearTint();
            });
            
            // تأثير دائرة
            const circle = this.add.circle(player.x, player.y, 20, 0xffeb3b, 0.6);
            this.tweens.add({
                targets: circle,
                scaleX: 4,
                scaleY: 4,
                alpha: 0,
                duration: 600,
                onComplete: () => circle.destroy()
            });
        }
    }

    spawnBoss() {
        this.bossActive = true;
        
        // تحذير قبل 3 ثواني
        const warning = this.add.text(400, 300, '⚠️ WARNING ⚠️\nBOSS INCOMING!', {
            font: 'bold 50px Arial',
            fill: '#ff0000',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // تأثير وميض
        this.tweens.add({
            targets: warning,
            alpha: { from: 1, to: 0.3 },
            scaleX: { from: 1, to: 1.2 },
            scaleY: { from: 1, to: 1.2 },
            duration: 500,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                warning.destroy();
                this.actuallySpawnBoss();
            }
        });
        
        // إيقاف ظهور الأعداء العادية مؤقتاً
        this.spawnTimer.paused = true;
        
        // تصفية الأعداء الموجودة
        this.enemies.getChildren().forEach(enemy => {
            const exp = this.add.circle(enemy.x, enemy.y, 10, 0x00ffff, 0.8);
            this.tweens.add({
                targets: exp,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 300,
                onComplete: () => exp.destroy()
            });
            enemy.destroy();
        });
    }

    actuallySpawnBoss() {
        // ظهور Boss من الأعلى
        this.boss = this.physics.add.sprite(400, -50, 'boss');
        this.boss.setScale(1.5);
        
        // صحة Boss (تزيد مع الموجات)
        const bossHealth = 15 + (this.bossWaveNumber * 5);
        this.boss.setData('health', bossHealth);
        this.boss.setData('maxHealth', bossHealth);
        this.boss.setData('isBoss', true);
        
        // نزول تدريجي
        this.tweens.add({
            targets: this.boss,
            y: 150,
            duration: 2000,
            ease: 'Bounce.easeOut'
        });
        
        // شريط صحة Boss
        this.createBossHealthBar();
        
        // Boss يطلق نار كل ثانية
        this.bossShootTimer = this.time.addEvent({
            delay: 1000,
            callback: this.bossShoot,
            callbackScope: this,
            loop: true
        });
        
        // تأثير توهج
        this.bossglow = this.add.circle(this.boss.x, this.boss.y, 50, 0x8b00ff, 0.3);
        this.tweens.add({
            targets: this.bossglow,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: { from: 0.3, to: 0.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // دوران بطيء
        this.tweens.add({
            targets: this.boss,
            angle: 360,
            duration: 4000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // اسم Boss
        this.bossNameText = this.add.text(400, 50, `👾 BOSS WAVE ${this.bossWaveNumber} 👾`, {
            font: 'bold 28px Arial',
            fill: '#ff00ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    createBossHealthBar() {
        // خلفية
        this.bossHealthBg = this.add.graphics();
        this.bossHealthBg.fillStyle(0x000000, 0.8);
        this.bossHealthBg.fillRoundedRect(150, 85, 500, 20, 10);
        
        // الإطار
        this.bossHealthBorder = this.add.graphics();
        this.bossHealthBorder.lineStyle(3, 0xff0000, 1);
        this.bossHealthBorder.strokeRoundedRect(150, 85, 500, 20, 10);
        
        // الشريط
        this.bossHealthBar = this.add.graphics();
        
        // النص
        const health = this.boss.getData('health');
        const maxHealth = this.boss.getData('maxHealth');
        this.bossHealthText = this.add.text(400, 95, `${health}/${maxHealth}`, {
            font: 'bold 14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }

    updateBossHealthBar() {
        if (!this.boss || !this.boss.active) return;
        
        const health = this.boss.getData('health');
        const maxHealth = this.boss.getData('maxHealth');
        const percent = health / maxHealth;
        const width = 496 * percent;
        
        this.bossHealthBar.clear();
        this.bossHealthBar.fillStyle(0xff0000, 1);
        this.bossHealthBar.fillRoundedRect(152, 87, width, 16, 8);
        
        this.bossHealthText.setText(`${health}/${maxHealth}`);
    }

    updateBoss() {
        if (!this.boss || !this.boss.active) return;
        
        // تحديث موقع التوهج
        if (this.bossglow && this.bossglow.active) {
            this.bossglow.x = this.boss.x;
            this.bossglow.y = this.boss.y;
        }
        
        // حركة Boss (يسار ويمين)
        if (!this.boss.getData('moving')) {
            this.boss.setData('moving', true);
            const targetX = 100 + Math.random() * 600;
            
            this.tweens.add({
                targets: this.boss,
                x: targetX,
                duration: 2000,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    if (this.boss && this.boss.active) {
                        this.boss.setData('moving', false);
                    }
                }
            });
        }
    }

    bossShoot() {
        if (!this.boss || !this.boss.active || this.gameOver) return;
        
        // إطلاق 3 رصاصات في اتجاهات مختلفة
        for (let i = 0; i < 3; i++) {
            const proj = this.bossProjectiles.create(this.boss.x, this.boss.y, 'bossProjectile');
            
            // زاوية نحو اللاعب مع انحراف
            const angleToPlayer = Phaser.Math.Angle.Between(
                this.boss.x, this.boss.y,
                this.player.x, this.player.y
            );
            
            const spread = (i - 1) * 0.3; // انحراف
            const finalAngle = angleToPlayer + spread;
            
            this.physics.velocityFromRotation(finalAngle, 200, proj.body.velocity);
            
            // تأثير دوران
            this.tweens.add({
                targets: proj,
                angle: 360,
                duration: 1000,
                repeat: -1
            });
        }
    }

    hitByBossProjectile(player, projectile) {
        if (this.gameOver || this.invincible) return;
        
        projectile.destroy();
        
        // ضرر مضاعف من Boss
        this.lives--;
        
        const damageText = this.add.text(player.x, player.y - 30, '-1 ❤️ BOSS HIT!', {
            font: 'bold 26px Arial',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: damageText,
            y: player.y - 80,
            alpha: 0,
            duration: 1000,
            onComplete: () => damageText.destroy()
        });
        
        this.comboCount = 0;
        this.comboText.setVisible(false);
        
        this.cameras.main.shake(600, 0.03);
        
        this.invincible = true;
        let flashCount = 0;
        const flashInterval = this.time.addEvent({
            delay: 150,
            callback: () => {
                this.player.setAlpha(this.player.alpha === 1 ? 0.3 : 1);
                flashCount++;
                if (flashCount >= 12) {
                    flashInterval.remove();
                    this.player.setAlpha(1);
                    this.invincible = false;
                }
            },
            loop: true
        });
        
        if (this.lives <= 0) {
            this.lives = 0;
            this.triggerGameOver();
        }
    }

    hitBoss(projectile, boss) {
        if (!boss || !boss.active) return;
        
        projectile.destroy();
        
        let health = boss.getData('health');
        health--;
        boss.setData('health', health);
        
        // تأثير ضرب Boss
        boss.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (boss.active) boss.clearTint();
        });
        
        this.updateBossHealthBar();
        
        // نص الضرر
        const dmgText = this.add.text(boss.x, boss.y, '-1', {
            font: 'bold 20px Arial',
            fill: '#ffff00'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: dmgText,
            y: boss.y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => dmgText.destroy()
        });
        
        // موت Boss
        if (health <= 0) {
            this.defeatBoss();
        }
    }

    defeatBoss() {
        if (!this.boss || !this.boss.active) return;
        
        this.bossActive = false;
        
        // إيقاف إطلاق Boss
        if (this.bossShootTimer) {
            this.bossShootTimer.remove();
        }
        
        // انفجار Boss
        for (let i = 0; i < 10; i++) {
            this.time.delayedCall(i * 100, () => {
                const x = this.boss.x + (Math.random() - 0.5) * 80;
                const y = this.boss.y + (Math.random() - 0.5) * 80;
                const exp = this.add.circle(x, y, 20, 0xff00ff, 0.8);
                
                this.tweens.add({
                    targets: exp,
                    scaleX: 4,
                    scaleY: 4,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => exp.destroy()
                });
            });
        }
        
        // مكافآت Boss
        const goldReward = 200 + (this.bossWaveNumber * 50);
        playerState.gold += goldReward;
        playerState.killCount += 5;
        this.currentKills += 5;
        saveProgress();
        
        // رسالة النصر
        const victoryText = this.add.text(400, 250, `🎉 BOSS DEFEATED! 🎉\n+${goldReward} GOLD\n+5 KILLS`, {
            font: 'bold 36px Arial',
            fill: '#00ff00',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: victoryText,
            scaleX: { from: 0, to: 1.2 },
            scaleY: { from: 0, to: 1.2 },
            duration: 1000,
            yoyo: true,
            onComplete: () => victoryText.destroy()
        });
        
        // تنظيف
        this.time.delayedCall(500, () => {
            if (this.boss && this.boss.active) this.boss.destroy();
            if (this.bossglow && this.bossglow.active) this.bossglow.destroy();
            if (this.bossHealthBg) this.bossHealthBg.destroy();
            if (this.bossHealthBorder) this.bossHealthBorder.destroy();
            if (this.bossHealthBar) this.bossHealthBar.destroy();
            if (this.bossHealthText) this.bossHealthText.destroy();
            if (this.bossNameText) this.bossNameText.destroy();
            
            this.bossProjectiles.clear(true, true);
            
            // استئناف الأعداء العادية
            this.spawnTimer.paused = false;
            
            // Boss التالي
            this.bossWaveNumber++;
            this.nextBossTime = (Date.now() - this.gameStartTime) + 60000;
        });
        
        this.scoreText.setText(`💰 ${playerState.gold}  |  💀 ${this.currentKills}  |  ⭐ LV.${playerState.level}`);
        
        // إسقاط مكافأة مضمونة
        this.time.delayedCall(1000, () => {
            this.spawnPowerUp();
        });
    }

    updateDynamicBackground() {
        // خلفية متدرجة تتغير مع المستوى
        const level = playerState.level || 1;
        
        // ألوان تتطور مع المستوى
        let color1, color2, color3;
        if (level < 3) {
            color1 = 0x000510; color2 = 0x001a33; color3 = 0x002244;
        } else if (level < 5) {
            color1 = 0x050510; color2 = 0x1a0033; color3 = 0x220044;
        } else if (level < 7) {
            color1 = 0x100510; color2 = 0x300033; color3 = 0x440055;
        } else {
            color1 = 0x150510; color2 = 0x400033; color3 = 0x660077;
        }
        
        this.bgLayer1.clear();
        this.bgLayer1.fillGradientStyle(color1, color1, color2, color2, 1);
        this.bgLayer1.fillRect(0, 0, 800, 600);
        
        this.bgLayer2.clear();
        this.bgLayer2.fillGradientStyle(color2, color2, color3, color3, 0.5);
        this.bgLayer2.fillRect(0, 300, 800, 300);
    }

    createSpaceBackground() {
        // كوكب بعيد
        const planet = this.add.circle(650, 120, 60, 0x4a148c, 0.4);
        this.add.circle(650, 120, 50, 0x6a1b9a, 0.3);
        
        // سديم
        for (let i = 0; i < 5; i++) {
            const nebula = this.add.circle(
                Math.random() * 800,
                Math.random() * 300,
                50 + Math.random() * 100,
                0x3949ab,
                0.1
            );
            
            this.tweens.add({
                targets: nebula,
                alpha: { from: 0.1, to: 0.3 },
                scaleX: { from: 1, to: 1.5 },
                scaleY: { from: 1, to: 1.5 },
                duration: 5000 + Math.random() * 5000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // دوران الكوكب
        this.tweens.add({
            targets: planet,
            angle: 360,
            duration: 60000,
            repeat: -1,
            ease: 'Linear'
        });
    }

    createMovingStars() {
        this.starLayers = [];
        
        // 3 طبقات من النجوم بسرعات مختلفة (Parallax)
        for (let layer = 0; layer < 3; layer++) {
            const stars = [];
            const speed = (layer + 1) * 10;
            const count = 50 + (layer * 30);
            const size = 1 + (layer * 0.5);
            
            for (let i = 0; i < count; i++) {
                const star = this.add.circle(
                    Math.random() * 800,
                    Math.random() * 600,
                    Math.random() * size,
                    0xffffff,
                    0.3 + (Math.random() * 0.7)
                );
                
                star.setData('speedX', -speed - Math.random() * 20);
                star.setData('speedY', Math.random() * 2 - 1);
                star.setData('initialX', star.x);
                stars.push(star);
                
                // وميض النجوم
                this.tweens.add({
                    targets: star,
                    alpha: { from: 0.3, to: 1 },
                    duration: 1000 + Math.random() * 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
            
            this.starLayers.push(stars);
        }
    }

    updateMovingStars() {
        this.starLayers.forEach(stars => {
            stars.forEach(star => {
                star.x += star.getData('speedX') * 0.016;
                star.y += star.getData('speedY');
                
                // إعادة النجمة من اليمين عند خروجها من اليسار
                if (star.x < -10) {
                    star.x = 810;
                    star.y = Math.random() * 600;
                }
                
                // حدود عمودية
                if (star.y < 0) star.y = 600;
                if (star.y > 600) star.y = 0;
            });
        });
    }

    updatePlayerAppearance() {
        if (!this.player || !this.player.active) return;
        
        const level = playerState.level;
        
        // تطور حجم الشخصية (حجم أصغر)
        const baseScale = 0.20;
        const newScale = baseScale + (level * 0.018);
        this.player.setScale(Math.min(newScale, 0.38));
        
        // تطور اللون والتوهج
        if (level >= 10) {
            // مستوى أسطوري - ذهبي
            this.player.setTint(0xffd700);
            this.createPlayerAura(0xffd700, 3);
        } else if (level >= 7) {
            // متقدم جداً - بنفسجي
            this.player.setTint(0xaa00ff);
            this.createPlayerAura(0xaa00ff, 2);
        } else if (level >= 5) {
            // متقدم - أزرق فاتح
            this.player.setTint(0x00ddff);
            this.createPlayerAura(0x00ddff, 1);
        } else if (level >= 3) {
            // متوسط - سماوي
            this.player.setTint(0x00ffff);
        } else {
            // مبتدئ - عادي
            this.player.clearTint();
        }
        
        this.playerLevel = level;
    }

    createXPBar() {
        // خلفية شريط XP
        const xpBg = this.add.graphics();
        xpBg.fillStyle(0x222222, 0.9);
        xpBg.fillRoundedRect(200, 85, 400, 12, 6);
        
        // إطار
        const xpBorder = this.add.graphics();
        xpBorder.lineStyle(2, 0xffd700, 0.8);
        xpBorder.strokeRoundedRect(200, 85, 400, 12, 6);
        
        // الشريط نفسه
        this.xpBar = this.add.graphics();
        
        // نص XP
        this.xpText = this.add.text(400, 91, '', {
            font: 'bold 10px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.updateXPBar();
    }

    updateXPBar() {
        const killsNeeded = playerState.level * 10;
        const progress = this.currentKills / killsNeeded;
        const barWidth = 396 * progress;
        
        this.xpBar.clear();
        
        // لون يتغير حسب التقدم
        let color = 0x00ff00;
        if (progress > 0.8) color = 0xffd700;
        else if (progress > 0.5) color = 0xffff00;
        
        this.xpBar.fillStyle(color, 1);
        this.xpBar.fillRoundedRect(202, 87, barWidth, 8, 4);
        
        this.xpText.setText(`${this.currentKills}/${killsNeeded}`);
    }

    getEvolutionText(level) {
        const evolutions = {
            3: '⚡ EVOLUTION: ENHANCED!',
            5: '🌟 EVOLUTION: ADVANCED!',
            7: '💎 EVOLUTION: ELITE!',
            10: '👑 EVOLUTION: LEGENDARY!'
        };
        return evolutions[level] || null;
    }

    getEvolutionColor(level) {
        if (level >= 10) return '#ffd700'; // ذهبي
        if (level >= 7) return '#aa00ff';  // بنفسجي
        if (level >= 5) return '#00ddff';  // أزرق فاتح
        if (level >= 3) return '#00ffff';  // سماوي
        return '#ffffff';
    }

    createPlayerTrail() {
        if (!this.player || !this.player.active) return;
        
        const trail = this.add.circle(
            this.player.x,
            this.player.y,
            this.player.displayWidth / 2,
            this.player.tintTopLeft || 0x00ffff,
            0.3
        );
        
        this.tweens.add({
            targets: trail,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => trail.destroy()
        });
    }

    createPlayerAura(color, intensity) {
        // إزالة الهالة السابقة
        if (this.playerAura) {
            this.playerAura.forEach(a => {
                if (a && a.destroy) a.destroy();
            });
        }
        
        this.playerAura = [];
        
        // هالات دائرية حول اللاعب (حجم أصغر)
        for (let i = 0; i < intensity; i++) {
            const aura = this.add.circle(
                this.player.x, 
                this.player.y, 
                22 + (i * 12), 
                color, 
                0.2
            );
            
            this.tweens.add({
                targets: aura,
                scaleX: 1.3,
                scaleY: 1.3,
                alpha: 0,
                duration: 1000 + (i * 200),
                repeat: -1,
                ease: 'Cubic.easeOut'
            });
            
            this.playerAura.push(aura);
        }
    }

    createGameOverButton(x, y, text, callback) {
        const container = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x001122, 0.9);
        bg.fillRoundedRect(-100, -25, 200, 50, 10);
        bg.lineStyle(2, 0x00ffff, 1);
        bg.strokeRoundedRect(-100, -25, 200, 50, 10);
        
        const txt = this.add.text(0, 0, text, {
            font: 'bold 20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        container.add([bg, txt]);
        container.setSize(200, 50);
        container.setInteractive(new Phaser.Geom.Rectangle(-100, -25, 200, 50), Phaser.Geom.Rectangle.Contains);
        
        container.on('pointerdown', callback);
        
        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x002244, 0.95);
            bg.fillRoundedRect(-100, -25, 200, 50, 10);
            bg.lineStyle(3, 0x00ffff, 1);
            bg.strokeRoundedRect(-100, -25, 200, 50, 10);
            txt.setScale(1.1);
        });
        
        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x001122, 0.9);
            bg.fillRoundedRect(-100, -25, 200, 50, 10);
            bg.lineStyle(2, 0x00ffff, 1);
            bg.strokeRoundedRect(-100, -25, 200, 50, 10);
            txt.setScale(1);
        });
    }

    createAdButton(x, y, text, callback) {
        const container = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x228b22, 0.9);
        bg.fillRoundedRect(-140, -25, 280, 50, 10);
        bg.lineStyle(2, 0x00ff00, 1);
        bg.strokeRoundedRect(-140, -25, 280, 50, 10);
        
        const txt = this.add.text(0, 0, text, {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        container.add([bg, txt]);
        container.setSize(280, 50);
        container.setInteractive(new Phaser.Geom.Rectangle(-140, -25, 280, 50), Phaser.Geom.Rectangle.Contains);
        
        container.on('pointerdown', callback);
        
        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x32cd32, 0.95);
            bg.fillRoundedRect(-140, -25, 280, 50, 10);
            bg.lineStyle(3, 0x00ff00, 1);
            bg.strokeRoundedRect(-140, -25, 280, 50, 10);
            txt.setScale(1.1);
        });
        
        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x228b22, 0.9);
            bg.fillRoundedRect(-140, -25, 280, 50, 10);
            bg.lineStyle(2, 0x00ff00, 1);
            bg.strokeRoundedRect(-140, -25, 280, 50, 10);
            txt.setScale(1);
        });
    }
}

// ==========================================
// إعدادات اللعبة
// ==========================================
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
        parent: 'game-container'
    },
    backgroundColor: '#000510',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MainMenu, GameScene],
    input: {
        activePointers: 3 // دعم اللمس المتعدد
    }
};

// تشغيل اللعبة
window.addEventListener('load', function() {
    try {
        const game = new Phaser.Game(config);
        console.log('✅ Game started successfully!');
    } catch (error) {
        console.error('❌ Error starting game:', error);
        document.getElementById('game-container').innerHTML = 
            '<div style="color: white; padding: 20px; text-align: center;">' +
            '<h2>Error Loading Game</h2>' +
            '<p>' + error.message + '</p>' +
            '</div>';
    }
});
