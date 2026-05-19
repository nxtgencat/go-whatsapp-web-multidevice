export default {
  name: "AppLogin",
  props: {
    loggedIn: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      login_link: "",
      login_duration_sec: 0,
      countdown_timer: null,
      showModal: false,
    };
  },
  methods: {
    async openModal() {
      try {
        if (this.loggedIn) throw Error("You are already logged in.");
        await this.submitApi();
        this.showModal = true;
      } catch (err) {
        showErrorInfo(err);
      }
    },
    closeModal() {
      this.showModal = false;
      this.stopCountdown();
    },
    async submitApi() {
      try {
        this.stopCountdown();
        let response = await window.http.get(`app/login`);
        let results = response.data.results;
        this.login_link = results.qr_link;
        this.login_duration_sec = results.qr_duration;
        this.startCountdown();
      } catch (error) {
        if (error.response) {
          throw Error(error.response.data.message);
        }
        throw Error(error.message);
      }
    },
    startCountdown() {
      this.stopCountdown();
      this.countdown_timer = setInterval(() => {
        if (this.login_duration_sec > 0) {
          this.login_duration_sec--;
        } else {
          this.autoRefresh();
        }
      }, 1000);
    },
    stopCountdown() {
      if (this.countdown_timer) {
        clearInterval(this.countdown_timer);
        this.countdown_timer = null;
      }
    },
    async autoRefresh() {
      try {
        console.log("QR Code expired, auto refreshing...");
        await this.submitApi();
      } catch (error) {
        console.error("Auto refresh failed:", error);
        this.stopCountdown();
        showErrorInfo(error);
      }
    },
  },
  mounted() {
    // Listen for login success from websocket
    this._loginHandler = () => {
      this.closeModal();
    };
    document.addEventListener("login-success", this._loginHandler);
  },
  beforeUnmount() {
    this.stopCountdown();
    document.removeEventListener("login-success", this._loginHandler);
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-app)">App</span>
      <div class="card-title">Login</div>
      <div class="card-desc">Scan your QR code to access all API capabilities.</div>
    </div>

    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Login WhatsApp
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div class="flex flex-col sm:flex-row gap-6 items-center">
              <div class="flex-shrink-0">
                <img :src="login_link" alt="QR Code" class="qr-image" />
              </div>
              <div>
                <h3 class="font-bold text-lg mb-2">Please scan to connect</h3>
                <p class="text-sm text-gray-600 mb-4">Open Setting &gt; Linked Devices &gt; Link Device</p>
                <div class="text-sm">
                  <em v-if="login_duration_sec > 0">
                    QR expires in {{ login_duration_sec }}s (auto-refreshing)
                  </em>
                  <em v-else>Refreshing QR Code...</em>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="submitApi">Refresh QR</button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
