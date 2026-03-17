"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Game4Firewall.module.css';

const MAZE = [
    ['E', 'W', '.', '.', 'T'],
    ['.', 'W', '.', 'W', '.'],
    ['.', 'W', '.', 'W', '.'],
    ['.', '.', '.', 'W', '.'],
    ['S', 'W', 'W', 'W', '.']
];

const START_TIME = 120;
const THROTTLE_MS = 150;

export default function Game4Firewall({ onComplete }) {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [timeLeft, setTimeLeft] = useState(START_TIME);
    const [status, setStatus] = useState('idle');

    const statusRef = useRef(status);
    const posRef = useRef(pos);
    const lastMoveTimeRef = useRef(0);
    const timerRef = useRef(null);

    useEffect(() => { statusRef.current = status; }, [status]);
    useEffect(() => { posRef.current = pos; }, [pos]);

    const startGame = () => {
        setPos({ x: 0, y: 0 });
        setTimeLeft(START_TIME);
        setStatus('playing');
    };

    const triggerCollision = useCallback(() => {
        setStatus('hit');
        setTimeLeft(prev => Math.max(0, prev - 10));
        setTimeout(() => {
            if (statusRef.current === 'hit') setStatus('playing');
        }, 500);
    }, []);

    const handleMove = useCallback((dx, dy) => {
        if (statusRef.current !== 'playing') return;

        const now = Date.now();
        if (now - lastMoveTimeRef.current < THROTTLE_MS) return;
        lastMoveTimeRef.current = now;

        const { x, y } = posRef.current;
        const newX = x + dx;
        const newY = y + dy;

        if (newX < 0 || newX > 4 || newY < 0 || newY > 4) {
            triggerCollision();
            return;
        }

        const cell = MAZE[4 - newY][newX];
        if (cell === 'W') {
            triggerCollision();
            return;
        }

        setPos({ x: newX, y: newY });

        if (cell === 'T') {
            setStatus('success');
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [triggerCollision]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (statusRef.current !== 'playing') return;
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); handleMove(0, 1); break;
                case 'ArrowDown': e.preventDefault(); handleMove(0, -1); break;
                case 'ArrowLeft': e.preventDefault(); handleMove(-1, 0); break;
                case 'ArrowRight': e.preventDefault(); handleMove(1, 0); break;
                case 'w': case 'W': e.preventDefault(); handleMove(0, 1); break;
                case 's': case 'S': e.preventDefault(); handleMove(0, -1); break;
                case 'a': case 'A': e.preventDefault(); handleMove(-1, 0); break;
                case 'd': case 'D': e.preventDefault(); handleMove(1, 0); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleMove]);

    useEffect(() => {
        if (status === 'playing') {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setStatus('failed');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status]);

    const isWall = (tx, ty) => {
        if (tx < 0 || tx > 4 || ty < 0 || ty > 4) return true;
        return MAZE[4 - ty][tx] === 'W';
    };

    const sensorN = isWall(pos.x, pos.y + 1);
    const sensorS = isWall(pos.x, pos.y - 1);
    const sensorE = isWall(pos.x + 1, pos.y);
    const sensorW = isWall(pos.x - 1, pos.y);

    const formatTime = (time) => {
        const m = Math.floor(time / 60).toString().padStart(2, '0');
        const s = (time % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (status === 'idle') {
        return (
            <div className={styles.container}>
                <div className={styles.hudWrapper}>
                    <h2 className={styles.title}>THE FIREWALL</h2>
                    <p className={styles.brief}>
                        Navigate the grid blind. Avoid nodes flagged as &apos;W&apos;.<br />
                        Your proximity sensors will warn you of adjacent barriers.<br />
                        Grid dimensions: 5x5. Target: (4,4). Time Limit: 2:00.
                    </p>
                    <button className={styles.initBtn} onClick={startGame}>BREACH FIREWALL</button>
                </div>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className={styles.container}>
                <div className={styles.hudWrapper}>
                    <h2 className={styles.failedTitle}>CONNECTION TERMINATED</h2>
                    <p className={styles.brief}>You have been traced. Trace route completed.</p>
                    <button className={styles.initBtn} onClick={startGame}>RETRY BREACH</button>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className={styles.container}>
                <div className={styles.hudWrapper}>
                    <h2 className={styles.successTitle}>FIREWALL BYPASSED</h2>
                    <p className={styles.brief}>Target (4,4) reached. Mainframe access secured.</p>
                    <button className={styles.proceedBtn} onClick={onComplete}>[ PROCEED TO SECTOR 5 ]</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.container} ${status === 'hit' ? styles.shakeRed : ''}`}>

            <div className={styles.topHud}>
                <div className={styles.hudText}>UPLINK ESTABLISHED</div>
                <div className={`${styles.timer} ${timeLeft <= 30 ? styles.timerAlert : ''}`}>
                    TIME: {formatTime(timeLeft)}
                </div>
            </div>

            <div className={styles.radarLayout}>
                <div className={styles.sensorGrid}>
                    <div className={styles.emptyCell} />
                    <div className={`${styles.sensorBox} ${sensorN ? styles.sensorAlert : ''}`}>N</div>
                    <div className={styles.emptyCell} />

                    <div className={`${styles.sensorBox} ${sensorW ? styles.sensorAlert : ''}`}>W</div>
                    <div className={styles.centerPos}>
                        <div className={styles.posLabel}>POS</div>
                        <div className={styles.posValue}>X:{pos.x} Y:{pos.y}</div>
                    </div>
                    <div className={`${styles.sensorBox} ${sensorE ? styles.sensorAlert : ''}`}>E</div>

                    <div className={styles.emptyCell} />
                    <div className={`${styles.sensorBox} ${sensorS ? styles.sensorAlert : ''}`}>S</div>
                    <div className={styles.emptyCell} />
                </div>

                <div className={styles.dpad}>
                    <div className={styles.emptyKey} />
                    <button className={styles.keyBtn} onClick={() => handleMove(0, 1)}>▲</button>
                    <div className={styles.emptyKey} />

                    <button className={styles.keyBtn} onClick={() => handleMove(-1, 0)}>◀</button>
                    <div className={styles.keyBtnCenter}></div>
                    <button className={styles.keyBtn} onClick={() => handleMove(1, 0)}>▶</button>

                    <div className={styles.emptyKey} />
                    <button className={styles.keyBtn} onClick={() => handleMove(0, -1)}>▼</button>
                    <div className={styles.emptyKey} />
                </div>
            </div>

            <div className={styles.bottomHud}>
                <div className={styles.hudText}>SENSOR ARRAY ONLINE</div>
                <div className={styles.hudText}>GRID: 5x5</div>
            </div>

        </div>
    );
}
