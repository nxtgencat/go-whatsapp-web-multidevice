export default {
  name: "AppReconnect",
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
        await window.http.get(`/app/reconnect`);
        showSuccessInfo("Reconnect success");
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
      <div class="card-title">Reconnect</div>
      <div class="card-desc">Reconnect to WhatsApp service if your API doesn't work or is down.</div>
    </div>

    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Confirm Reconnect
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <p class="mb-3">Are you sure you want to reconnect?</p>
            <div class="msg-box info">
              <div class="msg-title">Info</div>
              <p class="text-sm">
                This will restart the WhatsApp connection. Use this if your API is not responding or
                messages are not being delivered.
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeModal">Cancel</button>
            <button
              class="btn btn-primary"
              :class="{'btn-loading': loading}"
              @click="handleConfirm"
              :disabled="loading"
            >
              Reconnect
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
