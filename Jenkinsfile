pipeline {
  agent any

  triggers {
    githubPush()
  }

  options {
    disableConcurrentBuilds()
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    IMAGE_NAME = 'nda-fe-web-naive'
    REGISTRY_URL = credentials('docker-registry-personal-url')
    REGISTRY_USER = credentials('docker-registry-user')
    REGISTRY_PASS = credentials('docker-registry-pass')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare build config') {
      steps {
        script {
          def branch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(
            script: 'git rev-parse --abbrev-ref HEAD',
            returnStdout: true
          ).trim()

          branch = branch.replaceFirst(/^origin\//, '')

          if (branch == 'dev') {
            env.APP_ENV = 'development'
            env.DOCKERFILE = 'scripts/deploy/Dockerfile.Development'
            env.IMAGE_TAG = "dev-${env.BUILD_NUMBER}"
            env.LATEST_TAG = 'dev-latest'
          } else if (branch == 'main') {
            env.APP_ENV = 'production'
            env.DOCKERFILE = 'scripts/deploy/Dockerfile.Production'
            env.IMAGE_TAG = "prod-${env.BUILD_NUMBER}"
            env.LATEST_TAG = 'prod-latest'
          } else {
            error("Unsupported branch '${branch}'. Only 'dev' and 'main' are allowed.")
          }

          env.GIT_COMMIT_SHORT = sh(
            script: 'git rev-parse --short HEAD',
            returnStdout: true
          ).trim()

          env.IMAGE_TAG = "${env.IMAGE_TAG}-${env.GIT_COMMIT_SHORT}"
          env.REGISTRY_URL_NORMALIZED = env.REGISTRY_URL.replaceFirst(/^https?:\/\//, '').replaceAll(/\/+$/, '')
          env.REGISTRY_IMAGE = "${env.REGISTRY_URL_NORMALIZED}/${env.REGISTRY_USER}/${env.IMAGE_NAME}".toLowerCase()

          echo "Branch: ${branch}"
          echo "App env: ${env.APP_ENV}"
          echo "Dockerfile: ${env.DOCKERFILE}"
          echo "Image tag: ${env.REGISTRY_IMAGE}:${env.IMAGE_TAG}"
        }
      }
    }

    stage('Build Docker image') {
      when {
        anyOf {
          branch 'dev'
          branch 'main'
          expression { env.GIT_BRANCH == 'origin/dev' || env.GIT_BRANCH == 'origin/main' }
        }
      }
      steps {
        sh '''
          CACHE_FROM=""

          if docker image inspect "$REGISTRY_IMAGE:$LATEST_TAG" >/dev/null 2>&1; then
            CACHE_FROM="--cache-from $REGISTRY_IMAGE:$LATEST_TAG"
            echo "Using Docker cache from $REGISTRY_IMAGE:$LATEST_TAG"
          else
            echo "No local Docker cache image found for $REGISTRY_IMAGE:$LATEST_TAG"
          fi

          docker build \
            $CACHE_FROM \
            -f "$DOCKERFILE" \
            -t "$REGISTRY_IMAGE:$IMAGE_TAG" \
            -t "$REGISTRY_IMAGE:$LATEST_TAG" \
            .
        '''
      }
    }

    stage('Login and push Docker image') {
      when {
        anyOf {
          branch 'dev'
          branch 'main'
          expression { env.GIT_BRANCH == 'origin/dev' || env.GIT_BRANCH == 'origin/main' }
        }
      }
      steps {
        sh '''
          echo "Login to Docker Registry..."
          echo "$REGISTRY_PASS" | docker login "$REGISTRY_URL_NORMALIZED" -u "$REGISTRY_USER" --password-stdin

          docker push "$REGISTRY_IMAGE:$IMAGE_TAG"
          docker push "$REGISTRY_IMAGE:$LATEST_TAG"

          docker logout "$REGISTRY_URL_NORMALIZED"
        '''
      }
    }
  }

  post {
    success {
      echo "Build and push succeeded: ${REGISTRY_IMAGE}:${IMAGE_TAG}"
    }
    failure {
      echo 'Build failed. Please check the Jenkins console output.'
    }
  }
}
