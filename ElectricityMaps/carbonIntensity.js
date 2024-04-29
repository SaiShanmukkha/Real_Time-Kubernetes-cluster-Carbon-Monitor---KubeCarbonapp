const fs = require('fs');
const { fetchCarbonIntensity } = require('./actions');

function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

async function getCarbonIntensityForRegion(regionCode) {
  try {
    const zones = await readJsonFile('./data/aws_em_zones.json');
    const zone = zones.find(z => z.AWS_Region === regionCode);
    
    if (!zone) {
      return 0;
    }
    
    if (zone.RealTime === 'No') {
      return zone.Carbon_Intensity;
    } else {
      const data = await fetchCarbonIntensity(zone.Zone);
      return {
        carbonIntensity: data,
        PUE: zone.PUE
      };
    }
  } catch (error) {
    console.error('Error processing the request:', error);
    return -1;
  }
}


module.exports.getCarbonIntensityForRegion = getCarbonIntensityForRegion;
