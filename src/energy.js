const {CloudCarbonFootprint, Interpolation} = require('@grnsft/if-unofficial-plugins');
const { CloudMetadata } = require('@grnsft/if-plugins');
const Spline = require('cubic-spline');
const { fetchPowerValues } = require('../utils/splineValues')

async function fetchMetadata(instanceType) {
    const cloudMetadata = CloudMetadata();
    const cloudMD = await cloudMetadata.execute([
        {
            'cloud/vendor': 'aws',
            'cloud/instance-type': instanceType,
        },
    ]);
    return cloudMD[0];
}


async function calculateEnergy(duration, instanceType, cpuUtilization) {
    const metadata = await fetchMetadata(instanceType);
    const energyWithoutAllocation = await calculateSPINEEnergy(duration, instanceType, cpuUtilization, metadata['cpu/thermal-design-power']);

    const total = metadata['vcpus-total'];
    const allocated = metadata['vcpus-allocated'] || total;

    return (energyWithoutAllocation * (allocated / total));
}


async function calculateSPINEEnergy(duration, instanceType, cpuUtilization, cpuThermalDesignPower) {
    const { points, curve } = await fetchPowerValues(instanceType);
    const spline = new Spline(points, curve);
    const wattage = spline.at(cpuUtilization);
    return (wattage * cpuThermalDesignPower * duration) / 3600 / 1000; // Convert to kWh
}


async function fetchEnergyAndEmboidedCarbonData(instanceType, cpuUtilization) {
    const ccf = CloudCarbonFootprint({interpolation: Interpolation.SPLINE});
    const results = await ccf.execute([
    {
        timestamp: new Date().toISOString(),
        duration: 30,
        'cloud/vendor': 'aws',
        'cloud/instance-type': instanceType,
        'cpu/utilization': cpuUtilization, 
    },
    ]);

    return results[0];
}

module.exports.calculateEnergy = calculateEnergy;
module.exports.fetchEnergyAndEmbodiedCarbonData = fetchEnergyAndEmboidedCarbonData;