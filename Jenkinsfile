pipeline {
    agent any

    environment {
        // הגדרת נתיבים כדי שג'נקינס יזהה את docker-compose
        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
        
        // הגדרות כלליות
        COMPOSE_FILE = 'docker-compose.yml'
        REGISTRY_URL = 'docker.io/mirispigelman' // החליפי בשם המשתמש שלך ב-DockerHub
        BACKEND_IMAGE = 'ai-study-mentor-backend'
        FRONTEND_IMAGE = 'ai-study-mentor-frontend'
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                script {
                    echo 'Cleaning up previous environment...'
                    // הורדת קונטיינרים ישנים ומחיקת Volumes
                    sh 'docker-compose -f ${COMPOSE_FILE} down -v || true'
                }
            }
        }

        stage('Checkout SCM') {
            steps {
                // משיכת הקוד העדכני מה-Git
                checkout scm
            }
        }

        stage('Prepare Environment') {
            steps {
                script {
                    echo 'Creating .env file from Jenkins Credentials...'
                    // יצירת תיקיית backend אם היא לא קיימת (למקרה שה-Checkout טרם יצר אותה)
                    sh 'mkdir -p backend'
                    
                    // משיכת הסודות שהגדרת בממשק של ג'נקינס
                    withCredentials([
                        string(credentialsId: 'DATABASE_URL', variable: 'DB_URL'),
                        string(credentialsId: 'GEMINI_API_KEY', variable: 'AI_KEY'),
                        string(credentialsId: 'PORT', variable: 'APP_PORT')
                    ]) {
                        // כתיבת המשתנים לקובץ .env בתוך תיקיית backend
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
                    // בנייה והרצה של הסביבה בעזרת הקובץ שיצרנו
                    sh 'docker-compose -f ${COMPOSE_FILE} up -d --build'
                }
            }
        }

        stage('Wait for Database') {
            steps {
                script {
                    echo 'Waiting for Database to be ready...'
                    // המתנה של 15 שניות לאתחול ה-DB
                    sleep 15
                }
            }
        }

        stage('Setup Dependencies') {
    steps {
        script {
            echo 'Ensuring dependencies are installed...'
            // שימוש ב-run במקום exec מאפשר להריץ פקודה על אימג' גם אם הקונטיינר הנוכחי למטה
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
                    // בניית אימג'ים סופיים עם תיוג של מספר ה-Build
                    sh "docker build -t ${REGISTRY_URL}/${BACKEND_IMAGE}:${BUILD_NUMBER} ./backend"
                    sh "docker build -t ${REGISTRY_URL}/${FRONTEND_IMAGE}:${BUILD_NUMBER} ./frontend"
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline finished successfully! ✅ The system is up and running.'
        }
        failure {
            echo 'Pipeline failed. ❌ Check logs for details.'
        }
    }
}