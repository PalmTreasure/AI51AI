<template>
  <div class="shares-page">
    <div class="container">
      <!-- Header -->
      <div class="shares-header">
        <button @click="goBack" class="back-btn">
          <i class="fas fa-arrow-right"></i>
        </button>
        <h1 class="page-title">📈 أسهم الشركة</h1>
        <div class="header-spacer"></div>
      </div>

      <!-- Company Info Card -->
      <div class="company-card">
        <div class="company-logo">
          <div class="logo-icon">🏦</div>
          <h2 class="company-name">Palm Treasure</h2>
        </div>
        <div class="stock-status">
          <span class="status-badge open">
            <span class="pulse-dot"></span>
            السوق مفتوح
          </span>
        </div>
      </div>

      <!-- Stock Price Card -->
      <div class="price-card" v-if="stockData">
        <div class="price-main">
          <div class="current-price">
            <span class="price-value">{{ formatPrice(stockData.currentPrice) }}</span>
            <span class="currency">USDT</span>
          </div>
          <div class="price-change" :class="priceChange >= 0 ? 'positive' : 'negative'">
            <i :class="priceChange >= 0 ? 'fas fa-caret-up' : 'fas fa-caret-down'"></i>
            <span>{{ formatPrice(Math.abs(priceChange)) }}</span>
            <span>({{ priceChangePercent >= 0 ? '+' : '' }}{{ formatPrice(priceChangePercent) }}%)</span>
          </div>
        </div>
        
        <div class="price-details">
          <div class="detail-item">
            <span class="detail-label">أعلى سعر</span>
            <span class="detail-value high">{{ formatPrice(stockData.highPrice) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">أدنى سعر</span>
            <span class="detail-value low">{{ formatPrice(stockData.lowPrice) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">حجم التداول</span>
            <span class="detail-value">{{ formatVolume(stockData.volume) }}</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-card">
        <div class="gold-spinner"></div>
        <div class="loading-text">جاري تحميل البيانات...</div>
      </div>

      <!-- Shares Statistics -->
      <div class="stats-card" v-if="!loading && stockData">
        <h3 class="stats-title">📊 إحصائيات الأسهم</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">إجمالي الأسهم</span>
            <span class="stat-value">{{ formatNumber(stockData.totalShares) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">الأسهم المباعة</span>
            <span class="stat-value">{{ formatNumber(stockData.soldShares) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">الأسهم المتاحة</span>
            <span class="stat-value highlight">{{ formatNumber(stockData.availableShares) }}</span>
          </div>
          <div class="stat-item full-width">
            <span class="stat-label">نسبة البيع</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: soldPercentage + '%' }"></div>
            </div>
            <span class="stat-value">{{ formatPrice(soldPercentage) }}%</span>
          </div>
        </div>
        <div v-if="stockData.availableShares <= 0" class="sold-out-message">
          🚫 تم بيع جميع أسهم الشركة
        </div>
      </div>

      <!-- Price Info -->
      <div class="simulator-info" v-if="!loading && stockData">
        <div class="simulator-header">
          <i class="fas fa-robot"></i>
          <span>بيانات السوق - مباشر</span>
        </div>
        <div class="simulator-stats">
          <div class="sim-stat">
            <span class="sim-label">آخر تحديث</span>
            <span class="sim-value">{{ lastUpdateTime }}</span>
          </div>
          <div class="sim-stat">
            <span class="sim-label">سعر الافتتاح اليومي</span>
            <span class="sim-value">{{ formatPrice(stockData.openingPrice || stockData.currentPrice) }} USDT</span>
          </div>
          <div class="sim-stat">
            <span class="sim-label">التغير اليومي</span>
            <span class="sim-value" :class="dailyChange >= 0 ? 'profit' : 'loss'">
              {{ dailyChange >= 0 ? '+' : '' }}{{ formatPrice(dailyChange) }} USDT
            </span>
          </div>
        </div>
      </div>

      <!-- User Portfolio -->
      <div class="portfolio-card" v-if="!loading && userShares">
        <h3 class="portfolio-title">💼 محفظتي</h3>
        <div class="portfolio-grid">
          <div class="portfolio-item">
            <span class="portfolio-label">الأسهم المملوكة</span>
            <span class="portfolio-value">{{ userShares.shares }}</span>
          </div>
          <div class="portfolio-item">
            <span class="portfolio-label">متوسط سعر الشراء</span>
            <span class="portfolio-value">{{ formatPrice(userShares.avgPrice) }} USDT</span>
          </div>
          <div class="portfolio-item">
            <span class="portfolio-label">القيمة الحالية</span>
            <span class="portfolio-value">{{ formatPrice(userShares.shares * stockData.currentPrice) }} USDT</span>
          </div>
          <div class="portfolio-item">
            <span class="portfolio-label">إجمالي الاستثمار</span>
            <span class="portfolio-value">{{ formatPrice(userShares.invested) }} USDT</span>
          </div>
          <div class="portfolio-item full-width">
            <span class="portfolio-label">الربح/الخسارة</span>
            <span class="portfolio-value" :class="portfolioProfit >= 0 ? 'profit' : 'loss'">
              {{ portfolioProfit >= 0 ? '+' : '' }}{{ formatPrice(portfolioProfit) }} USDT
              ({{ profitPercentage >= 0 ? '+' : '' }}{{ formatPrice(profitPercentage) }}%)
            </span>
          </div>
        </div>
      </div>

      <!-- Trade Buttons -->
      <div class="trade-buttons" v-if="!loading && stockData">
        <button 
          @click="openTradeModal('buy')" 
          class="trade-btn buy-btn"
          :disabled="stockData.availableShares <= 0"
        >
          <i class="fas fa-shopping-cart"></i>
          شراء الأسهم
        </button>
        <button 
          @click="openTradeModal('sell')" 
          class="trade-btn sell-btn"
          :disabled="!userShares || userShares.shares <= 0"
        >
          <i class="fas fa-money-bill-wave"></i>
          بيع الأسهم
        </button>
      </div>
    </div>

    <!-- Trade Modal -->
    <transition name="modal-fade-scale">
      <div v-if="showTradeModal" class="modal-overlay" @click.self="closeTradeModal">
        <div class="modal-content trade-modal">
          <div class="modal-header">
            <h3>{{ tradeType === 'buy' ? '🛒 شراء الأسهم' : '💰 بيع الأسهم' }}</h3>
            <button class="close-btn" @click="closeTradeModal">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="trade-info">
              <div class="info-row">
                <span>السعر الحالي:</span>
                <span class="price-highlight">{{ formatPrice(stockData.currentPrice) }} USDT</span>
              </div>
              <div class="info-row" v-if="tradeType === 'buy'">
                <span>الأسهم المتاحة:</span>
                <span class="price-highlight">{{ formatNumber(stockData.availableShares) }}</span>
              </div>
              <div class="info-row" v-else>
                <span>أسهمك:</span>
                <span class="price-highlight">{{ userShares ? userShares.shares : 0 }}</span>
              </div>
            </div>

            <div class="input-group">
              <label>عدد الأسهم</label>
              <input 
                v-model.number="tradeQuantity" 
                type="number" 
                min="1" 
                :max="maxTradeQuantity"
                placeholder="أدخل عدد الأسهم"
                class="trade-input"
                @input="validateQuantity"
              />
            </div>

            <div class="total-calculation">
              <span>المجموع:</span>
              <span class="total-value">{{ formatPrice(tradeQuantity * stockData.currentPrice) }} USDT</span>
            </div>

            <div v-if="tradeType === 'buy'" class="balance-info">
              <span>رصيدك:</span>
              <span class="balance-value">{{ formatPrice(userBalance) }} USDT</span>
            </div>

            <div v-if="errorMessage" class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              {{ errorMessage }}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeTradeModal">إلغاء</button>
            <button 
              class="btn-confirm" 
              @click="executeTrade"
              :disabled="!isTradeValid || processing"
            >
              <i v-if="processing" class="fas fa-spinner fa-spin"></i>
              <span v-else>{{ tradeType === 'buy' ? 'تأكيد الشراء' : 'تأكيد البيع' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Notification -->
    <transition name="slide-down">
      <div v-if="showNotification" class="notification" :class="notificationType">
        <i :class="notificationType === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
        {{ notificationMessage }}
      </div>
    </transition>
  </div>
</template>

<script>
import { auth, db, runTransaction, serverTimestamp, collection, doc, getDoc, setDoc, addDoc, onSnapshot } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: "Shares",
  data() {
    return {
      loading: true,
      processing: false,
      stockData: null,
      userShares: null,
      userBalance: 0,
      showTradeModal: false,
      tradeType: 'buy',
      tradeQuantity: 1,
      errorMessage: '',
      showNotification: false,
      notificationMessage: '',
      notificationType: 'success',
      unsubscribeStock: null,
      lastUpdateTime: '--',
      dailyChange: 0,
      stockReady: false
    };
  },

  computed: {
    priceChange() {
      if (!this.stockData) return 0;
      return this.stockData.currentPrice - this.stockData.previousPrice;
    },
    priceChangePercent() {
      if (!this.stockData || this.stockData.previousPrice === 0) return 0;
      return (this.priceChange / this.stockData.previousPrice) * 100;
    },
    soldPercentage() {
      if (!this.stockData || this.stockData.totalShares === 0) return 0;
      return (this.stockData.soldShares / this.stockData.totalShares) * 100;
    },
    maxTradeQuantity() {
      if (!this.stockData) return 0;
      if (this.tradeType === 'buy') {
        return this.stockData.availableShares;
      } else {
        return this.userShares ? this.userShares.shares : 0;
      }
    },
    isTradeValid() {
      if (!this.tradeQuantity || this.tradeQuantity <= 0 || !this.stockData) return false;
      if (this.tradeQuantity > this.maxTradeQuantity) return false;
      
      if (this.tradeType === 'buy') {
        const totalCost = this.tradeQuantity * this.stockData.currentPrice;
        if (totalCost > this.userBalance) return false;
      }
      
      return true;
    },
    portfolioProfit() {
      if (!this.userShares || !this.stockData) return 0;
      const currentValue = this.userShares.shares * this.stockData.currentPrice;
      return currentValue - this.userShares.invested;
    },
    profitPercentage() {
      if (!this.userShares || !this.stockData || this.userShares.invested === 0) return 0;
      const currentValue = this.userShares.shares * this.stockData.currentPrice;
      return ((currentValue - this.userShares.invested) / this.userShares.invested) * 100;
    }
  },

  mounted() {
    this.initializePage();
  },

  beforeUnmount() {
    if (this.unsubscribeStock) {
      this.unsubscribeStock();
    }
  },

  methods: {
    async initializePage() {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.$router.push("/login");
          return;
        }
        await this.ensureStockDataExists();
        await this.loadUserData();
        this.subscribeToStockUpdates();
        this.loading = false;
        this.stockReady = true;
      });
    },

    async ensureStockDataExists() {
      try {
        const stockRef = doc(db, "stock", "company");
        const stockDoc = await getDoc(stockRef);
        
        if (stockDoc.exists()) {
          const data = stockDoc.data();
          this.stockData = {
            currentPrice: data.currentPrice || 1.50,
            previousPrice: data.previousPrice || 1.50,
            highPrice: data.highPrice || 1.80,
            lowPrice: data.lowPrice || 0.10,
            volume: data.volume || 100000000,
            totalShares: data.totalShares || 300000000,
            availableShares: data.availableShares || 125000000,
            soldShares: data.soldShares || 175000000,
            openingPrice: data.openingPrice || data.currentPrice || 1.50,
            updatedAt: data.updatedAt
          };
          this.dailyChange = this.stockData.currentPrice - this.stockData.openingPrice;
          this.lastUpdateTime = data.updatedAt ? new Date(data.updatedAt.toDate()).toLocaleTimeString('ar-SA') : '--';
        } else {
          // إنشاء البيانات الأولية في Firestore
          const initialData = {
            currentPrice: 1.50,
            previousPrice: 1.50,
            highPrice: 1.80,
            lowPrice: 0.10,
            volume: 100000000,
            totalShares: 300000000,
            availableShares: 125000000,
            soldShares: 175000000,
            openingPrice: 1.50,
            updatedAt: serverTimestamp()
          };
          
          await setDoc(stockRef, initialData);
          
          this.stockData = { ...initialData };
          this.dailyChange = 0;
          this.lastUpdateTime = new Date().toLocaleTimeString('ar-SA');
        }
      } catch (error) {
        console.error("Error ensuring stock data:", error);
        this.stockData = {
          currentPrice: 1.50,
          previousPrice: 1.50,
          highPrice: 1.80,
          lowPrice: 0.10,
          volume: 100000000,
          totalShares: 300000000,
          availableShares: 125000000,
          soldShares: 175000000,
          openingPrice: 1.50
        };
        this.stockReady = true;
      }
    },

    subscribeToStockUpdates() {
      // الاستماع للتحديثات من Firestore مباشرة
      const stockRef = doc(db, "stock", "company");
      this.unsubscribeStock = onSnapshot(stockRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          this.stockData = {
            currentPrice: data.currentPrice || 1.50,
            previousPrice: data.previousPrice || 1.50,
            highPrice: data.highPrice || 1.80,
            lowPrice: data.lowPrice || 0.10,
            volume: data.volume || 100000000,
            totalShares: data.totalShares || 300000000,
            availableShares: data.availableShares || 125000000,
            soldShares: data.soldShares || 175000000,
            openingPrice: data.openingPrice || data.currentPrice || 1.50,
            updatedAt: data.updatedAt
          };
          
          this.dailyChange = this.stockData.currentPrice - this.stockData.openingPrice;
          
          if (data.updatedAt) {
            this.lastUpdateTime = new Date(data.updatedAt.toDate()).toLocaleTimeString('ar-SA');
          }
        }
      });
    },

    async loadUserData() {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          this.userBalance = userDoc.data().balance || 0;
        }

        const sharesDoc = await getDoc(doc(db, "users", user.uid, "shares", "portfolio"));
        if (sharesDoc.exists()) {
          this.userShares = sharesDoc.data();
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    },

    openTradeModal(type) {
      if (!this.stockData || !this.stockReady) {
        this.showNotificationMessage('error', '❌ جاري تحميل بيانات السهم، يرجى الانتظار لحظة...');
        return;
      }
      this.tradeType = type;
      this.tradeQuantity = 1;
      this.errorMessage = '';
      this.showTradeModal = true;
    },

    closeTradeModal() {
      this.showTradeModal = false;
      this.tradeQuantity = 1;
      this.errorMessage = '';
    },

    validateQuantity() {
      this.errorMessage = '';
      
      if (!this.tradeQuantity || this.tradeQuantity <= 0) {
        this.errorMessage = 'يجب أن يكون عدد الأسهم أكبر من 0';
        return;
      }
      
      if (this.tradeQuantity > this.maxTradeQuantity) {
        this.errorMessage = `لا يمكنك ${this.tradeType === 'buy' ? 'شراء' : 'بيع'} أكثر من ${this.formatNumber(this.maxTradeQuantity)} سهم`;
        return;
      }
      
      if (this.tradeType === 'buy' && this.stockData) {
        const totalCost = this.tradeQuantity * this.stockData.currentPrice;
        if (totalCost > this.userBalance) {
          this.errorMessage = 'رصيدك غير كافٍ لإتمام عملية الشراء';
          return;
        }
      }
    },

    async executeTrade() {
      if (!this.isTradeValid || !this.stockData || !this.stockReady) {
        this.showNotificationMessage('error', '❌ بيانات السهم غير متوفرة، يرجى المحاولة لاحقاً');
        return;
      }
      
      this.processing = true;
      
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("يجب تسجيل الدخول أولاً");
        
        const quantity = this.tradeQuantity;
        const price = this.stockData.currentPrice;
        const totalAmount = quantity * price;
        
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, "users", user.uid);
          const stockRef = doc(db, "stock", "company");
          const sharesRef = doc(db, "users", user.uid, "shares", "portfolio");
          
          // ✅ جميع عمليات القراءة أولاً
          const userDoc = await transaction.get(userRef);
          const stockDoc = await transaction.get(stockRef);
          const sharesDoc = await transaction.get(sharesRef);
          
          if (!userDoc.exists()) throw new Error("المستخدم غير موجود");
          
          let stockDataFromDB;
          if (!stockDoc.exists()) {
            stockDataFromDB = {
              currentPrice: 1.50,
              previousPrice: 1.50,
              highPrice: 1.80,
              lowPrice: 0.10,
              volume: 100000000,
              totalShares: 300000000,
              availableShares: 125000000,
              soldShares: 175000000,
              openingPrice: 1.50,
              updatedAt: serverTimestamp()
            };
            transaction.set(stockRef, stockDataFromDB);
          } else {
            stockDataFromDB = stockDoc.data();
          }
          
          const userData = userDoc.data();
          const userBalance = userData.balance || 0;
          
          if (this.tradeType === 'buy') {
            const availableShares = stockDataFromDB.availableShares || 125000000;
            
            if (availableShares < quantity) {
              throw new Error("الأسهم المتاحة غير كافية");
            }
            
            if (userBalance < totalAmount) {
              throw new Error("رصيدك غير كافٍ");
            }
            
            // ✅ جميع عمليات الكتابة بعد القراءة
            transaction.update(userRef, {
              balance: userBalance - totalAmount
            });
            
            transaction.update(stockRef, {
              availableShares: availableShares - quantity,
              soldShares: (stockDataFromDB.soldShares || 175000000) + quantity,
              volume: (stockDataFromDB.volume || 100000000) + totalAmount,
              previousPrice: stockDataFromDB.currentPrice,
              updatedAt: serverTimestamp()
            });
            
            if (sharesDoc.exists()) {
              const currentShares = sharesDoc.data();
              const newTotalShares = (currentShares.shares || 0) + quantity;
              const newInvested = (currentShares.invested || 0) + totalAmount;
              const newAvgPrice = newInvested / newTotalShares;
              
              transaction.update(sharesRef, {
                shares: newTotalShares,
                avgPrice: newAvgPrice,
                invested: newInvested,
                updatedAt: serverTimestamp()
              });
            } else {
              transaction.set(sharesRef, {
                shares: quantity,
                avgPrice: price,
                invested: totalAmount,
                totalProfit: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          } else {
            // بيع
            if (!sharesDoc.exists()) throw new Error("لا تمتلك أي أسهم");
            
            const currentShares = sharesDoc.data();
            const userSharesCount = currentShares.shares || 0;
            
            if (userSharesCount < quantity) {
              throw new Error("لا تمتلك هذا العدد من الأسهم");
            }
            
            const newShares = userSharesCount - quantity;
            const sellRatio = quantity / userSharesCount;
            const soldInvested = currentShares.invested * sellRatio;
            const newInvested = currentShares.invested - soldInvested;
            const profit = totalAmount - soldInvested;
            
            // ✅ جميع عمليات الكتابة بعد القراءة
            transaction.update(userRef, {
              balance: userBalance + totalAmount
            });
            
            transaction.update(stockRef, {
              availableShares: (stockDataFromDB.availableShares || 125000000) + quantity,
              soldShares: (stockDataFromDB.soldShares || 175000000) - quantity,
              volume: (stockDataFromDB.volume || 100000000) + totalAmount,
              previousPrice: stockDataFromDB.currentPrice,
              updatedAt: serverTimestamp()
            });
            
            if (newShares > 0) {
              transaction.update(sharesRef, {
                shares: newShares,
                invested: newInvested,
                avgPrice: newInvested > 0 ? newInvested / newShares : 0,
                totalProfit: (currentShares.totalProfit || 0) + profit,
                updatedAt: serverTimestamp()
              });
            } else {
              transaction.delete(sharesRef);
            }
          }
          
          // تسجيل العملية
          const transactionRef = doc(collection(db, "transactions"));
          transaction.set(transactionRef, {
            userId: user.uid,
            type: this.tradeType === 'buy' ? 'stock_buy' : 'stock_sell',
            amount: totalAmount,
            quantity: quantity,
            price: price,
            createdAt: serverTimestamp(),
            status: 'completed'
          });
        });
        
        this.showNotificationMessage('success', this.tradeType === 'buy' 
          ? `✅ تم شراء ${quantity} سهم بنجاح بقيمة ${this.formatPrice(totalAmount)} USDT`
          : `✅ تم بيع ${quantity} سهم بنجاح بقيمة ${this.formatPrice(totalAmount)} USDT`);
        
        this.closeTradeModal();
        await this.loadUserData();
        
      } catch (error) {
        console.error("Trade error:", error);
        this.showNotificationMessage('error', `❌ ${error.message}`);
        this.errorMessage = error.message;
      } finally {
        this.processing = false;
      }
    },

    showNotificationMessage(type, message) {
      this.notificationType = type;
      this.notificationMessage = message;
      this.showNotification = true;
      setTimeout(() => {
        this.showNotification = false;
      }, 3000);
    },

    formatPrice(value) {
      if (value === null || value === undefined) return '0';
      return Number(value).toFixed(2);
    },

    formatNumber(value) {
      if (value === null || value === undefined) return '0';
      return Number(value).toLocaleString('en-US');
    },

    formatVolume(value) {
      if (!value) return '0';
      if (value >= 1000000000) {
        return (value / 1000000000).toFixed(2) + 'B';
      } else if (value >= 1000000) {
        return (value / 1000000).toFixed(2) + 'M';
      } else if (value >= 1000) {
        return (value / 1000).toFixed(2) + 'K';
      }
      return value.toFixed(2);
    },

    goBack() {
      this.$router.push('/vip');
    }
  }
};
</script>
