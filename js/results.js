// Results Management Module
class ResultsManager {
    constructor() {
        this.init();
    }

    init() {
        // Event listeners
        document.getElementById('addResultBtn')?.addEventListener('click', () => this.showAddResultModal());
        document.getElementById('addPositionBtn')?.addEventListener('click', () => this.showAddPositionModal());
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
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No results found</td></tr>';
            return;
        }

        // Get student names
        const students = await firebaseHelper.getAll(collections.students);
        
        tbody.innerHTML = results.map(result => {
            const student = students.find(s => s.id === result.studentId);
            const positionBadge = result.position ? 
                `<span class="position-badge position-${result.position <= 3 ? result.position : 'other'}">${this.getPositionText(result.position)}</span>` 
                : '<span class="badge badge-warning">Not Set</span>';
            
            return `
                <tr>
                    <td>${student ? student.name : 'Unknown'}</td>
                    <td>${result.subject}</td>
                    <td>${result.score}</td>
                    <td><span class="badge badge-${this.getGradeClass(result.grade)}">${result.grade}</span></td>
                    <td>Term ${result.term}</td>
                    <td>${positionBadge}</td>
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

    getPositionText(position) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const v = position % 100;
        return position + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    }

    getGradeClass(grade) {
        if (grade.startsWith('A')) return 'success';
        if (grade.startsWith('B')) return 'info';
        if (grade.startsWith('C')) return 'warning';
        return 'danger';
    }

    async showAddResultModal() {
        try {
            const students = await firebaseHelper.getAll(collections.students);
            const subjects = await firebaseHelper.getAll(collections.subjects);
            
            const modal = document.getElementById('modalContainer');
            
            modal.innerHTML = `
                <div class="modal active">
                    <div class="modal-content large-modal">
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
                                <input type="number" name="score" min="0" max="100" required oninput="resultsManager.updateGradeDisplay(this.value)">
                            </div>
                            <div class="form-group">
                                <label>Grade</label>
                                <div class="grade-select" id="gradeSelect">
                                    <div class="grade-option" data-grade="A+" onclick="resultsManager.selectGrade('A+')">A+</div>
                                    <div class="grade-option" data-grade="A" onclick="resultsManager.selectGrade('A')">A</div>
                                    <div class="grade-option" data-grade="B" onclick="resultsManager.selectGrade('B')">B</div>
                                    <div class="grade-option" data-grade="C" onclick="resultsManager.selectGrade('C')">C</div>
                                    <div class="grade-option" data-grade="D" onclick="resultsManager.selectGrade('D')">D</div>
                                    <div class="grade-option" data-grade="F" onclick="resultsManager.selectGrade('F')">F</div>
                                </div>
                                <input type="hidden" name="grade" id="selectedGrade" required>
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

    updateGradeDisplay(score) {
        const grade = getGrade(parseInt(score));
        this.selectGrade(grade);
    }

    selectGrade(grade) {
        // Remove previous selection
        document.querySelectorAll('.grade-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selection to clicked grade
        document.querySelector(`[data-grade="${grade}"]`).classList.add('selected');
        document.getElementById('selectedGrade').value = grade;
    }

    async showAddPositionModal() {
        try {
            const classFilter = document.getElementById('classSelect').value;
            const termFilter = document.getElementById('termSelect').value;
            
            if (!classFilter || !termFilter) {
                authManager.showNotification('Please select class and term first', 'error');
                return;
            }

            const students = await firebaseHelper.query(collections.students, 'class', '==', classFilter);
            const results = await firebaseHelper.getAll(collections.results);
            
            // Filter results for this class and term
            const classResults = results.filter(r => {
                const student = students.find(s => s.id === r.studentId);
                return student && r.term == termFilter;
            });

            // Group by student and calculate average
            const studentAverages = {};
            classResults.forEach(result => {
                if (!studentAverages[result.studentId]) {
                    studentAverages[result.studentId] = { total: 0, count: 0, student: students.find(s => s.id === result.studentId) };
                }
                studentAverages[result.studentId].total += result.score;
                studentAverages[result.studentId].count++;
            });

            // Calculate averages and sort
            const sortedStudents = Object.entries(studentAverages)
                .map(([id, data]) => ({
                    id,
                    ...data.student,
                    average: Math.round(data.total / data.count)
                }))
                .sort((a, b) => b.average - a.average);

            const modal = document.getElementById('modalContainer');
            
            modal.innerHTML = `
                <div class="modal active">
                    <div class="modal-content large-modal">
                        <div class="modal-header">
                            <h3>Set Student Positions - ${classFilter} (Term ${termFilter})</h3>
                            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                        </div>
                        <form id="addPositionForm">
                            <div class="positions-table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Average Score</th>
                                            <th>Position</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${sortedStudents.map((student, index) => `
                                            <tr>
                                                <td>${student.name}</td>
                                                <td>${student.average}%</td>
                                                <td>
                                                    <input type="number" name="position_${student.id}" 
                                                           value="${index + 1}" min="1" max="${sortedStudents.length}" 
                                                           class="form-control" style="width: 80px;">
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            <div class="form-group">
                                <input type="hidden" name="class" value="${classFilter}">
                                <input type="hidden" name="term" value="${termFilter}">
                            </div>
                            <button type="submit" class="btn btn-primary">Save Positions</button>
                        </form>
                    </div>
                </div>
            `;

            document.getElementById('addPositionForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePositions(e.target, sortedStudents);
            });
        } catch (error) {
            console.error('Error showing add position modal:', error);
        }
    }

    async savePositions(form, students) {
        try {
            const formData = new FormData(form);
            const classFilter = formData.get('class');
            const termFilter = formData.get('term');

            // Update positions for all results of these students in this class and term
            for (const student of students) {
                const position = parseInt(formData.get(`position_${student.id}`));
                
                // Get all results for this student in this class and term
                const studentResults = await firebaseHelper.getAll(collections.results);
                const resultsToUpdate = studentResults.filter(r => 
                    r.studentId === student.id && r.term == termFilter
                );

                // Update each result with the position
                for (const result of resultsToUpdate) {
                    await firebaseHelper.update(collections.results, result.id, {
                        ...result,
                        position: position
                    });
                }
            }

            // Add activity
            await firebaseHelper.add(collections.activities, {
                icon: 'fa-trophy',
                text: `Positions updated for ${classFilter} - Term ${termFilter}`,
                time: 'Just now',
                user: authManager.currentUser.name,
                createdAt: new Date().toISOString()
            });

            form.closest('.modal').remove();
            this.loadResults();
            authManager.showNotification('Positions saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving positions:', error);
            authManager.showNotification('Error saving positions', 'error');
        }
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
                                                    <th>Position</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${resultsByTerm[term].map(result => `
                                                    <tr>
                                                        <td>${result.subject}</td>
                                                        <td>${result.score}</td>
                                                        <td><span class="badge badge-${this.getGradeClass(result.grade)}">${result.grade}</span></td>
                                                        <td>${result.position ? this.getPositionText(result.position) : 'Not Set'}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                        <div class="term-summary">
                                            <p><strong>Average Score:</strong> ${this.calculateAverage(resultsByTerm[term])}%</p>
                                            <p><strong>Total Subjects:</strong> ${resultsByTerm[term].length}</p>
                                            <p><strong>Position:</strong> ${resultsByTerm[term][0]?.position ? this.getPositionText(resultsByTerm[term][0].position) : 'Not Set'}</p>
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
                    result.grade,
                    result.position ? this.getPositionText(result.position) : 'N/A'
                ]);
                
                doc.autoTable({
                    head: [['Subject', 'Score', 'Grade', 'Position']],
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
                doc.text(`Position: ${resultsByTerm[term][0]?.position ? this.getPositionText(resultsByTerm[term][0].position) : 'Not Set'}`, 20, yPosition + 14);
                
                yPosition += 25;
                
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

    async addResult(form) {
        try {
            const formData = new FormData(form);
            
            const newResult = {
                studentId: formData.get('studentId'),
                subject: formData.get('subject'),
                score: parseInt(formData.get('score')),
                grade: formData.get('grade'),
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
                            <div class="form-group">
                                <label>Grade</label>
                                <div class="grade-select" id="gradeSelect">
                                    <div class="grade-option ${result.grade === 'A+' ? 'selected' : ''}" data-grade="A+" onclick="resultsManager.selectGrade('A+')">A+</div>
                                    <div class="grade-option ${result.grade === 'A' ? 'selected' : ''}" data-grade="A" onclick="resultsManager.selectGrade('A')">A</div>
                                    <div class="grade-option ${result.grade === 'B' ? 'selected' : ''}" data-grade="B" onclick="resultsManager.selectGrade('B')">B</div>
                                    <div class="grade-option ${result.grade === 'C' ? 'selected' : ''}" data-grade="C" onclick="resultsManager.selectGrade('C')">C</div>
                                    <div class="grade-option ${result.grade === 'D' ? 'selected' : ''}" data-grade="D" onclick="resultsManager.selectGrade('D')">D</div>
                                    <div class="grade-option ${result.grade === 'F' ? 'selected' : ''}" data-grade="F" onclick="resultsManager.selectGrade('F')">F</div>
                                </div>
                                <input type="hidden" name="grade" id="selectedGrade" value="${result.grade}" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Update Result</button>
                        </form>
                    </div>
                </div>
            `;

            document.getElementById('editResultForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedResult = {
                    ...result,
                    score: parseInt(formData.get('score')),
                    grade: formData.get('grade')
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
