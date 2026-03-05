
/**
 * Calcola la distanza di Levenshtein tra due stringhe.
 * Restituisce un numero che rappresenta la differenza.
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  
  const matrix = new Array(bn + 1);
  for (let i = 0; i <= bn; ++i) {
    let row = (matrix[i] = new Array(an + 1));
    row[0] = i;
  }
  const firstRow = matrix[0];
  for (let j = 1; j <= an; ++j) {
    firstRow[j] = j;
  }
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] =
          Math.min(
            matrix[i - 1][j - 1], // substitution
            matrix[i][j - 1], // insertion
            matrix[i - 1][j] // deletion
          ) + 1;
      }
    }
  }
  return matrix[bn][an];
};

/**
 * Restituisce una percentuale di similarità (0-1) tra due stringhe.
 */
export const getSimilarity = (s1: string, s2: string): number => {
    const longer = s1.length > s2.length ? s1 : s2;
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(s1.toLowerCase(), s2.toLowerCase());
    return (longer.length - distance) / longer.length;
};
