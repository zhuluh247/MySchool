// Firebase Configuration Template
const firebaseConfig = {
    apiKey: "%%FIREBASE_API_KEY%%",
    authDomain: "%%FIREBASE_AUTH_DOMAIN%%",
    projectId: "%%FIREBASE_PROJECT_ID%%",
    storageBucket: "%%FIREBASE_STORAGE_BUCKET%%",
    messagingSenderId: "%%FIREBASE_MESSAGING_SENDER_ID%%",
    appId: "%%FIREBASE_APP_ID%%",
    measurementId: "%%FIREBASE_MEASUREMENT_ID%%"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.log('The current browser does not support persistence.');
        }
    });

// Collections
const collections = {
    users: 'users',
    students: 'students',
    results: 'results',
    documents: 'documents',
    behavior: 'behavior',
    activities: 'activities',
    classes: 'classes',
    subjects: 'subjects'
};

// Helper functions
const firebaseHelper = {
    // Get all documents from a collection
    async getAll(collectionName) {
        const snapshot = await db.collection(collectionName).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get a single document
    async get(collectionName, docId) {
        const doc = await db.collection(collectionName).doc(docId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    // Add a new document
    async add(collectionName, data) {
        const docRef = await db.collection(collectionName).add(data);
        return { id: docRef.id, ...data };
    },

    // Update a document
    async update(collectionName, docId, data) {
        await db.collection(collectionName).doc(docId).update(data);
        return { id: docId, ...data };
    },

    // Delete a document
    async delete(collectionName, docId) {
        await db.collection(collectionName).doc(docId).delete();
    },

    // Query documents
    async query(collectionName, field, operator, value) {
        const snapshot = await db.collection(collectionName)
            .where(field, operator, value)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};
