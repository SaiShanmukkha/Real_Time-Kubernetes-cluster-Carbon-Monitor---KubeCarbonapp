const { getCarbonIntensityForRegion } = require('../ElectricityMaps/carbonIntensity');

async function calculateCarbonEmissions(energyConsumption, regionCode) {
    try {
        const { carbonIntensity, PUE } = await getCarbonIntensityForRegion(regionCode);

        if (carbonIntensity === 0 || carbonIntensity === -1) {
            return 0;
        }

        const carbon = energyConsumption * carbonIntensity.carbonIntensity;

        return {carbon, PUE};
    } catch (error) {
        console.error('Failed to calculate carbon emissions:', error);
        return 0;
    }
}

module.exports.calculateCarbonEmissions = calculateCarbonEmissions;
