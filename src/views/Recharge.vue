<template>
  <div class="recharge-page">
    <!-- Header -->
    <div class="top-nav">
      <div class="nav-left" @click="$router.back()">
        <i class="fas fa-arrow-right"></i>
      </div>
      <div class="nav-center">إيداع USDT</div>
      <div class="nav-right" @click="$router.push('/transactions')">
        <i class="fas fa-history"></i>
      </div>
    </div>

    <div class="main-content">
      <!-- Asset Display -->
      <div class="asset-card">
        <div class="asset-main">
          <img src="https://assets.coingecko.com/coins/images/325/large/Tether.png" alt="USDT" class="coin-logo-real">
          <div class="asset-text">
            <span class="coin-symbol">USDT</span>
            <span class="coin-name">TetherUS</span>
          </div>
        </div>
        <div class="balance-info">
          <span class="label">الرصيد الحالي</span>
          <span class="value">{{ userBalance.toFixed(2) }} USDT</span>
        </div>
      </div>

      <!-- Network Selector Dropdown -->
      <div class="input-section">
        <label class="section-label">اختر الشبكة</label>
        <div class="dropdown-container" @click="toggleDropdown" v-click-outside="closeDropdown">
          <div class="dropdown-selected" :class="{ 'is-open': isDropdownOpen }">
            <div class="selected-info">
              <img :src="getNetworkIconUrl(network)" class="net-icon-real" alt="">
              <span class="net-name">{{ network }}</span>
            </div>
            <i class="fas fa-chevron-down arrow-icon"></i>
          </div>
          
          <transition name="slide-fade">
            <div v-if="isDropdownOpen" class="dropdown-list">
              <div 
                v-for="(addr, net) in addresses" 
                :key="net" 
                class="dropdown-item"
                :class="{ 'active': network === net }"
                @click.stop="selectNetwork(net)"
              >
                <div class="item-left">
                  <img :src="getNetworkIconUrl(net)" class="net-icon-real" alt="">
                  <div class="item-text">
                    <span class="net-title">{{ net }}</span>
                    <span class="net-desc">{{ getNetworkDesc(net) }}</span>
                  </div>
                </div>
                <i v-if="network === net" class="fas fa-check"></i>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Deposit Details Card - محسن بشكل كبير -->
      <div class="deposit-card">
        <!-- QR Section - مكبر ومحسن -->
        <div class="qr-section">
          <div class="qr-frame">
            <img :src="getQr(network)" :alt="network" class="qr-code">
            <div v-if="loading" class="qr-loader">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
          </div>
          <p class="qr-tip">امسح رمز QR للإيداع</p>
        </div>

        <!-- Address Section - محسن بشكل كبير -->
        <div class="address-section">
          <div class="label-row">
            <span class="addr-label">عنوان الإيداع</span>
            <span class="network-tag">{{ network }}</span>
          </div>
          <div class="address-display">
            <div class="address-text">{{ getAddress(network) }}</div>
            <button class="copy-icon-btn" @click="copyAddress">
              <i :class="copied ? 'fas fa-check' : 'far fa-copy'"></i>
              <span class="copy-text">{{ copied ? 'تم النسخ' : 'نسخ' }}</span>
            </button>
          </div>
          <transition name="fade">
            <div v-if="copied" class="copy-toast">تم نسخ العنوان بنجاح</div>
          </transition>
        </div>
      </div>

      <!-- Instructions -->
      <div class="tips-box">
        <div class="tips-header">
          <i class="fas fa-lightbulb"></i>
          <span>نصائح هامة</span>
        </div>
        <ul class="tips-list">
          <li>يرجى التأكد من اختيار شبكة <strong>{{ network }}</strong> عند التحويل.</li>
          <li>سيتم إضافة الرصيد تلقائياً بعد تأكيد الشبكة.</li>
          <li>لا تقم بإيداع أي عملات أخرى غير USDT لهذا العنوان.</li>
          <li>لا يوجد حد أدنى للإيداع - يمكنك إيداع أي مبلغ تريده.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default {
  name: "Recharge",
  directives: {
    'click-outside': {
      beforeMount(el, binding) {
        el.clickOutsideEvent = (event) => {
          if (!(el === event.target || el.contains(event.target))) {
            binding.value();
          }
        };
        document.addEventListener('click', el.clickOutsideEvent);
      },
      unmounted(el) {
        document.removeEventListener('click', el.clickOutsideEvent);
      }
    }
  },
  data() {
    return {
      network: "TRC20",
      isDropdownOpen: false,
      copied: false,
      loading: false,
      addresses: {
        TRC20: "TNabUE7114PbHQ4PYK4y53fMBANQ6Q837R",
        ERC20: "0x8A52D2e160DD3F2AC524e2c60acb9cA990c5A070",
        BEP20: "0x8A52D2e160DD3F2AC524e2c60acb9cA990c5A070",
        SOL: "4AKmCRQ5sewUiJ8YRqSbBjr817byg829hswXQ9pT7gW9",
      },
      userEmail: "",
      userId: "",
      userBalance: 0,
    };
  },
  mounted() {
    this.initializeUser();
  },
  methods: {
    async fetchUserBalance() {
      if (!this.userId) return;
      try {
        const userDoc = await getDoc(doc(db, "users", this.userId));
        if (userDoc.exists()) {
          this.userBalance = userDoc.data().balance || 0;
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    },
    initializeUser() {
      const auth = getAuth();
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          this.userEmail = user.email;
          this.userId = user.uid;
          await this.fetchUserBalance();
        }
      });
    },
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    closeDropdown() {
      this.isDropdownOpen = false;
    },
    selectNetwork(net) {
      this.network = net;
      this.isDropdownOpen = false;
    },
    getQr(net) {
      return `/qr/${net}.png`;
    },
    getAddress(net) {
      return this.addresses[net] || "";
    },
    getNetworkIconUrl(net) {
      const icons = {
        TRC20: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png",
        ERC20: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
        BEP20: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
        SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png"
      };
      return icons[net] || "";
    },
    getNetworkDesc(net) {
      const descs = {
        TRC20: "Tron Network (TRX)",
        ERC20: "Ethereum Network (ETH)",
        BEP20: "BNB Smart Chain (BSC)",
        SOL: "Solana Network"
      };
      return descs[net] || "";
    },
    handleImageError(e) {
      e.target.style.display = 'none';
    },
    async copyAddress() {
      const text = this.getAddress(this.network);
      try {
        await navigator.clipboard.writeText(text);
        this.copied = true;
        setTimeout(() => (this.copied = false), 2000);
      } catch (err) {
        console.error("Copy failed");
      }
    }
  }
};
</script>

<style scoped>
.recharge-page {
  min-height: 100vh;
  background: #0b0e11;
  color: #eaecef;
  direction: rtl;
  font-family: 'Cairo', sans-serif;
}

/* Top Nav */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #181a20;
  border-bottom: 1px solid #2b2f36;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-center {
  font-weight: 700;
  font-size: 18px;
}

.nav-left, .nav-right {
  font-size: 20px;
  cursor: pointer;
  color: #848e9c;
}

.main-content {
  max-width: 550px;
  margin: 0 auto;
  padding: 16px 20px;
}

/* Asset Card */
.asset-card {
  background: #1e2329;
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border: 1px solid #2b2f36;
}

.asset-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coin-logo-real {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: contain;
}

.net-icon-real {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: contain;
}

.coin-symbol {
  display: block;
  font-size: 18px;
  font-weight: 700;
}

.coin-name {
  font-size: 12px;
  color: #848e9c;
}

.balance-info {
  text-align: left;
}

.balance-info .label {
  display: block;
  font-size: 12px;
  color: #848e9c;
}

.balance-info .value {
  font-weight: 700;
  color: #fcd535;
  font-size: 18px;
}

/* Dropdown */
.input-section {
  margin-bottom: 20px;
}

.section-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #eaecef;
  margin-bottom: 8px;
}

.dropdown-container {
  position: relative;
  cursor: pointer;
}

.dropdown-selected {
  background: #1e2329;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #fcd535;
  transition: all 0.2s;
}

.dropdown-selected.is-open {
  border-color: #fcd535;
  box-shadow: 0 0 8px rgba(252, 213, 53, 0.3);
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.net-name {
  font-weight: 600;
  font-size: 16px;
}

.dropdown-list {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #1e2329;
  border-radius: 12px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  border: 1px solid #fcd535;
}

.dropdown-item {
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #2b2f36;
}

.dropdown-item.active {
  background: rgba(252, 213, 53, 0.1);
}

.item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.net-title {
  display: block;
  font-weight: 600;
  font-size: 15px;
}

.net-desc {
  font-size: 11px;
  color: #848e9c;
}

.dropdown-item i {
  color: #fcd535;
}

/* Deposit Card - محسن بشكل كبير */
.deposit-card {
  background: #181a20;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #2b2f36;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* QR Section - مكبر */
.qr-section {
  text-align: center;
  margin-bottom: 32px;
}

.qr-frame {
  display: inline-block;
  background: #ffffff;
  padding: 16px;
  border-radius: 20px;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.qr-code {
  width: 200px;
  height: 200px;
  display: block;
}

@media (min-width: 480px) {
  .qr-code {
    width: 240px;
    height: 240px;
  }
}

.qr-tip {
  margin-top: 12px;
  font-size: 13px;
  color: #848e9c;
  font-weight: 500;
}

/* Address Section - محسن */
.address-section {
  background: #0b0e11;
  border-radius: 16px;
  padding: 18px 20px;
  position: relative;
  border: 1px solid #fcd535;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.addr-label {
  font-size: 13px;
  font-weight: 600;
  color: #eaecef;
}

.network-tag {
  font-size: 11px;
  background: rgba(252, 213, 53, 0.15);
  color: #fcd535;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 700;
}

.address-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: #0b0e11;
  border-radius: 12px;
}

.address-text {
  font-family: 'Courier New', 'Monaco', monospace;
  font-size: 15px;
  font-weight: 600;
  word-break: break-all;
  color: #eaecef;
  line-height: 1.5;
  letter-spacing: 0.5px;
  flex: 1;
  background: #0b0e11;
  padding: 4px 0;
}

@media (min-width: 480px) {
  .address-text {
    font-size: 16px;
  }
}

.copy-icon-btn {
  background: rgba(252, 213, 53, 0.15);
  border: 1px solid rgba(252, 213, 53, 0.3);
  color: #fcd535;
  font-size: 14px;
  cursor: pointer;
  padding: 10px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-weight: 600;
  min-width: 80px;
  justify-content: center;
}

.copy-icon-btn:hover {
  background: rgba(252, 213, 53, 0.25);
  border-color: #fcd535;
  transform: scale(1.02);
}

.copy-icon-btn i {
  font-size: 16px;
}

.copy-text {
  font-size: 13px;
}

.copy-toast {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #0ecb81;
  background: #1e2329;
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
  font-weight: 600;
}

/* Tips Box */
.tips-box {
  background: rgba(252, 213, 53, 0.05);
  border-radius: 16px;
  padding: 16px 20px;
  border: 1px solid rgba(252, 213, 53, 0.1);
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fcd535;
  font-weight: 700;
  margin-bottom: 12px;
  font-size: 14px;
}

.tips-list {
  margin: 0;
  padding-right: 20px;
  font-size: 12px;
  color: #848e9c;
  line-height: 1.8;
}

.tips-list li {
  margin-bottom: 6px;
}

.tips-list strong {
  color: #fcd535;
}

/* Responsive */
@media (max-width: 480px) {
  .main-content {
    padding: 12px 16px;
  }
  
  .deposit-card {
    padding: 20px;
  }
  
  .qr-code {
    width: 160px;
    height: 160px;
  }
  
  .address-text {
    font-size: 13px;
  }
  
  .copy-icon-btn {
    padding: 8px 12px;
    min-width: 70px;
  }
  
  .copy-text {
    font-size: 11px;
  }
  
  .copy-icon-btn i {
    font-size: 14px;
  }
}

/* Animations */
.slide-fade-enter-active { transition: all 0.2s ease-out; }
.slide-fade-enter-from { transform: translateY(-10px); opacity: 0; }

.fade-enter-active { transition: opacity 0.3s; }
.fade-enter-from { opacity: 0; }
</style>
