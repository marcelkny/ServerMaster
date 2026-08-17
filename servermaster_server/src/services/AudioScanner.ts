import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { parseFile, type IAudioMetadata } from 'music-metadata';

// Unterstützte Dateiendungen
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.wma']);

export interface TrackMetadata {
  filePath: string;
  title?: string;
  artist?: string;
  album?: string;
  durationSeconds?: number;
  bitrate?: number;
  sampleRate?: number;
  format: string;
}

/**
 * Parst die Metadaten einer einzelnen Audiodatei.
 */
export const getAudioMetadata = async (filePath: string): Promise<TrackMetadata | null> => {
  try {
    const metadata: IAudioMetadata = await parseFile(filePath);
    const { common, format } = metadata;

    return {
      filePath,
      title: common.title || 'Unbekannter Titel',
      artist: common.artist || 'Unbekannter Künstler',
      album: common.album || 'Unbekanntes Album',
      durationSeconds: format.duration ? Math.round(format.duration) : undefined,
      bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : undefined, // in kbps
      sampleRate: format.sampleRate,
      format: format.container || extname(filePath).slice(1),
    };
  } catch (error) {
    console.error(`Fehler beim Lesen der Metadaten von ${filePath}:`, error);
    return null;
  }
};

/**
 * Scannt einen Ordner rekursiv nach Musikdateien und gibt deren Metadaten zurück.
 */
export const scanMusicDirectory = async (directoryPath: string): Promise<TrackMetadata[]> => {
  const tracks: TrackMetadata[] = [];

  try {
    // readdir mit recursive: true liefert alle Dateien & Unterordner als relative Pfade
    const entries = await readdir(directoryPath, { recursive: true });

    for (const entry of entries) {
      const fullPath = join(directoryPath, entry);
      const ext = extname(entry).toLowerCase();

      if (AUDIO_EXTENSIONS.has(ext)) {
        // Sicherstellen, dass es sich um eine Datei handelt (kein Ordner mit z.B. .mp3 im Namen)
        const fileStat = await stat(fullPath);
        if (fileStat.isFile()) {
          const trackData = await getAudioMetadata(fullPath);
          if (trackData) {
            tracks.push(trackData);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Fehler beim Scannen des Verzeichnisses ${directoryPath}:`, error);
    throw error;
  }

  return tracks;
};