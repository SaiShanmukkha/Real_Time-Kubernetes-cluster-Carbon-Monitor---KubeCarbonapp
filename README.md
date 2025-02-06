# Kubernetes Carbon & Energy Metrics App (For Cluster's deployed on AWS Cloud EC2 or EKS Only)

## ===> Note:

- **If you are using AWS Elastic Kubernetes Service (EKS) with AWS Fargate, you wont be able to use this app. Because AWS Fargate is serverless providing option, which doesn't give access to the underlying server.**

- **Below steps are only for carbon app monitoring setup. You have to do alot more setup on the side of kubernetes cluster Like setting up kube-prometheus-stack, creating configMaps' for all nodes in the cluster, providing kubeConfig access to this app, etc.**

- **Steps to setup kubernetes cluster for this app, provided in detail in the report as integrating Kubernetes isn't straightforward and requires careful handling.**

### Overview

This App  is a Node.js application designed to monitor, calculate and report on energy consumption and carbon emissions metrics for kubernetes cluster nodes. It integrates with Prometheus to expose custom metrics through a expressJS server. This application fetches and processes data periodically to update the metrics based on node data, CPU utilization, and other relevant information.

### Features

- **Prometheus Integration:** Uses prom-client to expose metrics that can be scraped by Prometheus.
- **Custom Metrics:** Calculates energy consumption (node_energy_kWh) and carbon emissions (node_carbon_emissions_g) per node in kubernetes cluster.
- Other NodeJS metrics for performance analysis.

### Getting Started

#### Prerequisites

- Node.js runtime installed on your machine.
- Live kubernetes cluster with accessable in-cluster prometheus scraper to query CPU data of resources along with it's `.kube/config` file.
- In Cluster prometheus setup to scrape metrics from this service.
- API token from `ElectricityMaps` to get live Carbon Intensity of a region.
- Kubernetes Cluster NodePort Service URL:Port
- This app expects ConfigMap setted up for every node in a namespace `carbon-app` with below data:
    Example Config: `<NODE-NAME-without-hyphen>.carbon.app.cmap`
    
    ```yaml
        apiVersion: v1
        kind: ConfigMap
        metadata:
            namespace: carbon-app
            name: ip1723116206.carbon.app.cmap
        data:
            region: "us-west-2"
            instance-id: "i-0ade3e73d83d825d9"
            instance-type: "t3.xlarge"
            availability-zone: "us-west-2b"
            public-ip: "54.245.222.62"
            private-ip: "172.31.16.206"
            os: "Linux Ubuntu 22.04"
    ```

- Whenever there is modifications in number of nodes in kubernetes cluster, this app is able to detect them automatically and applies necessary changes.

### Setting up this app along with Prometheus & Grafana

1. First build the container image using `./builder.ps1` powershell script.

2. Run this image in the kubernetes cluster's `Master Node` as standalone docker cnotainer by mapping it's port to one of the host port ( access to kubeConfig is obtained by default) or any other server (provide access to `.kube/config` file). Provide `KUBE_CLUSTER_PROMETHEUS` and `ELECTRICITY_MAPS_API_KEY` environmental variables.

    ```bash
        docker run -d -v /home/ubuntu/.kube/config:/root/.kube/config -it -p 5100:3000 \
            -e KUBE_CLUSTER_PROMETHEUS=<your_prometheus_cluster_url> \
            -e ELECTRICITY_MAPS_API_KEY=<your_electricity_maps_api_key> \
            saishanmukkha/carbonprometheus:latest
    ```
    **Note:** Here we are using port `5100` on host make sure it is available or change to another.
3. Now setup prometheus to scrape the carbon and energy metrics from this container `<hostname>:<port>/metrics` endpoint
    ```bash
        docker run --name Prometheus -d -v /path/to/custom/prometheus.yml:/opt/bitnami/prometheus/conf/prometheus.yml bitnami/prometheus:latest
    ```

    **prometheus.yml**
    ```yaml
        global:
            scrape_interval:     10s
            evaluation_interval: 10s

        scrape_configs:
        - job_name: prometheus
            static_configs:
            - targets: ['52.39.174.252:5100']
    ```

    Replace targets with this app hostname or ip along with port if not running on 443 or 80.
3. Setup Grafana 
    ```bash
        docker run -d --name=grafana -p 3000:3000 grafana/grafana
    ```
4. Login into grafana (initial username `admin` and password `admin`) and setup prometheus as source under data sources and provide prometheus container `host-url:port` endpoint.

### How to Customize this app?
1. Download all these files in a folder

2. Install dependencies:

```bash
    npm install
```

**Configuration:** Ensure that the application is correctly configured to interact with your Kubernetes cluster and Prometheus setup. Update any necessary configurations and files in the `./utils/prom.js` and `./src` modules.

#### Running the Application

Run the application by executing:

```bash
node index.js
```

The server will start on port 3000, and metrics will be available at http://localhost:3000/metrics.
Metrics Endpoint

The '/metrics' endpoint serves the following custom metrics:

- **node_energy_kWh:** Energy consumption per node measured in kilowatt-hours. Labeled by node.
- **node_carbon_emissions_g:** Carbon emissions per node measured in grams. Labeled by node.

#### Periodic Updates

The application updates metrics every 5 to 10 seconds based on node data and CPU utilization, providing near real-time monitoring capabilities. It processes the node instances to compute the metrics, which are then made available to Prometheus.

#### Logging

The application logs significant events including updates to the metrics and any errors encountered during processing.

#### Post Customization

build the docker image using `builder.ps1` powershell script and modify its variables before pushing it to dockerhub registry.


### Contact:

For any setup-related queries, email: [saishanmukkha@gmail.com](mailto:saishanmukkha@gmail.com)


