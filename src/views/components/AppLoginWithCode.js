export default {
  name: "AppLoginWithCode",
  props: {
    loggedIn: {
      type: Boolean,
      default: false,
    },
  },
  data: () => {
    return {
      phone: "",
      submitting: false,
      pair_code: null,
      showModal: false,
    };
  },
  methods: {
    async openModal() {
      if (this.loggedIn) {
        showErrorInfo("You are already logged in.");
        return;
      }
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.pair_code = null;
      this.phone = "";
    },
    async handleSubmit() {
      if (this.submitting) return;
      if (this.loggedIn) {
        showErrorInfo("You are already logged in.");
        this.closeModal();
        return;
      }
      if (!this.phone.trim()) {
        showErrorInfo("Phone number is required.");
        return;
      }
      try {
        this.submitting = true;
        const phoneParam = encodeURIComponent(this.phone);
        const { data } = await window.http.get(
          `/app/login-with-code?phone=${phoneParam}`,
        );
        this.pair_code = data.results.pair_code;
      } catch (err) {
        if (err.response) {
          showErrorInfo(err.response.data.message);
        } else {
          showErrorInfo(err.message);
        }
      } finally {
        this.submitting = false;
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
    document.removeEventListener("login-success", this._loginHandler);
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-app)">App</span>
      <div class="card-title">Login with Code</div>
      <div class="card-desc">Enter your pairing code to log in and access your devices.</div>
    </div>

    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Getting Pair Code
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div class="msg-box info mb-4">
              <div class="msg-title">How to pair?</div>
              <ol class="list-decimal list-inside text-sm space-y-1 mt-2">
                <li>Open your WhatsApp</li>
                <li>Link a device</li>
                <li>Link with pair code</li>
              </ol>
            </div>

            <div class="form-group">
              <label class="form-label">Phone</label>
              <input
                type="text"
                v-model="phone"
                class="form-input"
                placeholder="Type your phone number"
                @keyup.enter="handleSubmit"
                :disabled="submitting"
              />
              <small class="text-xs text-gray-500 mt-1 block">Press Enter to submit</small>
            </div>

            <div v-if="pair_code" class="text-center py-6">
              <div class="text-sm font-bold uppercase tracking-wider mb-2">Pair Code</div>
              <div class="text-4xl font-bold tracking-widest" style="font-family: var(--font-heading)">
                {{ pair_code }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeModal">Cancel</button>
            <button
              class="btn btn-primary"
              :class="{'btn-loading': submitting}"
              :disabled="!phone.trim() || submitting"
              @click="handleSubmit"
            >
              Get Code
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
