// public/js/order-service.js
class OrderService {
    static async createOrder(userId, cartItems, total) {
      try {
        if (!userId || !cartItems || cartItems.length === 0) {
          throw new Error('Données de commande invalides');
        }
  
        const orderRef = await window.db.collection('orders').add({
          userId,
          items: cartItems,
          total: parseFloat(total).toFixed(2),
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          shipping: {
            status: 'not_shipped',
            trackingNumber: null
          }
        });
  
        return orderRef.id;
      } catch (error) {
        console.error('Erreur de création de commande:', error);
        throw error;
      }
    }
  
    static async getUserOrders(userId) {
      try {
        if (!userId) {
          throw new Error('ID utilisateur requis');
        }
  
        const ordersSnapshot = await window.db.collection('orders')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();
        
        return ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Erreur de récupération des commandes:', error);
        throw error;
      }
    }
    
    static async getOrderDetails(orderId) {
      try {
        if (!orderId) {
          throw new Error('ID de commande requis');
        }
  
        const orderDoc = await window.db.collection('orders').doc(orderId).get();
  
        if (!orderDoc.exists) {
          throw new Error('Commande non trouvée');
        }
  
        return {
          id: orderDoc.id,
          ...orderDoc.data()
        };
      } catch (error) {
        console.error('Erreur de récupération des détails de commande:', error);
        throw error;
      }
    }
  
    static async updateOrderStatus(orderId, status) {
      try {
        if (!orderId || !status) {
          throw new Error('Paramètres de mise à jour invalides');
        }
  
        await window.db.collection('orders').doc(orderId).update({
          status,
          updatedAt: new Date()
        });
  
        return true;
      } catch (error) {
        console.error('Erreur de mise à jour du statut:', error);
        throw error;
      }
    }
  }