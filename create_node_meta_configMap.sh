#!/bin/bash

# Collect metadata
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
INSTANCE_TYPE=$(curl -s http://169.254.169.254/latest/meta-data/instance-type)
AVAILABILITY_ZONE=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)

# Create or update ConfigMap
kubectl create configmap aws-node-info \
--from-literal=INSTANCE_ID=$INSTANCE_ID \
--from-literal=INSTANCE_TYPE=$INSTANCE_TYPE \
--from-literal=AVAILABILITY_ZONE=$AVAILABILITY_ZONE \
--from-literal=REGION=$REGION \
--namespace=default \
--dry-run=client -o yaml | kubectl apply -f -
