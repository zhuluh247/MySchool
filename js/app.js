// Main Application Controller
class App {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupUserManagement();
    }

    setupNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
                
                // Update active menu
                menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Load section-specific data
        switch(sectionId) {
            case 'results':
                resultsManager.loadResults();
                break;
            case 'studentResults':
                this.loadStudentResultsForParents();
                break;
            case 'documents':
                documentManager.loadDocuments();
                break;
            case 'behavior':
                behaviorManager.loadBehaviorRecords();
                break;
            case 'users':
                this.loadUsers();
                break;
        }
    }

    async loadStudentResultsForParents() {
        if (authManager.currentUser.role !== 'parent') return;

        try {
            const childrenList = document.getElementById('childrenList');
            const students = await firebaseHelper.query(collections.students, 'parent', '==', authManager.currentUser.email);
            
            if (students.length === 0) {
                childrenList.innerHTML = '<p class="text-center">No children found</p>';
                return;
            }

            // Get results for each child
            const childrenData = await Promise.all(students.map(async student => {
                const studentResults = await firebaseHelper.query(collections.results, 'studentId', '==', student.id);
                const averageScore = studentResults.length > 0 
                    ? Math.round(studentResults.reduce((sum, r) => sum + r.score, 0) / studentResults.length)
                    : 0;
                
                const latestResults = studentResults.slice(-3);
                
                return {
                    student,
                    results: studentResults,
                    averageScore,
                    latestResults
                };
            }));
            
            childrenList.innerHTML = childrenData.map(({ student, results, averageScore, latestResults }) => `
                <div class="child-card">
                    <div class="child-header">
                        <div class="child-avatar">${student.name.charAt(0)}</div>
                        <div class="child-info">
                            <h3>${student.name}</h3>
                            <p>${student.class}</p>
                        </div>
                    </div>
                    <div class="results-summary">
                        <div class="summary-item">
                            <strong>${averageScore}%</strong>
                            <small>Average Score</small>
                        </div>
                        <div class="summary-item">
                            <strong>${results.length}</strong>
                            <small>Total Results</small>
                        </div>
                    </div>
                    <div class="recent-results">
                        <h4>Recent Results</h4>
                        ${latestResults.length > 0 ? `
                            <table class="mini-table">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Score</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${latestResults.map(r => `
                                        <tr>
                                            <td>${r.subject}</td>
                                            <td>${r.score}</td>
                                            <td><span class="badge badge-${this.getGradeClass(r.grade)}">${r.grade}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p>No results available</p>'}
                        <div style="margin-top: 15px;">
                            <button class="btn btn-sm btn-primary" onclick="resultsManager.viewStudentResults('${student.id}')">
                                <i class="fas fa-eye"></i> View All Results
                            </button>
                            <button class="btn btn-sm btn-success" onclick="resultsManager.downloadStudentResults('${student.id}')">
                                <i class="fas fa-download"></i> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading student results:', error);
        }
    }

    getGradeClass(grade) {
        if (grade.startsWith('A')) return 'success';
        if (grade.startsWith('B')) return 'info';
        if (grade.startsWith('C')) return 'warning';
        return 'danger';
    }

    setupUserManagement() {
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }
    }

    async loadUsers() {
        if (authManager.currentUser.role !== 'proprietor') return;

        try {
            const tbody = document.querySelector('#usersTable tbody');
            const users = await firebaseHelper.getAll(collections.users);
            
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="badge badge-primary">${user.role}</span></td>
                    <td><span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">${user.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="app.editUser('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    showAddUserModal() {
        const modal = document.getElementById('modalContainer');
        
        modal.innerHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add New User</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <form id="addUserForm">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" name="name" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" name="password" required>
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select name="role" required>
                                <option value="">Select Role</option>
                                <option value="teacher">Teacher</option>
                                <option value="parent">Parent</option>
                                <option value="proprietor">Proprietor</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Add User</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addUser(e.target);
        });
    }

    async addUser(form) {
        try {
            const formData = new FormData(form);
            
            // Create user in Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(
                formData.get('email'),
                formData.get('password')
            );
            
            // Save user metadata to Firestore
            const newUser = {
                name: formData.get('name'),
                email: formData.get('email'),
                role: formData.get('role'),
                status: 'active',
                createdAt: new Date().toISOString()
            };

            await firebaseHelper.add(collections.users, newUser);

            form.closest('.modal').remove();
            this.loadUsers();
            authManager.showNotification('User added successfully!', 'success');
        } catch (error) {
            console.error('Error adding user:', error);
            authManager.showNotification('Error adding user: ' + error.message, 'error');
        }
    }

    async editUser(id) {
        try {
            const user = await firebaseHelper.get(collections.users, id);
            
            if (!user) return;

            const modal = document.getElementById('modalContainer');
            modal.innerHTML = `
                <div class="modal active">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Edit User</h3>
                            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                        </div>
                        <form id="editUserForm">
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" name="name" value="${user.name}" required>
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value="${user.email}" required>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select name="status" required>
                                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Update User</button>
                        </form>
                    </div>
                </div>
            `;

            document.getElementById('editUserForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedUser = {
                    ...user,
                    name: formData.get('name'),
                    email: formData.get('email'),
                    status: formData.get('status')
                };
                
                await firebaseHelper.update(collections.users, id, updatedUser);
                e.target.closest('.modal').remove();
                this.loadUsers();
                authManager.showNotification('User updated successfully!', 'success');
            });
        } catch (error) {
            console.error('Error editing user:', error);
            authManager.showNotification('Error editing user', 'error');
        }
    }

    async deleteUser(id) {
        if (!confirm('Are you sure you want to delete this user?')) return;
        if (id === authManager.currentUser.id) {
            authManager.showNotification('You cannot delete your own account!', 'error');
            return;
        }

        try {
            const user = await firebaseHelper.get(collections.users, id);
            
            // Delete user from Firebase Auth
            const userRecord = await auth.getUserByEmail(user.email);
            await auth.deleteUser(userRecord.user.uid);
            
            // Delete user from Firestore
            await firebaseHelper.delete(collections.users, id);
            
            this.loadUsers();
            authManager.showNotification('User deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            authManager.showNotification('Error deleting user', 'error');
        }
    }
}

// Initialize App
const app = new App();
