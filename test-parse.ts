import fs from 'fs';
import Papa from 'papaparse';

const fileContent = fs.readFileSync('sample_vendors.csv', 'utf8');
const results = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
});

console.log(results.data);
