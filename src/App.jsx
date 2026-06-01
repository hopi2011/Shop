import React, { useEffect, useState } from 'react';
import tgSdk from '@twa-dev/sdk';
import './App.css';

// Исправляем импорт объекта WebApp из библиотеки
const WebApp = tgSdk.default;

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // Безопасно инициализируем Telegram WebApp
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
    }

    // Загружаем товары из FakeStoreAPI
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

  // Управление Главной кнопкой Telegram (MainButton)
  useEffect(() => {
    if (!WebApp || !WebApp.MainButton) return;

    if (cart.length > 0) {
      WebApp.MainButton.text = `Оформить заказ (${cart.length})`;
      WebApp.MainButton.show();
    } else {
      WebApp.MainButton.hide();
    }
  }, [cart]);

  // Обработчик клика по Главной кнопке Telegram
  useEffect(() => {
    if (!WebApp || !WebApp.MainButton) return;

    const handleMainButtonClick = () => {
      WebApp.showAlert(`Заказ оформлен! Всего товаров: ${cart.length}`);
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
    return <div className="loading">Загрузка магазина...</div>;
  }

  // Получаем имя пользователя, если открыто в ТГ, иначе пишем "Гость"
  const username = WebApp?.initDataUnsafe?.user?.first_name || 'Гость';

  return (
    <div className="app-container">
      <header className="shop-header">
        <h1>Fake Store</h1>
        <p>Привет, {username}!</p>
      </header>

      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="img-container">
              <img src={product.image} alt={product.title} />
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