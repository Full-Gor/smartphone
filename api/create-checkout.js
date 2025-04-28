const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'POST') {
        try {
            const { line_items, userEmail } = req.body;

            // Création de la session Stripe
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                line_items,
                success_url: `${process.env.SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.SITE_URL}/cancel.html`,
                customer_email: userEmail
            });

            // Stockage des informations de commande dans localStorage (à remplacer par Firebase)
            const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '{}');
            const userOrders = orderHistory[userEmail] || [];

            const newOrder = {
                sessionId: session.id,
                date: new Date().toISOString(),
                items: line_items.map(item => ({
                    name: item.price_data.product_data.name,
                    price: item.price_data.unit_amount / 100,
                    quantity: item.quantity
                })),
                total: line_items.reduce((sum, item) => 
                    sum + (item.price_data.unit_amount / 100 * item.quantity), 0)
            };

            userOrders.push(newOrder);
            orderHistory[userEmail] = userOrders;
            localStorage.setItem('orderHistory', JSON.stringify(orderHistory));

            res.status(200).json({ 
                id: session.id,
                total: newOrder.total
            });
        } catch (error) {
            console.error('Erreur lors de la création de la commande:', error);
            res.status(500).json({ error: 'Erreur de création de commande' });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Méthode non autorisée');
    }
};