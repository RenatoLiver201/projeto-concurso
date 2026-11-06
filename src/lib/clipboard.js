/**
 * Cópia para a área de transferência com tratamento de falha.
 */
export function copyToClipboard(a) {
  return (async () => {
    try {
      return (await navigator.clipboard.writeText(a), true);
    } catch {
      return false;
    }
  })();
}
