// Data pemain
const player = {
    health: 100,
    maxHealth: 100,
    mana: 3,
    maxMana: 5,
    deck: [],
    hand: [],
    effects: []
};

const enemy = {
    health: 100,
    maxHealth: 100,
    mana: 3,
    maxMana: 5,
    deck: [],
    hand: [],
    effects: []
};

let gameState = {
    turn: 'player',
    gameOver: false,
    turnCount: 1
};

// Kumpulan kartu dengan ikon dan biaya mana
const allCards = [
    { name: "Serangan Pedang", damage: 25, mana: 2, type: "attack", icon: "⚔️", effect: null },
    { name: "Panah Api", damage: 20, mana: 2, type: "attack", icon: "🏹", effect: "burn" },
    { name: "Tendangan Brutal", damage: 30, mana: 3, type: "attack", icon: "🦵", effect: "stun" },
    { name: "Serangan Kilat", damage: 15, mana: 1, type: "attack", icon: "⚡", effect: null },
    { name: "Bola Api", damage: 35, mana: 4, type: "attack", icon: "🔥", effect: "burn" },
    { name: "Healing Potion", damage: -20, mana: 1, type: "heal", icon: "🧪", effect: null },
    { name: "Mega Heal", damage: -40, mana: 3, type: "heal", icon: "💖", effect: null },
    { name: "Perisai Energi", damage: 0, mana: 2, type: "skill", icon: "🛡️", effect: "shield" },
    { name: "Regenerasi", damage: -15, mana: 2, type: "heal", icon: "🌿", effect: "regen" },
    { name: "Serangan Beruntun", damage: 20, mana: 3, type: "attack", icon: "🌪️", effect: "double" },
    { name: "Vampir Strike", damage: 25, mana: 3, type: "attack", icon: "🩸", effect: "vampiric" },
    { name: "Refleksi", damage: 0, mana: 2, type: "skill", icon: "🪞", effect: "reflect" }
];

// Buat deck acak
function createDeck() {
    let deck = [];
    for (let i = 0; i < 15; i++) {
        const card = allCards[Math.floor(Math.random() * allCards.length)];
        deck.push({ ...card, id: Date.now() + Math.random() });
    }
    console.log("Created Deck:", deck);
    return deck;
}

// Tarik kartu dari deck
function drawCards(player, count) {
    console.log(`Drawing ${count} cards for player. Deck length: ${player.deck.length}, Hand length: ${player.hand.length}`);
    if (player.deck.length === 0) {
        console.warn("Deck is empty, cannot draw cards!");
        logAction("❌ Deck kosong, tidak bisa menarik kartu!");
        return;
    }
    for (let i = 0; i < count; i++) {
        if (player.deck.length > 0 && player.hand.length < 8) {
            player.hand.push(player.deck.shift());
            console.log("Card drawn:", player.hand[player.hand.length - 1]);
        }
    }
    console.log("Updated Hand:", player.hand);
}

// Mulai game baru
function startGame() {
    player.health = player.maxHealth;
    player.mana = 3;
    player.deck = createDeck();
    player.hand = [];
    player.effects = [];

    enemy.health = enemy.maxHealth;
    enemy.mana = 3;
    enemy.deck = createDeck();
    enemy.hand = [];
    enemy.effects = [];

    gameState.turn = 'player';
    gameState.gameOver = false;
    gameState.turnCount = 1;

    drawCards(player, 5);
    drawCards(enemy, 5);

    renderPlayerHand();
    updateUI();
    clearLog();
    logAction("🎮 Game dimulai! Kamu mendapat 5 kartu pembuka.");
    
    document.getElementById('game-over').style.display = 'none';
}

// Render kartu di tangan pemain
function renderPlayerHand() {
    const handContainer = document.getElementById("player-hand");
    console.log("Rendering hand. Hand:", player.hand, "Container:", handContainer);
    if (!handContainer) {
        console.error("Error: Element with ID 'player-hand' not found!");
        return;
    }
    handContainer.innerHTML = "";
    
    player.hand.forEach((card, index) => {
        console.log("Rendering card:", card);
        const cardElement = document.createElement("div");
        cardElement.className = `card ${card.type}`;
        
        if (card.mana > player.mana || gameState.turn !== 'player' || gameState.gameOver) {
            cardElement.classList.add('card-disabled');
        }
        
        cardElement.innerHTML = `
            <div class="card-header">
                <div class="card-name">${card.name}</div>
                <div class="card-type">${card.type}</div>
            </div>
            <div class="card-icon">${card.icon}</div>
            <div class="card-footer">
                <div class="card-damage">
                    ${card.damage > 0 ? '-' + card.damage : '+' + Math.abs(card.damage)}
                </div>
                <div class="card-mana">${card.mana}</div>
            </div>
        `;
        
        cardElement.onclick = () => playCard(index);
        handContainer.appendChild(cardElement);
    });
}

// Mainkan kartu
function playCard(index) {
    if (gameState.turn !== 'player' || gameState.gameOver) return;
    
    const card = player.hand[index];
    if (card.mana > player.mana) {
        logAction("❌ Tidak cukup mana untuk memainkan kartu ini!");
        return;
    }

    player.mana -= card.mana;
    player.hand.splice(index, 1);
    
    applyCardEffect(card, player, enemy);
    renderPlayerHand();
    updateUI();

    if (!gameState.gameOver && enemy.health > 0) {
        setTimeout(() => {
            if (gameState.turn === 'player') {
                gameState.turn = 'enemy';
                enemyTurn();
            }
        }, 1500);
    }
}

// Giliran musuh
function enemyTurn() {
    if (gameState.gameOver) return;
    
    document.getElementById('turn-indicator').textContent = "Enemy Turn";
    
    enemy.mana = Math.min(enemy.mana + 1, enemy.maxMana);
    
    processEffects(enemy);
    
    setTimeout(() => {
        if (enemy.hand.length === 0) {
            drawCards(enemy, 3);
        }
        
        const playableCards = enemy.hand.filter(card => card.mana <= enemy.mana);
        
        if (playableCards.length > 0) {
            const randomCard = playableCards[Math.floor(Math.random() * playableCards.length)];
            const cardIndex = enemy.hand.indexOf(randomCard);
            
            enemy.mana -= randomCard.mana;
            enemy.hand.splice(cardIndex, 1);
            
            applyCardEffect(randomCard, enemy, player);
            updateUI();
        }
        
        setTimeout(() => {
            if (!gameState.gameOver) {
                gameState.turn = 'player';
                gameState.turnCount++;
                
                player.mana = Math.min(player.mana + 1, player.maxMana);
                
                processEffects(player);
                
                document.getElementById('turn-indicator').textContent = "Your Turn";
                renderPlayerHand();
                updateUI();
            }
        }, 1000);
    }, 1000);
}

// Aplikasikan efek kartu
function applyCardEffect(card, caster, target) {
    const casterName = caster === player ? "Kamu" : "Musuh";
    const targetName = target === player ? "Kamu" : "Musuh";
    
    logAction(`${casterName} memainkan ${card.name} ${card.icon}`);

    if (card.damage > 0) {
        target.health -= card.damage;
        animateHit(target === player ? "player" : "enemy");
        logAction(`💥 ${targetName} menerima ${card.damage} damage!`);
    } else if (card.damage < 0) {
        caster.health -= card.damage;
        caster.health = Math.min(caster.health, caster.maxHealth);
        animateHeal(caster === player ? "player" : "enemy");
        logAction(`💚 ${casterName} pulih ${Math.abs(card.damage)} HP!`);
    }

    if (card.effect) {
        applySpecialEffect(card.effect, caster, target);
    }

    target.health = Math.max(target.health, 0);
    caster.health = Math.min(caster.health, caster.maxHealth);

    checkGameOver();
}

// Aplikasikan efek khusus
function applySpecialEffect(effect, caster, target) {
    const casterName = caster === player ? "Kamu" : "Musuh";
    const targetName = target === player ? "Kamu" : "Musuh";
    
    switch (effect) {
        case "burn":
            target.effects.push({ type: "burn", duration: 2, damage: 8 });
            logAction(`🔥 ${targetName} terbakar selama 2 turn!`);
            break;
            
        case "stun":
            target.effects.push({ type: "stun", duration: 1 });
            logAction(`😵 ${targetName} terkena stun!`);
            break;
            
        case "shield":
            caster.effects.push({ type: "shield", duration: 3, value: 10 });
            animateShield(caster === player ? "player" : "enemy");
            logAction(`🛡️ ${casterName} mendapat pelindung!`);
            break;
            
        case "regen":
            caster.effects.push({ type: "regen", duration: 3, heal: 10 });
            logAction(`🌿 ${casterName} mendapat regenerasi!`);
            break;
            
        case "double":
            setTimeout(() => {
                target.health -= 15;
                target.health = Math.max(target.health, 0);
                animateHit(target === player ? "player" : "enemy");
                logAction(`🌪️ Serangan kedua mengenai ${targetName} (15 damage)!`);
                updateUI();
                checkGameOver();
            }, 1000);
            break;
            
        case "vampiric":
            const healAmount = Math.floor(15 * 0.5);
            caster.health += healAmount;
            caster.health = Math.min(caster.health, caster.maxHealth);
            animateHeal(caster === player ? "player" : "enemy");
            logAction(`🩸 ${casterName} menyerap ${healAmount} HP!`);
            break;
            
        case "reflect":
            caster.effects.push({ type: "reflect", duration: 2 });
            logAction(`🪞 ${casterName} akan memantulkan damage!`);
            break;
    }
}

// Proses efek per turn
function processEffects(character) {
    const characterName = character === player ? "Kamu" : "Musuh";
    
    character.effects = character.effects.filter(effect => {
        switch (effect.type) {
            case "burn":
                character.health -= effect.damage;
                character.health = Math.max(character.health, 0);
                logAction(`🔥 ${characterName} terbakar (${effect.damage} damage)!`);
                animateHit(character === player ? "player" : "enemy");
                break;
                
            case "regen":
                character.health += effect.heal;
                character.health = Math.min(character.health, character.maxHealth);
                logAction(`🌿 ${characterName} regenerasi (${effect.heal} HP)!`);
                animateHeal(character === player ? "player" : "enemy");
                break;
        }
        
        effect.duration--;
        return effect.duration > 0;
    });
}

// Tarik kartu manual
function drawCard() {
    console.log("Attempting to draw card. Game State:", gameState, "Mana:", player.mana, "Hand:", player.hand.length, "Deck:", player.deck.length);
    if (gameState.turn !== 'player') {
        logAction("❌ Bukan giliranmu!");
        return;
    }
    if (gameState.gameOver) {
        logAction("❌ Permainan sudah berakhir!");
        return;
    }
    if (player.mana < 1) {
        logAction("❌ Tidak cukup mana untuk menarik kartu!");
        return;
    }
    if (player.hand.length >= 8) {
        logAction("❌ Tangan sudah penuh!");
        return;
    }
    if (player.deck.length === 0) {
        logAction("❌ Deck kosong, tidak bisa menarik kartu!");
        return;
    }
    
    player.mana -= 1;
    drawCards(player, 1);
    renderPlayerHand();
    updateUI();
    logAction("📚 Kamu menarik 1 kartu baru!");
}

// Akhiri giliran
function endTurn() {
    if (gameState.turn !== 'player' || gameState.gameOver) return;
    
    logAction("⏭️ Kamu mengakhiri giliran.");
    gameState.turn = 'enemy';
    setTimeout(enemyTurn, 500);
}

// Update UI
function updateUI() {
    document.getElementById("player-health").textContent = player.health;
    document.getElementById("enemy-health").textContent = enemy.health;
    const playerHealthPercent = (player.health / player.maxHealth) * 100;
    const enemyHealthPercent = (enemy.health / enemy.maxHealth) * 100;
    document.getElementById("player-health-fill").style.width = `${playerHealthPercent}%`;
    document.getElementById("enemy-health-fill").style.width = `${enemyHealthPercent}%`;

    document.getElementById("player-mana").textContent = player.mana;
    document.getElementById("enemy-mana").textContent = enemy.mana;
    const playerManaPercent = (player.mana / player.maxMana) * 100;
    const enemyManaPercent = (enemy.mana / enemy.maxMana) * 100;
    document.getElementById("player-mana-fill").style.width = `${playerManaPercent}%`;
    document.getElementById("enemy-mana-fill").style.width = `${playerManaPercent}%`;

    document.getElementById("turn-indicator").textContent = gameState.turn === 'player' ? "Your Turn" : "Enemy Turn";
}

// Clear log
function clearLog() {
    document.getElementById("log").innerHTML = "";
}

// Log action
function logAction(message) {
    const logContent = document.getElementById("log");
    const logEntry = document.createElement("div");
    logEntry.textContent = message;
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
}

// Animasi saat terkena hit
function animateHit(target) {
    const avatar = document.getElementById(target + "-avatar");
    avatar.classList.add("shake");
    setTimeout(() => avatar.classList.remove("shake"), 500);
}

// Animasi saat heal
function animateHeal(target) {
    const avatar = document.getElementById(target + "-avatar");
    avatar.classList.add("heal-glow");
    setTimeout(() => avatar.classList.remove("heal-glow"), 1000);
}

// Animasi saat shield
function animateShield(target) {
    const avatar = document.getElementById(target + "-avatar");
    avatar.classList.add("shield-pulse");
    setTimeout(() => avatar.classList.remove("shield-pulse"), 1000);
}

// Cek kondisi game over
function checkGameOver() {
    if (player.health <= 0) {
        gameState.gameOver = true;
        document.getElementById("game-over-title").textContent = "You Lose!";
        document.getElementById("game-over-message").textContent = "Musuh telah mengalahkanmu!";
        document.getElementById("game-over").style.display = "flex";
        logAction("😔 Kamu kalah!");
    } else if (enemy.health <= 0) {
        gameState.gameOver = true;
        document.getElementById("game-over-title").textContent = "You Win!";
        document.getElementById("game-over-message").textContent = "Kamu telah mengalahkan musuh!";
        document.getElementById("game-over").style.display = "flex";
        logAction("🏆 Kamu menang!");
    }
    renderPlayerHand();
}

// Tutup game over
function closeGameOver() {
    document.getElementById("game-over").style.display = "none";
    startGame();
}

// Mulai game saat halaman dimuat
window.onload = startGame;