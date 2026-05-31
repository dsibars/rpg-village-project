import { Result } from '../shared/core/Result.js';
import { GLYPH_DATA } from '../shared/data/MagicCircleData.js';
import { persistence } from '../shared/core/Persistence.js';

/**
 * AcademyService manages glyph teaching, active sessions, and the Design Library.
 */
export class AcademyService {
    constructor(heroService, villageService, options = {}) {
        this.heroService = heroService;
        this.villageService = villageService;
        this.DESIGNS_KEY = 'academy_designs';
        this.SESSIONS_KEY = 'academy_sessions';
        this.COPY_SESSIONS_KEY = 'academy_copy_sessions';
        this.designLibrary = [];
        this.sessions = [];
        this.copySessions = [];
        if (!options.deferLoad) {
            this.load();
        }
    }

    load() {
        this.designLibrary = this._loadDesigns();
        this.sessions = this._loadSessions();
        this.copySessions = this._loadCopySessions();
    }

    _loadDesigns() {
        return persistence.load(this.DESIGNS_KEY, []);
    }

    _saveDesigns() {
        persistence.save(this.DESIGNS_KEY, this.designLibrary);
    }

    _loadSessions() {
        return persistence.load(this.SESSIONS_KEY, []);
    }

    _saveSessions() {
        persistence.save(this.SESSIONS_KEY, this.sessions);
    }

    _loadCopySessions() {
        return persistence.load(this.COPY_SESSIONS_KEY, []);
    }

    _saveCopySessions() {
        persistence.save(this.COPY_SESSIONS_KEY, this.copySessions);
    }

    /**
     * Get Academy configuration based on Arcane Sanctum level.
     */
    getAcademyConfig() {
        const level = this.villageService?.state?.infrastructure?.arcane_sanctum || 0;
        const configs = [
            { level: 0, slots: 0, maxStudents: 0, speedMult: 1.0, maxDesigns: 0 },
            { level: 1, slots: 1, maxStudents: 1, speedMult: 1.0, maxDesigns: 3 },
            { level: 2, slots: 1, maxStudents: 2, speedMult: 1.2, maxDesigns: 6 },
            { level: 3, slots: 2, maxStudents: 2, speedMult: 1.4, maxDesigns: 10 },
            { level: 4, slots: 2, maxStudents: 3, speedMult: 1.6, maxDesigns: 15 }
        ];
        return configs[Math.min(level, 4)];
    }

    /**
     * Enroll a new teaching session.
     * @param {string} teacherId
     * @param {string} glyphId
     * @param {string[]} studentIds
     * @returns {Result}
     */
    enrollSession(teacherId, glyphId, studentIds) {
        const config = this.getAcademyConfig();
        if (config.level === 0) return Result.fail('academy_error_academy_not_built');
        if (this.sessions.length >= config.slots) return Result.fail('academy_error_academy_no_slots');
        if (studentIds.length > config.maxStudents) return Result.fail('academy_error_academy_too_many_students');

        const teacher = this.heroService.get(teacherId);
        if (!teacher) return Result.fail('heroes_error_hero_not_found');
        if (!teacher.knownGlyphs?.includes(glyphId)) {
            return Result.fail('academy_error_teacher_glyph_unknown');
        }

        const glyph = GLYPH_DATA[glyphId];
        if (!glyph) return Result.fail('heroes_error_glyph_invalid');

        // Verify all students exist and don't already know the glyph
        for (const sid of studentIds) {
            const student = this.heroService.get(sid);
            if (!student) return Result.fail('heroes_error_hero_not_found');
            if (student.knownGlyphs?.includes(glyphId)) {
                return Result.fail('academy_error_student_glyph_known');
            }
        }

        // Calculate duration
        const glyphTier = teacher.glyphMastery?.[glyphId]?.tier || 1;
        const baseDays = glyphTier * 2;
        const teacherBonus = Math.floor((teacher.magicPower || 0) / 10) * 0.3;
        const studentPenalty = Math.max(0, studentIds.length - 1) * 0.2;
        const totalDays = Math.max(1, Math.round((baseDays + studentPenalty) / (1 + teacherBonus) * config.speedMult));

        const session = {
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            teacherId,
            glyphId,
            studentIds,
            totalDays,
            daysRemaining: totalDays,
            status: 'active',
            enrolledAt: Date.now()
        };

        // Lock heroes
        for (const sid of studentIds) {
            const student = this.heroService.get(sid);
            if (student) student.activity = 'studying';
        }
        teacher.activity = 'teaching';

        this.sessions.push(session);
        this._saveSessions();
        this.heroService.saveAll();
        return Result.ok(session);
    }

    /**
     * Process day advancement for all active sessions.
     * Called by GameEngine.nextDay().
     * @returns {Object[]} completed sessions
     */
    processDay() {
        const completed = [];
        const activeSessions = this.sessions.filter(s => s.status === 'active');

        for (const session of activeSessions) {
            session.daysRemaining--;
            if (session.daysRemaining <= 0) {
                session.status = 'completed';
                this._completeSession(session);
                completed.push(session);
            }
        }

        // Process design copy sessions
        const completedCopies = [];
        for (const copySession of this.copySessions) {
            copySession.daysRemaining--;
            if (copySession.daysRemaining <= 0) {
                this._completeCopySession(copySession);
                completedCopies.push(copySession);
            }
        }
        this.copySessions = this.copySessions.filter(c => c.daysRemaining > 0);
        this._saveCopySessions();

        // Clean up old completed sessions
        this.sessions = this.sessions.filter(s => s.status === 'active' || (s.status === 'completed' && Date.now() - s.enrolledAt < 7 * 24 * 60 * 60 * 1000));
        this._saveSessions();
        return { completed, completedCopies };
    }

    _completeSession(session) {
        const teacher = this.heroService.get(session.teacherId);
        // Teach glyph to all students
        for (const sid of session.studentIds) {
            const student = this.heroService.get(sid);
            if (student) {
                if (!student.knownGlyphs) student.knownGlyphs = [];
                if (!student.knownGlyphs.includes(session.glyphId)) {
                    student.knownGlyphs.push(session.glyphId);
                }
                if (!student.glyphMastery) student.glyphMastery = {};
                if (!student.glyphMastery[session.glyphId]) {
                    student.glyphMastery[session.glyphId] = { tier: 1, uses: 0 };
                }
                student.activity = 'idle';
            }
        }
        if (teacher) teacher.activity = 'idle';
        this.heroService.saveAll();
    }

    /**
     * Cancel an active session. Pro-rata gold refund.
     */
    cancelSession(sessionId) {
        const idx = this.sessions.findIndex(s => s.id === sessionId && s.status === 'active');
        if (idx < 0) return Result.fail('academy_error_session_not_found');

        const session = this.sessions[idx];
        const teacher = this.heroService.get(session.teacherId);
        for (const sid of session.studentIds) {
            const student = this.heroService.get(sid);
            if (student) student.activity = 'idle';
        }
        if (teacher) teacher.activity = 'idle';

        this.sessions.splice(idx, 1);
        this._saveSessions();
        this.heroService.saveAll();
        return Result.ok(true);
    }

    getSessions() {
        return [...this.sessions];
    }

    // --- Legacy instant teach (for backwards compatibility / cheats) ---
    teachGlyph(teacherId, studentId, glyphId) {
        const result = this.enrollSession(teacherId, glyphId, [studentId]);
        if (!result.success) return result;
        // Immediately complete for legacy compat
        this._completeSession(result.data);
        this.sessions = this.sessions.filter(s => s.id !== result.data.id);
        this._saveSessions();
        return Result.ok({ glyphId, studentId });
    }

    // --- Design Library ---
    saveDesign(design) {
        if (!design || !design.name || !design.glyphIds) {
            return Result.fail('academy_error_design_invalid');
        }
        const config = this.getAcademyConfig();
        if (this.designLibrary.length >= config.maxDesigns) {
            return Result.fail('academy_error_design_library_full');
        }
        const entry = {
            id: `design_${Date.now()}`,
            ...design,
            createdAt: Date.now()
        };
        this.designLibrary.push(entry);
        this._saveDesigns();
        return Result.ok(entry);
    }

    getDesigns() {
        return [...this.designLibrary];
    }

    deleteDesign(designId) {
        const idx = this.designLibrary.findIndex(d => d.id === designId);
        if (idx < 0) return Result.fail('academy_error_design_not_found');
        this.designLibrary.splice(idx, 1);
        this._saveDesigns();
        return Result.ok(true);
    }

    _completeCopySession(copySession) {
        const design = this.designLibrary.find(d => d.id === copySession.designId);
        const hero = this.heroService.get(copySession.heroId);
        if (design && hero) {
            if (!hero.knownGlyphs) hero.knownGlyphs = [];
            if (!hero.glyphMastery) hero.glyphMastery = {};
            for (const glyphId of design.glyphIds) {
                if (!hero.knownGlyphs.includes(glyphId)) {
                    hero.knownGlyphs.push(glyphId);
                    hero.glyphMastery[glyphId] = { tier: 1, uses: 0 };
                }
            }
            hero.activity = 'idle';
            this.heroService.saveAll();
        }
    }

    copyDesignToHero(designId, heroId) {
        const config = this.getAcademyConfig();
        if (config.level === 0) return Result.fail('academy_error_academy_not_built');

        const design = this.designLibrary.find(d => d.id === designId);
        if (!design) return Result.fail('academy_error_design_not_found');

        const hero = this.heroService.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');
        if (hero.activity === 'studying_design') return Result.fail('heroes_error_hero_busy');

        // Check if hero already has all glyphs
        const missingGlyphs = design.glyphIds.filter(gid => !hero.knownGlyphs?.includes(gid));
        if (missingGlyphs.length === 0) return Result.fail('heroes_error_glyph_all_known');

        // Cost: Core = 10g, +5g per ring slot
        const cost = 10 + Math.max(0, (design.glyphIds.length - 1) * 5);
        const villageState = this.villageService?.getState();
        if (!villageState || villageState.gold < cost) {
            return Result.fail('village_error_gold_not_enough');
        }

        // Deduct gold
        villageState.gold -= cost;
        this.villageService?.save?.();

        // Create copy session (2 days)
        const copySession = {
            id: `copy_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            designId,
            heroId,
            daysRemaining: 2,
            startedAt: Date.now()
        };
        this.copySessions.push(copySession);
        this._saveCopySessions();

        hero.activity = 'studying_design';
        this.heroService.saveAll();

        return Result.ok({ designId, heroId, daysRemaining: 2, missingGlyphs: missingGlyphs.length, cost });
    }
}
