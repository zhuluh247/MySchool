// Behavior Tracking Module
class BehaviorManager {
    constructor() {
        this.init();
    }

    init() {
        document.getElementById('addBehaviorBtn')?.addEventListener('click', () => this.showAddBehaviorModal());
        document.getElementById('studentSearch')?.addEventListener('input', (e) => this.filterStudents(e.target.value));
        document.getElementById('studentSelect')?.addEventListener('change', () => this.loadBehaviorRecords());
        
        this.loadStudents();
        this.loadBehaviorRecords();
    }

    async loadStudents() {
        try {
            const studentSelect = document.getElementById('studentSelect');
            let students = await firebaseHelper.getAll(collections.students);
            
            // Parents can only select their children
            if (authManager.currentUser.role === 'parent') {
                students = students.filter(s => s.parent === authManager.currentUser.email);
            }

            // Store all students for filtering
            this.allStudents = students;

            // Populate select
            this.updateStudentSelect(students);
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    updateStudentSelect(students) {
        const studentSelect = document.getElementById('studentSelect');
        studentSelect.innerHTML = '<option value="">Select Student</option>' + 
            students.map(s => `<option value="${s.id}">${s.name} - ${s.class}</option>`).join('');
    }

    filterStudents(searchTerm) {
        if (!searchTerm) {
            this.updateStudentSelect(this.allStudents);
            return;
        }

        const filtered = this.allStudents.filter(student => 
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.updateStudentSelect(filtered);
    }

    async loadBehaviorRecords() {
        try {
            const studentFilter = document.getElementById('studentSelect').value;
            let behaviorRecords = await firebaseHelper.getAll(collections.behavior);
            
            if (studentFilter) {
                behaviorRecords = behaviorRecords.filter(r => r.studentId === studentFilter);
            }

            // Parents can only see their children's records
            if (authManager.currentUser.role === 'parent') {
                const students = await firebaseHelper.query(collections.students, 'parent', '==', authManager.currentUser.email);
                const studentIds = students.map(s => s.id);
                behaviorRecords = behaviorRecords.filter(r => studentIds.includes(r.studentId));
            }

            this.displayBehaviorRecords(behaviorRecords);
        } catch (error) {
            console.error('Error loading behavior records:', error);
        }
    }

    async displayBehaviorRecords(records) {
        const behaviorList = document.getElementById('behaviorList');
        
        if (records.length === 0) {
            behaviorList.innerHTML = '<p class="text-center">No behavior records found</p>';
            return;
        }

        // Get student names
        const students = await firebaseHelper.getAll(collections.students);
        
        // Sort by date (most recent first)
        records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        behaviorList.innerHTML = records.map(record => {
            const student = students.find(s => s.id === record.studentId);
            
            return `
                <div class="behavior-item">
                    <div class="behavior-card">
                        <div class="behavior-header">
                            <span class="behavior-type ${record.type}">${record.type.toUpperCase()}</span>
                            <strong>${student ? student.name : 'Unknown'}</strong>
                        </div>
                        <p>${record.description}</p>
                        <div class="behavior-meta">
                            <small>Date: ${record.date}</small>
                            <small>Recorded by: ${record.recordedBy}</small>
                        </div>
                        <div class="behavior-actions">
                            ${authManager.currentUser.role === 'parent' || authManager.currentUser.role === 'proprietor' ? `
                                <button class="btn btn-sm btn-danger" onclick="behaviorManager.deleteBehavior('${record.id}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async showAddBehaviorModal() {
        try {
            let students = await firebaseHelper.getAll(collections.students);
            
            if (authManager.currentUser.role === 'parent') {
                students = students.filter(s => s.parent === authManager.currentUser.email);
            }

            const modal = document.getElementById('modalContainer');
            
            modal.innerHTML = `
                <div class="modal active">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Add Behavior Record</h3>
                            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                        </div>
                        <form id="addBehaviorForm">
                            <div class="form-group">
                                <label>Student</label>
                                <select name="studentId" required>
                                    <option value="">Select Student</option>
                                    ${students.map(s => `
                                        <option value="${s.id}">${s.name} - ${s.class}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Type</label>
                                <select name="type" required>
                                    <option value="">Select Type</option>
                                    <option value="positive">Positive</option>
                                    <option value="negative">Negative</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea name="description" rows="3" required></textarea>
                            </div>
                            <div class="form-group">
                                <label>Date</label>
                                <input type="date" name="date" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Add Record</button>
                        </form>
                    </div>
                </div>
            `;

            // Set today's date as default
            document.querySelector('input[name="date"]').valueAsDate = new Date();

            document.getElementById('addBehaviorForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addBehaviorRecord(e.target);
            });
        } catch (error) {
            console.error('Error showing add behavior modal:', error);
        }
    }

    async addBehaviorRecord(form) {
        try {
            const formData = new FormData(form);
            
            const newRecord = {
                studentId: formData.get('studentId'),
                type: formData.get('type'),
                description: formData.get('description'),
                date: formData.get('date'),
                recordedBy: authManager.currentUser.email,
                createdAt: new Date().toISOString()
            };

            // Save to Firebase
            await firebaseHelper.add(collections.behavior, newRecord);

            // Add activity
            const student = await firebaseHelper.get(collections.students, newRecord.studentId);
            await firebaseHelper.add(collections.activities, {
                icon: 'fa-user-check',
                text: `Behavior record added for ${student.name}`,
                time: 'Just now',
                user: authManager.currentUser.name,
                createdAt: new Date().toISOString()
            });

            form.closest('.modal').remove();
            this.loadBehaviorRecords();
            authManager.showNotification('Behavior record added successfully!', 'success');
        } catch (error) {
            console.error('Error adding behavior record:', error);
            authManager.showNotification('Error adding behavior record', 'error');
        }
    }

    async deleteBehavior(id) {
        if (!confirm('Are you sure you want to delete this behavior record?')) return;

        try {
            await firebaseHelper.delete(collections.behavior, id);
            this.loadBehaviorRecords();
            authManager.showNotification('Behavior record deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting behavior record:', error);
            authManager.showNotification('Error deleting behavior record', 'error');
        }
    }
}

// Initialize Behavior Manager
const behaviorManager = new BehaviorManager();
