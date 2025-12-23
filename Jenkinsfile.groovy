pipeline {
    agent any

    environment {
        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
        DOCKER_HOST = "tcp://host.docker.internal:2375"        
        COMPOSE_FILE = 'docker-compose.yml'
        REGISTRY_URL = 'docker.io/mirispigelman' 
        BACKEND_IMAGE = 'ai-study-mentor-backend'
        FRONTEND_IMAGE = 'ai-study-mentor-frontend'
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                script {
                    echo 'Cleaning up environment and clearing old containers...'
                    // ניקוי יסודי כדי למנוע התנגשויות של קונטיינרים קודמים
                    sh 'docker-compose -f ${COMPOSE_FILE} down -v --remove-orphans || true'
                    sh 'docker system prune -f || true'
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
                    echo 'Creating .env file...'
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
                }
            }
        }

       stage('Build & Start Environment') {
            steps {
                script {
                    echo 'Building and starting Docker containers...'
                    sh 'docker-compose -f ${COMPOSE_FILE} up -d --build'
                    
                    echo 'Waiting 30 seconds for Backend to stabilize and exit restarting state...'
                    // 30 שניות יבטיחו שהקונטיינר יסיים לעלות לפני הטסטים
                    sleep 30 
                    
                    // בדיקה שהקונטיינר אכן רץ ולא בלולאת ריסטארטים
                    sh '''
                        if [ "$(docker inspect -f '{{.State.Running}}' finalaiproject-backend-1)" != "true" ]; then
                            echo "❌ Backend container is NOT running! Printing logs:"
                            docker logs finalaiproject-backend-1
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    echo 'Freeing up RAM: Stopping Frontend...'
                    sh 'docker stop finalaiproject-frontend-1 || true'
                    
                    echo 'Stability check: Waiting 10s...'
                    sleep 10
                    
                    echo 'Running Tests (Sequentially)...'
                    // שימוש ב-exec פותר את בעיית ה-ENOENT
                    try {
                        sh 'docker-compose -f ${COMPOSE_FILE} exec -T backend npm test'
                    } catch (Exception e) {
                        echo '❌ Tests failed or container crashed. Printing Backend logs:'
                        sh 'docker logs finalaiproject-backend-1'
                        throw e
                    }
                    
                    echo 'Restarting Frontend...'
                    sh 'docker-compose -f ${COMPOSE_FILE} up -d frontend'
                }
            }
        }

        stage('Test Coverage') {
            steps {
                script {
                    sh 'docker-compose -f ${COMPOSE_FILE} exec -T backend npm run test:coverage'
                }
            }
        }

        stage('Build Production Images') {
            steps {
                script {
                    sh "docker build -t ${REGISTRY_URL}/${BACKEND_IMAGE}:${BUILD_NUMBER} ./backend"
                    sh "docker build -t ${REGISTRY_URL}/${FRONTEND_IMAGE}:${BUILD_NUMBER} ./frontend"
                }
            }
        }
    }

    post {
        success { echo 'Pipeline Success! ✅' }
        failure { echo 'Pipeline Failed. ❌' }
    }
}
