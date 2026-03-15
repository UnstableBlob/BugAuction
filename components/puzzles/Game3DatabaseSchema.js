"use client";

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import styles from './Game3DatabaseSchema.module.css';

export default function Game3DatabaseSchema({ onComplete }) {
    const [lines, setLines] = useState([
        { id: 1, text: "PARALLAX MAINFRAME OS v3.11", type: "system" },
        { id: 2, text: "LOGIN FAILED. DATABASE CORRUPTION DETECTED.", type: "error" },
        { id: 3, text: "EMERGENCY OVERRIDE CONSOLE ACTIVE.", type: "system" },
        { id: 4, text: "HINT: Retrieve the FULL_NAME of all registered EMPLOYEES to authenticate.", type: "system" },
    ]);
    const [currentInput, setCurrentInput] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const lineIdRef = useRef(5);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    useEffect(() => {
        const handleGlobalClick = () => {
            if (!isComplete && window.getSelection()?.toString() === '') {
                inputRef.current?.focus();
            }
        };
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [isComplete]);

    const printLine = (text, type = 'output') => {
        setLines(prev => [...prev, { id: lineIdRef.current++, text, type }]);
    };

    const handleQuery = (query) => {
        const q = query.trim();
        if (!q) return;

        printLine(`> ${q}`, 'input');

        const syntaxSelectPattern = /^select\s+(.+?)\s+from\s+(.+?);?$/i;
        const strictMatch = /^select\s+full_name\s+from\s+employees;?$/i;
        const colWrongTableUsers = /^select\s+name\s+from\s+users;?$/i;
        const colCorrectTableUsers = /^select\s+full_name\s+from\s+users;?$/i;
        const colWrongTableCorrect = /^select\s+name\s+from\s+employees;?$/i;

        if (strictMatch.test(q)) {
            printLine("Executing query...", "system");
            setTimeout(() => {
                printLine("1 ROW(S) RETURNED.", "output");
                printLine("JOHN DOE (SYSTEM ADMIN)", "output");
                printLine("ACCESS GRANTED", "success");
                setIsComplete(true);
            }, 800);
            return;
        }

        if (colWrongTableUsers.test(q)) {
            printLine("ERROR 1054: Unknown column 'name' in 'field list'", "error");
            return;
        }

        if (colCorrectTableUsers.test(q)) {
            printLine("ERROR 1146: Table 'users' doesn't exist", "error");
            return;
        }

        if (colWrongTableCorrect.test(q)) {
            printLine("ERROR 1054: Unknown column 'name' in 'field list'", "error");
            return;
        }

        const match = q.match(syntaxSelectPattern);
        if (match) {
            const [, col, table] = match;
            const colClean = col.trim().toUpperCase();
            const tableClean = table.trim().toUpperCase();

            if (tableClean !== 'EMPLOYEES') {
                printLine(`ERROR 1146: Table '${tableClean.toLowerCase()}' doesn't exist`, "error");
            } else if (colClean !== 'FULL_NAME') {
                printLine(`ERROR 1054: Unknown column '${colClean.toLowerCase()}' in 'field list'`, "error");
            } else {
                printLine("ERROR 0000: UNKNOWN SYSTEM EXCEPTION", "error");
            }
            return;
        }

        printLine("ERROR 1064: You have an error in your SQL syntax.", "error");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isComplete) return;
        handleQuery(currentInput);
        setCurrentInput('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.crtOverlay} />
            <div className={styles.scanlines} />

            <div className={`${styles.terminalContent} ${isComplete ? styles.successGlow : ''}`}>
                <div className={styles.outputArea}>
                    {lines.map(line => (
                        <div key={line.id} className={`${styles.line} ${styles[line.type]}`}>
                            {line.type === 'success' && (
                                <pre className={styles.asciiArt}>
                                    {`
   ___   ____________  ______________
  /   | / ____/ ____/ / ____/ ___/ ___/
 / /| |/ /   / /     / __/  \\__ \\\\__ \\
/ ___ / /___/ /___  / /___ ___/ /__/ /
/_/  |_\\____/\\____/ /_____//____/____/

   __________  ___    _   ________________  ____
  / ____/ __ \\/   |  / | / /_  __/ ____/ / / __ \\
 / / __/ /_/ / /| | /  |/ / / / / __/ / / / / / /
/ /_/ / _, _/ ___ |/ /|  / / / / /___/ /_/ / /_/ /
\\____/_/ |_/_/  |_/_/ |_/ /_/ /_____/\\____/_____/
`}
                                </pre>
                            )}
                            {line.text}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {!isComplete ? (
                    <form className={styles.inputArea} onSubmit={handleSubmit}>
                        <span className={styles.prompt}>{'>'}</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            className={styles.textInput}
                            autoFocus
                            spellCheck={false}
                            autoComplete="off"
                        />
                        <div className={styles.cursor} />
                    </form>
                ) : (
                    <div className={styles.completeActions}>
                        <button className={styles.proceedBtn} onClick={onComplete}>
                            [ ENTER SECTOR 4 ]
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
