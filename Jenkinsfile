pipeline {
    agent any

    environment {

    PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"    
        // הגדרות כלליות
        COMPOSE_FILE = 'docker-compose.yml'
        REGISTRY_URL = 'docker.io/your-username' // החליפי בשם המשתמש שלך ב-DockerHub
        BACKEND_IMAGE = 'ai-study-mentor-backend'
        FRONTEND_IMAGE = 'ai-study-mentor-frontend'
        
        // מזהה ה-Credentials בג'נקינס (אם תרצי לדחוף ל-Docker Hub)
        // DOCKER_CREDENTIALS_ID = 'docker-hub-creds' 
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                script {
                    echo 'Cleaning up previous environment...'
                    // הורדת קונטיינרים ישנים ומחיקת Volumes כדי להתחיל נקי (חשוב לטסטים)
                    // ה- "|| true" מונע מהפייפלין להיכשל אם אין מה להוריד
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

        stage('Build & Start Environment') {
            steps {
                script {
                    echo 'Building and starting Docker containers...'
                    // בנייה והרצה של הסביבה
                    // במקום docker-compose
sh 'docker-compose -f ${COMPOSE_FILE} up -d --build'                }
            }
        }

        stage('Wait for Database') {
            steps {
                script {
                    echo 'Waiting for Database to be ready...'
                    // המתנה שה-DB יעלה ויסיים את האתחול
                    sleep 15
                }
            }
        }

        stage('Setup Dependencies') {
            steps {
                script {
                    echo 'Ensuring dependencies are installed inside container...'
                    // וידוא שהתלויות מותקנות בתוך הקונטיינר (פותר בעיות הרשאה ו-Volumes)
                    sh 'docker-compose -f ${COMPOSE_FILE} exec -T -u root backend npm install'
                    // תיקון הרשאות כדי שהמשתמש הרגיל יוכל להריץ טסטים
                    sh 'docker-compose -f ${COMPOSE_FILE} exec -T -u root backend chown -R appuser:appgroup /app/node_modules'
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    echo 'Running Integration & Unit Tests...'
                    // הרצת הטסטים בתוך הקונטיינר של ה-backend
                    // הדגל -T חובה בג'נקינס (מבטל TTY אינטראקטיבי)
                    sh 'docker-compose -f ${COMPOSE_FILE} exec -T backend npm test'
                }
            }
        }
        
        stage('Test Coverage') {
            steps {
                script {
                    echo 'Checking Code Coverage...'
                    // הרצת בדיקת כיסוי קוד
                    sh 'docker-compose -f ${COMPOSE_FILE} exec -T backend npm run test:coverage'
                }
            }
        }

        stage('Build & Push Images') {
            steps {
                script {
                    echo 'Building Production Images...'
                    // בניית אימג'ים סופיים עם תיוג של מספר ה-Build
                    sh "docker build -t ${REGISTRY_URL}/${BACKEND_IMAGE}:${BUILD_NUMBER} ./backend"
                    sh "docker build -t ${REGISTRY_URL}/${FRONTEND_IMAGE}:${BUILD_NUMBER} ./frontend"
                    
                    // דחיפה ל-Registry (בטלי את ההערה אם הגדרת Credentials בג'נקינס)
                    /*
                    withDockerRegistry(credentialsId: DOCKER_CREDENTIALS_ID, url: '') {
                        sh "docker push ${REGISTRY_URL}/${BACKEND_IMAGE}:${BUILD_NUMBER}"
                        sh "docker push ${REGISTRY_URL}/${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                    }
                    */
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
            // במקרה של כישלון, אפשר להוריד את הסביבה
            // sh 'docker-compose -f ${COMPOSE_FILE} down'
        }
    }
}