// scripts/seedPuzzles.js
// Run: node scripts/seedPuzzles.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const puzzles = [
    // ─── LOGIC PUZZLES ───────────────────────────────────────────────────────
    {
        puzzleId: 'P-01',
        type: 'logic',
        title: 'Binary AND Gate',
        prompt: 'A logic gate receives inputs A=1 and B=0. The gate is an AND gate.\nWhat is the output?',
        uiConfig: {
            options: [
                { label: '0', value: '0' },
                { label: '1', value: '1' },
                { label: 'Undefined', value: 'undefined' },
                { label: 'Both 0 and 1', value: 'both' },
            ],
        },
        answer: '0',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-02',
        type: 'logic',
        title: 'XOR Gate Output',
        prompt: 'A two-input XOR gate has A=1, B=1.\nWhat is the output?',
        uiConfig: {
            options: [
                { label: '0', value: '0' },
                { label: '1', value: '1' },
                { label: 'Error', value: 'error' },
                { label: 'Depends on Vcc', value: 'vcc' },
            ],
        },
        answer: '0',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-03',
        type: 'logic',
        title: 'OS Process State',
        prompt: 'A process is in RUNNING state. The CPU scheduler is preempted by a higher-priority interrupt.\nWhat state does the process move to?',
        uiConfig: {
            options: [
                { label: 'TERMINATED', value: 'TERMINATED' },
                { label: 'WAITING', value: 'WAITING' },
                { label: 'READY', value: 'READY' },
                { label: 'NEW', value: 'NEW' },
            ],
        },
        answer: 'READY',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-04',
        type: 'logic',
        title: 'Network Subnet',
        prompt: 'A host has IP address 192.168.10.45 with subnet mask 255.255.255.0.\nWhat is the network address?',
        uiConfig: {
            options: [
                { label: '192.168.10.0', value: '192.168.10.0' },
                { label: '192.168.0.0', value: '192.168.0.0' },
                { label: '192.168.10.45', value: '192.168.10.45' },
                { label: '192.168.10.255', value: '192.168.10.255' },
            ],
        },
        answer: '192.168.10.0',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-05',
        type: 'logic',
        title: 'Time Complexity',
        prompt: 'Binary search on a sorted array of n elements has which worst-case time complexity?',
        uiConfig: {
            options: [
                { label: 'O(n)', value: 'O(n)' },
                { label: 'O(n²)', value: 'O(n2)' },
                { label: 'O(log n)', value: 'O(log n)' },
                { label: 'O(1)', value: 'O(1)' },
            ],
        },
        answer: 'O(log n)',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-06',
        type: 'logic',
        title: 'TCP vs UDP',
        prompt: 'Which protocol provides guaranteed, ordered, error-checked delivery of a stream of bytes?',
        uiConfig: {
            options: [
                { label: 'UDP', value: 'UDP' },
                { label: 'TCP', value: 'TCP' },
                { label: 'ICMP', value: 'ICMP' },
                { label: 'ARP', value: 'ARP' },
            ],
        },
        answer: 'TCP',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-07',
        type: 'logic',
        title: 'NAND Gate Logic',
        prompt: 'A NAND gate receives A=1 and B=1.\nWhat is the output?',
        uiConfig: {
            options: [
                { label: '0', value: '0' },
                { label: '1', value: '1' },
                { label: 'Both', value: 'both' },
                { label: 'Undefined', value: 'undefined' },
            ],
        },
        answer: '0',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-08',
        type: 'logic',
        title: 'Data Link Layer',
        prompt: 'Which OSI layer is responsible for MAC addressing and framing?',
        uiConfig: {
            options: [
                { label: 'Network Layer (Layer 3)', value: 'layer3' },
                { label: 'Physical Layer (Layer 1)', value: 'layer1' },
                { label: 'Data Link Layer (Layer 2)', value: 'layer2' },
                { label: 'Transport Layer (Layer 4)', value: 'layer4' },
            ],
        },
        answer: 'layer2',
        penaltySecondsOnWrong: 300,
    },

    // ─── HANDSHAKE PUZZLES ────────────────────────────────────────────────────
    {
        puzzleId: 'P-09',
        type: 'handshake',
        title: 'TCP SYN Received',
        prompt: 'Your server receives a TCP SYN packet from a client.\nAccording to the TCP three-way handshake, what should the server send back?\n\nA = Send SYN-ACK\nS = Send RST (reset connection)\nIGNORE = Drop the packet silently',
        uiConfig: { actions: ['A', 'S', 'IGNORE'] },
        answer: 'A',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-10',
        type: 'handshake',
        title: 'Suspicious ARP Reply',
        prompt: 'Your switch receives an unsolicited ARP REPLY claiming that 192.168.1.1 maps to a new MAC address. No ARP request was sent.\nThis is a classic ARP poisoning attempt. What do you do?\n\nA = Accept and update ARP table\nS = Block and log the packet\nIGNORE = Do nothing',
        uiConfig: { actions: ['A', 'S', 'IGNORE'] },
        answer: 'S',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-11',
        type: 'handshake',
        title: 'SSH Connection from Unknown IP',
        prompt: 'A production server receives an SSH login request from an IP address not in the whitelist during off-hours.\nWhat is the correct security response?\n\nA = Allow and monitor\nS = Block and alert the security team\nIGNORE = Log and do nothing',
        uiConfig: { actions: ['A', 'S', 'IGNORE'] },
        answer: 'S',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-12',
        type: 'handshake',
        title: 'RST Flag Received Mid-Session',
        prompt: 'During an active TCP session, you receive a packet with the RST flag set.\nWhat is the correct action for a well-behaved TCP stack?\n\nA = Continue sending data normally\nS = Immediately close the connection\nIGNORE = Discard the RST and continue',
        uiConfig: { actions: ['A', 'S', 'IGNORE'] },
        answer: 'S',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-13',
        type: 'handshake',
        title: 'Ping to Broadcast Address',
        prompt: 'A host sends an ICMP Echo Request to the broadcast address 255.255.255.255. This is a Smurf attack amplification vector.\nAs the network admin, what do you do at the router?\n\nA = Allow broadcast pings as normal\nS = Block ICMP directed broadcasts at the router\nIGNORE = Monitor but take no action',
        uiConfig: { actions: ['A', 'S', 'IGNORE'] },
        answer: 'S',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-14',
        type: 'handshake',
        title: 'DHCP Offer Received',
        prompt: 'A client broadcasts a DHCP DISCOVER. The DHCP server sends a DHCP OFFER.\nWhich packet does the client send next in the DORA sequence?\n\nA = DHCP REQUEST\nS = DHCP ACK\nIGNORE = Start over with another DISCOVER',
        uiConfig: { actions: ['A', 'S', 'IGNORE'] },
        answer: 'A',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-15',
        type: 'handshake',
        title: 'Duplicate SYN Packet',
        prompt: 'Your server already has an established TCP session with a client. It now receives a duplicate SYN from the same source.\nWhat should the server do according to RFC 793?\n\nA = Send RST to reset the old connection\nS = Send ACK for the existing session\nIGNORE = Drop the duplicate SYN silently',
        uiConfig: { actions: ['A', 'S', 'IGNORE'] },
        answer: 'S',
        penaltySecondsOnWrong: 300,
    },

    // ─── SCHEMA PUZZLES ───────────────────────────────────────────────────────
    {
        puzzleId: 'P-16',
        type: 'schema',
        title: 'Find the Primary Key',
        prompt: 'Examine the STUDENTS table schema below.\nWhich column is the PRIMARY KEY?',
        uiConfig: {
            question: 'Which column is the PRIMARY KEY?',
            inputType: 'select',
            options: [
                { label: 'name', value: 'name' },
                { label: 'student_id', value: 'student_id' },
                { label: 'email', value: 'email' },
                { label: 'department', value: 'department' },
            ],
            tables: [
                {
                    name: 'STUDENTS',
                    columns: [
                        { name: 'student_id', type: 'INT', constraints: 'PRIMARY KEY, AUTO_INCREMENT' },
                        { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL' },
                        { name: 'email', type: 'VARCHAR(150)', constraints: 'UNIQUE, NOT NULL' },
                        { name: 'department', type: 'VARCHAR(50)', constraints: '' },
                        { name: 'enrolled_on', type: 'DATE', constraints: 'DEFAULT CURRENT_DATE' },
                    ],
                },
            ],
        },
        answer: 'student_id',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-17',
        type: 'schema',
        title: 'Foreign Key Identification',
        prompt: 'Look at the ORDERS table. Which column is the FOREIGN KEY referencing the CUSTOMERS table?',
        uiConfig: {
            question: 'Which column is the FOREIGN KEY?',
            inputType: 'select',
            options: [
                { label: 'order_id', value: 'order_id' },
                { label: 'amount', value: 'amount' },
                { label: 'customer_id', value: 'customer_id' },
                { label: 'order_date', value: 'order_date' },
            ],
            tables: [
                {
                    name: 'ORDERS',
                    columns: [
                        { name: 'order_id', type: 'INT', constraints: 'PRIMARY KEY, AUTO_INCREMENT' },
                        { name: 'customer_id', type: 'INT', constraints: 'FOREIGN KEY → CUSTOMERS(id)' },
                        { name: 'amount', type: 'DECIMAL(10,2)', constraints: 'NOT NULL' },
                        { name: 'order_date', type: 'DATETIME', constraints: 'DEFAULT NOW()' },
                        { name: 'status', type: 'ENUM', constraints: "('pending','shipped','delivered')" },
                    ],
                },
            ],
        },
        answer: 'customer_id',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-18',
        type: 'schema',
        title: 'Nullable Column',
        prompt: 'In the EMPLOYEES schema below, which column allows NULL values?',
        uiConfig: {
            question: 'Which column allows NULL?',
            inputType: 'select',
            options: [
                { label: 'emp_id', value: 'emp_id' },
                { label: 'full_name', value: 'full_name' },
                { label: 'manager_id', value: 'manager_id' },
                { label: 'hire_date', value: 'hire_date' },
            ],
            tables: [
                {
                    name: 'EMPLOYEES',
                    columns: [
                        { name: 'emp_id', type: 'INT', constraints: 'PRIMARY KEY' },
                        { name: 'full_name', type: 'VARCHAR(200)', constraints: 'NOT NULL' },
                        { name: 'hire_date', type: 'DATE', constraints: 'NOT NULL' },
                        { name: 'manager_id', type: 'INT', constraints: 'NULL (self-reference)' },
                        { name: 'salary', type: 'DECIMAL(12,2)', constraints: 'NOT NULL, DEFAULT 0' },
                    ],
                },
            ],
        },
        answer: 'manager_id',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-19',
        type: 'schema',
        title: 'Unique Constraint Column',
        prompt: 'In the PRODUCTS table below, which column has a UNIQUE constraint (but is NOT the primary key)?',
        uiConfig: {
            question: 'Which non-PK column has UNIQUE constraint?',
            inputType: 'select',
            options: [
                { label: 'product_id', value: 'product_id' },
                { label: 'sku', value: 'sku' },
                { label: 'price', value: 'price' },
                { label: 'stock_qty', value: 'stock_qty' },
            ],
            tables: [
                {
                    name: 'PRODUCTS',
                    columns: [
                        { name: 'product_id', type: 'INT', constraints: 'PRIMARY KEY, AUTO_INCREMENT' },
                        { name: 'sku', type: 'VARCHAR(50)', constraints: 'UNIQUE, NOT NULL' },
                        { name: 'name', type: 'VARCHAR(200)', constraints: 'NOT NULL' },
                        { name: 'price', type: 'DECIMAL(8,2)', constraints: 'NOT NULL' },
                        { name: 'stock_qty', type: 'INT', constraints: 'DEFAULT 0' },
                    ],
                },
            ],
        },
        answer: 'sku',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-20',
        type: 'schema',
        title: 'Join Column Identification',
        prompt: 'To JOIN the COURSES and ENROLLMENTS tables, which pair of columns should be used?',
        uiConfig: {
            question: 'Type the join condition (e.g. COURSES.x = ENROLLMENTS.y)',
            inputType: 'select',
            options: [
                { label: 'COURSES.id = ENROLLMENTS.student_id', value: 'COURSES.id = ENROLLMENTS.student_id' },
                { label: 'COURSES.id = ENROLLMENTS.course_id', value: 'COURSES.id = ENROLLMENTS.course_id' },
                { label: 'COURSES.name = ENROLLMENTS.course_id', value: 'COURSES.name = ENROLLMENTS.course_id' },
                { label: 'COURSES.credits = ENROLLMENTS.grade', value: 'COURSES.credits = ENROLLMENTS.grade' },
            ],
            tables: [
                {
                    name: 'COURSES',
                    columns: [
                        { name: 'id', type: 'INT', constraints: 'PRIMARY KEY' },
                        { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL' },
                        { name: 'credits', type: 'INT', constraints: '' },
                    ],
                },
                {
                    name: 'ENROLLMENTS',
                    columns: [
                        { name: 'enroll_id', type: 'INT', constraints: 'PRIMARY KEY' },
                        { name: 'student_id', type: 'INT', constraints: 'FK → STUDENTS' },
                        { name: 'course_id', type: 'INT', constraints: 'FK → COURSES(id)' },
                        { name: 'grade', type: 'CHAR(2)', constraints: '' },
                    ],
                },
            ],
        },
        answer: 'COURSES.id = ENROLLMENTS.course_id',
        penaltySecondsOnWrong: 300,
    },
    {
        puzzleId: 'P-21',
        type: 'schema',
        title: 'Default Value Column',
        prompt: 'In the SESSIONS table below, which column has a DEFAULT value defined?',
        uiConfig: {
            question: 'Which column has a DEFAULT value?',
            inputType: 'select',
            options: [
                { label: 'session_id', value: 'session_id' },
                { label: 'user_id', value: 'user_id' },
                { label: 'token', value: 'token' },
                { label: 'created_at', value: 'created_at' },
            ],
            tables: [
                {
                    name: 'SESSIONS',
                    columns: [
                        { name: 'session_id', type: 'VARCHAR(64)', constraints: 'PRIMARY KEY' },
                        { name: 'user_id', type: 'INT', constraints: 'NOT NULL, FK → USERS' },
                        { name: 'token', type: 'TEXT', constraints: 'NOT NULL' },
                        { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP' },
                        { name: 'expires_at', type: 'TIMESTAMP', constraints: 'NOT NULL' },
                    ],
                },
            ],
        },
        answer: 'created_at',
        penaltySecondsOnWrong: 300,
    },
];

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set in .env.local');

    mongoose.connection.on('error', (err) => {
        console.warn('Mongoose background connection error:', err.message);
    });

    for (let i = 0; i < 10; i++) {
        try {
            await mongoose.connect(uri, { tlsAllowInvalidCertificates: true, serverSelectionTimeoutMS: 5000, family: 4 });

            const PuzzleSchema = new mongoose.Schema({
                puzzleId: { type: String, unique: true, required: true },
                type: { type: String, required: true },
                title: { type: String, required: true },
                prompt: { type: String, required: true },
                uiConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
                answer: { type: mongoose.Schema.Types.Mixed, required: true },
                penaltySecondsOnWrong: { type: Number, default: 300 },
            });
            const Puzzle = mongoose.models.Puzzle || mongoose.model('Puzzle', PuzzleSchema);

            const ops = puzzles.map((p) => ({
                updateOne: {
                    filter: { puzzleId: p.puzzleId },
                    update: { $set: p },
                    upsert: true,
                },
            }));

            await Puzzle.bulkWrite(ops);
            console.log(`✓ Seeded ${puzzles.length} puzzles (P-01 to P-21) into the flat pool.`);
            await mongoose.disconnect();
            return; // Exit on success
        } catch (e) {
            console.warn(`Attempt ${i + 1} failed: ${e.message}, retrying in 2s...`);
            await mongoose.disconnect().catch(() => { });
            await new Promise(res => setTimeout(res, 2000));
        }
    }
    throw new Error('Failed to seed Puzzles after 10 attempts');
}

main().catch((err) => { console.error(err); process.exit(1); });
