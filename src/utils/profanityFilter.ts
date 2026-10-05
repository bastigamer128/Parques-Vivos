/**
 * Filtro de moderación comunitaria y prevención de malas palabras / ofensas.
 * Especializado en modismos e insultos de uso común en Chile y Latinoamérica.
 */

// Lista de términos y expresiones no permitidas
const BANNED_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // Modismos e improperios chilenos severos
  { pattern: /\b(c+o+n+c+h+e+t+u+m+a+[rd]+e+|c+o+n+c+h+e+t+u+m+a+r+e+|c+t+m+)\b/i, label: 'ctm' },
  { pattern: /\b(c+h+u+c+h+e+t+u+m+a+[rd]+e+|c+h+u+c+h+a+|x+u+x+a+)\b/i, label: 'chucha' },
  { pattern: /\b(c+u+l+i+[aá]+[do]*s?|q+l+[ao]*s?|q+l+i+[aá]+o*s?)\b/i, label: 'culiao' },
  { pattern: /\b(a+w+e+o+n+[aá]+[do]*s?|s+a+c+o+w+e+[aá]+s?|s+a+c+o+d+e+w+e+[aá]+s?)\b/i, label: 'aweonao/sacowea' },
  { pattern: /\b(w+e+[oó]+n+[a-z]*|h+u+e+[oó]+n+[a-z]*|w+e+[oó]+n+a+s?|h+u+e+[oó]+n+a+s?)\b/i, label: 'weón/hueón' },
  { pattern: /\b(p+[ií]+c+o+|x+u+p+a+[ -]*e+l+[ -]*p+i+c+o+|c+h+u+p+a+[ -]*e+l+[ -]*p+i+c+o+)\b/i, label: 'pico' },
  { pattern: /\b(v+a+l+e+[ -]*p+[ií]+c+o+)\b/i, label: 'vale pico' },

  // Insultos comunes y denigratorios
  { pattern: /\b(m+i+e+r+d+a+s?|m+i+e+r+d+e+r+[ao]+s?)\b/i, label: 'mierda' },
  { pattern: /\b(p+u+t+[ao]+s?|p+u+t+e+r+[ií]+[ao]+s?)\b/i, label: 'puta/puto' },
  { pattern: /\b(h+i+j+[ao]+[ -]*d+e+[ -]*p+u+t+a+|h+d+p+|h+i+j+u+e+p+u+t+a+)\b/i, label: 'hijo de puta' },
  { pattern: /\b(c+o+n+c+h+a+[ -]*d+e+[ -]*t+u+[ -]*m+a+d+r+e+)\b/i, label: 'concha de tu madre' },
  { pattern: /\b(m+a+l+p+a+r+[ií]+d+[ao]+s?)\b/i, label: 'malparido' },
  { pattern: /\b(b+a+s+t+a+r+d+[ao]+s?)\b/i, label: 'bastardo' },
  { pattern: /\b(m+a+r+i+c+[oó]+n+[a-z]*|m+a+r+i+c+a+s?)\b/i, label: 'maricón' },
  { pattern: /\b(z+o+r+r+[ao]+s?)\b/i, label: 'zorra' },
  { pattern: /\b(v+e+r+g+a+s?)\b/i, label: 'verga' },
  { pattern: /\b(c+a+b+r+[oó]+n+[a-z]*)\b/i, label: 'cabrón' },
  { pattern: /\b(p+e+n+d+e+j+[ao]+s?)\b/i, label: 'pendejo' },
  { pattern: /\b(i+m+b+[eé]+c+i+l+e*s*)\b/i, label: 'imbécil' },
  { pattern: /\b(e+s+t+[uú]+p+i+d+[ao]+s?)\b/i, label: 'estúpido' },
  { pattern: /\b(t+a+r+a+d+[ao]+s?)\b/i, label: 'tarado' },
  { pattern: /\b(m+a+m+a+[gh]+u+e+v+[ao]+s?)\b/i, label: 'mamahuevo' },
  { pattern: /\b(s+u+c+i+[ao]+[ -]*d+e+[ -]*m+i+e+r+d+a+)\b/i, label: 'ofensa denigrante' },
  { pattern: /\b(m+a+t+[aá]+t+e+|s+u+i+c+[ií]+d+[aá]+t+e+)\b/i, label: 'incitación al daño' },
];

/**
 * Normaliza el texto removiendo acentos, puntuación repetitiva y espacios extra
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[^a-z0-9\s]/g, ' ') // Caracteres especiales como espacio
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica si el texto contiene lenguaje inapropiado o malas palabras
 */
export function containsProfanity(text: string): boolean {
  if (!text || text.trim().length === 0) return false;

  const normalized = normalizeText(text);

  for (const item of BANNED_PATTERNS) {
    if (item.pattern.test(text) || item.pattern.test(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Retorna la lista de términos inapropiados encontrados
 */
export function findProfanities(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  const found: string[] = [];
  const normalized = normalizeText(text);

  for (const item of BANNED_PATTERNS) {
    if (item.pattern.test(text) || item.pattern.test(normalized)) {
      if (!found.includes(item.label)) {
        found.push(item.label);
      }
    }
  }

  return found;
}

/**
 * Retorna un mensaje amigable de advertencia para el usuario si se detectan malas palabras
 */
export function getProfanityWarning(text: string): string | null {
  const matches = findProfanities(text);
  if (matches.length === 0) return null;

  return 'Tu publicación contiene palabras o expresiones que no cumplen con las normas de convivencia respetuosa de la comunidad. Por favor, modifícalas para poder publicar.';
}
