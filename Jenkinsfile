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

          echo "Branch: ${branch}"
          echo "App env: ${env.APP_ENV}"
          echo "Dockerfile: ${env.DOCKERFILE}"
          echo "Image tag: ${env.IMAGE_NAME}:${env.IMAGE_TAG}"
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
          docker build \
            -f "$DOCKERFILE" \
            -t "$IMAGE_NAME:$IMAGE_TAG" \
            -t "$IMAGE_NAME:$LATEST_TAG" \
            .
        '''
      }
    }
  }

  post {
    success {
      echo "Build succeeded: ${IMAGE_NAME}:${IMAGE_TAG}"
    }
    failure {
      echo 'Build failed. Please check the Jenkins console output.'
    }
  }
}
