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
            السوق مفتوح
          </span>
        </div>
      </div>

      <!-- Stock Price Card -->
      <div class="price-card">
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

      <!-- Shares Statistics -->
      <div class="stats-card">
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

      <!-- Chart Section -->
      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">📈 الرسم البياني</h3>
          <div class="chart-controls">
            <button 
              v-for="period in periods" 
              :key="period.key"
              @click="changePeriod(period.key)"
              class="period-btn"
              :class="{ active: selectedPeriod === period.key }"
            >
              {{ period.label }}
            </button>
          </div>
        </div>
        <div class="chart-container">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <!-- User Portfolio -->
      <div class="portfolio-card" v-if="userShares">
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
            <span class="portfolio-value" :class="userShares.totalProfit >= 0 ? 'profit' : 'loss'">
              {{ userShares.totalProfit >= 0 ? '+' : '' }}{{ formatPrice(userShares.totalProfit) }} USDT
              ({{ profitPercentage >= 0 ? '+' : '' }}{{ formatPrice(profitPercentage) }}%)
            </span>
          </div>
        </div>
      </div>

      <!-- Trade Buttons -->
      <div class="trade-buttons">
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

      <!-- Loading State -->
      <div v-if="loading" class="loading-overlay">
        <div class="gold-spinner"></div>
        <div class="loading-text">جاري التحميل...</div>
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

    <!-- Success Notification -->
    <transition name="slide-down">
      <div v-if="showNotification" class="notification" :class="notificationType">
        <i :class="notificationType === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
        {{ notificationMessage }}
      </div>
    </transition>
  </div>
</template>

<script>
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Chart from 'chart.js/auto';

export default {
  name: "Shares",
  data() {
    return {
      loading: true,
      processing: false,
      stockData: {
        currentPrice: 1.50,
        previousPrice: 1.50,
        highPrice: 1.50,
        lowPrice: 1.50,
        volume: 0,
        totalShares: 300000000,
        availableShares: 125000000,
        soldShares: 175000000
      },
      userShares: null,
      userBalance: 0,
      selectedPeriod: 'daily',
      periods: [
        { key: 'daily', label: 'يومي' },
        { key: 'weekly', label: 'أسبوعي' },
        { key: 'monthly', label: 'شهري' }
      ],
      showTradeModal: false,
      tradeType: 'buy',
      tradeQuantity: 1,
      errorMessage: '',
      showNotification: false,
      notificationMessage: '',
      notificationType: 'success',
      chart: null,
      priceHistory: [],
      unsubscribeStock: null
    };
  },

  computed: {
    priceChange() {
      return this.stockData.currentPrice - this.stockData.previousPrice;
    },
    priceChangePercent() {
      if (this.stockData.previousPrice === 0) return 0;
      return (this.priceChange / this.stockData.previousPrice) * 100;
    },
    soldPercentage() {
      if (this.stockData.totalShares === 0) return 0;
      return (this.stockData.soldShares / this.stockData.totalShares) * 100;
    },
    maxTradeQuantity() {
      if (this.tradeType === 'buy') {
        return this.stockData.availableShares;
      } else {
        return this.userShares ? this.userShares.shares : 0;
      }
    },
    isTradeValid() {
      if (!this.tradeQuantity || this.tradeQuantity <= 0) return false;
      if (this.tradeQuantity > this.maxTradeQuantity) return false;
      
      if (this.tradeType === 'buy') {
        const totalCost = this.tradeQuantity * this.stockData.currentPrice;
        if (totalCost > this.userBalance) return false;
      }
      
      return true;
    },
    profitPercentage() {
      if (!this.userShares || this.userShares.invested === 0) return 0;
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
    if (this.chart) {
      this.chart.destroy();
    }
  },

  methods: {
    async initializePage() {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.$router.push("/login");
          return;
        }
        await this.loadStockData();
        await this.loadUserData();
        this.subscribeToStockUpdates();
        this.loading = false;
      });
    },

    async loadStockData() {
      try {
        const stockDoc = await getDoc(doc(db, "stock", "company"));
        if (stockDoc.exists()) {
          const data = stockDoc.data();
          this.stockData = {
            currentPrice: data.currentPrice || 1.50,
            previousPrice: data.previousPrice || 1.50,
            highPrice: data.highPrice || 1.50,
            lowPrice: data.lowPrice || 1.50,
            volume: data.volume || 0,
            totalShares: data.totalShares || 300000000,
            availableShares: data.availableShares || 125000000,
            soldShares: data.soldShares || 175000000
          };
        } else {
          await this.initializeStockData();
        }
        await this.loadPriceHistory();
      } catch (error) {
        console.error("Error loading stock data:", error);
      }
    },

    async initializeStockData() {
      const initialData = {
        currentPrice: 1.50,
        previousPrice: 1.50,
        highPrice: 1.50,
        lowPrice: 1.50,
        volume: 0,
        totalShares: 300000000,
        availableShares: 125000000,
        soldShares: 175000000,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, "stock", "company"), initialData);
      
      await addDoc(collection(db, "stock_history"), {
        price: 1.50,
        createdAt: serverTimestamp()
      });
    },

    subscribeToStockUpdates() {
      this.unsubscribeStock = onSnapshot(doc(db, "stock", "company"), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          this.stockData = {
            currentPrice: data.currentPrice || 1.50,
            previousPrice: data.previousPrice || 1.50,
            highPrice: data.highPrice || 1.50,
            lowPrice: data.lowPrice || 1.50,
            volume: data.volume || 0,
            totalShares: data.totalShares || 300000000,
            availableShares: data.availableShares || 125000000,
            soldShares: data.soldShares || 175000000
          };
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
          const data = sharesDoc.data();
          this.userShares = {
            shares: data.shares || 0,
            avgPrice: data.avgPrice || 0,
            invested: data.invested || 0,
            totalProfit: data.totalProfit || 0
          };
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    },

    async loadPriceHistory() {
      try {
        const historyQuery = query(
          collection(db, "stock_history"),
          orderBy("createdAt", "desc"),
          limit(365)
        );
        
        const snapshot = await getDocs(historyQuery);
        this.priceHistory = snapshot.docs.map(doc => ({
          price: doc.data().price,
          date: doc.data().createdAt?.toDate() || new Date()
        })).reverse();
        
        this.renderChart();
      } catch (error) {
        console.error("Error loading price history:", error);
      }
    },

    changePeriod(period) {
      this.selectedPeriod = period;
      this.renderChart();
    },

    getFilteredHistory() {
      const now = new Date();
      let filteredData = [...this.priceHistory];
      
      switch(this.selectedPeriod) {
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredData = filteredData.filter(item => item.date >= weekAgo);
          break;
        case 'monthly':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredData = filteredData.filter(item => item.date >= monthAgo);
          break;
        case 'daily':
        default:
          const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          filteredData = filteredData.filter(item => item.date >= dayAgo);
          break;
      }
      
      if (filteredData.length === 0) {
        filteredData = this.priceHistory.slice(-10);
      }
      
      return filteredData;
    },

    renderChart() {
      if (this.chart) {
        this.chart.destroy();
      }
      
      const canvas = this.$refs.chartCanvas;
      if (!canvas) return;
      
      const filteredData = this.getFilteredHistory();
      
      if (filteredData.length === 0) return;
      
      const labels = filteredData.map(item => {
        const date = item.date;
        return date.toLocaleDateString('ar-SA', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      });
      
      const prices = filteredData.map(item => item.price);
      
      const ctx = canvas.getContext('2d');
      
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'سعر السهم (USDT)',
            data: prices,
            borderColor: '#fcd535',
            backgroundColor: 'rgba(252, 213, 53, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#fcd535',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(24, 26, 32, 0.95)',
              titleColor: '#fcd535',
              bodyColor: '#fff',
              borderColor: '#fcd535',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `السعر: ${context.parsed.y} USDT`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false
              },
              ticks: {
                color: '#848e9c',
                maxTicksLimit: 8,
                font: {
                  size: 10
                }
              }
            },
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false
              },
              ticks: {
                color: '#848e9c',
                callback: function(value) {
                  return value + ' USDT';
                },
                font: {
                  size: 10
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    },

    openTradeModal(type) {
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
      
      if (this.tradeQuantity <= 0) {
        this.errorMessage = 'يجب أن يكون عدد الأسهم أكبر من 0';
        return;
      }
      
      if (this.tradeQuantity > this.maxTradeQuantity) {
        this.errorMessage = `لا يمكنك ${this.tradeType === 'buy' ? 'شراء' : 'بيع'} أكثر من ${this.maxTradeQuantity} سهم`;
        return;
      }
      
      if (this.tradeType === 'buy') {
        const totalCost = this.tradeQuantity * this.stockData.currentPrice;
        if (totalCost > this.userBalance) {
          this.errorMessage = 'رصيدك غير كافٍ لإتمام عملية الشراء';
          return;
        }
      }
    },

    async executeTrade() {
      if (!this.isTradeValid) return;
      
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
          
          const userDoc = await transaction.get(userRef);
          const stockDoc = await transaction.get(stockRef);
          
          if (!userDoc.exists()) throw new Error("المستخدم غير موجود");
          if (!stockDoc.exists()) throw new Error("بيانات السهم غير متوفرة");
          
          const userData = userDoc.data();
          const stockData = stockDoc.data();
          
          if (this.tradeType === 'buy') {
            if (stockData.availableShares < quantity) {
              throw new Error("الأسهم المتاحة غير كافية");
            }
            
            if (userData.balance < totalAmount) {
              throw new Error("رصيدك غير كافٍ");
            }
            
            transaction.update(userRef, {
              balance: userData.balance - totalAmount
            });
            
            transaction.update(stockRef, {
              availableShares: stockData.availableShares - quantity,
              soldShares: stockData.soldShares + quantity,
              volume: stockData.volume + totalAmount,
              previousPrice: stockData.currentPrice,
              updatedAt: serverTimestamp()
            });
            
            const sharesDoc = await transaction.get(sharesRef);
            if (sharesDoc.exists()) {
              const currentShares = sharesDoc.data();
              const newTotalShares = currentShares.shares + quantity;
              const newInvested = currentShares.invested + totalAmount;
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
            const sharesDoc = await transaction.get(sharesRef);
            if (!sharesDoc.exists()) throw new Error("لا تمتلك أي أسهم");
            
            const currentShares = sharesDoc.data();
            if (currentShares.shares < quantity) {
              throw new Error("لا تمتلك هذا العدد من الأسهم");
            }
            
            const newShares = currentShares.shares - quantity;
            const sellRatio = quantity / currentShares.shares;
            const soldInvested = currentShares.invested * sellRatio;
            const newInvested = currentShares.invested - soldInvested;
            const profit = totalAmount - soldInvested;
            
            transaction.update(userRef, {
              balance: userData.balance + totalAmount
            });
            
            transaction.update(stockRef, {
              availableShares: stockData.availableShares + quantity,
              soldShares: stockData.soldShares - quantity,
              volume: stockData.volume + totalAmount,
              previousPrice: stockData.currentPrice,
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
          
          const transactionRef = doc(collection(db, "transactions"));
          transaction.set(transactionRef, {
            userId: user.uid,
            type: this.tradeType === 'buy' ? 'stock_buy' : 'stock_sell',
            quantity: quantity,
            price: price,
            totalAmount: totalAmount,
            stockPrice: price,
            createdAt: serverTimestamp(),
            status: 'completed'
          });
          
          const historyRef = doc(collection(db, "stock_history"));
          transaction.set(historyRef, {
            price: price,
            createdAt: serverTimestamp(),
            type: 'trade'
          });
        });
        
        this.showNotification = true;
        this.notificationType = 'success';
        this.notificationMessage = this.tradeType === 'buy' 
          ? `✅ تم شراء ${quantity} سهم بنجاح بقيمة ${this.formatPrice(totalAmount)} USDT`
          : `✅ تم بيع ${quantity} سهم بنجاح بقيمة ${this.formatPrice(totalAmount)} USDT`;
        
        setTimeout(() => {
          this.showNotification = false;
        }, 3000);
        
        this.closeTradeModal();
        await this.loadUserData();
        
      } catch (error) {
        this.showNotification = true;
        this.notificationType = 'error';
        this.notificationMessage = `❌ ${error.message}`;
        
        setTimeout(() => {
          this.showNotification = false;
        }, 3000);
        
        this.errorMessage = error.message;
      } finally {
        this.processing = false;
      }
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
      if (value >= 1000000) {
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

<style scoped>
.shares-page {
  min-height: 100vh;
  background: #0b0e11;
  color: #fff;
  direction: rtl;
  padding: 15px;
  font-family: 'Cairo', sans-serif;
}

.container {
  max-width: 500px;
  margin: 0 auto;
}

.shares-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 25px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fcd535;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(252, 213, 53, 0.2);
  transform: scale(1.05);
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  color: #fcd535;
  text-align: center;
  flex: 1;
}

.header-spacer {
  width: 40px;
}

.company-card {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 2px solid #fcd535;
  border-radius: 20px;
  padding: 25px 20px;
  margin-bottom: 20px;
  text-align: center;
}

.company-logo {
  margin-bottom: 15px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.company-name {
  font-size: 24px;
  font-weight: 900;
  color: #fcd535;
  text-shadow: 0 0 10px rgba(252, 213, 53, 0.3);
}

.stock-status {
  margin-top: 10px;
}

.status-badge {
  padding: 5px 15px;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 700;
}

.status-badge.open {
  background: rgba(0, 255, 0, 0.1);
  color: #00ff88;
  border: 1px solid #00ff88;
}

.price-card {
  background: #181a20;
  border: 1px solid rgba(252, 213, 53, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.price-main {
  text-align: center;
  margin-bottom: 20px;
}

.current-price {
  margin-bottom: 10px;
}

.price-value {
  font-size: 36px;
  font-weight: 900;
  color: #fcd535;
  text-shadow: 0 0 20px rgba(252, 213, 53, 0.3);
}

.currency {
  font-size: 16px;
  color: #848e9c;
  margin-right: 5px;
}

.price-change {
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.price-change.positive {
  color: #00ff88;
}

.price-change.negative {
  color: #ff4444;
}

.price-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid rgba(252, 213, 53, 0.1);
}

.detail-item {
  text-align: center;
}

.detail-label {
  display: block;
  font-size: 11px;
  color: #848e9c;
  margin-bottom: 5px;
}

.detail-value {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.detail-value.high {
  color: #00ff88;
}

.detail-value.low {
  color: #ff4444;
}

.stats-card {
  background: #181a20;
  border: 1px solid rgba(252, 213, 53, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.stats-title {
  font-size: 18px;
  font-weight: 800;
  color: #fcd535;
  margin-bottom: 15px;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  background: #1e2329;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  border: 1px solid rgba(252, 213, 53, 0.2);
}

.stat-item.full-width {
  grid-column: span 2;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #848e9c;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
}

.stat-value.highlight {
  color: #fcd535;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  margin: 8px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fcd535, #ffed8a);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.sold-out-message {
  text-align: center;
  padding: 15px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 10px;
  color: #ff4444;
  font-weight: 700;
  margin-top: 15px;
}

.chart-card {
  background: #181a20;
  border: 1px solid rgba(252, 213, 53, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.chart-title {
  font-size: 18px;
  font-weight: 800;
  color: #fcd535;
}

.chart-controls {
  display: flex;
  gap: 5px;
}

.period-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(252, 213, 53, 0.3);
  color: #848e9c;
  padding: 5px 12px;
  border-radius: 50px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.period-btn.active {
  background: #fcd535;
  color: #0b0e11;
  border-color: #fcd535;
}

.period-btn:hover {
  border-color: #fcd535;
  color: #fcd535;
}

.period-btn.active:hover {
  color: #0b0e11;
}

.chart-container {
  width: 100%;
  height: 300px;
  position: relative;
}

.chart-container canvas {
  width: 100% !important;
  height: 100% !important;
}

.portfolio-card {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 2px solid #fcd535;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.portfolio-title {
  font-size: 18px;
  font-weight: 800;
  color: #fcd535;
  margin-bottom: 15px;
  text-align: center;
}

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.portfolio-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}

.portfolio-item.full-width {
  grid-column: span 2;
}

.portfolio-label {
  display: block;
  font-size: 11px;
  color: #848e9c;
  margin-bottom: 5px;
}

.portfolio-value {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.portfolio-value.profit {
  color: #00ff88;
}

.portfolio-value.loss {
  color: #ff4444;
}

.trade-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}

.trade-btn {
  flex: 1;
  padding: 15px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.trade-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.trade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.buy-btn {
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  color: #0b0e11;
}

.sell-btn {
  background: linear-gradient(135deg, #ff4444, #cc0000);
  color: #fff;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.gold-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(252, 213, 53, 0.1);
  border-top: 4px solid #fcd535;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #fcd535;
  font-size: 16px;
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2500;
  padding: 20px;
}

.modal-content {
  background: #181a20;
  width: 100%;
  max-width: 400px;
  border-radius: 24px;
  border: 1px solid #fcd535;
  overflow: hidden;
}

.modal-header {
  padding: 18px 20px;
  border-bottom: 1px solid rgba(252, 213, 53, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(252, 213, 53, 0.1), rgba(255, 237, 138, 0.05));
}

.modal-header h3 {
  color: #fcd535;
  font-size: 18px;
  font-weight: 800;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #848e9c;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.modal-body {
  padding: 20px;
}

.trade-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.price-highlight {
  color: #fcd535;
  font-weight: 700;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  color: #848e9c;
  font-size: 13px;
  margin-bottom: 8px;
}

.trade-input {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(252, 213, 53, 0.3);
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
  font-family: 'Cairo', sans-serif;
}

.trade-input:focus {
  border-color: #fcd535;
  box-shadow: 0 0 0 3px rgba(252, 213, 53, 0.1);
}

.total-calculation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(252, 213, 53, 0.1);
  border-radius: 12px;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 700;
}

.total-value {
  color: #fcd535;
  font-size: 18px;
}

.balance-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 14px;
}

.balance-value {
  color: #fcd535;
  font-weight: 700;
}

.error-message {
  margin-top: 15px;
  padding: 10px 15px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 10px;
  color: #ff4444;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(252, 213, 53, 0.2);
}

.btn-cancel {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-confirm {
  flex: 1;
  background: linear-gradient(135deg, #fcd535, #ffed8a);
  border: none;
  color: #0b0e11;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(252, 213, 53, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 700;
  z-index: 3000;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  max-width: 90%;
  text-align: center;
}

.notification.success {
  background: linear-gradient(135deg, #00ff88, #00cc6a);
  color: #0b0e11;
}

.notification.error {
  background: linear-gradient(135deg, #ff4444, #cc0000);
  color: #fff;
}

.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from, .slide-down-leave-to {
  transform: translateX(-50%) translateY(-100px);
  opacity: 0;
}

.modal-fade-scale-enter-active,
.modal-fade-scale-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-scale-enter-from,
.modal-fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.modal-fade-scale-enter-to,
.modal-fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 18px;
  }
  
  .price-value {
    font-size: 28px;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .portfolio-grid {
    grid-template-columns: 1fr;
  }
  
  .portfolio-item.full-width {
    grid-column: span 1;
  }
  
  .trade-buttons {
    flex-direction: column;
  }
}
</style>
