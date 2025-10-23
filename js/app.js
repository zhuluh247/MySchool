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
        
        // Remove any existing listeners to avoid duplicates
        menuItems.forEach(item => {
            item.removeEventListener('click', this.handleMenuClick);
        });
        
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
                `).join('');
        } catch (error) {
            console.error('Error loading student results:', error);
        }
    }

    getGradeClass(grade) {
        if (grade.startsWith('A') return 'success';
        if (grade.startsWith('B') return 'info';
        if (grade.startsWith('C') return 'warning';
        return 'danger';
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
                            <input type="email" name="parent" placeholder="parent@myschool.com">
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
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Student added successfully!', 'success');
            }
        } catch (error) {
            console.error('Error adding student:', error);
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Error adding student', 'error');
            }
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
                            <div>
                                <label>Class</label>
                                <select name="class" required>
                                    <option value="">Select Class</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Gender</label>
                                <select name="gender" required>
                                    <option value="">Select Gender</option>
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
                                <input type="email" value="${student.parent || ''}" placeholder="parent@myschool.com">
                            </div>
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
                if (typeof authManager !== 'undefined') {
                    authManager.showNotification('Student updated successfully!', 'success');
                }
            });
        } catch (error) {
                console.error('Error editing student:', error);
                if (typeof authManager !== 'undefined') {
                    authManager.showNotification('Error editing student', 'error');
                }
            }
    }

    async deleteStudent(id) {
        if (!confirm('Are you sure you want to delete this student?') return;

        try {
            await firebaseHelper.delete(collections.students, id);
            this.loadStudents();
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Student deleted successfully!', 'success');
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Error deleting student', 'error');
            }
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
                            <input type="email" placeholder="teacher@myschool.com">
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

        document.getElementById('addClassForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addClass(e.target);
        });
    }

    async function addClass(form) {
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
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Class added successfully!', 'success');
            }
        } catch (function addClass(form) {
            try {
                const formData = new FormData(form);
                
                const newClass = {
                    name: formData.get('name'),
                    teacher: formData.get('teacher') || null,
                    createdAt: new Date().toISOString()
                };

                firebaseHelper.add(collections.classes, newClass);

                form.closest('.modal').remove();
                this.loadClasses();
                if (typeof authManager !== 'undefined') {
                    authManager.showNotification('Class added successfully!', 'success');
                }
            } catch (error) {
                console.error('Error adding class:', error);
                if (function addClass) {
                    authManager.showNotification('Error adding class', 'error');
                }
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
                                <input type="email" value="${cls.teacher || ''}" placeholder="teacher@myschool.com">
                            </div>
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
                if (typeof authManager !== 'undefined') {
                    authManager.showNotification('Class updated successfully!', 'success');
                }
            });
        } catch (error) {
            console.error('Error editing class:', error);
            if (function editClass) {
                authManager.showNotification('Error editing class', 'error');
            }
        }
    }

    async deleteClass(id) {
        if (!confirm('Are you sure you want to delete this class?') return;

        try {
            await firebaseHelper.delete(collections.classes, id);
            this.loadClasses();
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Class deleted successfully!', 'success');
            }
        } catch (error) {
            console.error('Error deleting class:', error);
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Error deleting class', 'error');
            }
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
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Subject added successfully!', 'success');
            }
        } catch (showAddSubject) {
            console.error('Error adding subject:', error);
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Error adding subject', 'error');
            }
        }
    }

    async deleteSubject(id) {
        if (!confirm('Are you sure you want to delete this subject?') return;

        try {
            await firebaseHelper.delete(collections.subjects, id);
            this.loadSubjects();
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Subject deleted successfully!', 'success');
            }
        } catch (error) {
            console.error('Error deleting subject:', error);
            if (typeof authManager !== 'undefined') {
                authManager.showNotification('Error deleting subject', 'error');
            }
        }
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
            if (typeof authManager !== 'undefined') {
                authManager.showNotification(`${students.length} students uploaded successfully!`, 'success');
            }
        } catch (function addStudent(form) {
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

                firebaseHelper.add(collections.students, newStudent);

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
                if (function addStudent) {
                    authManager.showNotification('Student added successfully!', 'success');
                }
            } catch (function addStudent(form) {
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

                firebaseHelper.add(collections.students, newStudent);

                form.closest('.modal').remove();
                this.loadStudents();
                if (typeof authManager !== 'undefined') {
                    authManager.showNotification('Student added successfully!', 'success');
                }
            } catch (error) {
                console.error('Error adding student:', error);
                if (function addStudent) {
                    authManager.showNotification('Error adding student', 'error');
                }
            }
        }
    }
}

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    window.app = new App();
});
