import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "UpdateMessage",
  components: { FormRecipient },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      message_id: "",
      new_message: "",
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
    isValidForm() {
      if (this.type !== window.TYPESTATUS && !this.phone.trim()) return false;
      if (!this.message_id.trim() || !this.new_message.trim()) return false;
      return true;
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
        const payload = { phone: this.phone_id, message: this.new_message };
        let response = await window.http.post(
          `/message/${this.message_id}/update`,
          payload,
        );
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
      this.type = window.TYPEUSER;
      this.phone = "";
      this.message_id = "";
      this.new_message = "";
      this.loading = false;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-message)">Message</span>
      <div class="card-title">Update Message</div>
      <div class="card-desc">Update your sent message</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Update Message
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" />
              <div class="form-group">
                <label class="form-label">Message ID</label>
                <input
                  v-model="message_id"
                  type="text"
                  class="form-input"
                  placeholder="Enter message id"
                  aria-label="message id"
                />
              </div>
              <div class="form-group">
                <label class="form-label">New Message</label>
                <textarea
                  v-model="new_message"
                  class="form-textarea"
                  placeholder="New message text (editable within 15 min)"
                  aria-label="message"
                ></textarea>
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
              Update
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
