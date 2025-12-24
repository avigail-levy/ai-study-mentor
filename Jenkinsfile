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
        script {
            echo 'Forcefully removing any existing project containers...'
            // הוספת rm -f מוודאת שגם אם הקונטיינר תקוע, הוא יימחק בשם שלו
            sh 'docker rm -f postgres-db finalaiproject-backend-1 finalaiproject-frontend-1 || true'
            
            // עכשיו ה-down יעבוד על בטוח ללא קונפליקטים
            sh 'docker-compose down -v --remove-orphans || true'
        }
    }
}
        stage('Checkout') { steps { checkout scm } }
        stage('Prepare Env') {
            steps {
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
                    // הדפסת לוגים של ה-backend לפני הטסטים כדי לראות אם יש שגיאת חיבור ל-DB
                    sh 'docker logs finalaiproject-backend-1' 
                    sh 'docker-compose exec -T backend npm test'
                }
            }
        }
    }
    post {
        success { echo 'Pipeline Success! ✅' }
        failure { echo 'Pipeline Failed. ❌' }
    }
}