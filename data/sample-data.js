// Sample data for initialization
const sampleData = {
    users: [
        { 
            name: 'Admin User', 
            email: 'admin@myschool.com', 
            password: 'admin123', 
            role: 'proprietor', 
            status: 'active',
            createdAt: new Date().toISOString()
        },
        { 
            name: 'John Teacher', 
            email: 'teacher@myschool.com', 
            password: 'teach123', 
            role: 'teacher', 
            status: 'active',
            createdAt: new Date().toISOString()
        },
        { 
            name: 'Jane Parent', 
            email: 'parent@myschool.com', 
            password: 'parent123', 
            role: 'parent', 
            status: 'active',
            children: ['student1', 'student2'],
            createdAt: new Date().toISOString()
        }
    ],
    
    students: [
        { 
            id: 'student1',
            name: 'Alice Johnson', 
            class: 'JSS 1A', 
            parent: 'parent@myschool.com',
            admissionNumber: '2024001',
            dateOfBirth: '2010-05-15',
            gender: 'Female'
        },
        { 
            id: 'student2',
            name: 'Bob Smith', 
            class: 'JSS 1A', 
            parent: 'parent@myschool.com',
            admissionNumber: '2024002',
            dateOfBirth: '2010-08-20',
            gender: 'Male'
        },
        { 
            id: 'student3',
            name: 'Charlie Brown', 
            class: 'JSS 1B', 
            parent: 'admin@myschool.com',
            admissionNumber: '2024003',
            dateOfBirth: '2010-03-10',
            gender: 'Male'
        },
        { 
            id: 'student4',
            name: 'Diana Prince', 
            class: 'JSS 2A', 
            parent: 'teacher@myschool.com',
            admissionNumber: '2023001',
            dateOfBirth: '2009-12-05',
            gender: 'Female'
        },
        { 
            id: 'student5',
            name: 'Ethan Hunt', 
            class: 'JSS 2B', 
            parent: 'teacher@myschool.com',
            admissionNumber: '2023002',
            dateOfBirth: '2009-07-18',
            gender: 'Male'
        }
    ],
    
    classes: [
        { name: 'JSS 1A', teacher: 'teacher@myschool.com' },
        { name: 'JSS 1B', teacher: 'teacher@myschool.com' },
        { name: 'JSS 2A', teacher: 'teacher@myschool.com' },
        { name: 'JSS 2B', teacher: 'teacher@myschool.com' },
        { name: 'SSS 1A', teacher: 'teacher@myschool.com' },
        { name: 'SSS 1B', teacher: 'teacher@myschool.com' }
    ],
    
    subjects: [
        'Mathematics', 
        'English Language', 
        'Basic Science', 
        'Social Studies', 
        'Computer Science', 
        'Physical Education',
        'Home Economics',
        'Agricultural Science',
        'Business Studies',
        'Fine Art'
    ],
    
    results: [
        { 
            studentId: 'student1', 
            subject: 'Mathematics', 
            score: 85, 
            grade: 'A', 
            term: 1, 
            session: '2023/2024',
            teacher: 'teacher@myschool.com',
            createdAt: new Date().toISOString()
        },
        { 
            studentId: 'student1', 
            subject: 'English Language', 
            score: 78, 
            grade: 'B', 
            term: 1, 
            session: '2023/2024',
            teacher: 'teacher@myschool.com',
            createdAt: new Date().toISOString()
        },
        { 
            studentId: 'student2', 
            subject: 'Mathematics', 
            score: 92, 
            grade: 'A', 
            term: 1, 
            session: '2023/2024',
            teacher: 'teacher@myschool.com',
            createdAt: new Date().toISOString()
        },
        { 
            studentId: 'student2', 
            subject: 'Basic Science', 
            score: 88, 
            grade: 'A', 
            term: 1, 
            session: '2023/2024',
            teacher: 'teacher@myschool.com',
            createdAt: new Date().toISOString()
        }
    ],
    
    documents: [
        { 
            name: 'Term 1 Report Card.pdf', 
            type: 'pdf', 
            uploadedBy: 'teacher@myschool.com', 
            date: new Date().toISOString().split('T')[0], 
            studentId: 'student1',
            url: '#'
        },
        { 
            name: 'Student ID Card.jpg', 
            type: 'image', 
            uploadedBy: 'admin@myschool.com', 
            date: new Date().toISOString().split('T')[0], 
            studentId: 'student1',
            url: '#'
        },
        { 
            name: 'Medical Form.pdf', 
            type: 'pdf', 
            uploadedBy: 'parent@myschool.com', 
            date: new Date().toISOString().split('T')[0], 
            studentId: 'student2',
            url: '#'
        }
    ],
    
    behavior: [
        { 
            studentId: 'student1', 
            type: 'positive', 
            description: 'Excellent participation in class', 
            date: new Date().toISOString().split('T')[0], 
            recordedBy: 'teacher@myschool.com',
            createdAt: new Date().toISOString()
        },
        { 
            studentId: 'student2', 
            type: 'positive', 
            description: 'Helped classmates with assignment', 
            date: new Date().toISOString().split('T')[0], 
            recordedBy: 'teacher@myschool.com',
            createdAt: new Date().toISOString()
        },
        { 
            studentId: 'student3', 
            type: 'negative', 
            description: 'Late to class', 
            date: new Date().toISOString().split('T')[0], 
            recordedBy: 'teacher@myschool.com',
            createdAt: new Date().toISOString()
        }
    ],
    
    activities: [
        { 
            icon: 'fa-upload', 
            text: 'New results uploaded for JSS 1A', 
            time: '2 hours ago', 
            user: 'John Teacher',
            createdAt: new Date().toISOString()
        },
        { 
            icon: 'fa-file', 
            text: 'Document uploaded: Term 1 Report Card', 
            time: '5 hours ago', 
            user: 'Admin User',
            createdAt: new Date().toISOString()
        },
        { 
            icon: 'fa-user-check', 
            text: 'Behavior record added for Alice Johnson', 
            time: '1 day ago', 
            user: 'John Teacher',
            createdAt: new Date().toISOString()
        }
    ]
};

// Initialize Firebase with sample data
async function initializeFirebaseData() {
    try {
        // Check if data already exists
        const usersCount = await firebaseHelper.getAll(collections.users);
        
        if (usersCount.length === 0) {
            // Add sample data
            for (const user of sampleData.users) {
                await firebaseHelper.add(collections.users, user);
            }
            
            for (const student of sampleData.students) {
                await firebaseHelper.add(collections.students, student);
            }
            
            for (const cls of sampleData.classes) {
                await firebaseHelper.add(collections.classes, cls);
            }
            
            for (const subject of sampleData.subjects) {
                await firebaseHelper.add(collections.subjects, { name: subject });
            }
            
            for (const result of sampleData.results) {
                await firebaseHelper.add(collections.results, result);
            }
            
            for (const document of sampleData.documents) {
                await firebaseHelper.add(collections.documents, document);
            }
            
            for (const behavior of sampleData.behavior) {
                await firebaseHelper.add(collections.behavior, behavior);
            }
            
            for (const activity of sampleData.activities) {
                await firebaseHelper.add(collections.activities, activity);
            }
            
            console.log('Sample data initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

// Helper function to get grade from score
function getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

// Initialize data when page loads
window.addEventListener('DOMContentLoaded', initializeFirebaseData);
