export default {
  name: "AccountChangePushName",
  data() {
    return { loading: false, push_name: "", showModal: false };
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    isValidForm() {
      return this.push_name.trim() !== "";
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) return;
      try {
        let r = await this.submitApi();
        showSuccessInfo(r);
        this.closeModal();
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async submitApi() {
      this.loading = true;
      try {
        let response = await window.http.post(`/user/pushname`, {
          push_name: this.push_name,
        });
        this.handleReset();
        return response.data.message;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      } finally {
        this.loading = false;
      }
    },
    handleReset() {
      this.push_name = "";
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-account)">Account</span>
      <div class="card-title">Change Push Name</div>
      <div class="card-desc">Update your WhatsApp display name</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Change Push Name
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div class="msg-box info mb-4">
              <p class="text-sm">Your push name is the display name shown to others.</p>
            </div>
            <div class="form-group">
              <label class="form-label">New Push Name</label>
              <input
                type="text"
                v-model="push_name"
                class="form-input"
                placeholder="Enter your new display name"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-primary"
              :class="{'btn-loading': loading}"
              :disabled="!isValidForm() || loading"
              @click.prevent="handleSubmit"
            >
              Update Push Name
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
