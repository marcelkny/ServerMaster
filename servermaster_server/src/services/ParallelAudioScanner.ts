import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { getAudioMetadata, type TrackMetadata } from './AudioScanner.ts';
import { mapConcurrent } from '../utils/BatchProcessor.ts';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.wma']);

// 1. Typ für den Progress-Callback definieren
export type ProgressCallback = (scanned: number, total: number, currentFile: string) => void;

/**
 * Scannt ein Verzeichnis rekursiv mit einstellbarer Parallelität und Progress-Updates.
 *
 * @param directoryPath Startverzeichnis
 * @param concurrency Max. Anzahl zeitgleich zu lesender Dateien (Standard: 32)
 * @param onProgress Optionaler Callback für den Live-Fortschritt
 */
export const scanMusicDirectoryParallel = async (
  directoryPath: string,
  concurrency: number = 32,
  onProgress?: ProgressCallback // 👈 3. Parameter (optional)
): Promise<TrackMetadata[]> => {
  // Schritt A: Alle Dateipfade schnell einsammeln
  const entries = await readdir(directoryPath, { recursive: true });

  const audioPaths: string[] = [];
  for (const entry of entries) {
    if (AUDIO_EXTENSIONS.has(extname(entry).toLowerCase())) {
      audioPaths.push(join(directoryPath, entry));
    }
  }

  const total = audioPaths.length;
  let scannedCount = 0;

  // Schritt B: Parallele Verarbeitung mit mapConcurrent
  const rawResults = await mapConcurrent(audioPaths, concurrency, async (filePath: string) => {
    // Metadaten der einzelnen Datei einlesen
    const metadata = await getAudioMetadata(filePath);

    // Zähler erhöhen & Callback aufrufen (falls übergeben)
    scannedCount++;
    if (onProgress) {
      onProgress(scannedCount, total, filePath);
    }

    return metadata;
  });

  // Schritt C: Null-Werte gefiltert zurückgeben
  return rawResults.filter((track: any): track is TrackMetadata => track !== null);
};