import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "SendChatPresence",
  components: { FormRecipient },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      action: "start",
      loading: false,
      showModal: false,
    };
  },
  computed: {
    phone_id() {
      return this.phone + this.type;
    },
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async handleSubmit() {
      if (this.loading) return;
      try {
        let r = await this.submitApi();
        showSuccessInfo(r);
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async submitApi() {
      this.loading = true;
      try {
        let response = await window.http.post(`/send/chat-presence`, {
          phone: this.phone_id,
          action: this.action,
        });
        return response.data.message;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      } finally {
        this.loading = false;
      }
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-send)">Send</span>
      <div class="card-title">Send Chat Presence</div>
      <div class="card-desc">
        Send
        <span class="card-tag">typing</span>
        indicators to specific chat
      </div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Send Chat Presence
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <FormRecipient v-model:type="type" v-model:phone="phone" />
            <div class="form-group">
              <label class="form-label">Action</label>
              <select v-model="action" class="form-select">
                <option value="start">Start Typing</option>
                <option value="stop">Stop Typing</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-primary"
              :class="{'btn-loading': loading}"
              :disabled="loading"
              @click.prevent="handleSubmit"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
