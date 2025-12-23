pipeline {
    agent any

    environment {
        // הגדרת נתיבים כדי שג'נקינס יזהה את docker-compose
        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
        
        // הגדרות כלליות
        COMPOSE_FILE = 'docker-compose.yml'
        REGISTRY_URL = 'docker.io/mirispigelman' 
        BACKEND_IMAGE = 'ai-study-mentor-backend'
        FRONTEND_IMAGE = 'ai-study-mentor-frontend'
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                script {
                    echo 'Cleaning up previous environment and volumes...'
                    // -v מוחק את ה-Volumes (בסיס הנתונים) כדי להתחיל נקי לגמרי
                    sh 'docker-compose -f ${COMPOSE_FILE} down -v || true'
                    // וידוא מחיקה של הקונטיינר למקרה שהוא נשאר "יתום"
                    sh 'docker rm -f postgres-db || true'
                }
            }
        }

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Environment') {
            steps {
                script {
                    echo 'Creating .env file from Jenkins Credentials...'
                    sh 'mkdir -p backend'
                    
                    withCredentials([
                        string(credentialsId: 'DATABASE_URL', variable: 'DB_URL'),
                        string(credentialsId: 'GEMINI_API_KEY', variable: 'AI_KEY'),
                        string(credentialsId: 'PORT', variable: 'APP_PORT')
                    ]) {
                        sh """
                            echo "DATABASE_URL=${DB_URL}" > backend/.env
                            echo "GEMINI_API_KEY=${AI_KEY}" >> backend/.env
                            echo "PORT=${APP_PORT}" >> backend/.env
                        """
                    }
                    echo 'Environment file created successfully.'
                }
            }
        }

        stage('Build & Start Environment') {
            steps {
                script {
                    echo 'Building and starting Docker containers...'
                    sh 'docker-compose -f ${COMPOSE_FILE} up -d --build'
                }
            }
        }

        stage('Wait for Database') {
            steps {
                script {
                    echo 'Waiting for Database to be ready...'
                    // זמן המתנה משמעותי כדי לוודא שבסיס הנתונים סיים את ה-initialization
                    sleep 20
                }
            }
        }

        stage('Setup Dependencies') {
            steps {
                script {
                    echo 'Ensuring dependencies are installed...'
                    // run --rm מבטיח שהפקודה תרוץ גם אם הקונטיינר הראשי לא יציב
                    sh 'docker-compose -f ${COMPOSE_FILE} run -T --rm -u root backend npm install'
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    echo 'Running Integration & Unit Tests...'
                    sh 'docker-compose -f ${COMPOSE_FILE} exec -T backend npm test'
                }
            }
        }
        
        stage('Test Coverage') {
            steps {
                script {
                    echo 'Checking Code Coverage...'
                    sh 'docker-compose -f ${COMPOSE_FILE} exec -T backend npm run test:coverage'
                }
            }
        }

        stage('Build Production Images') {
            steps {
                script {
                    echo 'Building Production Images...'
                    sh "docker build -t ${REGISTRY_URL}/${BACKEND_IMAGE}:${BUILD_NUMBER} ./backend"
                    sh "docker build -t ${REGISTRY_URL}/${FRONTEND_IMAGE}:${BUILD_NUMBER} ./frontend"
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline finished successfully! ✅'
        }
        failure {
            echo 'Pipeline failed. ❌ Check logs for details.'
        }
    }
}