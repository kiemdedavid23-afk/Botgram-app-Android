/** Déclarations minimales pour les tests (pas de @types/node). Non importé par src/. */
declare module 'fs' {
  export function readdirSync(p: string): string[];
  export function readFileSync(p: string, enc: 'utf8'): string;
  export function statSync(p: string): {isDirectory(): boolean};
}
declare module 'path' {
  export function join(...parts: string[]): string;
  export function normalize(p: string): string;
  export function relative(from: string, to: string): string;
}
declare const __dirname: string;
