// Бази даних
let inventory = JSON.parse(localStorage.getItem('meatInventory')) || {
    "Хрящ": { weight: 0, price: 0 },
    "Фарш": { weight: 0, price: 0 },
    "Ошийок": { weight: 0, price: 0 },
    "Ребра": { weight: 0, price: 0 }
};
let orders = JSON.parse(localStorage.getItem('meatOrders')) || [];
let clientsDB = JSON.parse(localStorage.getItem('meatClientsDB')) || {}; // База імен та телефонів

// --- РОБОТА ЗІ СКЛАДОМ ---
function updateStock() {
    const type = document.getElementById('stockMeatType').value;
    const addWeight = parseFloat(document.getElementById('stockAddWeight').value) || 0;
    const buyPrice = parseFloat(document.getElementById('buyPrice').value) || inventory[type].price;

    inventory[type].weight += addWeight;
    inventory[type].price = buyPrice;

    document.getElementById('stockAddWeight').value = '';
    document.getElementById('buyPrice').value = '';
    
    saveAndRender();
}

function clearStock() {
    if(confirm("Увага! Ви впевнені, що хочете обнулити весь склад та ціни?")) {
        inventory = {
            "Хрящ": { weight: 0, price: 0 },
            "Фарш": { weight: 0, price: 0 },
            "Ошийок": { weight: 0, price: 0 },
            "Ребра": { weight: 0, price: 0 }
        };
        saveAndRender();
    }
}

// --- РОБОТА З КЛІЄНТАМИ ---
function autoFillPhone() {
    const name = document.getElementById('clientName').value;
    // Якщо ім'я є в базі, автоматично підставляємо телефон
    if (clientsDB[name]) {
        document.getElementById('clientPhone').value = clientsDB[name];
    }
}

function updateClientsList() {
    const datalist = document.getElementById('savedClients');
    datalist.innerHTML = '';
    for (let name in clientsDB) {
        datalist.innerHTML += `<option value="${name}">`;
    }
}

// --- ЗАМОВЛЕННЯ ---
function addOrder() {
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const type = document.getElementById('orderMeatType').value;
    const weight = parseFloat(document.getElementById('orderWeight').value);
    const margin = parseFloat(document.getElementById('margin').value);

    if (!name || !weight || !phone) return alert("Введіть ім'я, телефон та вагу!");
    if (inventory[type].weight < weight) return alert(`Недостатньо м'яса "${type}" на складі!`);
    if (inventory[type].price === 0) return alert(`Вкажіть ціну закупівлі для "${type}" на складі!`);

    // Зберігаємо або оновлюємо клієнта в базі
    clientsDB[name] = phone;

    const buyPrice = inventory[type].price;
    const salePricePerKg = buyPrice + (buyPrice * (margin / 100));
    const totalPrice = salePricePerKg * weight;
    const profit = (salePricePerKg - buyPrice) * weight;

    // Віднімаємо зі складу
    inventory[type].weight -= weight;

    const newOrder = {
        id: Date.now(),
        name,
        phone,
        type,
        weight,
        margin,
        totalPrice: totalPrice.toFixed(2),
        profit: profit.toFixed(2)
    };

    orders.push(newOrder);
    
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('orderWeight').value = '';
    
    saveAndRender();
}

function deleteOrder(id) {
    if(confirm("Точно видалити це замовлення?")) {
        let order = orders.find(o => o.id === id);
        inventory[order.type].weight += order.weight;
        orders = orders.filter(o => o.id !== id);
        saveAndRender();
    }
}

function editWeight(id) {
    let order = orders.find(o => o.id === id);
    let newWeight = parseFloat(prompt(`Введіть нову вагу для ${order.name} (${order.type}):`, order.weight));
    
    if (newWeight && newWeight > 0 && newWeight !== order.weight) {
        let weightDifference = newWeight - order.weight;
        
        if (weightDifference > 0 && inventory[order.type].weight < weightDifference) {
            return alert("Недостатньо м'яса на складі для збільшення ваги!");
        }

        inventory[order.type].weight -= weightDifference;
        order.weight = newWeight;

        const buyPrice = inventory[order.type].price;
        const salePricePerKg = buyPrice + (buyPrice * (order.margin / 100));
        order.totalPrice = (salePricePerKg * order.weight).toFixed(2);
        order.profit = ((salePricePerKg - buyPrice) * order.weight).toFixed(2);

        saveAndRender();
    }
}

// --- ЗБЕРЕЖЕННЯ ТА ВІДОБРАЖЕННЯ ---
function saveAndRender() {
    localStorage.setItem('meatInventory', JSON.stringify(inventory));
    localStorage.setItem('meatOrders', JSON.stringify(orders));
    localStorage.setItem('meatClientsDB', JSON.stringify(clientsDB));
    renderAll();
}

function renderAll() {
    updateClientsList(); // Оновлюємо випадаючий список імен

    // Рендер складу
    const stockDiv = document.getElementById('stockDisplay');
    stockDiv.innerHTML = '<strong>Залишки:</strong><br>';
    for (let type in inventory) {
        stockDiv.innerHTML += `${type}: ${inventory[type].weight} кг (Закупка: ${inventory[type].price} грн)<br>`;
    }

    // Рендер замовлень
    const list = document.getElementById('ordersList');
    list.innerHTML = '';
    let totalProfit = 0;

    orders.forEach(order => {
        totalProfit += parseFloat(order.profit);
        list.innerHTML += `
            <div class="order-item">
                <div class="order-info">
                    <strong>${order.name}</strong> — ${order.type} (${order.weight}кг)<br>
                    <span style="color: #555;">Сума: <strong>${order.totalPrice} грн</strong></span>
                </div>
                <div class="order-actions">
                    <button onclick="editWeight(${order.id})" class="btn-sm btn-edit">✎ Вага</button>
                    <button onclick="deleteOrder(${order.id})" class="btn-sm btn-delete">✖ Видал.</button>
                    <button onclick="window.location.href='tel:${order.phone}'" class="btn-sm btn-msg">📞 Дзвінок</button>
                </div>
            </div>
        `;
    });
    document.getElementById('totalProfit').innerText = totalProfit.toFixed(2);
}

// Запуск при завантаженні
renderAll();