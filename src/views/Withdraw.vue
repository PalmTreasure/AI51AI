<template>
  <div class="timer-page">

    <!-- =====================================================
         شاشة التحديث العامة
         ===================================================== -->
    <div class="timer-overlay">

      <div class="timer-box">

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

        <!-- =====================================================
             العداد التنازلي - HH:MM:SS
             ===================================================== -->
        <div class="countdown-display">
          {{ remainingTime }}
        </div>

        <span class="countdown-label">
          {{ remainingSeconds > 0 ? 'الوقت المتبقي' : 'انتهى الوقت' }}
        </span>

        <!-- =====================================================
             جدول التعويضات - نفس شكل الكود القديم
             ===================================================== -->
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

        <!-- =====================================================
             معلومات إضافية - نفس شكل الكود القديم
             ===================================================== -->
        <div class="timer-info">

          <div class="info-row">
            <i class="fas fa-shield-alt"></i>
            <span>تحديث آمن عبر Firebase</span>
          </div>

          <div class="info-row">
            <i class="fas fa-users"></i>
            <span>الوقت موحد لجميع المستخدمين</span>
          </div>

        </div>

        <!-- =====================================================
             زر إعادة تعيين (للمطورين فقط)
             ===================================================== -->
        <button 
          v-if="isDeveloper" 
          class="reset-button"
          @click="resetTimer"
        >
          <i class="fas fa-sync-alt"></i>
          إعادة تعيين العداد
        </button>

      </div>

    </div>

  </div>
</template>


<script>

import { 
  doc, 
  getDoc, 
  runTransaction, 
  serverTimestamp 
} from "firebase/firestore";

import { db } from "../firebase";


export default {

  name: "TimerPage",

  data() {

    return {

      // ======================================================
      // Timer - 56 hours (56 * 60 * 60 = 201600 seconds)
      // ======================================================

      remainingSeconds: 0,

      timerEndTime: null,

      countdownInterval: null,

      isDeveloper: false, // ضع true لتظهر زر إعادة التعيين

      // ======================================================
      // Rewards Table - نفس الكود القديم
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

      }

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

    }

  },


  // ==========================================================
  // Created
  // ==========================================================

  async created() {

    // تشغيل العداد العالمي من Firebase
    await this.initializeGlobalTimer();

  },


  // ==========================================================
  // Before unmount
  // ==========================================================

  beforeUnmount() {

    if (this.countdownInterval) {

      clearInterval(this.countdownInterval);

      this.countdownInterval = null;

    }

  },


  // ==========================================================
  // Methods
  // ==========================================================

  methods: {

    // ========================================================
    // Format number with commas - نفس الكود القديم
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


        // إنشاء المؤقت إذا لم يكن موجوداً
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

                  startTime: serverTimestamp(),

                  endTime: endTime,

                  duration: 56 * 60 * 60,

                  active: true,

                  createdAt: serverTimestamp(),

                  type: "global_withdraw_update"

                }
              );

            }

          }
        );


        // قراءة المؤقت من Firebase
        const timerSnap =
          await getDoc(
            timerRef
          );

        if (!timerSnap.exists()) {

          console.error("Timer document does not exist");

          return;

        }


        const timerData =
          timerSnap.data();

        let endTime = null;

        // استخراج وقت الانتهاء
        if (timerData.endTime) {

          if (timerData.endTime.toDate) {
            endTime = timerData.endTime.toDate();
          } else if (timerData.endTime instanceof Date) {
            endTime = timerData.endTime;
          } else {
            endTime = new Date(timerData.endTime);
          }

        } else if (timerData.startTime) {

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

        // تحديث العداد لأول مرة
        this.updateCountdown();

        // إيقاف أي interval سابق
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }

        // بدء التحديث كل ثانية
        this.countdownInterval =
          setInterval(
            () => {

              this.updateCountdown();

            },
            1000
          );


      } catch (error) {

        console.error("خطأ في المؤقت العالمي:", error);

      }

    },


    // ========================================================
    // تحديث العداد
    // ========================================================

    updateCountdown() {

      if (!this.timerEndTime) {
        return;
      }

      const now = Date.now();
      const end = this.timerEndTime.getTime();

      // حساب الوقت المتبقي بالثواني
      const remaining = Math.max(0, Math.floor((end - now) / 1000));

      this.remainingSeconds = remaining;

      // إذا وصلنا إلى الصفر، نوقف العداد
      if (remaining <= 0) {

        this.remainingSeconds = 0;

        if (this.countdownInterval) {

          clearInterval(this.countdownInterval);

          this.countdownInterval = null;

        }

      }

    },


    // ========================================================
    // إعادة تعيين العداد (للمطورين فقط)
    // ========================================================

    async resetTimer() {

      if (!this.isDeveloper) {
        return;
      }

      try {

        const timerRef = doc(db, "system", "withdrawTimer");

        // حساب وقت انتهاء جديد = الآن + 56 ساعة
        const now = new Date();
        const endTime = new Date(now.getTime() + 56 * 60 * 60 * 1000);

        await runTransaction(db, async (transaction) => {

          transaction.set(timerRef, {

            startTime: serverTimestamp(),

            endTime: endTime,

            duration: 56 * 60 * 60,

            active: true,

            createdAt: serverTimestamp(),

            type: "global_withdraw_update",
            
            resetAt: serverTimestamp()

          });

        });

        // تحديث العداد محلياً
        this.timerEndTime = endTime;
        this.updateCountdown();

        // إعادة تشغيل الـ interval
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }

        this.countdownInterval = setInterval(() => {
          this.updateCountdown();
        }, 1000);

        console.log("✅ تم إعادة تعيين العداد بنجاح");

      } catch (error) {

        console.error("خطأ في إعادة تعيين العداد:", error);

      }

    }

  }

};

</script>


<style scoped>

/* ============================================================
   صفحة العداد
   ============================================================ */

.timer-page {

  min-height: 100vh;

  background:
    linear-gradient(
      135deg,
      #0f1419 0%,
      #1a1f2e 100%
    );

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 20px;

  direction: rtl;

}


/* ============================================================
   شاشة التحديث
   ============================================================ */

.timer-overlay {

  width: 100%;

  display: flex;

  align-items: center;

  justify-content: center;

}


/* ============================================================
   صندوق التحديث - نفس الكود القديم
   ============================================================ */

.timer-box {

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
    timerBoxIn
    0.5s ease;

}


@keyframes timerBoxIn {

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
   Loader - نفس الكود القديم
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
   Completed - نفس الكود القديم
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
   Title - نفس الكود القديم
   ============================================================ */

.timer-box h3 {

  color:
    #fcd535;

  font-size:
    23px;

  font-weight:
    800;

  margin:
    0 0 10px;

}


.timer-box p {

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
   Countdown Display - HH:MM:SS
   ============================================================ */

.countdown-display {

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
   Rewards Table - نفس الكود القديم تماماً
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
   Timer Info - نفس الكود القديم
   ============================================================ */

.timer-info {

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


.info-row {

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


.info-row i {

  color:
    #fcd535;

}


/* ============================================================
   Reset Button (Developer Only)
   ============================================================ */

.reset-button {

  margin-top:
    20px;

  padding:
    10px 20px;

  background:
    rgba(
      220,
      38,
      38,
      0.2
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

  border-radius:
    10px;

  font-size:
    12px;

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

  transition:
    all
    0.3s ease;

}


.reset-button:hover {

  background:
    rgba(
      220,
      38,
      38,
      0.3
    );

}


/* ============================================================
   Mobile
   ============================================================ */

@media (max-width: 500px) {

  .timer-box {

    padding:
      30px 20px;

  }


  .countdown-display {

    font-size:
      31px;

    letter-spacing:
      2px;

  }

}

</style>
