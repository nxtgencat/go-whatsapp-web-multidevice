import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "SendLink",
  components: { FormRecipient },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      link: "",
      caption: "",
      reply_message_id: "",
      loading: false,
      is_forwarded: false,
      duration: 0,
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
    isShowReplyId() {
      return this.type !== window.TYPESTATUS;
    },
    isValidForm() {
      const p = this.type === window.TYPESTATUS || this.phone.trim().length > 0;
      const l = this.link.trim().length > 0 && this.link.length <= 4096;
      const c = this.caption.trim().length > 0 && this.caption.length <= 4096;
      return p && l && c;
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
        const payload = {
          phone: this.phone_id,
          link: this.link.trim(),
          caption: this.caption.trim(),
          is_forwarded: this.is_forwarded,
          ...(this.duration && this.duration > 0
            ? { duration: this.duration }
            : {}),
        };
        if (this.reply_message_id !== "")
          payload.reply_message_id = this.reply_message_id;
        const response = await window.http.post("/send/link", payload);
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
      this.link = "";
      this.caption = "";
      this.reply_message_id = "";
      this.is_forwarded = false;
      this.duration = 0;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-send)">Send</span>
      <div class="card-title">Send Link</div>
      <div class="card-desc">Send link to user or group</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Send Link
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" :show-status="true" />
              <div class="form-group" v-if="isShowReplyId()">
                <label class="form-label">Reply Message ID</label>
                <input
                  v-model="reply_message_id"
                  type="text"
                  class="form-input"
                  placeholder="Optional: message ID"
                  aria-label="reply_message_id"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Link</label>
                <input
                  v-model="link"
                  type="text"
                  class="form-input"
                  placeholder="https://www.google.com"
                  aria-label="link"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Caption</label>
                <textarea
                  v-model="caption"
                  class="form-textarea"
                  placeholder="Hello this is caption"
                  aria-label="caption"
                ></textarea>
              </div>
              <div class="form-group" v-if="isShowReplyId()">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: is_forwarded}"
                    @click="is_forwarded = !is_forwarded"
                  ></span>
                  <span class="toggle-label">Mark link as forwarded</span>
                </label>
              </div>
              <div class="form-group">
                <label class="form-label">Disappearing Duration (seconds)</label>
                <input
                  v-model.number="duration"
                  type="number"
                  min="0"
                  class="form-input"
                  placeholder="0 (no expiry)"
                  aria-label="duration"
                />
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
              Send
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
