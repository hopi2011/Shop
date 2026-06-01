import React, { useEffect, useState } from 'react';
import './App.css';

const WebApp = window.Telegram?.WebApp;

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Click / Payme');

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

  // НАДЕЖНЫЙ МЕТОД ОФОРМЛЕНИЯ ЗАКАЗА ЧЕРЕЗ ПРЯМОЙ URL СЕРВЕРА
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Получаем ID чата пользователя из данных инициализации Telegram
    const chatId = WebApp?.initDataUnsafe?.user?.id;
    
    // Вставь сюда ТОКЕН СВОЕГО БОТА прямо строкой
    const BOT_TOKEN = 'ТВОЙ_ТОКЕН_БОТА_СЮДА'; 

    if (!chatId) {
      alert('Ошибка: Не удалось получить ваш Telegram ID. Откройте приложение внутри Telegram!');
      return;
    }

    // Формируем красивый текст чека для чата
    let itemsList = '';
    cart.forEach((item, index) => {
      itemsList += `🔹 ${item.title} — ${item.quantity} шт.\n`;
    });

    const orderSummaryText = `🎉 **Заказ успешно оформлен!**\n\n🛒 **В Вашу корзину добавлены следующие вещи:**\n${itemsList}\n💳 **Способ оплаты:** ${paymentMethod}\n💰 **Итоговая стоимость:** $${totalPrice}\n\nСпасибо за покупку в Shop-App! Наш менеджер свяжется с Вами в ближайшее время.`;

    try {
      // Отправляем запрос напрямую в Telegram Bot API
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: orderSummaryText,
          parse_mode: 'Markdown'
        })
      });

      // Если запрос прошел успешно — закрываем приложение
      if (WebApp) {
        WebApp.close();
      }
    } catch (error) {
      console.error('Ошибка отправки запроса к Bot API:', error);
      alert('Произошла ошибка при отправке заказа. Попробуйте еще раз.');
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
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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

                <div className="payment-selection">
                  <label htmlFor="payment">Способ оплаты:</label>
                  <select 
                    id="payment" 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="payment-select"
                  >
                    <option value="Click / Payme">Click / Payme</option>
                    <option value="Наличными при получении">Наличными при получении</option>
                    <option value="Картой (Visa/Mastercard)">Картой (Visa/Mastercard)</option>
                  </select>
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