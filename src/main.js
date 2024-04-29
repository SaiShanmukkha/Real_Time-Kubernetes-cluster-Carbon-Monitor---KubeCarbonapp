const { fetchEnergyAndEmbodiedCarbonData, calculateEnergy } = require("./energy");
const { calculateCarbonEmissions } = require("./carbon");

function createCpuUtilizationGenerator() {
    let lastValue = null;

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getNextCpuUtilization() {
        let newValue;
        do {
            newValue = getRandomInt(10, 90);
        } while (lastValue !== null && Math.abs(newValue - lastValue) <= 4); 

        lastValue = newValue; 
        return newValue;
    }

    return getNextCpuUtilization();
}

async function processInstances(duration, instances) {
    let results = [];

    for (let instance of instances) {
        try {
            // Energy: kWh
            const embodied = await fetchEnergyAndEmbodiedCarbonData(instance.instanceType, instance.cpu);

            const POCEnergy = await calculateEnergy(duration, instance.instanceType, instance.cpu);

            // console.log("\n#########\n")
            // console.log("POC Energy=", POCEnergy)
            // console.log("\n#########\n")

            // Calculate carbon emissions for the region and Energy
            const {carbon, PUE} = await calculateCarbonEmissions(POCEnergy, instance.region);

            results.push({
                node: instance.node,
                Energy: POCEnergy * PUE,
                CarbonEmissions: carbon + embodied['carbon-embodied']
            });
        } catch (error) {
            console.error(`Error processing instance ${instance.InstanceType}:`, error);
            results.push({
                node: instance.node,
                Energy: -1,
                CarbonEmissions: -1,
            });
        }
    }

    return results;
}


// processInstances(instances)
//     .then(results => console.log("Results:", results))
//     .catch(err => console.error("An error occurred:", err));
module.exports.createCpuUtilizationGenerator = createCpuUtilizationGenerator;
module.exports.processInstances = processInstances;