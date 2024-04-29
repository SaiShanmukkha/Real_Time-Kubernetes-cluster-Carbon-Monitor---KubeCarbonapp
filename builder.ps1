$imageName = 'saishanmukkha/carbonprometheus' 
$imageTag = '1.2.0' 
$dockerfilePath = '.' 


Write-Output "Building Docker image ${imageName}:${imageTag}..."
docker build -t ${imageName}:${imageTag} ${dockerfilePath}

if ($LASTEXITCODE -eq 0) {
    Write-Output "Docker image ${imageName}:${imageTag} built successfully."
} else {
    Write-Output "Failed to build Docker image."
    exit $LASTEXITCODE
}


Write-Output "Pushing ${imageName}:${imageTag} to Docker Hub..."
docker push ${imageName}:${imageTag}


if ($LASTEXITCODE -eq 0) {
    Write-Output "Docker image ${imageName}:${imageTag} pushed successfully."
} else {
    Write-Output "Failed to push Docker image."
    exit $LASTEXITCODE
}
