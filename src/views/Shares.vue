<template>
  <div class="shares-page">
    <div class="container">
      <div class="shares-header">
        <button @click="goBack" class="back-btn"><i class="fas fa-arrow-right"></i></button>
        <h1 class="page-title">أسهم Palm Treasure</h1>
        <button @click="goToHistory" class="history-btn"><i class="fas fa-clock-rotate-left"></i></button>
      </div>

      <div v-if="loading" class="loading-card">
        <div class="gold-spinner"></div>
        <div class="loading-text">جاري تحميل منصة التداول...</div>
      </div>

      <template v-else>
        <section class="hero-card">
          <div class="company-info">
            <div class="logo-icon">🏦</div>
            <div>
              <h2>Palm Treasure</h2>
              <span class="symbol">PTR/USDT</span>
            </div>
          </div>
          <span class="status-badge open"><span class="pulse-dot"></span> السوق مفتوح</span>
        </section>

        <section class="market-summary" v-if="stockData">
          <div class="last-price">
            <span class="label">آخر سعر</span>
            <strong :class="priceChange >= 0 ? 'positive' : 'negative'">{{ formatPrice(stockData.currentPrice) }}</strong>
            <span class="currency">USDT</span>
          </div>
          <div class="change-box" :class="priceChange >= 0 ? 'positive-bg' : 'negative-bg'">
            {{ priceChange >= 0 ? '+' : '' }}{{ formatPrice(priceChange) }}
            ({{ priceChangePercent >= 0 ? '+' : '' }}{{ formatPrice(priceChangePercent) }}%)
          </div>
        </section>

        <section class="ticker-grid" v-if="stockData">
          <div class="ticker-item"><span>الافتتاح</span><strong>{{ formatPrice(stockData.openingPrice) }}</strong></div>
          <div class="ticker-item"><span>أعلى سعر</span><strong class="positive">{{ formatPrice(stockData.highPrice) }}</strong></div>
          <div class="ticker-item"><span>أدنى سعر</span><strong class="negative">{{ formatPrice(stockData.lowPrice) }}</strong></div>
          <div class="ticker-item"><span>حجم التداول اليومي</span><strong>{{ formatVolume(stockData.dayVolume || stockData.volume || 0) }}</strong></div>
        </section>

        <section class="chart-card">
          <div class="section-head">
            <h3>مخطط السعر</h3>
            <span>{{ recentTrades.length }} صفقة</span>
          </div>
          <div class="chart-wrap">
            <svg viewBox="0 0 340 160" preserveAspectRatio="none" class="price-chart">
              <defs>
                <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#fcd535" stop-opacity="0.32" />
                  <stop offset="100%" stop-color="#fcd535" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polyline v-if="chartPoints" :points="chartPoints" class="chart-line" />
              <polygon v-if="chartAreaPoints" :points="chartAreaPoints" class="chart-area" />
              <text v-if="!chartPoints" x="170" y="82" text-anchor="middle" class="empty-chart">لا توجد صفقات كافية بعد</text>
            </svg>
          </div>
        </section>

        <section class="trading-layout">
          <div class="panel order-entry">
            <div class="section-head"><h3>إدخال أمر</h3><span>Limit / Market</span></div>
            <div class="tabs">
              <button :class="tradeSide === 'buy' ? 'active buy' : ''" @click="setSide('buy')">شراء</button>
              <button :class="tradeSide === 'sell' ? 'active sell' : ''" @click="setSide('sell')">بيع</button>
            </div>
            <div class="order-types">
              <button :class="orderType === 'limit' ? 'selected' : ''" @click="orderType = 'limit'">Limit Order</button>
              <button :class="orderType === 'market' ? 'selected' : ''" @click="orderType = 'market'">Market Order</button>
            </div>

            <label class="input-label" v-if="orderType === 'limit'">السعر المحدد USDT</label>
            <input v-if="orderType === 'limit'" v-model.number="orderPrice" class="trade-input" type="number" min="0.01" step="0.01" />

            <label class="input-label">الكمية</label>
            <input v-model.number="orderQuantity" class="trade-input" type="number" min="1" step="1" />

            <div class="estimate-box">
              <span>القيمة التقديرية</span>
              <strong>{{ formatPrice(estimatedOrderValue) }} USDT</strong>
            </div>
            <div class="balance-line">
              <span>الرصيد</span><strong>{{ formatPrice(userBalance) }} USDT</strong>
            </div>
            <div class="balance-line">
              <span>الأسهم المتاحة</span><strong>{{ formatNumber(userShares?.shares || 0) }}</strong>
            </div>

            <div v-if="errorMessage" class="error-message"><i class="fas fa-exclamation-circle"></i>{{ errorMessage }}</div>
            <button class="submit-order" :class="tradeSide" :disabled="!isOrderValid || processing" @click="submitOrder">
              <i v-if="processing" class="fas fa-spinner fa-spin"></i>
              <span v-else>{{ tradeSide === 'buy' ? 'إرسال أمر شراء' : 'إرسال أمر بيع' }}</span>
            </button>
          </div>

          <div class="panel order-book">
            <div class="section-head"><h3>سجل الأوامر</h3><span>Order Book</span></div>
            <div class="book-header"><span>السعر</span><span>الكمية</span><span>الإجمالي</span></div>
            <div class="book-side asks">
              <div v-for="ask in displayAsks" :key="ask.price" class="book-row sell-row">
                <span>{{ formatPrice(ask.price) }}</span><span>{{ formatNumber(ask.quantity) }}</span><span>{{ formatPrice(ask.total) }}</span>
              </div>
            </div>
            <div class="mid-price" :class="priceChange >= 0 ? 'positive' : 'negative'">{{ formatPrice(stockData.currentPrice) }} USDT</div>
            <div class="book-side bids">
              <div v-for="bid in displayBids" :key="bid.price" class="book-row buy-row">
                <span>{{ formatPrice(bid.price) }}</span><span>{{ formatNumber(bid.quantity) }}</span><span>{{ formatPrice(bid.total) }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel trades-panel">
          <div class="section-head"><h3>آخر الصفقات المنفذة</h3><span>Live Trades</span></div>
          <div class="table-like">
            <div class="table-head"><span>السعر</span><span>الكمية</span><span>القيمة</span><span>الوقت</span></div>
            <div v-for="trade in recentTrades" :key="trade.id" class="table-row">
              <span class="gold">{{ formatPrice(trade.price) }}</span>
              <span>{{ formatNumber(trade.quantity) }}</span>
              <span>{{ formatPrice(trade.amount) }}</span>
              <span>{{ formatTime(trade.createdAt) }}</span>
            </div>
            <div v-if="recentTrades.length === 0" class="empty-state">لم يتم تنفيذ صفقات بعد.</div>
          </div>
        </section>

        <section class="portfolio-card" v-if="userShares">
          <h3>محفظتي</h3>
          <div class="portfolio-grid">
            <div><span>الأسهم القابلة للتداول</span><strong>{{ formatNumber(userShares.shares || 0) }}</strong></div>
            <div><span>متوسط التكلفة</span><strong>{{ formatPrice(userShares.avgPrice || 0) }}</strong></div>
            <div><span>القيمة السوقية</span><strong>{{ formatPrice((userShares.shares || 0) * stockData.currentPrice) }}</strong></div>
            <div><span>الربح/الخسارة غير المحققة</span><strong :class="portfolioProfit >= 0 ? 'positive' : 'negative'">{{ portfolioProfit >= 0 ? '+' : '' }}{{ formatPrice(portfolioProfit) }}</strong></div>
          </div>
        </section>
      </template>
    </div>

    <transition name="slide-down">
      <div v-if="showNotification" class="notification" :class="notificationType">{{ notificationMessage }}</div>
    </transition>
  </div>
</template>

<script>
import { auth, db, runTransaction, serverTimestamp, collection, doc, getDoc, setDoc, addDoc, onSnapshot } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { query, where, orderBy, limit, getDocs } from "firebase/firestore";

const STOCK_ID = "company";
const INITIAL_PRICE = 1.55;
const OPEN_STATUSES = ["open", "partial"];

export default {
  name: "Shares",
  data() {
    return {
      loading: true,
      processing: false,
      stockData: null,
      userShares: null,
      userBalance: 0,
      tradeSide: "buy",
      orderType: "limit",
      orderPrice: INITIAL_PRICE,
      orderQuantity: 1,
      orderBook: { bids: [], asks: [] },
      recentTrades: [],
      unsubscribers: [],
      errorMessage: "",
      showNotification: false,
      notificationMessage: "",
      notificationType: "success"
    };
  },
  computed: {
    priceChange() {
      if (!this.stockData) return 0;
      return (this.stockData.currentPrice || 0) - (this.stockData.openingPrice || this.stockData.previousPrice || 0);
    },
    priceChangePercent() {
      if (!this.stockData || !this.stockData.openingPrice) return 0;
      return (this.priceChange / this.stockData.openingPrice) * 100;
    },
    estimatedOrderValue() {
      const price = this.orderType === "market" ? (this.stockData?.currentPrice || INITIAL_PRICE) : this.orderPrice;
      return (Number(this.orderQuantity) || 0) * (Number(price) || 0);
    },
    isOrderValid() {
      if (!this.stockData || this.processing) return false;
      if (!this.orderQuantity || this.orderQuantity <= 0) return false;
      if (this.orderType === "limit" && (!this.orderPrice || this.orderPrice <= 0)) return false;
      if (this.tradeSide === "buy" && this.orderType === "limit" && this.estimatedOrderValue > this.userBalance) return false;
      if (this.tradeSide === "sell" && this.orderQuantity > (this.userShares?.shares || 0)) return false;
      return true;
    },
    displayBids() { return this.orderBook.bids.slice(0, 8); },
    displayAsks() { return this.orderBook.asks.slice(0, 8).reverse(); },
    portfolioProfit() {
      if (!this.userShares || !this.stockData) return 0;
      return ((this.userShares.shares || 0) * this.stockData.currentPrice) - (this.userShares.invested || 0);
    },
    chartPoints() {
      const points = this.recentTrades.slice().reverse();
      if (points.length < 2) return "";
      const prices = points.map(t => Number(t.price));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const range = max - min || 1;
      return points.map((t, i) => {
        const x = (i / (points.length - 1)) * 330 + 5;
        const y = 150 - (((Number(t.price) - min) / range) * 130) + 5;
        return `${x},${y}`;
      }).join(" ");
    },
    chartAreaPoints() {
      if (!this.chartPoints) return "";
      return `5,155 ${this.chartPoints} 335,155`;
    }
  },
  mounted() { this.initializePage(); },
  beforeUnmount() { this.unsubscribers.forEach(unsub => unsub && unsub()); },
  methods: {
    async initializePage() {
      onAuthStateChanged(auth, async (user) => {
        if (!user) { this.$router.push("/login"); return; }
        await this.ensureStockDataExists();
        await this.loadUserData();
        this.subscribeToMarket();
        this.loading = false;
      });
    },
    async ensureStockDataExists() {
      const stockRef = doc(db, "stock", STOCK_ID);
      const stockDoc = await getDoc(stockRef);
      if (!stockDoc.exists()) {
        const initialData = {
          currentPrice: INITIAL_PRICE,
          previousPrice: INITIAL_PRICE,
          openingPrice: INITIAL_PRICE,
          highPrice: INITIAL_PRICE,
          lowPrice: INITIAL_PRICE,
          dayVolume: 0,
          volume: 0,
          totalShares: 300000000,
          availableShares: 125000000,
          soldShares: 175000000,
          updatedAt: serverTimestamp()
        };
        await setDoc(stockRef, initialData);
        this.stockData = initialData;
      } else {
        this.stockData = { openingPrice: INITIAL_PRICE, highPrice: INITIAL_PRICE, lowPrice: INITIAL_PRICE, dayVolume: 0, ...stockDoc.data() };
      }
    },
    subscribeToMarket() {
      const stockUnsub = onSnapshot(doc(db, "stock", STOCK_ID), snap => {
        if (snap.exists()) this.stockData = { openingPrice: INITIAL_PRICE, ...snap.data() };
      });
      const ordersUnsub = onSnapshot(query(collection(db, "stockOrders"), where("status", "in", OPEN_STATUSES)), snap => {
        const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        this.buildOrderBook(orders);
      });
      const tradesUnsub = onSnapshot(query(collection(db, "stockTrades"), orderBy("createdAt", "desc"), limit(40)), snap => {
        this.recentTrades = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      });
      this.unsubscribers.push(stockUnsub, ordersUnsub, tradesUnsub);
    },
    buildOrderBook(orders) {
      const aggregate = (side) => {
        const map = new Map();
        orders.filter(o => o.side === side).forEach(o => {
          const price = Number(o.price || 0).toFixed(2);
          const quantity = Number(o.remainingQuantity || 0);
          const current = map.get(price) || { price: Number(price), quantity: 0, total: 0 };
          current.quantity += quantity;
          current.total += quantity * Number(price);
          map.set(price, current);
        });
        return [...map.values()].sort((a, b) => side === "buy" ? b.price - a.price : a.price - b.price);
      };
      this.orderBook = { bids: aggregate("buy"), asks: aggregate("sell") };
    },
    async loadUserData() {
      const user = auth.currentUser;
      if (!user) return;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      this.userBalance = userDoc.exists() ? (userDoc.data().balance || 0) : 0;
      const sharesDoc = await getDoc(doc(db, "users", user.uid, "shares", "portfolio"));
      this.userShares = sharesDoc.exists() ? sharesDoc.data() : { shares: 0, avgPrice: 0, invested: 0, realizedProfit: 0 };
    },
    setSide(side) { this.tradeSide = side; this.errorMessage = ""; },
    async submitOrder() {
      if (!this.isOrderValid) return;
      this.processing = true;
      this.errorMessage = "";
      try {
        if (this.orderType === "market") await this.executeMarketOrder();
        else await this.createLimitOrder();
        await this.matchOrders();
        await this.loadUserData();
        this.showNotificationMessage("success", "تم إرسال الأمر ومعالجة المطابقة بنجاح.");
      } catch (error) {
        console.error(error);
        this.errorMessage = error.message;
        this.showNotificationMessage("error", error.message);
      } finally {
        this.processing = false;
      }
    },
    async createLimitOrder() {
      const user = auth.currentUser;
      const orderRef = doc(collection(db, "stockOrders"));
      const quantity = Math.floor(Number(this.orderQuantity));
      const price = Number(this.orderPrice);
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.uid);
        const portfolioRef = doc(db, "users", user.uid, "shares", "portfolio");
        const userDoc = await transaction.get(userRef);
        const portfolioDoc = await transaction.get(portfolioRef);
        if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");
        const userData = userDoc.data();
        const portfolio = portfolioDoc.exists() ? portfolioDoc.data() : { shares: 0, invested: 0 };
        const order = {
          userId: user.uid,
          side: this.tradeSide,
          orderType: "limit",
          price,
          quantity,
          remainingQuantity: quantity,
          filledQuantity: 0,
          status: "open",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        if (this.tradeSide === "buy") {
          const reserve = price * quantity;
          if ((userData.balance || 0) < reserve) throw new Error("الرصيد غير كافٍ لحجز قيمة أمر الشراء.");
          transaction.update(userRef, { balance: (userData.balance || 0) - reserve });
          order.reservedAmount = reserve;
        } else {
          if ((portfolio.shares || 0) < quantity) throw new Error("لا تمتلك كمية كافية لإرسال أمر البيع.");
          const ratio = quantity / (portfolio.shares || 1);
          const costBasis = (portfolio.invested || 0) * ratio;
          const remainingShares = (portfolio.shares || 0) - quantity;
          const remainingInvested = (portfolio.invested || 0) - costBasis;
          transaction.set(portfolioRef, {
            ...portfolio,
            shares: remainingShares,
            invested: remainingInvested,
            avgPrice: remainingShares > 0 ? remainingInvested / remainingShares : 0,
            updatedAt: serverTimestamp()
          }, { merge: true });
          order.reservedShares = quantity;
          order.reservedCostBasis = costBasis;
        }
        transaction.set(orderRef, order);
      });
    },
    async executeMarketOrder() {
      const side = this.tradeSide;
      let remaining = Math.floor(Number(this.orderQuantity));
      const oppositeSide = side === "buy" ? "sell" : "buy";
      const openSnap = await getDocs(query(collection(db, "stockOrders"), where("side", "==", oppositeSide), where("status", "in", OPEN_STATUSES)));
      const candidates = openSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
        .sort((a, b) => oppositeSide === "sell" ? a.price - b.price : b.price - a.price);
      if (!candidates.length) throw new Error("لا توجد أوامر مقابلة كافية لتنفيذ أمر السوق حالياً.");
      for (const order of candidates) {
        if (remaining <= 0) break;
        const qty = Math.min(remaining, Number(order.remainingQuantity || 0));
        if (qty <= 0) continue;
        if (side === "buy") await this.executeMarketBuyAgainstSell(order, qty);
        else await this.executeMarketSellAgainstBuy(order, qty);
        remaining -= qty;
      }
      if (remaining > 0) this.showNotificationMessage("success", `تم تنفيذ جزء من أمر السوق، والكمية غير المنفذة: ${remaining}`);
    },
    async matchOrders() {
      for (let i = 0; i < 25; i++) {
        const snap = await getDocs(query(collection(db, "stockOrders"), where("status", "in", OPEN_STATUSES)));
        const orders = snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }));
        const bids = orders.filter(o => o.side === "buy").sort((a, b) => b.price - a.price || this.compareTime(a.createdAt, b.createdAt));
        const asks = orders.filter(o => o.side === "sell").sort((a, b) => a.price - b.price || this.compareTime(a.createdAt, b.createdAt));
        if (!bids.length || !asks.length || Number(bids[0].price) < Number(asks[0].price)) break;
        const qty = Math.min(Number(bids[0].remainingQuantity), Number(asks[0].remainingQuantity));
        const executionPrice = Number(asks[0].price);
        await this.executeLimitMatch(bids[0], asks[0], qty, executionPrice);
      }
    },
    async executeLimitMatch(buyOrder, sellOrder, qty, price) {
      await runTransaction(db, async (transaction) => {
        const buyRef = doc(db, "stockOrders", buyOrder.id);
        const sellRef = doc(db, "stockOrders", sellOrder.id);
        const buyerRef = doc(db, "users", buyOrder.userId);
        const sellerRef = doc(db, "users", sellOrder.userId);
        const buyerPortfolioRef = doc(db, "users", buyOrder.userId, "shares", "portfolio");
        const stockRef = doc(db, "stock", STOCK_ID);
        const [buyDoc, sellDoc, buyerDoc, sellerDoc, buyerPortfolioDoc, stockDoc] = await Promise.all([
          transaction.get(buyRef), transaction.get(sellRef), transaction.get(buyerRef), transaction.get(sellerRef), transaction.get(buyerPortfolioRef), transaction.get(stockRef)
        ]);
        if (!buyDoc.exists() || !sellDoc.exists()) throw new Error("تعذر قراءة أوامر المطابقة.");
        const buy = buyDoc.data();
        const sell = sellDoc.data();
        const executableQty = Math.min(qty, buy.remainingQuantity || 0, sell.remainingQuantity || 0);
        if (executableQty <= 0 || buy.price < sell.price) return;
        const amount = executableQty * price;
        const refund = Math.max(0, (buy.price - price) * executableQty);
        const costBasis = ((sell.reservedCostBasis || 0) / Math.max(1, sell.remainingQuantity || executableQty)) * executableQty;
        const buyerPortfolio = buyerPortfolioDoc.exists() ? buyerPortfolioDoc.data() : { shares: 0, invested: 0, avgPrice: 0 };
        const newBuyerShares = (buyerPortfolio.shares || 0) + executableQty;
        const newBuyerInvested = (buyerPortfolio.invested || 0) + amount;
        transaction.update(buyerRef, { balance: (buyerDoc.data().balance || 0) + refund });
        transaction.update(sellerRef, { balance: (sellerDoc.data().balance || 0) + amount });
        transaction.set(buyerPortfolioRef, {
          shares: newBuyerShares,
          invested: newBuyerInvested,
          avgPrice: newBuyerShares > 0 ? newBuyerInvested / newBuyerShares : 0,
          updatedAt: serverTimestamp()
        }, { merge: true });
        this.updateOrderAfterFill(transaction, buyRef, buy, executableQty, { reservedAmount: (buy.reservedAmount || 0) - (buy.price * executableQty) });
        this.updateOrderAfterFill(transaction, sellRef, sell, executableQty, { reservedCostBasis: Math.max(0, (sell.reservedCostBasis || 0) - costBasis), reservedShares: Math.max(0, (sell.reservedShares || 0) - executableQty) });
        this.recordTradeInTransaction(transaction, { buyerId: buy.userId, sellerId: sell.userId, buyOrderId: buyOrder.id, sellOrderId: sellOrder.id, price, quantity: executableQty, amount, sellerCostBasis: costBasis });
        this.updateStockAfterTrade(transaction, stockDoc, stockRef, price, executableQty, amount);
      });
    },
    async executeMarketBuyAgainstSell(sellOrder, qty) {
      const user = auth.currentUser;
      await runTransaction(db, async (transaction) => {
        const sellRef = doc(db, "stockOrders", sellOrder.id);
        const buyerRef = doc(db, "users", user.uid);
        const sellerRef = doc(db, "users", sellOrder.userId);
        const buyerPortfolioRef = doc(db, "users", user.uid, "shares", "portfolio");
        const stockRef = doc(db, "stock", STOCK_ID);
        const [sellDoc, buyerDoc, sellerDoc, buyerPortfolioDoc, stockDoc] = await Promise.all([transaction.get(sellRef), transaction.get(buyerRef), transaction.get(sellerRef), transaction.get(buyerPortfolioRef), transaction.get(stockRef)]);
        const sell = sellDoc.data();
        const executableQty = Math.min(qty, sell.remainingQuantity || 0);
        const price = Number(sell.price);
        const amount = executableQty * price;
        if ((buyerDoc.data().balance || 0) < amount) throw new Error("الرصيد غير كافٍ لتنفيذ أمر السوق.");
        const costBasis = ((sell.reservedCostBasis || 0) / Math.max(1, sell.remainingQuantity || executableQty)) * executableQty;
        const portfolio = buyerPortfolioDoc.exists() ? buyerPortfolioDoc.data() : { shares: 0, invested: 0 };
        const newShares = (portfolio.shares || 0) + executableQty;
        const newInvested = (portfolio.invested || 0) + amount;
        transaction.update(buyerRef, { balance: (buyerDoc.data().balance || 0) - amount });
        transaction.update(sellerRef, { balance: (sellerDoc.data().balance || 0) + amount });
        transaction.set(buyerPortfolioRef, { shares: newShares, invested: newInvested, avgPrice: newShares ? newInvested / newShares : 0, updatedAt: serverTimestamp() }, { merge: true });
        this.updateOrderAfterFill(transaction, sellRef, sell, executableQty, { reservedCostBasis: Math.max(0, (sell.reservedCostBasis || 0) - costBasis), reservedShares: Math.max(0, (sell.reservedShares || 0) - executableQty) });
        this.recordTradeInTransaction(transaction, { buyerId: user.uid, sellerId: sell.userId, buyOrderId: "market", sellOrderId: sellOrder.id, price, quantity: executableQty, amount, sellerCostBasis: costBasis });
        this.updateStockAfterTrade(transaction, stockDoc, stockRef, price, executableQty, amount);
      });
    },
    async executeMarketSellAgainstBuy(buyOrder, qty) {
      const user = auth.currentUser;
      await runTransaction(db, async (transaction) => {
        const buyRef = doc(db, "stockOrders", buyOrder.id);
        const sellerRef = doc(db, "users", user.uid);
        const buyerRef = doc(db, "users", buyOrder.userId);
        const sellerPortfolioRef = doc(db, "users", user.uid, "shares", "portfolio");
        const buyerPortfolioRef = doc(db, "users", buyOrder.userId, "shares", "portfolio");
        const stockRef = doc(db, "stock", STOCK_ID);
        const [buyDoc, sellerDoc, buyerDoc, sellerPortfolioDoc, buyerPortfolioDoc, stockDoc] = await Promise.all([transaction.get(buyRef), transaction.get(sellerRef), transaction.get(buyerRef), transaction.get(sellerPortfolioRef), transaction.get(buyerPortfolioRef), transaction.get(stockRef)]);
        const buy = buyDoc.data();
        const sellerPortfolio = sellerPortfolioDoc.exists() ? sellerPortfolioDoc.data() : { shares: 0, invested: 0 };
        const executableQty = Math.min(qty, buy.remainingQuantity || 0, sellerPortfolio.shares || 0);
        if (executableQty <= 0) throw new Error("لا توجد أسهم كافية لتنفيذ أمر السوق.");
        const price = Number(buy.price);
        const amount = executableQty * price;
        const ratio = executableQty / Math.max(1, sellerPortfolio.shares || executableQty);
        const costBasis = (sellerPortfolio.invested || 0) * ratio;
        const sellerRemainingShares = (sellerPortfolio.shares || 0) - executableQty;
        const sellerRemainingInvested = (sellerPortfolio.invested || 0) - costBasis;
        const buyerPortfolio = buyerPortfolioDoc.exists() ? buyerPortfolioDoc.data() : { shares: 0, invested: 0 };
        const buyerShares = (buyerPortfolio.shares || 0) + executableQty;
        const buyerInvested = (buyerPortfolio.invested || 0) + amount;
        transaction.update(sellerRef, { balance: (sellerDoc.data().balance || 0) + amount });
        transaction.set(sellerPortfolioRef, { shares: sellerRemainingShares, invested: sellerRemainingInvested, avgPrice: sellerRemainingShares ? sellerRemainingInvested / sellerRemainingShares : 0, realizedProfit: (sellerPortfolio.realizedProfit || 0) + (amount - costBasis), updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(buyerPortfolioRef, { shares: buyerShares, invested: buyerInvested, avgPrice: buyerShares ? buyerInvested / buyerShares : 0, updatedAt: serverTimestamp() }, { merge: true });
        this.updateOrderAfterFill(transaction, buyRef, buy, executableQty, { reservedAmount: Math.max(0, (buy.reservedAmount || 0) - (buy.price * executableQty)) });
        this.recordTradeInTransaction(transaction, { buyerId: buy.userId, sellerId: user.uid, buyOrderId: buyOrder.id, sellOrderId: "market", price, quantity: executableQty, amount, sellerCostBasis: costBasis });
        this.updateStockAfterTrade(transaction, stockDoc, stockRef, price, executableQty, amount);
      });
    },
    updateOrderAfterFill(transaction, orderRef, order, filledQty, extra = {}) {
      const remaining = Math.max(0, (order.remainingQuantity || 0) - filledQty);
      transaction.update(orderRef, {
        remainingQuantity: remaining,
        filledQuantity: (order.filledQuantity || 0) + filledQty,
        status: remaining === 0 ? "filled" : "partial",
        updatedAt: serverTimestamp(),
        ...extra
      });
    },
    recordTradeInTransaction(transaction, trade) {
      const tradeRef = doc(collection(db, "stockTrades"));
      transaction.set(tradeRef, { ...trade, symbol: "PTR/USDT", createdAt: serverTimestamp() });
      const buyerTx = doc(collection(db, "transactions"));
      const sellerTx = doc(collection(db, "transactions"));
      transaction.set(buyerTx, { userId: trade.buyerId, type: "stock_buy", quantity: trade.quantity, price: trade.price, amount: trade.amount, status: "completed", tradeId: tradeRef.id, createdAt: serverTimestamp() });
      transaction.set(sellerTx, { userId: trade.sellerId, type: "stock_sell", quantity: trade.quantity, price: trade.price, amount: trade.amount, profitLoss: trade.amount - (trade.sellerCostBasis || 0), status: "completed", tradeId: tradeRef.id, createdAt: serverTimestamp() });
    },
    updateStockAfterTrade(transaction, stockDoc, stockRef, price, quantity, amount) {
      const stock = stockDoc.exists() ? stockDoc.data() : { openingPrice: price, highPrice: price, lowPrice: price, dayVolume: 0, volume: 0, currentPrice: price };
      transaction.set(stockRef, {
        previousPrice: stock.currentPrice || price,
        currentPrice: price,
        openingPrice: stock.openingPrice || price,
        highPrice: Math.max(stock.highPrice || price, price),
        lowPrice: Math.min(stock.lowPrice || price, price),
        dayVolume: (stock.dayVolume || 0) + quantity,
        volume: (stock.volume || 0) + amount,
        updatedAt: serverTimestamp()
      }, { merge: true });
    },
    compareTime(a, b) {
      const ta = a?.toMillis ? a.toMillis() : 0;
      const tb = b?.toMillis ? b.toMillis() : 0;
      return ta - tb;
    },
    showNotificationMessage(type, message) {
      this.notificationType = type;
      this.notificationMessage = message;
      this.showNotification = true;
      setTimeout(() => { this.showNotification = false; }, 3500);
    },
    formatPrice(value) { return Number(value || 0).toFixed(2); },
    formatNumber(value) { return Number(value || 0).toLocaleString("en-US"); },
    formatVolume(value) {
      const n = Number(value || 0);
      if (n >= 1000000000) return (n / 1000000000).toFixed(2) + "B";
      if (n >= 1000000) return (n / 1000000).toFixed(2) + "M";
      if (n >= 1000) return (n / 1000).toFixed(2) + "K";
      return this.formatNumber(n);
    },
    formatTime(ts) {
      if (!ts) return "--";
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    },
    goBack() { this.$router.push("/vip"); },
    goToHistory() { this.$router.push("/trading-history"); }
  }
};
</script>

<style scoped>
*{box-sizing:border-box;margin:0;padding:0}.shares-page{min-height:100vh;background:#0b0e11;color:#fff;direction:rtl;padding:15px;font-family:'Cairo',sans-serif}.container{max-width:1180px;margin:0 auto}.shares-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.page-title{font-size:22px;font-weight:900;color:#fcd535;text-shadow:0 0 15px rgba(252,213,53,.28)}.back-btn,.history-btn{width:42px;height:42px;border-radius:50%;border:1px solid rgba(252,213,53,.35);background:rgba(255,255,255,.06);color:#fcd535;cursor:pointer}.hero-card,.panel,.portfolio-card,.chart-card,.market-summary,.ticker-item{background:#181a20;border:1px solid rgba(252,213,53,.22);border-radius:18px;box-shadow:0 8px 28px rgba(0,0,0,.28)}.hero-card{display:flex;justify-content:space-between;align-items:center;padding:20px;margin-bottom:14px;background:linear-gradient(135deg,#1a1f2e,#141820)}.company-info{display:flex;align-items:center;gap:14px}.logo-icon{font-size:42px}.company-info h2{color:#fcd535;font-size:22px;font-weight:900}.symbol{color:#848e9c;font-weight:700}.status-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:800}.status-badge.open{color:#00ff88;background:rgba(0,255,136,.08);border:1px solid rgba(0,255,136,.25)}.pulse-dot{width:8px;height:8px;background:#00ff88;border-radius:50%;animation:pulse 1.7s infinite}@keyframes pulse{50%{opacity:.35;transform:scale(1.35)}}.market-summary{display:flex;justify-content:space-between;align-items:center;padding:18px;margin-bottom:14px}.last-price .label{display:block;color:#848e9c;font-size:12px;font-weight:700}.last-price strong{font-size:42px;font-weight:900}.currency{color:#848e9c;margin-right:8px}.positive{color:#00c076!important}.negative{color:#f6465d!important}.positive-bg{background:rgba(0,192,118,.12);color:#00c076}.negative-bg{background:rgba(246,70,93,.12);color:#f6465d}.change-box{border-radius:12px;padding:10px 14px;font-weight:900}.ticker-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}.ticker-item{padding:14px;text-align:center}.ticker-item span{display:block;color:#848e9c;font-size:12px;margin-bottom:6px}.ticker-item strong{font-size:16px}.chart-card{padding:16px;margin-bottom:14px}.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.section-head h3{font-size:17px;color:#fcd535;font-weight:900}.section-head span{font-size:11px;color:#848e9c;font-weight:700}.chart-wrap{height:180px;background:linear-gradient(180deg,rgba(252,213,53,.06),rgba(255,255,255,.01));border-radius:14px;border:1px solid rgba(255,255,255,.06);padding:8px}.price-chart{width:100%;height:100%}.chart-line{fill:none;stroke:#fcd535;stroke-width:3;filter:drop-shadow(0 0 8px rgba(252,213,53,.5))}.chart-area{fill:url(#chartFill);stroke:none}.empty-chart{fill:#848e9c;font-size:13px}.trading-layout{display:grid;grid-template-columns:1fr 1.25fr;gap:14px;margin-bottom:14px}.panel{padding:16px}.tabs,.order-types{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.tabs button,.order-types button{padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;font-weight:900;cursor:pointer}.tabs button.active.buy{background:#00c076;border-color:#00c076}.tabs button.active.sell{background:#f6465d;border-color:#f6465d}.order-types button.selected{border-color:#fcd535;color:#fcd535;background:rgba(252,213,53,.08)}.input-label{display:block;color:#848e9c;font-size:12px;font-weight:800;margin:10px 0 7px}.trade-input{width:100%;padding:13px;border-radius:12px;border:1px solid rgba(252,213,53,.28);background:rgba(255,255,255,.04);color:#fff;font-size:16px;outline:none}.trade-input:focus{border-color:#fcd535;box-shadow:0 0 0 3px rgba(252,213,53,.1)}.estimate-box,.balance-line{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:12px;border-radius:12px;background:rgba(255,255,255,.035);color:#cfd3dc;font-size:13px}.estimate-box strong,.balance-line strong,.gold{color:#fcd535}.submit-order{width:100%;border:0;border-radius:14px;padding:15px;margin-top:14px;color:#fff;font-size:15px;font-weight:900;cursor:pointer}.submit-order.buy{background:linear-gradient(135deg,#00c076,#008f57)}.submit-order.sell{background:linear-gradient(135deg,#f6465d,#b91c32)}.submit-order:disabled{opacity:.45;cursor:not-allowed}.book-header,.book-row,.table-head,.table-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px;border-radius:8px;font-size:12px}.book-header{color:#848e9c;font-weight:800}.book-row span:first-child,.buy-row{color:#00c076}.sell-row{color:#f6465d}.book-row{position:relative;background:rgba(255,255,255,.025);margin-bottom:3px}.mid-price{text-align:center;font-size:22px;font-weight:900;padding:12px;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08);margin:8px 0}.trades-panel{margin-bottom:14px}.table-head,.table-row{grid-template-columns:repeat(4,1fr)}.table-head{color:#848e9c;font-weight:900;border-bottom:1px solid rgba(255,255,255,.08)}.table-row{border-bottom:1px solid rgba(255,255,255,.04)}.empty-state{text-align:center;color:#848e9c;padding:18px}.portfolio-card{padding:18px;margin-bottom:24px}.portfolio-card h3{color:#fcd535;text-align:center;margin-bottom:14px}.portfolio-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.portfolio-grid div{background:rgba(255,255,255,.035);border-radius:12px;padding:13px;text-align:center}.portfolio-grid span{display:block;color:#848e9c;font-size:11px;margin-bottom:6px}.portfolio-grid strong{font-size:15px}.loading-card{text-align:center;padding:60px 20px}.gold-spinner{width:46px;height:46px;border:4px solid rgba(252,213,53,.1);border-top-color:#fcd535;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 14px}@keyframes spin{to{transform:rotate(360deg)}}.loading-text{color:#fcd535;font-weight:800}.error-message{margin-top:12px;padding:10px;border-radius:10px;background:rgba(246,70,93,.09);border:1px solid rgba(246,70,93,.25);color:#f6465d;font-size:12px;display:flex;gap:8px}.notification{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:3000;padding:13px 18px;border-radius:12px;font-weight:900;box-shadow:0 12px 30px rgba(0,0,0,.35)}.notification.success{background:#00c076;color:#fff}.notification.error{background:#f6465d;color:#fff}@media(max-width:850px){.container{max-width:520px}.ticker-grid,.portfolio-grid{grid-template-columns:repeat(2,1fr)}.trading-layout{grid-template-columns:1fr}.market-summary{align-items:flex-start;gap:12px;flex-direction:column}.last-price strong{font-size:34px}}@media(max-width:430px){.ticker-grid,.portfolio-grid{grid-template-columns:1fr}.hero-card{flex-direction:column;gap:12px}.table-head,.table-row{font-size:10px}}
</style>
