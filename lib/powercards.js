import fs from 'fs';
import path from 'path';

// No module-level cache so JSON changes are picked up on every request in dev
export function getAllPowercards() {
    try {
        const filePath = path.join(process.cwd(), 'data', 'powercards.json');
        const fileData = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileData);
    } catch (error) {
        console.error('Error loading powercards.json:', error);
        return [];
    }
}

export function getPowercardById(id) {
    const powercards = getAllPowercards();
    return powercards.find(p => p.id === id) || null;
}
