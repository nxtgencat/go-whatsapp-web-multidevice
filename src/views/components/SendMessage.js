import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "SendMessage",
  components: {
    FormRecipient,
  },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      text: "",
      reply_message_id: "",
      is_forwarded: false,
      mention_everyone: false,
      duration: 0,
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
    isShowReplyId() {
      return this.type !== window.TYPESTATUS;
    },
    isGroup() {
      return this.type === window.TYPEGROUP;
    },
    isValidForm() {
      const isPhoneValid =
        this.type === window.TYPESTATUS || this.phone.trim().length > 0;
      const isMessageValid =
        this.text.trim().length > 0 && this.text.length <= 4096;
      return isPhoneValid && isMessageValid;
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) {
        return;
      }
      try {
        const response = await this.submitApi();
        showSuccessInfo(response);
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
          message: this.text.trim(),
          is_forwarded: this.is_forwarded,
        };
        if (this.reply_message_id !== "") {
          payload.reply_message_id = this.reply_message_id;
        }
        if (this.duration && this.duration > 0) {
          payload.duration = this.duration;
        }
        if (this.mention_everyone && this.type === window.TYPEGROUP) {
          payload.mentions = ["@everyone"];
        }

        const response = await window.http.post("/send/message", payload);
        this.handleReset();
        return response.data.message;
      } catch (error) {
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },
    handleReset() {
      this.phone = "";
      this.text = "";
      this.reply_message_id = "";
      this.is_forwarded = false;
      this.mention_everyone = false;
      this.duration = 0;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-send)">Send</span>
      <div class="card-title">Send Message</div>
      <div class="card-desc">Send any message to user or group</div>
    </div>

    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Send Message
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
                  placeholder="Optional: message ID to reply to"
                  aria-label="reply_message_id"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Message</label>
                <textarea
                  v-model="text"
                  class="form-textarea"
                  placeholder="Hello this is message text"
                  aria-label="message"
                ></textarea>
              </div>
              <div class="form-group" v-if="isShowReplyId()">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: is_forwarded}"
                    @click="is_forwarded = !is_forwarded"
                  ></span>
                  <span class="toggle-label">Mark message as forwarded</span>
                </label>
              </div>
              <div class="form-group" v-if="isGroup()">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: mention_everyone}"
                    @click="mention_everyone = !mention_everyone"
                  ></span>
                  <span class="toggle-label">Mention all group participants (@everyone)</span>
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
