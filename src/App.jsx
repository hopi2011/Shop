import React, { useEffect, useState } from 'react';
import tgSdk from '@twa-dev/sdk';
import './App.css';

const WebApp = tgSdk.default;

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

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

  // Управление Главной кнопкой Telegram
  useEffect(() => {
    if (!WebApp || !WebApp.MainButton) return;

    if (cart.length > 0) {
      WebApp.MainButton.text = `Заказать (${cart.length} шт.)`;
      WebApp.MainButton.show();
    } else {
      WebApp.MainButton.hide();
    }
  }, [cart]);

  // Передача данных о корзине в бота при нажатии "Заказать"
  useEffect(() => {
    if (!WebApp || !WebApp.MainButton) return;

    const handleMainButtonClick = () => {
      // Собираем краткую информацию о заказе
      const orderData = {
        items: cart.map(item => ({ title: item.title, price: item.price })),
        totalPrice: cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)
      };

      // Отправляем JSON-строку боту (работает только если бот запущен через Inline-кнопку)
      WebApp.sendData(JSON.stringify(orderData));
      WebApp.close(); // Закрываем Mini App после отправки
    };

    WebApp.MainButton.onClick(handleMainButtonClick);
    return () => {
      if (WebApp.MainButton) {
        WebApp.MainButton.offClick(handleMainButtonClick);
      }
    };
  }, [cart]);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  if (loading) {
    return <div className="loading">Загрузка Shop-App...</div>;
  }

  const username = WebApp?.initDataUnsafe?.user?.first_name || 'Гость';

  return (
    <div className="app-container">
      <header className="shop-header">
        <h1>Shop-App</h1>
        <p>Привет, {username}!</p>
      </header>

      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="img-container">
              {/* Добавлен crossOrigin и onError для исправления битых картинок */}
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
                Добавить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;