// Document Management Module
class DocumentManager {
    constructor() {
        this.init();
    }

    init() {
        document.getElementById('uploadDocBtn')?.addEventListener('click', () => {
            document.getElementById('documentUpload').click();
        });

        document.getElementById('documentUpload')?.addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        this.loadDocuments();
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Show loading
            this.showLoadingIndicator(true);
            
            // Create a unique filename
            const filename = `${Date.now()}_${file.name}`;
            const path = `documents/${filename}`;
            
            // Upload file to Firebase Storage
            const downloadURL = await firebaseHelper.uploadFile(file, path);
            
            // Get selected student
            const studentId = await this.getSelectedStudentId();
            
            // Save document metadata to Firestore
            const newDocument = {
                name: file.name,
                type: this.getFileType(file.name),
                uploadedBy: authManager.currentUser.email,
                date: new Date().toISOString().split('T')[0],
                studentId: studentId,
                url: downloadURL,
                path: path,
                createdAt: new Date().toISOString()
            };

            await firebaseHelper.add(collections.documents, newDocument);

            // Add activity
            await firebaseHelper.add(collections.activities, {
                icon: 'fa-file',
                text: `Document uploaded: ${file.name}`,
                time: 'Just now',
                user: authManager.currentUser.name,
                createdAt: new Date().toISOString()
            });

            this.loadDocuments();
            authManager.showNotification('Document uploaded successfully!', 'success');
            event.target.value = '';
        } catch (error) {
            console.error('Upload error:', error);
            authManager.showNotification('Failed to upload document. Please try again.', 'error');
        } finally {
            this.showLoadingIndicator(false);
        }
    }

    async getSelectedStudentId() {
        // For teachers and proprietor, they might select a student
        // For parents, use their first child
        if (authManager.currentUser.role === 'parent') {
            const students = await firebaseHelper.query(collections.students, 'parent', '==', authManager.currentUser.email);
            return students.length > 0 ? students[0].id : null;
        }
        
        // For demo, return first student
        const allStudents = await firebaseHelper.getAll(collections.students);
        return allStudents.length > 0 ? allStudents[0].id : null;
    }

    async loadDocuments() {
        try {
            let documents = await firebaseHelper.getAll(collections.documents);
            
            // Parents can only see their children's documents
            if (authManager.currentUser.role === 'parent') {
                const students = await firebaseHelper.query(collections.students, 'parent', '==', authManager.currentUser.email);
                const studentIds = students.map(s => s.id);
                documents = documents.filter(doc => studentIds.includes(doc.studentId));
            }

            this.displayDocuments(documents);
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    }

    async displayDocuments(documents) {
        const documentsList = document.getElementById('documentsList');
        
        if (documents.length === 0) {
            documentsList.innerHTML = '<p class="text-center">No documents found</p>';
            return;
        }

        // Get student names
        const students = await firebaseHelper.getAll(collections.students);
        
        documentsList.innerHTML = documents.map(doc => {
            const student = students.find(s => s.id === doc.studentId);
            
            return `
                <div class="document-card">
                    <div class="document-icon">
                        <i class="fas ${this.getFileIcon(doc.type)}"></i>
                    </div>
                    <div class="document-title">${doc.name}</div>
                    <div class="document-meta">
                        <p>Student: ${student ? student.name : 'Unknown'}</p>
                        <p>Uploaded by: ${doc.uploadedBy}</p>
                        <p>Date: ${doc.date}</p>
                    </div>
                    <div class="document-actions">
                        <button class="btn btn-sm btn-primary" onclick="documentManager.viewDocument('${doc.url}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-success" onclick="documentManager.downloadDocument('${doc.url}', '${doc.name}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                        ${authManager.currentUser.role !== 'parent' ? `
                            <button class="btn btn-sm btn-danger" onclick="documentManager.deleteDocument('${doc.id}', '${doc.path}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) return 'pdf';
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
        if (['doc', 'docx'].includes(ext)) return 'document';
        return 'file';
    }

    getFileIcon(type) {
        const icons = {
            'pdf': 'fa-file-pdf',
            'image': 'fa-file-image',
            'document': 'fa-file-word',
            'file': 'fa-file'
        };
        return icons[type] || icons.file;
    }

    viewDocument(url) {
        // Open document in a new tab
        window.open(url, '_blank');
    }

    downloadDocument(url, filename) {
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async deleteDocument(id, path) {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            // Delete file from Firebase Storage
            await firebaseHelper.deleteFile(path);
            
            // Delete document metadata from Firestore
            await firebaseHelper.delete(collections.documents, id);
            
            this.loadDocuments();
            authManager.showNotification('Document deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting document:', error);
            authManager.showNotification('Error deleting document', 'error');
        }
    }

    showLoadingIndicator(show) {
        let indicator = document.getElementById('uploadIndicator');
        
        if (show) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'uploadIndicator';
                indicator.className = 'upload-indicator';
                indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                document.querySelector('.document-controls').appendChild(indicator);
            }
        } else if (indicator) {
            indicator.remove();
        }
    }
}

// Initialize Document Manager
const documentManager = new DocumentManager();
