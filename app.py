from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

# Sample menu data
MENU_DATA = {
    "categories": [
        {
            "id": "appetizers",
            "name": "Appetizers",
            "items": [
                {"id": 1, "name": "Bruschetta", "description": "Grilled bread topped with fresh tomatoes, garlic, and basil", "price": 8.99, "spicy": False, "vegetarian": True},
                {"id": 2, "name": "Calamari", "description": "Crispy fried squid served with marinara sauce", "price": 12.99, "spicy": False, "vegetarian": False},
                {"id": 3, "name": "Spicy Wings", "description": "Chicken wings tossed in spicy buffalo sauce", "price": 10.99, "spicy": True, "vegetarian": False},
                {"id": 4, "name": "Garlic Bread", "description": "Toasted bread with garlic butter and herbs", "price": 5.99, "spicy": False, "vegetarian": True}
            ]
        },
        {
            "id": "mains",
            "name": "Main Courses",
            "items": [
                {"id": 5, "name": "Grilled Salmon", "description": "Fresh salmon fillet with lemon butter sauce", "price": 22.99, "spicy": False, "vegetarian": False},
                {"id": 6, "name": "Chicken Parmesan", "description": "Breaded chicken breast topped with marinara and mozzarella", "price": 18.99, "spicy": False, "vegetarian": False},
                {"id": 7, "name": "Vegetable Pasta", "description": "Penne pasta with seasonal vegetables in tomato sauce", "price": 16.99, "spicy": False, "vegetarian": True},
                {"id": 8, "name": "Spicy Burger", "description": "Beef patty with jalapeños and spicy mayo", "price": 15.99, "spicy": True, "vegetarian": False},
                {"id": 9, "name": "Margherita Pizza", "description": "Classic pizza with tomato, mozzarella, and basil", "price": 14.99, "spicy": False, "vegetarian": True}
            ]
        },
        {
            "id": "desserts",
            "name": "Desserts",
            "items": [
                {"id": 10, "name": "Tiramisu", "description": "Coffee-flavored Italian dessert with mascarpone", "price": 7.99, "spicy": False, "vegetarian": True},
                {"id": 11, "name": "Chocolate Lava Cake", "description": "Warm chocolate cake with molten center", "price": 8.99, "spicy": False, "vegetarian": True},
                {"id": 12, "name": "Ice Cream Sundae", "description": "Vanilla ice cream with chocolate sauce and nuts", "price": 6.99, "spicy": False, "vegetarian": True}
            ]
        },
        {
            "id": "beverages",
            "name": "Beverages",
            "items": [
                {"id": 13, "name": "Fresh Lemonade", "description": "Hand-squeezed lemonade with mint", "price": 4.99, "spicy": False, "vegetarian": True},
                {"id": 14, "name": "Iced Tea", "description": "Refreshing brewed iced tea", "price": 3.99, "spicy": False, "vegetarian": True},
                {"id": 15, "name": "Sparkling Water", "description": "Premium sparkling mineral water", "price": 2.99, "spicy": False, "vegetarian": True},
                {"id": 16, "name": "Mango Smoothie", "description": "Fresh mango blended with yogurt", "price": 5.99, "spicy": False, "vegetarian": True}
            ]
        }
    ]
}

# Cart data (in-memory storage for demo)
cart = []

@app.route('/')
def index():
    """Render the main menu page"""
    return render_template('index.html')

@app.route('/api/menu')
def get_menu():
    """Return the full menu as JSON"""
    return jsonify(MENU_DATA)

@app.route('/api/menu/category/<category_id>')
def get_category(category_id):
    """Return items from a specific category"""
    for category in MENU_DATA['categories']:
        if category['id'] == category_id:
            return jsonify(category)
    return jsonify({"error": "Category not found"}), 404

@app.route('/api/menu/item/<int:item_id>')
def get_item(item_id):
    """Return a specific menu item"""
    for category in MENU_DATA['categories']:
        for item in category['items']:
            if item['id'] == item_id:
                return jsonify(item)
    return jsonify({"error": "Item not found"}), 404

@app.route('/api/cart', methods=['GET', 'POST', 'DELETE'])
def handle_cart():
    """Handle cart operations"""
    global cart
    
    if request.method == 'GET':
        # Calculate total
        total = sum(item['price'] for item in cart)
        return jsonify({
            "items": cart,
            "total": round(total, 2),
            "count": len(cart)
        })
    
    elif request.method == 'POST':
        # Add item to cart
        data = request.get_json()
        item_id = data.get('item_id')
        
        # Find the item in menu
        for category in MENU_DATA['categories']:
            for item in category['items']:
                if item['id'] == item_id:
                    # Add quantity field
                    cart_item = item.copy()
                    cart_item['quantity'] = data.get('quantity', 1)
                    cart.append(cart_item)
                    return jsonify({
                        "message": "Item added to cart",
                        "cart_count": len(cart)
                    })
        
        return jsonify({"error": "Item not found"}), 404
    
    elif request.method == 'DELETE':
        # Clear cart
        cart = []
        return jsonify({"message": "Cart cleared", "cart_count": 0})

@app.route('/api/cart/item/<int:item_id>', methods=['DELETE'])
def remove_cart_item(item_id):
    """Remove a specific item from cart"""
    global cart
    cart = [item for item in cart if item['id'] != item_id]
    total = sum(item['price'] for item in cart)
    return jsonify({
        "message": "Item removed",
        "cart_count": len(cart),
        "total": round(total, 2)
    })

@app.route('/api/search')
def search_menu():
    """Search menu items by name or description"""
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify({"results": []})
    
    results = []
    for category in MENU_DATA['categories']:
        for item in category['items']:
            if query in item['name'].lower() or query in item['description'].lower():
                results.append({
                    **item,
                    "category": category['name']
                })
    
    return jsonify({"results": results})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
