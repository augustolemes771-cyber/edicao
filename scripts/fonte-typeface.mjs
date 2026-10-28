// Converte um .ttf em JSON "typeface" do three.js (para TextGeometry). Uso: node scripts/fonte-typeface.mjs <entrada.ttf> <saida.json>
import {readFileSync, writeFileSync} from 'node:fs';
import {TTFLoader} from 'three/examples/jsm/loaders/TTFLoader.js';

const [entrada, saida] = process.argv.slice(2);
const b = readFileSync(entrada);
const json = new TTFLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
writeFileSync(saida, JSON.stringify(json));
console.log(`${Object.keys(json.glyphs).length} glifos em ${saida}`);
