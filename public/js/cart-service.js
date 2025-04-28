// public/js/cart-service.js
class CartService {
    static async getCart(userId) {
      try {
        const cartDoc = await window.db.collection('carts').doc(userId).get();
        if (cartDoc.exists) {
          return cartDoc.data().items || [];
        } else {
          return [];
        }
      } catch (error) {
        console.error('Erreur de récupération du panier:', error);
        throw error;
      }
    }
  
    static async addToCart(userId, product) {
      try {
        const cartRef = window.db.collection('carts').doc(userId);
        const cartDoc = await cartRef.get();
        
        let cart = cartDoc.exists ? cartDoc.data().items || [] : [];
        
        const existingItemIndex = cart.findIndex(item => item.name === product.name);
        
        if (existingItemIndex > -1) {
          cart[existingItemIndex].quantity += 1;
        } else {
          cart.push({
            name: product.name,
            price: product.price,
            quantity: 1
          });
        }
        
        await cartRef.set({
          items: cart,
          updatedAt: new Date()
        });
        
        return cart;
      } catch (error) {
        console.error('Erreur d\'ajout au panier:', error);
        throw error;
      }
    }
  
    static async updateCartItemQuantity(userId, productName, quantity) {
      try {
        const cartRef = window.db.collection('carts').doc(userId);
        const cartDoc = await cartRef.get();
        
        if (!cartDoc.exists) {
          throw new Error('Panier non trouvé');
        }
        
        let cart = cartDoc.data().items || [];
        const itemIndex = cart.findIndex(item => item.name === productName);
        
        if (itemIndex === -1) {
          throw new Error('Produit non trouvé dans le panier');
        }
        
        if (quantity <= 0) {
          // Supprimer l'article si la quantité est 0 ou négative
          cart.splice(itemIndex, 1);
        } else {
          // Mettre à jour la quantité
          cart[itemIndex].quantity = quantity;
        }
        
        await cartRef.set({
          items: cart,
          updatedAt: new Date()
        });
        
        return cart;
      } catch (error) {
        console.error('Erreur de mise à jour de la quantité:', error);
        throw error;
      }
    }
  
    static async clearCart(userId) {
      try {
        await window.db.collection('carts').doc(userId).set({
          items: [],
          updatedAt: new Date()
        });
        
        return [];
      } catch (error) {
        console.error('Erreur de vidage du panier:', error);
        throw error;
      }
    }
  }