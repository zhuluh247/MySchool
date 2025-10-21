#!/bin/bash
# Replace placeholders in firebase-config.template.js with actual environment variables
sed -i "s|%%FIREBASE_API_KEY%%|$FIREBASE_API_KEY|g" js/firebase-config.js
sed -i "s|%%FIREBASE_AUTH_DOMAIN%%|$FIREBASE_AUTH_DOMAIN|g" js/firebase-config.js
sed -i "s|%%FIREBASE_PROJECT_ID%%|$FIREBASE_PROJECT_ID|g" js/firebase-config.js
sed -i "s|%%FIREBASE_STORAGE_BUCKET%%|$FIREBASE_STORAGE_BUCKET|g" js/firebase-config.js"
sed -i "s|%%FIREBASE_MESSAGING_SENDER_ID%%|$FIREBASE_MESSAGING_SENDER_ID|g" js/firebase-config.js"
sed -i "s|%%FIREBASE_APP_ID%%|$FIREBASE_APP_ID|g" js/firebase-config.js"
sed -i "s|%%FIREBASE_MEASUREMENT_ID%%|$FIREBASE_MEASUREMENT_ID|g" js/firebase-config.js"
