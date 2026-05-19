import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "ChatDisappearingManager",
  components: { FormRecipient },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      timerSeconds: 86400,
      loading: false,
      showModal: false,
    };
  },
  computed: {
    phone_id() {
      return this.phone + this.type;
    },
    timerLabel() {
      const labels = {
        0: "Off",
        86400: "24 hours",
        604800: "7 days",
        7776000: "90 days",
      };
      return labels[this.timerSeconds] || "Unknown";
    },
  },
  methods: {
    isValidForm() {
      return this.phone.trim().length > 0;
    },
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) return;
      try {
        const r = await this.submitApi();
        showSuccessInfo(r);
        this.closeModal();
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async submitApi() {
      this.loading = true;
      try {
        const payload = { timer_seconds: parseInt(this.timerSeconds) };
        const response = await window.http.post(
          `/chat/${this.phone_id}/disappearing`,
          payload,
        );
        this.handleReset();
        return response.data.message;
      } catch (error) {
        if (error.response?.data?.message)
          throw new Error(error.response.data.message);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    handleReset() {
      this.phone = "";
      this.timerSeconds = 86400;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-chat)">Chat</span>
      <div class="card-title">Disappearing Messages</div>
      <div class="card-desc">Set auto-delete timer for chats</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Disappearing Messages
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" :show-status="false" />
              <div class="form-group">
                <label class="form-label">Timer Duration</label>
                <select class="form-select" v-model="timerSeconds">
                  <option :value="0">Off (disabled)</option>
                  <option :value="86400">24 hours</option>
                  <option :value="604800">7 days</option>
                  <option :value="7776000">90 days</option>
                </select>
              </div>
              <div v-if="timerSeconds > 0" class="msg-box info">
                Messages will disappear after
                <strong>{{ timerLabel }}</strong>
              </div>
              <div v-else class="msg-box warning">
                Disappearing messages will be
                <strong>disabled</strong>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-primary"
              :class="{'btn-loading': loading}"
              :disabled="!isValidForm() || loading"
              @click.prevent="handleSubmit"
            >
              {{ timerSeconds === 0 ? 'Disable Timer' : ' Set Timer' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
