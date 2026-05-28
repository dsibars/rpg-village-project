import { SKILLS_DATA } from '../../../engine/shared/data/GameConstants.js';
import { CombatLogFormatter } from '../../../engine/shared/combat/CombatLogFormatter.js';
import { el, diffList } from '../shared/utils/DOMUtils.js';

export class CombatView {
  constructor({ i18n }) {
    this.i18n = i18n;
    this.formatter = new CombatLogFormatter(i18n);
    this.engine = null;
    this.adapter = null;
    this.lastState = null;
    this.isCombatOverlayOpen = false;
    this.lastLogLength = 0;
    this.renderCombatOverlay = null;
    this.overlay = null;
    this.onCombatComplete = null;
  }

  t(key, opts) {
    return this.i18n.t(key, opts);
  }

  update(state) {
    this.lastState = state;
    if (state.activeBattle && !this.isCombatOverlayOpen) {
      this.openCombatOverlay(state.activeBattle);
    }
    if (this.isCombatOverlayOpen && this.renderCombatOverlay) {
      this.renderCombatOverlay();
    }
  }

  playBattleLog(combatLog, onComplete) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:sans-serif;';
    const content = document.createElement('div');
    content.style.cssText = 'max-width:600px;width:90%;text-align:center;';
    const title = document.createElement('h2');
    title.textContent = this.t('combat_battle_log');
    title.style.marginBottom = '16px';
    content.appendChild(title);
    const logContainer = document.createElement('div');
    logContainer.style.cssText = 'min-height:120px;margin-bottom:16px;text-align:left;';
    content.appendChild(logContainer);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const events = combatLog.events || combatLog || [];
    let index = 0;
    const interval = setInterval(() => {
      if (index >= events.length) {
        clearInterval(interval);
        const summary = document.createElement('div');
        summary.style.cssText = 'margin-top:12px;font-weight:bold;color:#ffd700;';
        summary.textContent = this.t('combat_battle_finished');
        content.appendChild(summary);
        const closeBtn = document.createElement('button');
        closeBtn.textContent = this.t('ui_btn_close');
        closeBtn.className = 'btn btn-secondary';
        closeBtn.style.marginTop = '16px';
        closeBtn.addEventListener('click', () => {
          overlay.remove();
          if (onComplete) onComplete();
        });
        content.appendChild(closeBtn);
        return;
      }
      const entry = events[index];
      const entryDiv = document.createElement('div');
      entryDiv.style.cssText = 'margin-bottom:4px;opacity:0;transition:opacity 0.3s;';
      const formatted = this._formatLogEntry(entry);
      entryDiv.appendChild(formatted);
      logContainer.appendChild(entryDiv);
      requestAnimationFrame(() => { entryDiv.style.opacity = '1'; });
      index++;
    }, 600);
  }

  openCombatOverlay(battleContext, onComplete) {
    this.isCombatOverlayOpen = true;
    this.onCombatComplete = onComplete;
    this.lastLogLength = 0;

    const overlay = el('div', { id: 'combat-overlay', class: 'combat-overlay' });
    const container = el('div', { class: 'combat-container' });
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    this.overlay = overlay;

    // --- Header ---
    const title = el('h2', {});
    const stageLabel = el('div', { style: { fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' } });
    const titleWrap = el('div', {}, [title, stageLabel]);

    const autoBtn = el('button', { class: 'btn btn-sm' });
    const skipBtn = el('button', { class: 'btn btn-secondary btn-sm' });
    const headerControls = el('div', { class: 'combat-header-controls' }, [autoBtn, skipBtn]);
    const header = el('div', { class: 'combat-header' }, [titleWrap, headerControls]);

    autoBtn.addEventListener('click', () => {
      if (overlay.battleRef && overlay.battleRef.isOver) return;
      if (this.engine && this.engine.battleService) {
        this.engine.battleService.autoBattle = !this.engine.battleService.autoBattle;
      }
      if (this.adapter) this.adapter.forceUpdate();
    });

    skipBtn.addEventListener('click', () => {
      if (overlay.battleRef && overlay.battleRef.isOver) return;
      if (this.engine && this.engine.skipBattle) {
        this.engine.skipBattle();
      }
      if (this.adapter) this.adapter.forceUpdate();
    });

    // --- Grid ---
    const grid = el('div', { class: 'combat-grid' });

    // Heroes column
    const heroesCol = el('div', { class: 'combat-column' });
    const heroesTitle = el('div', { class: 'combat-column-title' });
    heroesCol.appendChild(heroesTitle);
    const heroCards = [];
    (battleContext.heroes || []).forEach((hero, index) => {
      const card = this._createCombatHeroCard(hero, index);
      heroCards.push(card);
      heroesCol.appendChild(card.root);
    });
    grid.appendChild(heroesCol);

    // Action column
    const actionCol = el('div', { class: 'combat-action-column' });
    const turnBanner = el('div', { class: 'combat-current-turn-banner' });
    actionCol.appendChild(turnBanner);

    // Control panel
    const controlPanel = this._buildControlPanel(overlay);
    actionCol.appendChild(controlPanel.root);
    grid.appendChild(actionCol);

    // Enemies column
    const enemiesCol = el('div', { class: 'combat-column' });
    const enemiesTitle = el('div', { class: 'combat-column-title' });
    enemiesCol.appendChild(enemiesTitle);
    const enemyCards = [];
    (battleContext.enemies || []).forEach((enemy, index) => {
      const card = this._createCombatEnemyCard(enemy, index);
      enemyCards.push(card);
      enemiesCol.appendChild(card.root);
    });
    grid.appendChild(enemiesCol);

    // --- Log section ---
    const logTitle = el('div', { class: 'combat-column-title' });
    const logConsole = el('div', { class: 'combat-log-console', id: 'combat-log-console' });
    const logSection = el('div', { class: 'combat-log-section' }, [logTitle, logConsole]);

    container.appendChild(header);
    container.appendChild(grid);
    container.appendChild(logSection);

    // Store battle ref on overlay for access in event handlers
    overlay.battleRef = battleContext;
    // Initialize menu state
    overlay.menuState = 'main';
    overlay.selectedAction = null;
    overlay.selectedFamily = null;

    // Grid click delegation for targeting
    grid.addEventListener('click', (e) => {
      if (overlay.menuState !== 'targeting') return;
      const card = e.target.closest('.targetable');
      if (!card) return;
      const heroIndex = card.getAttribute('data-hero-index');
      const enemyIndex = card.getAttribute('data-enemy-index');
      if (heroIndex !== null) {
        const idx = parseInt(heroIndex);
        const targetHero = overlay.battleRef && overlay.battleRef.heroes ? overlay.battleRef.heroes[idx] : null;
        if (targetHero && targetHero.hp > 0) {
          this._executeTargetAction(idx, targetHero.id);
        }
      } else if (enemyIndex !== null) {
        const idx = parseInt(enemyIndex);
        const targetEnemy = overlay.battleRef && overlay.battleRef.enemies ? overlay.battleRef.enemies[idx] : null;
        if (targetEnemy && targetEnemy.hp > 0) {
          this._executeTargetAction(idx, targetEnemy.id);
        }
      }
    });

    const render = () => {
      const state = this.lastState;
      if (!state || !state.activeBattle) {
        overlay.remove();
        this.isCombatOverlayOpen = false;
        this.renderCombatOverlay = null;
        this.overlay = null;
        if (this.onCombatComplete) this.onCombatComplete();
        return;
      }

      const battle = state.activeBattle;
      overlay.battleRef = battle;

      const activeExp = (state.activeExpeditions || []).find(e => e.status === 'combat');
      const currentStageNum = activeExp ? activeExp.currentStage + 1 : 1;
      const stageText = `${this.t('exp_stage')} ${currentStageNum}`;

      const activeActor = battle.turnOrder[battle.currentTurnIndex];
      const isHeroTurn = activeActor && activeActor.type === 'Hero';

      // Update header
      title.textContent = activeExp ? (this.t(activeExp.id) !== activeExp.id ? this.t(activeExp.id) : activeExp.name) : this.t('combat_battle_title');
      stageLabel.textContent = stageText;
      heroesTitle.textContent = this.t('combat_heroes');
      enemiesTitle.textContent = this.t('combat_enemies');
      autoBtn.textContent = `${this.t('btn_auto_combat')} ${battle.autoBattle ? '(ON)' : '(OFF)'}`;
      autoBtn.className = `btn btn-sm ${battle.autoBattle ? 'btn-primary' : 'btn-secondary'}`;
      autoBtn.disabled = battle.isOver;
      skipBtn.textContent = this.t('btn_skip_combat');
      skipBtn.disabled = battle.isOver;

      // Update hero cards
      heroCards.forEach((card, index) => {
        const hero = battle.heroes[index];
        if (!hero) return;
        const isCurrentTurn = activeActor && activeActor.id === hero.id;
        card.update(hero, isCurrentTurn);
      });

      // Update enemy cards
      enemyCards.forEach((card, index) => {
        const enemy = battle.enemies[index];
        if (!enemy) return;
        const isCurrentTurn = activeActor && activeActor.id === enemy.id;
        card.update(enemy, isCurrentTurn);
      });

      // Update turn banner
      const activeActorName = activeActor ? (this.t(activeActor.name) || activeActor.name) : '...';
      turnBanner.textContent = activeActor ? this.t('ui_turn').replace('{name}', activeActorName) : '...';

      // Log and animations
      const log = battle.log || [];
      const newLogEntries = log.slice(this.lastLogLength);
      this._animateEvents(newLogEntries);
      this._appendLogEntries(logConsole, newLogEntries);
      this.lastLogLength = log.length;

      // Clear targetable classes from previous render
      grid.querySelectorAll('.targetable').forEach(c => c.classList.remove('targetable'));

      // Update control panel
      logTitle.textContent = this.t('combat_log');
      this._updateControlPanel(controlPanel, battle, state, overlay, grid, activeActor, isHeroTurn);
    };

    this.renderCombatOverlay = render;
    render();
  }

  _createCombatHeroCard(hero, index) {
    const avatar = el('div', { class: 'combat-card-avatar' });
    const nameSpan = el('span', { class: 'combat-card-name' });
    const lvlSpan = el('span', { class: 'combat-card-level' });
    const headerRow = el('div', { class: 'combat-card-header' }, [nameSpan, lvlSpan]);

    const hpBar = el('div', { class: 'combat-bar combat-bar-hp' });
    const hpBarWrap = el('div', { class: 'combat-bar-container' }, hpBar);
    const hpLabel = el('span', {});
    const hpValue = el('span', {});
    const hpText = el('div', { class: 'combat-bar-text' }, [hpLabel, hpValue]);

    let staBar, staBarWrap, staLabel, staValue, staText;
    if (hero.maxStamina > 0) {
      staBar = el('div', { class: 'combat-bar combat-bar-stamina' });
      staBarWrap = el('div', { class: 'combat-bar-container', style: { height: '4px' } }, staBar);
      staLabel = el('span', {});
      staValue = el('span', {});
      staText = el('div', { class: 'combat-bar-text', style: { fontSize: '0.7rem' } }, [staLabel, staValue]);
    }

    let mpBar, mpBarWrap, mpLabel, mpValue, mpText;
    if (hero.maxMp > 0) {
      mpBar = el('div', { class: 'combat-bar combat-bar-mp' });
      mpBarWrap = el('div', { class: 'combat-bar-container', style: { height: '4px' } }, mpBar);
      mpLabel = el('span', {});
      mpValue = el('span', {});
      mpText = el('div', { class: 'combat-bar-text', style: { fontSize: '0.7rem' } }, [mpLabel, mpValue]);
    }

    const statuses = el('div', { class: 'combat-card-statuses' });
    const effects = el('div', { class: 'combat-effects-container' });

    const infoChildren = [headerRow, hpBarWrap, hpText];
    if (staBarWrap) infoChildren.push(staBarWrap, staText);
    if (mpBarWrap) infoChildren.push(mpBarWrap, mpText);
    infoChildren.push(statuses);

    const info = el('div', { class: 'combat-card-info' }, infoChildren);

    const card = el('div', { class: 'combat-card hero-card', dataHeroId: hero.id, dataHeroIndex: index }, [avatar, info, effects]);

    const update = (currentHero, isCurrentTurn) => {
      const isDead = currentHero.hp <= 0;
      card.className = `combat-card hero-card ${isCurrentTurn ? 'active' : ''} ${isDead ? 'dead' : ''}`;
      avatar.textContent = isDead ? '💀' : '⚔️';
      nameSpan.textContent = currentHero.name;
      lvlSpan.textContent = `Lv.${currentHero.level}`;

      const hpPct = currentHero.maxHp ? Math.max(0, Math.min(100, (currentHero.hp / currentHero.maxHp) * 100)) : 0;
      hpBar.style.width = `${hpPct}%`;
      hpLabel.textContent = this.t('ui_stats_hp') || 'HP';
      hpValue.textContent = `${currentHero.hp}/${currentHero.maxHp}`;

      if (staBar) {
        const staPct = currentHero.maxStamina ? Math.max(0, Math.min(100, (currentHero.stamina / currentHero.maxStamina) * 100)) : 0;
        staBar.style.width = `${staPct}%`;
        staLabel.textContent = this.t('ui_stamina');
        staValue.textContent = `${currentHero.stamina}/${currentHero.maxStamina}`;
      }

      if (mpBar) {
        const mpPct = currentHero.maxMp ? Math.max(0, Math.min(100, (currentHero.mp / currentHero.maxMp) * 100)) : 0;
        mpBar.style.width = `${mpPct}%`;
        mpLabel.textContent = this.t('ui_stats_mp') || 'MP';
        mpValue.textContent = `${currentHero.mp}/${currentHero.maxMp}`;
      }

      // Update status effects using diffList
      const statusBadges = (currentHero.statusEffects || []).map(st => {
        const iconMap = { poison: '🤢', burn: '🔥', regen: '💚', haste: '⭐', sleep: '💤', stun: '💫' };
        return el('span', {
          class: 'combat-status-badge',
          dataId: st.type,
          title: `${st.type} (${st.duration} turns)`
        }, iconMap[st.type] || st.type);
      });
      diffList(statuses, statusBadges, 'data-id');
    };

    return { root: card, update };
  }

  _createCombatEnemyCard(enemy, index) {
    const avatar = el('div', { class: 'combat-card-avatar' });
    const nameSpan = el('span', { class: 'combat-card-name' });
    const lvlSpan = el('span', { class: 'combat-card-level' });
    const headerRow = el('div', { class: 'combat-card-header' }, [nameSpan, lvlSpan]);

    const hpBar = el('div', { class: 'combat-bar combat-bar-hp' });
    const hpBarWrap = el('div', { class: 'combat-bar-container' }, hpBar);
    const hpLabel = el('span', {}, 'HP');
    const hpValue = el('span', {});
    const hpText = el('div', { class: 'combat-bar-text' }, [hpLabel, hpValue]);

    const statuses = el('div', { class: 'combat-card-statuses' });
    const effects = el('div', { class: 'combat-effects-container' });

    const info = el('div', { class: 'combat-card-info' }, [headerRow, hpBarWrap, hpText, statuses]);
    const card = el('div', { class: 'combat-card enemy-card', dataEnemyIndex: index }, [avatar, info, effects]);

    const update = (currentEnemy, isCurrentTurn) => {
      const isDead = currentEnemy.hp <= 0;
      card.className = `combat-card enemy-card ${isCurrentTurn ? 'active' : ''} ${isDead ? 'dead' : ''}`;
      avatar.textContent = isDead ? '💀' : '👾';
      nameSpan.textContent = this.t(currentEnemy.name) || currentEnemy.name;
      lvlSpan.textContent = `Lv.${currentEnemy.level || 1}`;

      const hpPct = currentEnemy.maxHp ? Math.max(0, Math.min(100, (currentEnemy.hp / currentEnemy.maxHp) * 100)) : 0;
      hpBar.style.width = `${hpPct}%`;
      hpValue.textContent = `${currentEnemy.hp}/${currentEnemy.maxHp}`;

      const statusBadges = (currentEnemy.statusEffects || []).map(st => {
        const iconMap = { poison: '🤢', burn: '🔥', regen: '💚', haste: '⭐', sleep: '💤', stun: '💫' };
        return el('span', {
          class: 'combat-status-badge',
          dataId: st.type,
          title: `${st.type} (${st.duration} turns)`
        }, iconMap[st.type] || st.type);
      });
      diffList(statuses, statusBadges, 'data-id');
    };

    return { root: card, update };
  }

  _buildControlPanel(overlay) {
    // --- Battle End Screen ---
    const battleEndResultTitle = el('h3', { style: { fontSize: '1.6rem', margin: '0 0 10px 0' } });
    const battleEndSummary = el('div', { style: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '6px', textAlign: 'left', maxHeight: '240px', overflowY: 'auto', display: 'block', width: '100%', boxSizing: 'border-box' } });
    const battleEndRewards = el('div', {});
    const battleEndResolveBtn = el('button', { id: 'btn-resolve-battle', class: 'btn btn-primary', style: { width: '100%' } });
    battleEndResolveBtn.addEventListener('click', () => {
      if (this.engine && this.engine.resolveBattle) {
        this.engine.resolveBattle();
      }
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        overlay.remove();
        this.isCombatOverlayOpen = false;
        this.renderCombatOverlay = null;
        this.overlay = null;
        if (this.onCombatComplete) this.onCombatComplete();
        if (this.adapter) this.adapter.forceUpdate();
      }, 300);
    });
    const battleEndScreen = el('div', { class: 'screen-battle-end', style: { display: 'none', textAlign: 'center', marginBottom: '15px', width: '100%' } }, [
      battleEndResultTitle,
      battleEndSummary,
      battleEndRewards,
      battleEndResolveBtn
    ]);

    // --- Message Screen ---
    const messageText = el('div', { class: 'combat-control-message' });
    const messageScreen = el('div', { class: 'screen-message', style: { display: 'none' } }, messageText);

    // --- Main Screen ---
    const btnAttack = el('button', { id: 'btn-action-attack', class: 'btn btn-secondary', style: { flex: '1 1 120px' } });
    const btnSkills = el('button', { id: 'btn-action-skills', class: 'btn btn-secondary', style: { flex: '1 1 120px' } });
    const btnMagic = el('button', { id: 'btn-action-magic', class: 'btn btn-secondary', style: { flex: '1 1 120px' } });
    const btnItems = el('button', { id: 'btn-action-items', class: 'btn btn-secondary', style: { flex: '1 1 120px' } });
    const mainButtons = el('div', { class: 'combat-control-buttons' }, [btnAttack, btnSkills, btnMagic, btnItems]);
    const mainScreen = el('div', { class: 'screen-main', style: { display: 'none' } }, mainButtons);

    btnAttack.addEventListener('click', () => {
      overlay.menuState = 'targeting';
      overlay.selectedAction = { type: 'attack', id: 'single_strike', name: this.t('family_single_strike') };
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });
    btnSkills.addEventListener('click', () => {
      overlay.menuState = 'skills';
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });
    btnMagic.addEventListener('click', () => {
      overlay.menuState = 'magic';
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });
    btnItems.addEventListener('click', () => {
      overlay.menuState = 'items';
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });

    // --- Skills Screen ---
    const btnSkillBack = el('button', { id: 'btn-skill-back', class: 'btn btn-secondary btn-sm' });
    const skillsList = el('div', { class: 'combat-control-buttons' });
    const skillsScreen = el('div', { class: 'screen-skills', style: { display: 'none' } }, [
      el('div', { class: 'combat-control-back' }, btnSkillBack),
      skillsList
    ]);
    btnSkillBack.addEventListener('click', () => {
      overlay.menuState = 'main';
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });
    skillsList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-family-id]');
      if (!btn) return;
      const familyId = btn.getAttribute('data-family-id');
      overlay.menuState = 'family_tiers';
      overlay.selectedFamily = familyId;
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });

    // --- Family Tiers Screen ---
    const btnTierBack = el('button', { id: 'btn-tier-back', class: 'btn btn-secondary btn-sm' });
    const familyNameText = el('div', { class: 'combat-control-message', style: { fontWeight: 700 } });
    const tiersList = el('div', { class: 'combat-control-buttons' });
    const familyTiersScreen = el('div', { class: 'screen-family-tiers', style: { display: 'none' } }, [
      el('div', { class: 'combat-control-back' }, btnTierBack),
      familyNameText,
      tiersList
    ]);
    btnTierBack.addEventListener('click', () => {
      overlay.menuState = 'skills';
      overlay.selectedFamily = null;
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });
    tiersList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tier]');
      if (!btn) return;
      const tier = parseInt(btn.getAttribute('data-tier'));
      const familyId = overlay.selectedFamily;
      overlay.menuState = 'targeting';
      overlay.selectedAction = { type: 'skill', id: familyId, name: this.t('family_' + familyId), tier };
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });

    // --- Magic Screen ---
    const btnMagicBack = el('button', { id: 'btn-magic-back', class: 'btn btn-secondary btn-sm' });
    const spellsList = el('div', { class: 'combat-control-buttons' });
    const magicScreen = el('div', { class: 'screen-magic', style: { display: 'none' } }, [
      el('div', { class: 'combat-control-back' }, btnMagicBack),
      spellsList
    ]);
    btnMagicBack.addEventListener('click', () => {
      overlay.menuState = 'main';
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });
    spellsList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-spell-idx]');
      if (!btn) return;
      const idx = parseInt(btn.getAttribute('data-spell-idx'));
      const currentHero = this._getCurrentHero(overlay.battleRef);
      const spell = currentHero && currentHero.spellCodex ? currentHero.spellCodex[idx] : null;
      overlay.menuState = 'targeting';
      overlay.selectedAction = { type: 'spell', index: idx, name: spell ? spell.name : this.t('ui_magic') };
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });

    // --- Items Screen ---
    const btnItemBack = el('button', { id: 'btn-item-back', class: 'btn btn-secondary btn-sm' });
    const itemsList = el('div', { class: 'combat-control-buttons' });
    const itemsScreen = el('div', { class: 'screen-items', style: { display: 'none' } }, [
      el('div', { class: 'combat-control-back' }, btnItemBack),
      itemsList
    ]);
    btnItemBack.addEventListener('click', () => {
      overlay.menuState = 'main';
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });
    itemsList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-item-id]');
      if (!btn) return;
      const itemId = btn.getAttribute('data-item-id');
      overlay.menuState = 'targeting';
      overlay.selectedAction = { type: 'item', id: itemId, name: this.t(itemId) };
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });

    // --- Targeting Screen ---
    const btnTargetBack = el('button', { id: 'btn-target-back', class: 'btn btn-secondary btn-sm' });
    const targetMessage = el('div', { class: 'combat-control-message', style: { color: 'var(--success)', fontWeight: 700 } });
    const targetingScreen = el('div', { class: 'screen-targeting', style: { display: 'none' } }, [
      el('div', { class: 'combat-control-back' }, btnTargetBack),
      targetMessage
    ]);
    btnTargetBack.addEventListener('click', () => {
      const sel = overlay.selectedAction;
      if (sel && sel.type === 'skill') {
        overlay.menuState = sel.tier !== undefined ? 'family_tiers' : 'skills';
      } else if (sel && sel.type === 'spell') {
        overlay.menuState = 'magic';
      } else if (sel && sel.type === 'item') {
        overlay.menuState = 'items';
      } else {
        overlay.menuState = 'main';
      }
      if (this.renderCombatOverlay) this.renderCombatOverlay();
    });

    const root = el('div', { class: 'combat-control-panel', id: 'combat-control-panel' }, [
      battleEndScreen, messageScreen, mainScreen, skillsScreen,
      familyTiersScreen, magicScreen, itemsScreen, targetingScreen
    ]);

    return {
      root,
      screens: {
        battleEnd: battleEndScreen,
        message: messageScreen,
        main: mainScreen,
        skills: skillsScreen,
        familyTiers: familyTiersScreen,
        magic: magicScreen,
        items: itemsScreen,
        targeting: targetingScreen
      },
      refs: {
        battleEndResultTitle,
        battleEndSummary,
        battleEndRewards,
        battleEndResolveBtn,
        messageText,
        btnAttack, btnSkills, btnMagic, btnItems,
        btnSkillBack, btnTierBack, btnMagicBack, btnItemBack, btnTargetBack,
        skillsList,
        familyNameText, tiersList,
        spellsList,
        itemsList,
        targetMessage
      }
    };
  }

  _getCurrentHero(battle) {
    const activeActor = battle.turnOrder[battle.currentTurnIndex];
    if (!activeActor || activeActor.type !== 'Hero') return null;
    return battle.heroes.find(h => h.id === activeActor.id);
  }

  _updateControlPanel(controlPanel, battle, state, overlay, grid, activeActor, isHeroTurn) {
    const { screens, refs } = controlPanel;

    // Hide all screens first
    Object.values(screens).forEach(s => { s.style.display = 'none'; });

    if (battle.isOver) {
      this._renderBattleEndScreen(refs, battle);
      screens.battleEnd.style.display = '';
      return;
    }

    if (!isHeroTurn || battle.autoBattle) {
      refs.messageText.textContent = battle.autoBattle
        ? (this.t('ui_auto_combat_running') || 'Running Auto-Combat...')
        : (this.t('ui_enemy_planning') || 'Enemy is planning action...');
      screens.message.style.display = '';
      return;
    }

    const currentHero = this._getCurrentHero(battle);
    if (!currentHero) return;

    const menuState = overlay.menuState || 'main';

    if (menuState === 'main') {
      const knownFamilies = currentHero.knownFamilies || ['single_strike'];
      const hasSkills = knownFamilies.length > 1;
      const codex = currentHero.spellCodex || [];
      const hasSpells = codex.length > 0;
      const canCastSpells = codex.some((s, idx) => this._canCastSpellInCombat(currentHero, s, idx));

      refs.btnAttack.textContent = `⚔️ ${this.t('family_single_strike')}`;
      refs.btnSkills.disabled = !hasSkills;
      refs.btnSkills.textContent = `✨ ${this.t('ui_skills')}`;
      refs.btnMagic.disabled = !canCastSpells;
      refs.btnMagic.textContent = `🔮 ${this.t('ui_magic') || 'Magic'}`;
      const itemLabel = battle.itemUsedThisTurn
        ? `🎒 ${this.t('combat_items')} (${this.t('ui_once_per_turn') || '1/Turn'})`
        : `🎒 ${this.t('combat_items')}`;
      refs.btnItems.textContent = itemLabel;
      refs.btnItems.disabled = battle.itemUsedThisTurn;

      screens.main.style.display = '';
    } else if (menuState === 'skills') {
      const knownFamilies = (currentHero.knownFamilies || []).filter(f => f !== 'single_strike');
      const hybridMpCost = currentHero.getHybridMpCost ? currentHero.getHybridMpCost() : 0;

      const skillButtons = knownFamilies.map(familyId => {
        const skillData = SKILLS_DATA[familyId];
        if (!skillData) return null;
        const tier = currentHero.techniqueTiers && currentHero.techniqueTiers[familyId] || 1;
        const staCost = skillData.staminaCostBase + skillData.staminaCostPerTier * (tier - 1);
        const mpCost = hybridMpCost;
        const canAffordSta = (currentHero.stamina || 0) >= staCost;
        const canAffordMp = mpCost <= 0 || (currentHero.mp || 0) >= mpCost;
        const canAfford = canAffordSta && canAffordMp;
        const familyName = this.t('family_' + familyId) || familyId;
        const mpLabel = mpCost > 0 ? ` + ${mpCost} MP` : '';
        return el('button', {
          class: 'btn btn-secondary',
          dataId: `skill-${familyId}`,
          dataFamilyId: familyId,
          disabled: !canAfford,
          style: { flex: '1 1 140px' }
        }, [
          familyName,
          ' ',
          el('span', { style: { fontSize: '0.8rem', opacity: 0.8 } }, `(Tier ${tier} · ${staCost} STA${mpLabel})`)
        ]);
      }).filter(Boolean);

      if (skillButtons.length === 0) {
        skillButtons.push(el('div', { style: { color: 'var(--text-muted)' } }, this.t('ui_no_techniques')));
      }

      refs.btnSkillBack.textContent = `◀ ${this.t('btn_back')}`;
      diffList(refs.skillsList, skillButtons, 'data-id');
      screens.skills.style.display = '';
    } else if (menuState === 'family_tiers') {
      const familyId = overlay.selectedFamily;
      const skillData = SKILLS_DATA[familyId];
      const maxTier = currentHero.techniqueTiers && currentHero.techniqueTiers[familyId] || 1;
      const familyName = this.t('family_' + familyId) || familyId;
      const hybridMpCost = currentHero.getHybridMpCost ? currentHero.getHybridMpCost() : 0;

      const tierButtons = [];
      for (let t = maxTier; t >= 1; t--) {
        const staCost = skillData.staminaCostBase + skillData.staminaCostPerTier * (t - 1);
        const canAffordSta = (currentHero.stamina || 0) >= staCost;
        const canAffordMp = hybridMpCost <= 0 || (currentHero.mp || 0) >= hybridMpCost;
        const canAfford = canAffordSta && canAffordMp;
        const label = t === maxTier ? '⚡ ' : t === 1 ? '💧 ' : '';
        const mpLabel = hybridMpCost > 0 ? ` + ${hybridMpCost} MP` : '';
        tierButtons.push(el('button', {
          class: 'btn btn-secondary',
          dataId: `tier-${t}`,
          dataTier: t,
          disabled: !canAfford,
          style: { flex: '1 1 100px' }
        }, [
          `${label}Tier ${t}`,
          ' ',
          el('span', { style: { fontSize: '0.8rem', opacity: 0.8 } }, `(${staCost} STA${mpLabel})`)
        ]));
      }

      refs.btnTierBack.textContent = `◀ ${this.t('btn_back')}`;
      refs.familyNameText.textContent = familyName;
      diffList(refs.tiersList, tierButtons, 'data-id');
      screens.familyTiers.style.display = '';
    } else if (menuState === 'magic') {
      const codex = currentHero.spellCodex || [];
      const spellButtons = codex.map((spell, idx) => {
        const canCast = this._canCastSpellInCombat(currentHero, spell, idx);
        const mpText = `${spell.mpCost} MP`;
        const elementIcon = { fire: '🔥', water: '💧', wind: '🌪️', storm: '⚡', light: '✨', dark: '🌑', earth: '🪨' }[spell.element] || '🔮';
        return el('button', {
          class: 'btn btn-secondary',
          dataId: `spell-${idx}`,
          dataSpellIdx: idx,
          disabled: !canCast,
          style: { flex: '1 1 140px' }
        }, [
          `${elementIcon} ${spell.name}`,
          ' ',
          el('span', { style: { fontSize: '0.8rem', opacity: 0.8 } }, `(${mpText})`)
        ]);
      });

      if (spellButtons.length === 0) {
        spellButtons.push(el('div', { style: { color: 'var(--text-muted)' } }, this.t('ui_no_spells')));
      }

      refs.btnMagicBack.textContent = `◀ ${this.t('btn_back')}`;
      diffList(refs.spellsList, spellButtons, 'data-id');
      screens.magic.style.display = '';
    } else if (menuState === 'items') {
      const inventory = state.inventory || {};
      const consumables = inventory.consumables || {};
      const itemButtons = Object.keys(consumables)
        .filter(itemId => consumables[itemId] > 0)
        .map(itemId => {
          const itemName = this.t(itemId) || itemId;
          return el('button', {
            class: 'btn btn-secondary',
            dataId: `item-${itemId}`,
            dataItemId: itemId,
            style: { flex: '1 1 140px' }
          }, `${itemName} x${consumables[itemId]}`);
        });

      if (itemButtons.length === 0) {
        itemButtons.push(el('div', { style: { color: 'var(--text-muted)' } }, this.t('ui_no_consumables')));
      }

      refs.btnItemBack.textContent = `◀ ${this.t('btn_back')}`;
      diffList(refs.itemsList, itemButtons, 'data-id');
      screens.items.style.display = '';
    } else if (menuState === 'targeting') {
      const sel = overlay.selectedAction;
      refs.btnTargetBack.textContent = `◀ ${this.t('btn_back')}`;
      refs.targetMessage.textContent = `${this.t('ui_choose_target')} — ${sel ? sel.name : ''}`;

      const skillData = sel && sel.type === 'skill' ? SKILLS_DATA[sel.id] : null;
      const spellData = sel && sel.type === 'spell' ? currentHero.spellCodex?.[sel.index] : null;
      const isFriendly = sel && (
        (skillData && (skillData.targetType === 'single_ally' || skillData.targetType === 'all_allies')) ||
        (spellData && (spellData.targetType === 'single_ally' || spellData.targetType === 'all_allies')) ||
        (sel.type === 'item' && sel.id.includes('potion'))
      );

      if (isFriendly) {
        grid.querySelectorAll('.hero-card').forEach(card => {
          const idx = parseInt(card.getAttribute('data-hero-index'));
          const targetHero = battle.heroes[idx];
          if (targetHero && targetHero.hp > 0) {
            card.classList.add('targetable');
          }
        });
      } else {
        grid.querySelectorAll('.enemy-card').forEach(card => {
          const idx = parseInt(card.getAttribute('data-enemy-index'));
          const targetEnemy = battle.enemies[idx];
          if (targetEnemy && targetEnemy.hp > 0) {
            card.classList.add('targetable');
          }
        });
      }

      screens.targeting.style.display = '';
    }
  }

  _renderBattleEndScreen(refs, battle) {
    const preview = this.engine && this.engine.getBattleResolutionPreview ? this.engine.getBattleResolutionPreview() : null;
    const isVictory = preview ? preview.isVictory : battle.winner === 'heroes';
    const resultColor = isVictory ? '#4caf50' : '#f44336';
    const resultText = isVictory ? this.t('victory') : this.t('defeat');

    refs.battleEndResultTitle.textContent = resultText;
    refs.battleEndResultTitle.style.color = resultColor;

    // Build summary
    while (refs.battleEndSummary.firstChild) {
      refs.battleEndSummary.removeChild(refs.battleEndSummary.firstChild);
    }
    if (preview && preview.summary) {
      preview.summary.forEach(s => {
        const row = el('div', { style: { marginBottom: '5px' } });
        row.appendChild(el('strong', {}, s.heroName));
        row.appendChild(document.createTextNode(': '));
        if (s.hpLost > 0) {
          row.appendChild(el('span', { style: { color: '#f44336', fontSize: '0.9em' } }, `-${s.hpLost} HP`));
          row.appendChild(document.createTextNode(' | '));
        } else if (s.hpLost < 0) {
          row.appendChild(el('span', { style: { color: '#4caf50', fontSize: '0.9em' } }, `+${-s.hpLost} HP`));
          row.appendChild(document.createTextNode(' | '));
        }
        row.appendChild(el('span', { style: { color: '#03a9f4', fontSize: '0.9em' } }, `+${s.expEarned} EXP`));
        if (s.leveledUp) {
          row.appendChild(document.createTextNode(' '));
          row.appendChild(el('span', { style: { color: '#ffeb3b', fontWeight: 'bold', fontSize: '0.9em' } }, '(LEVEL UP!)'));
        }
        refs.battleEndSummary.appendChild(row);
      });
    }

    // Build rewards
    while (refs.battleEndRewards.firstChild) {
      refs.battleEndRewards.removeChild(refs.battleEndRewards.firstChild);
    }
    if (preview && preview.isLastStage && preview.rewards) {
      const rewards = [];
      if (preview.rewards.gold) rewards.push(`💰 ${preview.rewards.gold} Gold`);
      if (preview.rewards.items) {
        for (const [itemId, qty] of Object.entries(preview.rewards.items)) {
          rewards.push(`📦 ${qty}x ${this.t(itemId) || itemId}`);
        }
      }
      if (rewards.length > 0) {
        refs.battleEndRewards.appendChild(el('div', { style: { marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' } }, [
          el('h4', { style: { color: '#ffeb3b', margin: '0 0 5px 0' } }, this.t('combat_rewards')),
          el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', fontSize: '0.95rem' } },
            rewards.map(r => el('span', { style: { background: 'rgba(255,235,59,0.1)', border: '1px solid rgba(255,235,59,0.3)', padding: '4px 8px', borderRadius: '4px' } }, r))
          )
        ]));
      }
    }

    refs.battleEndResolveBtn.textContent = this.t('ui_btn_close');
  }

  _appendLogEntries(logConsole, newEntries) {
    newEntries.forEach(entry => {
      const line = el('div', { style: { marginBottom: '4px', lineHeight: 1.4 } });
      const formatted = this._formatLogEntry(entry);
      line.appendChild(formatted);
      logConsole.appendChild(line);
    });

    // Cap at 100 entries
    while (logConsole.children.length > 100) {
      logConsole.removeChild(logConsole.firstChild);
    }

    logConsole.scrollTop = logConsole.scrollHeight;
  }

  _formatLogEntry(entry) {
    if (typeof entry === 'string') {
      return el('span', { style: { color: '#aaa' } }, entry);
    }
    const ev = entry;
    let text = '';
    let color = '#aaa';
    const extraChildren = [];

    if (ev.type === 'DAMAGE') {
      if (ev.isMiss) {
        text = this.t('log_miss', { attacker: ev.actorName, target: ev.targetName });
        color = '#ffcc00';
      } else {
        const skillLabel = ev.skillName ? `[${this.t('family_' + ev.skillName) || ev.skillName}${ev.effectiveTier ? ' T' + ev.effectiveTier : ''}] ` : '';
        text = skillLabel + this.t('log_attack', { attacker: ev.actorName, target: ev.targetName, damage: ev.amount });
        color = ev.actorIsHero ? '#4caf50' : '#f44336';
        if (ev.isCrit) text = '🔥 ' + text;
        if (ev.targetDefeated) {
          const defeatedText = this.t('log_target_defeated') ? this.t('log_target_defeated').replace('{target}', '') : 'DEAD';
          extraChildren.push(el('span', { style: { color: '#ff3b30', fontWeight: 'bold' } }, `(${defeatedText} 💀)`));
        }
      }
    } else if (ev.type === 'SPELL_DAMAGE') {
      text = this.t('log_spell_damage', { attacker: ev.actorName, spell: ev.spellName || this.t('ui_magic'), target: ev.targetName, damage: ev.amount });
      color = ev.actorIsHero ? '#9c27b0' : '#f44336';
      if (ev.targetDefeated) {
        const defeatedText = this.t('log_target_defeated') ? this.t('log_target_defeated').replace('{target}', '') : 'DEAD';
        extraChildren.push(el('span', { style: { color: '#ff3b30', fontWeight: 'bold' } }, `(${defeatedText} 💀)`));
      }
    } else if (ev.type === 'STUN_SKIP') {
      text = this.t('log_stun_skip', { actor: ev.actorName });
      color = '#ffcc00';
    } else if (ev.type === 'SLEEP_SKIP') {
      text = this.t('log_sleep_skip', { actor: ev.actorName });
      color = '#9c27b0';
    } else if (ev.type === 'MAGIC_TIER_UP') {
      text = this.t('log_magic_tier_up', { actor: ev.actorName, fromTier: ev.fromTier, toTier: ev.toTier });
      color = '#9c27b0';
    } else if (ev.type === 'TECHNIQUE_EVOLVED') {
      text = this.t('log_evolved', { actor: ev.actorName, family: this.t('family_' + ev.family) || ev.family, tier: ev.tier });
      color = '#ff9800';
    } else if (ev.type === 'HEAL') {
      text = this.t('log_heal', { attacker: ev.actorName, target: ev.targetName, amount: ev.amount });
      color = '#03a9f4';
    } else if (ev.type === 'VAMP') {
      text = this.t('log_vamp', { actor: ev.actorName, amount: ev.amount });
      color = '#8bc34a';
    } else if (ev.type === 'TRAIT_REGEN') {
      text = this.t('log_regen', { target: ev.targetName, amount: ev.amount });
      color = '#8bc34a';
    } else if (ev.type === 'STATUS_TICK') {
      if (ev.effectType === 'poison') {
        text = this.t('log_poison', { target: ev.targetName, damage: ev.damage });
        color = '#9c27b0';
      } else if (ev.effectType === 'burn') {
        text = this.t('log_burn', { target: ev.targetName, damage: ev.damage });
        color = '#ff9800';
      }
    } else if (ev.type === 'STATUS_EXPIRED') {
      text = this.t('log_status_expired', { target: ev.targetName, effect: ev.effectType });
      color = '#888';
    } else if (ev.type === 'USE_CONSUMABLE') {
      const itemName = this.t(ev.consumableId) || ev.consumableId;
      const stat = ev.healType === 'HEAL_MP' ? 'MP' : 'HP';
      text = this.t('log_use_consumable', { attacker: ev.actorName, item: itemName, target: ev.targetName, amount: ev.amount, stat });
      color = '#00bcd4';
    } else {
      text = `[${ev.type}]`;
    }

    if (ev.targetHp !== undefined && ev.targetMaxHp !== undefined && !ev.targetDefeated) {
      extraChildren.push(el('span', { style: { color: '#8e8e93', fontSize: '0.85em' } }, `(HP: ${ev.targetHp}/${ev.targetMaxHp})`));
    }

    if (extraChildren.length > 0) {
      const children = [text];
      extraChildren.forEach(child => {
        children.push(' ');
        children.push(child);
      });
      return el('span', { style: { color } }, children);
    }
    return el('span', { style: { color } }, text);
  }

  _animateEvents(events) {
    events.forEach(ev => {
      const targetName = ev.targetName;
      if (!targetName) return;
      if (ev.type === 'DAMAGE') {
        const text = ev.isMiss ? this.t('miss') : `-${ev.amount}`;
        const type = ev.isMiss ? 'miss' : 'damage';
        this._triggerVisualEffect(targetName, text, type);
      } else if (ev.type === 'HEAL' || ev.type === 'VAMP' || ev.type === 'TRAIT_REGEN' || ev.type === 'USE_CONSUMABLE') {
        const label = ev.type === 'USE_CONSUMABLE' && ev.healType === 'HEAL_MP' ? 'MP' : 'HP';
        const amount = ev.amount || ev.damage || 0;
        this._triggerVisualEffect(targetName, `+${amount} ${label}`, 'heal');
      } else if (ev.type === 'STATUS_TICK') {
        this._triggerVisualEffect(targetName, `-${ev.damage}`, 'damage');
      }
    });
  }

  _executeTargetAction(targetIndex, targetId) {
    const overlay = document.getElementById('combat-overlay');
    if (!overlay) return;
    const selectedAction = overlay.selectedAction;
    if (!selectedAction) return;

    let result;
    if (selectedAction.type === 'attack') {
      result = this.engine.executeBattleAction('single_strike', targetIndex);
    } else if (selectedAction.type === 'skill') {
      result = this.engine.executeBattleAction(selectedAction.id, targetIndex, selectedAction.tier || null);
    } else if (selectedAction.type === 'spell') {
      result = this.engine.executeBattleSpell(selectedAction.index, targetIndex);
    } else if (selectedAction.type === 'item') {
      result = this.engine.useBattleConsumable(selectedAction.id, targetId);
    }

    if (result && !result.success) {
      alert(this.t(result.error) || result.error);
      return;
    }

    overlay.menuState = 'main';
    overlay.selectedAction = null;
    if (this.adapter) this.adapter.forceUpdate();
  }

  _canCastSpellInCombat(hero, spell, index) {
    if (!spell || !hero) return false;
    if ((hero.mp || 0) < spell.mpCost) return false;
    const magicTier = hero.magicTier || 1;
    const maxSlots = Math.max(1, Math.min(25, magicTier));
    if ((spell.glyphIds || []).length > maxSlots) return false;
    return true;
  }

  _triggerVisualEffect(targetName, text, type) {
    const overlay = document.getElementById('combat-overlay');
    if (!overlay) return;
    const cards = overlay.querySelectorAll('.combat-card');
    let card = null;
    cards.forEach(c => {
      const nameEl = c.querySelector('.combat-card-name');
      if (nameEl && nameEl.textContent.trim() === targetName) {
        card = c;
      }
    });
    if (!card) return;

    if (type === 'damage') {
      card.classList.add('hit-shake');
      setTimeout(() => card.classList.remove('hit-shake'), 400);
    }

    const effectContainer = card.querySelector('.combat-effects-container');
    if (effectContainer) {
      const numEl = document.createElement('div');
      numEl.className = 'floating-num';
      numEl.textContent = text;
      let color = '#ff3b30';
      if (type === 'heal') color = '#34c759';
      if (type === 'miss') color = '#ffcc00';
      numEl.style.cssText = `position:absolute;top:20%;left:50%;transform:translateX(-50%);font-weight:bold;font-size:1.4rem;color:${color};pointer-events:none;z-index:10;transition:top 1s,opacity 1s;`;
      effectContainer.appendChild(numEl);
      requestAnimationFrame(() => {
        numEl.style.top = '-30%';
        numEl.style.opacity = '0';
      });
      setTimeout(() => numEl.remove(), 1000);
    }
  }
}
