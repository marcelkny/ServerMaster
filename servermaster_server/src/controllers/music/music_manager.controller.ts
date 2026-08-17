import type { Request, Response } from 'express';
import { scanMusicDirectoryParallel } from '../../services/ParallelAudioScanner.ts';
import path from 'node:path';
import { MUSIC_FOLDER_PATH } from '../../config/config.ts';

export const streamScanProgress = async (req: Request, res: Response) => {
    // 1. SSE-Header setzen
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Verbindung sofort festlegen

    // const musicFolder = 'GemeinsamerSpeicher/Musik'; // Beispielpfad oder via Query-Param: req.query.path
    const musicFolder = path.resolve(process.cwd(), MUSIC_FOLDER_PATH);
    // Hilfsfunktion zum Senden von SSE-Events
    const sendEvent = (event: string, data: unknown) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        // 2. Scan starten und Progress-Callback übergeben
        const tracks = await scanMusicDirectoryParallel(
            musicFolder,
            32,
            (scanned, total, currentFile) => {
                const percent = Math.round((scanned / total) * 100);
                sendEvent('progress', { scanned, total, percent, currentFile });
            }
        );

        // 3. Abschluss-Event senden
        sendEvent('complete', { totalTracks: tracks.length, tracks });
    } catch (error) {
        // 🔍 ZWINGEND EINBAUEN: Exakten Fehler im Terminal ausgeben!
        console.error('Fehler beim Musik-Scan:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
        sendEvent('error', { message: errorMessage });
    } finally {
        res.end(); // Verbindung nach Abschluss schließen
    }
};