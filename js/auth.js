// Authentication Module
class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');
        const menuToggle = document.getElementById('menuToggle');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Check if user is already logged in
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.getUserData(user.email);
            } else {
                this.showLoginScreen();
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('active');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const userType = document.getElementById('userType').value;

        try {
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
                // Create user document if it doesn't exist
                const newUser = {
                    name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    email: email,
                    role: userType,
                    status: 'active',
                    createdAt: new Date().toISOString()
                };
                
                await firebaseHelper.add(collections.users, newUser);
                this.currentUser = newUser;
                this.showDashboard();
                this.showNotification('Login successful! User profile created.', 'success');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(`Login failed: ${error.message}`, 'error');
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
            } else {
                this.showLoginScreen();
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
            const dashboardContent = document.getElementById('dashboardContent');
            const role = this.currentUser.role;
            
            if (role === 'parent') {
                // Load parent-specific dashboard
                const students = await firebaseHelper.query(collections.students, 'parent', '==', this.currentUser.email);
                const results = await firebaseHelper.getAll(collections.results);
                
                // Filter results for parent's children
                const studentIds = students.map(s => s.id);
                const childrenResults = results.filter(r => studentIds.includes(r.studentId));
                
                dashboardContent.innerHTML = `
                    <div class="parent-dashboard">
                        <div class="stats-grid">
                            <div class="stat-card">
                                <i class="fas fa-users"></i>
                                <h3>${students.length}</h3>
                                <p>Total Children</p>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-file-alt"></i>
                                <h3>${childrenResults.length}</h3>
                                <p>Total Results</p>
                            </div>
                        </div>
                        <div class="quick-actions">
                            <div class="action-card" onclick="app.showSection('studentResults')">
                                <i class="fas fa-file-alt"></i>
                                <h3>View Results</h3>
                                <p>Check your children's academic performance</p>
                            </div>
                            <div class="action-card" onclick="app.showSection('behavior')">
                                <i class="fas fa-user-check"></i>
                                <h3>Behavior Tracking</h3>
                                <p>Monitor behavior records</p>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Load proprietor/teacher dashboard
                const students = await firebaseHelper.getAll(collections.students);
                const users = await firebaseHelper.getAll(collections.users);
                const subjects = await firebaseHelper.getAll(collections.subjects);
                const results = await firebaseHelper.getAll(collections.results);
                const activities = await firebaseHelper.getAll(collections.activities);
                
                // Update stats
                dashboardContent.innerHTML = `
                    <div class="stats-grid">
                        <div class="stat-card">
                            <i class="fas fa-users"></i>
                            <h3>${students.length}</h3>
                            <p>Total Students</p>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-chalkboard-teacher"></i>
                            <h3>${users.filter(u => u.role === 'teacher').length}</h3>
                            <p>Total Teachers</p>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-book"></i>
                            <h3>${subjects.length}</h3>
                            <p>Subjects</p>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-file-alt"></i>
                            <h3>${results.length}</h3>
                            <p>Results Uploaded</p>
                        </div>
                    </div>
                    <div class="recent-activity">
                        <h3>Recent Activity</h3>
                        <div id="activityList" class="activity-list"></div>
                    </div>
                `;
                
                // Load recent activities
                this.loadActivities(activities);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    loadActivities(activities) {
        const activitiesList = document.getElementById('activityList');
        if (!activitiesList) return;
        
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
