// Results Management Module
class ResultsManager {
    constructor() {
        this.init();
    }

    init() {
        // Event listeners
        document.getElementById('addResultBtn')?.addEventListener('click', () => this.showAddResultModal());
        document.getElementById('classSelect')?.addEventListener('change', () => this.loadResults());
        document.getElementById('termSelect')?.addEventListener('change', () => this.loadResults());

        // Initialize selects
        this.loadClasses();
    }

    async loadClasses() {
        try {
            const classes = await firebaseHelper.getAll(collections.classes);
            const classSelect = document.getElementById('classSelect');
            
            classSelect.innerHTML = '<option value="">Select Class</option>' + 
                classes.map(cls => `<option value="${cls.name}">${cls.name}</option>`).join('');
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    }

    async loadResults() {
        try {
            const classFilter = document.getElementById('classSelect').value;
            const termFilter = document.getElementById('termSelect').value;
            
            let results = await firebaseHelper.getAll(collections.results);
            
            if (classFilter) {
                const students = await firebaseHelper.query(collections.students, 'class', '==', classFilter);
                const studentIds = students.map(s => s.id);
                results = results.filter(r => studentIds.includes(r.studentId));
            }
            
            if (termFilter) {
                results = results.filter(r => r.term == termFilter);
            }

            this.displayResults(results);
        } catch (error) {
            console.error('Error loading results:', error);
        }
    }

    async displayResults(results) {
        const tbody = document.querySelector('#resultsTable tbody');
        
        if (results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No results found</td></tr>';
            return;
        }

        // Get student names
        const students = await firebaseHelper.getAll(collections.students);
        
        tbody.innerHTML = results.map(result => {
            const student = students.find(s => s.id === result.studentId);
            return `
                <tr>
                    <td>${student ? student.name : 'Unknown'}</td>
                    <td>${result.subject}</td>
                    <td>${result.score}</td>
                    <td><span class="badge badge-${this.getGradeClass(result.grade)}">${result.grade}</span></td>
                    <td>Term ${result.term}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="resultsManager.viewStudentResults('${result.studentId}')">
                            <i class="fas fa-eye"></i> All
                        </button>
                        <button class="btn btn-sm btn-success" onclick="resultsManager.downloadStudentResults('${result.studentId}')">
                            <i class="fas fa-download"></i> PDF
                        </button>
                        ${authManager.currentUser.role !== 'parent' ? `
                            <button class="btn btn-sm btn-warning" onclick="resultsManager.editResult('${result.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="resultsManager.deleteResult('${result.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    getGradeClass(grade) {
        if (grade.startsWith('A')) return 'success';
        if (grade.startsWith('B')) return 'info';
        if (grade.startsWith('C')) return 'warning';
        return 'danger';
    }

    async viewStudentResults(studentId) {
        try {
            const student = await firebaseHelper.get(collections.students, studentId);
            const allResults = await firebaseHelper.query(collections.results, 'studentId', '==', studentId);
            
            const modal = document.getElementById('modalContainer');
            
            // Group results by term
            const resultsByTerm = {};
            allResults.forEach(result => {
                if (!resultsByTerm[result.term]) {
                    resultsByTerm[result.term] = [];
                }
                resultsByTerm[result.term].push(result);
            });
            
            let modalContent = `
                <div class="modal active">
                    <div class="modal-content large-modal">
                        <div class="modal-header">
                            <h3>Results for ${student.name} (${student.class})</h3>
                            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                        </div>
                        <div class="student-results-tabs">
                            <div class="tab-buttons">
                                ${Object.keys(resultsByTerm).sort().map(term => `
                                    <button class="tab-btn ${term === '1' ? 'active' : ''}" onclick="resultsManager.showTermTab(${term})">
                                        Term ${term}
                                    </button>
                                `).join('')}
                            </div>
                            <div class="tab-content">
                                ${Object.keys(resultsByTerm).sort().map(term => `
                                    <div class="tab-pane ${term === '1' ? 'active' : ''}" id="term-${term}">
                                        <table class="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th>Score</th>
                                                    <th>Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${resultsByTerm[term].map(result => `
                                                    <tr>
                                                        <td>${result.subject}</td>
                                                        <td>${result.score}</td>
                                                        <td><span class="badge badge-${this.getGradeClass(result.grade)}">${result.grade}</span></td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                        <div class="term-summary">
                                            <p><strong>Average Score:</strong> ${this.calculateAverage(resultsByTerm[term])}%</p>
                                            <p><strong>Total Subjects:</strong> ${resultsByTerm[term].length}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" onclick="resultsManager.downloadStudentResults('${studentId}')">
                                <i class="fas fa-download"></i> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            modal.innerHTML = modalContent;
        } catch (error) {
            console.error('Error viewing student results:', error);
            authManager.showNotification('Error loading results', 'error');
        }
    }

    showTermTab(term) {
        // Hide all tabs
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`term-${term}`).classList.add('active');
        
        // Add active class to clicked button
        event.target.classList.add('active');
    }

    calculateAverage(results) {
        if (results.length === 0) return 0;
        const sum = results.reduce((total, result) => total + result.score, 0);
        return Math.round(sum / results.length);
    }

    async downloadStudentResults(studentId) {
        try {
            const student = await firebaseHelper.get(collections.students, studentId);
            const allResults = await firebaseHelper.query(collections.results, 'studentId', '==', studentId);
            
            // Group results by term
            const resultsByTerm = {};
            allResults.forEach(result => {
                if (!resultsByTerm[result.term]) {
                    resultsByTerm[result.term] = [];
                }
                resultsByTerm[result.term].push(result);
            });
            
            // Generate PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(18);
            doc.text('MySchool - Student Result Report', 105, 15, { align: 'center' });
            
            // Add student info
            doc.setFontSize(12);
            doc.text(`Name: ${student.name}`, 20, 30);
            doc.text(`Class: ${student.class}`, 20, 37);
            doc.text(`Admission No: ${student.admissionNumber}`, 20, 44);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 51);
            
            let yPosition = 67;
            
            // Add results for each term
            Object.keys(resultsByTerm).sort().forEach(term => {
                doc.setFontSize(14);
                doc.text(`Term ${term}`, 20, yPosition);
                yPosition += 10;
                
                // Create table for this term
                const tableData = resultsByTerm[term].map(result => [
                    result.subject,
                    result.score.toString(),
                    result.grade
                ]);
                
                doc.autoTable({
                    head: [['Subject', 'Score', 'Grade']],
                    body: tableData,
                    startY: yPosition,
                    theme: 'grid',
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [79, 70, 229] }
                });
                
                yPosition = doc.lastAutoTable.finalY + 10;
                
                // Add term summary
                doc.setFontSize(11);
                doc.text(`Average Score: ${this.calculateAverage(resultsByTerm[term])}%`, 20, yPosition);
                doc.text(`Total Subjects: ${resultsByTerm[term].length}`, 20, yPosition + 7);
                
                yPosition += 20;
                
                // Add new page if needed
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
            });
            
            // Add overall summary
            doc.setFontSize(14);
            doc.text('Overall Summary', 20, yPosition);
            yPosition += 10;
            
            doc.setFontSize(11);
            doc.text(`Overall Average: ${this.calculateAverage(allResults)}%`, 20, yPosition);
            doc.text(`Total Subjects: ${allResults.length}`, 20, yPosition + 7);
            
            // Save the PDF
            doc.save(`${student.name}_Results.pdf`);
            
            authManager.showNotification('Results downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error downloading results:', error);
            authManager.showNotification('Error downloading results', 'error');
        }
    }

    async showAddResultModal() {
        try {
            const students = await firebaseHelper.getAll(collections.students);
            const subjects = await firebaseHelper.getAll(collections.subjects);
            
            const modal = document.getElementById('modalContainer');
            
            modal.innerHTML = `
                <div class="modal active">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Add Result</h3>
                            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                        </div>
                        <form id="addResultForm">
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
                                <label>Subject</label>
                                <select name="subject" required>
                                    <option value="">Select Subject</option>
                                    ${subjects.map(sub => `
                                        <option value="${sub.name}">${sub.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Score (0-100)</label>
                                <input type="number" name="score" min="0" max="100" required>
                            </div>
                            <div class="form-group">
                                <label>Term</label>
                                <select name="term" required>
                                    <option value="1">First Term</option>
                                    <option value="2">Second Term</option>
                                    <option value="3">Third Term</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Session</label>
                                <input type="text" name="session" value="2023/2024" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Add Result</button>
                        </form>
                    </div>
                </div>
            `;

            document.getElementById('addResultForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addResult(e.target);
            });
        } catch (error) {
            console.error('Error showing add result modal:', error);
        }
    }

    async addResult(form) {
        try {
            const formData = new FormData(form);
            
            const newResult = {
                studentId: formData.get('studentId'),
                subject: formData.get('subject'),
                score: parseInt(formData.get('score')),
                grade: getGrade(parseInt(formData.get('score'))),
                term: parseInt(formData.get('term')),
                session: formData.get('session'),
                teacher: authManager.currentUser.email,
                createdAt: new Date().toISOString()
            };

            // Save to Firebase
            await firebaseHelper.add(collections.results, newResult);

            // Add activity
            const student = await firebaseHelper.get(collections.students, newResult.studentId);
            await firebaseHelper.add(collections.activities, {
                icon: 'fa-upload',
                text: `New result added for ${student.name}`,
                time: 'Just now',
                user: authManager.currentUser.name,
                createdAt: new Date().toISOString()
            });

            form.closest('.modal').remove();
            this.loadResults();
            authManager.showNotification('Result added successfully!', 'success');
        } catch (error) {
            console.error('Error adding result:', error);
            authManager.showNotification('Error adding result', 'error');
        }
    }

    async editResult(id) {
        try {
            const result = await firebaseHelper.get(collections.results, id);
            
            if (!result) return;

            const modal = document.getElementById('modalContainer');
            modal.innerHTML = `
                <div class="modal active">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Edit Result</h3>
                            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                        </div>
                        <form id="editResultForm">
                            <div class="form-group">
                                <label>Score (0-100)</label>
                                <input type="number" name="score" min="0" max="100" value="${result.score}" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Update Result</button>
                        </form>
                    </div>
                </div>
            `;

            document.getElementById('editResultForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const newScore = parseInt(e.target.score.value);
                const updatedResult = {
                    ...result,
                    score: newScore,
                    grade: getGrade(newScore)
                };
                
                await firebaseHelper.update(collections.results, id, updatedResult);
                e.target.closest('.modal').remove();
                this.loadResults();
                authManager.showNotification('Result updated successfully!', 'success');
            });
        } catch (error) {
            console.error('Error editing result:', error);
            authManager.showNotification('Error editing result', 'error');
        }
    }

    async deleteResult(id) {
        if (!confirm('Are you sure you want to delete this result?')) return;

        try {
            await firebaseHelper.delete(collections.results, id);
            this.loadResults();
            authManager.showNotification('Result deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting result:', error);
            authManager.showNotification('Error deleting result', 'error');
        }
    }
}

// Initialize Results Manager
const resultsManager = new ResultsManager();
