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
            subjects: ['Mathematics', 'English Language'],
            createdAt: new Date().toISOString()
        },
        { 
            name: 'Jane Parent', 
            email: 'parent@myschool.com', 
            password: 'parent123', 
            role: 'parent', 
            status: 'active',
            children: ['2024001', '2024002'],
            createdAt: new Date().toISOString()
        }
    ],
    
    students: [
        { 
            id: 'student1',
            admissionNumber: '2024001',
            name: 'Alice Johnson', 
            class: 'JSS 1A', 
            parent: 'parent@myschool.com',
            dateOfBirth: '2010-05-15',
            gender: 'Female',
            createdAt: new Date().toISOString()
        },
        { 
            id: 'student2',
            admissionNumber: '2024002',
            name: 'Bob Smith', 
            class: 'JSS 1A', 
            parent: 'parent@myschool.com',
            dateOfBirth: '2010-08-20',
            gender: 'Male',
            createdAt: new Date().toISOString()
        },
        { 
            id: 'student3',
            admissionNumber: '2024003',
            name: 'Charlie Brown', 
            class: 'JSS 1B', 
            parent: 'admin@myschool.com',
            dateOfBirth: '2010-03-10',
            gender: 'Male',
            createdAt: new Date().toISOString()
        },
        { 
            id: 'student4',
            admissionNumber: '2023001',
            name: 'Diana Prince', 
            class: 'JSS 2A', 
            parent: 'teacher@myschool.com',
            dateOfBirth: '2009-12-05',
            gender: 'Female',
            createdAt: new Date().toISOString()
        },
        { 
            id: 'student5',
            admissionNumber: '2023002',
            name: 'Ethan Hunt', 
            class: 'JSS 2B', 
            parent: 'teacher@myschool.com',
            dateOfBirth: '2009-07-18',
            gender: 'Male',
            createdAt: new Date().toISOString()
        }
    ],
    
    classes: [
        { name: 'JSS 1A', teacher: 'teacher@myschool.com' },
        { name: 'JSS 1B', teacher: 'teacher@myschool.com' },
        { name: 'JSS 2A', teacher: 'teacher@myschool.com' },
        { name: 'JSS 2B', teacher: 'teacher@myschool.com' },
        { name: 'SSS 1A', teacher: null },
        { name: 'SSS 1B', teacher: null }
    ],
    
    subjects: [
        { name: 'Mathematics' },
        { name: 'English Language' },
        { name: 'Basic Science' },
        { name: 'Social Studies' },
        { name: 'Computer Science' },
        { name: 'Physical Education' },
        { name: 'Home Economics' },
        { name: 'Agricultural Science' },
        { name: 'Business Studies' },
        { name: 'Fine Art' }
    ],
    
    results: [
        { 
            studentId: 'student1', 
            subject: 'Mathematics', 
            score: 85, 
            grade: 'A', 
            term: 1, 
            session: '2023/2024',
            position: 2,
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
            position: 3,
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
            position: 1,
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
            position: 1,
            teacher: 'teacher@myschool.com',
            createdAt: new Date().toISOString()
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
            icon: 'fa-user-graduate', 
            text: 'New student registered: Alice Johnson', 
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
                await firebaseHelper.add(collections.subjects, subject);
            }
            
            for (const result of sampleData.results) {
                await firebaseHelper.add(collections.results, result);
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
