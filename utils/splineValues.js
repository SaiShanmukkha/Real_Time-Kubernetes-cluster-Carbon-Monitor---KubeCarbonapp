const fs = require('fs');
const path = require('path');

function loadJsonFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
            if (err) reject(err);
            else resolve(JSON.parse(data));
        });
    });
}

async function fetchPowerValues(instanceType) {
    try {
        const filePath = './data/aws-instances.json'; 
        const instances = await loadJsonFile(filePath);
        const instanceData = instances.find(inst => inst['Instance type'] === instanceType);
        
        if (!instanceData) {
            throw new Error('Instance type not found');
        }

        const curve = [
            parseFloat(instanceData['Instance @ Idle'].replace(',', '.')),
            parseFloat(instanceData['Instance @ 10%'].replace(',', '.')),
            parseFloat(instanceData['Instance @ 50%'].replace(',', '.')),
            parseFloat(instanceData['Instance @ 100%'].replace(',', '.'))
        ];

        return { points: [0, 10, 50, 100], curve };
    } catch (error) {
        console.error('Error fetching power values:', error);
    }
}


module.exports.fetchPowerValues = fetchPowerValues;

// (async () => {
//     const instanceType = 'a1.medium'; 
//     const { points, curve } = await fetchPowerValues(instanceType);
//     console.log('Points:', points);
//     console.log('Curve:', curve);
// })();