<template>
  <div class="timer-page">

    <!-- خلفية زخرفية -->
    <div class="bg-glow glow-one"></div>
    <div class="bg-glow glow-two"></div>

    <div class="timer-overlay">

      <div class="timer-box">

        <!-- الشريط العلوي -->
        <div class="status-badge">
          <span class="status-dot"></span>
          نظام التحديث يعمل
        </div>

        <!-- أيقونة التحديث -->
        <div
          v-if="remainingSeconds > 0"
          class="update-icon"
        >
          <div class="icon-ring ring-one"></div>
          <div class="icon-ring ring-two"></div>

          <div class="icon-center">
            <i class="fas fa-sync-alt"></i>
          </div>
        </div>

        <!-- عند انتهاء الوقت -->
        <div
          v-else
          class="completed-icon"
        >
          <i class="fas fa-check"></i>
        </div>

        <!-- العنوان -->
        <h1>
          {{ remainingSeconds > 0 ? 'جاري تحديث نظام السحب' : 'اكتمل التحديث' }}
        </h1>

        <p class="description">
          {{
            remainingSeconds > 0
              ? 'نقوم حالياً بإجراء تحديثات وتحسينات على نظام السحب لضمان استقرار وأمان العمليات.'
              : 'انتهت عملية التحديث ويمكنك الآن استخدام نظام السحب.'
          }}
        </p>


        <!-- =========================================
             قسم العداد
        ========================================== -->

        <div class="countdown-card">

          <div class="countdown-header">
            <span>
              <i class="fas fa-clock"></i>
              الوقت المتبقي
            </span>

            <span class="live-badge">
              LIVE
            </span>
          </div>


          <div class="countdown">

            <!-- الساعات -->
            <div class="time-unit">

              <div class="time-number">
                {{ formattedHours }}
              </div>

              <div class="time-label">
                ساعة
              </div>

            </div>


            <div class="time-separator">
              :
            </div>


            <!-- الدقائق -->
            <div class="time-unit">

              <div class="time-number">
                {{ formattedMinutes }}
              </div>

              <div class="time-label">
                دقيقة
              </div>

            </div>


            <div class="time-separator">
              :
            </div>


            <!-- الثواني -->
            <div class="time-unit">

              <div
                class="time-number seconds-number"
              >
                {{ formattedSeconds }}
              </div>

              <div class="time-label">
                ثانية
              </div>

            </div>

          </div>


          <!-- شريط تقدم -->
          <div class="progress-section">

            <div class="progress-info">
              <span>التحديث قيد التنفيذ</span>

              <span>
                {{ progressPercentage }}%
              </span>
            </div>

            <div class="progress-track">

              <div
                class="progress-bar"
                :style="{ width: progressPercentage + '%' }"
              ></div>

            </div>

          </div>

        </div>


        <!-- =========================================
             رسالة مهمة
        ========================================== -->

        <div class="notice-card">

          <div class="notice-icon">
            <i class="fas fa-shield-alt"></i>
          </div>

          <div class="notice-content">

            <strong>
              تحديث آمن
            </strong>

            <span>
              يرجى عدم إغلاق الصفحة أثناء عملية التحديث.
            </span>

          </div>

        </div>


        <!-- =========================================
             جدول التعويضات
        ========================================== -->

        <div class="rewards-section">

          <div class="section-title">

            <div class="title-icon">
              <i class="fas fa-gift"></i>
            </div>

            <div>
              <strong>
                تعويضات تأخير السحب
              </strong>

              <span>
                التعويض حسب مبلغ الشحن
              </span>
            </div>

          </div>


          <div class="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>مبلغ الشحن</th>
                  <th>التعويض</th>
                </tr>

              </thead>

              <tbody>

                <tr
                  v-for="(reward, amount) in rechargeRewards"
                  :key="amount"
                >

                  <td>

                    <span class="amount">
                      {{ formatNumber(amount) }}
                    </span>

                    <small>
                      USDT
                    </small>

                  </td>

                  <td>

                    <span class="reward">
                      +{{ formatNumber(reward) }}
                    </span>

                    <small>
                      USDT
                    </small>

                  </td>

                </tr>

              </tbody>

            </table>

          </div>


          <div class="table-note">

            <i class="fas fa-info-circle"></i>

            <span>
              يتم تطبيق فترة تأخير أسبوع على السحب مع تعويض حسب مبلغ الشحن.
            </span>

          </div>

        </div>


        <!-- =========================================
             معلومات النظام
        ========================================== -->

        <div class="system-info">

          <div class="system-item">

            <div class="system-icon">
              <i class="fas fa-database"></i>
            </div>

            <span>
              Firebase
            </span>

            <small>
              متصل
            </small>

          </div>


          <div class="system-line"></div>


          <div class="system-item">

            <div class="system-icon">
              <i class="fas fa-users"></i>
            </div>

            <span>
              النظام العالمي
            </span>

            <small>
              موحد
            </small>

          </div>


          <div class="system-line"></div>


          <div class="system-item">

            <div class="system-icon">
              <i class="fas fa-lock"></i>
            </div>

            <span>
              الحماية
            </span>

            <small>
              آمنة
            </small>

          </div>

        </div>


        <!-- Footer -->
        <div class="footer-text">

          <i class="fas fa-cog"></i>

          يتم تحديث النظام تلقائياً

        </div>

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

      /* =========================================
         Timer
      ========================================== */

      remainingSeconds: 56 * 60 * 60,

      totalSeconds: 56 * 60 * 60,

      timerEndTime: null,

      countdownInterval: null,

      timerInitialized: false,


      /* =========================================
         Rewards
      ========================================== */

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


  /* =========================================
     Computed
  ========================================== */

  computed: {


    formattedHours() {

      const hours =
        Math.floor(
          this.remainingSeconds / 3600
        );

      return String(hours).padStart(2, "0");

    },


    formattedMinutes() {

      const minutes =
        Math.floor(
          (this.remainingSeconds % 3600) / 60
        );

      return String(minutes).padStart(2, "0");

    },


    formattedSeconds() {

      const seconds =
        this.remainingSeconds % 60;

      return String(seconds).padStart(2, "0");

    },


    remainingTime() {

      return (
        this.formattedHours +
        ":" +
        this.formattedMinutes +
        ":" +
        this.formattedSeconds
      );

    },


    progressPercentage() {

      if (!this.totalSeconds) {
        return 0;
      }

      const elapsed =
        this.totalSeconds -
        this.remainingSeconds;

      const percentage =
        (elapsed / this.totalSeconds) * 100;

      return Math.min(
        100,
        Math.max(
          0,
          Math.round(percentage)
        )
      );

    }

  },


  /* =========================================
     Created
  ========================================== */

  async created() {

    await this.initializeGlobalTimer();

  },


  /* =========================================
     Before Unmount
  ========================================== */

  beforeUnmount() {

    this.stopTimer();

  },


  /* =========================================
     Methods
  ========================================== */

  methods: {


    /* =========================================
       Format Number
    ========================================== */

    formatNumber(num) {

      return Number(num)
        .toLocaleString("en-US");

    },


    /* =========================================
       Stop Timer
    ========================================== */

    stopTimer() {

      if (this.countdownInterval) {

        clearInterval(
          this.countdownInterval
        );

        this.countdownInterval = null;

      }

    },


    /* =========================================
       Initialize Global Timer
    ========================================== */

    async initializeGlobalTimer() {

      try {

        const timerRef =
          doc(
            db,
            "system",
            "withdrawTimer"
          );


        /* =====================================
           إنشاء المؤقت إذا لم يكن موجوداً
        ===================================== */

        await runTransaction(
          db,
          async (transaction) => {

            const timerSnap =
              await transaction.get(
                timerRef
              );


            if (!timerSnap.exists()) {

              const now =
                new Date();


              const endTime =
                new Date(
                  now.getTime() +
                  56 *
                  60 *
                  60 *
                  1000
                );


              transaction.set(
                timerRef,
                {

                  startTime:
                    serverTimestamp(),

                  endTime:
                    endTime,

                  duration:
                    56 * 60 * 60,

                  active:
                    true,

                  createdAt:
                    serverTimestamp(),

                  type:
                    "global_withdraw_update"

                }
              );

            }

          }
        );


        /* =====================================
           قراءة المؤقت
        ===================================== */

        const timerSnap =
          await getDoc(
            timerRef
          );


        if (!timerSnap.exists()) {

          console.error(
            "Timer document does not exist"
          );

          this.startDefaultTimer();

          return;

        }


        const timerData =
          timerSnap.data();


        let endTime = null;


        /* =====================================
           استخراج endTime
        ===================================== */

        if (timerData.endTime) {

          if (
            typeof timerData.endTime.toDate ===
            "function"
          ) {

            endTime =
              timerData.endTime.toDate();

          }

          else if (
            timerData.endTime instanceof Date
          ) {

            endTime =
              timerData.endTime;

          }

          else {

            endTime =
              new Date(
                timerData.endTime
              );

          }

        }


        /* =====================================
           في حال عدم وجود endTime
        ===================================== */

        else if (timerData.startTime) {

          const startDate =
            typeof timerData.startTime.toDate ===
            "function"

              ? timerData.startTime.toDate()

              : new Date(
                  timerData.startTime
                );


          const duration =
            Number(
              timerData.duration ||
              56 * 60 * 60
            );


          endTime =
            new Date(
              startDate.getTime() +
              duration * 1000
            );

        }


        /* =====================================
           فحص الوقت
        ===================================== */

        if (
          !endTime ||
          isNaN(
            endTime.getTime()
          )
        ) {

          console.error(
            "endTime غير صالح"
          );

          this.startDefaultTimer();

          return;

        }


        /* =====================================
           حفظ بيانات المؤقت
        ===================================== */

        this.timerEndTime =
          endTime;


        this.totalSeconds =
          Number(
            timerData.duration ||
            56 * 60 * 60
          );


        this.timerInitialized =
          true;


        /* =====================================
           تحديث أولي
        ===================================== */

        this.updateCountdown();


        /* =====================================
           إيقاف أي Timer قديم
        ===================================== */

        this.stopTimer();


        /* =====================================
           تشغيل كل ثانية
        ===================================== */

        this.countdownInterval =
          setInterval(
            () => {

              this.updateCountdown();

            },
            1000
          );


      }

      catch (error) {

        console.error(
          "خطأ في المؤقت العالمي:",
          error
        );


        this.startDefaultTimer();

      }

    },


    /* =========================================
       Default Timer
    ========================================== */

    startDefaultTimer() {

      console.log(
        "بدء المؤقت الافتراضي - 56 ساعة"
      );


      this.stopTimer();


      this.totalSeconds =
        56 * 60 * 60;


      this.remainingSeconds =
        this.totalSeconds;


      this.countdownInterval =
        setInterval(
          () => {

            if (
              this.remainingSeconds > 0
            ) {

              this.remainingSeconds--;

            }

            else {

              this.stopTimer();

            }

          },
          1000
        );

    },


    /* =========================================
       Update Countdown
    ========================================== */

    updateCountdown() {

      if (!this.timerEndTime) {

        return;

      }


      const now =
        Date.now();


      const end =
        this.timerEndTime.getTime();


      const remaining =
        Math.max(
          0,
          Math.floor(
            (end - now) / 1000
          )
        );


      this.remainingSeconds =
        remaining;


      /* =====================================
         انتهى الوقت
      ===================================== */

      if (remaining <= 0) {

        this.remainingSeconds =
          0;


        this.stopTimer();

      }

    }

  }

};

</script>


<style scoped>

/* ============================================================
   GLOBAL PAGE
============================================================ */

.timer-page {

  min-height: 100vh;

  width: 100%;

  position: relative;

  overflow: hidden;

  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(252, 213, 53, 0.10),
      transparent 35%
    ),
    linear-gradient(
      145deg,
      #080b10 0%,
      #10151c 50%,
      #080b10 100%
    );

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 30px 15px;

  direction: rtl;

}


/* ============================================================
   BACKGROUND GLOW
============================================================ */

.bg-glow {

  position: fixed;

  width: 300px;

  height: 300px;

  border-radius: 50%;

  filter: blur(100px);

  pointer-events: none;

  opacity: 0.15;

}


.glow-one {

  background: #fcd535;

  top: -150px;

  right: -120px;

}


.glow-two {

  background: #2563eb;

  bottom: -180px;

  left: -150px;

}


/* ============================================================
   OVERLAY
============================================================ */

.timer-overlay {

  width: 100%;

  display: flex;

  justify-content: center;

  position: relative;

  z-index: 2;

}


/* ============================================================
   MAIN CARD
============================================================ */

.timer-box {

  width: min(
    100%,
    460px
  );

  position: relative;

  padding: 28px 22px 22px;

  border-radius: 30px;

  background:
    linear-gradient(
      145deg,
      rgba(31, 36, 44, 0.98),
      rgba(13, 16, 21, 0.98)
    );

  border:
    1px solid
    rgba(
      252,
      213,
      53,
      0.18
    );

  box-shadow:

    0 30px 100px
    rgba(0, 0, 0, 0.75),

    inset 0 1px 0
    rgba(255,255,255,0.04);

  animation:
    cardIn
    0.6s
    cubic-bezier(.2,.8,.2,1);

}


@keyframes cardIn {

  from {

    opacity: 0;

    transform:
      translateY(30px)
      scale(.96);

  }

  to {

    opacity: 1;

    transform:
      translateY(0)
      scale(1);

  }

}


/* ============================================================
   STATUS BADGE
============================================================ */

.status-badge {

  width: fit-content;

  margin:
    0 auto 25px;

  padding:
    7px 13px;

  border-radius: 50px;

  background:
    rgba(
      16,
      185,
      129,
      0.08
    );

  border:
    1px solid
    rgba(
      16,
      185,
      129,
      0.20
    );

  color:
    #9ca3af;

  font-size:
    11px;

  display:
    flex;

  align-items:
    center;

  gap:
    7px;

}


.status-dot {

  width:
    7px;

  height:
    7px;

  border-radius:
    50%;

  background:
    #10b981;

  box-shadow:
    0 0 10px
    rgba(
      16,
      185,
      129,
      0.8
    );

  animation:
    pulseDot
    1.5s
    infinite;

}


@keyframes pulseDot {

  0%,100% {
    opacity: .5;
    transform: scale(.8);
  }

  50% {
    opacity: 1;
    transform: scale(1.1);
  }

}


/* ============================================================
   UPDATE ICON
============================================================ */

.update-icon {

  width:
    92px;

  height:
    92px;

  position:
    relative;

  margin:
    0 auto 22px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

}


.icon-center {

  width:
    64px;

  height:
    64px;

  border-radius:
    50%;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  background:
    linear-gradient(
      145deg,
      #fcd535,
      #d9ad16
    );

  color:
    #11151b;

  font-size:
    25px;

  box-shadow:
    0 0 35px
    rgba(
      252,
      213,
      53,
      0.25
    );

  position:
    relative;

  z-index:
    3;

  animation:
    iconRotate
    3s
    linear infinite;

}


@keyframes iconRotate {

  to {
    transform:
      rotate(360deg);
  }

}


.icon-ring {

  position:
    absolute;

  border-radius:
    50%;

  border:
    1px solid
    rgba(
      252,
      213,
      53,
      0.25
    );

}


.ring-one {

  width:
    78px;

  height:
    78px;

  animation:
    ringPulse
    2s
    infinite;

}


.ring-two {

  width:
    92px;

  height:
    92px;

  border-style:
    dashed;

  animation:
    ringRotate
    8s
    linear infinite;

}


@keyframes ringPulse {

  0%,100% {
    transform: scale(.9);
    opacity: .4;
  }

  50% {
    transform: scale(1.05);
    opacity: 1;
  }

}


@keyframes ringRotate {

  to {
    transform:
      rotate(360deg);
  }

}


/* ============================================================
   COMPLETED ICON
============================================================ */

.completed-icon {

  width:
    92px;

  height:
    92px;

  margin:
    0 auto 22px;

  border-radius:
    50%;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  color:
    #10b981;

  font-size:
    35px;

  background:
    rgba(
      16,
      185,
      129,
      0.10
    );

  border:
    2px solid
    rgba(
      16,
      185,
      129,
      0.5
    );

  box-shadow:
    0 0 40px
    rgba(
      16,
      185,
      129,
      0.15
    );

}


/* ============================================================
   TITLE
============================================================ */

.timer-box h1 {

  margin:
    0 0 10px;

  text-align:
    center;

  color:
    #f5f5f5;

  font-size:
    22px;

  font-weight:
    800;

  letter-spacing:
    -.3px;

}


.description {

  margin:
    0 auto 24px;

  max-width:
    380px;

  text-align:
    center;

  color:
    #8b949e;

  font-size:
    12px;

  line-height:
    1.8;

}


/* ============================================================
   COUNTDOWN CARD
============================================================ */

.countdown-card {

  padding:
    16px;

  border-radius:
    20px;

  background:
    linear-gradient(
      145deg,
      rgba(
        252,
        213,
        53,
        0.075
      ),
      rgba(
        255,
        255,
        255,
        0.025
      )
    );

  border:
    1px solid
    rgba(
      252,
      213,
      53,
      0.16
    );

  box-shadow:
    inset 0 1px 0
    rgba(
      255,
      255,
      255,
      0.025
    );

}


/* ============================================================
   COUNTDOWN HEADER
============================================================ */

.countdown-header {

  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  color:
    #8b949e;

  font-size:
    11px;

  margin-bottom:
    14px;

}


.countdown-header i {

  color:
    #fcd535;

  margin-left:
    5px;

}


.live-badge {

  font-size:
    8px;

  font-weight:
    800;

  letter-spacing:
    1px;

  color:
    #10b981;

  padding:
    4px 7px;

  border-radius:
    5px;

  background:
    rgba(
      16,
      185,
      129,
      0.08
    );

}


/* ============================================================
   COUNTDOWN
============================================================ */

.countdown {

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  direction:
    ltr;

  gap:
    8px;

}


.time-unit {

  min-width:
    82px;

  text-align:
    center;

}


.time-number {

  height:
    65px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  border-radius:
    13px;

  background:
    #0c1015;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.07
    );

  color:
    #fcd535;

  font-family:
    "Courier New",
    monospace;

  font-size:
    31px;

  font-weight:
    900;

  letter-spacing:
    1px;

  text-shadow:
    0 0 15px
    rgba(
      252,
      213,
      53,
      0.25
    );

}


.seconds-number {

  animation:
    secondsGlow
    1s
    infinite;

}


@keyframes secondsGlow {

  0%,100% {
    opacity: 1;
  }

  50% {
    opacity: .72;
  }

}


.time-label {

  margin-top:
    6px;

  color:
    #66707c;

  font-size:
    9px;

}


.time-separator {

  color:
    #fcd535;

  font-family:
    monospace;

  font-size:
    25px;

  font-weight:
    900;

  margin-top:
    -15px;

}


/* ============================================================
   PROGRESS
============================================================ */

.progress-section {

  margin-top:
    17px;

}


.progress-info {

  display:
    flex;

  justify-content:
    space-between;

  color:
    #68727e;

  font-size:
    9px;

  margin-bottom:
    7px;

}


.progress-info span:last-child {

  color:
    #fcd535;

  font-weight:
    700;

}


.progress-track {

  height:
    5px;

  background:
    rgba(
      255,
      255,
      255,
      0.06
    );

  border-radius:
    20px;

  overflow:
    hidden;

}


.progress-bar {

  height:
    100%;

  border-radius:
    inherit;

  background:
    linear-gradient(
      90deg,
      #b98c00,
      #fcd535
    );

  box-shadow:
    0 0 12px
    rgba(
      252,
      213,
      53,
      0.35
    );

  transition:
    width
    .5s
    ease;

}


/* ============================================================
   NOTICE
============================================================ */

.notice-card {

  display:
    flex;

  align-items:
    center;

  gap:
    11px;

  margin-top:
    14px;

  padding:
    12px;

  border-radius:
    14px;

  background:
    rgba(
      59,
      130,
      246,
      0.055
    );

  border:
    1px solid
    rgba(
      59,
      130,
      246,
      0.12
    );

  text-align:
    right;

}


.notice-icon {

  min-width:
    35px;

  height:
    35px;

  border-radius:
    10px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  background:
    rgba(
      59,
      130,
      246,
      0.10
    );

  color:
    #60a5fa;

}


.notice-content {

  display:
    flex;

  flex-direction:
    column;

  gap:
    3px;

}


.notice-content strong {

  color:
    #dbe4ef;

  font-size:
    11px;

}


.notice-content span {

  color:
    #6f7a86;

  font-size:
    9px;

}


/* ============================================================
   REWARDS
============================================================ */

.rewards-section {

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


.section-title {

  display:
    flex;

  align-items:
    center;

  gap:
    10px;

  margin-bottom:
    12px;

  text-align:
    right;

}


.title-icon {

  width:
    36px;

  height:
    36px;

  border-radius:
    10px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  color:
    #fcd535;

  background:
    rgba(
      252,
      213,
      53,
      0.08
    );

}


.section-title strong {

  display:
    block;

  color:
    #e7e9ec;

  font-size:
    12px;

}


.section-title span {

  display:
    block;

  color:
    #656f7b;

  font-size:
    9px;

  margin-top:
    3px;

}


/* ============================================================
   TABLE
============================================================ */

.table-wrapper {

  max-height:
    190px;

  overflow-y:
    auto;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.06
    );

  border-radius:
    13px;

}


.table-wrapper::-webkit-scrollbar {

  width:
    4px;

}


.table-wrapper::-webkit-scrollbar-thumb {

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


table {

  width:
    100%;

  border-collapse:
    collapse;

  font-size:
    10px;

}


thead {

  position:
    sticky;

  top:
    0;

  z-index:
    2;

}


th {

  padding:
    9px;

  background:
    #181d24;

  color:
    #fcd535;

  font-weight:
    700;

}


td {

  padding:
    8px 9px;

  border-top:
    1px solid
    rgba(
      255,
      255,
      255,
      0.035
    );

  text-align:
    center;

}


td:first-child {

  color:
    #d2d7dd;

}


.amount {

  font-weight:
    700;

}


td small {

  color:
    #69737e;

  font-size:
    8px;

  margin-right:
    3px;

}


.reward {

  color:
    #10b981;

  font-weight:
    800;

}


tbody tr {

  transition:
    background
    .2s
    ease;

}


tbody tr:hover {

  background:
    rgba(
      252,
      213,
      53,
      0.035
    );

}


/* ============================================================
   TABLE NOTE
============================================================ */

.table-note {

  display:
    flex;

  align-items:
    flex-start;

  justify-content:
    center;

  gap:
    6px;

  margin-top:
    9px;

  color:
    #626c77;

  font-size:
    9px;

  line-height:
    1.6;

}


.table-note i {

  color:
    #fcd535;

  margin-top:
    2px;

}


/* ============================================================
   SYSTEM INFO
============================================================ */

.system-info {

  display:
    flex;

  align-items:
    center;

  justify-content:
    space-around;

  margin-top:
    20px;

  padding-top:
    17px;

  border-top:
    1px solid
    rgba(
      255,
      255,
      255,
      0.06
    );

}


.system-item {

  display:
    flex;

  flex-direction:
    column;

  align-items:
    center;

  gap:
    3px;

}


.system-icon {

  width:
    29px;

  height:
    29px;

  border-radius:
    8px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  background:
    rgba(
      255,
      255,
      255,
      0.035
    );

  color:
    #818b96;

  font-size:
    10px;

  margin-bottom:
    2px;

}


.system-item span {

  color:
    #777f89;

  font-size:
    8px;

}


.system-item small {

  color:
    #10b981;

  font-size:
    7px;

}


.system-line {

  width:
    1px;

  height:
    35px;

  background:
    rgba(
      255,
      255,
      255,
      0.06
    );

}


/* ============================================================
   FOOTER
============================================================ */

.footer-text {

  margin-top:
    17px;

  text-align:
    center;

  color:
    #4f5863;

  font-size:
    8px;

}


.footer-text i {

  margin-left:
    4px;

  animation:
    footerSpin
    3s
    linear
    infinite;

}


@keyframes footerSpin {

  to {
    transform:
      rotate(360deg);
  }

}


/* ============================================================
   MOBILE
============================================================ */

@media (max-width: 500px) {

  .timer-page {

    padding:
      15px 10px;

    align-items:
      flex-start;

    padding-top:
      20px;

  }


  .timer-box {

    padding:
      23px 15px 18px;

    border-radius:
      25px;

  }


  .status-badge {

    margin-bottom:
      20px;

  }


  .update-icon {

    width:
      78px;

    height:
      78px;

    margin-bottom:
      18px;

  }


  .icon-center {

    width:
      55px;

    height:
      55px;

    font-size:
      21px;

  }


  .ring-one {

    width:
      68px;

    height:
      68px;

  }


  .ring-two {

    width:
      78px;

    height:
      78px;

  }


  .timer-box h1 {

    font-size:
      19px;

  }


  .description {

    font-size:
      11px;

    margin-bottom:
      19px;

  }


  .countdown-card {

    padding:
      12px;

  }


  .countdown {

    gap:
      4px;

  }


  .time-unit {

    min-width:
      65px;

  }


  .time-number {

    height:
      56px;

    font-size:
      25px;

    border-radius:
      11px;

  }


  .time-separator {

    font-size:
      20px;

    margin-top:
      -13px;

  }


  .time-label {

    font-size:
      8px;

  }


  .notice-card {

    padding:
      10px;

  }


  .system-info {

    margin-top:
      17px;

  }

}


/* ============================================================
   VERY SMALL PHONES
============================================================ */

@media (max-width: 360px) {

  .time-unit {

    min-width:
      56px;

  }


  .time-number {

    height:
      51px;

    font-size:
      21px;

  }


  .time-separator {

    font-size:
      17px;

  }


  .timer-box h1 {

    font-size:
      17px;

  }

}

</style>
