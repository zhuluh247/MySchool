// Authentication Module
class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Check if user is already logged in
        auth.onAuthStateChanged((user) => {
            if (user) {
                // Get user data from Firestore
                this.getUserData(user.email);
            } else {
                this.showLoginScreen();
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const userType = document.getElementById('userType').value;

        try {
            // Show loading
            this.showLoading(true);

            // Sign in with Firebase Auth
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Get user data from Firestore
            const userData = await firebaseHelper.query(collections.users, 'email', '==', email);
            
            if (userData.length > 0) {
                const userInfo = userData[0];
                
                // Check if role matches
                if (userInfo.role === userType) {
                    this.currentUser = userInfo;
                    this.showDashboard();
                    this.showNotification('Login successful!', 'success');
                } else {
                    await auth.signOut();
                    this.showNotification('Role mismatch. Please select the correct role.', 'error');
                }
            } else {
                await auth.signOut();
                this.showNotification('User not found in database.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Invalid credentials!', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async getUserData(email) {
        try {
            const userData = await firebaseHelper.query(collections.users, 'email', '==', email);
            if (userData.length > 0) {
                this.currentUser = userData[0];
                this.showDashboard();
            }
        } catch (error) {
            console.error('Error getting user data:', error);
            this.showLoginScreen();
        }
    }

    async logout() {
        try {
            await auth.signOut();
            this.currentUser = null;
            this.showLoginScreen();
            document.getElementById('loginForm').reset();
            this.showNotification('Logged out successfully!', 'success');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('dashboardScreen').classList.remove('active');
    }

    showDashboard() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('dashboardScreen').classList.add('active');
        
        // Update user display
        const userDisplay = document.getElementById('userDisplay');
        userDisplay.textContent = `${this.currentUser.name} (${this.currentUser.role})`;

        // Show/hide menu items based on role
        this.updateMenuVisibility();

        // Load dashboard data
        this.loadDashboardData();
    }

    updateMenuVisibility() {
        const role = this.currentUser.role;
        
        // Hide all role-specific items first
        document.querySelectorAll('.teacher-only, .parent-only, .proprietor-only').forEach(item => {
            item.style.display = 'none';
        });

        // Show items based on role
        if (role === 'teacher') {
            document.querySelectorAll('.teacher-only').forEach(item => {
                item.style.display = 'block';
            });
        } else if (role === 'parent') {
            document.querySelectorAll('.parent-only').forEach(item => {
                item.style.display = 'block';
            });
        } else if (role === 'proprietor') {
            document.querySelectorAll('.proprietor-only').forEach(item => {
                item.style.display = 'block';
            });
        }
    }

    async loadDashboardData() {
        try {
            // Get all data
            const students = await firebaseHelper.getAll(collections.students);
            const users = await firebaseHelper.getAll(collections.users);
            const subjects = await firebaseHelper.getAll(collections.subjects);
            const results = await firebaseHelper.getAll(collections.results);
            const activities = await firebaseHelper.getAll(collections.activities);
            
            // Update stats
            document.getElementById('totalStudents').textContent = students.length;
            document.getElementById('totalTeachers').textContent = users.filter(u => u.role === 'teacher').length;
            document.getElementById('totalSubjects').textContent = subjects.length;
            document.getElementById('totalResults').textContent = results.length;

            // Load recent activities
            this.loadActivities(activities);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    loadActivities(activities) {
        const activitiesList = document.getElementById('activityList');
        
        // Sort by date (most recent first)
        activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Take only the 5 most recent
        const recentActivities = activities.slice(0, 5);
        
        activitiesList.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.text}</p>
                    <small>${activity.user} • ${this.getTimeAgo(activity.createdAt)}</small>
                </div>
            </div>
        `).join('');
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        
        return date.toLocaleDateString();
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize Auth
const authManager = new Auth();
