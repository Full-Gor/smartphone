// Fonction pour gérer l'état d'authentification
function handleAuthState() {
    const user = auth.currentUser;
    
    // Mise à jour des liens de navigation
    ['login-link', 'register-link', 'dashboard-link', 'logout-link'].forEach(linkId => {
        const link = document.getElementById(linkId);
        if (link) {
            link.style.display = user ? 
                (linkId.includes('logout') || linkId.includes('dashboard') ? 'block' : 'none') :
                (linkId.includes('login') || linkId.includes('register') ? 'block' : 'none');
        }
    });

    // Mise à jour de l'icône du panier
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.style.display = user ? 'flex' : 'none';
    }
}

// Gestion du panier avec Firebase
const CartManager = {
    async getUserCart() {
        const user = auth.currentUser;
        if (!user) return [];
        
        try {
            const cartDoc = await db.collection('carts').doc(user.uid).get();
            if (cartDoc.exists) {
                return cartDoc.data().items || [];
            }
            return [];
        } catch (error) {
            console.error('Erreur de récupération du panier:', error);
            return [];
        }
    },

    async saveUserCart(cartItems) {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            await db.collection('carts').doc(user.uid).set({
                items: cartItems,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Erreur de sauvegarde du panier:', error);
        }
    },

    async updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const cart = await this.getUserCart();
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    },

    async addToCart(productName, price) {
        const user = auth.currentUser;
        if (!user) {
            alert('Veuillez vous connecter pour ajouter des articles au panier');
            window.location.href = 'login.html';
            return;
        }

        try {
            let cart = await this.getUserCart();
            const existingItemIndex = cart.findIndex(item => item.name === productName);
            
            if (existingItemIndex >= 0) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push({ name: productName, price, quantity: 1 });
            }

            await this.saveUserCart(cart);
            await this.updateCartCount();
            alert(`${productName} ajouté au panier !`);
        } catch (error) {
            console.error('Erreur d\'ajout au panier:', error);
            alert('Erreur lors de l\'ajout au panier');
        }
    },

    async checkout() {
        const user = auth.currentUser;
        if (!user) {
            alert('Veuillez vous connecter pour finaliser votre commande');
            window.location.href = 'login.html';
            return;
        }

        try {
            const cart = await this.getUserCart();
            if (cart.length === 0) {
                alert('Votre panier est vide');
                return;
            }

            // Préparation pour Stripe
            const line_items = cart.map(item => ({
                price_data: {
                    currency: 'eur',
                    product_data: { name: item.name },
                    unit_amount: Math.round(item.price * 100)
                },
                quantity: item.quantity
            }));

            // Appel à l'API de création de session Stripe
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    line_items,
                    userId: user.uid
                })
            });

            const session = await response.json();
            
            // Redirection Stripe
            stripe.redirectToCheckout({ sessionId: session.id });
        } catch (error) {
            console.error('Erreur de paiement:', error);
            alert('Erreur lors du paiement');
        }
    }
};

// Gestion de l'historique des commandes
const OrderManager = {
    async loadOrderHistory() {
        const orderHistoryContainer = document.getElementById('order-history');
        const user = auth.currentUser;

        if (!user || !orderHistoryContainer) return;

        try {
            // Récupération des commandes depuis Firestore
            const ordersSnapshot = await db.collection('orders')
                .where('userId', '==', user.uid)
                .orderBy('createdAt', 'desc')
                .get();
            
            const orders = ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (orders.length === 0) {
                orderHistoryContainer.innerHTML = '<p>Aucune commande trouvée</p>';
                return;
            }

            const orderHtml = orders.map(order => `
                <div class="order-item">
                    <p>Commande #${order.id}</p>
                    <p>Date: ${new Date(order.createdAt.toDate()).toLocaleDateString()}</p>
                    <p>Total: ${parseFloat(order.total).toFixed(2)}€</p>
                    <button onclick="OrderManager.showOrderDetails('${order.id}')">Détails</button>
                </div>
            `).join('');

            orderHistoryContainer.innerHTML = orderHtml;
        } catch (error) {
            console.error('Erreur de chargement des commandes:', error);
            orderHistoryContainer.innerHTML = '<p>Erreur lors du chargement des commandes</p>';
        }
    },

    async showOrderDetails(orderId) {
        try {
            // Récupération des détails de commande depuis Firestore
            const orderDoc = await db.collection('orders').doc(orderId).get();
            
            if (!orderDoc.exists) {
                alert('Commande non trouvée');
                return;
            }

            const order = orderDoc.data();

            const modalContent = `
                <div class="modal">
                    <div class="modal-content">
                        <h2>Détails de la commande</h2>
                        <p>Numéro: ${orderId}</p>
                        <p>Date: ${new Date(order.createdAt.toDate()).toLocaleDateString()}</p>
                        <p>Total: ${parseFloat(order.total).toFixed(2)}€</p>
                        <p>Statut: ${order.status}</p>
                        <h3>Articles:</h3>
                        <ul>
                            ${order.items.map(item => 
                                `<li>${item.name} - Qté: ${item.quantity} - ${item.price}€</li>`
                            ).join('')}
                        </ul>
                        <button onclick="document.querySelector('.modal').remove()">Fermer</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalContent);
        } catch (error) {
            console.error('Erreur de récupération des détails:', error);
            alert('Erreur lors de la récupération des détails de la commande');
        }
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Écouter les changements d'état d'authentification
    auth.onAuthStateChanged(user => {
        handleAuthState();
        if (user) {
            CartManager.updateCartCount();
        }
    });
    
    // Gestion du formulaire d'inscription
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                address: document.getElementById('address').value,
                phone: document.getElementById('phone').value
            };
            
            try {
                await AuthService.register(userData);
                alert('Inscription réussie! Vous êtes maintenant connecté.');
                window.location.href = 'index.html';
            } catch (error) {
                alert(`Erreur d'inscription: ${error.message}`);
            }
        });
    }
    
    // Gestion du formulaire de connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                await AuthService.login(email, password);
                alert('Connexion réussie!');
                window.location.href = 'index.html';
            } catch (error) {
                alert(`Erreur de connexion: ${error.message}`);
            }
        });
    }
    
    // Initialiser l'historique des commandes si on est sur la page dashboard
    if (document.getElementById('order-history')) {
        OrderManager.loadOrderHistory();
    }
    
    // Assignation des fonctions globales
    window.addToCart = (name, price) => CartManager.addToCart(name, price);
    window.checkout = () => CartManager.checkout();
    window.logout = () => AuthService.logout();
    window.loadOrderHistory = () => OrderManager.loadOrderHistory();
    window.showOrderDetails = (id) => OrderManager.showOrderDetails(id);
});