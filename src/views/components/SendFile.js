import FormRecipient from "./generic/FormRecipient.js";

export default {
  name: "SendFile",
  components: { FormRecipient },
  props: { maxFileSize: { type: String, required: true } },
  data() {
    return {
      caption: "",
      type: window.TYPEUSER,
      phone: "",
      loading: false,
      selectedFileName: null,
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
      if (!this.selectedFileName) return false;
      return true;
    },
    async handleSubmit() {
      if (!this.isValidForm() || this.loading) return;
      try {
        let response = await this.submitApi();
        showSuccessInfo(response);
        this.closeModal();
      } catch (err) {
        showErrorInfo(err);
      }
    },
    async submitApi() {
      this.loading = true;
      try {
        let payload = new FormData();
        payload.append("caption", this.caption);
        payload.append("phone", this.phone_id);
        payload.append("is_forwarded", this.is_forwarded);
        if (this.duration && this.duration > 0)
          payload.append("duration", this.duration);
        payload.append("file", this.$refs.fileInput.files[0]);
        let response = await window.http.post(`/send/file`, payload);
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
      this.caption = "";
      this.phone = "";
      this.type = window.TYPEUSER;
      this.selectedFileName = null;
      this.is_forwarded = false;
      this.duration = 0;
      if (this.$refs.fileInput) this.$refs.fileInput.value = "";
    },
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) this.selectedFileName = file.name;
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-send)">Send</span>
      <div class="card-title">Send File</div>
      <div class="card-desc">
        Send any file up to
        <span class="card-tag">{{ maxFileSize }}</span>
      </div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Send File
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <FormRecipient v-model:type="type" v-model:phone="phone" />
              <div class="form-group">
                <label class="form-label">Caption</label>
                <textarea
                  v-model="caption"
                  class="form-textarea"
                  placeholder="Type some caption (optional)..."
                  aria-label="caption"
                ></textarea>
              </div>
              <div class="form-group" v-if="isShowAttributes()">
                <label class="toggle-wrap">
                  <span
                    class="toggle-track"
                    :class="{active: is_forwarded}"
                    @click="is_forwarded = !is_forwarded"
                  ></span>
                  <span class="toggle-label">Mark file as forwarded</span>
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
              <div class="form-group">
                <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" />
                <label class="upload-btn" @click="$refs.fileInput.click()">Upload file</label>
                <div v-if="selectedFileName" class="msg-box info mt-3">{{ selectedFileName }}</div>
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
