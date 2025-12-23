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
        stage('Cleanup') {
            steps {
                sh 'docker-compose down -v --remove-orphans || true'
                sh 'docker system prune -f || true'
            }
        }
        stage('Checkout') { steps { checkout scm } }
        stage('Prepare Env') {
            steps {
                sh 'mkdir -p backend'
                withCredentials([
                    string(credentialsId: 'GEMINI_API_KEY', variable: 'AI_KEY'),
                    string(credentialsId: 'PORT', variable: 'APP_PORT')
                ]) {
                    // אנחנו מגדירים את ה-DB ידנית ל-db:5432 כדי להבטיח שהקונטיינר יתחבר לקונטיינר של הפוסטגרס ברשת הפנימית
                    // זה מונע טעויות אם ב-Jenkins מוגדר localhost או כתובת ענן
                    sh """
                        echo "DATABASE_URL=postgres://postgres:password@db:5432/vector_db" > backend/.env
                        echo "GEMINI_API_KEY=${AI_KEY}" >> backend/.env
                        echo "PORT=${APP_PORT}" >> backend/.env
                    """
                }
            }
        }
        stage('Build & Start') {
            steps {
                sh 'docker-compose up -d --build --force-recreate'
                echo 'Waiting for services to stabilize...'
                sleep 45
            }
        }
        stage('Run Tests') {
            steps {
                script {
                    sh 'docker stop finalaiproject-frontend-1 || true'
                    
                    // בדיקה קריטית: האם הקונטיינר חי? אם לא - תדפיס לוגים ותעצור
                    def isRunning = sh(script: "docker inspect -f '{{.State.Running}}' finalaiproject-backend-1", returnStdout: true).trim()
                    
                    if (isRunning != 'true') {
                        echo "❌ Backend container is NOT running (Crashed). Printing logs:"
                        sh 'docker logs finalaiproject-backend-1'
                        error("Backend container failed to start. See logs above.")
                    } else {
                        echo "✅ Backend is running. Starting tests..."
                        sh 'docker-compose exec -T backend npm test'
                    }
                }
            }
        }
    }
    post {
        success { echo 'Pipeline Success! ✅' }
        failure { echo 'Pipeline Failed. ❌' }
    }
}