export default {
  name: "AppLogout",
  emits: ["reload-devices"],
  data() {
    return {
      showModal: false,
      loading: false,
    };
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async handleConfirm() {
      if (this.loading) return;
      try {
        this.loading = true;
        await window.http.get(`app/logout`);
        showSuccessInfo("Logout success");
        this.$emit("reload-devices");
        this.closeModal();
      } catch (error) {
        if (error.response) {
          showErrorInfo(error.response.data.message);
        } else {
          showErrorInfo(error.message);
        }
      } finally {
        this.loading = false;
      }
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-app)">App</span>
      <div class="card-title">Logout</div>
      <div class="card-desc">Remove your login session in application</div>
    </div>

    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Confirm Logout
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <p class="mb-3">Are you sure you want to logout?</p>
            <div class="msg-box warning">
              <div class="msg-title">Warning</div>
              <p class="text-sm">
                This will end your current WhatsApp session. You will need to scan the QR code again to
                reconnect.
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeModal">Cancel</button>
            <button
              class="btn btn-danger"
              :class="{'btn-loading': loading}"
              @click="handleConfirm"
              :disabled="loading"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
