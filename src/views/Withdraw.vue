<template>
  <div class="timer-page">

    <div class="timer-card">

      <!-- دائرة التحديث -->
      <div v-if="remainingSeconds > 0" class="loader-wrapper">
        <div class="loader"></div>
        <div class="loader-icon">
          <i class="fas fa-sync-alt"></i>
        </div>
      </div>

      <!-- عند انتهاء الوقت -->
      <div v-else class="completed-icon">
        <i class="fas fa-check"></i>
      </div>


      <!-- العنوان -->
      <h2>
        {{ remainingSeconds > 0 ? 'جاري التحديث' : 'اكتمل التحديث' }}
      </h2>


      <!-- الوصف -->
      <p class="description">
        {{
          remainingSeconds > 0
            ? 'يرجى الانتظار حتى انتهاء عملية التحديث'
            : 'انتهت عملية التحديث ويمكنك استخدام صفحة السحب'
        }}
      </p>


      <!-- =========================
           العداد
      ========================== -->

      <div class="countdown-box">

        <div class="countdown-time">
          {{ formattedHours }}
          <span>:</span>
          {{ formattedMinutes }}
          <span>:</span>
          {{ formattedSeconds }}
        </div>

      </div>


      <div class="countdown-label">
        {{ remainingSeconds > 0 ? 'الوقت المتبقي' : 'انتهى الوقت' }}
      </div>


      <!-- =========================
           التعويضات
      ========================== -->

      <div class="rewards-card">

        <h3>
          🎁 التعويضات عند تأخير السحب لمدة أسبوع
        </h3>


        <div class="table-container">

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
                  USDT {{ formatNumber(amount) }}
                </td>

                <td>
                  USDT {{ formatNumber(reward) }}
                </td>

              </tr>

            </tbody>

          </table>

        </div>


        <!-- ملاحظة -->
        <div class="table-note">

          <i class="fas fa-info-circle"></i>

          <span>
            يتم تطبيق تأخير أسبوع على السحب مع تعويض حسب مبلغ الشحن
          </span>

        </div>

      </div>


      <!-- =========================
           معلومات النظام
      ========================== -->

      <div class="system-info">

        <div class="info-item">

          <i class="fas fa-shield-alt"></i>

          <span>
            تحديث آمن عبر Firebase
          </span>

        </div>


        <div class="info-item">

          <i class="fas fa-users"></i>

          <span>
            الوقت موحد لجميع المستخدمين
          </span>

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

      /* =====================================
         العداد
      ===================================== */

      remainingSeconds: 56 * 60 * 60,

      timerEndTime: null,

      countdownInterval: null,

      /* مدة المؤقت الأصلية */
      totalSeconds: 56 * 60 * 60,


      /* =====================================
         جدول التعويضات
      ===================================== */

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


  /* =====================================
     Computed
  ===================================== */

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

    }

  },


  /* =====================================
     Created
  ===================================== */

  async created() {

    await this.initializeGlobalTimer();

  },


  /* =====================================
     Before Unmount
  ===================================== */

  beforeUnmount() {

    this.stopTimer();

  },


  /* =====================================
     Methods
  ===================================== */

  methods: {


    /* =====================================
       تنسيق الأرقام
    ===================================== */

    formatNumber(num) {

      return Number(num).toLocaleString("en-US");

    },


    /* =====================================
       إيقاف المؤقت
    ===================================== */

    stopTimer() {

      if (this.countdownInterval) {

        clearInterval(
          this.countdownInterval
        );

        this.countdownInterval = null;

      }

    },


    /* =====================================
       إنشاء / قراءة المؤقت العالمي
    ===================================== */

    async initializeGlobalTimer() {

      try {

        const timerRef =
          doc(
            db,
            "system",
            "withdrawTimer"
          );


        /* ---------------------------------
           إنشاء المؤقت إذا لم يكن موجوداً
        ---------------------------------- */

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
                  56 * 60 * 60 * 1000
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


        /* ---------------------------------
           قراءة المؤقت
        ---------------------------------- */

        const timerSnap =
          await getDoc(
            timerRef
          );


        if (!timerSnap.exists()) {

          this.startDefaultTimer();

          return;

        }


        const timerData =
          timerSnap.data();


        let endTime = null;


        /* ---------------------------------
           استخراج endTime
        ---------------------------------- */

        if (timerData.endTime) {

          if (
            typeof timerData.endTime.toDate ===
            "function"
          ) {

            endTime =
              timerData.endTime.toDate();

          } else {

            endTime =
              new Date(
                timerData.endTime
              );

          }

        }


        /* ---------------------------------
           إذا لم يوجد endTime
        ---------------------------------- */

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


        /* ---------------------------------
           التأكد من صحة الوقت
        ---------------------------------- */

        if (
          !endTime ||
          isNaN(
            endTime.getTime()
          )
        ) {

          this.startDefaultTimer();

          return;

        }


        /* ---------------------------------
           حفظ وقت النهاية
        ---------------------------------- */

        this.timerEndTime =
          endTime;


        this.totalSeconds =
          Number(
            timerData.duration ||
            56 * 60 * 60
          );


        /* ---------------------------------
           تحديث فوري
        ---------------------------------- */

        this.updateCountdown();


        /* ---------------------------------
           إيقاف أي عداد سابق
        ---------------------------------- */

        this.stopTimer();


        /* ---------------------------------
           تشغيل العداد كل ثانية
        ---------------------------------- */

        this.countdownInterval =
          setInterval(
            () => {

              this.updateCountdown();

            },
            1000
          );


      } catch (error) {

        console.error(
          "Timer Error:",
          error
        );

        this.startDefaultTimer();

      }

    },


    /* =====================================
       عداد احتياطي
    ===================================== */

    startDefaultTimer() {

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

            } else {

              this.stopTimer();

            }

          },
          1000
        );

    },


    /* =====================================
       تحديث الوقت الحقيقي
    ===================================== */

    updateCountdown() {

      if (!this.timerEndTime) {

        return;

      }


      const now =
        Date.now();


      const end =
        this.timerEndTime.getTime();


      /*
       * الحساب من وقت النهاية الحقيقي
       * وليس إنقاص رقم فقط.
       *
       * لذلك إذا خرج المستخدم ورجع
       * أو تأخر الجهاز، يعود للوقت الصحيح.
       */

      const remaining =
        Math.max(
          0,
          Math.ceil(
            (end - now) / 1000
          )
        );


      this.remainingSeconds =
        remaining;


      /* ---------------------------------
         انتهاء المؤقت
      ---------------------------------- */

      if (
        remaining <= 0
      ) {

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
   الصفحة الرئيسية
============================================================ */

.timer-page {

  min-height: 100vh;

  width: 100%;

  box-sizing: border-box;

  background:
    linear-gradient(
      180deg,
      #0d1117 0%,
      #171b23 45%,
      #10141b 100%
    );

  display: flex;

  justify-content: center;

  align-items: flex-start;

  padding: 25px 14px 40px;

  direction: rtl;

}


/* ============================================================
   البطاقة الرئيسية
============================================================ */

.timer-card {

  width: 100%;

  max-width: 430px;

  box-sizing: border-box;

  padding: 30px 18px 24px;

  border-radius: 30px;

  background:
    linear-gradient(
      145deg,
      #1b2029,
      #151920
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
    0 20px 70px
    rgba(
      0,
      0,
      0,
      0.55
    );

}


/* ============================================================
   Loader
============================================================ */

.loader-wrapper {

  width: 82px;

  height: 82px;

  position: relative;

  margin: 0 auto 28px;

  display: flex;

  justify-content: center;

  align-items: center;

}


.loader {

  position: absolute;

  width: 78px;

  height: 78px;

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
      0.35
    );

  animation:
    spin
    1.1s
    linear
    infinite;

}


.loader-icon {

  width: 52px;

  height: 52px;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;

  color: #fcd535;

  font-size: 22px;

  background:
    rgba(
      252,
      213,
      53,
      0.08
    );

}


.loader-icon i {

  animation:
    iconSpin
    2s
    linear
    infinite;

}


@keyframes spin {

  to {
    transform:
      rotate(360deg);
  }

}


@keyframes iconSpin {

  to {
    transform:
      rotate(-360deg);
  }

}


/* ============================================================
   Completed
============================================================ */

.completed-icon {

  width: 78px;

  height: 78px;

  margin: 0 auto 28px;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;

  color: #10b981;

  font-size: 30px;

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

}


/* ============================================================
   العنوان
============================================================ */

.timer-card h2 {

  margin: 0;

  text-align: center;

  color: #fcd535;

  font-size: 30px;

  font-weight: 800;

}


.description {

  margin:
    12px auto 28px;

  text-align: center;

  color: #9aa1ab;

  font-size: 15px;

  line-height: 1.7;

}


/* ============================================================
   صندوق العداد
============================================================ */

.countdown-box {

  width: 100%;

  box-sizing: border-box;

  padding: 22px 10px;

  border-radius: 22px;

  background:
    rgba(
      252,
      213,
      53,
      0.055
    );

  border:
    1px solid
    rgba(
      252,
      213,
      53,
      0.28
    );

  box-shadow:
    inset 0 0 25px
    rgba(
      252,
      213,
      53,
      0.025
    );

}


/* ============================================================
   الوقت
============================================================ */

.countdown-time {

  direction: ltr;

  text-align: center;

  white-space: nowrap;

  color: #fcd535;

  font-family:
    "Courier New",
    monospace;

  font-size: 42px;

  font-weight: 900;

  letter-spacing: 3px;

  text-shadow:
    0 0 15px
    rgba(
      252,
      213,
      53,
      0.18
    );

}


.countdown-time span {

  margin:
    0 3px;

  opacity: .75;

}


/* ============================================================
   label
============================================================ */

.countdown-label {

  text-align: center;

  color: #777f8a;

  font-size: 14px;

  margin:
    14px 0 30px;

}


/* ============================================================
   rewards
============================================================ */

.rewards-card {

  width: 100%;

  box-sizing: border-box;

  padding: 18px 8px 15px;

  border-radius: 22px;

  background:
    rgba(
      20,
      24,
      32,
      0.95
    );

  border:
    1px solid
    rgba(
      252,
      213,
      53,
      0.18
    );

}


.rewards-card h3 {

  margin:
    0 8px 18px;

  text-align: center;

  color: #fcd535;

  font-size: 18px;

  line-height: 1.7;

}


/* ============================================================
   table
============================================================ */

.table-container {

  width: 100%;

  max-height: 270px;

  overflow-y: auto;

  overflow-x: hidden;

  border-radius: 15px;

}


.table-container::-webkit-scrollbar {

  width: 4px;

}


.table-container::-webkit-scrollbar-thumb {

  background:
    rgba(
      252,
      213,
      53,
      0.35
    );

  border-radius: 10px;

}


table {

  width: 100%;

  border-collapse: collapse;

  table-layout: fixed;

}


/* ============================================================
   header
============================================================ */

th {

  position: sticky;

  top: 0;

  z-index: 2;

  padding: 13px 5px;

  background:
    rgba(
      252,
      213,
      53,
      0.10
    );

  color: #fcd535;

  font-size: 14px;

  font-weight: 800;

}


td {

  padding: 13px 4px;

  text-align: center;

  color: #e2e5e9;

  font-size: 14px;

  border-bottom:
    1px solid
    rgba(
      255,
      255,
      255,
      0.055
    );

}


tr:last-child td {

  border-bottom: none;

}


/* ============================================================
   note
============================================================ */

.table-note {

  display: flex;

  align-items: flex-start;

  justify-content: center;

  gap: 7px;

  margin:
    14px 7px 0;

  color: #777f8a;

  font-size: 11px;

  line-height: 1.7;

  text-align: center;

}


.table-note i {

  color: #fcd535;

  margin-top: 3px;

}


/* ============================================================
   system information
============================================================ */

.system-info {

  margin-top: 24px;

  padding-top: 18px;

  border-top:
    1px solid
    rgba(
      255,
      255,
      255,
      0.06
    );

}


.info-item {

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  color: #69727d;

  font-size: 11px;

  margin-bottom: 10px;

}


.info-item i {

  color: #fcd535;

}


/* ============================================================
   MOBILE
============================================================ */

@media (max-width: 480px) {

  .timer-page {

    padding:
      18px 10px 30px;

  }


  .timer-card {

    padding:
      27px 14px 22px;

    border-radius:
      26px;

  }


  .timer-card h2 {

    font-size:
      28px;

  }


  .description {

    font-size:
      14px;

    margin-bottom:
      24px;

  }


  .countdown-box {

    padding:
      20px 5px;

  }


  .countdown-time {

    font-size:
      35px;

    letter-spacing:
      2px;

  }


  .rewards-card h3 {

    font-size:
      17px;

  }


  th,
  td {

    font-size:
      13px;

  }

}


/* ============================================================
   شاشات صغيرة جداً
============================================================ */

@media (max-width: 360px) {

  .countdown-time {

    font-size:
      29px;

    letter-spacing:
      1px;

  }


  .timer-card h2 {

    font-size:
      25px;

  }


  .description {

    font-size:
      13px;

  }

}

</style>
