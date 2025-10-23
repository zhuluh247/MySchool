// Main Application Controller
class App {
    constructor() {
        this.currentUserRole = 'teachers'; // Default tab
        this.init();
    }

    init() {
    this.setupNavigation();
    this.setupTeacherManagement();
    this.setupParentManagement();
    this.setupClassSubjectsManagement();
    this.setupStudentsManagement();
    this.setupClassesManagement();
    this.setupSubjectsManagement();
    this.setupSearchButtons();
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
                
                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('active');
                }
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
        case 'behavior':
            behaviorManager.loadBehaviorRecords();
            break;
        case 'teachers':
            this.loadTeachers();
            break;
        case 'parents':
            this.loadParents();
            break;
        case 'classSubjects':
            this.loadClassSubjects();
            break;
        case 'students':
            this.loadStudents();
            break;
        case 'classes':
            this.loadClasses();
            break;
        case 'subjects':
            this.loadSubjects();
            break;
        case 'dashboard':
            authManager.loadDashboardData();
            break;
    }
}
    setupTeacherManagement() {
    const addTeacherBtn = document.getElementById('addTeacherBtn');
    const uploadTeachersBtn = document.getElementById('uploadTeachersBtn');
    
    if (addTeacherBtn) {
        addTeacherBtn.addEventListener('click', () => this.showAddTeacherModal());
    }
    
    if (uploadTeachersBtn) {
        uploadTeachersBtn.addEventListener('click', () => this.showUploadTeachersModal());
    }
}

setupParentManagement() {
    const addParentBtn = document.getElementById('addParentBtn');
    const uploadParentsBtn = document.getElementById('uploadParentsBtn');
    
    if (addParentBtn) {
        addParentBtn.addEventListener('click', () => this.showAddParentModal());
    }
    
    if (uploadParentsBtn) {
        uploadParentsBtn.addEventListener('click', () => this.showUploadParentsModal());
    }
}

setupClassSubjectsManagement() {
    const assignSubjectsBtn = document.getElementById('assignSubjectsBtn');
    const classSelect = document.getElementById('classSelectForSubjects');
    
    if (assignSubjectsBtn) {
        assignSubjectsBtn.addEventListener('click', () => this.showAssignSubjectsModal());
    }
    
    if (classSelect) {
        classSelect.addEventListener('change', () => this.loadClassSubjects());
    }
    
    // Load classes into select
    this.loadClassesIntoSelect('classSelectForSubjects');
}

async loadTeachers() {
    try {
        const tbody = document.querySelector('#teachersTable tbody');
        const teachers = await firebaseHelper.query(collections.users, 'role', '==', 'teacher');
        
        tbody.innerHTML = teachers.map(teacher => `
            <tr>
                <td>${teacher.name}</td>
                <td>${teacher.email}</td>
                <td>${teacher.assignedClasses ? teacher.assignedClasses.join(', ') : 'Not assigned'}</td>
                <td>${teacher.subjects ? teacher.subjects.join(', ') : 'Not assigned'}</td>
                <td><span class="badge badge-${teacher.status === 'active' ? 'success' : 'danger'}">${teacher.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="app.editTeacher('${teacher.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteTeacher('${teacher.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

async loadParents() {
    try {
        const tbody = document.querySelector('#parentsTable tbody');
        const parents = await firebaseHelper.query(collections.users, 'role', '==', 'parent');
        
        tbody.innerHTML = parents.map(parent => `
            <tr>
                <td>${parent.name}</td>
                <td>${parent.email}</td>
                <td>${parent.children ? parent.children.join(', ') : 'No children'}</td>
                <td><span class="badge badge-${parent.status === 'active' ? 'success' : 'danger'}">${parent.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="app.editParent('${parent.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteParent('${parent.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading parents:', error);
    }
}

async loadClassSubjects() {
    try {
        const classSelect = document.getElementById('classSelectForSubjects');
        const contentDiv = document.getElementById('classSubjectsContent');
        const selectedClass = classSelect.value;
        
        if (!selectedClass) {
            contentDiv.innerHTML = '<p class="text-center">Please select a class</p>';
            return;
        }
        
        // Get class subjects configuration
        const classSubjects = await firebaseHelper.query(collections.classSubjects, 'className', '==', selectedClass);
        
        if (classSubjects.length === 0) {
            contentDiv.innerHTML = `
                <div class="no-subjects">
                    <p>No subjects assigned to this class yet.</p>
                    <button class="btn btn-primary" onclick="app.showAssignSubjectsModal()">
                        <i class="fas fa-plus"></i> Assign Subjects
                    </button>
                </div>
            `;
            return;
        }
        
        // Get subject details
        const subjects = await firebaseHelper.getAll(collections.subjects);
        
        contentDiv.innerHTML = `
            <div class="assigned-subjects">
                <h3>Subjects for ${selectedClass}</h3>
                <div class="subjects-list">
                    ${classSubjects.map(cs => {
                        const subject = subjects.find(s => s.id === cs.subjectId);
                        return `
                            <div class="subject-item">
                                <span class="subject-name">${subject ? subject.name : 'Unknown'}</span>
                                <button class="btn btn-sm btn-danger" onclick="app.removeClassSubject('${cs.id}')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
                <button class="btn btn-primary" onclick="app.showAssignSubjectsModal()">
                    <i class="fas fa-plus"></i> Add More Subjects
                </button>
            </div>
        `;
    } catch (error) {
        console.error('Error loading class subjects:', error);
    }
}

showAddTeacherModal() {
    const modal = document.getElementById('modalContainer');
    
    modal.innerHTML = `
        <div class="modal active">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>Add Teacher</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="addTeacherForm">
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
                        <label>Assigned Classes (Hold Ctrl/Cmd to select multiple)</label>
                        <select name="assignedClasses" multiple required>
                            <!-- Classes will be loaded here -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Subjects (Hold Ctrl/Cmd to select multiple)</label>
                        <select name="subjects" multiple required>
                            <!-- Subjects will be loaded here -->
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Add Teacher</button>
                </form>
            </div>
        </div>
    `;

    // Load classes and subjects into selects
    this.loadClassesIntoSelect('select[name="assignedClasses"]');
    this.loadSubjectsIntoSelect('select[name="subjects"]');

    document.getElementById('addTeacherForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.addTeacher(e.target);
    });
}

async addTeacher(form) {
    try {
        const formData = new FormData(form);
        const assignedClasses = Array.from(formData.getAll('assignedClasses'));
        const subjects = Array.from(formData.getAll('subjects'));
        
        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(
            formData.get('email'),
            formData.get('password')
        );
        
        // Prepare user data
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            role: 'teacher',
            status: 'active',
            assignedClasses: assignedClasses,
            subjects: subjects,
            createdAt: new Date().toISOString()
        };

        // Save user metadata to Firestore
        await firebaseHelper.add(collections.users, userData);

        form.closest('.modal').remove();
        this.loadTeachers();
        authManager.showNotification('Teacher added successfully!', 'success');
    } catch (error) {
        console.error('Error adding teacher:', error);
        authManager.showNotification('Error adding teacher: ' + error.message, 'error');
    }
}

showAddParentModal() {
    const modal = document.getElementById('modalContainer');
    
    modal.innerHTML = `
        <div class="modal active">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>Add Parent</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="addParentForm">
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
                        <label>Children's Admission Numbers (comma separated)</label>
                        <input type="text" name="children" placeholder="2024001, 2024002">
                    </div>
                    <button type="submit" class="btn btn-primary">Add Parent</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('addParentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.addParent(e.target);
    });
}

async addParent(form) {
    try {
        const formData = new FormData(form);
        
        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(
            formData.get('email'),
            formData.get('password')
        );
        
        // Prepare user data
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            role: 'parent',
            status: 'active',
            children: formData.get('children') ? formData.get('children').split(',').map(c => c.trim()) : [],
            createdAt: new Date().toISOString()
        };

        // Save user metadata to Firestore
        await firebaseHelper.add(collections.users, userData);

        // Update students with parent email
        if (userData.children) {
            for (const childAdmission of userData.children) {
                const students = await firebaseHelper.query(collections.students, 'admissionNumber', '==', childAdmission);
                if (students.length > 0) {
                    await firebaseHelper.update(collections.students, students[0].id, {
                        ...students[0],
                        parent: userData.email
                    });
                }
            }
        }

        form.closest('.modal').remove();
        this.loadParents();
        authManager.showNotification('Parent added successfully!', 'success');
    } catch (error) {
        console.error('Error adding parent:', error);
        authManager.showNotification('Error adding parent: ' + error.message, 'error');
    }
}

showAssignSubjectsModal() {
    const modal = document.getElementById('modalContainer');
    const classSelect = document.getElementById('classSelectForSubjects');
    const selectedClass = classSelect.value;
    
    if (!selectedClass) {
        authManager.showNotification('Please select a class first', 'error');
        return;
    }
    
    modal.innerHTML = `
        <div class="modal active">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>Assign Subjects to ${selectedClass}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="assignSubjectsForm">
                    <input type="hidden" name="className" value="${selectedClass}">
                    <div class="form-group">
                        <label>Select Subjects (Hold Ctrl/Cmd to select multiple)</label>
                        <select name="subjects" multiple required>
                            <!-- Subjects will be loaded here -->
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Assign Subjects</button>
                </form>
            </div>
        </div>
    `;

    // Load subjects into select
    this.loadSubjectsIntoSelect('select[name="subjects"]');

    document.getElementById('assignSubjectsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.assignSubjects(e.target);
    });
}

async assignSubjects(form) {
    try {
        const formData = new FormData(form);
        const className = formData.get('className');
        const subjectIds = Array.from(formData.getAll('subjects'));
        
        // Clear existing subjects for this class
        const existingClassSubjects = await firebaseHelper.query(collections.classSubjects, 'className', '==', className);
        for (const cs of existingClassSubjects) {
            await firebaseHelper.delete(collections.classSubjects, cs.id);
        }
        
        // Add new subject assignments
        for (const subjectId of subjectIds) {
            await firebaseHelper.add(collections.classSubjects, {
                className: className,
                subjectId: subjectId,
                createdAt: new Date().toISOString()
            });
        }

        form.closest('.modal').remove();
        this.loadClassSubjects();
        authManager.showNotification('Subjects assigned successfully!', 'success');
    } catch (error) {
        console.error('Error assigning subjects:', error);
        authManager.showNotification('Error assigning subjects', 'error');
    }
}

async loadSubjectsIntoSelect(selector) {
    try {
        const subjects = await firebaseHelper.getAll(collections.subjects);
        const select = document.querySelector(selector);
        if (select) {
            select.innerHTML = subjects.map(subject => `
                <option value="${subject.id}">${subject.name}</option>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}
    setupSearchButtons() {
    // Student search - automatic on input
    const studentSearchInput = document.getElementById('studentSearchInput');
    if (studentSearchInput) {
        let searchTimeout;
        studentSearchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchStudents();
            }, 500); // Wait 500ms after user stops typing
        });
    }

    // Hide search buttons since they're no longer needed
    const studentSearchBtn = document.getElementById('studentSearchBtn');
    if (studentSearchBtn) {
        studentSearchBtn.style.display = 'none';
    }

    // Behavior search - automatic on input
    const behaviorSearchInput = document.getElementById('studentSearch');
    if (behaviorSearchInput) {
        let behaviorSearchTimeout;
        behaviorSearchInput.addEventListener('input', (e) => {
            clearTimeout(behaviorSearchTimeout);
            behaviorSearchTimeout = setTimeout(() => {
                this.searchBehaviorStudents();
            }, 500);
        });
    }
}

        // Student search input enter key
        const studentSearchInput = document.getElementById('studentSearchInput');
        if (studentSearchInput) {
            studentSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchStudents();
                }
            });
        }

        // Behavior search button
        const behaviorSearchBtn = document.getElementById('studentSearchBtn');
        if (behaviorSearchBtn) {
            behaviorSearchBtn.addEventListener('click', () => {
                this.searchBehaviorStudents();
            });
        }
    }

    async searchStudents() {
        try {
            const searchTerm = document.getElementById('studentSearchInput').value.trim();
            if (!searchTerm) {
                this.loadStudents();
                return;
            }

            const students = await firebaseHelper.getAll(collections.students);
            const filteredStudents = students.filter(student => 
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.class.toLowerCase().includes(searchTerm.toLowerCase())
            );

            this.displayStudents(filteredStudents);
        } catch (error) {
            console.error('Error searching students:', error);
            authManager.showNotification('Error searching students', 'error');
        }
    }

    async searchBehaviorStudents() {
        try {
            const searchTerm = document.getElementById('studentSearch').value.trim();
            if (!searchTerm) {
                behaviorManager.loadStudents();
                return;
            }

            const students = await firebaseHelper.getAll(collections.students);
            const filteredStudents = students.filter(student => 
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.class.toLowerCase().includes(searchTerm.toLowerCase())
            );

            behaviorManager.updateStudentSelect(filteredStudents);
        } catch (error) {
            console.error('Error searching behavior students:', error);
            authManager.showNotification('Error searching students', 'error');
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
        const uploadUsersBtn = document.getElementById('uploadUsersBtn');
        
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }
        
        if (uploadUsersBtn) {
            uploadUsersBtn.addEventListener('click', () => this.showUploadUsersModal());
        }
    }

    showUserTab(role) {
        this.currentUserRole = role;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Reload users with new filter
        this.loadUsers();
    }

    async loadUsers() {
        if (authManager.currentUser.role !== 'proprietor') return;

        try {
            const tbody = document.querySelector('#usersTable tbody');
            let users = await firebaseHelper.getAll(collections.users);
            
            // Filter by role
            users = users.filter(u => u.role === this.currentUserRole);
            
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
                        <h3>Add New ${this.currentUserRole.slice(0, -1)}</h3>
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
                        ${this.currentUserRole === 'teachers' ? `
                        <div class="form-group">
                            <label>Subjects (comma separated)</label>
                            <input type="text" name="subjects" placeholder="Mathematics, English, Science">
                        </div>
                        ` : ''}
                        ${this.currentUserRole === 'parents' ? `
                        <div class="form-group">
                            <label>Children's Admission Numbers (comma separated)</label>
                            <input type="text" name="children" placeholder="2024001, 2024002">
                        </div>
                        ` : ''}
                        <input type="hidden" name="role" value="${this.currentUserRole.slice(0, -1)}">
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

    showUploadUsersModal() {
        const modal = document.getElementById('modalContainer');
        
        modal.innerHTML = `
            <div class="modal active excel-upload-modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h3>Upload ${this.currentUserRole} from Excel</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="excel-template">
                        <p><strong>Excel Format:</strong></p>
                        <p>Your Excel file should contain the following columns:</p>
                        <ul>
                            <li>Name (required)</li>
                            <li>Email (required)</li>
                            <li>Password (required)</li>
                            ${this.currentUserRole === 'teachers' ? '<li>Subjects (optional, comma separated)</li>' : ''}
                            ${this.currentUserRole === 'parents' ? '<li>Children (optional, comma separated admission numbers)</li>' : ''}
                        </ul>
                        <a href="#" class="template-link" onclick="app.downloadUserTemplate(); return false;">
                            <i class="fas fa-download"></i> Download Template
                        </a>
                    </div>
                    <div class="upload-area" id="userUploadArea">
                        <div class="upload-icon">
                            <i class="fas fa-file-excel"></i>
                        </div>
                        <div class="upload-text">Drag and drop your Excel file here</div>
                        <div class="upload-hint">or click to browse</div>
                        <input type="file" id="userFileInput" accept=".xlsx,.xls" style="display: none;">
                    </div>
                    <button id="processUserBtn" class="btn btn-primary" style="display: none;">
                        <i class="fas fa-cog"></i> Process File
                    </button>
                </div>
            </div>
        `;

        this.setupFileUpload('userUploadArea', 'userFileInput', 'processUserBtn', (file) => {
            this.processUserExcel(file);
        });
    }

    downloadUserTemplate() {
        const templateData = [
            ['Name', 'Email', 'Password', this.currentUserRole === 'teachers' ? 'Subjects' : 'Children']
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, `${this.currentUserRole}_template.xlsx`);
    }

    async processUserExcel(file) {
        try {
            const data = await this.readExcelFile(file);
            const users = [];
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (row[0] && row[1] && row[2]) { // Name, Email, Password are required
                    const user = {
                        name: row[0],
                        email: row[1],
                        password: row[2],
                        role: this.currentUserRole.slice(0, -1),
                        status: 'active',
                        createdAt: new Date().toISOString()
                    };
                    
                    if (this.currentUserRole === 'teachers' && row[3]) {
                        user.subjects = row[3].split(',').map(s => s.trim());
                    }
                    
                    if (this.currentUserRole === 'parents' && row[3]) {
                        user.children = row[3].split(',').map(c => c.trim());
                    }
                    
                    users.push(user);
                }
            }

            // Create users in Firebase
            for (const user of users) {
                try {
                    await auth.createUserWithEmailAndPassword(user.email, user.password);
                    await firebaseHelper.add(collections.users, user);
                    
                    // If parent, update students with parent email
                    if (user.role === 'parent' && user.children) {
                        for (const childAdmission of user.children) {
                            const students = await firebaseHelper.query(collections.students, 'admissionNumber', '==', childAdmission);
                            if (students.length > 0) {
                                await firebaseHelper.update(collections.students, students[0].id, {
                                    ...students[0],
                                    parent: user.email
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error creating user ${user.email}:`, error);
                }
            }

            document.getElementById('modalContainer').innerHTML = '';
            this.loadUsers();
            authManager.showNotification(`${users.length} users uploaded successfully!`, 'success');
        } catch (error) {
            console.error('Error processing Excel file:', error);
            authManager.showNotification('Error processing Excel file', 'error');
        }
    }

    async addUser(form) {
        try {
            const formData = new FormData(form);
            
            // Create user in Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(
                formData.get('email'),
                formData.get('password')
            );
            
            // Prepare user data
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                role: formData.get('role'),
                status: 'active',
                createdAt: new Date().toISOString()
            };

            // Add role-specific data
            if (formData.get('subjects')) {
                userData.subjects = formData.get('subjects').split(',').map(s => s.trim());
            }
            
            if (formData.get('children')) {
                userData.children = formData.get('children').split(',').map(c => c.trim());
            }

            // Save user metadata to Firestore
            await firebaseHelper.add(collections.users, userData);

            // If parent, update students with parent email
            if (userData.role === 'parent' && userData.children) {
                for (const childAdmission of userData.children) {
                    const students = await firebaseHelper.query(collections.students, 'admissionNumber', '==', childAdmission);
                    if (students.length > 0) {
                        await firebaseHelper.update(collections.students, students[0].id, {
                            ...students[0],
                            parent: userData.email
                        });
                    }
                }
            }

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

    setupStudentsManagement() {
        const addStudentBtn = document.getElementById('addStudentBtn');
        const uploadStudentsBtn = document.getElementById('uploadStudentsBtn');
        
        if (addStudentBtn) {
            addStudentBtn.addEventListener('click', () => this.showAddStudentModal());
        }
        
        if (uploadStudentsBtn) {
            uploadStudentsBtn.addEventListener('click', () => this.showUploadStudentsModal());
        }
    }

    async loadStudents() {
        try {
            const students = await firebaseHelper.getAll(collections.students);
            this.displayStudents(students);
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    displayStudents(students) {
        const tbody = document.querySelector('#studentsTable tbody');
        
        tbody.innerHTML = students.map(student => `
            <tr>
                <td>${student.admissionNumber}</td>
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${student.gender}</td>
                <td>${student.dateOfBirth}</td>
                <td>${student.parent || 'Not assigned'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="app.editStudent('${student.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteStudent('${student.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    showAddStudentModal() {
        const modal = document.getElementById('modalContainer');
        
        modal.innerHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Student</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <form id="addStudentForm">
                        <div class="form-group">
                            <label>Admission Number</label>
                            <input type="text" name="admissionNumber" required>
                        </div>
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" name="name" required>
                        </div>
                        <div class="form-group">
                            <label>Class</label>
                            <select name="class" required>
                                <option value="">Select Class</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Gender</label>
                            <select name="gender" required>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Date of Birth</label>
                            <input type="date" name="dateOfBirth" required>
                        </div>
                        <div class="form-group">
                            <label>Parent Email (Optional)</label>
                            <input type="email" name="parent">
                        </div>
                        <button type="submit" class="btn btn-primary">Add Student</button>
                    </form>
                </div>
            </div>
        `;

        // Load classes into select
        this.loadClassesIntoSelect('select[name="class"]');

        document.getElementById('addStudentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudent(e.target);
        });
    }

    showUploadStudentsModal() {
        const modal = document.getElementById('modalContainer');
        
        modal.innerHTML = `
            <div class="modal active excel-upload-modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h3>Upload Students from Excel</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="excel-template">
                        <p><strong>Excel Format:</strong></p>
                        <p>Your Excel file should contain the following columns:</p>
                        <ul>
                            <li>Admission Number (required)</li>
                            <li>Name (required)</li>
                            <li>Class (required)</li>
                            <li>Gender (required)</li>
                            <li>Date of Birth (required, format: YYYY-MM-DD)</li>
                            <li>Parent Email (optional)</li>
                        </ul>
                        <a href="#" class="template-link" onclick="app.downloadStudentTemplate(); return false;">
                            <i class="fas fa-download"></i> Download Template
                        </a>
                    </div>
                    <div class="upload-area" id="studentUploadArea">
                        <div class="upload-icon">
                            <i class="fas fa-file-excel"></i>
                        </div>
                        <div class="upload-text">Drag and drop your Excel file here</div>
                        <div class="upload-hint">or click to browse</div>
                        <input type="file" id="studentFileInput" accept=".xlsx,.xls" style="display: none;">
                    </div>
                    <button id="processStudentBtn" class="btn btn-primary" style="display: none;">
                        <i class="fas fa-cog"></i> Process File
                    </button>
                </div>
            </div>
        `;

        this.setupFileUpload('studentUploadArea', 'studentFileInput', 'processStudentBtn', (file) => {
            this.processStudentExcel(file);
        });
    }

    downloadStudentTemplate() {
        const templateData = [
            ['Admission Number', 'Name', 'Class', 'Gender', 'Date of Birth', 'Parent Email']
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'students_template.xlsx');
    }

    async processStudentExcel(file) {
        try {
            const data = await this.readExcelFile(file);
            const students = [];
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (row[0] && row[1] && row[2] && row[3] && row[4]) { // Required fields
                    const student = {
                        admissionNumber: row[0],
                        name: row[1],
                        class: row[2],
                        gender: row[3],
                        dateOfBirth: row[4],
                        parent: row[5] || null,
                        createdAt: new Date().toISOString()
                    };
                    students.push(student);
                }
            }

            // Add students to Firebase
            for (const student of students) {
                await firebaseHelper.add(collections.students, student);
            }

            document.getElementById('modalContainer').innerHTML = '';
            this.loadStudents();
            authManager.showNotification(`${students.length} students uploaded successfully!`, 'success');
        } catch (error) {
            console.error('Error processing Excel file:', error);
            authManager.showNotification('Error processing Excel file', 'error');
        }
    }

    async loadClassesIntoSelect(selector) {
        try {
            const classes = await firebaseHelper.getAll(collections.classes);
            const select = document.querySelector(selector);
            if (select) {
                select.innerHTML = '<option value="">Select Class</option>' + 
                    classes.map(cls => `<option value="${cls.name}">${cls.name}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    }

    async addStudent(form) {
        try {
            const formData = new FormData(form);
            
            const newStudent = {
                admissionNumber: formData.get('admissionNumber'),
                name: formData.get('name'),
                class: formData.get('class'),
                gender: formData.get('gender'),
                dateOfBirth: formData.get('dateOfBirth'),
                parent: formData.get('parent') || null,
                createdAt: new Date().toISOString()
            };

            await firebaseHelper.add(collections.students, newStudent);

            // Add activity
            await firebaseHelper.add(collections.activities, {
                icon: 'fa-user-graduate',
                text: `New student added: ${newStudent.name}`,
                time: 'Just now',
                user: authManager.currentUser.name,
                createdAt: new Date().toISOString()
            });

            form.closest('.modal').remove();
            this.loadStudents();
            authManager.showNotification('Student added successfully!', 'success');
        } catch (error) {
            console.error('Error adding student:', error);
            authManager.showNotification('Error adding student', 'error');
        }
    }

    async editStudent(id) {
        try {
            const student = await firebaseHelper.get(collections.students, id);
            
            if (!student) return;

            const modal = document.getElementById('modalContainer');
            modal.innerHTML = `
                <div class="modal active">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Edit Student</h3>
                            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                        </div>
                        <form id="editStudentForm">
                            <div class="form-group">
                                <label>Admission Number</label>
                                <input type="text" name="admissionNumber" value="${student.admissionNumber}" required>
                            </div>
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" name="name" value="${student.name}" required>
                            </div>
                            <div class="form-group">
                                <label>Class</label>
                                <select name="class" required>
                                    <option value="">Select Class</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Gender</label>
                                <select name="gender" required>
                                    <option value="Male" ${student.gender === 'Male' ? 'selected' : ''}>Male</option>
                                    <option value="Female" ${student.gender === 'Female' ? 'selected' : ''}>Female</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Date of Birth</label>
                                <input type="date" name="dateOfBirth" value="${student.dateOfBirth}" required>
                            </div>
                            <div class="form-group">
                                <label>Parent Email</label>
                                <input type="email" name="parent" value="${student.parent || ''}">
                            </div>
                            <button type="submit" class="btn btn-primary">Update Student</button>
                        </form>
                    </div>
                </div>
            `;

            // Load classes into select
            this.loadClassesIntoSelect('select[name="class"]');
            // Set current class
            setTimeout(() => {
                document.querySelector(`select[name="class"] option[value="${student.class}"]`).selected = true;
            }, 100);

            document.getElementById('editStudentForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedStudent = {
                    ...student,
                    admissionNumber: formData.get('admissionNumber'),
                    name: formData.get('name'),
                    class: formData.get('class'),
                    gender: formData.get('gender'),
                    dateOfBirth: formData.get('dateOfBirth'),
                    parent: formData.get('parent') || null
                };
                
                await firebaseHelper.update(collections.students, id, updatedStudent);
                e.target.closest('.modal').remove();
                this.loadStudents();
                authManager.showNotification('Student updated successfully!', 'success');
            });
        } catch (error) {
            console.error('Error editing student:', error);
            authManager.showNotification('Error editing student', 'error');
        }
    }

    async deleteStudent(id) {
        if (!confirm('Are you sure you want to delete this student?')) return;

        try {
            await firebaseHelper.delete(collections.students, id);
            this.loadStudents();
            authManager.showNotification('Student deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting student:', error);
            authManager.showNotification('Error deleting student', 'error');
        }
    }

    setupClassesManagement() {
        const addClassBtn = document.getElementById('addClassBtn');
        const uploadClassesBtn = document.getElementById('uploadClassesBtn');
        
        if (addClassBtn) {
            addClassBtn.addEventListener('click', () => this.showAddClassModal());
        }
        
        if (uploadClassesBtn) {
            uploadClassesBtn.addEventListener('click', () => this.showUploadClassesModal());
        }
    }

async loadClasses() {
    try {
        const classesGrid = document.getElementById('classesGrid');
        const classes = await firebaseHelper.getAll(collections.classes);
        
        classesGrid.innerHTML = classes.map(cls => {
            const studentsCount = this.getStudentsCount(cls.name);
            return `
                <div class="class-card">
                    <div class="class-header">
                        <div class="class-name">${cls.name}</div>
                        <div class="class-actions">
                            <button class="btn btn-sm btn-warning" onclick="app.editClass('${cls.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteClass('${cls.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="class-teacher">Class Teacher: ${cls.teacher || 'Not assigned'}</div>
                    <div class="class-students">${studentsCount} Students</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

    async editClass(id) {
    try {
        const cls = await firebaseHelper.get(collections.classes, id);
        
        if (!cls) return;

        const modal = document.getElementById('modalContainer');
        modal.innerHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Class</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <form id="editClassForm">
                        <div class="form-group">
                            <label>Class Name</label>
                            <input type="text" name="name" value="${cls.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Class Teacher Email (Optional)</label>
                            <input type="email" name="teacher" value="${cls.teacher || ''}" placeholder="teacher@myschool.com">
                        </div>
                        <button type="submit" class="btn btn-primary">Update Class</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('editClassForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedClass = {
                ...cls,
                name: formData.get('name'),
                teacher: formData.get('teacher') || null
            };
            
            await firebaseHelper.update(collections.classes, id, updatedClass);
            e.target.closest('.modal').remove();
            this.loadClasses();
            authManager.showNotification('Class updated successfully!', 'success');
        });
    } catch (error) {
        console.error('Error editing class:', error);
        authManager.showNotification('Error editing class', 'error');
    }
}
    async getStudentsCount(className) {
        try {
            const students = await firebaseHelper.query(collections.students, 'class', '==', className);
            return students.length;
        } catch (error) {
            return 0;
        }
    }

    showAddClassModal() {
        const modal = document.getElementById('modalContainer');
        
        modal.innerHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Class</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <form id="addClassForm">
                        <div class="form-group">
                            <label>Class Name</label>
                            <input type="text" name="name" placeholder="e.g., JSS 1A" required>
                        </div>
                        <div class="form-group">
                            <label>Class Teacher Email (Optional)</label>
                            <input type="email" name="teacher" placeholder="teacher@myschool.com">
                        </div>
                        <button type="submit" class="btn btn-primary">Add Class</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('addClassForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addClass(e.target);
        });
    }

    showUploadClassesModal() {
        const modal = document.getElementById('modalContainer');
        
        modal.innerHTML = `
            <div class="modal active excel-upload-modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h3>Upload Classes from Excel</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="excel-template">
                        <p><strong>Excel Format:</strong></p>
                        <p>Your Excel file should contain the following columns:</p>
                        <ul>
                            <li>Class Name (required)</li>
                            <li>Class Teacher Email (optional)</li>
                        </ul>
                        <a href="#" class="template-link" onclick="app.downloadClassTemplate(); return false;">
                            <i class="fas fa-download"></i> Download Template
                        </a>
                    </div>
                    <div class="upload-area" id="classUploadArea">
                        <div class="upload-icon">
                            <i class="fas fa-file-excel"></i>
                        </div>
                        <div class="upload-text">Drag and drop your Excel file here</div>
                        <div class="upload-hint">or click to browse</div>
                        <input type="file" id="classFileInput" accept=".xlsx,.xls" style="display: none;">
                    </div>
                    <button id="processClassBtn" class="btn btn-primary" style="display: none;">
                        <i class="fas fa-cog"></i> Process File
                    </button>
                </div>
            </div>
        `;

        this.setupFileUpload('classUploadArea', 'classFileInput', 'processClassBtn', (file) => {
            this.processClassExcel(file);
        });
    }

    downloadClassTemplate() {
        const templateData = [
            ['Class Name', 'Class Teacher Email']
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'classes_template.xlsx');
    }

    async processClassExcel(file) {
        try {
            const data = await this.readExcelFile(file);
            const classes = [];
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (row[0]) { // Class name is required
                    const cls = {
                        name: row[0],
                        teacher: row[1] || null,
                        createdAt: new Date().toISOString()
                    };
                    classes.push(cls);
                }
            }

            // Add classes to Firebase
            for (const cls of classes) {
                await firebaseHelper.add(collections.classes, cls);
            }

            document.getElementById('modalContainer').innerHTML = '';
            this.loadClasses();
            authManager.showNotification(`${classes.length} classes uploaded successfully!`, 'success');
        } catch (error) {
            console.error('Error processing Excel file:', error);
            authManager.showNotification('Error processing Excel file', 'error');
        }
    }

    async addClass(form) {
        try {
            const formData = new FormData(form);
            
            const newClass = {
                name: formData.get('name'),
                teacher: formData.get('teacher') || null,
                createdAt: new Date().toISOString()
            };

            await firebaseHelper.add(collections.classes, newClass);

            // Add activity
            await firebaseHelper.add(collections.activities, {
                icon: 'fa-chalkboard',
                text: `New class added: ${newClass.name}`,
                time: 'Just now',
                user: authManager.currentUser.name,
                createdAt: new Date().toISOString()
            });

            form.closest('.modal').remove();
            this.loadClasses();
            authManager.showNotification('Class added successfully!', 'success');
        } catch (error) {
            console.error('Error adding class:', error);
            authManager.showNotification('Error adding class', 'error');
        }
    }

    async deleteClass(id) {
        if (!confirm('Are you sure you want to delete this class?')) return;

        try {
            await firebaseHelper.delete(collections.classes, id);
            this.loadClasses();
            authManager.showNotification('Class deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting class:', error);
            authManager.showNotification('Error deleting class', 'error');
        }
    }

    setupSubjectsManagement() {
        const addSubjectBtn = document.getElementById('addSubjectBtn');
        const uploadSubjectsBtn = document.getElementById('uploadSubjectsBtn');
        
        if (addSubjectBtn) {
            addSubjectBtn.addEventListener('click', () => this.showAddSubjectModal());
        }
        
        if (uploadSubjectsBtn) {
            uploadSubjectsBtn.addEventListener('click', () => this.showUploadSubjectsModal());
        }
    }

    async loadSubjects() {
        try {
            const subjectsGrid = document.getElementById('subjectsGrid');
            const subjects = await firebaseHelper.getAll(collections.subjects);
            
            subjectsGrid.innerHTML = subjects.map(subject => `
                <div class="subject-card">
                    <div class="subject-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="subject-name">${subject.name}</div>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteSubject('${subject.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    }

    showAddSubjectModal() {
        const modal = document.getElementById('modalContainer');
        
        modal.innerHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Subject</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <form id="addSubjectForm">
                        <div class="form-group">
                            <label>Subject Name</label>
                            <input type="text" name="name" placeholder="e.g., Mathematics" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Add Subject</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('addSubjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSubject(e.target);
        });
    }

    showUploadSubjectsModal() {
        const modal = document.getElementById('modalContainer');
        
        modal.innerHTML = `
            <div class="modal active excel-upload-modal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h3>Upload Subjects from Excel</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="excel-template">
                        <p><strong>Excel Format:</strong></p>
                        <p>Your Excel file should contain the following columns:</p>
                        <ul>
                            <li>Subject Name (required)</li>
                        </ul>
                        <a href="#" class="template-link" onclick="app.downloadSubjectTemplate(); return false;">
                            <i class="fas fa-download"></i> Download Template
                        </a>
                    </div>
                    <div class="upload-area" id="subjectUploadArea">
                        <div class="upload-icon">
                            <i class="fas fa-file-excel"></i>
                        </div>
                        <div class="upload-text">Drag and drop your Excel file here</div>
                        <div class="upload-hint">or click to browse</div>
                        <input type="file" id="subjectFileInput" accept=".xlsx,.xls" style="display: none;">
                    </div>
                    <button id="processSubjectBtn" class="btn btn-primary" style="display: none;">
                        <i class="fas fa-cog"></i> Process File
                    </button>
                </div>
            </div>
        `;

        this.setupFileUpload('subjectUploadArea', 'subjectFileInput', 'processSubjectBtn', (file) => {
            this.processSubjectExcel(file);
        });
    }

    downloadSubjectTemplate() {
        const templateData = [
            ['Subject Name']
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'subjects_template.xlsx');
    }

    async processSubjectExcel(file) {
        try {
            const data = await this.readExcelFile(file);
            const subjects = [];
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (row[0]) { // Subject name is required
                    const subject = {
                        name: row[0],
                        createdAt: new Date().toISOString()
                    };
                    subjects.push(subject);
                }
            }

            // Add subjects to Firebase
            for (const subject of subjects) {
                await firebaseHelper.add(collections.subjects, subject);
            }

            document.getElementById('modalContainer').innerHTML = '';
            this.loadSubjects();
            authManager.showNotification(`${subjects.length} subjects uploaded successfully!`, 'success');
        } catch (error) {
            console.error('Error processing Excel file:', error);
            authManager.showNotification('Error processing Excel file', 'error');
        }
    }

    async addSubject(form) {
        try {
            const formData = new FormData(form);
            
            const newSubject = {
                name: formData.get('name'),
                createdAt: new Date().toISOString()
            };

            await firebaseHelper.add(collections.subjects, newSubject);

            // Add activity
            await firebaseHelper.add(collections.activities, {
                icon: 'fa-book',
                text: `New subject added: ${newSubject.name}`,
                time: 'Just now',
                user: authManager.currentUser.name,
                createdAt: new Date().toISOString()
            });

            form.closest('.modal').remove();
            this.loadSubjects();
            authManager.showNotification('Subject added successfully!', 'success');
        } catch (error) {
            console.error('Error adding subject:', error);
            authManager.showNotification('Error adding subject', 'error');
        }
    }

    async deleteSubject(id) {
        if (!confirm('Are you sure you want to delete this subject?')) return;

        try {
            await firebaseHelper.delete(collections.subjects, id);
            this.loadSubjects();
            authManager.showNotification('Subject deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting subject:', error);
            authManager.showNotification('Error deleting subject', 'error');
        }
    }

    setupFileUpload(areaId, inputId, buttonId, callback) {
        const uploadArea = document.getElementById(areaId);
        const fileInput = document.getElementById(inputId);
        const processBtn = document.getElementById(buttonId);
        let selectedFile = null;

        // Click on upload area to open file dialog
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedFile = file;
                uploadArea.innerHTML = `
                    <div class="upload-icon">
                        <i class="fas fa-file-excel"></i>
                    </div>
                    <div class="upload-text">Selected: ${file.name}</div>
                    <div class="upload-hint">Click to select another file</div>
                `;
                processBtn.style.display = 'block';
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                selectedFile = file;
                uploadArea.innerHTML = `
                    <div class="upload-icon">
                        <i class="fas fa-file-excel"></i>
                    </div>
                    <div class="upload-text">Selected: ${file.name}</div>
                    <div class="upload-hint">Click to select another file</div>
                `;
                processBtn.style.display = 'block';
            }
        });

        // Process button
        processBtn.addEventListener('click', () => {
            if (selectedFile) {
                callback(selectedFile);
            }
        });
    }

    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
}

// Initialize App
const app = new App();
