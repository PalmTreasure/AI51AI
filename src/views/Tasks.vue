<template>
  <div class="game-page">
    <!-- زر الرجوع -->
    <div class="back-button-container">
      <button @click="goBack" class="back-button">
        <i class="fas fa-arrow-right"></i>
        رجوع
      </button>
    </div>

    <!-- الرصيد -->
    <div class="top-bar">
      <div class="balance-gold">
        <i class="fas fa-coins"></i>
        <span>رصيدك: <strong>{{ balance.toFixed(2) }} USDT</strong></span>
      </div>
    </div>

    <!-- رسالة مؤقتة -->
    <transition name="slide-fade">
      <div v-if="showMessage" class="result-message" :class="messageType">
        <i :class="messageIcon"></i>
        <span>{{ messageText }}</span>
      </div>
    </transition>

    <!-- محتوى الصفحة بدون ألعاب -->
    <div class="empty-games-container">
      <div class="empty-icon">🎮</div>
      <h3>لا توجد ألعاب متاحة حالياً</h3>
      <p>سيتم إضافة ألعاب جديدة قريباً</p>
    </div>
  </div>
</template>

<script>
import { auth, db, doc, getDoc, onSnapshot } from "../firebase"

export default {
  name: "Games",
  
  data() {
    return {
      balance: 0,
      showMessage: false,
      messageText: '',
      messageType: '',
      messageIcon: '',
      messageTimeout: null,
      unsubscribeBalance: null,
    }
  },
  
  async mounted() {
    const user = auth.currentUser
    if (!user) return
    
    await this.fetchUserBalance(user.uid)
    this.subscribeToUserBalance(user.uid)
  },
  
  beforeUnmount() {
    if (this.unsubscribeBalance) {
      this.unsubscribeBalance()
    }
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout)
    }
  },
  
  methods: {
    async fetchUserBalance(userId) {
      try {
        const userRef = doc(db, "users", userId)
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          this.balance = Number(userDoc.data().balance || 0)
        }
      } catch (error) {
        console.error("خطأ في جلب الرصيد:", error)
      }
    },
    
    subscribeToUserBalance(userId) {
      const userRef = doc(db, "users", userId)
      this.unsubscribeBalance = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          this.balance = Number(doc.data().balance || 0)
        }
      }, (error) => {
        console.error("خطأ في تحديث الرصيد:", error)
      })
    },
    
    goBack() {
      this.$router.push('/')
    },
    
    showTemporaryMessage(message, isSuccess = true) {
      if (this.messageTimeout) clearTimeout(this.messageTimeout)
      
      this.messageText = message
      this.messageType = isSuccess ? 'win-message' : 'lose-message'
      this.messageIcon = isSuccess ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'
      this.showMessage = true
      
      this.messageTimeout = setTimeout(() => {
        this.showMessage = false
      }, 3000)
    }
  }
}
</script>

<style scoped>
.game-page {
  background: linear-gradient(135deg, #0a0f1e 0%, #1a1f2f 100%);
  min-height: 100vh;
  color: #ffffff;
  padding: 15px;
  text-align: center;
  direction: rtl;
  font-family: 'Montserrat', 'Cairo', sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* زر الرجوع */
.back-button-container {
  margin-bottom: 10px;
  text-align: right;
  position: relative;
  z-index: 15;
}

.back-button {
  background: linear-gradient(145deg, #1e2333, #131826);
  color: #ffd700;
  border: 1px solid #ffd700;
  padding: 8px 20px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.back-button:hover {
  background: linear-gradient(135deg, #ffd700, #ffed4a);
  color: #0a0f1e;
  transform: translateX(-5px);
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
}

/* الرصيد */
.top-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  z-index: 10;
  position: relative;
}

.balance-gold {
  background: linear-gradient(145deg, #1e2333, #131826);
  padding: 6px 20px;
  border-radius: 100px;
  border: 1px solid #ffd700;
  box-shadow: 0 3px 12px rgba(255, 215, 0, 0.15), inset 0 0 8px rgba(255, 215, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.balance-gold i {
  color: #ffd700;
  font-size: 16px;
  filter: drop-shadow(0 0 5px #ffd700);
}

.balance-gold span {
  font-size: 14px;
  color: #e0e0e0;
}

.balance-gold strong {
  color: #ffd700;
  font-size: 16px;
  margin-right: 4px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
}

/* الرسائل المؤقتة */
.result-message {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 25px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 700;
  z-index: 9999;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid;
  backdrop-filter: blur(10px);
  min-width: 280px;
  justify-content: center;
  text-align: center;
}

.win-message {
  background: linear-gradient(145deg, #1a2f1a, #0f1f0f);
  border-color: #4caf50;
  box-shadow: 0 0 30px rgba(76, 175, 80, 0.3);
  color: #4caf50;
}

.win-message i {
  color: #4caf50;
  filter: drop-shadow(0 0 8px #4caf50);
}

.lose-message {
  background: linear-gradient(145deg, #2f1a1a, #1f0f0f);
  border-color: #f44336;
  box-shadow: 0 0 30px rgba(244, 67, 54, 0.3);
  color: #f44336;
}

.lose-message i {
  color: #f44336;
  filter: drop-shadow(0 0 8px #f44336);
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-50%) translateY(-20px);
  opacity: 0;
}

/* محتوى فارغ */
.empty-games-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  background: rgba(30, 35, 51, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 40px;
  margin: 20px auto;
  padding: 50px 20px;
  max-width: 500px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.7;
  filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.3));
}

.empty-games-container h3 {
  font-size: 24px;
  color: #ffd700;
  margin-bottom: 10px;
}

.empty-games-container p {
  font-size: 16px;
  color: #a0a0b0;
}

/* تحسينات للهاتف */
@media (max-width: 480px) {
  .game-page {
    padding: 10px;
  }
  
  .back-button {
    padding: 6px 15px;
    font-size: 13px;
  }
  
  .balance-gold {
    padding: 5px 15px;
  }
  
  .balance-gold i {
    font-size: 14px;
  }
  
  .balance-gold span {
    font-size: 13px;
  }
  
  .balance-gold strong {
    font-size: 14px;
  }
  
  .result-message {
    top: 70px;
    min-width: 250px;
    font-size: 14px;
    padding: 10px 20px;
  }
  
  .empty-games-container {
    margin: 20px 10px;
    padding: 40px 15px;
  }
  
  .empty-icon {
    font-size: 60px;
  }
  
  .empty-games-container h3 {
    font-size: 20px;
  }
  
  .empty-games-container p {
    font-size: 14px;
  }
}
</style>
