import React, { useEffect, useState } from 'react';
import './App.css';

// Надежное получение WebApp напрямую из window без внешних npm-библиотек
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

    // Загрузка каталога товаров
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

  // Добавление товара в корзину (увеличиваем quantity, если товар уже внутри)
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

  // Получение количества конкретного товара в корзине
  const getProductQuantity = (productId) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  // Подсчет счетчиков
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

  // Отправка JSON-строки заказа в Telegram-бота
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
      WebApp.sendData(JSON.stringify(orderData));
      WebApp.close();
    }
  };

  if (loading) {
    return <div className="loading">Загрузка Shop-App...</div>;
  }

  const username = WebApp?.initDataUnsafe?.user?.first_name || 'Гость';

  return (
    <div className="app-container">
      {/* ХЕДЕР С КНОПКОЙ КОРЗИНЫ */}
      <header className="shop-header">
        <div className="header-info">
          <h1>Shop-App</h1>
          <p>Привет, {username}!</p>
        </div>
        <button className="cart-header-btn" onClick={() => setIsCartOpen(true)}>
          🛒 <span className="cart-badge">{totalItems}</span>
        </button>
      </header>

      {/* АДАПТИВНАЯ СЕТКА ТОВАРОВ */}
      <main className="products-grid">
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
                <div className="product-footer-row">
                  <p className="product-price">${product.price}</p>
                  <button className="buy-btn" onClick={() => addToCart(product)}>
                    {qty > 0 ? `+${qty}` : 'Добавить'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* МОДАЛЬНОЕ ОКНО КОРЗИНЫ */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ваша корзина</h2>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>✕</button>
            </div>

            {cart.length === 0 ? (
              <p className="empty-cart-text">В корзине пока ничего нет 😔</p>
            ) : (
              <>
                <div className="modal-items-list">
                  {cart.map((item) => (
                    <div key={item.id} className="modal-item">
                      <img src={item.image} alt={item.title} className="modal-item-img" />
                      <div className="modal-item-details">
                        <h4>{item.title}</h4>
                        <p>{item.quantity} шт. × ${item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <div className="total-price-box">
                    <span>Итого к оплате:</span>
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