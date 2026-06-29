<template>
  <div class="home-container" :dir="currentLang === 'AR' ? 'rtl' : 'ltr'">

    <!-- ==================== CUSTOM MODAL SYSTEM ==================== -->
    <transition name="modal-fade-scale">
      <div v-if="modal.visible" class="custom-modal-overlay" @click.self="closeModal">
        <div class="custom-modal-container" :class="modal.size">
          <div class="custom-modal-header" :class="modal.type">
            <div class="header-icon">
              <i :class="modal.icon"></i>
            </div>
            <h3>{{ modal.title }}</h3>
            <button class="modal-close-btn" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="custom-modal-body">
            <p>{{ modal.message }}</p>
            <div v-if="modal.type === 'confirm'" class="confirm-options">
              <button class="modal-btn modal-btn-cancel" @click="closeModal">
                <i class="fas fa-times"></i> {{ modal.cancelText || 'إلغاء' }}
              </button>
              <button class="modal-btn modal-btn-confirm" @click="handleConfirm">
                <i class="fas fa-check"></i> {{ modal.confirmText || 'تأكيد' }}
              </button>
            </div>
          </div>
          
          <div class="custom-modal-footer" v-if="modal.type !== 'confirm'">
            <button class="modal-btn modal-btn-primary" @click="closeModal">
              {{ modal.buttonText || 'فهمت' }}
            </button>
          </div>
          <div class="modal-gold-line"></div>
        </div>
      </div>
    </transition>

    <!-- ==================== REVIEW MODAL (نافذة التقييم) ==================== -->
    <transition name="modal-fade-scale">
      <div v-if="showReviewModal" class="custom-modal-overlay" @click.self="closeReviewModal">
        <div class="custom-modal-container review-modal">
          <div class="custom-modal-header success">
            <div class="header-icon">
              <i class="fas fa-star"></i>
            </div>
            <h3>قيم المنصة</h3>
            <button class="modal-close-btn" @click="closeReviewModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="custom-modal-body">
            <!-- تقييم بالنجوم -->
            <div class="rating-stars">
              <span 
                v-for="star in 5" 
                :key="star"
                class="star"
                :class="{ active: star <= reviewData.rating }"
                @click="reviewData.rating = star"
              >
                ★
              </span>
            </div>
            
            <!-- حقل كتابة الرسالة -->
            <div class="review-message-input">
              <textarea 
                v-model="reviewData.message" 
                placeholder="اكتب تقييمك للمنصة..."
                rows="4"
                class="gold-input-field"
              ></textarea>
            </div>
            
            <!-- زر إرسال التقييم -->
            <button 
              class="submit-review-btn" 
              @click="submitReview" 
              :disabled="reviewData.rating === 0 || isSubmittingReview"
            >
              <i class="fas fa-paper-plane"></i> 
              {{ isSubmittingReview ? 'جاري الإرسال...' : 'إرسال التقييم' }}
            </button>
            
            <!-- عرض التقييمات -->
            <div class="previous-reviews">
              <h4>آخر التقييمات <i class="fas fa-comments"></i></h4>
              <div class="reviews-list">
                <div v-for="(review, index) in fakeReviews" :key="index" class="review-item">
                  <div class="review-avatar">
                    {{ review.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="review-content">
                    <div class="review-header">
                      <span class="review-name">{{ review.name }}</span>
                      <span class="review-country">{{ review.flag }}</span>
                      <span class="review-time">{{ review.time }}</span>
                    </div>
                    <div class="review-stars">
                      <span v-for="s in 5" :key="s" class="small-star" :class="{ active: s <= review.rating }">★</span>
                    </div>
                    <p class="review-text">{{ review.message }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-gold-line"></div>
        </div>
      </div>
    </transition>

    <!-- ==================== TOAST NOTIFICATION SYSTEM ==================== -->
    <transition-group 
      name="toast" 
      tag="div" 
      class="toast-container"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="toast-notification"
        :class="[toast.type, { 'toast-hiding': toast.isHiding }]"
        @mouseenter="pauseAutoHide(toast.id)"
        @mouseleave="resumeAutoHide(toast.id)"
      >
        <div class="toast-glow"></div>
        
        <div class="toast-content">
          <div class="toast-header">
            <span class="toast-icon" :class="toast.type">
              {{ toast.type === 'deposit' ? '💰' : '💸' }}
            </span>
            <span class="toast-flag">{{ toast.flag }}</span>
            <span class="toast-time">{{ toast.timestampEn }}</span>
          </div>
          
          <div class="toast-body">
            <div class="toast-email">{{ toast.email }}</div>
            <div class="toast-action">
              <span class="action-label">{{ toast.actionLabel }}</span>
              <span class="action-amount" :class="toast.type">
                {{ toast.type === 'deposit' ? '+' : '-' }}{{ formatNumber(toast.amount) }} USDT
              </span>
            </div>
          </div>
          
          <div class="toast-progress" :style="{ width: toast.progress + '%' }"></div>
        </div>
        
        <button class="toast-close" @click="removeToast(toast.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </transition-group>

    <!-- ==================== HIDDEN AUDIO ELEMENT ==================== -->
    <audio ref="notificationSound" preload="auto">
      <source src="https://assets.mixkit.co/sfx/preview/mixkit-software-interface-click-234.mp3" type="audio/mpeg">
    </audio>

    <!-- ==================== HEADER ==================== -->
    <header class="app-header">
      <div class="header-top">
        <button class="menu-btn" @click="toggleSidebar">
          <i class="fas fa-bars"></i>
        </button>

        <div class="balance-display">
          <button class="refresh-btn" @click="refreshBalance" :disabled="refreshing">
            <i :class="refreshing ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
          </button>
          <div class="balance-label">الرصيد الإجمالي</div>
          <div class="balance-value">
            <span class="amount">{{ formatNumber(totalBalance) }}</span>
            <span class="currency">USDT</span>
          </div>
        </div>

        <button class="notif-btn" @click="showNotifications">
          <i class="fas fa-bell"></i>
          <span class="notif-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
        </button>
      </div>

      <div class="welcome-section">
        <span class="welcome-text">مرحباً</span>
        <span class="user-name">{{ username }}</span>
      </div>
    </header>

    <!-- ==================== BALANCE CARDS SECTION ==================== -->
    <div class="balance-cards-section">
      <!-- بطاقة رصيد الأرباح القابل للسحب -->
      <div class="balance-card withdrawable-card">
        <div class="card-icon-wrapper withdrawable">
          <i class="fas fa-wallet"></i>
        </div>
        <div class="card-content">
          <div class="card-title">الأرباح القابل للسحب</div>
          <div class="card-amount"><span class="currency-symbol">USDT</span> 0.00</div>
        </div>
        <div class="card-arrow">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>

      <!-- بطاقة رصيد الترقية -->
      <div class="balance-card upgrade-card">
        <div class="card-icon-wrapper upgrade">
          <i class="fas fa-arrow-up"></i>
        </div>
        <div class="card-content">
          <div class="card-title">رصيد الترقية</div>
          <div class="card-amount"><span class="currency-symbol">USDT</span> 0.00</div>
        </div>
        <div class="card-arrow">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    </div>

    <!-- ==================== SEARCH SECTION ==================== -->
    <div class="search-section">
      <div class="search-box">
        <button class="filter-btn">
          <i class="fas fa-filter"></i>
        </button>
        <input 
          type="text" 
          placeholder="ابحث عن ميزة..."
          v-model="searchQuery"
        >
        <i class="fas fa-search search-icon"></i>
      </div>
    </div>

    <!-- ==================== QUICK ACTIONS CARDS ==================== -->
    <div class="quick-actions">
      <!-- زر تعبئة رصيد (أخضر) -->
      <div class="action-card deposit" @click="navigateTo('/recharge')">
        <div class="action-text">
          <div class="action-title">تعبئة رصيد</div>
          <div class="action-subtitle">أضف أموال</div>
        </div>
        <div class="action-icon green">
          <i class="fas fa-plus"></i>
        </div>
      </div>

      <!-- زر سحب (أزرق) -->
      <div class="action-card withdraw" @click="navigateTo('/withdraw')">
        <div class="action-text">
          <div class="action-title">سحب</div>
          <div class="action-subtitle">سحب الأرباح</div>
        </div>
        <div class="action-icon blue">
          <i class="fas fa-minus"></i>
        </div>
      </div>

      <!-- زر المعاملات (بنفسجي) -->
      <div class="action-card history" @click="navigateTo('/transactions')">
        <div class="action-text">
          <div class="action-title">المعاملات</div>
          <div class="action-subtitle">عرض السجل</div>
        </div>
        <div class="action-icon purple">
          <i class="fas fa-history"></i>
        </div>
      </div>

      <!-- زر الفريق (برتقالي) -->
      <div class="action-card team" @click="navigateTo('/team')">
        <div class="action-text">
          <div class="action-title">الفريق</div>
          <div class="action-subtitle">إحالاتي</div>
        </div>
        <div class="action-icon orange">
          <i class="fas fa-users"></i>
        </div>
        <span class="badge-notif">3</span>
      </div>
    </div>

    <!-- ==================== PROMO BANNER ==================== -->
    <div class="promo-banner" @click="openReviewModal">
      <span class="banner-text">قيم المنصة وانضم إلى آلاف المستخدمين الراضين</span>
      <span class="banner-emoji">⭐</span>
    </div>

    <!-- ==================== MAIN MENU ==================== -->
    <div class="main-menu">
      <div 
        v-for="item in menuItems" 
        :key="item.id"
        class="menu-item"
        :class="{ small: item.small }"
        @click="handleMenuClick(item)"
      >
        <div class="menu-icon" :class="item.iconClass">
          <i :class="item.icon"></i>
          <span class="badge" v-if="item.badge">{{ item.badge }}</span>
        </div>
        <span class="menu-title">{{ t(item.title) }}</span>
        <i class="fas fa-chevron-left menu-arrow"></i>
      </div>

      <div class="menu-item special small" @click="showCompanyModal">
        <div class="menu-icon gold">
          <i class="fas fa-building"></i>
        </div>
        <span class="menu-title">{{ t('aboutCompany') }}</span>
        <i class="fas fa-chevron-left menu-arrow"></i>
      </div>

      <div class="menu-item special small" @click="showTermsModal">
        <div class="menu-icon gold">
          <i class="fas fa-file-contract"></i>
        </div>
        <span class="menu-title">{{ t('termsConditions') }}</span>
        <i class="fas fa-chevron-left menu-arrow"></i>
      </div>
    </div>

    <!-- ==================== QUICK STATS SECTION ==================== -->
    <div class="stats-section">
      <h3 class="section-title">{{ t('quickStats') }}</h3>
      <div class="stats-grid">
        <div class="stat-card gold-border" @click="showTotalPaidInfo">
          <div class="stat-icon">$</div>
          <div class="stat-value">
            <span>+${{ formatLargeNumber(totalPaid) }}</span>
          </div>
          <div class="stat-label">{{ t('totalPaid') }}</div>
        </div>
        <div class="stat-card" @click="showActiveMembersInfo">
          <div class="stat-icon"><i class="fas fa-users"></i></div>
          <div class="stat-value">
            <span>+{{ formatLargeNumber(activeMembers) }}</span>
          </div>
          <div class="stat-label">{{ t('activeMembers') }}</div>
        </div>

        <div class="stat-card" @click="openReviewModal">
          <div class="stat-icon"><i class="fas fa-star"></i></div>
          <div class="stat-value">{{ averageRating }}</div>
          <div class="stat-label">{{ t('rating') }}</div>
        </div>

        <div class="stat-card" @click="showCountriesInfo">
          <div class="stat-icon"><i class="fas fa-globe"></i></div>
          <div class="stat-value">+150</div>
          <div class="stat-label">{{ t('countries') }}</div>
        </div>
      </div>
    </div>

    <!-- ==================== MODAL: COMPANY INFO ==================== -->
    <transition name="modal">
      <div v-if="showCompany" class="modal-overlay" @click.self="closeCompanyModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>🌴 Palm Treasure</h3>
            <button class="close-btn" @click="closeCompanyModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="company-text">
              <p>
                مرحباً بالجميع 🌟<br><br>
                يسرّنا أن نعرفكم بشركة Palm Treasure التي تأسست في إنجلترا بتاريخ 5 فبراير 2026، وهي شركة استثمارية متخصصة في مجال التجارة الإلكترونية. تمتلك الشركة فريقاً تقنياً محترفاً وخبرة مالية قوية، ويقع مقرها الرئيسي حالياً في منطقة الأعمال المركزية في إنجلترا.<br><br>
                وانطلاقاً من رؤيتنا للتوسع وبناء شبكة تعاون واسعة، قمنا بإنشاء فروع ووكالات في عدد من الدول العربية مثل لبنان، الجزائر، ليبيا، والعراق، ونسعى خلال المرحلة القادمة إلى توسيع نشاطنا وانتشارنا في مختلف دول الشرق الأوسط.<br><br>
                لقد جاء تأسيس هذه الشركة بعد دراسة عميقة لما حدث خلال عامي 2024 و2025، حيث ظهرت العديد من المنصات الوهمية التي خدعت الكثير من الناس ولم تستمر طويلاً. ومن هنا كان هدفنا واضحاً: تحويل هذا المجال إلى منصة حقيقية وموثوقة يستفيد منها الأعضاء كما تستفيد منها الشركة، ضمن نظام عادل وشفاف.<br><br>
                وقد تحقق هذا المشروع بجهود كبيرة من الفريق التقني تحت إشراف المهندس أليكس ديروب، الذي لعب دوراً أساسياً في تطوير النظام التقني للشركة. وتقديراً لجهوده المميزة ومساهمته في نجاح هذا المشروع، تمت ترقيته إلى منصب نائب المدير.<br><br>
                نحن في Palm Treasure نؤمن بأن النجاح الحقيقي يجب أن يكون متاحاً للجميع، لذلك تم تصميم هذا المشروع ليكون فرصة متاحة لكل الناس، وخاصة للطبقة المتوسطة وذوي الدخل المحدود، حتى يتمكنوا من تحسين أوضاعهم والمشاركة في فرص الاقتصاد الرقمي.<br><br>
                ولهذا السبب تم وضع نظام واضح وقوانين عادلة تضمن حماية حقوق الموظفين والأعضاء قبل حقوق المستثمرين، مع مراعاة الظروف الاقتصادية والاجتماعية في المجتمعات العربية.<br><br>
                وسيتم تطبيق هذا النظام المبرمج في معظم الدول العربية ابتداءً من 1 مارس 2026 وحتى نهاية عام 2028، وخلال هذه الفترة سيتم تقييم الأداء والنتائج. وبعد ذلك قد يتم تطوير النظام وإجراء بعض التعديلات بناءً على كفاءة الأعضاء وجهودهم وإخلاصهم في العمل.<br><br>
                كما نعمل منذ الآن على التخطيط لمجموعة من الفرص المستقبلية والمشاريع الجديدة التي ستوفر المزيد من الإمكانيات لأعضاء الشركة في السنوات القادمة.<br><br>
                نتمنى للجميع التوفيق، ونسعد بانضمامكم إلى مجتمع Palm Treasure 🌴
              </p>
            </div>

            <div class="vip-section">
              <h4>📊 {{ t('vipPlans') }}</h4>
              <div class="vip-list">
                <div v-for="vip in vipPlans.slice(0, 4)" :key="vip.level" class="vip-item">
                  <div class="vip-level">{{ vip.level }}</div>
                  <div class="vip-info">
                    <span>{{ vip.recharge }} USDT</span>
                    <span>{{ vip.daily }} USDT/{{ t('daily') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="commission-section">
              <h4>🤝 {{ t('commissionSystem') }}</h4>
              <div class="commission-list">
                <div class="comm-item">
                  <span>{{ t('level1') }}</span>
                  <strong>6%</strong>
                </div>
                <div class="comm-item">
                  <span>{{ t('level2') }}</span>
                  <strong>2%</strong>
                </div>
                <div class="comm-item">
                  <span>{{ t('level3') }}</span>
                  <strong>1%</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-ok" @click="closeCompanyModal">{{ t('understood') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== MODAL: TERMS & CONDITIONS ==================== -->
    <transition name="modal">
      <div v-if="showTerms" class="modal-overlay" @click.self="closeTermsModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>📜 {{ t('termsConditions') }}</h3>
            <button class="close-btn" @click="closeTermsModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="terms-text">
              <h4>📊 {{ t('businessContracts') }}</h4>
              <p>
                في عالم الأعمال الحديث، لا يُقاس النجاح فقط بما يحققه الشخص لنفسه، بل بقدرته على بناء فريق قوي وفعّال يقوده نحو التقدم والازدهار.<br><br>
                عند وصول عدد أعضاء فريقك إلى 70 عضواً نشطاً أو أكثر، تقوم الشركة بإبرام عقد رسمي معك.
              </p>

              <div class="salary-table">
                <div class="table-row">
                  <span>70 عضو</span>
                  <span>مساعد فريق</span>
                  <span class="highlight">$200/شهر</span>
                </div>
                <div class="table-row">
                  <span>140 عضو</span>
                  <span>مشرف فريق</span>
                  <span class="highlight">$350/شهر</span>
                </div>
                <div class="table-row">
                  <span>300 عضو</span>
                  <span>مدير فريق</span>
                  <span class="highlight">$500/شهر</span>
                </div>
              </div>

              <h4>💵 {{ t('vipWithdrawalSchedule') }}</h4>
              <div class="schedule-list">
                <div v-for="day in withdrawalDays" :key="day.id" class="schedule-item">
                  <span class="day">{{ day.day }}</span>
                  <span class="vips">{{ day.vips }}</span>
                </div>
              </div>

              <h4>👑 مميزات VIP 8 فأعلى</h4>
              <div class="vip-features">
                <div class="feature-item">
                  <i class="fas fa-check-circle"></i>
                  <span>يمكن السحب في أي وقت - لا يوجد يوم محدد</span>
                </div>
                <div class="feature-item">
                  <i class="fas fa-check-circle"></i>
                  <span>يمكن سحب أي مبلغ - لا يوجد حد أدنى</span>
                </div>
                <div class="feature-item">
                  <i class="fas fa-check-circle"></i>
                  <span>أولوية معالجة طلبات السحب</span>
                </div>
                <div class="feature-item">
                  <i class="fas fa-check-circle"></i>
                  <span>دعم فني على مدار الساعة</span>
                </div>
              </div>

              <div class="info-note">
                <i class="fas fa-info-circle"></i>
                <p>ملاحظة: يستطيع أعضاء VIP 8 فأعلى سحب أرباحهم في أي وقت وأي مبلغ يريدونه دون التقيد بيوم محدد أو حد أدنى للسحب.</p>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-ok" @click="acceptTerms">{{ t('iAccept') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== SIDEBAR ==================== -->
    <transition name="slide">
      <div v-if="sidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>
    </transition>
    <transition name="slide">
      <aside v-if="sidebarOpen" class="sidebar">
        <div class="sidebar-header">
          <span>🌴 Palm Treasure</span>
          <button @click="toggleSidebar"><i class="fas fa-times"></i></button>
        </div>
        <nav class="sidebar-nav">
          <a v-for="item in navItems" :key="item.path" @click="navigateTo(item.path); toggleSidebar()">
            <i :class="item.icon"></i>
            <span>{{ t(item.label) }}</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button @click="toggleLanguage">
            <i class="fas fa-globe"></i> {{ currentLang }}
          </button>
        </div>
      </aside>
    </transition>

  </div>
</template>

<script>
import { auth, db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: "HomePage",

  data() {
    return {
      username: "جار التحميل...",
      vipBalance: 0,
      depositBalance: 0,
      currentUserUid: null,
      unsubscribeUser: null,
      refreshing: false,
      
      showCompany: false,
      showTerms: false,
      sidebarOpen: false,
      searchQuery: "",
      unreadCount: 3,
      currentLang: localStorage.getItem("app_language") || "AR",

      // ==================== REVIEW SYSTEM ====================
      showReviewModal: false,
      isSubmittingReview: false,
      reviewData: {
        rating: 0,
        message: ""
      },
      fakeReviews: [],
      
      // قائمة الأسماء الوهمية للتقييمات اليومية
      reviewsList: [
        { name: "أحمد محمد", country: "🇸🇦", rating: 5, message: "منصة رائعة جداً، أرباح يومية ممتازة وسحب فوري" },
        { name: "سارة خالد", country: "🇪🇬", rating: 5, message: "تجربة ممتازة، دعم فني متجاوب وفريق محترم" },
        { name: "محمد علي", country: "🇦🇪", rating: 4, message: "منصة موثوقة وأرباحها حقيقية، أنصح بها الجميع" },
        { name: "نورة عبدالله", country: "🇰🇼", rating: 5, message: "أفضل منصة استثمارية جربتها، أرباح يومية ثابتة" },
        { name: "عمر سعيد", country: "🇶🇦", rating: 5, message: "سحبت أرباحي بكل سهولة، شكراً لفريق Palm Treasure" },
        { name: "فاطمة الزهراء", country: "🇲🇦", rating: 5, message: "منصة مذهلة وسهلة الاستخدام، أرباح رائعة" },
        { name: "يوسف حسن", country: "🇯🇴", rating: 4, message: "تجربة ممتازة وسحب سريع، أنصح بالاستثمار" },
        { name: "ليلى عماد", country: "🇱🇧", rating: 5, message: "أفضل قرار استثماري اتخذته، شكراً لكم" },
        { name: "عبدالله سعد", country: "🇧🇭", rating: 5, message: "منصة تستحق الثقة، أرباح يومية مضمونة" },
        { name: "منى حسين", country: "🇩🇿", rating: 4, message: "تجربة جميلة وسهلة، أنصح الجميع بالتسجيل" },
        { name: "خالد العتيبي", country: "🇸🇦", rating: 5, message: "أفضل منصة في الوطن العربي، شكراً لكم" },
        { name: "ريم حسام", country: "🇪🇬", rating: 5, message: "سحبت أرباحي خلال دقائق، منصة موثوقة 100%" },
        { name: "سيف الدين", country: "🇸🇾", rating: 4, message: "منصة ممتازة وأداء رائع، أنصح بها" },
        { name: "هدى ناصر", country: "🇮🇶", rating: 5, message: "تجربة فريدة من نوعها، أرباح حقيقية وليست وهمية" },
        { name: "وليد السعيد", country: "🇱🇾", rating: 5, message: "الحمد لله وجدت منصة موثوقة، ألف شكر لكم" },
        { name: "أمل السالم", country: "🇹🇳", rating: 4, message: "منصة تستحق التقدير، دعم فني رائع" },
        { name: "ناصر القحطاني", country: "🇸🇦", rating: 5, message: "أفضل قرار استثماري في حياتي" },
        { name: "مها السيد", country: "🇪🇬", rating: 5, message: "منصة مذهلة وسحب فوري، أنصح الجميع بالتسجيل" }
      ],
      
      // أوقات عشوائية
      timesList: ["الآن", "قبل دقيقة", "قبل 5 دقائق", "قبل ساعة", "قبل ساعتين", "قبل 3 ساعات", "قبل 5 ساعات", "قبل يوم", "قبل يومين", "قبل 3 أيام"],

      // ==================== CUSTOM MODAL SYSTEM ====================
      modal: {
        visible: false,
        type: 'info',
        title: '',
        message: '',
        icon: 'fas fa-info-circle',
        buttonText: '',
        confirmText: '',
        cancelText: '',
        size: 'small',
        callback: null
      },

      // ==================== STATIC STATS ====================
      totalPaid: 35000000,
      activeMembers: 250000,

      // ==================== TOAST NOTIFICATION SYSTEM ====================
      toasts: [],
      toastInterval: null,
      audioEnabled: false,
      pausedToasts: new Set(),
      
      realNames: [
        'ahmad', 'mohamed', 'ali', 'omar', 'youssef', 'khaled', 'hassan',
        'nour', 'sara', 'fatima', 'mariam', 'layla', 'rana', 'huda',
        'amr', 'tarek', 'saif', 'karim', 'samir', 'waleed', 'john', 'emma',
        'david', 'sophia', 'james', 'lisa', 'robert', 'maria'
      ],
      
      flags: [
        '🇸🇦', '🇪🇬', '🇩🇿', '🇲🇦', '🇮🇶', '🇸🇩', '🇯🇴', '🇱🇧', '🇵🇸', '🇦🇪', '🇶🇦', '🇰🇼',
        '🇧🇭', '🇴🇲', '🇾🇪', '🇱🇾', '🇹🇳', '🇲🇷', '🇸🇴', '🇩🇯', '🇰🇲', '🇺🇸', '🇬🇧', '🇫🇷'
      ],
      
      amounts: [
        50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000,
        1200, 1500, 1800, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
        6000, 7000, 8000, 9000, 10000, 12000, 15000, 18000, 20000,
        25000, 30000, 35000, 40000, 45000, 50000, 60000, 70000, 80000,
        90000, 100000, 120000, 150000
      ],

      withdrawalDays: [
        { id: 1, day: "السبت", vips: "VIP1 - VIP2 - VIP3" },
        { id: 2, day: "الأحد", vips: "VIP4 - VIP5" },
        { id: 3, day: "الاثنين", vips: "VIP6 - VIP7" }
      ],

      vipPlans: [
        { level: 'VIP 1', recharge: '0', daily: '0.15' },
        { level: 'VIP 2', recharge: '10', daily: '0.35' },
        { level: 'VIP 3', recharge: '50', daily: '1.60' },
        { level: 'VIP 4', recharge: '100', daily: '3.25' },
        { level: 'VIP 5', recharge: '300', daily: '10' },
        { level: 'VIP 6', recharge: '900', daily: '33' },
        { level: 'VIP 7', recharge: '1350', daily: '51' },
        { level: 'VIP 8', recharge: '1800', daily: '70' },
        { level: 'VIP 9', recharge: '3600', daily: '150' },
        { level: 'VIP 10', recharge: '7200', daily: '330' }
      ],

      menuItems: [
        { id: 5, title: 'agency', icon: 'fas fa-id-card', iconClass: 'icon-agency', route: '/agency', badge: null, small: true },
        { id: 6, title: 'program', icon: 'fas fa-download', iconClass: 'icon-program', route: '/program', small: true }
      ],

      navItems: [
        { path: '/home', icon: 'fas fa-home', label: 'home' },
        { path: '/vip', icon: 'fas fa-crown', label: 'vip' },
        { path: '/tasks', icon: 'fas fa-tasks', label: 'tasks' },
        { path: '/team', icon: 'fas fa-users', label: 'team' },
        { path: '/profile', icon: 'fas fa-user', label: 'profile' }
      ],
      
      translations: {
        AR: {
          totalBalance: 'الرصيد الإجمالي',
          welcome: 'مرحباً',
          searchPlaceholder: 'ابحث عن ميزة...',
          searchFeatureMessage: 'ميزة البحث قيد التطوير قريباً',
          deposit: 'تعبئة رصيد',
          addFunds: 'أضف أموال',
          withdraw: 'سحب',
          cashout: 'سحب الأرباح',
          team: 'الفريق',
          myReferrals: 'إحالاتي',
          transactions: 'المعاملات',
          viewHistory: 'عرض السجل',
          globalPartnerships: 'شراكة عالمية مع Amazon, eBay, TikTok, AliExpress, Alibaba, Shopee',
          aboutCompany: 'الشركة',
          termsConditions: 'الشروط والأحكام',
          vipPlans: 'خطط العضوية',
          daily: 'يومي',
          commissionSystem: 'نظام العمولات',
          level1: 'المستوى 1',
          level2: 'المستوى 2',
          level3: 'المستوى 3',
          understood: 'فهمت',
          businessContracts: 'عقود رجال الأعمال',
          vipWithdrawalSchedule: 'مواعيد سحب الرواتب',
          iAccept: 'أوافق',
          home: 'الرئيسية',
          vip: 'VIP',
          tasks: 'المهام',
          profile: 'حسابي',
          quickStats: 'إحصائيات سريعة',
          totalPaid: 'إجمالي المدفوعات',
          activeMembers: 'عضو نشط',
          rating: 'التقييم',
          countries: 'الدول',
          agency: 'وكالة',
          program: 'تحميل التطبيق',
          totalPaidInfo: 'إجمالي المدفوعات: $35,000,000',
          activeMembersInfo: 'عدد الأعضاء النشطين: 250,000 عضو',
          countriesInfo: 'عدد الدول: أكثر من 150 دولة حول العالم',
          termsAccepted: 'تمت الموافقة على الشروط والأحكام بنجاح ✓',
          balanceUpdated: 'تم تحديث الرصيد بنجاح ✓',
          refreshError: 'حدث خطأ في تحديث الرصيد، حاول مرة أخرى',
          languageChanged: 'تم تغيير اللغة بنجاح',
          reviewSubmitted: 'تم إرسال تقييمك بنجاح! شكراً لك على مشاركتنا رأيك',
          pleaseSelectRating: 'الرجاء اختيار تقييم بالنجوم أولاً',
          withdrawableBalance: 'الأرباح القابل للسحب',
          upgradeBalance: 'رصيد الترقية'
        },
        EN: {
          totalBalance: 'Total Balance',
          welcome: 'Welcome',
          searchPlaceholder: 'Search feature...',
          searchFeatureMessage: 'Search feature coming soon',
          deposit: 'Deposit',
          addFunds: 'Add Funds',
          withdraw: 'Withdraw',
          cashout: 'Cash Out',
          team: 'Team',
          myReferrals: 'My Referrals',
          transactions: 'Transactions',
          viewHistory: 'View History',
          globalPartnerships: 'Global Partnerships: Amazon, eBay, TikTok, AliExpress, Alibaba, Shopee',
          aboutCompany: 'Company',
          termsConditions: 'Terms & Conditions',
          vipPlans: 'Membership Plans',
          daily: 'Daily',
          commissionSystem: 'Commission System',
          level1: 'Level 1',
          level2: 'Level 2',
          level3: 'Level 3',
          understood: 'Understood',
          businessContracts: 'Business Contracts',
          vipWithdrawalSchedule: 'Withdrawal Schedule',
          iAccept: 'I Accept',
          home: 'Home',
          vip: 'VIP',
          tasks: 'Tasks',
          profile: 'Profile',
          quickStats: 'Quick Stats',
          totalPaid: 'Total Paid',
          activeMembers: 'Active Members',
          rating: 'Rating',
          countries: 'Countries',
          agency: 'Agency',
          program: 'Download App',
          totalPaidInfo: 'Total Paid: $35,000,000',
          activeMembersInfo: 'Active Members: 250,000 members',
          countriesInfo: 'Countries: More than 150 countries worldwide',
          termsAccepted: 'Terms and conditions accepted successfully ✓',
          balanceUpdated: 'Balance updated successfully ✓',
          refreshError: 'Error refreshing balance, please try again',
          languageChanged: 'Language changed successfully',
          reviewSubmitted: 'Your review has been submitted successfully! Thank you for sharing your feedback',
          pleaseSelectRating: 'Please select a star rating first',
          withdrawableBalance: 'Withdrawable Balance',
          upgradeBalance: 'Upgrade Balance'
        }
      }
    };
  },

  computed: {
    totalBalance() {
      return this.vipBalance + this.depositBalance;
    },
    
    averageRating() {
      if (this.fakeReviews.length === 0) return "0";
      const sum = this.fakeReviews.reduce((acc, r) => acc + r.rating, 0);
      return (sum / this.fakeReviews.length).toFixed(1);
    }
  },

  created() {
    this.initAuth();
    this.initToastSystem();
    this.loadDailyReviews();
  },

  mounted() {
    document.addEventListener('click', this.enableAudio, { once: true });
    document.addEventListener('touchstart', this.enableAudio, { once: true });
  },

  beforeUnmount() {
    if (this.unsubscribeUser) {
      this.unsubscribeUser();
    }
    if (this.toastInterval) {
      clearInterval(this.toastInterval);
    }
    document.removeEventListener('click', this.enableAudio);
    document.removeEventListener('touchstart', this.enableAudio);
  },

  methods: {
    // ==================== REVIEW SYSTEM METHODS ====================
    
    // جلب تقييمات عشوائية مختلفة كل يوم
    getDailyRandomReviews() {
      const today = new Date().toDateString();
      const savedDate = localStorage.getItem('reviews_date');
      let reviews = localStorage.getItem('daily_reviews');
      
      if (savedDate !== today || !reviews) {
        // خلط الأسماء بشكل عشوائي
        const shuffled = [...this.reviewsList];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // اختيار 8 تقييمات عشوائية وإضافة أوقات عشوائية
        reviews = shuffled.slice(0, 8).map((item) => ({
          name: item.name,
          flag: item.country,
          rating: item.rating,
          message: item.message,
          time: this.timesList[Math.floor(Math.random() * this.timesList.length)]
        }));
        
        localStorage.setItem('daily_reviews', JSON.stringify(reviews));
        localStorage.setItem('reviews_date', today);
        console.log("تم تحديث التقييمات اليومية");
      } else {
        reviews = JSON.parse(reviews);
      }
      
      return reviews;
    },
    
    loadDailyReviews() {
      // جلب التقييمات اليومية العشوائية
      this.fakeReviews = this.getDailyRandomReviews();
      
      // إضافة تقييمات المستخدمين السابقة إن وجدت
      const savedUserReviews = localStorage.getItem('user_reviews');
      if (savedUserReviews) {
        const userReviews = JSON.parse(savedUserReviews);
        // إضافة تقييمات المستخدمين في الأعلى
        this.fakeReviews = [...userReviews, ...this.fakeReviews];
      }
    },
    
    openReviewModal() {
      this.showReviewModal = true;
      this.reviewData = { rating: 0, message: "" };
      this.isSubmittingReview = false;
      document.body.style.overflow = 'hidden';
    },

    closeReviewModal() {
      this.showReviewModal = false;
      document.body.style.overflow = 'auto';
    },

    async submitReview() {
      if (this.reviewData.rating === 0) {
        this.showErrorMessage(this.t('pleaseSelectRating'));
        return;
      }
      
      this.isSubmittingReview = true;
      
      // الحصول على اسم المستخدم الحقيقي
      let userName = this.username || "مستخدم";
      
      // محاولة جلب اسم المستخدم من Firestore إذا كان متاحاً
      if (this.currentUserUid) {
        try {
          const userSnap = await getDoc(doc(db, "users", this.currentUserUid));
          if (userSnap.exists() && userSnap.data().username) {
            userName = userSnap.data().username;
          }
        } catch (e) {
          console.log("Could not fetch username:", e);
        }
      }
      
      // إضافة التقييم الجديد
      const newReview = {
        name: userName,
        flag: "⭐",
        rating: this.reviewData.rating,
        message: this.reviewData.message || "منصة رائعة! أنصح بها الجميع",
        time: "الآن"
      };
      
      // حفظ التقييمات في localStorage
      const savedUserReviews = localStorage.getItem('user_reviews');
      let userReviews = savedUserReviews ? JSON.parse(savedUserReviews) : [];
      userReviews.unshift(newReview);
      localStorage.setItem('user_reviews', JSON.stringify(userReviews));
      
      // تحديث قائمة التقييمات المعروضة
      this.fakeReviews = [...userReviews, ...this.getDailyRandomReviews()];
      
      this.isSubmittingReview = false;
      this.closeReviewModal();
      this.showSuccessMessage(this.t('reviewSubmitted'));
    },

    // ==================== STATS INFO METHODS ====================
    showTotalPaidInfo() {
      this.showModal({
        type: 'info',
        title: this.t('totalPaid'),
        message: this.t('totalPaidInfo'),
        buttonText: this.t('understood'),
        size: 'small'
      });
    },

    showActiveMembersInfo() {
      this.showModal({
        type: 'info',
        title: this.t('activeMembers'),
        message: this.t('activeMembersInfo'),
        buttonText: this.t('understood'),
        size: 'small'
      });
    },

    showCountriesInfo() {
      this.showModal({
        type: 'info',
        title: this.t('countries'),
        message: this.t('countriesInfo'),
        buttonText: this.t('understood'),
        size: 'small'
      });
    },

    // ==================== CUSTOM MODAL METHODS ====================
    showModal(options) {
      this.modal = {
        visible: true,
        type: options.type || 'info',
        title: options.title || '',
        message: options.message || '',
        icon: this.getIconByType(options.type),
        buttonText: options.buttonText || 'فهمت',
        confirmText: options.confirmText || 'تأكيد',
        cancelText: options.cancelText || 'إلغاء',
        size: options.size || 'small',
        callback: options.callback || null
      };
      document.body.style.overflow = 'hidden';
    },

    getIconByType(type) {
      switch(type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'confirm': return 'fas fa-question-circle';
        default: return 'fas fa-info-circle';
      }
    },

    closeModal() {
      this.modal.visible = false;
      document.body.style.overflow = 'auto';
      this.modal.callback = null;
    },

    handleConfirm() {
      if (this.modal.callback) {
        this.modal.callback();
      }
      this.closeModal();
    },

    showInfoMessage(message) {
      this.showModal({
        type: 'info',
        title: 'معلومات',
        message: message,
        buttonText: 'فهمت',
        size: 'small'
      });
    },

    showSuccessMessage(message) {
      this.showModal({
        type: 'success',
        title: 'تم بنجاح',
        message: message,
        buttonText: 'حسناً',
        size: 'small'
      });
    },

    showErrorMessage(message) {
      this.showModal({
        type: 'error',
        title: 'خطأ',
        message: message,
        buttonText: 'حسناً',
        size: 'small'
      });
    },

    t(key) {
      return this.translations[this.currentLang]?.[key] || this.translations['AR'][key] || key;
    },

    formatLargeNumber(num) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toFixed(0);
    },

    generateRandomEmail() {
      const name = this.realNames[Math.floor(Math.random() * this.realNames.length)];
      const starsCount = Math.floor(Math.random() * 5) + 3;
      const stars = '*'.repeat(starsCount);
      const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com'];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `${name}${stars}@${domain}`;
    },

    getRandomAmount() {
      return this.amounts[Math.floor(Math.random() * this.amounts.length)];
    },

    getRandomFlag() {
      return this.flags[Math.floor(Math.random() * this.flags.length)];
    },

    getRandomDuration() {
      return Math.floor(Math.random() * 1000) + 2000;
    },

    getCurrentTimeEnglish() {
      const now = new Date();
      return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    },

    generateRandomToast() {
      const types = ['deposit', 'withdraw'];
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = this.getRandomAmount();
      
      const toast = {
        id: Date.now() + Math.random(),
        type: type,
        email: this.generateRandomEmail(),
        amount: amount,
        flag: this.getRandomFlag(),
        timestampEn: this.getCurrentTimeEnglish(),
        actionLabel: type === 'deposit' ? this.t('deposit') : this.t('withdraw'),
        progress: 100,
        duration: this.getRandomDuration(),
        isHiding: false,
        hideTimer: null,
        progressTimer: null,
        startTime: null
      };
      
      this.showToast(toast);
    },

    showToast(toast) {
      this.playNotificationSound();
      
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      this.toasts.unshift(toast);
      this.startAutoHide(toast);
      
      if (this.toasts.length > 5) {
        const oldestToast = this.toasts[this.toasts.length - 1];
        if (oldestToast.hideTimer) {
          clearTimeout(oldestToast.hideTimer);
        }
        if (oldestToast.progressTimer) {
          clearInterval(oldestToast.progressTimer);
        }
        this.toasts.pop();
      }
    },

    startAutoHide(toast) {
      const interval = 50;
      const steps = toast.duration / interval;
      let currentStep = 0;
      toast.startTime = Date.now();
      
      toast.progressTimer = setInterval(() => {
        if (this.pausedToasts.has(toast.id)) return;
        
        currentStep++;
        toast.progress = 100 - (currentStep / steps * 100);
        
        if (currentStep >= steps) {
          clearInterval(toast.progressTimer);
          this.startFadeOut(toast);
        }
      }, interval);
    },

    startFadeOut(toast) {
      if (toast.isHiding) return;
      
      toast.isHiding = true;
      
      const fadeOutDuration = Math.floor(Math.random() * 300) + 500;
      
      toast.hideTimer = setTimeout(() => {
        this.removeToast(toast.id);
      }, fadeOutDuration);
    },

    removeToast(id) {
      const toast = this.toasts.find(t => t.id === id);
      if (toast) {
        if (toast.progressTimer) clearInterval(toast.progressTimer);
        if (toast.hideTimer) clearTimeout(toast.hideTimer);
      }
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.pausedToasts.delete(id);
    },

    pauseAutoHide(id) {
      this.pausedToasts.add(id);
      const toast = this.toasts.find(t => t.id === id);
      if (toast && toast.progressTimer) {
        clearInterval(toast.progressTimer);
      }
    },

    resumeAutoHide(id) {
      this.pausedToasts.delete(id);
      const toast = this.toasts.find(t => t.id === id);
      if (toast && !toast.isHiding && toast.progress > 0 && toast.startTime) {
        const elapsed = Date.now() - toast.startTime;
        const remaining = toast.duration - elapsed;
        
        if (remaining > 0) {
          const interval = 50;
          const steps = remaining / interval;
          let currentStep = 0;
          
          toast.progressTimer = setInterval(() => {
            if (this.pausedToasts.has(toast.id)) return;
            
            currentStep++;
            const newProgress = 100 - ((elapsed + (currentStep * interval)) / toast.duration * 100);
            toast.progress = Math.max(0, newProgress);
            
            if (currentStep >= steps) {
              clearInterval(toast.progressTimer);
              this.startFadeOut(toast);
            }
          }, interval);
        } else {
          this.startFadeOut(toast);
        }
      } else if (toast && toast.isHiding) {
        this.startFadeOut(toast);
      }
    },

    async playNotificationSound() {
      if (!this.audioEnabled) return;
      
      try {
        const audio = this.$refs.notificationSound;
        if (audio) {
          audio.currentTime = 0;
          await audio.play().catch(e => console.log('Audio play prevented:', e));
        }
      } catch (error) {
        console.log('Sound playback error:', error);
      }
    },

    enableAudio() {
      this.audioEnabled = true;
      const audio = this.$refs.notificationSound;
      if (audio) {
        audio.volume = 0.3;
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      }
    },

    formatNumber(num) {
      return num.toFixed(2);
    },

    initToastSystem() {
      this.toastInterval = setInterval(() => {
        if (this.toasts.length < 5) {
          this.generateRandomToast();
        }
      }, Math.random() * 3000 + 2000);
    },

    async initAuth() {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.username = "Guest";
          this.vipBalance = 0;
          this.depositBalance = 0;
          this.$router.push("/login");
          return;
        }

        this.currentUserUid = user.uid;
        this.setupRealtimeListener(user.uid);
      });
    },

    setupRealtimeListener(uid) {
      if (this.unsubscribeUser) {
        this.unsubscribeUser();
      }

      const userRef = doc(db, "users", uid);
      
      this.unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // استخدام اسم المستخدم بدلاً من رقم الهاتف
          this.username = data.username || data.email || "User";
          this.vipBalance = typeof data.vipBalance === 'number' ? data.vipBalance : 0;
          this.depositBalance = typeof data.depositBalance === 'number' ? data.depositBalance : 0;
        }
      }, (error) => {
        console.error("Listener error:", error);
      });
    },

    async refreshBalance() {
      if (this.refreshing || !this.currentUserUid) return;
      
      this.refreshing = true;
      try {
        const userRef = doc(db, "users", this.currentUserUid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          this.vipBalance = typeof data.vipBalance === 'number' ? data.vipBalance : 0;
          this.depositBalance = typeof data.depositBalance === 'number' ? data.depositBalance : 0;
          this.showSuccessMessage(this.t('balanceUpdated'));
        }
      } catch (error) {
        console.error("Refresh error:", error);
        this.showErrorMessage(this.t('refreshError'));
      } finally {
        setTimeout(() => { this.refreshing = false; }, 500);
      }
    },

    navigateTo(route) {
      if (this.$route.path !== route) {
        this.$router.push(route);
      }
    },

    handleMenuClick(item) {
      if (item.route) {
        this.navigateTo(item.route);
      }
    },
    
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
      document.body.style.overflow = this.sidebarOpen ? 'hidden' : 'auto';
    },

    toggleLanguage() {
      this.currentLang = this.currentLang === 'AR' ? 'EN' : 'AR';
      localStorage.setItem('app_language', this.currentLang);
      document.documentElement.dir = this.currentLang === 'AR' ? 'rtl' : 'ltr';
      document.documentElement.lang = this.currentLang.toLowerCase();
      this.showSuccessMessage(this.t('languageChanged'));
    },
    
    showNotifications() {
      this.$router.push('/notifications');
    },
    
    showCompanyModal() {
      this.showCompany = true;
      document.body.style.overflow = 'hidden';
    },

    closeCompanyModal() {
      this.showCompany = false;
      document.body.style.overflow = 'auto';
    },

    showTermsModal() {
      this.showTerms = true;
      document.body.style.overflow = 'hidden';
    },

    closeTermsModal() {
      this.showTerms = false;
      document.body.style.overflow = 'auto';
    },

    acceptTerms() {
      this.closeTermsModal();
      this.showSuccessMessage(this.t('termsAccepted'));
    }
  }
};
</script>

<style scoped>
/* ==================== BASE STYLES ==================== */
.home-container {
  min-height: 100vh;
  background: #0d1017; /* لون خلفية داكن جداً مطابق للصورة */
  color: #ffffff;
  font-family: 'Cairo', sans-serif;
  padding-bottom: 80px;
  position: relative;
  overflow-x: hidden;
}

/* ==================== HEADER ==================== */
.app-header {
  background: transparent;
  padding: 16px 20px 8px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.menu-btn, .notif-btn {
  background: none;
  border: none;
  color: #F6E27A;
  font-size: 22px;
  cursor: pointer;
  position: relative;
  padding: 4px;
}

.notif-btn {
  color: #F6E27A;
}

.notif-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff3b30;
  color: white;
  font-size: 10px;
  font-weight: bold;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #0d1017;
}

.balance-display {
  background: rgba(20, 25, 36, 0.7);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 100px;
  padding: 6px 16px 6px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  margin: 0 14px;
  height: 44px;
}

.refresh-btn {
  background: none;
  border: none;
  color: #F6E27A;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}

.balance-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.balance-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-right: auto;
}

.home-container[dir="rtl"] .balance-value {
  margin-right: 0;
  margin-left: auto;
}

.amount {
  font-size: 18px;
  font-weight: 700;
  color: #F6E27A;
}

.currency {
  font-size: 12px;
  color: #F6E27A;
  font-weight: 600;
}

.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.home-container[dir="rtl"] .welcome-section {
  align-items: flex-end;
}
.home-container[dir="ltr"] .welcome-section {
  align-items: flex-start;
}

.welcome-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  direction: ltr; /* للحفاظ على الإيميل من اليسار لليمين */
}

/* ==================== BALANCE CARDS SECTION ==================== */
.balance-cards-section {
  display: grid;
  grid-template-columns: 1fr 1fr; /* عمودين متساويين */
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 16px;
}

.balance-card {
  background: rgba(18, 22, 32, 0.8);
  border-radius: 16px;
  padding: 14px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  height: 72px;
}

/* الحدود الملونة حسب نوع البطاقة (خضراء وزرقاء داكنة) */
.balance-card.withdrawable-card {
  border: 1px solid rgba(76, 175, 80, 0.25);
}

.balance-card.upgrade-card {
  border: 1px solid rgba(33, 150, 243, 0.25);
}

/* الأيقونة الدائرية */
.card-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.card-icon-wrapper.withdrawable {
  background: rgba(76, 175, 80, 0.15);
  color: #4CAF50;
}

.card-icon-wrapper.upgrade {
  background: rgba(33, 150, 243, 0.15);
  color: #2196F3;
}

/* محتوى النص */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2px;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
}

.card-amount {
  font-size: 15px;
  font-weight: 700;
  color: #F6E27A; /* لون ذهبي */
  display: flex;
  align-items: center;
  gap: 4px;
}

.currency-symbol {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

/* السهم */
.card-arrow {
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  padding: 0 4px;
}

/* ==================== SEARCH SECTION ==================== */
.search-section {
  padding: 0 16px 16px;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(18, 22, 32, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 4px 4px 4px 16px;
  gap: 10px;
  height: 48px;
}

.filter-btn {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  height: 100%;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.search-icon {
  color: rgba(255, 255, 255, 0.4);
  font-size: 16px;
  padding: 0 12px 0 8px;
}

/* ==================== QUICK ACTIONS CARDS ==================== */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 20px;
}

.action-card {
  background: rgba(18, 22, 32, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  height: 72px;
}

.action-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-title {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.action-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* ألوان الأزرار حسب الصورة */
.action-icon.green { background: #4CAF50; } /* تعبئة */
.action-icon.blue { background: #2196F3; } /* سحب */
.action-icon.purple { background: #9C27B0; } /* معاملات */
.action-icon.orange { background: #FF9800; } /* فريق */

/* إشعار الفريق */
.badge-notif {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff3b30;
  color: white;
  font-size: 10px;
  font-weight: bold;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #0d1017;
}
.home-container[dir="rtl"] .badge-notif {
  right: auto;
  left: -6px;
}

/* ==================== PROMO BANNER ==================== */
.promo-banner {
  margin: 0 16px 20px;
  background: #F6E27A;
  border-radius: 14px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 15px rgba(246, 226, 122, 0.15);
  cursor: pointer;
  transition: all 0.3s;
}

.banner-text {
  font-size: 13px;
  font-weight: 700;
  color: #0f1419;
  flex: 1;
  text-align: center;
}

.banner-emoji {
  font-size: 22px;
}

/* ==================== MAIN MENU ==================== */
.main-menu {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0 16px;
}

.menu-item {
  background: rgba(18, 22, 32, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.menu-item.special {
  border: 1px solid rgba(212, 175, 55, 0.4);
}

.menu-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #F6E27A;
  position: relative;
}

.menu-icon.gold {
  background: rgba(212, 175, 55, 0.15);
}

.menu-title {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
}

.menu-arrow {
  color: rgba(255, 255, 255, 0.2);
  font-size: 10px;
}

/* ==================== REST OF STYLES (Modals, Stats, etc.) ==================== */
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.custom-modal-container {
  background: #141924;
  border-radius: 28px;
  width: 100%;
  max-width: 450px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: modalFloatIn 0.35s cubic-bezier(0.21, 1.11, 0.35, 1);
}

@keyframes modalFloatIn {
  0% { opacity: 0; transform: scale(0.92) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-fade-scale-enter-active, .modal-fade-scale-leave-active { transition: all 0.3s ease; }
.modal-fade-scale-enter-from, .modal-fade-scale-leave-to { opacity: 0; transform: scale(0.92); }

.custom-modal-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.custom-modal-header .header-icon {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.custom-modal-header.info .header-icon { background: rgba(33, 150, 243, 0.15); color: #2196F3; }
.custom-modal-header.success .header-icon { background: rgba(76, 175, 80, 0.15); color: #4CAF50; }
.custom-modal-header.error .header-icon { background: rgba(244, 67, 54, 0.15); color: #F44336; }
.custom-modal-header.confirm .header-icon { background: rgba(212, 175, 55, 0.15); color: #D4AF37; }

.custom-modal-header h3 {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #F6E27A;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.custom-modal-body { padding: 24px; }
.custom-modal-body p { margin: 0; line-height: 1.6; color: rgba(255, 255, 255, 0.85); font-size: 15px; text-align: center; }

.confirm-options { display: flex; gap: 15px; margin-top: 28px; justify-content: center; }
.custom-modal-footer { padding: 16px 24px 24px; }

.modal-btn {
  padding: 12px 28px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  width: 100%;
}

.modal-btn-primary {
  background: #F6E27A;
  color: #0f1419;
}
.modal-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(212, 175, 55, 0.35); }
.modal-btn-confirm { background: #F6E27A; color: #0f1419; flex: 1; }
.modal-btn-cancel { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.8); flex: 1; }

.modal-gold-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #F6E27A, transparent);
}

/* ==================== TOAST NOTIFICATION SYSTEM ==================== */
.toast-container {
  position: fixed;
  top: 50%;
  right: 20px;
  left: auto;
  transform: translateY(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  max-width: 300px;
  pointer-events: none;
}
.home-container[dir="rtl"] .toast-container { right: auto; left: 20px; align-items: flex-start; }

.toast-enter-active { animation: toastFadeIn 0.4s forwards; }
@keyframes toastFadeIn {
  0% { opacity: 0; transform: translateX(60px) scale(0.85); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}
.toast-leave-active { animation: toastFadeOut 0.65s forwards; }
@keyframes toastFadeOut {
  0% { opacity: 1; transform: translateX(0) scale(1); }
  100% { opacity: 0; transform: translateX(50px) scale(0.9); }
}

.toast-notification {
  background: #141924;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  width: 100%;
  max-width: 280px;
  pointer-events: auto;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}
.toast-notification.deposit { border-right: 3px solid #4CAF50; }
.home-container[dir="rtl"] .toast-notification.deposit { border-left: 3px solid #4CAF50; border-right: none; }
.toast-notification.withdraw { border-right: 3px solid #F44336; }

.toast-content { display: flex; flex-direction: column; gap: 6px; }
.toast-header { display: flex; align-items: center; gap: 8px; }
.toast-icon { font-size: 14px; }
.toast-flag { font-size: 14px; }
.toast-time { margin-right: auto; font-size: 10px; color: rgba(255, 255, 255, 0.4); }
.toast-email { font-size: 11px; color: rgba(255, 255, 255, 0.7); }
.toast-action { display: flex; justify-content: space-between; align-items: center; }
.action-label { font-size: 11px; color: rgba(255, 255, 255, 0.5); }
.action-amount { font-size: 13px; font-weight: 700; }
.action-amount.deposit { color: #4CAF50; }
.action-amount.withdraw { color: #F44336; }
.toast-progress { position: absolute; bottom: 0; left: 0; height: 3px; background: #F6E27A; transition: width 0.05s linear; }

/* ==================== STATS SECTION ==================== */
.stats-section { padding: 0 16px; margin-bottom: 20px; }
.section-title { font-size: 18px; font-weight: 700; color: #F6E27A; margin: 0 0 16px; text-align: center; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.stat-card {
  background: rgba(18, 22, 32, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
}
.stat-card.gold-border { border: 1px solid rgba(212, 175, 55, 0.3); }
.stat-icon { font-size: 24px; color: #F6E27A; margin-bottom: 8px; }
.stat-value { font-size: 20px; font-weight: 700; color: #F6E27A; margin-bottom: 4px; }
.stat-label { font-size: 12px; color: rgba(255, 255, 255, 0.6); }

/* ==================== MODALS (Company, Terms) ==================== */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(13, 16, 23, 0.95); backdrop-filter: blur(8px);
  display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px;
}
.modal-content {
  background: #141924; border-radius: 20px; width: 100%; max-width: 600px;
  max-height: 90vh; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.2);
  display: flex; flex-direction: column; animation: modalIn 0.3s;
}
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.modal-header { background: #0d1017; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.modal-header h3 { font-size: 18px; font-weight: 700; color: #F6E27A; margin: 0; }
.close-btn { background: rgba(255, 255, 255, 0.05); border: none; color: rgba(255, 255, 255, 0.6); width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }

.modal-body { flex: 1; overflow-y: auto; padding: 20px; }
.company-text, .terms-text { color: rgba(255, 255, 255, 0.85); line-height: 1.8; font-size: 14px; }
.company-text p, .terms-text p { margin: 0 0 16px; text-align: justify; }
.terms-text h4 { color: #F6E27A; margin: 20px 0 12px; font-size: 15px; }

.vip-section, .commission-section { margin-top: 24px; }
.vip-section h4, .commission-section h4 { color: #F6E27A; text-align: center; margin: 0 0 16px; font-size: 15px; }
.vip-list, .commission-list { display: flex; flex-direction: column; gap: 8px; }
.vip-item, .comm-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;
}
.vip-level { font-weight: 700; color: #F6E27A; }
.vip-info { display: flex; gap: 16px; font-size: 13px; color: rgba(255, 255, 255, 0.8); }
.comm-item strong { color: #F6E27A; font-size: 18px; }

.salary-table { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; margin: 16px 0; overflow: hidden; }
.table-row { display: grid; grid-template-columns: 1fr 1fr 1fr; padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; text-align: center; }
.table-row .highlight { color: #F6E27A; font-weight: 700; }

.schedule-list { display: flex; flex-direction: column; gap: 8px; }
.schedule-item { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; font-size: 13px; }
.schedule-item .vips { color: #F6E27A; font-weight: 600; }

.vip-features { display: flex; flex-direction: column; gap: 10px; margin: 16px 0; padding: 16px; background: rgba(212, 175, 55, 0.05); border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.1); }
.feature-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #F6E27A; }
.feature-item i { color: #4CAF50; }

.info-note { background: rgba(33, 150, 243, 0.05); border-right: 3px solid #2196F3; border-radius: 10px; padding: 14px; margin: 20px 0; display: flex; align-items: flex-start; gap: 10px; }
.info-note p { margin: 0; color: #64B5F6; font-size: 13px; }

.modal-footer { padding: 16px 20px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
.btn-ok { width: 100%; padding: 14px; background: #F6E27A; color: #0f1419; border: none; border-radius: 50px; font-weight: 700; font-size: 16px; cursor: pointer; }

/* ==================== SIDEBAR ==================== */
.sidebar-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(13, 16, 23, 0.8); backdrop-filter: blur(4px); z-index: 999; }
.sidebar { position: fixed; top: 0; right: 0; width: 280px; height: 100%; background: #141924; border-left: 1px solid rgba(255, 255, 255, 0.06); z-index: 1000; display: flex; flex-direction: column; }
.home-container[dir="rtl"] .sidebar { right: auto; left: 0; border-left: none; border-right: 1px solid rgba(255, 255, 255, 0.06); }

.sidebar-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 18px; font-weight: 700; color: #F6E27A; }
.sidebar-header button { background: none; border: none; color: rgba(255, 255, 255, 0.5); font-size: 20px; cursor: pointer; }
.sidebar-nav { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
.sidebar-nav a { display: flex; align-items: center; gap: 12px; padding: 14px 16px; color: rgba(255, 255, 255, 0.8); text-decoration: none; border-radius: 12px; cursor: pointer; font-size: 15px; }
.sidebar-nav a:hover { background: rgba(255, 255, 255, 0.05); }
.sidebar-footer { padding: 16px 20px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
.sidebar-footer button { width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; color: #F6E27A; font-weight: 600; cursor: pointer; }

.slide-enter-active, .slide-leave-active { transition: all 0.3s; }
.slide-enter-from { transform: translateX(100%); opacity: 0; }
.slide-leave-to { transform: translateX(100%); opacity: 0; }
.home-container[dir="rtl"] .slide-enter-from { transform: translateX(-100%); }
.home-container[dir="rtl"] .slide-leave-to { transform: translateX(-100%); }

/* ==================== RESPONSIVE ==================== */
@media (max-width: 480px) {
  .balance-cards-section { grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 12px; }
  .balance-card { padding: 10px 8px; height: 64px; border-radius: 12px; }
  .card-icon-wrapper { width: 32px; height: 32px; font-size: 13px; }
  .card-title { font-size: 10px; }
  .card-amount { font-size: 13px; }
  .currency-symbol { font-size: 10px; }
  .card-arrow { font-size: 12px; }

  .search-section { padding: 0 12px 12px; }
  .search-box { height: 44px; padding: 4px 4px 4px 12px; border-radius: 12px; }
  .filter-btn { width: 32px; height: 32px; font-size: 12px; }
  .search-box input { font-size: 13px; }
  .search-icon { font-size: 14px; padding: 0 8px 0 4px; }

  .quick-actions { padding: 0 12px; gap: 8px; }
  .action-card { padding: 10px 14px; height: 64px; border-radius: 12px; }
  .action-title { font-size: 13px; }
  .action-subtitle { font-size: 10px; }
  .action-icon { width: 36px; height: 36px; font-size: 16px; }
  .badge-notif { width: 16px; height: 16px; font-size: 9px; }
}
</style>
