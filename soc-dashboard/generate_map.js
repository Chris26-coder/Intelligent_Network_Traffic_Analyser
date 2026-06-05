const fs = require('fs');
const topojson = require('topojson-client');
const d3 = require('d3-geo');

const topology = JSON.parse(fs.readFileSync('public/features.json', 'utf8'));
const geojson = topojson.feature(topology, topology.objects.countries);

// Create a projection that fits into our 920x480 box
const projection = d3.geoEquirectangular()
  .fitSize([920, 480], geojson);

const pathGenerator = d3.geoPath().projection(projection);

const paths = geojson.features.map(f => {
  return pathGenerator(f);
}).filter(Boolean);

const output = `export const WORLD_PATHS = [\n  ${paths.map(p => `"${p}"`).join(',\n  ')}\n];\n`;
fs.writeFileSync('src/components/panels/WorldPaths.ts', output);
console.log('Successfully generated WorldPaths.ts with ' + paths.length + ' paths');
