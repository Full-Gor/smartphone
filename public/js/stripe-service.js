// public/js/stripe-service.js
class StripeService {
    constructor() {
      this.stripePublicKey = 'pk_test_51RGy61PQqougnU1CNivMCAiwJVnpZPPAafCKLVWiJZbD5rkqn5pFgJHXQMKSQRSSeqBzF2ZOaRvJeIipiwbisbzn00eqoHROHX';
      this.stripe = null;
    }
  
    async initStripe() {
      // Vérifie si Stripe est disponible
      if (typeof Stripe !== 'undefined') {
        if (!this.stripe) {
          this.stripe = Stripe(this.stripePublicKey);
        }
        return this.stripe;
      } else {
        throw new Error('Stripe non disponible. Vérifiez que la bibliothèque Stripe.js est chargée.');
      }
    }
  
    async createCheckoutSession(userId, cartItems, total) {
      try {
        // Validation des données
        if (!userId || !cartItems || cartItems.length === 0) {
          throw new Error('Données de paiement invalides');
        }
  
        // Préparation des items pour Stripe
        const lineItems = cartItems.map(item => ({
          price_data: {
            currency: 'eur',
            product_data: { 
              name: item.name 
            },
            unit_amount: Math.round(item.price * 100)
          },
          quantity: item.quantity
        }));
  
        // Récupération des informations de l'utilisateur
        const userDoc = await window.db.collection('users').doc(userId).get();
        const userEmail = userDoc.exists ? userDoc.data().email : '';
  
        // Création de la session Stripe côté serveur
        const response = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            line_items: lineItems,
            userId,
            userEmail
          })
        });
  
        if (!response.ok) {
          throw new Error('Erreur lors de la création de la session de paiement');
        }
  
        const session = await response.json();
  
        // Enregistrement de la session de paiement dans Firestore
        await window.db.collection('payment_sessions').add({
          userId,
          stripeSessionId: session.id,
          total,
          items: cartItems,
          createdAt: new Date(),
          status: 'pending'
        });
  
        return session;
      } catch (error) {
        console.error('Erreur de création de session de paiement:', error);
        throw error;
      }
    }
  
    async redirectToCheckout(sessionId) {
      try {
        const stripe = await this.initStripe();
        const result = await stripe.redirectToCheckout({ sessionId });
  
        if (result.error) {
          throw result.error;
        }
      } catch (error) {
        console.error('Erreur de redirection Checkout:', error);
        throw error;
      }
    }
  
    async handlePaymentSuccess(sessionId) {
      try {
        // Vérification de la session
        const sessionQuery = await window.db.collection('payment_sessions')
          .where('stripeSessionId', '==', sessionId)
          .limit(1)
          .get();
        
        if (sessionQuery.empty) {
          throw new Error('Session de paiement non trouvée');
        }
        
        const sessionDoc = sessionQuery.docs[0];
        const session = sessionDoc.data();
        
        // Mise à jour du statut de la session
        await window.db.collection('payment_sessions').doc(sessionDoc.id).update({
          status: 'completed',
          updatedAt: new Date()
        });
        
        // Création d'une commande confirmée
        const orderId = await OrderService.createOrder(
          session.userId,
          session.items,
          session.total
        );
        
        // Envoi d'une notification
        await NotificationService.createNotification(
          session.userId,
          'order_complete',
          `Votre commande #${orderId} a été confirmée. Merci pour votre achat!`
        );
        
        // Vider le panier de l'utilisateur
        await window.db.collection('carts').doc(session.userId).set({
          items: [],
          updatedAt: new Date()
        });
        
        return {
          success: true,
          orderId
        };
      } catch (error) {
        console.error('Erreur de confirmation de paiement:', error);
        throw error;
      }
    }
  }
  
  // Création d'une instance globale
  window.stripeService = new StripeService();