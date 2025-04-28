// public/js/stripe-service.js
import { loadStripe } from '@stripe/stripe-js';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

class StripeService {
    constructor() {
        this.stripePublicKey = 'pk_test_51RGy61PQqougnU1CNivMCAiwJVnpZPPAafCKLVWiJZbD5rkqn5pFgJHXQMKSQRSSeqBzF2ZOaRvJeIipiwbisbzn00eqoHROHX';
        this.stripe = null;
    }

    async initStripe() {
        if (!this.stripe) {
            this.stripe = await loadStripe(this.stripePublicKey);
        }
        return this.stripe;
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

            // Création de la session Stripe côté serveur
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    line_items: lineItems,
                    userId 
                })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la création de la session de paiement');
            }

            const session = await response.json();

            // Enregistrement de la session de paiement dans Firestore
            await addDoc(collection(db, 'payment_sessions'), {
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
            // Logique de confirmation de paiement
            const response = await fetch(`/api/verify-payment/${sessionId}`);
            const paymentDetails = await response.json();

            if (paymentDetails.status === 'success') {
                // Mettre à jour le statut dans Firestore
                // Envoyer une confirmation
                return paymentDetails;
            } else {
                throw new Error('Paiement non confirmé');
            }
        } catch (error) {
            console.error('Erreur de vérification de paiement:', error);
            throw error;
        }
    }
}

export default new StripeService();