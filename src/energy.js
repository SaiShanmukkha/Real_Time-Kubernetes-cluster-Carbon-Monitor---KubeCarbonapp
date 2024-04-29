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

// const CURVE = [0.12, 0.32, 0.75, 1.02];
// const POINTS = [0, 10, 50, 100];

// async function calculateEnergy(duration, instanceType, cpuUtilization, cpuThermalDesignPower) {
//     const metadata = await fetchMetadata(instanceType);
//     const energyWithoutAllocation = calculateSPINEEnergy(duration, cpuUtilization, cpuThermalDesignPower);
//     const total = metadata['vcpus-total'];
//     const allocated = metadata['vcpus-allocated'];
//     if (allocated !== undefined && total !== undefined && total !== 0) {
//         return energyWithoutAllocation * (allocated / total);
//     }
//     return energyWithoutAllocation;
// }


// function calculateSPINEEnergy(duration, cpuUtilization, cpuThermalDesignPower) {
//     const spline = new Spline(POINTS, CURVE);
//     const wattage = spline.at(cpuUtilization) * cpuThermalDesignPower;
//     return (wattage * duration) / 3600 / 1000; // Convert to kWh
// }


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