/**
 * Generazione centralizzata di UUID.
 *
 * `crypto.randomUUID()` non è disponibile in contesti non sicuri (es. `http://` su LAN/mobile)
 * né su alcuni browser datati: in quei casi lanciava `TypeError: crypto.randomUUID is not a
 * function`. Questo helper lo usa quando presente e ricade su una generazione UUID v4 conforme
 * basata su `crypto.getRandomValues`, con ultimo fallback su `Math.random` se anche quello manca.
 *
 * Il valore restituito è sempre un UUID v4 valido (stesso formato e semantica di
 * `crypto.randomUUID`), così ID runtime e ID destinati al DB restano interscambiabili.
 */
export function randomUUID(): string {
  const cryptoObj: Crypto | undefined =
    typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Versione 4 e variante RFC 4122, come da specifica UUID v4.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return (
    `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-` +
    `${hex[4]}${hex[5]}-` +
    `${hex[6]}${hex[7]}-` +
    `${hex[8]}${hex[9]}-` +
    `${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`
  );
}
