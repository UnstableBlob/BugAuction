"use client";

import React, { useState } from 'react';
import styles from './Game1PowerGrid.module.css';

export default function Game1PowerGrid({ onComplete }) {
    const [in1, setIn1] = useState(false);
    const [in2, setIn2] = useState(false);
    const [in3, setIn3] = useState(false);

    const [z1, setZ1] = useState(null);
    const [z2, setZ2] = useState(null);

    const isZ1Z2Filled = z1 !== null && z2 !== null;
    const isWin = in1 && in2 && !in3 && z1 === 'AND' && z2 === 'XOR';
    const hasError = isZ1Z2Filled && !isWin;
    const isSuccess = isZ1Z2Filled && isWin;

    const z1Out = Boolean(z1 && (
        (z1 === 'AND' && in1 && in2) ||
        (z1 === 'OR' && (in1 || in2)) ||
        (z1 === 'XOR' && in1 !== in2) ||
        (z1 === 'NAND' && !(in1 && in2))
    ));

    const gates = ['AND', 'OR', 'XOR', 'NAND'];

    const handleDrop = (zone, gate) => {
        if (!gates.includes(gate)) return;
        if (zone === 1) setZ1(gate);
        else setZ2(gate);
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>The Power Grid</h2>
            <p className={styles.subtitle}>Connect logic gates to route power to the main output</p>

            <div className={styles.circuitBoard}>
                <svg viewBox="0 0 800 400" className={styles.wiresContainer} preserveAspectRatio="none">
                    <path d="M 100 100 C 225 100, 225 150, 350 150" className={`${styles.wire} ${in1 ? styles.active : ''}`} />
                    <path d="M 100 200 C 225 200, 225 150, 350 150" className={`${styles.wire} ${in2 ? styles.active : ''}`} />
                    <path d="M 100 300 C 325 300, 325 225, 550 225" className={`${styles.wire} ${in3 ? styles.active : ''}`} />
                    <path d="M 350 150 C 450 150, 450 225, 550 225" className={`${styles.wire} ${z1Out ? styles.active : ''}`} />
                    <path d="M 550 225 L 750 225" className={`${styles.wire} ${isSuccess ? styles.success : hasError ? styles.error : ''}`} />
                </svg>

                <div className={`${styles.nodeAbsolute} ${styles.nodeIn1}`}>
                    <Switch on={in1} toggle={() => setIn1(!in1)} label="IN 1" />
                </div>
                <div className={`${styles.nodeAbsolute} ${styles.nodeIn2}`}>
                    <Switch on={in2} toggle={() => setIn2(!in2)} label="IN 2" />
                </div>
                <div className={`${styles.nodeAbsolute} ${styles.nodeIn3}`}>
                    <Switch on={in3} toggle={() => setIn3(!in3)} label="IN 3" />
                </div>

                <div className={`${styles.nodeAbsolute} ${styles.nodeZ1}`}>
                    <DropZone value={z1} onDrop={(g) => handleDrop(1, g)} onClear={() => setZ1(null)} label="ZONE 1" />
                </div>
                <div className={`${styles.nodeAbsolute} ${styles.nodeZ2}`}>
                    <DropZone value={z2} onDrop={(g) => handleDrop(2, g)} onClear={() => setZ2(null)} label="ZONE 2" />
                </div>

                <div className={`${styles.nodeAbsolute} ${styles.nodeOut}`}>
                    <OutputNode success={isSuccess} error={hasError} />
                </div>
            </div>

            <div className={styles.statusSection}>
                <div className={`${styles.statusMessage} ${isSuccess ? styles.successMsg : hasError ? styles.errorMsg : ''}`}>
                    {isSuccess ? "POWER RESTORED" : hasError ? "SYSTEM FAILURE" : "AWAITING ROUTING..."}
                </div>
            </div>

            <div className={styles.palette}>
                {gates.map(g => (
                    <div
                        key={g}
                        className={styles.gateBtn}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData('gate', g);
                        }}
                    >
                        {g}
                    </div>
                ))}
            </div>

            {isSuccess && (
                <button className={styles.completeBtn} onClick={onComplete}>
                    Proceed to Sector 2
                </button>
            )}
        </div>
    );
}

const Switch = ({ on, toggle, label }) => (
    <div className={styles.switchWrapper}>
        <div className={`${styles.switch} ${on ? styles.on : ''}`} onClick={toggle}>
            <div className={styles.switchHandle} />
        </div>
        <div className={`${styles.nodeLabel} ${on ? styles.labelOn : ''}`}>{label}</div>
    </div>
);

const DropZone = ({ value, onDrop, onClear, label }) => (
    <div className={styles.dropZoneWrapper}>
        <div
            className={`${styles.dropZone} ${value ? styles.filled : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                onDrop(e.dataTransfer.getData('gate'));
            }}
            onClick={value ? onClear : undefined}
            title={value ? "Click to remove gate" : "Drag a gate here"}
        >
            {value || label}
        </div>
        {value && <div className={styles.removeHint}>Remove</div>}
    </div>
);

const OutputNode = ({ success, error }) => (
    <div className={styles.outputWrapper}>
        <div className={`${styles.outputBulb} ${success ? styles.success : ''} ${error ? styles.error : ''}`} />
        <div className={`${styles.nodeLabel} ${success ? styles.successText : error ? styles.errorText : ''}`}>OUTPUT</div>
    </div>
);
