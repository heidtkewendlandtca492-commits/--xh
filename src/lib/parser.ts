import { v4 as uuidv4 } from 'uuid';
import { Asset, AssetType } from '../types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export async function parseFileOrText(data: File | string, defaultType: AssetType = 'character'): Promise<Asset[]> {
  let rows: string[][] = [];

  if (typeof data === 'string') {
    let parsed = Papa.parse<string[]>(data.trim(), { delimiter: '\t', skipEmptyLines: true });
    if (parsed.data.length > 0 && parsed.data[0].length <= 1) {
      parsed = Papa.parse<string[]>(data.trim(), { delimiter: ',', skipEmptyLines: true });
    }
    rows = parsed.data;
  } else {
    if (data.name.endsWith('.csv') || data.name.endsWith('.tsv') || data.name.endsWith('.txt')) {
      const text = await data.text();
      let parsed = Papa.parse<string[]>(text.trim(), { delimiter: '\t', skipEmptyLines: true });
      if (parsed.data.length > 0 && parsed.data[0].length <= 1) {
        parsed = Papa.parse<string[]>(text.trim(), { delimiter: ',', skipEmptyLines: true });
      }
      rows = parsed.data;
    } else {
      const buffer = await data.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    }
  }

  const assets: Asset[] = [];
  
  for (const row of rows) {
    if (!row || row.length === 0) continue;
    
    const cleanRow = row.map(cell => cell !== undefined && cell !== null ? String(cell).trim() : '');
    if (cleanRow.every(cell => !cell)) continue;

    let nameIdx = 0;
    // Check if first column is just an index (number)
    if (cleanRow[0] && /^\d+$/.test(cleanRow[0]) && cleanRow.length > 1) {
      nameIdx = 1;
    }

    const name = cleanRow[nameIdx] || '';
    // Skip header rows
    if (!name || name === '资产名称' || name === '角色名' || name === '姓名' || name === '名称') continue;

    const episodes = cleanRow[nameIdx + 1] || '';
    const description = cleanRow[nameIdx + 2] || '';
    const originalText = cleanRow[nameIdx + 3] || '';

    assets.push({
      id: uuidv4(),
      type: defaultType,
      name,
      episodes,
      description,
      originalText,
      candidates: []
    });
  }

  return assets;
}
