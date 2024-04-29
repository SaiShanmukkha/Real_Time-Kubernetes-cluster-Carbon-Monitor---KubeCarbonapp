const express = require('express');
const app = express();
const port = 3000;
const client = require('prom-client');
const { fetchCpuUsage } = require('./utils/prom')
const { listNodesAndConfigMaps } = require("./src/kubenode")
const { processInstances } = require('./src/main');

const register = new client.Registry();

register.setDefaultLabels({
    app: 'carbon_app'
});

client.collectDefaultMetrics({ register });

const energyGauge = new client.Gauge({
    name: 'node_energy_kWh',
    help: 'Energy consumption per node in kWh',
    labelNames: ['node'],
    registers: [register]
});

const carbonGauge = new client.Gauge({
    name: 'node_carbon_emissions_g',
    help: 'Carbon emissions per node in grams',
    labelNames: ['node'],
    registers: [register]
});

const randomValueGauge = new client.Gauge({
    name: 'random_value',
    help: 'Random value updated on each /metrics call',
    registers: [register]
});

// Serve metrics at the '/metrics' endpoint
app.get('/metrics', async (req, res) => {
    const randomValue = Math.floor(Math.random() * 100);
    randomValueGauge.set(randomValue);

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Periodically update metrics based on node data
setInterval(() => {
    updateMetricsForInstances().catch(err => console.error('Error updating instance metrics:', err));
}, 10000); 


async function updateMetricsForInstances() {
    try {
        // Fetch node data and CPU utilization data
        const nodeList = await listNodesAndConfigMaps();
        const cpuData = await fetchCpuUsage(); 

        const cpuUsageMap = new Map();
        Object.entries(cpuData).forEach(([ip, cpuValue]) => {
            cpuUsageMap.set(ip, cpuValue); 
        });

        const duration = 10; // Periodically every 5 seconds value updated

        const instances = nodeList.map(node => ({
            node: node.nodeName,
            instanceType: node.instanceType,
            region: node.region,
            cpu: cpuUsageMap.get(node.nodeAddresses.InternalIP) || null 
        }));

        const results = await processInstances(duration, instances);
        console.log("\n\n-----------------------------------------------\n\n");
        console.log(new Date().toISOString());
        console.log("\n\n");
        console.log(instances);
        console.log("\n\n");
        console.log(results);
        results.forEach(result => {
            if (result.Energy !== -1 || result.CarbonEmissions !== -1) {
                energyGauge.labels(result.node).set(result.Energy);
                carbonGauge.labels(result.node).set(result.CarbonEmissions);
            }
        });
    } catch (error) {
        console.error('Error updating instance metrics:', error);
    }
}
