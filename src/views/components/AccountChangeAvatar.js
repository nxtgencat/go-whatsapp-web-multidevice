export default {
  name: "AccountChangeAvatar",
  data() {
    return {
      loading: false,
      selected_file: null,
      preview_url: null,
      showModal: false,
    };
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    isValidForm() {
      return this.selected_file !== null;
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
        let payload = new FormData();
        payload.append("avatar", this.$refs.fileAvatar.files[0]);
        let response = await window.http.post(`/user/avatar`, payload);
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
      this.preview_url = null;
      this.selected_file = null;
      if (this.$refs.fileAvatar) this.$refs.fileAvatar.value = "";
    },
    handleImageChange(event) {
      const f = event.target.files[0];
      if (f) {
        this.preview_url = URL.createObjectURL(f);
        this.selected_file = f.name;
      }
    },
  },
  template: `
    <div class="action-card" @click="openModal">
      <span class="card-badge" style="background: var(--cat-account)">Account</span>
      <div class="card-title">Change Avatar</div>
      <div class="card-desc">Update your profile picture</div>
    </div>
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            Change Avatar
            <button class="modal-close" @click="closeModal">Close</button>
          </div>
          <div class="modal-body">
            <div class="msg-box warning mb-4">
              <div class="msg-title">Tip</div>
              <p class="text-sm">Upload a square image (1:1). Best at 400x400px+.</p>
            </div>
            <div class="form-group">
              <input
                type="file"
                ref="fileAvatar"
                class="hidden"
                accept="image/png,image/jpg,image/jpeg"
                @change="handleImageChange"
              />
              <label class="upload-btn" @click="$refs.fileAvatar.click()">Upload image</label>
            </div>
            <div v-if="preview_url" class="form-group">
              <img :src="preview_url" class="preview-image" />
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-primary"
              :class="{'btn-loading': loading}"
              :disabled="!isValidForm() || loading"
              @click.prevent="handleSubmit"
            >
              Update Avatar
            </button>
          </div>
        </div>
      </div>
    </teleport>
  `,
};
