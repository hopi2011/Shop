import React, { useEffect, useState } from 'react';
import './App.css';

// Надежное получение WebApp напрямую из window
const WebApp = window.Telegram?.WebApp;

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
    }

    fetch('https://fakestoreapi.com/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ошибка загрузки товаров:', err);
        setLoading(false);
      });
  }, []);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const getProductQuantity = (productId) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

  // Единственная функция для отправки заказа
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const orderData = {
      items: cart.map(item => ({
        title: item.title,
        price: item.price,
        quantity: item.quantity
      })),
      totalPrice: totalPrice
    };

    if (WebApp) {
      WebApp.sendData(JSON.stringify(orderData)); // Отправляем данные боту
      WebApp.close(); // Закрываем Mini App
    }
  };

  if (loading) {
    return <div className="loading">Загрузка Shop-App...</div>;
  }

  return (
    <div className="app-container">
      <header className="shop-header">
        <h1>Shop-App</h1>
        <button className="cart-header-btn" onClick={() => setIsCartOpen(true)}>
          🛒 <span className="cart-badge">{totalItems}</span>
        </button>
      </header>

      <div className="products-grid">
        {products.map((product) => {
          const qty = getProductQuantity(product.id);
          return (
            <div key={product.id} className="product-card">
              <div className="img-container">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://placehold.co/100x120?text=No+Image";
                  }}
                />
              </div>
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-price">${product.price}</p>
                <button className="buy-btn" onClick={() => addToCart(product)}>
                  {qty > 0 ? `Добавить (${qty})` : 'Добавить'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isCartOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Ваша корзина</h2>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>✕</button>
            </div>

            {cart.length === 0 ? (
              <p className="empty-cart-text">Корзина пуста 😔</p>
            ) : (
              <>
                <div className="modal-items-list">
                  {cart.map((item) => (
                    <div key={item.id} className="modal-item">
                      <img src={item.image} alt={item.title} className="modal-item-img" />
                      <div className="modal-item-details">
                        <h4>{item.title}</h4>
                        <p>{item.quantity} шт. x ${item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <div className="total-price-box">
                    <span>Итого:</span>
                    <strong>${totalPrice}</strong>
                  </div>
                  <button className="checkout-btn" onClick={handleCheckout}>
                    Оформить заказ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;