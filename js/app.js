// Main Application Controller
class App {
    constructor() {
        this.init();
    }

    init() {
        console.log('Initializing app...');
        // Initialize navigation first
        this.setupNavigation();
        
        // Then initialize other components
        this.setupTeacherManagement();
        this.setupParentManagement();
        this.setupClassSubjectsManagement();
        this.setupStudentsManagement();
        this.setupClassesManagement();
        this.setupSubjectsManagement();
        this.setupSearchButtons();
        
        // Make app globally accessible
        window.app = this;
    }

    setupNavigation() {
        console.log('Setting up navigation...');
        
        // Get all menu items
        const menuItems = document.querySelectorAll('.menu-item');
        console.log('Found menu items:', menuItems.length);
        
        // Add click event listeners to all menu items
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Menu item clicked:', item.dataset.section);
                this.handleMenuClick(e);
            });
        });
    }

    handleMenuClick(e) {
        const menuItem = e.currentTarget;
        const section = menuItem.dataset.section;
        
        console.log('Navigating to section:', section);
        
        if (!section) {
            console.error('No section found on menu item');
            return;
        }
        
        // Update active menu
        document.querySelectorAll('.menu-item').forEach(mi => {
            mi.classList.remove('active');
        });
        menuItem.classList.add('active');
        
        // Show the section
        this.showSection(section);
        
        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('active');
        }
    }

    showSection(sectionId) {
        console.log('Showing section:', sectionId);
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log('Section found and activated:', sectionId);
        } else {
            console.error('Section not found:', sectionId);
        }

        // Load section-specific data
        try {
            switch(sectionId) {
                case 'results':
                    if (typeof resultsManager !== 'undefined') {
                        resultsManager.loadResults();
                    }
                    break;
                case 'studentResults':
                    this.loadStudentResultsForParents();
                    break;
                case 'behavior':
                    if (typeof behaviorManager !== 'undefined') {
                        behaviorManager.loadBehaviorRecords();
                    }
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
                    if (typeof authManager !== 'undefined') {
                        authManager.loadDashboardData();
                    }
                    break;
            }
        } catch (error) {
            console.error('Error loading section data:', error);
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
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Error searching students', 'error');
            }
        }
    }

    async searchBehaviorStudents() {
        try {
            const searchTerm = document.getElementById('studentSearch').value.trim();
            if (!searchTerm) {
                if (typeof behaviorManager !== 'undefined') {
                    behaviorManager.loadStudents();
                }
                return;
            }

            const students = await firebaseHelper.getAll(collections.students);
            const filteredStudents = students.filter(student => 
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.class.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (typeof behaviorManager !== 'undefined') {
                behaviorManager.updateStudentSelect(filteredStudents);
            }
        } catch (error) {
            console.error('Error searching behavior students:', error);
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Error searching students', 'error');
            }
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
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Teacher added successfully!', 'success');
            }
        } catch (error) {
            console.error('Error adding teacher:', error);
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Error adding teacher: ' + error.message, 'error');
            }
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
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Parent added successfully!', 'success');
            }
        } catch (error) {
            console.error('Error adding parent:', error);
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Error adding parent: ' + error.message, 'error');
            }
        }
    }

    showAssignSubjectsModal() {
        const modal = document.getElementById('modalContainer');
        const classSelect = document.getElementById('classSelectForSubjects');
        const selectedClass = classSelect.value;
        
        if (!selectedClass) {
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Please select a class first', 'error');
            }
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
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Subjects assigned successfully!', 'success');
            }
        } catch (error) {
            console.error('Error assigning subjects:', error);
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Error assigning subjects', 'error');
            }
        }
    }

    async loadClassesIntoSelect(selector) {
        try {
            const classes = await firebaseHelper.getAll(collections.classes);
            const select = document.querySelector(selector);
            if (select) {
                select.innerHTML = classes.map(cls => `
                    <option value="${cls.name}">${cls.name}</option>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading classes:', error);
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

    async getStudentsCount(className) {
        try {
            const students = await firebaseHelper.query(collections.students, 'class', '==', className);
            return students.length;
        } catch (error) {
            return 0;
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

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    window.app = new App();
});
