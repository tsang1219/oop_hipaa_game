// Reference file: Original BreachDefense game engine
// This will be ported to Phaser's scene update loop in Phase 3
// Kept here as reference for the game mechanics

import { useState, useEffect, useRef, useCallback } from 'react';
import { GRID_COLS, PATHS, TOWERS, THREATS, WAVES, WAVE_BUDGETS } from './constants';

export interface Entity {
  id: string;
  x: number;
  y: number;
}

export interface Enemy extends Entity {
  type: keyof typeof THREATS;
  hp: number;
  maxHp: number;
  pathIndex: number;
  waypointIndex: number;
  speed: number;
  frozen: number;
  flashUntil: number;
}

export interface Tower extends Entity {
  type: keyof typeof TOWERS;
  lastFired: number;
}

export interface Projectile extends Entity {
  targetId: string;
  damage: number;
  speed: number;
  color: string;
}

export interface TutorialState {
  seenThreats: string[];
  seenTowers: string[];
  showWelcome: boolean;
  showFirstTower: boolean;
  currentTutorial: string | null;
  shownWaveSplashes: number[];
  shownTowerHints: string[];
}

export function useGameEngine() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY' | 'TUTORIAL'>('START');
  const [securityScore, setSecurityScore] = useState(100);
  const [budget, setBudget] = useState(250);
  const [wave, setWave] = useState(1);
  const [lastCompletedWave, setLastCompletedWave] = useState(0);

  const [tutorialState, setTutorialState] = useState<TutorialState>({
    seenThreats: [],
    seenTowers: [],
    showWelcome: true,
    showFirstTower: false,
    currentTutorial: null,
    shownWaveSplashes: [],
    shownTowerHints: []
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const towersRef = useRef<Tower[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const lastTickRef = useRef<number>(0);
  const waveStateRef = useRef({
    enemiesSpawned: 0,
    nextSpawnTime: 0,
    active: false
  });

  const [, setTick] = useState(0);

  const spawnEnemy = useCallback((type: keyof typeof THREATS, pathIdx: number, waveNumber: number) => {
    const stats = THREATS[type];
    const path = PATHS[pathIdx];
    const start = path[0];

    const tier = Math.ceil(waveNumber / 2);
    const scalingRate = tier >= 4 ? 0.15 : 0.20;
    const hpMultiplier = 1 + (tier - 1) * scalingRate;
    const scaledHp = Math.round(stats.hp * hpMultiplier);

    const enemy: Enemy = {
      id: Math.random().toString(36).substr(2, 9),
      x: start.x - 1,
      y: start.y,
      type,
      hp: scaledHp,
      maxHp: scaledHp,
      pathIndex: pathIdx,
      waypointIndex: 0,
      speed: stats.speed,
      frozen: 0,
      flashUntil: 0
    };
    enemiesRef.current.push(enemy);

    setTutorialState(prev => {
      if (!prev.seenThreats.includes(type)) {
        return { ...prev, seenThreats: [...prev.seenThreats, type] };
      }
      return prev;
    });
  }, []);

  const startGame = () => {
    setGameState('TUTORIAL');
    setSecurityScore(100);
    setBudget(WAVE_BUDGETS[0] || 150);
    setWave(1);
    setLastCompletedWave(0);
    enemiesRef.current = [];
    towersRef.current = [];
    projectilesRef.current = [];
    waveStateRef.current = { enemiesSpawned: 0, nextSpawnTime: 0, active: false };
    grantedStipendsRef.current = new Set([1]);
    setTutorialState({
      seenThreats: [],
      seenTowers: [],
      showWelcome: true,
      showFirstTower: false,
      currentTutorial: 'welcome',
      shownWaveSplashes: [],
      shownTowerHints: []
    });
    lastTickRef.current = 0;
  };

  const placeTower = (type: keyof typeof TOWERS, x: number, y: number) => {
    if (budget < TOWERS[type].cost) return false;

    const isPath = PATHS.some(path => path.some(p => p.x === x && p.y === y));
    if (type !== 'FIREWALL' && isPath) return false;

    const occupied = towersRef.current.some(t => Math.round(t.x) === x && Math.round(t.y) === y);
    if (occupied) return false;

    setBudget(prev => prev - TOWERS[type].cost);
    towersRef.current.push({
      id: Math.random().toString(36).substr(2, 9),
      type,
      x,
      y,
      lastFired: 0
    });

    if (towersRef.current.length === 1 && !waveStateRef.current.active) {
      waveStateRef.current.active = true;
      waveStateRef.current.nextSpawnTime = performance.now() + 2000;
    }

    setTutorialState(prev => {
      if (!prev.seenTowers.includes(type)) {
        return { ...prev, seenTowers: [...prev.seenTowers, type], showFirstTower: false };
      }
      return { ...prev, showFirstTower: false };
    });

    return true;
  };

  const dismissTutorial = () => {
    const currentTut = tutorialState.currentTutorial;

    setTutorialState(prev => ({ ...prev, currentTutorial: null }));

    if (currentTut === 'welcome') {
      setTimeout(() => {
        setTutorialState(prev => ({ ...prev, showFirstTower: true, currentTutorial: 'firstTower' }));
      }, 100);
    } else if (currentTut === 'firstTower') {
      setTimeout(() => { setGameState('PLAYING'); }, 100);
    } else {
      setTimeout(() => { setGameState('PLAYING'); }, 100);
    }
  };

  const grantedStipendsRef = useRef<Set<number>>(new Set([1]));

  useEffect(() => {
    if (gameState === 'PLAYING' && [1, 3, 5, 7, 9].includes(wave) && !tutorialState.shownWaveSplashes.includes(wave)) {
      setGameState('TUTORIAL');
      setTutorialState(prev => ({
        ...prev,
        shownWaveSplashes: [...prev.shownWaveSplashes, wave],
        currentTutorial: `wave_${wave}`
      }));
    }
  }, [wave, gameState, tutorialState.shownWaveSplashes]);

  useEffect(() => {
    if (gameState === 'PLAYING' && wave > 1 && !grantedStipendsRef.current.has(wave)) {
      grantedStipendsRef.current.add(wave);
      const stipend = WAVE_BUDGETS[wave - 1] || 100;
      setBudget(b => b + stipend);
    }
  }, [wave, gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const newlyUnlockedTowers = Object.entries(TOWERS).filter(([id]) => {
      return wave >= TOWERS[id as keyof typeof TOWERS].unlockWave &&
             !tutorialState.shownTowerHints.includes(id);
    });

    if (newlyUnlockedTowers.length > 0) {
      setTutorialState(prev => ({
        ...prev,
        shownTowerHints: [...prev.shownTowerHints, ...newlyUnlockedTowers.map(([id]) => id)]
      }));
    }
  }, [gameState, wave, tutorialState.shownTowerHints]);

  useEffect(() => {
    if (tutorialState.currentTutorial && gameState === 'PLAYING') {
      setGameState('TUTORIAL');
    }
  }, [tutorialState.currentTutorial, gameState]);

  useEffect(() => {
    let animationFrameId: number;

    const loop = (time: number) => {
      if (gameState !== 'PLAYING') {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      const delta = time - lastTickRef.current;
      const dt = Math.min(delta / 1000, 0.1);
      lastTickRef.current = time;

      const currentWaveData = WAVES[wave - 1];
      if (waveStateRef.current.active && currentWaveData) {
         const totalThreats = currentWaveData.threats.reduce((acc, t) => acc + t.count, 0);

         if (waveStateRef.current.enemiesSpawned < totalThreats) {
            if (time > waveStateRef.current.nextSpawnTime) {
                const threatConfig = currentWaveData.threats[waveStateRef.current.enemiesSpawned % currentWaveData.threats.length];
                spawnEnemy(threatConfig.type as keyof typeof THREATS, 0, wave);
                waveStateRef.current.enemiesSpawned++;
                waveStateRef.current.nextSpawnTime = time + threatConfig.interval;
            }
         } else if (enemiesRef.current.length === 0) {
             setLastCompletedWave(wave);
             if (wave < WAVES.length) {
                 const nextWave = wave + 1;
                 setWave(nextWave);
                 waveStateRef.current = { enemiesSpawned: 0, nextSpawnTime: time + 5000, active: true };
             } else {
                 setGameState('VICTORY');
             }
         }
      }

      enemiesRef.current.forEach(enemy => {
        const path = PATHS[enemy.pathIndex];
        const target = path[enemy.waypointIndex];

        if (!target) {
            if (enemy.x < GRID_COLS) {
                 enemy.x += enemy.speed * dt;
            }
            return;
        }

        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 0.1) {
            enemy.waypointIndex++;
        } else {
            enemy.x += (dx / dist) * enemy.speed * dt;
            enemy.y += (dy / dist) * enemy.speed * dt;
        }
      });

      const breachingEnemies = enemiesRef.current.filter(e => e.x >= GRID_COLS - 0.5);
      if (breachingEnemies.length > 0) {
          setSecurityScore(prev => Math.max(0, prev - (breachingEnemies.length * 20)));
          enemiesRef.current = enemiesRef.current.filter(e => e.x < GRID_COLS - 0.5);

          if (securityScore <= 0) {
              setGameState('GAMEOVER');
          }
      }

      const getTrainingBuff = (towerX: number, towerY: number): number => {
        let buff = 1.0;
        for (const t of towersRef.current) {
          if (t.type === 'TRAINING') {
            const dx = t.x - towerX;
            const dy = t.y - towerY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const trainingStats = TOWERS.TRAINING;
            if (dist <= (trainingStats.buffRadius || 2)) {
              buff = Math.max(buff, trainingStats.buffAmount || 1.3);
            }
          }
        }
        return buff;
      };

      towersRef.current.forEach(tower => {
        if (time - tower.lastFired < TOWERS[tower.type].cooldown) return;

        const stats = TOWERS[tower.type];
        const trainingBuff = getTrainingBuff(tower.x, tower.y);

        let target: Enemy | undefined;
        let bestScore = -1;

        for (const enemy of enemiesRef.current) {
            const dx = enemy.x - tower.x;
            const dy = enemy.y - tower.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist <= stats.range) {
                const enemyTags = THREATS[enemy.type]?.tags || [];
                const isStrong = stats.strongAgainst?.some((tag: string) => enemyTags.includes(tag));
                const isWeak = stats.weakAgainst?.some((tag: string) => enemyTags.includes(tag));

                let score = 100 - dist * 10;
                if (isStrong) score += 50;
                if (isWeak) score -= 30;

                if (score > bestScore) {
                    bestScore = score;
                    target = enemy;
                }
            }
        }

        if (target) {
            const enemyTags = THREATS[target.type]?.tags || [];
            const isStrong = stats.strongAgainst?.some((tag: string) => enemyTags.includes(tag));
            const isWeak = stats.weakAgainst?.some((tag: string) => enemyTags.includes(tag));

            let damage = stats.damage * trainingBuff;
            if (isStrong) damage *= 1.5;
            if (isWeak) damage *= 0.5;

            projectilesRef.current.push({
                id: Math.random().toString(),
                x: tower.x,
                y: tower.y,
                targetId: target.id,
                damage: Math.round(damage),
                speed: 2.5,
                color: stats.color
            });
            tower.lastFired = time;
        }
      });

      projectilesRef.current.forEach(proj => {
          const target = enemiesRef.current.find(e => e.id === proj.targetId);
          if (!target) {
              proj.damage = 0;
              return;
          }

          const dx = target.x - proj.x;
          const dy = target.y - proj.y;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (dist < 0.2) {
              target.hp -= proj.damage;
              target.flashUntil = performance.now() + 100;
              proj.damage = 0;
          } else {
              proj.x += (dx / dist) * proj.speed * dt;
              proj.y += (dy / dist) * proj.speed * dt;
          }
      });

      projectilesRef.current = projectilesRef.current.filter(p => p.damage > 0);
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

      setTick(time);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, securityScore, wave, spawnEnemy]);

  return {
    gameState,
    securityScore,
    budget,
    wave,
    lastCompletedWave,
    enemies: enemiesRef.current,
    towers: towersRef.current,
    projectiles: projectilesRef.current,
    tutorialState,
    placeTower,
    startGame,
    setGameState,
    dismissTutorial
  };
}
