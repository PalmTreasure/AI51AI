<template>
  <div class="withdraw-page">
    <div class="card">
      <div class="card-header">
        <h2 class="title">
          <i class="fas fa-hand-holding-usd"></i>
          سحب الأرباح
          <span class="title-glow">USDT</span>
        </h2>
        <p class="sub">قم بإدخال معلومات السحب الخاصة بك</p>
      </div>

      <!-- رصيد المستخدم -->
      <div class="balance-box">
        <div class="balance-info">
          <span class="balance-label">رصيدك الحالي</span>
          <div class="balance-display">
            <img src="https://assets.coingecko.com/coins/images/325/large/tether.png" alt="USDT" class="balance-usdt-icon">
            <span class="balance-amount">{{ balance.toFixed(2) }}</span>
            <span class="balance-currency-badge">USDT</span>
          </div>
        </div>
      </div>

      <!-- حالة VIP -->
      <div class="vip-status-box">
        <div class="vip-badge">
          <i class="fas fa-crown"></i>
          مستوى VIP {{ userVipLevel || 'غير مفعل' }}
        </div>
        <div class="user-contact">
          <i class="fas fa-phone" v-if="userPhone"></i>
          <i class="fas fa-envelope" v-else></i>
          {{ userContact }}
        </div>
      </div>

      <!-- مبلغ السحب -->
      <div class="input-group">
        <label>
          <i class="fas fa-coins"></i>
          المبلغ
        </label>
        <div class="amount-input-wrapper">
          <input 
            type="number" 
            v-model.number="amount" 
            placeholder="0.00" 
            class="gold-input"
            @input="validateAmount"
            autocomplete="off"
            name="amount_field_x"
          />
          <span class="input-currency-badge">USDT</span>
        </div>
        <span v-if="amountError" class="input-error">{{ amountError }}</span>
      </div>

      <!-- الشبكة -->
      <div class="input-group">
        <label>
          <i class="fas fa-network-wired"></i>
          الشبكة
        </label>
        <div class="custom-dropdown-wrapper">
          <div class="custom-dropdown">
            <div class="dropdown-trigger" @click="toggleNetworkDropdown">
              <div v-if="network" class="selected-network">
                <img :src="getNetworkIcon(network)" :alt="network" class="dropdown-icon">
                <span>{{ getNetworkLabel(network) }}</span>
              </div>
              <div v-else class="placeholder">اختر الشبكة</div>
              <i class="fas fa-chevron-down" :class="{ 'rotate': showNetworkDropdown }"></i>
            </div>
            <div v-if="showNetworkDropdown" class="dropdown-menu">
              <div 
                v-for="net in networks" 
                :key="net.value"
                class="dropdown-item"
                :class="{ 'active': network === net.value }"
                @click="selectNetwork(net.value)"
              >
                <img :src="getNetworkIcon(net.value)" :alt="net.value" class="dropdown-item-icon">
                <div class="dropdown-item-content">
                  <div class="dropdown-item-name">{{ net.label }}</div>
                  <div class="dropdown-item-symbol">{{ net.value }}</div>
                </div>
                <i v-if="network === net.value" class="fas fa-check"></i>
              </div>
            </div>
          </div>
        </div>
        <span v-if="networkError" class="input-error">{{ networkError }}</span>
      </div>

      <!-- حاجز فاصل بين قسم المحفظة وقسم كلمة المرور -->
      <div class="fields-separator"></div>

      <!-- عنوان المحفظة - قسم مستقل -->
      <div class="isolated-section">
        <div class="input-group wallet-section">
          <label>
            <i class="fas fa-qrcode"></i>
            عنوان المحفظة
          </label>
          <div class="wallet-input-wrapper">
            <input 
              ref="walletInput"
              type="text" 
              v-model="wallet" 
              placeholder="أدخل عنوان محفظتك USDT" 
              class="gold-input"
              @input="validateWallet"
              autocomplete="off"
              name="wallet_address_field"
              spellcheck="false"
              data-lpignore="true"
              data-form-type="other"
              data-browser-autofill="off"
            />
          </div>
          <span v-if="walletError" class="input-error">{{ walletError }}</span>
        </div>
      </div>

      <!-- حاجز فاصل بين قسم المحفظة وقسم كلمة المرور -->
      <div class="fields-separator"></div>

      <!-- كلمة المرور - قسم مستقل -->
      <div class="isolated-section">
        <div class="input-group password-section">
          <label>
            <i class="fas fa-lock"></i>
            كلمة المرور
          </label>
          <div class="password-input-wrapper">
            <input 
              ref="passwordInput"
              :type="showPassword ? 'text' : 'password'" 
              v-model="password" 
              placeholder="أدخل كلمة المرور" 
              class="gold-input"
              autocomplete="off"
              name="password_field_y"
              spellcheck="false"
              data-lpignore="true"
              data-form-type="other"
              data-browser-autofill="off"
            />
            <button type="button" class="toggle-password-btn" @click="showPassword = !showPassword" tabindex="-1">
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- ملخص الطلب -->
      <div v-if="showSummary" class="summary-box">
        <h3>📋 ملخص طلب السحب</h3>
        
        <div class="summary-item">
          <span>معلومات الاتصال:</span>
          <span class="summary-value">{{ userContact }}</span>
        </div>
        
        <div class="summary-item">
          <span>مستوى VIP:</span>
          <span class="summary-value">{{ userVipLevel || 'غير مفعل' }}</span>
        </div>
        
        <div class="summary-item">
          <span>المبلغ المطلوب:</span>
          <span class="summary-value">{{ Number(amount).toFixed(2) }} USDT</span>
        </div>
        
        <div class="summary-item">
          <span>الرسوم (5%):</span>
          <span class="summary-value fee">-{{ fee.toFixed(2) }} USDT</span>
        </div>
        
        <div class="summary-item">
          <span>المبلغ الصافي:</span>
          <span class="summary-value net">{{ netAmount.toFixed(2) }} USDT</span>
        </div>
        
        <div class="summary-item">
          <span>الشبكة:</span>
          <span class="summary-value">{{ network }}</span>
        </div>
        
        <div class="summary-item">
          <span>عنوان المحفظة:</span>
          <span class="summary-value address">{{ wallet.substring(0, 10) }}...{{ wallet.substring(wallet.length - 10) }}</span>
        </div>
        
        <div class="summary-item total">
          <span>سيتم خصم من رصيدك:</span>
          <span class="summary-value">{{ Number(amount).toFixed(2) }} USDT</span>
        </div>
        
        <div class="summary-item">
          <span>الرصيد بعد السحب:</span>
          <span class="summary-value">{{ (balance - Number(amount)).toFixed(2) }} USDT</span>
        </div>
      </div>

      <!-- رسالة المنع -->
      <div v-if="showRestrictionMessage" class="restriction-box">
        <i class="fas fa-lock"></i>
        <div class="restriction-text">
          <p class="main-message">⚠️ يجب ترقية حسابك إلى VIP أعلى حتى تتمكن من سحب الأرباح.</p>
          <p class="amount-message">المبلغ المطلوب سحبه: <strong>{{ (Number(amount) || 0).toFixed(2) }} USDT</strong></p>
        </div>
      </div>

      <!-- تحذيرات -->
      <div class="warning-box">
        <i class="fas fa-shield-alt"></i>
        <div class="warning-text">
          <p>يرجى التأكد من صحة المعلومات قبل الإرسال</p>
          <p class="small">سيتم خصم {{ Number(amount) || 0 }} USDT من رصيدك. ستستلم {{ netAmount.toFixed(2) }} USDT بعد خصم 5% رسوم</p>
        </div>
      </div>

      <!-- زر السحب -->
      <button 
        class="gold-button" 
        @click="showWithdrawRestriction"
        :disabled="isLoading || !isFormValid"
      >
        <i class="fas fa-paper-plane" v-if="!isLoading"></i>
        <i class="fas fa-spinner fa-spin" v-else></i>
        {{ isLoading ? 'جاري المعالجة...' : 'تأكيد السحب' }}
      </button>

      <!-- رسائل الخطأ -->
      <transition name="fade">
        <div v-if="message" class="message" :class="messageType">
          <i :class="messageType === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
          {{ message }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default {
  name: "Withdraw",
  
  data() {
    return {
      balance: 0,
      amount: "",
      network: "",
      wallet: "",
      password: "",
      showPassword: false,
      isLoading: false,
      message: "",
      messageType: "info",
      userVipLevel: null,
      userPhone: "",
      userEmail: "",
      showNetworkDropdown: false,
      showRestrictionMessage: false,
      networks: [
        { value: 'TRC20', label: 'Tron (TRC20)' },
        { value: 'ERC20', label: 'Ethereum (ERC20)' },
        { value: 'BEP20', label: 'BNB Chain (BEP20)' },
        { value: 'SOL', label: 'Solana (SOL)' }
      ],
      
      // أخطاء الحقول
      amountError: "",
      networkError: "",
      walletError: "",
      
      // نسبة الرسوم
      feePercentage: 5
    };
  },

  computed: {
    // حساب الرسوم
    fee() {
      if (!this.amount) return 0;
      return (Number(this.amount) * this.feePercentage) / 100;
    },

    // حساب المبلغ الصافي
    netAmount() {
      if (!this.amount) return 0;
      return Number(this.amount) - this.fee;
    },

    isFormValid() {
      return (
        this.amount && 
        !this.amountError &&
        this.network && 
        !this.networkError &&
        this.wallet && 
        !this.walletError &&
        this.password &&
        Number(this.amount) > 0 &&
        this.balance >= Number(this.amount)
      );
    },

    showSummary() {
      return this.amount && this.network && this.wallet;
    },

    userContact() {
      if (this.userPhone) {
        return this.userPhone;
      } else if (this.userEmail) {
        return this.userEmail;
      } else {
        return "لا يوجد";
      }
    }
  },

  watch: {
    amount() {
      this.validateAmount();
      // إخفاء رسالة المنع عند تغيير المبلغ
      if (this.showRestrictionMessage) {
        this.showRestrictionMessage = false;
      }
    },
    network() {
      this.validateNetwork();
    },
    wallet() {
      this.validateWallet();
    }
  },

  async created() {
    await this.loadUserData();
  },

  mounted() {
    this.clearBrowserAutofill();
    this.preventAutocomplete();
  },

  methods: {
    clearBrowserAutofill() {
      this.$nextTick(() => {
        if (this.$refs.walletInput) {
          this.$refs.walletInput.value = '';
          this.wallet = '';
        }
        if (this.$refs.passwordInput) {
          this.$refs.passwordInput.value = '';
          this.password = '';
        }
      });
    },

    preventAutocomplete() {
      this.$nextTick(() => {
        setTimeout(() => {
          const allInputs = document.querySelectorAll('input');
          allInputs.forEach(input => {
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('data-lpignore', 'true');
            input.setAttribute('data-form-type', 'other');
            input.setAttribute('data-browser-autofill', 'off');
            
            if (input.name === 'wallet_address_field' || input.name === 'password_field_y') {
              const currentValue = input.value;
              if (currentValue && !this.wallet && !this.password) {
                input.value = '';
              }
            }
          });
        }, 100);
      });
    },

    async loadUserData() {
      const user = auth.currentUser;
      if (!user) {
        this.$router.push("/login");
        return;
      }

      try {
        // تحميل بيانات المستخدم من Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          this.balance = userData.balance || 0;
          this.userPhone = userData.phoneNumber || "";
          this.userEmail = userData.email || "";
          
          // قراءة مستوى VIP من بيانات المستخدم
          if (userData.vipLevel) {
            this.userVipLevel = userData.vipLevel;
          }
        }

        // إذا لم يكن VIP موجوداً في بيانات المستخدم، نحاول من subcollection
        if (!this.userVipLevel) {
          const vipRef = doc(db, "users", user.uid, "vip", "current");
          const vipSnap = await getDoc(vipRef);
          if (vipSnap.exists()) {
            this.userVipLevel = vipSnap.data().level;
          } else {
            this.userVipLevel = null;
          }
        }
      } catch (error) {
        console.error("خطأ:", error);
        this.showMessage("حدث خطأ في تحميل البيانات", "error");
      }
    },

    validateAmount() {
      if (!this.amount) {
        this.amountError = "الرجاء إدخال المبلغ";
      } else if (Number(this.amount) <= 0) {
        this.amountError = "المبلغ يجب أن يكون أكبر من صفر";
      } else if (this.amount > this.balance) {
        this.amountError = "المبلغ أكبر من رصيدك";
      } else {
        this.amountError = "";
      }
    },

    validateNetwork() {
      if (!this.network) {
        this.networkError = "الرجاء اختيار الشبكة";
      } else {
        this.networkError = "";
      }
    },

    validateWallet() {
      if (!this.wallet) {
        this.walletError = "الرجاء إدخال عنوان محفظتك";
      } else if (this.wallet.length < 20) {
        this.walletError = "عنوان المحفظة قصير جداً";
      } else {
        this.walletError = "";
      }
    },

    getNetworkIcon(network) {
      const icons = {
        'TRC20': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
        'ERC20': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        'BEP20': 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
        'SOL': 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
      };
      return icons[network] || '';
    },

    getNetworkLabel(network) {
      const labels = {
        'TRC20': 'Tron (TRC20)',
        'ERC20': 'Ethereum (ERC20)',
        'BEP20': 'BNB Chain (BEP20)',
        'SOL': 'Solana (SOL)'
      };
      return labels[network] || '';
    },

    toggleNetworkDropdown() {
      this.showNetworkDropdown = !this.showNetworkDropdown;
    },

    selectNetwork(value) {
      this.network = value;
      this.showNetworkDropdown = false;
      this.validateNetwork();
    },

    showMessage(msg, type = "info") {
      this.message = msg;
      this.messageType = type;
      setTimeout(() => {
        this.message = "";
      }, 5000);
    },

    // عرض رسالة المنع بدلاً من تنفيذ السحب
    showWithdrawRestriction() {
      if (!this.isFormValid) return;
      
      // إظهار رسالة المنع
      this.showRestrictionMessage = true;
      
      // تمرير الصفحة إلى أعلى لرؤية الرسالة
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // إخفاء الرسالة بعد 5 ثواني
      setTimeout(() => {
        this.showRestrictionMessage = false;
      }, 5000);
    }
  }
};
</script>

<style scoped>
.withdraw-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
  padding: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  padding-bottom: 100px;
  direction: rtl;
}

.card {
  background: linear-gradient(135deg, #1e2329 0%, #181a20 100%);
  border-radius: 24px;
  padding: 28px;
  border: 1px solid rgba(212, 175, 55, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  max-width: 500px;
  width: 100%;
}

.card-header {
  margin-bottom: 28px;
  text-align: center;
}

.title {
  font-size: 28px;
  font-weight: 800;
  color: #eaecef;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.title-glow {
  color: #fcd535;
  font-size: 20px;
  background: rgba(212, 175, 55, 0.15);
  padding: 4px 12px;
  border-radius: 8px;
}

.sub {
  color: #848e9c;
  font-size: 14px;
  margin: 0;
}

/* صندوق الرصيد */
.balance-box {
  background: rgba(212, 175, 55, 0.08);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.08);
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.balance-label {
  font-size: 12px;
  color: #848e9c;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.balance-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-usdt-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 50%;
}

.balance-amount {
  font-size: 24px;
  font-weight: 900;
  color: #fcd535;
  font-family: 'Courier New', monospace;
  letter-spacing: -0.5px;
}

.balance-currency-badge {
  font-size: 11px;
  color: #fcd535;
  font-weight: 700;
  background: rgba(212, 175, 55, 0.15);
  padding: 4px 8px;
  border-radius: 6px;
}

/* حالة VIP */
.vip-status-box {
  background: rgba(212, 175, 55, 0.08);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vip-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #fcd535;
  font-size: 14px;
}

.user-contact {
  font-size: 13px;
  color: #eaecef;
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-contact i {
  color: #fcd535;
}

/* صندوق رسالة المنع */
.restriction-box {
  background: rgba(220, 38, 38, 0.15);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(220, 38, 38, 0.3);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.restriction-box i {
  font-size: 32px;
  color: #dc2626;
}

.restriction-text {
  flex: 1;
}

.restriction-text .main-message {
  color: #fca5a5;
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.restriction-text .amount-message {
  color: #fcd535;
  font-size: 13px;
  margin: 0;
  font-weight: 600;
}

.restriction-text .amount-message strong {
  color: #fcd535;
  font-size: 16px;
}

/* رسائل */
.message {
  padding: 12px 16px;
  border-radius: 12px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
}

.message.error {
  background: rgba(220, 38, 38, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(220, 38, 38, 0.3);
}

.message.success {
  background: rgba(16, 185, 129, 0.15);
  color: #86efac;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* مجموعات الإدخال */
.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #eaecef;
  margin-bottom: 8px;
}

.input-group label i {
  color: #fcd535;
}

.amount-input-wrapper, .wallet-input-wrapper, .password-input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(212, 175, 55, 0.05);
  border-radius: 12px;
  padding: 4px 8px;
  border: 1px solid rgba(212, 175, 55, 0.15);
}

.gold-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #eaecef;
  padding: 10px 8px;
  font-size: 14px;
  outline: none;
  font-weight: 600;
}

.input-currency-badge {
  color: #fcd535;
  font-weight: 700;
  font-size: 10px;
  background: rgba(212, 175, 55, 0.1);
  padding: 4px 6px;
  border-radius: 5px;
}

.input-error {
  display: block;
  color: #fca5a5;
  font-size: 12px;
  margin-top: 6px;
}

/* فاصل بين الأقسام */
.fields-separator {
  height: 1px;
  background: transparent;
  margin: 5px 0;
}

/* أقسام معزولة */
.isolated-section {
  position: relative;
}

.wallet-section,
.password-section {
  position: relative;
  z-index: 1;
}

/* زر إظهار/إخفاء كلمة المرور */
.toggle-password-btn {
  background: transparent;
  border: none;
  color: #848e9c;
  cursor: pointer;
  padding: 8px 12px;
  font-size: 14px;
  transition: color 0.3s ease;
}

.toggle-password-btn:hover {
  color: #fcd535;
}

/* قائمة مخصصة للشبكات */
.custom-dropdown {
  position: relative;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(212, 175, 55, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
}

.selected-network {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #eaecef;
  font-weight: 600;
  font-size: 14px;
}

.dropdown-icon {
  width: 24px;
  height: 24px;
}

.placeholder {
  color: #5a6370;
  font-size: 14px;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #1e2329;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  z-index: 100;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: rgba(212, 175, 55, 0.08);
}

.dropdown-item.active {
  background: rgba(212, 175, 55, 0.15);
}

.dropdown-item-icon {
  width: 28px;
  height: 28px;
}

.dropdown-item-content {
  flex: 1;
}

.dropdown-item-name {
  color: #eaecef;
  font-weight: 600;
  font-size: 13px;
}

.dropdown-item-symbol {
  color: #848e9c;
  font-size: 11px;
}

/* صندوق الملخص */
.summary-box {
  background: rgba(212, 175, 55, 0.08);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  margin-bottom: 20px;
}

.summary-box h3 {
  font-size: 14px;
  font-weight: 700;
  color: #fcd535;
  margin: 0 0 12px 0;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 12px;
  color: #eaecef;
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.summary-item.total {
  font-weight: 700;
  color: #fcd535;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

.summary-value {
  color: #fcd535;
  font-weight: 600;
}

.summary-value.fee {
  color: #fca5a5;
}

.summary-value.net {
  color: #86efac;
}

/* صندوق التحذير */
.warning-box {
  background: rgba(217, 119, 6, 0.1);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(217, 119, 6, 0.2);
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.warning-box i {
  color: #d97706;
}

.warning-text p {
  margin: 0;
  font-size: 12px;
  color: #eaecef;
}

.warning-text p.small {
  color: #848e9c;
  font-size: 11px;
}

/* الزر */
.gold-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #fcd535 0%, #d4af37 100%);
  color: #0f1419;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.gold-button:disabled {
  opacity: 0.5;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
