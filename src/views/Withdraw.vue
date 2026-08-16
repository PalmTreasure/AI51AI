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
         الوقت المتبقي
      ========================================= */

      remainingSeconds: 0,

      /* وقت النهاية العالمي */
      timerEndTime: null,

      /* مدة المؤقت الأصلية */
      totalSeconds: 56 * 60 * 60,

      /* Interval */
      countdownInterval: null,

      /* حالة التحميل */
      timerLoading: true,

      /* خطأ Firebase */
      timerError: false,


      /* =========================================
         جدول التعويضات
      ========================================= */

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
  ========================================= */

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


  /* =========================================
     Created
  ========================================= */

  async created() {

    await this.initializeGlobalTimer();

  },


  /* =========================================
     Before Unmount
  ========================================= */

  beforeUnmount() {

    this.stopTimer();

  },


  /* =========================================
     Methods
  ========================================= */

  methods: {


    /* =========================================
       تنسيق الأرقام
    ========================================= */

    formatNumber(num) {

      return Number(num).toLocaleString("en-US");

    },


    /* =========================================
       إيقاف العداد
    ========================================= */

    stopTimer() {

      if (this.countdownInterval) {

        clearInterval(
          this.countdownInterval
        );

        this.countdownInterval = null;

      }

    },


    /* =========================================
       تشغيل العداد
    ========================================= */

    startInterval() {

      this.stopTimer();


      this.countdownInterval =
        setInterval(
          () => {

            this.updateCountdown();

          },
          1000
        );

    },


    /* =========================================
       إنشاء أو قراءة المؤقت العالمي
       
       مهم جداً:
       لا يتم إنشاء مؤقت جديد عند تحديث الصفحة.
       يتم الإنشاء فقط إذا كان المستند غير موجود.
    ========================================= */

    async initializeGlobalTimer() {

      this.timerLoading = true;

      this.timerError = false;


      try {

        const timerRef =
          doc(
            db,
            "system",
            "withdrawTimer"
          );


        /* =====================================
           أولاً: قراءة المستند الموجود
           
           إذا كان موجوداً:
           لا نغيره إطلاقاً.
        ===================================== */

        let timerSnap =
          await getDoc(
            timerRef
          );


        /* =====================================
           إذا لم يكن موجوداً فقط
           ننشئ مؤقت 56 ساعة
        ===================================== */

        if (!timerSnap.exists()) {

          console.log(
            "إنشاء المؤقت العالمي لأول مرة..."
          );


          await runTransaction(
            db,
            async (transaction) => {

              const snap =
                await transaction.get(
                  timerRef
                );


              /*
               * مهم:
               * نتحقق مرة ثانية داخل transaction
               * حتى لا يقوم مستخدمان بإنشاء مؤقتين.
               */

              if (!snap.exists()) {

                const duration =
                  56 * 60 * 60;


                /*
                 * هذا الوقت يتم حفظه مرة واحدة فقط.
                 */

                const endTime =
                  new Date(
                    Date.now() +
                    duration * 1000
                  );


                transaction.set(
                  timerRef,
                  {

                    startTime:
                      serverTimestamp(),

                    endTime:
                      endTime,

                    duration:
                      duration,

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


          /*
           * بعد الإنشاء نقرأ المستند مرة أخرى
           */

          timerSnap =
            await getDoc(
              timerRef
            );

        }


        /* =====================================
           إذا لم يوجد المستند بعد الإنشاء
        ===================================== */

        if (!timerSnap.exists()) {

          throw new Error(
            "لم يتم العثور على مؤقت Firebase"
          );

        }


        const timerData =
          timerSnap.data();


        console.log(
          "Global Timer:",
          timerData
        );


        /* =====================================
           استخراج وقت النهاية
        ===================================== */

        let endTime = null;


        if (timerData.endTime) {

          /*
           * Firebase Timestamp
           */

          if (
            typeof timerData.endTime.toDate ===
            "function"
          ) {

            endTime =
              timerData.endTime.toDate();

          }

          /*
           * Date
           */

          else if (
            timerData.endTime instanceof Date
          ) {

            endTime =
              timerData.endTime;

          }

          /*
           * String / number
           */

          else {

            endTime =
              new Date(
                timerData.endTime
              );

          }

        }


        /* =====================================
           إذا لم يوجد endTime
           نستخدم startTime القديم
        ===================================== */

        else if (timerData.startTime) {

          let startTime;


          if (
            typeof timerData.startTime.toDate ===
            "function"
          ) {

            startTime =
              timerData.startTime.toDate();

          }

          else {

            startTime =
              new Date(
                timerData.startTime
              );

          }


          const duration =
            Number(
              timerData.duration ||
              56 * 60 * 60
            );


          endTime =
            new Date(
              startTime.getTime() +
              duration * 1000
            );

        }


        /* =====================================
           التحقق
        ===================================== */

        if (
          !endTime ||
          isNaN(
            endTime.getTime()
          )
        ) {

          throw new Error(
            "وقت نهاية المؤقت غير صالح في Firebase"
          );

        }


        /* =====================================
           حفظ المؤقت العالمي
        ===================================== */

        this.timerEndTime =
          endTime;


        this.totalSeconds =
          Number(
            timerData.duration ||
            56 * 60 * 60
          );


        /* =====================================
           حساب الوقت فوراً
        ===================================== */

        this.updateCountdown();


        /* =====================================
           تشغيل العداد
        ===================================== */

        this.startInterval();


        this.timerLoading =
          false;


        console.log(
          "وقت النهاية العالمي:",
          this.timerEndTime
        );


      }

      catch (error) {

        console.error(
          "خطأ في المؤقت العالمي:",
          error
        );


        /*
         * مهم جداً:
         *
         * لا نعيد المؤقت إلى 56 ساعة.
         *
         * لأن هذا كان سبب المشكلة.
         */

        this.timerLoading =
          false;

        this.timerError =
          true;


        this.stopTimer();

      }

    },


    /* =========================================
       تحديث العداد
       
       دائماً نحسب:
       
       endTime - الآن
       
       وليس:
       
       remainingSeconds--
       
       لذلك عند تحديث الصفحة
       يعود للوقت الحقيقي.
    ========================================= */

    updateCountdown() {

      if (!this.timerEndTime) {

        return;

      }


      const now =
        Date.now();


      const end =
        this.timerEndTime.getTime();


      /*
       * ceil حتى لا يظهر مثلاً:
       *
       * 55:59:58
       *
       * بشكل أسرع من اللازم.
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


      /* =====================================
         انتهى الوقت
      ===================================== */

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
