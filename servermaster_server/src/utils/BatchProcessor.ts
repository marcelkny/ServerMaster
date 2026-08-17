/**
 * Verarbeitet ein Array von Elementen in parallelen Chunks/Batches.
 *
 * @param items Die abzuarbeitenden Elemente
 * @param limit Maximale Anzahl paralleler Ausführungen
 * @param fn Asynchrone Verarbeitungsfunktion für ein einzelnes Element
 */
export async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  // Erstellt einen Worker, der sich das nächste freie Element greift
  const worker = async () => {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  };

  // Starte 'limit' Worker parallel
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);

  return results;
}