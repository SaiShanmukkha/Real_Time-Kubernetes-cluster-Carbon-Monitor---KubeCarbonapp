const k8s = require('@kubernetes/client-node');

async function fetchConfigMap(api, namespace, name) {
    try {
        const response = await api.readNamespacedConfigMap(name, namespace);
        return response.body.data;  
    } catch (error) {
        console.error(`Error fetching ConfigMap ${name} in namespace ${namespace}:`, error);
        return null;  
    }
}

async function listNodesAndConfigMaps() {
    try {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        const { body } = await k8sApi.listNode();
        const nodes = body.items;

        let allNodeDetails = [];

        for (const node of nodes) {
            let nodeDetails = {
                nodeName: node.metadata.name,
                nodeStatus: node.status.conditions.find(cond => cond.type === 'Ready').status,
                nodeAddresses: node.status.addresses.reduce((acc, addr) => {
                    acc[addr.type] = addr.address;
                    return acc;
                }, {}),
                nodeLabels: node.metadata.labels,
            };

            const configMapName = node.metadata.name.replace(/-/g, '') + '.carbon.app.cmap';
            const configMapData = await fetchConfigMap(k8sApi, 'carbon-app', configMapName);

            if (configMapData) {
                Object.entries(configMapData).forEach(([key, value]) => {
                    const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    nodeDetails[camelCaseKey] = value;
                });
            }

            allNodeDetails.push(nodeDetails);
        }

        // Log the comprehensive details of all nodes
        // console.log(JSON.stringify(allNodeDetails, null, 2));

        return allNodeDetails;
    } catch (error) {
        console.error('Error fetching nodes and ConfigMaps:', error);
    }
}


module.exports.listNodesAndConfigMaps = listNodesAndConfigMaps;
