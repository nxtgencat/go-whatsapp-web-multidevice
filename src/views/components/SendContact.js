import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "SendContact",
  components: { FormRecipient },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      card_name: "",
      card_phone: "",
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
    isShowAttributes() {
      return this.type !== window.TYPESTATUS;
    },
    isValidForm() {
      if (this.type !== window.TYPESTATUS && !this.phone.trim()) return false;
      if (!this.card_name.trim() || !this.card_phone.trim()) return false;
      return true;
    },
    async handleSubmit() {
      try {
        let r = await this.submitApi();
        showSuccessInfo(r);
        this.closeModal();
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async submitApi() {
      if (!this.isValidForm()) return;
      this.loading = true;
      try {
        const payload = {
          phone: this.phone_id,
          contact_name: this.card_name,
          contact_phone: this.card_phone,
          is_forwarded: this.is_forwarded,
          ...(this.duration && this.duration > 0
            ? { duration: this.duration }
            : {}),
        };
        let response = await window.http.post(`/send/contact`, payload);
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
      this.phone = "";
      this.card_name = "";
      this.card_phone = "";
      this.type = window.TYPEUSER;
      this.is_forwarded = false;
      this.duration = 0;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-send)">Send</span>
      <div class="card-title">Send Contact</div>
      <div class="card-desc">Send contact to user or group</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Send Contact
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" />
              <div class="form-group">
                <label class="form-label">Contact Name</label>
                <input
                  v-model="card_name"
                  type="text"
                  class="form-input"
                  placeholder="Enter contact name"
                  aria-label="contact name"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Phone</label>
                <input
                  v-model="card_phone"
                  type="text"
                  class="form-input"
                  placeholder="Enter contact phone"
                  aria-label="contact phone"
                />
              </div>
              <div class="form-group" v-if="isShowAttributes()">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: is_forwarded}"
                    @click="is_forwarded = !is_forwarded"
                  ></span>
                  <span class="toggle-label">Mark contact as forwarded</span>
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
