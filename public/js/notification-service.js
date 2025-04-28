import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase-config.js';

class NotificationService {
    static async createNotification(userId, type, message) {
        try {
            return await addDoc(collection(db, 'notifications'), {
                userId,
                type,
                message,
                read: false,
                createdAt: new Date()
            });
        } catch (error) {
            console.error('Erreur de création de notification:', error);
            throw error;
        }
    }

    static async getUserNotifications(userId) {
        try {
            const q = query(
                collection(db, 'notifications'), 
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Erreur de récupération des notifications:', error);
            throw error;
        }
    }

    static async markNotificationAsRead(notificationId) {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await updateDoc(notificationRef, { read: true });
        } catch (error) {
            console.error('Erreur de mise à jour de notification:', error);
            throw error;
        }
    }
}

export default NotificationService;