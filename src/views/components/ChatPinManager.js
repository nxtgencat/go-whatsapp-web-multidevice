import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "ChatPinManager",
  components: { FormRecipient },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      pinned: true,
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
        const payload = { pinned: this.pinned };
        const response = await window.http.post(
          `/chat/${this.phone_id}/pin`,
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
      this.pinned = true;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-chat)">Chat</span>
      <div class="card-title">Pin Chat</div>
      <div class="card-desc">Pin or unpin chats to the top</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Pin Chat
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" :show-status="false" />
              <div class="form-group">
                <label class="toggle-wrap">
                  <span class="toggle-track" :class="{active: pinned}" @click="pinned = !pinned"></span>
                  <span class="toggle-label">{{ pinned ? 'Pin chat' : 'Unpin chat' }}</span>
                </label>
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
              {{ pinned ? ' Pin Chat' : ' Unpin Chat' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
