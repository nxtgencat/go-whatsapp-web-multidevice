import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "AccountUserCheck",
  components: { FormRecipient },
  data() {
    return {
      type: window.TYPEUSER,
      phone: "",
      isOnWhatsApp: null,
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
      this.handleReset();
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    isValidForm() {
      return this.phone.trim() !== "";
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) return;
      try {
        await this.submitApi();
        showSuccessInfo("Check completed");
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async submitApi() {
      this.loading = true;
      try {
        let response = await window.http.get(
          `/user/check?phone=${this.phone_id}`,
        );
        this.isOnWhatsApp = response.data.results.is_on_whatsapp;
      } catch (error) {
        if (error.response) throw new Error(error.response.data.message);
        throw new Error(error.message);
      } finally {
        this.loading = false;
      }
    },
    handleReset() {
      this.phone = "";
      this.isOnWhatsApp = null;
      this.type = window.TYPEUSER;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-account)">Account</span>
      <div class="card-title">User Check</div>
      <div class="card-desc">Check if a user is on WhatsApp</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Check User
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <FormRecipient v-model:type="type" v-model:phone="phone" />
            <button
              type="button"
              class="btn btn-primary"
              :class="{'btn-loading': loading}"
              :disabled="!isValidForm() || loading"
              @click.prevent="handleSubmit"
            >
              Check
            </button>
            <div
              v-if="isOnWhatsApp !== null"
              class="mt-4"
              :class="isOnWhatsApp ? 'msg-box success' : 'msg-box error'"
            >
              <div class="msg-title">
                {{ isOnWhatsApp ? ' User is on WhatsApp' : 'X User is NOT on WhatsApp' }}
              </div>
              <p class="text-sm">Phone: {{ phone_id }}</p>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
