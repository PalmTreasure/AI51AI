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
          <span class="balance-label">رصيدك الحالي القابل للسحب</span>
          <div class="balance-display">
            <img src="https://assets.coingecko.com/coins/images/325/large/tether.png" alt="USDT" class="balance-usdt-icon">
            <span class="balance-amount">{{ vipBalance.toFixed(2) }}</span>
            <span class="balance-currency-badge">USDT</span>
          </div>
        </div>
      </div>

      <!-- حالة VIP -->
      <div v-if="userVipLevel" class="vip-status-box">
        <div class="vip-badge">
          <i class="fas fa-crown"></i>
          مستوى VIP {{ userVipLevel }}
        </div>
        <div class="user-contact">
          <i class="fas fa-phone" v-if="userPhone"></i>
          <i class="fas fa-envelope" v-else></i>
          {{ userContact }}
        </div>
        <div class="withdraw-condition">
          <i class="fas fa-check-circle" :class="{ 'condition-met': isVIP8OrAbove || vipBalance >= minWithdrawAmount }"></i>
          <span>الحد الأدنى: <strong>{{ isVIP8OrAbove ? 'بدون حد أدنى' : minWithdrawAmount + ' USDT' }}</strong></span>
        </div>
        <div class="withdraw-condition">
          <i class="fas fa-check-circle" :class="{ 'condition-met': isAllowedDay }"></i>
          <span>يوم السحب: <strong>{{ isVIP8OrAbove ? 'أي يوم' : withdrawDay }}</strong></span>
        </div>
        <div v-if="isVIP8OrAbove" class="vip-special-badge">
          <i class="fas fa-star"></i>
          مميزات VIP 8+: سحب أي مبلغ في أي وقت
        </div>
      </div>

      <div v-else class="vip-status-box error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>يجب أن يكون لديك اشتراك VIP للسحب</p>
      </div>

      <!-- ============================================================ -->
      <!-- حالة الانتظار 24 ساعة (تظهر بعد السحب مباشرة) -->
      <!-- ============================================================ -->
      <div v-if="waitingForNextTask && userVipLevel" class="waiting-card">
        <div class="waiting-header">
          <i class="fas fa-clock waiting-icon"></i>
          <div>
            <h3 class="waiting-title">⏳ انتظار المهمة التالية</h3>
            <p class="waiting-subtitle">تم إكمال عملية السحب. يرجى الانتظار 24 ساعة للمهمة التالية</p>
          </div>
        </div>
        <div class="waiting-body">
          <div class="waiting-timer">
            <i class="fas fa-hourglass-half"></i>
            <span>الوقت المتبقي: <strong>{{ remainingWaitTime }}</strong></span>
          </div>
          <div class="waiting-progress">
            <div class="waiting-progress-track">
              <div class="waiting-progress-fill" :style="{ width: waitProgress + '%' }"></div>
            </div>
            <span class="waiting-progress-text">{{ Math.round(waitProgress) }}%</span>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- مهمة السحب (تظهر فقط إذا لم تكن في فترة انتظار ولم تكتمل المهمة) -->
      <!-- ============================================================ -->
      <div v-if="!isWithdrawAllowed && !waitingForNextTask && userVipLevel && withdrawTask && withdrawTask.status === 'pending'">
        <div class="task-card">
          <div class="task-header">
            <i class="fas fa-lock task-lock-icon"></i>
            <div>
              <h3 class="task-title">🔒 إكمال مهمة السحب</h3>
              <p class="task-subtitle">لفتح السحب يجب إكمال المهمة التالية</p>
            </div>
          </div>

          <div class="task-body">
            <div class="task-requirement">
              <div class="task-icon-wrapper">
                <i class="fas fa-user-plus"></i>
              </div>
              <div class="task-description">
                <p class="task-desc-text">دعوة عضو جديد واحد</p>
                <p class="task-desc-sub">يجب أن يقوم العضو بتفعيل VIP {{ requiredVipLevel }} أو أعلى</p>
              </div>
            </div>

            <div class="task-progress">
              <div class="task-progress-info">
                <span class="task-progress-label">المطلوب</span>
                <span class="task-progress-value">1</span>
              </div>
              <div class="task-progress-info">
                <span class="task-progress-label">المكتمل</span>
                <span class="task-progress-value" :class="{ 'completed': taskCompletedCount >= 1 }">
                  {{ taskCompletedCount }}/1
                </span>
              </div>
            </div>

            <div class="task-progress-bar">
              <div class="task-progress-track">
                <div 
                  class="task-progress-fill" 
                  :style="{ width: Math.min((taskCompletedCount / 1) * 100, 100) + '%' }"
                ></div>
              </div>
              <span class="task-progress-percent">{{ Math.min((taskCompletedCount / 1) * 100, 100) }}%</span>
            </div>
          </div>

          <button 
            class="task-confirm-btn" 
            @click="checkTaskCompletion"
            :disabled="taskLoading"
          >
            <i class="fas fa-check-circle" v-if="!taskLoading"></i>
            <i class="fas fa-spinner fa-spin" v-else></i>
            {{ taskLoading ? 'جاري التحقق...' : '✅ تأكيد المهام' }}
          </button>

          <div v-if="taskMessage" class="task-message" :class="taskMessageType">
            <i :class="taskMessageType === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
            {{ taskMessage }}
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- نموذج السحب (يظهر فقط عند اكتمال المهمة) -->
      <!-- ============================================================ -->
      <div v-if="isWithdrawAllowed && userVipLevel">
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
          <input type="text" style="display:none!important;position:absolute!important;left:-9999px!important;top:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;" autocomplete="off" name="w_fake_1" tabindex="-1">
          <input type="password" style="display:none!important;position:absolute!important;left:-9999px!important;top:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;" autocomplete="new-password" name="w_fake_2" tabindex="-1">
          
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
          <input type="text" style="display:none!important;position:absolute!important;left:-9999px!important;top:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;" autocomplete="username" name="p_fake_1" tabindex="-1">
          <input type="password" style="display:none!important;position:absolute!important;left:-9999px!important;top:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;" autocomplete="current-password" name="p_fake_2" tabindex="-1">
          
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
            <span class="summary-value">{{ userVipLevel || 'لا يوجد' }}</span>
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
          
          <div class="summary-item">
            <span>يوم السحب:</span>
            <span class="summary-value">{{ isVIP8OrAbove ? 'أي يوم' : withdrawDay }}</span>
          </div>
          
          <div class="summary-item">
            <span>الحد الأدنى:</span>
            <span class="summary-value">{{ isVIP8OrAbove ? 'بدون حد أدنى' : minWithdrawAmount + ' USDT' }}</span>
          </div>
          
          <div class="summary-item total">
            <span>سيتم خصم من رصيد VIP:</span>
            <span class="summary-value">{{ Number(amount).toFixed(2) }} USDT</span>
          </div>
          
          <div class="summary-item">
            <span>رصيد VIP بعد السحب:</span>
            <span class="summary-value">{{ (vipBalance - Number(amount)).toFixed(2) }} USDT</span>
          </div>
        </div>

        <!-- تحذيرات -->
        <div class="warning-box">
          <i class="fas fa-shield-alt"></i>
          <div class="warning-text">
            <p>يرجى التأكد من صحة المعلومات قبل الإرسال</p>
            <p class="small">سيتم خصم {{ Number(amount) || 0 }} USDT من رصيد VIP الخاص بك. ستستلم {{ netAmount.toFixed(2) }} USDT بعد خصم 5% رسوم</p>
          </div>
        </div>

        <!-- زر السحب -->
        <button 
          class="gold-button" 
          @click="submitWithdraw"
          :disabled="isLoading || !isFormValid"
        >
          <i class="fas fa-paper-plane" v-if="!isLoading"></i>
          <i class="fas fa-spinner fa-spin" v-else></i>
          {{ isLoading ? 'جاري المعالجة...' : 'تأكيد السحب' }}
        </button>

        <!-- رسائل الخطأ والنجاح -->
        <transition name="fade">
          <div v-if="message" class="message" :class="messageType">
            <i :class="messageType === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
            {{ message }}
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, db } from "../firebase";
import { doc, getDoc, runTransaction, collection, serverTimestamp, query, where, getDocs, getCountFromServer, addDoc, updateDoc, deleteDoc, orderBy, limit } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";

// ========== نظام التخزين المؤقت المحلي ==========
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

function getCachedData(key) {
  const cached = dataCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  dataCache.delete(key);
  return null;
}

function setCachedData(key, data) {
  dataCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export default {
  name: "Withdraw",
  
  data() {
    return {
      vipBalance: 0,
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
      minWithdrawAmount: 5,
      showNetworkDropdown: false,
      networks: [
        { value: 'TRC20', label: 'Tron (TRC20)' },
        { value: 'ERC20', label: 'Ethereum (ERC20)' },
        { value: 'BEP20', label: 'BNB Chain (BEP20)' },
        { value: 'SOL', label: 'Solana (SOL)' }
      ],
      
      amountError: "",
      networkError: "",
      walletError: "",
      
      feePercentage: 5,
      
      vipLimits: {
        1: 5,
        2: 7,
        3: 25,
        4: 50,
        5: 150,
        6: 450,
        7: 675,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
        13: 0,
        14: 0,
        15: 0
      },
      
      withdrawDays: {
        1: "السبت", 2: "السبت", 3: "السبت",
        4: "الأحد", 5: "الأحد",
        6: "الاثنين", 7: "الاثنين",
        8: "أي يوم", 9: "أي يوم",
        10: "أي يوم", 11: "أي يوم",
        12: "أي يوم", 13: "أي يوم",
        14: "أي يوم", 15: "أي يوم"
      },

      dataLoaded: false,
      cacheKey: '',
      
      // نظام المهام
      withdrawTask: null,
      taskCompletedCount: 0,
      requiredVipLevel: null,
      taskLoading: false,
      taskMessage: "",
      taskMessageType: "info",
      isWithdrawAllowed: false,
      
      // نظام الانتظار 24 ساعة
      waitingForNextTask: false,
      lastCompletedTaskAt: null,
      waitTimer: null,
      remainingWaitTime: "--:--:--",
      waitProgress: 0,
    };
  },

  computed: {
    isVIP8OrAbove() {
      return this.userVipLevel >= 8;
    },

    withdrawDay() {
      return this.withdrawDays[this.userVipLevel] || "";
    },

    isAllowedDay() {
      if (!this.userVipLevel) return false;
      if (this.isVIP8OrAbove) return true;
      
      const dayMap = {
        "السبت": "Saturday",
        "الأحد": "Sunday",
        "الاثنين": "Monday",
        "الثلاثاء": "Tuesday",
        "الأربعاء": "Wednesday",
        "الخميس": "Thursday",
        "الجمعة": "Friday"
      };
      
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const allowedDay = this.withdrawDays[this.userVipLevel];
      return today === dayMap[allowedDay];
    },

    fee() {
      if (!this.amount) return 0;
      return (Number(this.amount) * this.feePercentage) / 100;
    },

    netAmount() {
      if (!this.amount) return 0;
      return Number(this.amount) - this.fee;
    },

    isFormValid() {
      if (this.isVIP8OrAbove) {
        return (
          this.amount && 
          !this.amountError &&
          this.network && 
          !this.networkError &&
          this.wallet && 
          !this.walletError &&
          this.password &&
          this.userVipLevel &&
          this.vipBalance >= Number(this.amount) &&
          Number(this.amount) > 0
        );
      }
      
      return (
        this.amount && 
        !this.amountError &&
        this.network && 
        !this.networkError &&
        this.wallet && 
        !this.walletError &&
        this.password &&
        this.userVipLevel &&
        this.isAllowedDay &&
        Number(this.amount) === this.minWithdrawAmount &&
        this.vipBalance >= Number(this.amount)
      );
    },

    showSummary() {
      return this.amount && this.network && this.wallet && this.userVipLevel;
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
    },
    network() {
      this.validateNetwork();
    },
    wallet() {
      this.validateWallet();
    },
    userVipLevel() {
      if (this.userVipLevel) {
        if (!this.isVIP8OrAbove) {
          this.minWithdrawAmount = this.vipLimits[this.userVipLevel] || 5;
        } else {
          this.minWithdrawAmount = 0;
        }
        this.requiredVipLevel = this.userVipLevel - 1;
        if (this.requiredVipLevel < 1) this.requiredVipLevel = 1;
      }
    }
  },

  async created() {
    console.log("🔵 [created] بدء تحميل الصفحة");
    const user = auth.currentUser;
    if (user) {
      this.cacheKey = `user_data_${user.uid}`;
      const cachedData = getCachedData(this.cacheKey);
      if (cachedData && !this.dataLoaded) {
        this.applyUserData(cachedData);
        await this.loadWithdrawTask();
        return;
      }
    }
    
    await this.loadUserData();
    await this.loadWithdrawTask();
  },

  mounted() {
    this.clearBrowserAutofill();
    this.preventAutocomplete();
  },

  beforeUnmount() {
    if (this.waitTimer) {
      clearInterval(this.waitTimer);
      this.waitTimer = null;
    }
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

    applyUserData(userData) {
      console.log("🟢 [applyUserData] تطبيق بيانات المستخدم:", userData);
      if (typeof userData.vipBalance === 'number') {
        this.vipBalance = userData.vipBalance;
      } else if (typeof userData.balance === 'number') {
        this.vipBalance = userData.balance;
      } else {
        this.vipBalance = 0;
      }
      
      this.userPhone = userData.phoneNumber || "";
      this.userEmail = userData.email || "";
      
      if (userData.vipLevel) {
        this.userVipLevel = userData.vipLevel;
      } else if (userData.vipData) {
        this.userVipLevel = userData.vipData.level;
      }
      
      this.dataLoaded = true;
    },

    async loadUserData() {
      const user = auth.currentUser;
      if (!user) {
        this.$router.push("/login");
        return;
      }

      try {
        const cacheKey = this.cacheKey || `user_data_${user.uid}`;
        const cachedData = getCachedData(cacheKey);
        
        if (cachedData) {
          this.applyUserData(cachedData);
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          const cacheData = {
            vipBalance: userData.vipBalance || userData.balance || 0,
            phoneNumber: userData.phoneNumber || "",
            email: userData.email || "",
            vipLevel: userData.vipLevel || null,
            vipData: null
          };

          if (!cacheData.vipLevel) {
            const vipRef = doc(db, "users", user.uid, "vip", "current");
            const vipSnap = await getDoc(vipRef);
            if (vipSnap.exists()) {
              cacheData.vipData = { level: vipSnap.data().level };
            }
          }

          setCachedData(cacheKey, cacheData);
          this.applyUserData(cacheData);
          
          if (!this.userVipLevel && !cacheData.vipData) {
            this.showMessage("لا يوجد اشتراك VIP نشط", "error");
          }
        }
      } catch (error) {
        console.error("خطأ:", error);
        this.showMessage("حدث خطأ في تحميل البيانات", "error");
      }
    },

    // ================================================================
    // نظام المهام
    // ================================================================

    checkWaitPeriod(completedAt) {
      if (!completedAt) return false;
      
      let completedDate;
      if (completedAt.toDate) {
        completedDate = completedAt.toDate();
      } else if (completedAt instanceof Date) {
        completedDate = completedAt;
      } else {
        completedDate = new Date(completedAt);
      }
      
      const now = new Date();
      const diffMs = now.getTime() - completedDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        this.waitingForNextTask = true;
        this.lastCompletedTaskAt = completedDate;
        this.startWaitTimer();
        this.isWithdrawAllowed = false;
        return true;
      }
      
      this.waitingForNextTask = false;
      this.lastCompletedTaskAt = null;
      this.stopWaitTimer();
      return false;
    },

    startWaitTimer() {
      if (this.waitTimer) {
        clearInterval(this.waitTimer);
      }
      this.updateWaitDisplay();
      this.waitTimer = setInterval(() => {
        this.updateWaitDisplay();
      }, 1000);
    },

    stopWaitTimer() {
      if (this.waitTimer) {
        clearInterval(this.waitTimer);
        this.waitTimer = null;
      }
    },

    updateWaitDisplay() {
      if (!this.lastCompletedTaskAt) {
        this.remainingWaitTime = "--:--:--";
        this.waitProgress = 100;
        return;
      }
      
      const now = new Date();
      const completed = new Date(this.lastCompletedTaskAt);
      const elapsedMs = now.getTime() - completed.getTime();
      const totalMs = 24 * 60 * 60 * 1000;
      
      if (elapsedMs >= totalMs) {
        this.waitingForNextTask = false;
        this.stopWaitTimer();
        this.remainingWaitTime = "00:00:00";
        this.waitProgress = 100;
        // إعادة تحميل المهمة لإنشاء مهمة جديدة
        this.loadWithdrawTask();
        return;
      }
      
      const remainingMs = totalMs - elapsedMs;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      
      this.remainingWaitTime = 
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');
      
      this.waitProgress = (elapsedMs / totalMs) * 100;
    },

    async loadWithdrawTask() {
      const user = auth.currentUser;
      console.log("🟡 [loadWithdrawTask] بدء تحميل المهمة للمستخدم:", user?.uid);
      
      if (!user || !this.userVipLevel) {
        console.log("🟡 [loadWithdrawTask] لا يوجد مستخدم أو VIP، الخروج");
        return;
      }

      try {
        const taskRef = collection(db, "users", user.uid, "withdrawTasks");
        const q = query(taskRef, orderBy("createdAt", "desc"), limit(10));
        const snapshot = await getDocs(q);
        
        console.log(`🟡 [loadWithdrawTask] عدد المهام: ${snapshot.size}`);
        
        let pendingTask = null;
        let completedTask = null;

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          if (data.status === "pending") {
            pendingTask = { id: docSnap.id, ...data };
            break;
          } else if (data.status === "completed" && !completedTask) {
            completedTask = { id: docSnap.id, ...data };
          }
        }

        // حالة 1: مهمة معلقة
        if (pendingTask) {
          console.log("🟢 [loadWithdrawTask] توجد مهمة معلقة:", pendingTask.id);
          this.withdrawTask = pendingTask;
          this.requiredVipLevel = pendingTask.requiredVipLevel;
          
          await this.calculateTaskProgress(pendingTask.id, pendingTask.createdAt);
          
          if (this.taskCompletedCount >= 1) {
            console.log("🟢 [loadWithdrawTask] المهمة مكتملة -> السماح بالسحب");
            this.isWithdrawAllowed = true;
            await updateDoc(doc(db, "users", user.uid, "withdrawTasks", pendingTask.id), {
              status: "completed",
              completedAt: serverTimestamp()
            });
            this.withdrawTask.status = "completed";
          } else {
            this.isWithdrawAllowed = false;
          }
          return;
        }

        // حالة 2: مهمة مكتملة
        if (completedTask) {
          console.log("🟢 [loadWithdrawTask] توجد مهمة مكتملة:", completedTask.id);
          this.withdrawTask = completedTask;
          this.requiredVipLevel = completedTask.requiredVipLevel;
          
          const isWaiting = this.checkWaitPeriod(completedTask.completedAt || completedTask.updatedAt);
          
          if (isWaiting) {
            console.log("🟡 [loadWithdrawTask] في فترة انتظار 24 ساعة");
            this.isWithdrawAllowed = false;
            return;
          } else {
            console.log("🟢 [loadWithdrawTask] انتهت فترة الانتظار، إنشاء مهمة جديدة");
            await deleteDoc(doc(db, "users", user.uid, "withdrawTasks", completedTask.id));
            await this.createNewWithdrawTask();
            return;
          }
        }

        // حالة 3: لا توجد مهام
        console.log("🟡 [loadWithdrawTask] لا توجد مهام، إنشاء مهمة جديدة");
        await this.createNewWithdrawTask();

      } catch (error) {
        console.error("❌ [loadWithdrawTask] خطأ:", error);
        await this.createNewWithdrawTask();
      }
    },

    async createNewWithdrawTask() {
      const user = auth.currentUser;
      console.log("🟡 [createNewWithdrawTask] بدء إنشاء مهمة جديدة");
      
      if (!user || !this.userVipLevel) return;

      try {
        // التحقق من وجود مهمة معلقة
        const taskRef = collection(db, "users", user.uid, "withdrawTasks");
        const pendingQuery = query(taskRef, where("status", "==", "pending"), limit(1));
        const pendingSnapshot = await getDocs(pendingQuery);
        
        if (!pendingSnapshot.empty) {
          const existingDoc = pendingSnapshot.docs[0];
          this.withdrawTask = { id: existingDoc.id, ...existingDoc.data() };
          this.taskCompletedCount = this.withdrawTask.completedCount || 0;
          this.isWithdrawAllowed = false;
          return;
        }

        let requiredLevel = this.userVipLevel - 1;
        if (requiredLevel < 1) requiredLevel = 1;
        this.requiredVipLevel = requiredLevel;

        const newTask = {
          userId: user.uid,
          userVipLevel: this.userVipLevel,
          requiredVipLevel: requiredLevel,
          requiredCount: 1,
          completedCount: 0,
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(taskRef, newTask);
        this.withdrawTask = { id: docRef.id, ...newTask };
        this.taskCompletedCount = 0;
        this.isWithdrawAllowed = false;
        this.waitingForNextTask = false;
        this.stopWaitTimer();
        
        console.log("✅ [createNewWithdrawTask] تم إنشاء مهمة جديدة");
      } catch (error) {
        console.error("❌ [createNewWithdrawTask] خطأ:", error);
      }
    },

    async calculateTaskProgress(taskId, taskCreatedAt) {
      const user = auth.currentUser;
      console.log(`🟡 [calculateTaskProgress] حساب تقدم المهمة ${taskId}`);
      
      if (!user || !this.userVipLevel) return;

      try {
        let createdAtDate;
        if (taskCreatedAt && taskCreatedAt.toDate) {
          createdAtDate = taskCreatedAt.toDate();
        } else if (taskCreatedAt instanceof Date) {
          createdAtDate = taskCreatedAt;
        } else if (taskCreatedAt) {
          createdAtDate = new Date(taskCreatedAt);
        } else {
          createdAtDate = new Date();
          createdAtDate.setMinutes(createdAtDate.getMinutes() - 1);
        }

        const requiredLevel = this.requiredVipLevel || this.userVipLevel - 1;
        if (requiredLevel < 1) {
          this.taskCompletedCount = 1;
          return;
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("referredBy", "==", user.uid));
        const snapshot = await getDocs(q);
        
        let completedCount = 0;

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          
          let userCreatedAt;
          if (data.createdAt && data.createdAt.toDate) {
            userCreatedAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            userCreatedAt = data.createdAt;
          } else if (data.createdAt) {
            userCreatedAt = new Date(data.createdAt);
          } else {
            continue;
          }

          if (userCreatedAt <= createdAtDate) continue;

          let invitedUserVipLevel = data.vipLevel || 0;
          
          if (!invitedUserVipLevel) {
            try {
              const vipRef = doc(db, "users", docSnap.id, "vip", "current");
              const vipSnap = await getDoc(vipRef);
              if (vipSnap.exists()) {
                invitedUserVipLevel = vipSnap.data().level || 0;
              }
            } catch (e) {}
          }

          if (invitedUserVipLevel >= requiredLevel) {
            completedCount++;
          }
        }

        this.taskCompletedCount = completedCount;
        
        if (this.withdrawTask && this.withdrawTask.id) {
          await updateDoc(doc(db, "users", user.uid, "withdrawTasks", this.withdrawTask.id), {
            completedCount: completedCount,
            updatedAt: serverTimestamp()
          });
          this.withdrawTask.completedCount = completedCount;
        }

      } catch (error) {
        console.error("❌ [calculateTaskProgress] خطأ:", error);
        this.taskCompletedCount = 0;
      }
    },

    async checkTaskCompletion() {
      const user = auth.currentUser;
      console.log("🟡 [checkTaskCompletion] بدء التحقق");
      
      if (!user) {
        this.taskMessage = "الرجاء تسجيل الدخول";
        this.taskMessageType = "error";
        return;
      }
      
      if (this.waitingForNextTask) {
        this.taskMessage = `⏳ يرجى الانتظار ${this.remainingWaitTime}`;
        this.taskMessageType = "info";
        return;
      }
      
      if (!this.withdrawTask) {
        await this.loadWithdrawTask();
        if (!this.withdrawTask) {
          await this.createNewWithdrawTask();
        }
      }

      if (this.withdrawTask && this.withdrawTask.status === "completed") {
        this.isWithdrawAllowed = true;
        this.taskMessage = "✅ تم إكمال المهمة! يمكنك السحب.";
        this.taskMessageType = "success";
        return;
      }

      this.taskLoading = true;
      this.taskMessage = "";

      try {
        if (!this.withdrawTask || !this.withdrawTask.id) {
          this.taskMessage = "جارٍ إنشاء مهمة جديدة...";
          this.taskMessageType = "info";
          await this.createNewWithdrawTask();
          this.taskLoading = false;
          return;
        }

        await this.calculateTaskProgress(
          this.withdrawTask.id,
          this.withdrawTask.createdAt
        );

        if (this.taskCompletedCount >= 1) {
          this.isWithdrawAllowed = true;
          
          await updateDoc(doc(db, "users", user.uid, "withdrawTasks", this.withdrawTask.id), {
            status: "completed",
            completedAt: serverTimestamp()
          });
          this.withdrawTask.status = "completed";
          
          this.taskMessage = "✅ تم إكمال المهمة بنجاح! يمكنك السحب.";
          this.taskMessageType = "success";
        } else {
          this.taskMessage = `❌ لم تكتمل المهمة بعد. المكتمل: ${this.taskCompletedCount}/1`;
          this.taskMessageType = "error";
          this.isWithdrawAllowed = false;
        }
      } catch (error) {
        console.error("❌ [checkTaskCompletion] خطأ:", error);
        this.taskMessage = "حدث خطأ في التحقق من المهمة";
        this.taskMessageType = "error";
      } finally {
        this.taskLoading = false;
      }
    },

    async resetWithdrawTask() {
      const user = auth.currentUser;
      console.log("🟡 [resetWithdrawTask] بدء إعادة تعيين المهمة");
      
      if (!user) return;

      try {
        if (this.withdrawTask && this.withdrawTask.id) {
          await updateDoc(doc(db, "users", user.uid, "withdrawTasks", this.withdrawTask.id), {
            status: "completed",
            completedAt: serverTimestamp()
          });
          this.withdrawTask.status = "completed";
        }
        
        this.isWithdrawAllowed = false;
        this.taskCompletedCount = 1;
        this.waitingForNextTask = true;
        this.lastCompletedTaskAt = new Date();
        this.startWaitTimer();
        
        console.log("✅ [resetWithdrawTask] بدء فترة انتظار 24 ساعة");
      } catch (error) {
        console.error("❌ [resetWithdrawTask] خطأ:", error);
      }
    },

    // ================================================================
    // دوال التحقق
    // ================================================================

    validateAmount() {
      if (!this.amount) {
        this.amountError = "الرجاء إدخال المبلغ";
      } else if (this.isVIP8OrAbove) {
        if (this.amount > this.vipBalance) {
          this.amountError = "المبلغ أكبر من رصيد VIP الخاص بك";
        } else if (this.amount <= 0) {
          this.amountError = "الرجاء إدخال مبلغ أكبر من صفر";
        } else {
          this.amountError = "";
        }
      } else if (Number(this.amount) !== this.minWithdrawAmount) {
        this.amountError = `يجب سحب ${this.minWithdrawAmount} USDT فقط`;
      } else if (this.amount > this.vipBalance) {
        this.amountError = "رصيد VIP غير كافٍ للسحب";
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

    // ================================================================
    // تقديم طلب السحب
    // ================================================================

    async submitWithdraw() {
      if (!this.isWithdrawAllowed) {
        this.showMessage("❌ يجب إكمال مهمة السحب أولاً", "error");
        return;
      }

      if (!this.isFormValid) return;

      this.isLoading = true;
      const user = auth.currentUser;
      const withdrawAmount = Number(this.amount);
      const feeAmount = this.fee;
      const netAmountValue = this.netAmount;
      const transactionId = "WITHDRAW_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);

      try {
        try {
          await signInWithEmailAndPassword(auth, user.email, this.password);
        } catch (authError) {
          this.showMessage("❌ كلمة المرور غير صحيحة.", "error");
          this.isLoading = false;
          return;
        }

        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const withdrawRequestsRef = collection(db, "withdraw_requests");
        const q = query(
          withdrawRequestsRef,
          where("userId", "==", user.uid),
          where("createdAt", ">=", twentyFourHoursAgo)
        );

        try {
          const countSnapshot = await getCountFromServer(q);
          if (countSnapshot.data().count > 0) {
            this.showMessage("❌ يمكنك إرسال طلب سحب واحد فقط كل 24 ساعة.", "error");
            this.isLoading = false;
            return;
          }
        } catch (indexError) {
          const fallbackQuery = query(
            withdrawRequestsRef,
            where("userId", "==", user.uid)
          );
          const querySnapshot = await getDocs(fallbackQuery);
          
          let hasRecentRequest = false;
          querySnapshot.forEach((doc) => {
            if (!hasRecentRequest) {
              const data = doc.data();
              if (data.createdAt) {
                let createdAtDate;
                if (data.createdAt.toDate) {
                  createdAtDate = data.createdAt.toDate();
                } else if (data.createdAt instanceof Date) {
                  createdAtDate = data.createdAt;
                } else {
                  createdAtDate = new Date(data.createdAt);
                }
                if (createdAtDate >= twentyFourHoursAgo) {
                  hasRecentRequest = true;
                }
              }
            }
          });

          if (hasRecentRequest) {
            this.showMessage("❌ يمكنك إرسال طلب سحب واحد فقط كل 24 ساعة.", "error");
            this.isLoading = false;
            return;
          }
        }

        const userRef = doc(db, "users", user.uid);
        const withdrawDocRef = doc(collection(db, "withdraw_requests"));
        const transactionDocRef = doc(collection(db, "transactions"));

        await runTransaction(db, async (transaction) => {
          const userSnap = await transaction.get(userRef);

          if (!userSnap.exists()) {
            throw new Error("المستخدم غير موجود");
          }

          const userData = userSnap.data();
          const currentVipBalance = userData.vipBalance || 0;
          
          if (currentVipBalance < withdrawAmount) {
            throw new Error("رصيد VIP غير كافٍ");
          }

          if (userData.blocked) {
            throw new Error("حسابك محظور");
          }

          transaction.update(userRef, {
            vipBalance: currentVipBalance - withdrawAmount
          });

          transaction.set(withdrawDocRef, {
            transactionId: transactionId,
            userId: user.uid,
            userPhone: this.userPhone || null,
            userEmail: this.userEmail || null,
            amount: withdrawAmount,
            fee: feeAmount,
            netAmount: netAmountValue,
            feePercentage: this.feePercentage,
            totalDeduct: withdrawAmount,
            network: this.network,
            wallet: this.wallet,
            walletAddress: this.wallet,
            status: "pending",
            createdAt: serverTimestamp(),
            vipLevel: this.userVipLevel,
            withdrawDay: this.isVIP8OrAbove ? "أي يوم" : this.withdrawDay,
            adminAction: "",
            adminMessage: "",
            userMessage: "",
            reason: "",
            isVIP8OrAbove: this.isVIP8OrAbove,
            withdrawFrom: "vipBalance",
            taskCompleted: true,
            taskId: this.withdrawTask ? this.withdrawTask.id : null
          });

          transaction.set(transactionDocRef, {
            transactionId: transactionId,
            userId: user.uid,
            userPhone: this.userPhone || null,
            userEmail: this.userEmail || null,
            type: "withdraw",
            amount: withdrawAmount,
            fee: feeAmount,
            netAmount: netAmountValue,
            feePercentage: this.feePercentage,
            totalDeduct: withdrawAmount,
            currency: "USDT",
            network: this.network,
            wallet: this.wallet,
            walletAddress: this.wallet,
            status: "pending",
            vipLevel: this.userVipLevel,
            withdrawDay: this.isVIP8OrAbove ? "أي يوم" : this.withdrawDay,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isVIP8OrAbove: this.isVIP8OrAbove,
            withdrawFrom: "vipBalance",
            taskCompleted: true,
            taskId: this.withdrawTask ? this.withdrawTask.id : null
          });
        });

        this.vipBalance -= withdrawAmount;
        
        if (this.cacheKey) {
          const cachedData = getCachedData(this.cacheKey) || {};
          cachedData.vipBalance = this.vipBalance;
          setCachedData(this.cacheKey, cachedData);
        }
        
        this.showMessage(`✅ تم إرسال طلب السحب بنجاح. المبلغ الصافي: ${netAmountValue.toFixed(2)} USDT`, "success");
        
        // إعادة تعيين المهمة - بدء فترة الانتظار
        await this.resetWithdrawTask();
        
        this.amount = "";
        this.network = "";
        this.wallet = "";
        this.password = "";

      } catch (error) {
        console.error("خطأ:", error);
        this.showMessage(error.message || "حدث خطأ أثناء السحب", "error");
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
/* ============================================================ */
/* الأنماط الحالية */
/* ============================================================ */

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

.vip-status-box.error {
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.2);
  color: #dc2626;
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

.withdraw-condition {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #eaecef;
}

.withdraw-condition i {
  color: #dc2626;
  font-size: 14px;
}

.withdraw-condition i.condition-met {
  color: #10b981;
}

.vip-special-badge {
  background: linear-gradient(135deg, #fcd53520, #d4af3720);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  color: #fcd535;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  border: 1px solid rgba(212, 175, 55, 0.3);
}

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

.fields-separator {
  height: 1px;
  background: transparent;
  margin: 5px 0;
}

.isolated-section {
  position: relative;
}

.wallet-section,
.password-section {
  position: relative;
  z-index: 1;
}

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

/* ============================================================ */
/* أنماط بطاقة المهمة */
/* ============================================================ */

.task-card {
  background: rgba(212, 175, 55, 0.06);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.task-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.task-lock-icon {
  font-size: 28px;
  color: #fcd535;
  background: rgba(212, 175, 55, 0.15);
  padding: 12px;
  border-radius: 14px;
}

.task-title {
  font-size: 18px;
  font-weight: 800;
  color: #eaecef;
  margin: 0;
}

.task-subtitle {
  font-size: 13px;
  color: #848e9c;
  margin: 4px 0 0 0;
}

.task-body {
  padding: 0 4px;
}

.task-requirement {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: rgba(212, 175, 55, 0.05);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 18px;
  border: 1px solid rgba(212, 175, 55, 0.1);
}

.task-icon-wrapper {
  background: rgba(212, 175, 55, 0.12);
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.task-icon-wrapper i {
  font-size: 20px;
  color: #fcd535;
}

.task-description {
  flex: 1;
}

.task-desc-text {
  font-size: 14px;
  font-weight: 700;
  color: #eaecef;
  margin: 0 0 4px 0;
}

.task-desc-sub {
  font-size: 12px;
  color: #848e9c;
  margin: 0;
}

.task-progress {
  display: flex;
  gap: 24px;
  margin-bottom: 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
}

.task-progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-progress-label {
  font-size: 12px;
  color: #848e9c;
}

.task-progress-value {
  font-size: 16px;
  font-weight: 800;
  color: #eaecef;
}

.task-progress-value.completed {
  color: #10b981;
}

.task-progress-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.task-progress-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.task-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fcd535, #d4af37);
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
}

.task-progress-percent {
  font-size: 13px;
  font-weight: 700;
  color: #fcd535;
  min-width: 40px;
  text-align: left;
}

.task-confirm-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #fcd535 0%, #d4af37 100%);
  color: #0f1419;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.task-confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3);
}

.task-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-message {
  margin-top: 14px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-message.error {
  background: rgba(220, 38, 38, 0.12);
  color: #fca5a5;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.task-message.success {
  background: rgba(16, 185, 129, 0.12);
  color: #86efac;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.task-message.info {
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* ============================================================ */
/* أنماط بطاقة الانتظار */
/* ============================================================ */

.waiting-card {
  background: rgba(59, 130, 246, 0.05);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.waiting-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.waiting-icon {
  font-size: 28px;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
  padding: 12px;
  border-radius: 14px;
}

.waiting-title {
  font-size: 18px;
  font-weight: 800;
  color: #eaecef;
  margin: 0;
}

.waiting-subtitle {
  font-size: 13px;
  color: #848e9c;
  margin: 4px 0 0 0;
}

.waiting-body {
  padding: 4px 0;
}

.waiting-timer {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: #eaecef;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 14px;
}

.waiting-timer i {
  color: #60a5fa;
  font-size: 20px;
}

.waiting-timer strong {
  color: #fcd535;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  direction: ltr;
  display: inline-block;
  min-width: 80px;
}

.waiting-progress {
  display: flex;
  align-items: center;
  gap: 14px;
}

.waiting-progress-track {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.waiting-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  border-radius: 4px;
  transition: width 0.5s ease;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
}

.waiting-progress-text {
  font-size: 14px;
  font-weight: 700;
  color: #60a5fa;
  min-width: 45px;
  text-align: left;
}

/* ============================================================ */
/* استجابة للشاشات الصغيرة */
/* ============================================================ */

@media (max-width: 480px) {
  .card {
    padding: 18px;
  }
  
  .title {
    font-size: 22px;
  }
  
  .task-header {
    flex-direction: column;
    text-align: center;
  }
  
  .task-requirement {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .task-progress {
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }
  
  .task-progress-bar {
    flex-direction: column;
    gap: 6px;
  }
  
  .task-progress-percent {
    text-align: center;
  }
  
  .waiting-header {
    flex-direction: column;
    text-align: center;
  }
  
  .waiting-timer {
    flex-direction: column;
    text-align: center;
    gap: 6px;
  }
}
</style>
