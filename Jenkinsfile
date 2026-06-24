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
    KUBE_APP_NAME = 'nda-fe-web-naive'
    KUBE_CONTAINER_PORT = '8080'
    KUBE_SERVICE_PORT = '80'
    KUBE_IMAGE_PULL_SECRET = 'github-registry-secret'
    CERT_MANAGER_CLUSTER_ISSUER = 'letsencrypt-prod'
    K3S_HOST = credentials('ampere-mrdua9x-ip')
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
            env.KUBE_NAMESPACE = 'nda-dev'
            env.DOCKERFILE = 'scripts/deploy/Dockerfile.Development'
            env.IMAGE_TAG = "dev-${env.BUILD_NUMBER}"
            env.LATEST_TAG = 'dev-latest'
            env.INGRESS_HOST = 'admin-dev.anhnd.me'
            env.TLS_SECRET_NAME = 'admin-dev-anhnd-me-tls'
          } else if (branch == 'main') {
            env.APP_ENV = 'production'
            env.KUBE_NAMESPACE = 'nda-prod'
            env.DOCKERFILE = 'scripts/deploy/Dockerfile.Production'
            env.IMAGE_TAG = "prod-${env.BUILD_NUMBER}"
            env.LATEST_TAG = 'prod-latest'
            env.INGRESS_HOST = 'admin.anhnd.me'
            env.TLS_SECRET_NAME = 'admin-anhnd-me-tls'
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
          echo "Kubernetes namespace: ${env.KUBE_NAMESPACE}"
          echo "Dockerfile: ${env.DOCKERFILE}"
          echo "Ingress host: ${env.INGRESS_HOST}"
          echo "TLS secret: ${env.TLS_SECRET_NAME}"
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

    stage('Deploy to k3s') {
      when {
        anyOf {
          branch 'dev'
          branch 'main'
          expression { env.GIT_BRANCH == 'origin/dev' || env.GIT_BRANCH == 'origin/main' }
        }
      }
      steps {
        withCredentials([sshUserPrivateKey(
          credentialsId: 'ampere-mrdua9x',
          keyFileVariable: 'K3S_SSH_KEY',
          usernameVariable: 'K3S_SSH_USER'
        )]) {
          sh '''
            ssh -i "$K3S_SSH_KEY" \
              -o StrictHostKeyChecking=no \
              -o UserKnownHostsFile=/dev/null \
              "$K3S_SSH_USER@$K3S_HOST" \
              "KUBE_NAMESPACE='$KUBE_NAMESPACE' \
               KUBE_APP_NAME='$KUBE_APP_NAME' \
               KUBE_CONTAINER_PORT='$KUBE_CONTAINER_PORT' \
               KUBE_SERVICE_PORT='$KUBE_SERVICE_PORT' \
               KUBE_IMAGE_PULL_SECRET='$KUBE_IMAGE_PULL_SECRET' \
               INGRESS_HOST='$INGRESS_HOST' \
               TLS_SECRET_NAME='$TLS_SECRET_NAME' \
               CERT_MANAGER_CLUSTER_ISSUER='$CERT_MANAGER_CLUSTER_ISSUER' \
               REGISTRY_URL_NORMALIZED='$REGISTRY_URL_NORMALIZED' \
               REGISTRY_USER='$REGISTRY_USER' \
               REGISTRY_PASS='$REGISTRY_PASS' \
               REGISTRY_IMAGE='$REGISTRY_IMAGE' \
               IMAGE_TAG='$IMAGE_TAG' \
               bash -s" <<'REMOTE_SCRIPT'
set -eu

if command -v kubectl >/dev/null 2>&1; then
  KUBECTL="kubectl"
elif command -v k3s >/dev/null 2>&1; then
  KUBECTL="sudo k3s kubectl"
else
  echo "kubectl or k3s command was not found on target VPS"
  exit 1
fi

IMAGE="${REGISTRY_IMAGE}:${IMAGE_TAG}"

echo "Deploying ${IMAGE} to namespace ${KUBE_NAMESPACE}..."
echo "Ingress host: ${INGRESS_HOST}"
echo "TLS secret: ${TLS_SECRET_NAME}"

if ! ${KUBECTL} get clusterissuer "${CERT_MANAGER_CLUSTER_ISSUER}" >/dev/null 2>&1; then
  echo "WARNING: ClusterIssuer ${CERT_MANAGER_CLUSTER_ISSUER} was not found. TLS certificate will not be issued until cert-manager and the ClusterIssuer exist."
fi

${KUBECTL} create namespace "${KUBE_NAMESPACE}" --dry-run=client -o yaml | ${KUBECTL} apply -f -

${KUBECTL} -n "${KUBE_NAMESPACE}" create secret docker-registry "${KUBE_IMAGE_PULL_SECRET}" \
  --docker-server="${REGISTRY_URL_NORMALIZED}" \
  --docker-username="${REGISTRY_USER}" \
  --docker-password="${REGISTRY_PASS}" \
  --dry-run=client -o yaml | ${KUBECTL} apply -f -

cat <<EOF | ${KUBECTL} apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${KUBE_APP_NAME}
  namespace: ${KUBE_NAMESPACE}
  labels:
    app: ${KUBE_APP_NAME}
spec:
  replicas: 1
  revisionHistoryLimit: 3
  selector:
    matchLabels:
      app: ${KUBE_APP_NAME}
  template:
    metadata:
      labels:
        app: ${KUBE_APP_NAME}
    spec:
      imagePullSecrets:
        - name: ${KUBE_IMAGE_PULL_SECRET}
      containers:
        - name: ${KUBE_APP_NAME}
          image: ${IMAGE}
          imagePullPolicy: Always
          ports:
            - containerPort: ${KUBE_CONTAINER_PORT}
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 300m
              memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: ${KUBE_APP_NAME}
  namespace: ${KUBE_NAMESPACE}
  labels:
    app: ${KUBE_APP_NAME}
spec:
  type: ClusterIP
  selector:
    app: ${KUBE_APP_NAME}
  ports:
    - name: http
      port: ${KUBE_SERVICE_PORT}
      targetPort: ${KUBE_CONTAINER_PORT}
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${KUBE_APP_NAME}
  namespace: ${KUBE_NAMESPACE}
  labels:
    app: ${KUBE_APP_NAME}
  annotations:
    cert-manager.io/cluster-issuer: ${CERT_MANAGER_CLUSTER_ISSUER}
spec:
  ingressClassName: traefik
  tls:
    - hosts:
        - ${INGRESS_HOST}
      secretName: ${TLS_SECRET_NAME}
  rules:
    - host: ${INGRESS_HOST}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${KUBE_APP_NAME}
                port:
                  number: ${KUBE_SERVICE_PORT}
EOF

${KUBECTL} -n "${KUBE_NAMESPACE}" rollout status deployment/${KUBE_APP_NAME} --timeout=180s
${KUBECTL} -n "${KUBE_NAMESPACE}" get deployment,svc,ingress,pods -l app=${KUBE_APP_NAME}
REMOTE_SCRIPT
          '''
        }
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
