import { sectionSchemas } from './sectionSchema';

export function generateTemplateCsv(): string {
  const headers = ['Section Title', 'Field Label', 'Expected Type', 'Value', 'Section Key', 'Field Key'];
  const rows: string[][] = [headers];

  for (const section of sectionSchemas) {
    for (const field of section.fields) {
      if (field.type === 'evidence') continue; // Skip evidence as it's complex for CSV
      rows.push([
        section.title,
        field.label,
        field.type,
        '',
        section.key,
        field.key
      ]);
    }
  }

  return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function parseKpiCsv(csvText: string): Record<string, Record<string, any>> {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  const data: Record<string, Record<string, any>> = {};
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 6) continue;
    
    const value = row[3];
    const sectionKey = row[4];
    const fieldKey = row[5];
    const type = row[2];
    
    if (!sectionKey || !fieldKey || value.trim() === '') continue;
    
    if (!data[sectionKey]) {
      data[sectionKey] = {};
    }
    
    let parsedValue: any = value;
    if (type === 'number') {
      parsedValue = Number(value);
      if (isNaN(parsedValue)) parsedValue = 0;
    } else if (type === 'taglist') {
      parsedValue = value.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    data[sectionKey][fieldKey] = parsedValue;
  }
  
  return data;
}
