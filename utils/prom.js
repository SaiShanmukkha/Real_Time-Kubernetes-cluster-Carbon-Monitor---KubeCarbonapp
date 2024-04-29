
// const query = 'sum(rate(node_cpu_seconds_total{mode!="idle"}[5m])) by (instance)';
const query = '100 - (avg by (instance) (rate(node_cpu_seconds_total{job="node-exporter",mode="idle"}[1m])) * 100)';

const url = `${process.env.KUBE_CLUSTER_PROMETHEUS}/api/v1/query`;

function convertCpuData(prometheusData) {
    let convertedData = {};


    prometheusData.data.result.forEach(item => {
        const ip = item.metric.instance.split(':')[0]; 
        const cpuValue = parseFloat(item.value[1]); 

        
        convertedData[ip] = cpuValue;
    });

    return convertedData;
}

async function fetchCpuUsage() {
    try {
        const response = await fetch(url, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', 
            },
           
            body: new URLSearchParams({ query })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        // console.log(JSON.stringify(data, null, 2));
        
        const pData = convertCpuData(data);

        console.log(pData);
        
        return pData; 
    } catch (error) {
        console.error('Error fetching data: ', error);
    }
}

// fetchCpuUsage();

module.exports.fetchCpuUsage = fetchCpuUsage;